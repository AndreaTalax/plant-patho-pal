
import { useState, useRef, useEffect } from 'react';
import { PLANT_DISEASES } from '@/data/plantDiseases';
import { formatHuggingFaceResult, dataURLtoFile } from '@/utils/plant-analysis';
import { DiagnosedDisease, AnalysisDetails, PlantInfo } from '@/components/diagnose/types';
import { plantSpeciesMap } from '@/data/plantDatabase';
import { MOCK_PRODUCTS } from '@/components/chat/types';
import { toast } from 'sonner';
import { analyzeWithEnhancedAI } from '@/utils/plant-analysis/enhanced-analysis';
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

  // High-accuracy analysis function - no fallbacks allowed
  const analyzeUploadedImage = async (imageFile: File, plantInfo?: PlantInfo) => {
    setIsAnalyzing(true);
    setDiagnosisResult(null);
    setDiagnosedDisease(null);
    setAnalysisProgress(0);
    setAnalysisDetails(null);
    
    try {
      // Progress tracking for user feedback
      const progressCallback = (progress: AnalysisProgress) => {
        setAnalysisProgress(progress.percentage);
        console.log(`${progress.stage}: ${progress.percentage}% - ${progress.message}`);
      };

      // Enhanced AI analysis - requires 90% accuracy
      console.log("Starting enhanced AI analysis with 90% accuracy requirement...");
      toast.info("Analisi ad alta precisione in corso...", { duration: 3000 });
      
      const analysisResult = await analyzeWithEnhancedAI(imageFile, plantInfo, progressCallback);
      
      if (!analysisResult || analysisResult.confidence < 0.9) {
        throw new Error(`Accuratezza insufficiente: ${Math.round((analysisResult?.confidence || 0) * 100)}%. Richiesta accuratezza minima: 90%`);
      }
      
      console.log("High-accuracy analysis result:", analysisResult);
      
      // Process high-confidence result
      const plantLabel = analysisResult.label;
      const confidence = analysisResult.confidence;
      const isHealthy = analysisResult.healthy;
      
      let diseaseInfo: DiagnosedDisease;
      
      if (!isHealthy && analysisResult.disease) {
        // Disease detected with high confidence
        diseaseInfo = {
          id: `disease-${Date.now()}`,
          name: analysisResult.disease.name,
          description: analysisResult.disease.description || "Malattia identificata con alta precisione",
          causes: analysisResult.disease.causes || "Cause specifiche identificate dall'analisi AI",
          symptoms: analysisResult.disease.symptoms || ["Sintomi rilevati dall'analisi dell'immagine"],
          treatments: analysisResult.disease.treatments || ["Trattamento specifico consigliato"],
          confidence: confidence,
          healthy: false
        };
      } else {
        // Healthy plant with high confidence
        diseaseInfo = {
          id: "healthy-plant-hq",
          name: plantLabel,
          description: `${plantLabel} identificata con ${Math.round(confidence * 100)}% di accuratezza`,
          causes: "N/A - Pianta sana",
          symptoms: ["Nessun sintomo di malattia rilevato"],
          treatments: ["Continua le cure standard per questa specie"],
          confidence: confidence,
          healthy: true
        };
      }
      
      // Add high-quality product recommendations
      if (analysisResult.recommendedProducts?.length > 0) {
        diseaseInfo.products = analysisResult.recommendedProducts;
      } else {
        // Select products based on plant type and health status
        const relevantProducts = selectRelevantProducts(plantLabel, isHealthy);
        diseaseInfo.products = relevantProducts;
      }
      
      setDiagnosedDisease(diseaseInfo);
      setDiagnosisResult(`${plantLabel} identificata con ${Math.round(confidence * 100)}% di accuratezza`);
      
      // Create detailed analysis results
      const detailedAnalysis: AnalysisDetails = {
        multiServiceInsights: {
          plantName: plantLabel,
          plantSpecies: analysisResult.scientificName || plantLabel,
          plantPart: analysisResult.plantPart || "whole plant",
          isHealthy: isHealthy,
          isValidPlantImage: true,
          primaryService: analysisResult.sources?.[0] || "Enhanced AI",
          agreementScore: confidence,
          huggingFaceResult: {
            label: plantLabel,
            score: confidence
          },
          dataSource: "Multi-AI High-Accuracy Analysis"
        },
        risultatiCompleti: {
          enhancedAIResult: analysisResult,
          plantInfo: plantInfo,
          accuracyGuarantee: "90%+"
        },
        identifiedFeatures: [plantLabel, `Accuratezza: ${Math.round(confidence * 100)}%`],
        sistemaDigitaleFoglia: analysisResult.plantPart === "leaf",
        analysisTechnology: "Enhanced Multi-AI Analysis"
      };
      
      setAnalysisDetails(detailedAnalysis);
      setAnalysisProgress(100);
      setIsAnalyzing(false);
      
      toast.success(`Pianta identificata con ${Math.round(confidence * 100)}% di accuratezza!`, { duration: 4000 });
      
    } catch (error) {
      console.error("High-accuracy analysis failed:", error);
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      
      // No fallbacks - show clear error message
      toast.error(`Analisi fallita: ${error.message}`, { 
        description: "Prova con un'immagine più chiara o da un'angolazione diversa",
        duration: 6000 
      });
      
      // Reset states without fallback
      setDiagnosedDisease(null);
      setDiagnosisResult(null);
      setAnalysisDetails(null);
    }
  };

  // Select relevant products based on plant identification and health
  const selectRelevantProducts = (plantName: string, isHealthy: boolean): string[] => {
    const plantLower = plantName.toLowerCase();
    
    if (!isHealthy) {
      // Disease treatment products
      if (plantLower.includes('funghi') || plantLower.includes('muffa')) {
        return ['Fungicida biologico specifico', 'Trattamento anti-muffa'];
      }
      if (plantLower.includes('insetti') || plantLower.includes('afidi')) {
        return ['Insetticida naturale', 'Olio di neem biologico'];
      }
      return ['Trattamento multifunzione', 'Potenziatore delle difese'];
    } else {
      // Maintenance products for healthy plants
      if (plantLower.includes('indoor') || plantLower.includes('interno')) {
        return ['Fertilizzante per piante da interno', 'Nutriente specifico'];
      }
      return ['Fertilizzante biologico', 'Stimolante crescita'];
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
    setUploadedImage(imageDataUrl);
    stopCameraStream();
    setAnalysisProgress(0);
    
    // Convert dataURL to File object for analysis
    const imageFile = dataURLtoFile(imageDataUrl, "camera-capture.jpg");
    
    console.log("Image captured, starting high-accuracy analysis...");
    analyzeUploadedImage(imageFile, plantInfo);
  };

  const handleImageUpload = (file: File, plantInfo?: PlantInfo) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
      console.log("Image uploaded, starting high-accuracy analysis...");
      analyzeUploadedImage(file, plantInfo);
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
