// Importa i servizi reali invece di quelli fittizi
import { PlantIdService, EPPOService, MockPlantService, CombinedPlantAnalysisService } from './aiProviders';
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

// Servizio per la cache (usando solo memoria, non localStorage)
export class CacheService {
  private static cache = new Map<string, any>();
  private static readonly CACHE_DURATION = 1000 * 60 * 30; // 30 minuti

  static generateImageHash(imageData: string): string {
    // Genera un hash semplice dell'immagine per la cache
    let hash = 0;
    const shortData = imageData.substring(0, Math.min(1000, imageData.length)); // Usa solo primi 1000 caratteri per performance
    for (let i = 0; i < shortData.length; i++) {
      const char = shortData.charCodeAt(i);
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

// Servizio per il rilevamento malattie basato su AI locale/regole
export class LocalDiseaseDetectionService {
  private static readonly diseasePatterns = {
    'funghi': {
      keywords: ['macchie', 'muffa', 'bianco', 'grigio', 'marciume'],
      diseases: [
        {
          disease: 'Oidio (Mal bianco)',
          confidence: 0.7,
          symptoms: ['Macchie bianche polverose su foglie', 'Deformazione delle foglie', 'Crescita stentata'],
          treatments: ['Fungicida a base di zolfo', 'Migliorare aerazione', 'Ridurre umidità', 'Rimuovere parti colpite'],
          severity: 'medium' as const
        },
        {
          disease: 'Botrytis (Muffa grigia)',
          confidence: 0.65,
          symptoms: ['Muffa grigia su fiori e foglie', 'Marciume molle', 'Macchie brune'],
          treatments: ['Fungicida specifico', 'Ridurre umidità', 'Migliorare ventilazione', 'Rimuovere materiale infetto'],
          severity: 'high' as const
        }
      ]
    },
    'parassiti': {
      keywords: ['punti', 'buchi', 'insetti', 'afidi', 'cocciniglia'],
      diseases: [
        {
          disease: 'Attacco di Afidi',
          confidence: 0.8,
          symptoms: ['Piccoli insetti verdi o neri', 'Foglie appiccicose', 'Deformazione delle foglie'],
          treatments: ['Insetticida naturale', 'Sapone di Marsiglia', 'Olio di neem', 'Introdurre predatori naturali'],
          severity: 'medium' as const
        },
        {
          disease: 'Cocciniglia',
          confidence: 0.75,
          symptoms: ['Piccoli scudi bianchi o marroni', 'Sostanze appiccicose', 'Ingiallimento foglie'],
          treatments: ['Alcool denaturato', 'Olio bianco', 'Rimozione manuale', 'Insetticida sistemico'],
          severity: 'medium' as const
        }
      ]
    },
    'carenze': {
      keywords: ['giallo', 'scolorito', 'secco', 'bruciato'],
      diseases: [
        {
          disease: 'Carenza di Azoto',
          confidence: 0.6,
          symptoms: ['Ingiallimento foglie vecchie', 'Crescita lenta', 'Foglie piccole'],
          treatments: ['Fertilizzante ricco di azoto', 'Compost maturo', 'Letame ben decomposto'],
          severity: 'low' as const
        },
        {
          disease: 'Stress idrico',
          confidence: 0.7,
          symptoms: ['Foglie appassite', 'Bordi secchi', 'Caduta prematura foglie'],
          treatments: ['Regolare irrigazione', 'Pacciamatura', 'Ombreggiatura temporanea'],
          severity: 'medium' as const
        }
      ]
    }
  };

  static async detectDisease(
    plantName: string, 
    symptoms?: string[]
  ): Promise<DiseaseDetectionResult[]> {
    
    // Simula un'analisi basata su sintomi e tipo di pianta
    await new Promise(resolve => setTimeout(resolve, 800)); // Simula processing
    
    const detectedDiseases: DiseaseDetectionResult[] = [];
    
    // Analisi basata sul nome della pianta
    if (plantName.toLowerCase().includes('rosa')) {
      detectedDiseases.push({
        disease: 'Macchia nera della rosa',
        confidence: 0.75,
        symptoms: ['Macchie nere circolari su foglie', 'Ingiallimento foglie', 'Caduta prematura'],
        treatments: ['Fungicida specifico per rose', 'Rimozione foglie colpite', 'Migliorare aerazione'],
        severity: 'medium',
        provider: 'local-ai'
      });
    } else if (plantName.toLowerCase().includes('basilico')) {
      detectedDiseases.push({
        disease: 'Peronospora del basilico',
        confidence: 0.70,
        symptoms: ['Macchie gialle su foglie', 'Muffa bianca sotto le foglie', 'Appassimento'],
        treatments: ['Fungicida biologico', 'Ridurre umidità', 'Spaziare le piante'],
        severity: 'high',
        provider: 'local-ai'
      });
    } else if (plantName.toLowerCase().includes('geranio')) {
      detectedDiseases.push({
        disease: 'Ruggine del geranio',
        confidence: 0.68,
        symptoms: ['Pustole arancioni sotto foglie', 'Macchie gialle sopra', 'Caduta foglie'],
        treatments: ['Fungicida a base di rame', 'Rimozione foglie colpite', 'Evitare bagnatura foglie'],
        severity: 'medium',
        provider: 'local-ai'
      });
    }
    
    // Se non ci sono malattie specifiche, aggiungi controlli generici
    if (detectedDiseases.length === 0) {
      // Simula controlli preventivi comuni
      const commonChecks = [
        {
          disease: 'Controllo preventivo generale',
          confidence: 0.5,
          symptoms: ['Nessun sintomo evidente rilevato'],
          treatments: [
            'Monitoraggio regolare della pianta',
            'Mantenere buona igiene del giardino',
            'Irrigazione corretta',
            'Fertilizzazione equilibrata'
          ],
          severity: 'low' as const,
          provider: 'local-ai'
        }
      ];
      
      detectedDiseases.push(...commonChecks);
    }
    
    return detectedDiseases;
  }

  // Analisi più sofisticata basata su pattern di sintomi
  static analyzeSymptoms(symptoms: string[]): DiseaseDetectionResult[] {
    const results: DiseaseDetectionResult[] = [];
    
    for (const [category, data] of Object.entries(this.diseasePatterns)) {
      const matchScore = this.calculateSymptomMatch(symptoms, data.keywords);
      
      if (matchScore > 0.3) {
        data.diseases.forEach(disease => {
          results.push({
            ...disease,
            confidence: disease.confidence * matchScore,
            provider: 'pattern-matching'
          });
        });
      }
    }
    
    return results.sort((a, b) => b.confidence - a.confidence);
  }
  
  private static calculateSymptomMatch(symptoms: string[], keywords: string[]): number {
    if (!symptoms || symptoms.length === 0) return 0.1;
    
    let matches = 0;
    const symptomText = symptoms.join(' ').toLowerCase();
    
    keywords.forEach(keyword => {
      if (symptomText.includes(keyword)) {
        matches++;
      }
    });
    
    return Math.min(1, matches / keywords.length * 2); // Boost del 2x per match
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
      updateProgress('cache-check', 20, 'Controllo cache...');
      const cacheKey = CacheService.generateImageHash(processedImage.processedImage);
      const cachedResult = await CacheService.get<CombinedAnalysisResult>(cacheKey);
      
      if (cachedResult) {
        updateProgress('cache-hit', 100, 'Risultato trovato in cache');
        return cachedResult;
      }
      
      // 3. Identificazione pianta usando il servizio combinato esistente
      updateProgress('plant-identification', 40, 'Identificazione pianta...');
      const plantResult = await CombinedPlantAnalysisService.analyzePlant(
        processedImage.processedImage,
        (progress) => updateProgress('plant-id', 40 + progress.percentage * 0.3, progress.message)
      );
      
      // 4. Rilevamento malattie
      updateProgress('disease-detection', 70, 'Rilevamento malattie...');
      const diseaseResults = await this.performDiseaseDetection(
        plantResult.consensus.mostLikelyPlant,
        updateProgress
      );
      
      // 5. Calcolo consensus finale
      updateProgress('final-consensus', 90, 'Calcolo risultati finali...');
      const finalConsensus = this.calculateEnhancedConsensus(
        plantResult.plantIdentification,
        diseaseResults
      );
      
      const finalResult: CombinedAnalysisResult = {
        plantIdentification: plantResult.plantIdentification,
        diseaseDetection: diseaseResults,
        consensus: finalConsensus
      };

      // 6. Salva in cache
      CacheService.set(cacheKey, finalResult);
      
      updateProgress('complete', 100, 'Analisi completata con successo');
      return finalResult;
      
    } catch (error) {
      console.error('Enhanced analysis failed:', error);
      
      // Risultato di fallback migliorato
      const fallbackPlant = await MockPlantService.identifyPlant(imageData);
      const fallbackDiseases = await LocalDiseaseDetectionService.detectDisease(fallbackPlant.plantName);
      
      return {
        plantIdentification: [fallbackPlant],
        diseaseDetection: fallbackDiseases,
        consensus: {
          mostLikelyPlant: fallbackPlant,
          mostLikelyDisease: fallbackDiseases[0],
          confidenceScore: (fallbackPlant.confidence + (fallbackDiseases[0]?.confidence || 0)) / 2
        }
      };
    }
  }
  
  private static async performDiseaseDetection(
    identifiedPlant: PlantIdentificationResult,
    updateProgress: (stage: string, percentage: number, message: string) => void
  ): Promise<DiseaseDetectionResult[]> {
    
    updateProgress('disease-analysis', 75, 'Analisi malattie per ' + identifiedPlant.plantName);
    
    // Usa il servizio locale per rilevamento malattie
    const localDiseases = await LocalDiseaseDetectionService.detectDisease(
      identifiedPlant.plantName,
      identifiedPlant.commonDiseases
    );
    
    // Se la pianta identificata ha malattie note, analizzale
    if (identifiedPlant.commonDiseases && identifiedPlant.commonDiseases.length > 0) {
      updateProgress('disease-pattern', 80, 'Analisi pattern sintomi...');
      const patternDiseases = LocalDiseaseDetectionService.analyzeSymptoms(
        identifiedPlant.commonDiseases
      );
      
      // Combina i risultati evitando duplicati
      const allDiseases = [...localDiseases];
      patternDiseases.forEach(disease => {
        if (!localDiseases.find(d => d.disease === disease.disease)) {
          allDiseases.push(disease);
        }
      });
      
      return allDiseases.sort((a, b) => b.confidence - a.confidence);
    }
    
    return localDiseases;
  }

  private static calculateEnhancedConsensus(
    identifications: PlantIdentificationResult[],
    diseases: DiseaseDetectionResult[]
  ) {
    // Trova l'identificazione con maggiore confidenza
    const mostLikelyPlant = identifications.reduce((best, current) => {
      return current.confidence > best.confidence ? current : best;
    }, identifications[0] || {
      plantName: 'Identificazione non disponibile',
      scientificName: '',
      confidence: 0,
      provider: 'plantnet'
    } as PlantIdentificationResult);

    // Trova la malattia più probabile
    const mostLikelyDisease = diseases.length > 0 
      ? diseases.reduce((best, current) => {
          return current.confidence > best.confidence ? current : best;
        })
      : undefined;

    // Calcola un punteggio di confidenza complessivo migliorato
    const avgPlantConfidence = identifications.length > 0
      ? identifications.reduce((sum, id) => sum + id.confidence, 0) / identifications.length
      : 0;

    const avgDiseaseConfidence = diseases.length > 0
      ? diseases.reduce((sum, disease) => sum + disease.confidence, 0) / diseases.length
      : 0;

    // Peso maggiore all'identificazione della pianta
    const confidenceScore = avgPlantConfidence * 0.7 + avgDiseaseConfidence * 0.3;

    return {
      mostLikelyPlant,
      mostLikelyDisease,
      confidenceScore: Math.round(confidenceScore * 100) / 100 // Arrotonda a 2 decimali
    };
  }

  // Metodo per analisi diretta da file
  static async analyzeImageFile(
    imageFile: File,
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<CombinedAnalysisResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const imageData = event.target?.result as string;
          const result = await this.analyzeImage(imageData, onProgress);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Errore nella lettura del file immagine'));
      reader.readAsDataURL(imageFile);
    });
  }

  // Metodo per pulire la cache
  static clearCache(): void {
    CacheService.clear();
  }

  // Metodo per ottenere statistiche della cache
  static getCacheStats(): { size: number; duration: number } {
    return {
      size: CacheService['cache'].size,
      duration: CacheService['CACHE_DURATION']
    };
  }
}
