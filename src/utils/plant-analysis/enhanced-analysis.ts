
import { ComputerVisionService, type VisionAnalysisResult } from '@/services/computerVisionService';
import type { AnalysisProgress } from '../../services/aiProviders';
import { toast } from 'sonner';

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
