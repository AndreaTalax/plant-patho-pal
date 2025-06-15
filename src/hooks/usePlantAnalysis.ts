
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

    // Enhanced image validation
    if (!imageFile || imageFile.size === 0) {
      toast.error("File immagine non valido");
      setIsAnalyzing(false);
      return;
    }

    // Check file size (max 10MB)
    if (imageFile.size > 10 * 1024 * 1024) {
      toast.error("Immagine troppo grande. Massimo 10MB consentito");
      setIsAnalyzing(false);
      return;
    }

    // Check file type
    if (!imageFile.type.startsWith('image/')) {
      toast.error("Formato file non supportato. Usa JPG, PNG o WebP");
      setIsAnalyzing(false);
      return;
    }

    console.log('🔍 Starting enhanced image analysis...', {
      fileName: imageFile.name,
      fileSize: `${(imageFile.size / 1024 / 1024).toFixed(2)}MB`,
      fileType: imageFile.type,
      plantInfo: plantInfoToUse
    });

    // Plant.id recognizer for missing names (with better error handling)
    if (!plantInfo?.name || plantInfo.name.trim() === "") {
      try {
        setAnalysisProgress(5);
        toast.info("Identificazione preliminare della pianta...", { duration: 2000 });
        
        const { plantName } = await identifyPlantFromImage(imageFile);
        if (plantName && plantName !== "Specie non identificata") {
          plantInfoToUse.name = plantName;
          if (typeof window !== "undefined" && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent("updatePlantInfoName", { detail: plantName }));
          }
          console.log('🌱 Plant pre-identified as:', plantName);
        }
      } catch (e: any) {
        console.log('⚠️ Pre-identification failed, proceeding with analysis:', e.message);
      }
    }

    const analysisResult = await safeAnalysisWrapper(
      async () => {
        const progressCallback = (progress: AnalysisProgress) => {
          const progressValue = Math.min(progress.percentage, 95);
          setAnalysisProgress(progressValue);
          
          // Enhanced progress messages
          if (progressValue < 95) {
            toast.info(`${progress.message} (${progressValue}%)`, { duration: 1500 });
          }
        };

        try {
          toast.info("Analisi avanzata in corso con AI...", { duration: 3000 });
          progressCallback({ stage: 'initialization', percentage: 15, message: 'Inizializzazione servizi AI...' });

          const enhancedResult = await analyzeWithEnhancedAI(imageFile, plantInfoToUse, progressCallback);

          progressCallback({ stage: 'processing', percentage: 85, message: 'Elaborazione risultati finali...' });

          if (!enhancedResult) {
            throw new Error("Analisi fallita. Nessun risultato ottenuto dai servizi AI.");
          }

          // Enhanced result processing
          const plantLabel = enhancedResult.label || enhancedResult.plantName || "Specie sconosciuta";
          const confidence = Math.max(0, Math.min(1, enhancedResult.confidence || 0));
          const isHealthy = enhancedResult.healthy ?? enhancedResult.isHealthy ?? null;
          const isHighConfidence = confidence >= 0.8;
          const isGoodConfidence = confidence >= 0.6;
          const isModerateConfidence = confidence >= 0.4;

          let diseaseInfo: DiagnosedDisease;

          if (!isHealthy && (enhancedResult.disease || enhancedResult.diseases?.length > 0)) {
            const primaryDisease = enhancedResult.disease || enhancedResult.diseases?.[0];
            diseaseInfo = {
              id: `disease-${Date.now()}`,
              name: primaryDisease?.name || "Possibile malattia rilevata",
              description: primaryDisease?.description || "Possibili problemi di salute rilevati dall'analisi AI",
              causes: primaryDisease?.causes || "Cause non determinate dall'analisi automatica",
              symptoms: Array.isArray(primaryDisease?.symptoms)
                ? primaryDisease.symptoms
                : ["Sintomi rilevati dall'analisi AI"],
              treatments: Array.isArray(primaryDisease?.treatments)
                ? primaryDisease.treatments
                : primaryDisease?.treatment ? [primaryDisease.treatment] : ["Consulenza esperta raccomandata per trattamento specifico"],
              confidence,
              healthy: false,
              products: enhancedResult.recommendedProducts || [],
              disclaimer: !isHighConfidence
                ? `L'analisi AI ha ${isGoodConfidence ? 'buona' : isModerateConfidence ? 'moderata' : 'bassa'} accuratezza (${Math.round(confidence * 100)}%). Consulenza esperta raccomandata per conferma.`
                : undefined,
              recommendExpertConsultation: !isHighConfidence,
            };
          } else {
            diseaseInfo = {
              id: `healthy-${Date.now()}`,
              name: plantLabel,
              description: `Pianta apparentemente sana${!isHighConfidence ? ` (accuratezza ${Math.round(confidence * 100)}%)` : ''}`,
              causes: "N/A - Pianta sana",
              symptoms: ["Nessun sintomo di malattia rilevato"],
              treatments: ["Mantenere le cure standard", "Monitoraggio regolare"],
              confidence,
              healthy: true,
              products: enhancedResult.recommendedProducts || [],
              disclaimer: !isHighConfidence
                ? `Identificazione con accuratezza ${Math.round(confidence * 100)}%. Per maggiore certezza sulla salute della pianta, consulta un fitopatologo.`
                : undefined,
              recommendExpertConsultation: !isGoodConfidence,
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
              primaryService: enhancedResult.sources?.[0] || enhancedResult.analysisDetails?.source || "Enhanced AI",
              agreementScore: confidence,
              huggingFaceResult: {
                label: plantLabel,
                score: confidence
              },
              dataSource: "Enhanced Multi-AI Analysis"
            },
            risultatiCompleti: {
              plantInfo: plantInfoToUse,
              accuracyGuarantee: isHighConfidence ? "80%+" : isGoodConfidence ? "60%+" : "40%+"
            },
            identifiedFeatures: [
              plantLabel,
              `Accuratezza: ${Math.round(confidence * 100)}%`,
              isHealthy ? "Pianta sana" : "Possibili problemi rilevati",
              enhancedResult.analysisDetails?.source || "AI Analysis"
            ],
            sistemaDigitaleFoglia: enhancedResult.plantPart === "leaf",
            analysisTechnology: "Enhanced Multi-AI Analysis with Real APIs"
          };

          progressCallback({ stage: 'finalizing', percentage: 98, message: 'Finalizzazione risultati...' });

          return { diseaseInfo, detailedAnalysis, plantLabel, confidence, isGoodConfidence, isHighConfidence };

        } catch (analysisError) {
          console.error('❌ Enhanced analysis error:', analysisError);
          throw analysisError;
        }
      },
      null
    );

    if (analysisResult) {
      const { diseaseInfo, detailedAnalysis, plantLabel, confidence, isGoodConfidence, isHighConfidence } = analysisResult;
      setDiagnosedDisease(diseaseInfo);
      setDiagnosisResult(`${plantLabel} identificata con ${Math.round(confidence * 100)}% di accuratezza`);
      setAnalysisDetails(detailedAnalysis);
      setAnalysisProgress(100);

      // Enhanced user feedback
      if (isHighConfidence) {
        toast.success(`✅ Pianta identificata con alta accuratezza (${Math.round(confidence * 100)}%)!`, { duration: 4000 });
      } else if (isGoodConfidence) {
        toast.success(
          `✅ Pianta identificata con buona accuratezza (${Math.round(confidence * 100)}%). Consulenza esperta raccomandata per maggiore certezza.`,
          { duration: 5000 }
        );
      } else {
        toast.warning(
          `⚠️ Identificazione con accuratezza moderata (${Math.round(confidence * 100)}%). Fortemente consigliata consulenza esperta.`,
          { duration: 6000 }
        );
      }
    } else {
      // Enhanced error handling
      const errorResult = handleAnalysisError(new Error("Analisi non completata - servizi AI non disponibili"));
      const fallbackDisease = createFallbackDiagnosisResult(errorResult);
      setDiagnosedDisease(fallbackDisease);
      setDiagnosisResult("Analisi automatica non disponibile - consulenza esperta raccomandata");
      setAnalysisProgress(0);

      toast.error(errorResult.message, {
        description: "Il nostro fitopatologo Marco Nigro può aiutarti con una diagnosi professionale",
        duration: 8000
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
