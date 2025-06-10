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

/**
 * Provides functionalities for plant disease diagnosis, analysis, and image processing.
 * @example
 * const { captureImage } = usePlantDiagnosis();
 * captureImage("data:image/png;base64,...", plantInfo);
 * 
 * @param {File} imageFile - The image file to be analyzed.
 * @param {PlantInfo} [plantInfo] - Optional parameter providing additional plant information for analysis.
 * 
 * @returns {Object} An object containing various states and functions related to plant diagnosis and image analysis.
 * @description
 *   - Utilizes enhanced AI analysis to determine plant health with a confidence requirement of 60% or more.
 *   - Handles image capture from camera or file upload, and initiates analysis automatically.
 *   - Tracks progress and provides feedback on the analysis process using toast notifications.
 *   - Provides recommendations for plant care or disease treatment based on analysis results.
 */
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
  /**
   * Performs a flexible plant analysis using enhanced AI, updating progress and results.
   * @example
   * sync(imageFile, plantInfo)
   * Returns detailed analysis results and diagnosis of the plant with accuracy percentage.
   * @param {File} imageFile - The image of the plant to be analyzed, must be a valid File object.
   * @param {PlantInfo} [plantInfo] - Optional information about the plant to aid in analysis.
   * @returns {AnalysisResult} An object containing disease information, analysis details, and confidence level.
   * @description
   *   - Uses an enhanced AI analysis with a flexible accuracy requirement lowered to 60%.
   *   - Progress is tracked and capped at 95% until complete for user feedback.
   *   - Provides recommendations for products and advises expert consultation if high confidence is not reached.
   *   - Handles errors gracefully with fallback diagnosis and professional consultation suggestion.
   */
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
  /**
   * Provides a list of product codes based on plant name and health status.
   * @example
   * getProductCodes('Rose', true)
   * // Returns ['2', '1']
   * @param {string} plantName - Name of the plant.
   * @param {boolean} isHealthy - Indicates if the plant is healthy.
   * @returns {string[]} Array of product codes tailored to the plant's needs.
   * @description
   *   - Returns default products if the plant name is invalid.
   *   - Identifies specific product codes for diseases or pests.
   *   - Offers different product codes for indoor plants.
   */
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

  /**
   * Processes captured image data URL and analyzes it for plant diagnosis.
   * @example
   * imageDataUrl('data:image/jpeg;base64,...', { plantId: 123, species: 'Rose' })
   * undefined
   * @param {string} imageDataUrl - Base64 encoded image data URL representing the captured image.
   * @param {PlantInfo} [plantInfo] - Optional plant specific information for more tailored analysis.
   * @returns {undefined} No return value.
   * @description
   *   - Displays an error toast if imageDataUrl is invalid.
   *   - Converts the image data URL to a File object for further analysis.
   *   - Stops the camera stream after capturing the image.
   *   - Resets analysis progress before starting the image analysis.
   */
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

  /**
   * Handles the uploading and analysis of an image file for plant diagnosis.
   * @example
   * functionName(file, plantInfo)
   * undefined
   * @param {File} file - The image file to be uploaded and analyzed.
   * @param {PlantInfo} [plantInfo] - Optional additional information about the plant.
   * @returns {void} This function does not return a value.
   * @description
   *   - Displays an error toast message if no file is selected or if there is an error reading the file.
   *   - Utilizes a FileReader to read the file as a data URL for further processing.
   *   - Invokes `analyzeUploadedImage` function after successful image upload.
   */
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
