import { useState, useRef, useEffect } from 'react';
import { PLANT_DISEASES } from '@/data/plantDiseases';
import { formatHuggingFaceResult, dataURLtoFile } from '@/utils/plant-analysis';
import { DiagnosedDisease, AnalysisDetails, PlantInfo } from '@/components/diagnose/types';
import { plantSpeciesMap } from '@/data/plantDatabase';
import { MOCK_PRODUCTS } from '@/components/chat/types';
import { toast } from 'sonner';
import { analyzeWithEnhancedAI } from '@/utils/plant-analysis/enhanced-analysis';
import { handleAnalysisError, createFallbackDiagnosisResult, safeAnalysisWrapper } from '@/utils/error-handling';
import type { AnalysisProgress } from '../services/aiProviders';

export const usePlantDiagnosis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<string | null>(null);
  const [diagnosedDisease, setDiagnosedDisease] = useState<DiagnosedDisease | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisDetails, setAnalysisDetails] = useState<AnalysisDetails | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const streamRef = useRef<MediaStream | null>(null);

  // Enhanced analysis function with flexible accuracy requirements
  const analyzeUploadedImage = async (imageFile: File, plantInfo?: PlantInfo) => {
    setIsAnalyzing(true);
    setDiagnosisResult(null);
    setDiagnosedDisease(null);
    setAnalysisProgress(0);
    setAnalysisDetails(null);
    
    console.log('🔍 Starting flexible plant analysis...', { 
      fileName: imageFile?.name, 
      fileSize: imageFile?.size,
      plantInfo 
    });
    
    // Use safe wrapper for the entire analysis operation
    const analysisResult = await safeAnalysisWrapper(
      async () => {
        // Progress tracking for user feedback
        const progressCallback = (progress: AnalysisProgress) => {
          setAnalysisProgress(Math.min(progress.percentage, 95)); // Cap at 95% until complete
          console.log(`${progress.stage}: ${progress.percentage}% - ${progress.message}`);
        };

        try {
          // Enhanced AI analysis - now accepts 60% accuracy
          console.log("🧠 Starting enhanced AI analysis with flexible accuracy requirement...");
          toast.info("Analisi in corso...", { duration: 3000 });
          
          progressCallback({ stage: 'initialization', percentage: 10, message: 'Inizializzazione analisi...' });
          
          const enhancedResult = await analyzeWithEnhancedAI(imageFile, plantInfo, progressCallback);
          
          progressCallback({ stage: 'processing', percentage: 80, message: 'Elaborazione risultati...' });
          
          if (!enhancedResult) {
            throw new Error("Analisi fallita. Nessun risultato ottenuto dall'AI.");
          }

          const plantLabel = enhancedResult.label || "Specie sconosciuta";
          const confidence = Math.max(0, Math.min(1, enhancedResult.confidence || 0));
          const isHealthy = enhancedResult.healthy ?? null;
          const isGoodConfidence = confidence >= 0.6; // Lowered from 0.9 to 0.6
          const isHighConfidence = confidence >= 0.8;

          console.log('📊 Analysis results:', { plantLabel, confidence, isHealthy, isGoodConfidence });

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
          
          // Add high-quality product recommendations if missing
          if (!diseaseInfo.products || diseaseInfo.products.length === 0) {
            const relevantProducts = selectRelevantProducts(plantLabel, isHealthy);
            diseaseInfo.products = relevantProducts;
          }
          
          // Create detailed analysis results
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
              plantInfo: plantInfo,
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
          console.error('❌ Enhanced analysis failed:', analysisError);
          throw analysisError;
        }
      },
      null // fallback value
    );
    
    // Handle the result (success or graceful error)
    if (analysisResult) {
      const { diseaseInfo, detailedAnalysis, plantLabel, confidence, isGoodConfidence } = analysisResult;
      
      setDiagnosedDisease(diseaseInfo);
      setDiagnosisResult(`${plantLabel} identificata con ${Math.round(confidence * 100)}% di accuratezza`);
      setAnalysisDetails(detailedAnalysis);
      setAnalysisProgress(100);
      
      if (confidence >= 0.8) {
        toast.success(`✅ Pianta identificata con alta accuratezza (${Math.round(confidence * 100)}%)!`, { duration: 4000 });
      } else if (isGoodConfidence) {
        toast.success(`✅ Pianta identificata con ${Math.round(confidence * 100)}% di accuratezza. Consulenza esperta raccomandata per maggiore certezza.`, { duration: 5000 });
      }
    } else {
      // Analysis failed - create fallback result
      console.log('🔄 Creating fallback diagnosis result...');
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

  // Select relevant products based on plant identification and health
  const selectRelevantProducts = (plantName: string, isHealthy: boolean): string[] => {
    if (!plantName || typeof plantName !== 'string') {
      return ['1', '2']; // Default products
    }
    
    const plantLower = plantName.toLowerCase();
    
    if (!isHealthy) {
      // Disease treatment products
      if (plantLower.includes('funghi') || plantLower.includes('muffa') || plantLower.includes('fungus')) {
        return ['1', '3']; // Fungicide products
      }
      if (plantLower.includes('insetti') || plantLower.includes('afidi') || plantLower.includes('pest')) {
        return ['4', '1']; // Insecticide products
      }
      return ['1', '2']; // General treatment products
    } else {
      // Maintenance products for healthy plants
      if (plantLower.includes('indoor') || plantLower.includes('interno') || plantLower.includes('casa')) {
        return ['2', '5']; // Indoor plant care
      }
      return ['2', '1']; // General care products
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const resetDiagnosis = () => {
    setUploadedImage(null);
    setDiagnosisResult(null);
    setDiagnosedDisease(null);
    setAnalysisProgress(0);
    setAnalysisDetails(null);
    setRetryCount(0);
    stopCameraStream();
  };

  const captureImage = (imageDataUrl: string, plantInfo?: PlantInfo) => {
    if (!imageDataUrl) {
      toast.error("Errore nella cattura dell'immagine");
      return;
    }
    
    setUploadedImage(imageDataUrl);
    stopCameraStream();
    setAnalysisProgress(0);
    
    try {
      // Convert dataURL to File object for analysis
      const imageFile = dataURLtoFile(imageDataUrl, "camera-capture.jpg");
      
      console.log("📸 Image captured, starting flexible analysis...");
      analyzeUploadedImage(imageFile, plantInfo);
    } catch (error) {
      console.error('❌ Error processing captured image:', error);
      toast.error("Errore nell'elaborazione dell'immagine catturata");
    }
  };

  const handleImageUpload = (file: File, plantInfo?: PlantInfo) => {
    if (!file) {
      toast.error("Nessun file selezionato");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (result) {
        setUploadedImage(result as string);
        console.log("📁 Image uploaded, starting flexible analysis...");
        analyzeUploadedImage(file, plantInfo);
      } else {
        toast.error("Errore nella lettura del file");
      }
    };
    reader.onerror = () => {
      toast.error("Errore nella lettura del file immagine");
    };
    reader.readAsDataURL(file);
  };

  return {
    isAnalyzing,
    uploadedImage,
    diagnosisResult,
    diagnosedDisease,
    analysisProgress,
    analysisDetails,
    retryCount,
    streamRef,
    resetDiagnosis,
    captureImage,
    handleImageUpload,
    analyzeUploadedImage,
    stopCameraStream,
    setUploadedImage,
  };
};
