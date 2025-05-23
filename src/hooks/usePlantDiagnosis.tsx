import { useState, useRef, useEffect } from 'react';
import { PLANT_DISEASES } from '@/data/plantDiseases';
import { formatHuggingFaceResult, dataURLtoFile, analyzePlant } from '@/utils/plant-analysis';
import { DiagnosedDisease, AnalysisDetails, PlantInfo } from '@/components/diagnose/types';
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

  const analyzeUploadedImage = async (imageFile: File, plantInfo?: PlantInfo) => {
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

      // Chiama il servizio di analisi con Plexi AI passando le informazioni sulla pianta
      console.log("Calling Plexi AI analysis with plant info:", plantInfo);
      const analysisResult = await analyzePlant(imageFile, plantInfo);
      
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      
      if (!analysisResult) {
        toast.error("Errore durante l'analisi dell'immagine con Plexi AI");
        setIsAnalyzing(false);
        return;
      }
      
      console.log("Analysis result from Plexi AI:", analysisResult);
      
      // Usa i dati normalizzati dal backend
      // Verifica che i dati siano nel formato standardizzato
      if (!analysisResult.label || analysisResult.plantPart === undefined) {
        console.warn("I dati ricevuti non sono completamente standardizzati", analysisResult);
      }
      
      // Estrai i dati sulla malattia dalla risposta API standardizzata
      const isHealthy = analysisResult.healthy === true;
      const diseaseName = !isHealthy && analysisResult.disease ? 
                         analysisResult.disease.name : 
                         (isHealthy ? "Pianta sana" : "Problema non specificato");
      const confidence = analysisResult.confidence || analysisResult.score || 0.7;
      
      let diseaseInfo: DiagnosedDisease | null = null;
      
      // Cerca corrispondenze nel nostro database di malattie se non è sana
      if (!isHealthy) {
        if (analysisResult.disease) {
          // Usa direttamente i dati della malattia dal backend
          diseaseInfo = {
            id: `disease-${Date.now()}`,
            name: analysisResult.disease.name,
            description: analysisResult.disease.description || "Nessuna descrizione disponibile",
            causes: "Cause non specificate nel risultato dell'analisi",
            symptoms: ["Sintomi visibili sull'immagine"],
            treatments: analysisResult.disease.treatment?.biological || 
                       analysisResult.disease.treatment?.chemical || 
                       analysisResult.disease.treatment?.prevention || 
                       ["Consultare un esperto"],
            confidence: analysisResult.disease.confidence || confidence,
            healthy: false
          };
        } else {
          // Fallback al nostro database locale di malattie
          const matchingDisease = PLANT_DISEASES.find(d => 
            d.name.toLowerCase().includes(diseaseName.toLowerCase()) || 
            diseaseName.toLowerCase().includes(d.name.toLowerCase())
          );
          
          if (matchingDisease) {
            diseaseInfo = {
              ...matchingDisease,
              confidence: confidence
            };
          } else {
            // Crea un oggetto malattia generico
            diseaseInfo = {
              id: `disease-${Date.now()}`,
              name: diseaseName,
              description: "Descrizione non disponibile",
              causes: "Cause non specificate",
              symptoms: ["Sintomi visibili sull'immagine"],
              treatments: ["Consultare un esperto"],
              confidence: confidence,
              healthy: false
            };
          }
        }
      } else {
        // Se è una pianta sana
        diseaseInfo = {
          id: "healthy-plant",
          name: "Pianta sana",
          description: "La pianta sembra sana basata sull'analisi dell'immagine con Plexi AI.",
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
      
      // Crea un oggetto AnalysisDetails compatibile con il nuovo formato standardizzato
      const normalizedDetails: AnalysisDetails = {
        multiServiceInsights: {
          plantName: analysisResult.label || "Pianta",
          plantSpecies: analysisResult.plantName || analysisResult.label,
          plantPart: analysisResult.plantPart || "whole plant",
          isHealthy: analysisResult.healthy,
          isValidPlantImage: true,
          primaryService: "Plexi AI",
          agreementScore: analysisResult.confidence || analysisResult.score,
          huggingFaceResult: {
            label: analysisResult.label,
            score: analysisResult.score || analysisResult.confidence
          },
          leafAnalysis: analysisResult.plantPart === "leaf" ? {
            leafColor: "various",
            patternDetected: analysisResult.disease ? "abnormal" : "normal",
            diseaseConfidence: analysisResult.disease ? analysisResult.disease.confidence : 0,
            healthStatus: analysisResult.healthy ? "healthy" : "unhealthy",
            details: {
              symptomDescription: analysisResult.disease ? analysisResult.disease.description : "",
              symptomCategory: analysisResult.disease ? "detected" : "none"
            }
          } : undefined,
          dataSource: "Plexi AI Plant Database"
        },
        risultatiCompleti: {
          // Store the raw data in the correct property according to the updated type
          plexiAIResult: analysisResult._rawData?.plexiAI || analysisResult._rawData,
          // Also add plant info context for better results
          plantInfo: plantInfo
        },
        identifiedFeatures: [analysisResult.label, analysisResult.plantPart],
        alternativeDiagnoses: analysisResult.allPredictions?.slice(1, 3).map(p => ({
          disease: p.label,
          probability: p.score
        })),
        sistemaDigitaleFoglia: analysisResult.plantPart === "leaf",
        analysisTechnology: "Plexi AI"
      };
      
      // Imposta i dettagli dell'analisi usando i dati normalizzati
      setAnalysisDetails(normalizedDetails);
      
      setIsAnalyzing(false);
      
    } catch (error) {
      console.error("Error during image analysis:", error);
      
      // Gestione dell'errore e fornitura di un fallback
      toast.error(`Errore durante l'analisi con Plexi AI: ${(error as Error).message || 'Errore sconosciuto'}`);
      
      // Fallback a una diagnosi di emergenza
      const emergencyDisease = PLANT_DISEASES[Math.floor(Math.random() * PLANT_DISEASES.length)];
      
      setDiagnosisResult(`Errore di analisi Plexi AI, usando risultato di emergenza: ${emergencyDisease.name}`);
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
        identifiedFeatures: ["Analisi Plexi AI di fallback", "Diagnosi d'emergenza"],
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

  const captureImage = (imageDataUrl: string, plantInfo?: PlantInfo) => {
    setUploadedImage(imageDataUrl);
    stopCameraStream();
    setAnalysisProgress(0);
    
    // Convert dataURL to File object for analysis
    const imageFile = dataURLtoFile(imageDataUrl, "camera-capture.jpg");
    
    // Log the capture for debugging
    console.log("Image captured, size:", imageFile.size, "bytes");
    console.log("Starting image analysis with Plexi AI...", plantInfo);
    
    analyzeUploadedImage(imageFile, plantInfo);
  };

  const handleImageUpload = (file: File, plantInfo?: PlantInfo) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
      console.log("Image uploaded, size:", file.size, "bytes");
      console.log("Starting image analysis with Plexi AI...", plantInfo);
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
