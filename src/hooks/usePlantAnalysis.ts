
import { useState } from 'react';
import { toast } from "@/components/ui/sonner";
import { 
  PlantIdentificationResult, 
  DiseaseDetectionResult, 
} from '@/services/aiProviders';
import { GlobalPlantIdentificationService, type GlobalIdentificationResult } from '@/services/globalPlantIdentificationService';
import type { CombinedAnalysisResult } from '@/types/analysis';

interface AnalysisState {
  results: CombinedAnalysisResult | null;
  isAnalyzing: boolean;
  progress: {
    step: string;
    progress: number;
    message: string;
  };
  error: string | null;
}

const initialState: AnalysisState = {
  results: null,
  isAnalyzing: false,
  progress: { step: 'Inattivo', progress: 0, message: 'Pronto per l\'analisi' },
  error: null
};

export const usePlantAnalysis = () => {
  const [results, setResults] = useState<CombinedAnalysisResult | null>(initialState.results);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(initialState.isAnalyzing);
  const [progress, setProgress] = useState<AnalysisState['progress']>(initialState.progress);

  const analyzeImage = async (imageFile: File): Promise<void> => {
    if (!imageFile) return;
    
    setIsAnalyzing(true);
    setProgress({ step: 'Preparazione', progress: 0, message: 'Preparazione analisi...' });
    
    try {
      // Converti immagine in base64
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      setProgress({ step: 'Identificazione', progress: 20, message: 'Identificazione pianta con tutte le API disponibili...' });

      // Usa il servizio di identificazione globale
      const globalResult = await GlobalPlantIdentificationService.identifyPlantGlobally(imageBase64);

      setProgress({ step: 'Elaborazione', progress: 90, message: 'Elaborazione risultati finali...' });

      // Converti i risultati nel formato esistente per compatibilità
      const plantResults: PlantIdentificationResult[] = globalResult.plantIdentification.map(plant => ({
        plantName: plant.name,
        scientificName: plant.scientificName,
        confidence: plant.confidence,
        habitat: `Identificato tramite ${plant.source}`,
        careInstructions: [`Informazioni da ${plant.source}`],
        provider: plant.source.toLowerCase().replace(/[^a-z]/g, '') as any
      }));

      const diseaseResults: DiseaseDetectionResult[] = globalResult.diseases.map(disease => ({
        disease: disease.name,
        confidence: disease.confidence,
        symptoms: disease.symptoms,
        treatments: disease.treatments,
        severity: disease.confidence > 60 ? 'high' : disease.confidence > 40 ? 'medium' : 'low',
        provider: disease.source.toLowerCase().replace(/[^a-z]/g, ''),
        additionalInfo: {
          cause: disease.cause
        }
      }));

      // Calcola il consenso
      const bestPlant = GlobalPlantIdentificationService.getBestPlantIdentification(globalResult.plantIdentification);
      const topDiseases = GlobalPlantIdentificationService.getTopDiseases(globalResult.diseases, 1);

      const consensus: CombinedAnalysisResult['consensus'] = {
        mostLikelyPlant: bestPlant ? {
          plantName: bestPlant.name,
          scientificName: bestPlant.scientificName,
          confidence: bestPlant.confidence,
          habitat: `${bestPlant.source} + ${globalResult.plantIdentification.length - 1} altre fonti`,
          careInstructions: [`Identificato da ${globalResult.plantIdentification.length} fonti diverse`],
          provider: bestPlant.source.toLowerCase().replace(/[^a-z]/g, '') as any
        } : null,
        mostLikelyDisease: topDiseases[0] ? {
          disease: topDiseases[0].name,
          confidence: topDiseases[0].confidence,
          symptoms: topDiseases[0].symptoms,
          treatments: topDiseases[0].treatments,
          severity: topDiseases[0].confidence > 60 ? 'high' : topDiseases[0].confidence > 40 ? 'medium' : 'low',
          provider: topDiseases[0].source.toLowerCase().replace(/[^a-z]/g, ''),
          additionalInfo: {
            cause: topDiseases[0].cause
          }
        } : undefined,
        overallConfidence: bestPlant?.confidence || 0,
        finalConfidence: bestPlant?.confidence || 0,
        agreementScore: calculateAgreementScore(globalResult.plantIdentification),
        bestProvider: bestPlant?.source || 'unknown',
        providersUsed: [...new Set([
          ...globalResult.plantIdentification.map(p => p.source),
          ...globalResult.diseases.map(d => d.source)
        ])]
      };

      const finalResult: CombinedAnalysisResult = {
        plantIdentification: plantResults,
        diseaseDetection: diseaseResults,
        consensus,
        analysisMetadata: {
          timestamp: new Date().toISOString(),
          totalProcessingTime: Date.now() - Date.now(),
          aiProvidersUsed: consensus.providersUsed,
          confidenceScore: consensus.finalConfidence
        }
      };

      setResults(finalResult);

      // Messaggio personalizzato per i risultati di fallback
      if (globalResult.isFallback) {
        setProgress({ 
          step: 'Suggerimenti', 
          progress: 100, 
          message: 'Identificazione automatica non riuscita - forniti suggerimenti alternativi' 
        });

        toast.warning('Identificazione incerta', {
          description: `Non siamo riusciti a identificare con certezza la pianta. Ti forniamo alcuni suggerimenti basati sulle piante più comuni.`
        });
      } else {
        setProgress({ 
          step: 'Completato', 
          progress: 100, 
          message: `Analisi completata! Identificata da ${consensus.providersUsed.length} fonti` 
        });

        toast.success(`Identificazione completata!`, {
          description: `Pianta identificata da ${consensus.providersUsed.length} fonti AI diverse con confidenza del ${consensus.finalConfidence}%`
        });
      }

    } catch (error) {
      console.error('❌ Errore analisi:', error);
      toast.error('Errore durante l\'analisi', {
        description: error instanceof Error ? error.message : 'Errore sconosciuto'
      });
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearResults = () => {
    setResults(null);
  };

  return {
    results,
    analyzeImage,
    clearResults,
    isAnalyzing,
    progress,
    error: null
  };
};

function calculateAgreementScore(identifications: any[]): number {
  if (identifications.length <= 1) return 100;
  
  const confidences = identifications.map(id => id.confidence);
  const maxConf = Math.max(...confidences);
  const minConf = Math.min(...confidences);
  
  return Math.round(100 - (maxConf - minConf));
}
