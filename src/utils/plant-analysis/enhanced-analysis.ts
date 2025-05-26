
import { EnhancedPlantAnalysisService } from '../../services/enhancedPlantAnalysisService';
import type { CombinedAnalysisResult, AnalysisProgress } from '../../services/aiProviders';
import { PlantInfo } from '@/components/diagnose/types';

// Funzione per convertire i risultati del nuovo sistema nel formato esistente
export const convertToLegacyFormat = (result: CombinedAnalysisResult, plantInfo?: PlantInfo) => {
  const { mostLikelyPlant, mostLikelyDisease } = result.consensus;
  
  return {
    label: mostLikelyPlant.plantName,
    plantPart: 'whole plant',
    healthy: !mostLikelyDisease || mostLikelyDisease.confidence < 0.5,
    disease: mostLikelyDisease ? {
      name: mostLikelyDisease.disease,
      confidence: mostLikelyDisease.confidence,
      description: `Sintomi rilevati: ${mostLikelyDisease.symptoms.join(', ')}`,
      treatment: {
        biological: mostLikelyDisease.treatments,
        chemical: [],
        prevention: []
      }
    } : undefined,
    score: result.consensus.confidenceScore,
    confidence: result.consensus.confidenceScore,
    plantName: mostLikelyPlant.plantName,
    scientificName: mostLikelyPlant.scientificName,
    habitat: mostLikelyPlant.habitat,
    careInstructions: mostLikelyPlant.careInstructions ? {
      watering: mostLikelyPlant.careInstructions[0],
      light: mostLikelyPlant.careInstructions[1],
      soil: mostLikelyPlant.careInstructions[2],
    } : undefined,
    sources: result.plantIdentification.map(p => p.provider),
    plantInfoContext: plantInfo,
    multiServiceAnalysis: true,
    allResults: {
      identifications: result.plantIdentification,
      diseases: result.diseaseDetection
    }
  };
};

// Funzione principale per l'analisi potenziata
export const analyzeWithEnhancedAI = async (
  imageFile: File, 
  plantInfo?: PlantInfo,
  onProgress?: (progress: AnalysisProgress) => void
) => {
  try {
    // Converte il file in base64
    const imageData = await fileToDataURL(imageFile);
    
    // Esegue l'analisi con il nuovo sistema
    const result = await EnhancedPlantAnalysisService.analyzeImage(imageData, onProgress);
    
    // Converte nel formato esistente per compatibilità
    return convertToLegacyFormat(result, plantInfo);
    
  } catch (error) {
    console.error('Enhanced AI analysis failed:', error);
    throw error;
  }
};

// Utility per convertire File in DataURL
const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
