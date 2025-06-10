
import { ComputerVisionService, type VisionAnalysisResult } from '@/services/computerVisionService';
import type { AnalysisProgress } from '../../services/aiProviders';
import { toast } from 'sonner';

/**
 * Conducts enhanced AI analysis using computer vision on the provided image file and returns the analysis result.
 * @example
 * sync(imageFile, plantInfo, progressCallback)
 * Promise resolving to the enhanced analysis result.
 * @param {File} imageFile - The image file to be analyzed using computer vision.
 * @param {any} [plantInfo=null] - Optional additional plant information to enhance the analysis result.
 * @param {function} [progressCallback] - Optional callback function to receive progress updates of the analysis.
 * @returns {Promise<any>} A promise that resolves to the enhanced result of the image analysis.
 * @description
 *   - Provides progress updates through the callback function including stages like initialization, processing, and finalizing.
 *   - Handles potential errors during the analysis and relays error messages via the progress callback.
 *   - Transforms the computer vision result into a standard format possibly using additional plant information.
 */
export const analyzeWithEnhancedAI = async (
  imageFile: File,
  plantInfo: any = null,
  progressCallback?: (progress: AnalysisProgress) => void
): Promise<any> => {
  try {
    console.log("🚀 Starting enhanced AI analysis with computer vision...");
    
    progressCallback?.({
      stage: 'initialization',
      percentage: 10,
      message: 'Inizializzazione analisi computer vision...'
    });
    
    // Analisi con computer vision
    progressCallback?.({
      stage: 'computer-vision',
      percentage: 30,
      message: 'Analisi computer vision in corso...'
    });
    
    const visionResult = await ComputerVisionService.analyzeImageWithVision(imageFile);
    
    progressCallback?.({
      stage: 'processing',
      percentage: 70,
      message: 'Elaborazione risultati...'
    });
    
    // Trasformazione in formato compatibile
    const enhancedResult = transformVisionResultToStandardFormat(visionResult, plantInfo);
    
    progressCallback?.({
      stage: 'finalizing',
      percentage: 100,
      message: 'Analisi completata'
    });
    
    console.log("✅ Enhanced analysis completed:", enhancedResult);
    return enhancedResult;
    
  } catch (error) {
    console.error("❌ Enhanced AI analysis failed:", error);
    progressCallback?.({
      stage: 'error',
      percentage: 0,
      message: 'Errore nell\'analisi'
    });
    throw error;
  }
};

// Trasforma il risultato della computer vision nel formato standard
/**
 * Transforms vision analysis results into a standard format for plant information.
 * @example
 * transformVisionResultToStandardFormat(visionResult, plantInfo)
 * returns an object containing standardized plant information including health and disease details.
 * @param {VisionAnalysisResult} visionResult - The result from the computer vision analysis containing plant identification and health assessment details.
 * @param {any} plantInfo - Additional plant information that might be used for enhanced analysis.
 * @returns {any} An object containing standardized plant information including whether the plant is healthy, confidence levels, and details about any detected diseases.
 * @description
 *   - The function extracts key values from the vision result like plant identification and health assessment.
 *   - It constructs a standard format that integrates multi-service insights, visual analysis details, and recommended products.
 *   - Special handling is included for cases where the plant is detected as unhealthy, incorporating disease details and symptoms.
 *   - Enhances the output by providing a broader context from multiple plant analysis services.
 */
function transformVisionResultToStandardFormat(
  visionResult: VisionAnalysisResult, 
  plantInfo: any
): any {
  const { plantIdentification, healthAssessment, visualFeatures, confidence } = visionResult;
  
  // Determina se la pianta è sana
  const isHealthy = healthAssessment.isHealthy;
  
  // Prepara informazioni sulla malattia se presente
  let diseaseInfo = null;
  if (!isHealthy && healthAssessment.diseases.length > 0) {
    const primaryDisease = healthAssessment.diseases[0];
    diseaseInfo = {
      name: primaryDisease.name,
      description: primaryDisease.description,
      confidence: primaryDisease.confidence,
      treatments: primaryDisease.treatment,
      severity: primaryDisease.severity,
      symptoms: [primaryDisease.name, ...visualFeatures.symptoms]
    };
  }
  
  // Risultato nel formato standard
  return {
    label: plantIdentification.plantName,
    confidence: confidence,
    healthy: isHealthy,
    disease: diseaseInfo,
    plantPart: visualFeatures.plantPart,
    scientificName: plantIdentification.scientificName,
    sources: ['Computer Vision', 'Google Cloud Vision', 'Plant.id'],
    analysisDetails: {
      multiServiceInsights: {
        plantName: plantIdentification.plantName,
        plantSpecies: plantIdentification.scientificName,
        plantPart: visualFeatures.plantPart,
        isHealthy: isHealthy,
        isValidPlantImage: true,
        primaryService: "Computer Vision",
        agreementScore: confidence,
        dataSource: visionResult.dataSource
      },
      identifiedFeatures: [
        plantIdentification.plantName,
        `Confidenza: ${Math.round(confidence * 100)}%`,
        `Parte: ${visualFeatures.plantPart}`,
        `Stato: ${isHealthy ? 'Sana' : 'Problematica'}`,
        ...visualFeatures.symptoms
      ],
      plantixInsights: healthAssessment.diseases.length > 0 ? {
        severity: healthAssessment.diseases[0].severity,
        spreadRisk: healthAssessment.diseases[0].severity === 'high' ? 'Alto' : 'Medio',
        environmentalFactors: [`Salute generale: ${Math.round(healthAssessment.overallHealthScore * 100)}%`]
      } : null,
      visualAnalysis: {
        colors: visualFeatures.colors,
        leafCondition: visualFeatures.leafCondition,
        symptoms: visualFeatures.symptoms
      }
    },
    recommendedProducts: getRecommendedProducts(isHealthy, diseaseInfo?.severity),
    enhanced: true,
    computerVisionEnabled: true
  };
}

// Prodotti raccomandati basati sulla diagnosi
/**
 * Returns a list of recommended product IDs based on health status and severity level.
 * @example
 * getRecommendedProducts(true)
 * // Returns ['2', '5']
 * getRecommendedProducts(false, 'medium')
 * // Returns ['1', '3']
 * @param {boolean} isHealthy - Indicates if the plant is healthy or not.
 * @param {string} [severity] - Optional level of severity for unhealthy plants ('high', 'medium', 'low').
 * @returns {string[]} An array of product IDs recommended for the plant condition.
 * @description
 *   - If a plant is healthy, specific maintenance products are returned.
 *   - Severity levels determine the intensity of product recommendations for unhealthy plants.
 */
function getRecommendedProducts(isHealthy: boolean, severity?: string): string[] {
  if (isHealthy) {
    return ['2', '5']; // Prodotti per manutenzione
  }
  
  switch (severity) {
    case 'high':
      return ['1', '3', '4']; // Trattamenti intensivi
    case 'medium':
      return ['1', '3']; // Trattamenti medi
    case 'low':
    default:
      return ['2', '1']; // Trattamenti leggeri
  }
}
