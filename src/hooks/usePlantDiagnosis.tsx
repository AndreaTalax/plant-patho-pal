
import { useState, useRef, useEffect } from 'react';
import { PLANT_DISEASES } from '@/data/plantDiseases';
import { formatHuggingFaceResult, dataURLtoFile, analyzePlantImage } from '@/utils/plant-analysis';
import { DiagnosedDisease, AnalysisDetails } from '@/components/diagnose/types';
import { plantSpeciesMap } from '@/data/plantDatabase';
import { MOCK_PRODUCTS } from '@/components/chat/types';
import { fileToBase64WithoutPrefix } from '@/utils/plant-analysis/plant-id-service';
import { toast } from 'sonner';

export const usePlantDiagnosis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<string | null>(null);
  const [diagnosedDisease, setDiagnosedDisease] = useState<DiagnosedDisease | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisDetails, setAnalysisDetails] = useState<AnalysisDetails | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const streamRef = useRef<MediaStream | null>(null);

  // Sempre ritorna true per elaborare qualsiasi immagine - massima tolleranza
  const verifyImageContainsPlant = async (imageFile: File): Promise<boolean> => {
    return true;
  };

  const analyzeUploadedImage = async (imageFile: File) => {
    setIsAnalyzing(true);
    setDiagnosisResult(null);
    setDiagnosedDisease(null);
    setAnalysisProgress(0);
    setAnalysisDetails(null);
    
    try {
      // Simulazione rapida del progresso per feedback visivo all'utente
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          const newProgress = prev + Math.random() * 20; // Veloce ma non troppo
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 100);

      // Chiama il vero servizio di analisi invece di usare dati simulati
      console.log("Calling Plant.id analysis API with image...");
      const analysisResult = await analyzePlantImage(imageFile);
      
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      
      if (!analysisResult) {
        toast.error("Errore durante l'analisi dell'immagine");
        setIsAnalyzing(false);
        return;
      }
      
      console.log("Analysis result from Plant.id:", analysisResult);
      
      // Usa i dati reali da Plant.id API e altri servizi se disponibili
      if (analysisResult.plantIdResult) {
        console.log("Detected Plant.id results:", analysisResult.plantIdResult);
      }
      
      // Estrai i dati sulla malattia dalla risposta API reale
      const isHealthy = analysisResult.healthy === true;
      const diseaseName = isHealthy ? "Pianta sana" : analysisResult.label || "Malattia sconosciuta";
      const confidence = analysisResult.score || 0.7;
      
      let diseaseInfo: DiagnosedDisease | null = null;
      
      // Cerca corrispondenze nel nostro database di malattie se non è sana
      if (!isHealthy) {
        // Trova la malattia più simile dal database
        const matchingDisease = PLANT_DISEASES.find(d => 
          d.name.toLowerCase().includes(analysisResult.label?.toLowerCase()) || 
          analysisResult.label?.toLowerCase().includes(d.name.toLowerCase())
        );
        
        if (matchingDisease) {
          diseaseInfo = {
            ...matchingDisease,
            confidence: confidence
          };
        } else {
          // Crea un oggetto malattia basato sui dati API
          diseaseInfo = {
            id: `disease-${Date.now()}`,
            name: diseaseName,
            description: "Descrizione non disponibile",
            causes: "Cause non specificate",
            symptoms: ["Sintomi visibili sull'immagine"],
            treatments: ["Consultare un esperto"],
            confidence: confidence,
            healthy: isHealthy
          };
        }
      } else {
        // Se è una pianta sana
        diseaseInfo = {
          id: "healthy-plant",
          name: "Pianta sana",
          description: "La pianta sembra sana basata sull'analisi dell'immagine.",
          causes: "N/A",
          symptoms: ["Nessun sintomo rilevato"],
          treatments: ["Continua con le normali pratiche di cura"],
          confidence: confidence,
          healthy: true
        };
      }
      
      // Se ci sono prodotti consigliati nell'API, usali
      if (analysisResult.recommendedProducts && analysisResult.recommendedProducts.length > 0) {
        diseaseInfo.products = analysisResult.recommendedProducts.map(p => p.name || p.toString());
      } else {
        // Altrimenti usa prodotti simulati
        const recommendedProducts = MOCK_PRODUCTS
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.floor(Math.random() * 2) + 2);
        diseaseInfo.products = recommendedProducts.map(p => p.name);
      }
      
      setDiagnosedDisease(diseaseInfo);
      setDiagnosisResult(`Rilevato ${diseaseName} con ${Math.round(confidence * 100)}% di confidenza.`);
      
      // Imposta i dettagli dell'analisi usando i dati reali
      setAnalysisDetails(analysisResult);
      
      setIsAnalyzing(false);
      
    } catch (error) {
      console.error("Error during image analysis:", error);
      
      // Gestione dell'errore e fornitura di un fallback
      toast.error(`Errore durante l'analisi: ${(error as Error).message || 'Errore sconosciuto'}`);
      
      // Fallback a una diagnosi di emergenza
      const emergencyDisease = PLANT_DISEASES[Math.floor(Math.random() * PLANT_DISEASES.length)];
      
      setDiagnosisResult(`Errore di analisi, usando risultato di emergenza: ${emergencyDisease.name}`);
      setDiagnosedDisease({
        ...emergencyDisease,
        confidence: 0.5,
        products: MOCK_PRODUCTS.slice(0, 2).map(p => p.name)
      });
      
      setAnalysisDetails({
        multiServiceInsights: {
          plantName: "Pianta",
          isHealthy: false,
          isValidPlantImage: true,
          leafAnalysis: {
            healthStatus: 'unknown',
            diseaseConfidence: 0.5,
            leafColor: 'variable'
          }
        },
        identifiedFeatures: ["Analisi di fallback", "Diagnosi d'emergenza"],
      });
      
      setIsAnalyzing(false);
      setAnalysisProgress(100);
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

  const captureImage = (imageDataUrl: string) => {
    setUploadedImage(imageDataUrl);
    stopCameraStream();
    setAnalysisProgress(0);
    
    // Convert dataURL to File object for analysis
    const imageFile = dataURLtoFile(imageDataUrl, "camera-capture.jpg");
    
    // Log the capture for debugging
    console.log("Image captured, size:", imageFile.size, "bytes");
    console.log("Starting image analysis...");
    
    analyzeUploadedImage(imageFile);
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
      console.log("Image uploaded, size:", file.size, "bytes");
      console.log("Starting image analysis...");
      analyzeUploadedImage(file);
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
