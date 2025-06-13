import { PlantIdService, EPPOService, MockPlantService, type PlantIdentificationResult, type DiseaseDetectionResult } from './aiProviders';
import { ImageProcessingService, type ProcessedImage } from './imageProcessingService';
import { CacheService } from './cacheService';
import { EppoService, type EppoSearchResult } from './eppoService';
import { toast } from "@/components/ui/sonner";
import { type CombinedAnalysisResult } from '@/types/analysis';

export type { CombinedAnalysisResult } from '@/types/analysis';

export interface AnalysisProgress {
  step: string;
  progress: number;
  message: string;
}

export interface EnhancedAnalysisResult extends CombinedAnalysisResult {
  eppoData?: {
    plantMatch?: EppoSearchResult;
    diseaseMatches?: EppoSearchResult[];
    recommendations?: {
      diseases: EppoSearchResult[];
      pests: EppoSearchResult[];
      careAdvice: string[];
    };
  };
  userSymptoms?: any;
  userProfile?: any;
  analysisMetadata?: {
    timestamp: string;
    totalProcessingTime: number;
    aiProvidersUsed: string[];
    confidenceScore: number;
  };
}

export class EnhancedPlantAnalysisService {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000;
  
  static async analyzeImage(
    imageBase64: string, 
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<CombinedAnalysisResult> {
    
    const startTime = Date.now();
    const updateProgress = (step: string, progress: number, message: string) => {
      onProgress?.({ step, progress, message });
    };
    
    try {
      updateProgress('preprocessing', 10, 'Elaborazione immagine in corso...');
      
      const processedImage = await this.withRetry(
        () => ImageProcessingService.processImage(imageBase64),
        'Errore durante l\'elaborazione dell\'immagine'
      );
      
      const cacheKey = CacheService.generateImageHash(processedImage.processedImage);
      const cachedResult = await CacheService.get<CombinedAnalysisResult>(cacheKey);
      
      if (cachedResult) {
        updateProgress('complete', 100, 'Risultati recuperati dalla cache');
        toast.success('Risultati recuperati dalla cache locale');
        return {
          ...cachedResult,
          analysisMetadata: {
            ...cachedResult.analysisMetadata,
            timestamp: new Date().toISOString(),
            totalProcessingTime: 0,
            aiProvidersUsed: ['cache'],
            confidenceScore: cachedResult.consensus.overallConfidence
          }
        };
      }
      
      updateProgress('analysis', 25, 'Invio alle AI per l\'analisi...');
      
      const results = await this.performParallelAnalysis(
        processedImage.processedImage, 
        updateProgress
      );
      
      updateProgress('eppo', 75, 'Consultazione database EPPO...');
      
      const eppoData = await this.enhanceWithEppoData(results, updateProgress);
      
      updateProgress('consensus', 85, 'Elaborazione consensus...');
      
      const consensus = this.calculateEnhancedConsensus(results, eppoData);
      
      const totalProcessingTime = Date.now() - startTime;
      const aiProvidersUsed = this.getUsedProviders(results);
      
      const finalResult: CombinedAnalysisResult = {
        plantIdentification: results.identifications,
        diseaseDetection: results.diseases,
        consensus,
        eppoData,
        analysisMetadata: {
          timestamp: new Date().toISOString(),
          totalProcessingTime,
          aiProvidersUsed,
          confidenceScore: consensus.overallConfidence
        }
      };
      
      await CacheService.set(cacheKey, finalResult);
      
      updateProgress('complete', 100, 'Analisi completata con successo');
      
      return finalResult;
      
    } catch (error) {
      console.error('Enhanced analysis error:', error);
      toast.error('Errore durante l\'analisi. Utilizzo dati di fallback.');
      
      return this.generateFallbackResult();
    }
  }
  
  private static getUsedProviders(results: { identifications: PlantIdentificationResult[]; diseases: DiseaseDetectionResult[] }): string[] {
    const providers = new Set<string>();
    
    results.identifications.forEach(id => providers.add(id.provider));
    results.diseases.forEach(disease => providers.add(disease.provider));
    
    return Array.from(providers);
  }
  
  private static async enhanceWithEppoData(
    results: { identifications: PlantIdentificationResult[]; diseases: DiseaseDetectionResult[] },
    updateProgress: (step: string, progress: number, message: string) => void
  ) {
    try {
      const topPlant = results.identifications[0];
      if (!topPlant) return undefined;
      
      updateProgress('eppo', 76, 'Ricerca pianta nel database EPPO...');
      
      const plantIdentification = await EppoService.identifyPlant(topPlant.plantName);
      
      updateProgress('eppo', 78, 'Ricerca malattie correlate...');
      
      const diseaseSymptoms = results.diseases.flatMap(d => d.symptoms);
      const diseaseMatches = await EppoService.searchDiseasesBySymptoms(diseaseSymptoms);
      
      updateProgress('eppo', 80, 'Generazione raccomandazioni...');
      
      const recommendations = await EppoService.getPlantRecommendations(topPlant.plantName);
      
      return {
        plantMatch: plantIdentification.plant,
        diseaseMatches,
        recommendations
      };
    } catch (error) {
      console.warn('EPPO enhancement failed:', error);
      return undefined;
    }
  }
  
  private static calculateEnhancedConsensus(
    results: { identifications: PlantIdentificationResult[]; diseases: DiseaseDetectionResult[] },
    eppoData?: any
  ) {
    const mostLikelyPlant = results.identifications.reduce((prev, current) => 
      current.confidence > prev.confidence ? current : prev
    );
    
    if (eppoData?.plantMatch) {
      mostLikelyPlant.confidence = Math.min(95, mostLikelyPlant.confidence + 10);
      mostLikelyPlant.scientificName = eppoData.plantMatch.fullname || mostLikelyPlant.scientificName;
    }
    
    const mostLikelyDisease = results.diseases.length > 0 
      ? results.diseases.reduce((prev, current) => 
          current.confidence > prev.confidence ? current : prev
        )
      : undefined;
    
    if (mostLikelyDisease && eppoData?.diseaseMatches?.length > 0) {
      mostLikelyDisease.confidence = Math.min(90, mostLikelyDisease.confidence + 5);
    }
    
    const avgPlantConfidence = results.identifications.reduce((sum, item) => 
      sum + item.confidence, 0) / results.identifications.length;
    
    const avgDiseaseConfidence = results.diseases.length > 0 
      ? results.diseases.reduce((sum, item) => sum + item.confidence, 0) / results.diseases.length
      : 0;
    
    const overallConfidence = (avgPlantConfidence + avgDiseaseConfidence) / 2;
    
    return {
      mostLikelyPlant,
      mostLikelyDisease,
      overallConfidence: Math.round(overallConfidence)
    };
  }
  
  private static async performParallelAnalysis(
    imageData: string, 
    updateProgress: (step: string, progress: number, message: string) => void
  ) {
    const identifications: PlantIdentificationResult[] = [];
    const diseases: DiseaseDetectionResult[] = [];
    
    const promises = [
      this.safeAPICall(
        () => PlantIdService.identifyPlant(imageData),
        'Plant.ID'
      ),
      this.safeAPICall(
        () => EPPOService.identifyPlant(imageData),
        'EPPO'
      ),
      this.safeAPICall(
        () => MockPlantService.identifyPlant(imageData),
        'Mock Service'
      )
    ];
    
    updateProgress('analysis', 30, 'Plant.ID in elaborazione...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    updateProgress('analysis', 50, 'EPPO in elaborazione...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    updateProgress('analysis', 70, 'Mock Service in elaborazione...');
    
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        identifications.push(result.value as PlantIdentificationResult);
      }
    });
    
    return { identifications, diseases };
  }
  
  private static async safeAPICall<T>(
    apiCall: () => Promise<T>,
    providerName: string
  ): Promise<T | null> {
    try {
      return await this.withRetry(apiCall, `Errore ${providerName}`);
    } catch (error) {
      console.warn(`${providerName} failed:`, error);
      toast.warning(`${providerName} non disponibile, continuando con altri provider`);
      return null;
    }
  }
  
  private static async withRetry<T>(
    fn: () => Promise<T>, 
    errorMessage: string
  ): Promise<T> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === this.MAX_RETRIES) {
          throw new Error(`${errorMessage} dopo ${this.MAX_RETRIES} tentativi`);
        }
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt));
      }
    }
    throw new Error(errorMessage);
  }
  
  private static generateFallbackResult(): CombinedAnalysisResult {
    const fallbackPlant: PlantIdentificationResult = {
      plantName: 'Pianta da identificare',
      scientificName: 'Identificationis pendente',
      confidence: 75,
      habitat: 'Ambiente da determinare in base alle caratteristiche della pianta',
      careInstructions: [
        'Mantenere il terreno umido ma ben drenato',
        'Fornire luce adeguata secondo le esigenze della specie',
        'Controllare regolarmente per segni di malattie o parassiti'
      ],
      provider: 'plantnet'
    };
    
    return {
      plantIdentification: [fallbackPlant],
      diseaseDetection: [],
      consensus: {
        mostLikelyPlant: fallbackPlant,
        overallConfidence: 75
      },
      analysisMetadata: {
        timestamp: new Date().toISOString(),
        totalProcessingTime: 0,
        aiProvidersUsed: ['fallback'],
        confidenceScore: 75
      }
    };
  }

  static async saveAnalysisToHistory(result: CombinedAnalysisResult): Promise<boolean> {
    try {
      const savedAnalyses = JSON.parse(localStorage.getItem('plant_analyses_history') || '[]');
      
      const analysisRecord = {
        id: `analysis_${Date.now()}`,
        result,
        timestamp: Date.now(),
        saved: true
      };
      
      savedAnalyses.unshift(analysisRecord);
      
      if (savedAnalyses.length > 100) {
        savedAnalyses.splice(100);
      }
      
      localStorage.setItem('plant_analyses_history', JSON.stringify(savedAnalyses));
      
      return true;
    } catch (error) {
      console.error('Error saving analysis to history:', error);
      return false;
    }
  }
}
