
import { useState } from 'react';
import { analyzeWithEnhancedAI } from '@/utils/plant-analysis/enhanced-analysis';
import { handleAnalysisError, createFallbackDiagnosisResult, safeAnalysisWrapper } from '@/utils/error-handling';
import { toast } from 'sonner';
import type { PlantInfo } from '@/components/diagnose/types';
import type { AnalysisDetails, DiagnosedDisease } from '@/components/diagnose/types';
import { identifyPlantFromImage } from '@/utils/plant-analysis/plant-id-service';
import { selectRelevantProducts } from '@/utils/plant-analysis/selectRelevantProducts';
import type { AnalysisProgress } from '../services/aiProviders';

export const usePlantAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<string | null>(null);
  const [diagnosedDisease, setDiagnosedDisease] = useState<DiagnosedDisease | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisDetails, setAnalysisDetails] = useState<AnalysisDetails | null>(null);

  const analyzeUploadedImage = async (imageFile: File, plantInfo?: PlantInfo) => {
    setIsAnalyzing(true);
    setDiagnosisResult(null);
    setDiagnosedDisease(null);
    setAnalysisProgress(0);
    setAnalysisDetails(null);

    let plantInfoToUse: PlantInfo = { ...plantInfo };

    // NEW: Plant.id recognizer for missing names
    if (!plantInfo?.name || plantInfo.name.trim() === "") {
      try {
        const { plantName } = await identifyPlantFromImage(imageFile);
        if (plantName && plantName !== "Specie non identificata") {
          plantInfoToUse.name = plantName;
          if (typeof window !== "undefined" && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent("updatePlantInfoName", { detail: plantName }));
          }
        }
      } catch (e: any) {
        // proceed anyway
      }
    }

    const analysisResult = await safeAnalysisWrapper(
      async () => {
        const progressCallback = (progress: AnalysisProgress) => {
          setAnalysisProgress(Math.min(progress.percentage, 95));
        };

        try {
          toast.info("Analisi in corso...", { duration: 3000 });
          progressCallback({ stage: 'initialization', percentage: 10, message: 'Inizializzazione analisi...' });

          const enhancedResult = await analyzeWithEnhancedAI(imageFile, plantInfoToUse, progressCallback);

          progressCallback({ stage: 'processing', percentage: 80, message: 'Elaborazione risultati...' });

          if (!enhancedResult) throw new Error("Analisi fallita. Nessun risultato ottenuto dall'AI.");

          const plantLabel = enhancedResult.label || "Specie sconosciuta";
          const confidence = Math.max(0, Math.min(1, enhancedResult.confidence || 0));
          const isHealthy = enhancedResult.healthy ?? null;
          const isGoodConfidence = confidence >= 0.6;
          const isHighConfidence = confidence >= 0.8;

          let diseaseInfo: DiagnosedDisease;

          if (!isHealthy && enhancedResult.disease) {
            diseaseInfo = {
              id: `disease-${Date.now()}`,
              name: enhancedResult.disease.name || "Malattia non identificata",
              description: enhancedResult.disease.description || "Possibile malattia rilevata dall'analisi AI",
              causes: enhancedResult.disease.causes || "Cause non determinate dall'analisi automatica",
              symptoms: Array.isArray(enhancedResult.disease.symptoms)
                ? enhancedResult.disease.symptoms
                : ["Sintomi non chiaramente identificati"],
              treatments: Array.isArray(enhancedResult.disease.treatments)
                ? enhancedResult.disease.treatments
                : ["Consulenza esperta raccomandata per trattamento specifico"],
              confidence,
              healthy: false,
              products: enhancedResult.recommendedProducts || [],
              disclaimer: !isHighConfidence
                ? "L'analisi AI ha un'accuratezza moderata. Si consiglia una consulenza con un fitopatologo esperto per conferma."
                : undefined,
              recommendExpertConsultation: !isHighConfidence,
            };
          } else {
            diseaseInfo = {
              id: `healthy-${Date.now()}`,
              name: plantLabel,
              description: `Pianta apparentemente sana${!isHighConfidence ? ' (con accuratezza moderata)' : ''}`,
              causes: "N/A - Pianta sana",
              symptoms: ["Nessun sintomo di malattia rilevato"],
              treatments: ["Mantenere le cure standard", "Monitoraggio regolare"],
              confidence,
              healthy: true,
              products: enhancedResult.recommendedProducts || [],
              disclaimer: !isHighConfidence
                ? "L'immagine è stata identificata con accuratezza moderata. Per maggiore certezza sulla salute della pianta, consulta un fitopatologo."
                : undefined,
              recommendExpertConsultation: !isHighConfidence,
            };
          }

          if (!diseaseInfo.products || diseaseInfo.products.length === 0) {
            diseaseInfo.products = selectRelevantProducts(plantLabel, isHealthy);
          }

          const detailedAnalysis: AnalysisDetails = {
            multiServiceInsights: {
              plantName: plantLabel,
              plantSpecies: enhancedResult.scientificName || plantLabel,
              plantPart: enhancedResult.plantPart || "whole plant",
              isHealthy: isHealthy,
              isValidPlantImage: true,
              primaryService: enhancedResult.sources?.[0] || "Enhanced AI",
              agreementScore: confidence,
              huggingFaceResult: {
                label: plantLabel,
                score: confidence
              },
              dataSource: "Multi-AI Flexible Analysis"
            },
            risultatiCompleti: {
              plantInfo: plantInfoToUse,
              accuracyGuarantee: isHighConfidence ? "80%+" : "60%+"
            },
            identifiedFeatures: [
              plantLabel,
              `Accuratezza: ${Math.round(confidence * 100)}%`,
              isHealthy ? "Pianta sana" : "Possibili problemi rilevati"
            ],
            sistemaDigitaleFoglia: enhancedResult.plantPart === "leaf",
            analysisTechnology: "Enhanced Multi-AI Analysis"
          };

          progressCallback({ stage: 'finalizing', percentage: 95, message: 'Finalizzazione risultati...' });

          return { diseaseInfo, detailedAnalysis, plantLabel, confidence, isGoodConfidence };

        } catch (analysisError) {
          throw analysisError;
        }
      },
      null
    );

    if (analysisResult) {
      const { diseaseInfo, detailedAnalysis, plantLabel, confidence, isGoodConfidence } = analysisResult;
      setDiagnosedDisease(diseaseInfo);
      setDiagnosisResult(`${plantLabel} identificata con ${Math.round(confidence * 100)}% di accuratezza`);
      setAnalysisDetails(detailedAnalysis);
      setAnalysisProgress(100);

      if (confidence >= 0.8) {
        toast.success(`✅ Pianta identificata con alta accuratezza (${Math.round(confidence * 100)}%)!`, { duration: 4000 });
      } else if (isGoodConfidence) {
        toast.success(
          `✅ Pianta identificata con ${Math.round(confidence * 100)}% di accuratezza. Consulenza esperta raccomandata per maggiore certezza.`,
          { duration: 5000 }
        );
      }
    } else {
      // Analysis failed - create fallback result
      const errorResult = handleAnalysisError(new Error("Analisi non completata - servizi AI non disponibili"));
      const fallbackDisease = createFallbackDiagnosisResult(errorResult);
      setDiagnosedDisease(fallbackDisease);
      setDiagnosisResult("Analisi automatica non disponibile - consulenza esperta raccomandata");
      setAnalysisProgress(0);

      toast.error(errorResult.message, {
        description: "Il nostro fitopatologo Marco Nigro può aiutarti con una diagnosi professionale",
        duration: 6000
      });
    }

    setIsAnalyzing(false);
  };

  return {
    isAnalyzing,
    diagnosisResult,
    diagnosedDisease,
    analysisProgress,
    analysisDetails,
    analyzeUploadedImage,
    setDiagnosisResult,
    setDiagnosedDisease,
    setAnalysisProgress,
    setAnalysisDetails,
  };
};
