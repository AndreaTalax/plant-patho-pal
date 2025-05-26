
import { RougenAIService, PlantDiseasesAIService, PlexiAIService } from './aiProviders';
import type { 
  PlantIdentificationResult, 
  DiseaseDetectionResult, 
  AnalysisProgress, 
  CombinedAnalysisResult 
} from './aiProviders';

// Servizio per l'elaborazione delle immagini
export class ImageProcessingService {
  static async processImage(imageData: string): Promise<{ processedImage: string; metadata: any }> {
    try {
      // Conversione e ottimizzazione dell'immagine
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      return new Promise((resolve) => {
        img.onload = () => {
          // Ridimensiona se necessario (max 1024x1024)
          const maxSize = 1024;
          let { width, height } = img;
          
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height * maxSize) / width;
              width = maxSize;
            } else {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          
          const processedImage = canvas.toDataURL('image/jpeg', 0.8);
          
          resolve({
            processedImage,
            metadata: {
              originalSize: { width: img.naturalWidth, height: img.naturalHeight },
              processedSize: { width, height },
              compression: 0.8
            }
          });
        };
        
        img.src = imageData;
      });
    } catch (error) {
      console.error('Image processing failed:', error);
      return { processedImage: imageData, metadata: {} };
    }
  }
}

// Servizio per la cache
export class CacheService {
  private static cache = new Map<string, any>();
  private static readonly CACHE_DURATION = 1000 * 60 * 30; // 30 minuti

  static generateImageHash(imageData: string): string {
    // Genera un hash semplice dell'immagine per la cache
    let hash = 0;
    for (let i = 0; i < imageData.length; i++) {
      const char = imageData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Converte a 32bit integer
    }
    return hash.toString();
  }

  static async get<T>(key: string): Promise<T | null> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  static set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  static clear(): void {
    this.cache.clear();
  }
}

export class EnhancedPlantAnalysisService {
  static async analyzeImage(
    imageData: string, 
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<CombinedAnalysisResult> {
    
    const updateProgress = (stage: string, percentage: number, message: string) => {
      onProgress?.({ stage, percentage, message });
    };

    try {
      // 1. Pre-elaborazione immagine
      updateProgress('preprocessing', 10, 'Elaborazione immagine...');
      const processedImage = await ImageProcessingService.processImage(imageData);
      
      // 2. Controllo cache
      updateProgress('cache', 20, 'Controllo cache...');
      const cacheKey = CacheService.generateImageHash(processedImage.processedImage);
      const cachedResult = await CacheService.get<CombinedAnalysisResult>(cacheKey);
      
      if (cachedResult) {
        updateProgress('complete', 100, 'Risultato dalla cache');
        return cachedResult;
      }
      
      // 3. Analisi parallela con tutte le AI
      updateProgress('analysis', 30, 'Avvio analisi con multiple AI...');
      const results = await this.performParallelAnalysis(processedImage.processedImage, updateProgress);
      
      // 4. Calcolo consensus tra le diverse AI
      updateProgress('consensus', 80, 'Calcolo consensus...');
      const consensus = this.calculateConsensus(results);
      
      const finalResult: CombinedAnalysisResult = {
        plantIdentification: results.identifications,
        diseaseDetection: results.diseases,
        consensus
      };

      // 5. Salva in cache
      CacheService.set(cacheKey, finalResult);
      
      updateProgress('complete', 100, 'Analisi completata');
      return finalResult;
      
    } catch (error) {
      console.error('Enhanced analysis failed:', error);
      
      // Risultato di fallback
      return {
        plantIdentification: [],
        diseaseDetection: [],
        consensus: {
          mostLikelyPlant: {
            plantName: 'Analisi non riuscita',
            scientificName: '',
            confidence: 0,
            provider: 'plexi'
          },
          confidenceScore: 0
        }
      };
    }
  }
  
  private static async performParallelAnalysis(
    imageData: string, 
    updateProgress: (stage: string, percentage: number, message: string) => void
  ) {
    // Esegue Rougen AI, Plant Diseases AI e Plexi AI in parallelo
    updateProgress('parallel', 40, 'Analisi con Rougen AI...');
    const rougenPromise = RougenAIService.identifyPlant(imageData);
    
    updateProgress('parallel', 50, 'Analisi con Plant Diseases AI...');
    const diseasePromise = PlantDiseasesAIService.detectDisease(imageData);
    
    updateProgress('parallel', 60, 'Analisi con Plexi AI...');
    const plexiPromise = PlexiAIService.analyzePlant(imageData);
    
    const results = await Promise.allSettled([rougenPromise, diseasePromise, plexiPromise]);
    
    updateProgress('parallel', 70, 'Raccolta risultati...');
    
    const identifications: PlantIdentificationResult[] = [];
    const diseases: DiseaseDetectionResult[] = [];
    
    // Processa i risultati di Rougen AI
    if (results[0].status === 'fulfilled') {
      identifications.push(results[0].value);
    }
    
    // Processa i risultati di Plant Diseases AI
    if (results[1].status === 'fulfilled') {
      diseases.push(results[1].value);
    }
    
    // Processa i risultati di Plexi AI
    if (results[2].status === 'fulfilled') {
      const plexiResult = results[2].value;
      identifications.push(plexiResult);
      if (plexiResult.diseaseInfo) {
        diseases.push(plexiResult.diseaseInfo);
      }
    }
    
    return { identifications, diseases };
  }

  private static calculateConsensus(results: { 
    identifications: PlantIdentificationResult[]; 
    diseases: DiseaseDetectionResult[]; 
  }) {
    // Trova l'identificazione con maggiore confidenza
    const mostLikelyPlant = results.identifications.reduce((best, current) => {
      return current.confidence > best.confidence ? current : best;
    }, results.identifications[0] || {
      plantName: 'Nessuna identificazione',
      scientificName: '',
      confidence: 0,
      provider: 'plexi'
    } as PlantIdentificationResult);

    // Trova la malattia più probabile
    const mostLikelyDisease = results.diseases.length > 0 
      ? results.diseases.reduce((best, current) => {
          return current.confidence > best.confidence ? current : best;
        })
      : undefined;

    // Calcola un punteggio di confidenza complessivo
    const avgPlantConfidence = results.identifications.length > 0
      ? results.identifications.reduce((sum, id) => sum + id.confidence, 0) / results.identifications.length
      : 0;

    const avgDiseaseConfidence = results.diseases.length > 0
      ? results.diseases.reduce((sum, disease) => sum + disease.confidence, 0) / results.diseases.length
      : 0;

    const confidenceScore = (avgPlantConfidence + avgDiseaseConfidence) / 2;

    return {
      mostLikelyPlant,
      mostLikelyDisease,
      confidenceScore
    };
  }
}
