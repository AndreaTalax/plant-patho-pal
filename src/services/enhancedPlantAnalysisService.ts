
import { PlantIdService, EPPOService, MockPlantService, type PlantIdentificationResult, type DiseaseDetectionResult } from './aiProviders';
import { RougenAIService } from './aiProviders/RougenAIService';
import { PlantDiseasesAIService } from './aiProviders/PlantDiseasesAIService';
import { PlexiAIService } from './aiProviders/PlexiAIService';
import { PlantIDService } from './aiProviders/PlantIDService';
import { PlantDetectionService } from './plantDetectionService';
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
  plantDetection?: {
    isPlant: boolean;
    confidence: number;
    detectedElements: string[];
    message: string;
  };
  multiAIResults?: {
    rougen?: any;
    plantDiseasesAI?: any;
    plexi?: any;
    plantID?: any;
  };
  consensus?: {
    finalConfidence: number;
    agreementScore: number;
    bestProvider: string;
  };
}

export class EnhancedPlantAnalysisService {
  static async analyzeImage(
    imageBase64: string, 
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<EnhancedAnalysisResult> {
    
    const startTime = Date.now();
    const updateProgress = (step: string, progress: number, message: string) => {
      onProgress?.({ step, progress, message });
    };
    
    try {
      // Fase 1: Verifica se è una pianta
      updateProgress('detection', 10, 'Verifico se l\'immagine contiene una pianta...');
      
      const plantDetection = await PlantDetectionService.detectPlantInImage(imageBase64);
      
      if (!plantDetection.isPlant || plantDetection.confidence < 30) {
        toast.error('Nessuna pianta rilevata nell\'immagine', {
          description: `Confidenza: ${plantDetection.confidence}% - ${plantDetection.message}`
        });
        
        return {
          plantIdentification: [],
          diseaseDetection: [],
          consensus: { overallConfidence: plantDetection.confidence },
          plantDetection,
          analysisMetadata: {
            timestamp: new Date().toISOString(),
            totalProcessingTime: Date.now() - startTime,
            aiProvidersUsed: ['plant-detection'],
            confidenceScore: plantDetection.confidence
          }
        };
      }
      
      updateProgress('preprocessing', 20, 'Elaborazione immagine in corso...');
      
      // Fase 2: Analisi parallela con tutti i provider AI
      updateProgress('analysis', 30, 'Invio a provider AI specializzati...');
      
      const multiAIResults = await this.performMultiAIAnalysis(imageBase64, updateProgress);
      
      // Fase 3: Calcolo del consenso
      updateProgress('consensus', 80, 'Elaborazione consensus finale...');
      
      const consensus = this.calculateAdvancedConsensus(multiAIResults);
      
      // Fase 4: Integrazione EPPO se necessario
      updateProgress('eppo', 90, 'Verifica database EPPO...');
      
      const eppoData = await this.checkEppoDatabase(consensus);
      
      const totalProcessingTime = Date.now() - startTime;
      
      const finalResult: EnhancedAnalysisResult = {
        plantIdentification: this.formatPlantIdentifications(multiAIResults),
        diseaseDetection: this.formatDiseaseDetections(multiAIResults),
        consensus: {
          ...consensus,
          overallConfidence: consensus.finalConfidence
        },
        plantDetection,
        multiAIResults,
        eppoData,
        analysisMetadata: {
          timestamp: new Date().toISOString(),
          totalProcessingTime,
          aiProvidersUsed: Object.keys(multiAIResults).filter(k => multiAIResults[k]),
          confidenceScore: consensus.finalConfidence
        }
      };
      
      updateProgress('complete', 100, 'Analisi completata con successo');
      
      // Mostra risultato all'utente
      toast.success(`Analisi completata!`, {
        description: `${consensus.bestProvider} - Confidenza: ${consensus.finalConfidence}%`
      });
      
      return finalResult;
      
    } catch (error) {
      console.error('Enhanced analysis error:', error);
      toast.error('Errore durante l\'analisi');
      throw error;
    }
  }
  
  private static async performMultiAIAnalysis(imageBase64: string, updateProgress: Function) {
    const results: any = {};
    
    // Esegui analisi in parallelo per migliori performance
    const promises = [
      RougenAIService.identifyPlant(imageBase64).then(r => ({ rougen: r })).catch(() => ({ rougen: null })),
      PlantDiseasesAIService.detectDiseases(imageBase64).then(r => ({ plantDiseasesAI: r })).catch(() => ({ plantDiseasesAI: null })),
      PlexiAIService.analyzeComprehensive(imageBase64).then(r => ({ plexi: r })).catch(() => ({ plexi: null })),
      PlantIDService.identifyPlant(imageBase64).then(r => ({ plantID: r })).catch(() => ({ plantID: null }))
    ];
    
    updateProgress('analysis', 35, 'RougenAI in elaborazione...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    updateProgress('analysis', 45, 'PlantDiseasesAI in elaborazione...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    updateProgress('analysis', 55, 'PlexiAI in elaborazione...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    updateProgress('analysis', 65, 'Plant.ID in elaborazione...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const resolvedResults = await Promise.allSettled(promises);
    
    // Combina tutti i risultati
    resolvedResults.forEach(result => {
      if (result.status === 'fulfilled') {
        Object.assign(results, result.value);
      }
    });
    
    updateProgress('analysis', 75, 'Tutti i provider AI completati');
    
    return results;
  }
  
  private static calculateAdvancedConsensus(multiAIResults: any) {
    const confidences: number[] = [];
    const providers: string[] = [];
    let bestProvider = 'unknown';
    let maxConfidence = 0;
    
    // Estrai confidenze da tutti i provider
    if (multiAIResults.rougen?.confidence) {
      confidences.push(multiAIResults.rougen.confidence);
      providers.push('RougenAI');
      if (multiAIResults.rougen.confidence > maxConfidence) {
        maxConfidence = multiAIResults.rougen.confidence;
        bestProvider = 'RougenAI';
      }
    }
    
    if (multiAIResults.plantID?.confidence) {
      confidences.push(multiAIResults.plantID.confidence);
      providers.push('Plant.ID');
      if (multiAIResults.plantID.confidence > maxConfidence) {
        maxConfidence = multiAIResults.plantID.confidence;
        bestProvider = 'Plant.ID';
      }
    }
    
    if (multiAIResults.plexi?.plantIdentification?.confidence) {
      confidences.push(multiAIResults.plexi.plantIdentification.confidence);
      providers.push('PlexiAI');
      if (multiAIResults.plexi.plantIdentification.confidence > maxConfidence) {
        maxConfidence = multiAIResults.plexi.plantIdentification.confidence;
        bestProvider = 'PlexiAI';
      }
    }
    
    // Calcola consensus finale
    const avgConfidence = confidences.length > 0 ? 
      Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length) : 50;
    
    const agreementScore = confidences.length > 1 ? 
      Math.round((1 - (Math.max(...confidences) - Math.min(...confidences)) / 100) * 100) : 100;
    
    // Il consensus finale è una media pesata tra la confidence migliore e quella media
    const finalConfidence = Math.round((maxConfidence * 0.7) + (avgConfidence * 0.3));
    
    return {
      finalConfidence,
      agreementScore,
      bestProvider,
      providersCount: providers.length,
      providersUsed: providers
    };
  }
  
  private static formatPlantIdentifications(multiAIResults: any): PlantIdentificationResult[] {
    const identifications: PlantIdentificationResult[] = [];
    
    if (multiAIResults.rougen) {
      identifications.push({
        plantName: multiAIResults.rougen.plantName,
        scientificName: multiAIResults.rougen.scientificName,
        confidence: multiAIResults.rougen.confidence,
        habitat: 'Da determinare',
        careInstructions: multiAIResults.rougen.characteristics || [],
        provider: 'rougen'
      });
    }
    
    if (multiAIResults.plantID) {
      identifications.push({
        plantName: multiAIResults.plantID.plantName,
        scientificName: multiAIResults.plantID.scientificName,
        confidence: multiAIResults.plantID.confidence,
        habitat: 'Da determinare',
        careInstructions: multiAIResults.plantID.commonNames || [],
        provider: 'plant-id'
      });
    }
    
    if (multiAIResults.plexi) {
      identifications.push({
        plantName: multiAIResults.plexi.plantIdentification.name,
        scientificName: multiAIResults.plexi.plantIdentification.scientificName,
        confidence: multiAIResults.plexi.plantIdentification.confidence,
        habitat: 'Da determinare',
        careInstructions: multiAIResults.plexi.recommendations || [],
        provider: 'plexi'
      });
    }
    
    return identifications.sort((a, b) => b.confidence - a.confidence);
  }
  
  private static formatDiseaseDetections(multiAIResults: any): DiseaseDetectionResult[] {
    const diseases: DiseaseDetectionResult[] = [];
    
    if (multiAIResults.plantDiseasesAI) {
      multiAIResults.plantDiseasesAI.forEach((disease: any) => {
        diseases.push({
          diseaseName: disease.diseaseName,
          confidence: disease.confidence,
          severity: disease.severity,
          symptoms: disease.symptoms,
          treatment: disease.treatment,
          provider: 'plant-diseases-ai'
        });
      });
    }
    
    if (multiAIResults.plexi?.healthAnalysis?.issues) {
      multiAIResults.plexi.healthAnalysis.issues.forEach((issue: any) => {
        diseases.push({
          diseaseName: issue.type,
          confidence: issue.severity,
          severity: issue.severity > 70 ? 'high' : issue.severity > 40 ? 'medium' : 'low',
          symptoms: [issue.description],
          treatment: ['Consulta esperto'],
          provider: 'plexi'
        });
      });
    }
    
    return diseases.sort((a, b) => b.confidence - a.confidence);
  }
  
  private static async checkEppoDatabase(consensus: any) {
    // Implementazione semplificata per ora
    return undefined;
  }
}
