
import { getPlantPartFromLabel, capitalize, isPlantLabel } from './plant-part-utils';

/**
 * Formats the raw HuggingFace analysis result into a more structured format
 * @param result The raw result from HuggingFace or combined APIs
 * @returns A formatted analysis result with additional insights
 */
export const formatHuggingFaceResult = (result: any) => {
  if (!result) {
    return null;
  }

  try {
    // Extract basic information
    const {
      label = 'Unknown',
      score = 0.5,
      plantVerification,
      leafVerification,
      multiServiceInsights: existingInsights,
      plantName: providedPlantName
    } = result;
    
    // Determine plant name - use provided name if available
    const plantName = providedPlantName || existingInsights?.plantName || 'Unknown Plant';
    
    // Determine if plant is healthy - assume healthy if not explicitly marked as unhealthy
    const isHealthy = typeof result.healthy === 'boolean' 
      ? result.healthy 
      : label.toLowerCase().includes('healthy') || !label.toLowerCase().match(/disease|infected|spot|blight|rot|rust|mildew/);
    
    // Determine the plant part from the label
    const detectedPlantPart = result.plantPart || getPlantPartFromLabel(label) || 'whole plant';
    
    // Create or enhance multi-service insights
    const multiServiceInsights = {
      ...existingInsights,
      isHealthy,
      plantName,
      plantPart: detectedPlantPart,
      huggingFaceResult: {
        label,
        score
      }
    };
    
    // Always consider it a plant if we've gotten this far in the analysis
    const isPlant = plantVerification?.isPlant || isPlantLabel(label) || true;
    
    // Return formatted result
    return {
      ...result,
      multiServiceInsights,
      plantVerification: {
        ...plantVerification,
        isPlant
      }
    };
  } catch (error) {
    console.error('Error formatting HuggingFace result:', error);
    
    // Return basic formatted result in case of error
    return {
      label: result.label || 'Unknown',
      score: result.score || 0.5,
      multiServiceInsights: {
        isHealthy: true,
        plantName: 'Unknown Plant',
        plantPart: 'whole plant'
      },
      plantVerification: {
        isPlant: true,
        confidence: 0.6
      }
    };
  }
};
