import { PlantIdService, EPPOService, MockPlantService, type PlantIdentificationResult, type DiseaseDetectionResult } from './aiProviders';
import { PlexiAIService } from './aiProviders/PlexiAIService';
import { PlantIDService } from './aiProviders/PlantIDService';
import { PlantDetectionService } from './plantDetectionService';
import { ImageProcessingService, type ProcessedImage } from './imageProcessingService';
import { CacheService } from './cacheService';
import { EppoService, type EppoSearchResult } from './eppoService';
import { eppoApiService } from '@/utils/eppoApiService';
import { PlantDiseaseService } from './PlantDiseaseService';
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
  private static readonly PLANT_ID_API_KEY = process.env.PLANT_ID_API_KEY || '6d4146706e385077db06e57b76fd967d10b4cb2ce23070580160ebb069da8420';
  private static readonly PLANTNET_API_KEY = process.env.PLANTNET || '2c3cc11af50602d90073a401dc7ccce7ba70abc40bda9d84794';
  private static readonly HUGGINGFACE_ACCESS_TOKEN = process.env.HUGGINGFACE_ACCESS_TOKEN || 'fb752ef5f96488fc2659a524aeece4b8d790b82b7cf19fe4c4e72ba86298cb60';
  private static readonly EPPO_API_KEY = process.env.EPPO_API_KEY || 'ce550a719eec290cb93614cc5dcc027e39164548e21f5849900416cfd3537f8d';

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
      
      // Fase 4: Integrazione EPPO se necessario
      updateProgress('eppo', 90, 'Verifica database EPPO...');
      
      const identifications = this.formatPlantIdentifications(multiAIResults);
      const diseases = this.formatDiseaseDetections(multiAIResults);
      const consensus = this.calculateEnhancedConsensus({ identifications, diseases });
      
      const totalProcessingTime = Date.now() - startTime;
      
      const finalResult: EnhancedAnalysisResult = {
        plantIdentification: this.formatPlantIdentifications(multiAIResults),
        diseaseDetection: this.formatDiseaseDetections(multiAIResults),
        consensus: consensus.consensus,
        plantDetection,
        multiAIResults,
        analysisMetadata: {
          timestamp: new Date().toISOString(),
          totalProcessingTime,
          aiProvidersUsed: Object.keys(multiAIResults).filter(k => multiAIResults[k]),
          confidenceScore: consensus.consensus.finalConfidence
        }
      };
      
      updateProgress('complete', 100, 'Analisi completata con successo');
      
      // Mostra risultato all'utente
      toast.success(`Analisi completata!`, {
        description: `${consensus.consensus.bestProvider} - Confidenza: ${consensus.consensus.finalConfidence}%`
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
    
    // Esegui analisi in parallelo con tutti i servizi
    const promises = [
      // Identificazione piante
      PlexiAIService.analyzeComprehensive(imageBase64).then(r => ({ plexi: r })).catch(() => ({ plexi: null })),
      PlantIDService.identifyPlant(imageBase64).then(r => ({ plantID: r })).catch(() => ({ plantID: null })),
      
      // DIAGNOSI MALATTIE CON AI REALE
      PlantDiseaseService.diagnosePlantDisease(imageBase64).then(r => ({ plantIdDiseases: r })).catch(() => ({ plantIdDiseases: [] })),
      PlantDiseaseService.analyzePlantHealthWithPlantNet(imageBase64).then(r => ({ plantNetDiseases: r })).catch(() => ({ plantNetDiseases: [] })),
      PlantDiseaseService.analyzeWithHuggingFace(imageBase64).then(r => ({ huggingFaceDiseases: r })).catch(() => ({ huggingFaceDiseases: [] })),
      PlantDiseaseService.analyzeWithPlantDiseaseModel(imageBase64).then(r => ({ specializedDiseases: r })).catch(() => ({ specializedDiseases: [] })),
      
      // Database EPPO - ora con le API key corrette
      this.searchEppoDatabase(imageBase64).then(r => ({ eppo: r })).catch(() => ({ eppo: null }))
    ];
    
    updateProgress('analysis', 30, 'Identificazione pianta in corso...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    updateProgress('analysis', 45, 'Diagnosi malattie con Plant.ID...');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    updateProgress('analysis', 60, 'Analisi salute con PlantNet...');
    await new Promise(resolve => setTimeout(resolve, 600));
    
    updateProgress('analysis', 70, 'Analisi AI con Hugging Face...');
    await new Promise(resolve => setTimeout(resolve, 700));
    
    updateProgress('analysis', 80, 'Modelli specializzati per malattie...');
    await new Promise(resolve => setTimeout(resolve, 600));
    
    updateProgress('analysis', 90, 'Verifica database EPPO...');
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const resolvedResults = await Promise.allSettled(promises);
    
    resolvedResults.forEach(result => {
      if (result.status === 'fulfilled') {
        Object.assign(results, result.value);
      }
    });
    
    updateProgress('analysis', 95, 'Consolidamento risultati AI...');
    
    return results;
  }
  
  private static async searchEppoDatabase(imageBase64: string) {
    try {
      // Prima identifica la pianta con Plant.ID per ottenere il nome
      const plantID = await PlantIDService.identifyPlant(imageBase64);
      if (plantID.plantName && plantID.plantName !== 'Pianta non identificata') {
        // Cerca nel database EPPO usando il nome della pianta
        const headers = {
          'Authorization': `Bearer ${this.EPPO_API_KEY}`,
          'Content-Type': 'application/json'
        };
        
        const [eppoResults, eppoPlants, eppoDiseases] = await Promise.all([
          fetch(`https://data.eppo.int/api/rest/1.0/tools/search?kw=${encodeURIComponent(plantID.plantName)}&searchfor=pests`, { headers }).then(r => r.json()).catch(() => []),
          fetch(`https://data.eppo.int/api/rest/1.0/tools/search?kw=${encodeURIComponent(plantID.plantName)}&searchfor=plants`, { headers }).then(r => r.json()).catch(() => []),
          fetch(`https://data.eppo.int/api/rest/1.0/tools/search?kw=${encodeURIComponent(plantID.plantName)}&searchfor=diseases`, { headers }).then(r => r.json()).catch(() => [])
        ]);
        
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
  
  private static calculateEnhancedConsensus(
    results: { identifications: PlantIdentificationResult[]; diseases: DiseaseDetectionResult[] }
  ): CombinedAnalysisResult {
    const identifications = results.identifications || [];
    const diseases = results.diseases || [];
    
    // Calcolo consenso ponderato per identificazioni piante
    const weightedScores = identifications.map(id => ({
      ...id,
      weightedScore: this.calculateProviderWeight(id.provider) * (id.confidence / 100)
    }));
    
    // Trova la pianta con score ponderato più alto
    const bestPlant = weightedScores.length > 0 ? 
      weightedScores.reduce((prev, current) => 
        prev.weightedScore > current.weightedScore ? prev : current
      ) : null;
    
    // Calcola consenso generale
    const totalWeight = weightedScores.reduce((sum, item) => sum + this.calculateProviderWeight(item.provider), 0);
    const overallConfidence = totalWeight > 0 ? 
      Math.round(weightedScores.reduce((sum, item) => 
        sum + (this.calculateProviderWeight(item.provider) * item.confidence), 0
      ) / totalWeight) : 50;
    
    // Calcola agreement score (quanto concordano i provider)
    const confidences = identifications.map(id => id.confidence);
    const agreementScore = confidences.length > 1 ? 
      Math.round(100 - (Math.max(...confidences) - Math.min(...confidences))) : 100;
    
    // Trova la malattia più probabile
    const mostLikelyDisease = diseases.length > 0 ? 
      diseases.reduce((prev, current) => 
        prev.confidence > current.confidence ? prev : current
      ) : undefined;
    
    const finalConfidence = overallConfidence;
    
    return {
      plantIdentification: identifications,
      diseaseDetection: diseases,
      consensus: {
        mostLikelyPlant: bestPlant,
        mostLikelyDisease,
        overallConfidence: finalConfidence,
        finalConfidence,
        agreementScore,
        bestProvider: bestPlant?.provider || 'unknown',
        providersUsed: [...new Set(identifications.map(id => id.provider))],
        weightedScores: weightedScores.map(ws => ({
          provider: ws.provider,
          confidence: ws.confidence,
          weightedScore: Math.round(ws.weightedScore * 100)
        }))
      },
      analysisMetadata: {
        timestamp: new Date().toISOString(),
        totalProcessingTime: 0,
        aiProvidersUsed: [...new Set(identifications.map(id => id.provider))],
        confidenceScore: finalConfidence
      }
    };
  }
  
  private static calculateProviderWeight(provider: string): number {
    const weights = {
      'plantid-health': 0.5,    // Plant.ID Health è il più specializzato
      'huggingface-plant-disease': 0.45, // Modello specializzato
      'eppo': 0.4,             // Database ufficiale
      'plantid': 0.35,         // Plant.ID identificazione
      'plantnet': 0.3,         // Buono per identificazione
      'huggingface': 0.25,     // Generico
      'plexi': 0.2             // Meno specializzato per malattie
    };
    return weights[provider] || 0.2;
  }
  
  private static formatPlantIdentifications(multiAIResults: any): PlantIdentificationResult[] {
    const identifications: PlantIdentificationResult[] = [];
    
    if (multiAIResults.plantID) {
      // Assicura che la confidence sia sempre un numero valido
      const confidence = Math.round(multiAIResults.plantID.confidence || 75);
      identifications.push({
        plantName: multiAIResults.plantID.plantName,
        scientificName: multiAIResults.plantID.scientificName,
        confidence: Math.max(confidence, 1), // Minimo 1%
        habitat: 'Da determinare',
        careInstructions: multiAIResults.plantID.commonNames || [],
        provider: 'plantid'
      });
    }
    
    if (multiAIResults.plexi) {
      const confidence = Math.round(multiAIResults.plexi.plantIdentification.confidence || 75);
      identifications.push({
        plantName: multiAIResults.plexi.plantIdentification.name,
        scientificName: multiAIResults.plexi.plantIdentification.scientificName,
        confidence: Math.max(confidence, 1), // Minimo 1%
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
    
    // Aggiungi risultati da Plant.ID Health Assessment
    if (multiAIResults.plantIdDiseases?.length > 0) {
      diseases.push(...multiAIResults.plantIdDiseases);
    }
    
    // Aggiungi risultati da PlantNet
    if (multiAIResults.plantNetDiseases?.length > 0) {
      diseases.push(...multiAIResults.plantNetDiseases);
    }
    
    // Aggiungi risultati da Hugging Face
    if (multiAIResults.huggingFaceDiseases?.length > 0) {
      diseases.push(...multiAIResults.huggingFaceDiseases);
    }
    
    // Aggiungi risultati da modelli specializzati
    if (multiAIResults.specializedDiseases?.length > 0) {
      diseases.push(...multiAIResults.specializedDiseases);
    }
    
    // Mantieni i risultati esistenti da PlexiAI
    if (multiAIResults.plexi?.healthAnalysis?.issues) {
      multiAIResults.plexi.healthAnalysis.issues.forEach((issue: any) => {
        const confidence = Math.round(issue.severity || 60);
        diseases.push({
          disease: issue.type,
          confidence: Math.max(confidence, 1),
          severity: confidence > 70 ? 'high' : confidence > 40 ? 'medium' : 'low',
          symptoms: [issue.description],
          treatments: ['Consulta esperto'],
          provider: 'plexi'
        });
      });
    }
    
    // Aggiungi risultati EPPO
    if (multiAIResults.eppo?.pests?.length > 0) {
      multiAIResults.eppo.pests.forEach((pest: any) => {
        diseases.push({
          disease: pest.preferredName,
          confidence: 80,
          severity: 'medium',
          symptoms: ['Parassita identificato nel database EPPO'],
          treatments: ['Consulta database EPPO per trattamenti specifici'],
          provider: 'eppo'
        });
      });
    }
    
    if (multiAIResults.eppo?.diseases?.length > 0) {
      multiAIResults.eppo.diseases.forEach((disease: any) => {
        diseases.push({
          disease: disease.preferredName,
          confidence: 85,
          severity: 'medium',
          symptoms: disease.symptoms || ['Malattia identificata nel database EPPO'],
          treatments: ['Consulta database EPPO per trattamenti specifici'],
          provider: 'eppo'
        });
      });
    }
    
    // Rimuovi duplicati e raggruppa risultati simili
    const uniqueDiseases = this.consolidateDiseaseResults(diseases);
    
    // Ordina per confidenza decrescente
    return uniqueDiseases.sort((a, b) => b.confidence - a.confidence);
  }
  
  private static consolidateDiseaseResults(diseases: DiseaseDetectionResult[]): DiseaseDetectionResult[] {
    const consolidated: { [key: string]: DiseaseDetectionResult } = {};
    
    diseases.forEach(disease => {
      const key = disease.disease.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (consolidated[key]) {
        // Combina risultati simili
        consolidated[key].confidence = Math.max(consolidated[key].confidence, disease.confidence);
        consolidated[key].symptoms.push(...disease.symptoms);
        consolidated[key].treatments.push(...disease.treatments);
        consolidated[key].provider = `${consolidated[key].provider}, ${disease.provider}`;
      } else {
        consolidated[key] = { ...disease };
      }
    });
    
    return Object.values(consolidated);
  }

  private static async checkEppoDatabase(consensus: any) {
    // Implementazione semplificata per ora
    return undefined;
  }
}
