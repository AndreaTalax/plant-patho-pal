

import { PlantIdService, EPPOService, MockPlantService, type PlantIdentificationResult, type DiseaseDetectionResult } from './aiProviders';
import { PlexiAIService } from './aiProviders/PlexiAIService';
import { PlantIDService } from './aiProviders/PlantIDService';
import { PlantDetectionService } from './plantDetectionService';
import { ImageProcessingService, type ProcessedImage } from './imageProcessingService';
import { CacheService } from './cacheService';
import { EppoService, type EppoSearchResult } from './eppoService';
import { eppoApiService } from '@/utils/eppoApiService';
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
    plexi?: any;
    plantID?: any;
    eppo?: any;
  };
  consensus: {
    mostLikelyPlant: any;
    mostLikelyDisease?: any;
    overallConfidence: number;
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
          consensus: { 
            mostLikelyPlant: null,
            overallConfidence: plantDetection.confidence,
            finalConfidence: plantDetection.confidence,
            agreementScore: 0,
            bestProvider: 'plant-detection'
          },
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
          mostLikelyPlant: consensus.mostLikelyPlant,
          mostLikelyDisease: consensus.mostLikelyDisease,
          overallConfidence: consensus.finalConfidence,
          finalConfidence: consensus.finalConfidence,
          agreementScore: consensus.agreementScore,
          bestProvider: consensus.bestProvider
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
      PlexiAIService.analyzeComprehensive(imageBase64).then(r => ({ plexi: r })).catch(() => ({ plexi: null })),
      PlantIDService.identifyPlant(imageBase64).then(r => ({ plantID: r })).catch(() => ({ plantID: null })),
      this.searchEppoDatabase(imageBase64).then(r => ({ eppo: r })).catch(() => ({ eppo: null }))
    ];
    
    updateProgress('analysis', 45, 'PlexiAI in elaborazione...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    updateProgress('analysis', 55, 'Plant.ID in elaborazione...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    updateProgress('analysis', 65, 'Database EPPO in elaborazione...');
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
  
  private static async searchEppoDatabase(imageBase64: string) {
    try {
      // Prima identifica la pianta con Plant.ID per ottenere il nome
      const plantID = await PlantIDService.identifyPlant(imageBase64);
      if (plantID.plantName && plantID.plantName !== 'Pianta non identificata') {
        // Cerca nel database EPPO usando il nome della pianta
        const eppoResults = await eppoApiService.searchPests(plantID.plantName);
        const eppoPlants = await eppoApiService.searchPlants(plantID.plantName);
        const eppoDiseases = await eppoApiService.searchDiseases(plantID.plantName);
        
        return {
          pests: eppoResults,
          plants: eppoPlants,
          diseases: eppoDiseases,
          searchTerm: plantID.plantName
        };
      }
      return null;
    } catch (error) {
      console.warn('EPPO database search failed:', error);
      return null;
    }
  }
  
  private static calculateAdvancedConsensus(multiAIResults: any) {
    const confidences: number[] = [];
    const providers: string[] = [];
    let bestProvider = 'unknown';
    let maxConfidence = 0;
    let mostLikelyPlant: any = null;
    let mostLikelyDisease: any = null;
    
    // Estrai confidenze da tutti i provider
    if (multiAIResults.plantID?.confidence) {
      confidences.push(multiAIResults.plantID.confidence);
      providers.push('Plant.ID');
      if (multiAIResults.plantID.confidence > maxConfidence) {
        maxConfidence = multiAIResults.plantID.confidence;
        bestProvider = 'Plant.ID';
        mostLikelyPlant = multiAIResults.plantID;
      }
    }
    
    if (multiAIResults.plexi?.plantIdentification?.confidence) {
      confidences.push(multiAIResults.plexi.plantIdentification.confidence);
      providers.push('PlexiAI');
      if (multiAIResults.plexi.plantIdentification.confidence > maxConfidence) {
        maxConfidence = multiAIResults.plexi.plantIdentification.confidence;
        bestProvider = 'PlexiAI';
        mostLikelyPlant = multiAIResults.plexi.plantIdentification;
      }
    }
    
    // Considera anche i dati EPPO per malattie
    if (multiAIResults.eppo?.diseases?.length > 0) {
      providers.push('EPPO Database');
      mostLikelyDisease = multiAIResults.eppo.diseases[0];
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
      providersUsed: providers,
      mostLikelyPlant,
      mostLikelyDisease
    };
  }
  
  private static formatPlantIdentifications(multiAIResults: any): PlantIdentificationResult[] {
    const identifications: PlantIdentificationResult[] = [];
    
    if (multiAIResults.plantID) {
      identifications.push({
        plantName: multiAIResults.plantID.plantName,
        scientificName: multiAIResults.plantID.scientificName,
        confidence: multiAIResults.plantID.confidence,
        habitat: 'Da determinare',
        careInstructions: multiAIResults.plantID.commonNames || [],
        provider: 'plantid'
      });
    }
    
    if (multiAIResults.plexi) {
      identifications.push({
        plantName: multiAIResults.plexi.plantIdentification.name,
        scientificName: multiAIResults.plexi.plantIdentification.scientificName,
        confidence: multiAIResults.plexi.plantIdentification.confidence,
        habitat: 'Da determinare',
        careInstructions: multiAIResults.plexi.recommendations || [],
        provider: 'plantnet'
      });
    }
    
    if (multiAIResults.eppo?.plants?.length > 0) {
      const eppoPlant = multiAIResults.eppo.plants[0];
      identifications.push({
        plantName: eppoPlant.preferredName,
        scientificName: eppoPlant.scientificName || eppoPlant.preferredName,
        confidence: 85, // EPPO è molto affidabile
        habitat: 'Database EPPO',
        careInstructions: eppoPlant.otherNames || [],
        provider: 'eppo'
      });
    }
    
    return identifications.sort((a, b) => b.confidence - a.confidence);
  }
  
  private static formatDiseaseDetections(multiAIResults: any): DiseaseDetectionResult[] {
    const diseases: DiseaseDetectionResult[] = [];
    
    if (multiAIResults.plexi?.healthAnalysis?.issues) {
      multiAIResults.plexi.healthAnalysis.issues.forEach((issue: any) => {
        diseases.push({
          name: issue.type,
          confidence: issue.severity,
          severity: issue.severity > 70 ? 'high' : issue.severity > 40 ? 'medium' : 'low',
          symptoms: [issue.description],
          treatment: ['Consulta esperto'],
          provider: 'plantnet'
        });
      });
    }
    
    if (multiAIResults.eppo?.pests?.length > 0) {
      multiAIResults.eppo.pests.forEach((pest: any) => {
        diseases.push({
          name: pest.preferredName,
          confidence: 80, // EPPO è affidabile
          severity: 'medium',
          symptoms: ['Parassita identificato nel database EPPO'],
          treatment: ['Consulta database EPPO per trattamenti specifici'],
          provider: 'eppo'
        });
      });
    }
    
    if (multiAIResults.eppo?.diseases?.length > 0) {
      multiAIResults.eppo.diseases.forEach((disease: any) => {
        diseases.push({
          name: disease.preferredName,
          confidence: 85, // EPPO è molto affidabile per malattie
          severity: 'medium',
          symptoms: disease.symptoms || ['Malattia identificata nel database EPPO'],
          treatment: ['Consulta database EPPO per trattamenti specifici'],
          provider: 'eppo'
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

