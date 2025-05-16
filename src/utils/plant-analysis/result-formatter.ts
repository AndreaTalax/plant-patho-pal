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
    
    // Enhanced plant name detection - use provided name if available
    // Then try to extract from label if no plant name is provided
    let plantName = providedPlantName;
    
    if (!plantName && label) {
      // Try to extract plant name from label if not provided
      const plantLabels = [
        'tomato', 'potato', 'apple', 'corn', 'grape', 'strawberry',
        'pepper', 'lettuce', 'monstera', 'aloe', 'cactus', 'fern', 
        'ficus', 'jade', 'snake plant', 'rose', 'orchid', 'basil',
        'mint', 'rosemary', 'lavender', 'cannabis', 'hemp', 
        'sunflower', 'tulip', 'lily', 'bamboo', 'palm'
      ];
      
      const labelLower = label.toLowerCase();
      const matchedPlant = plantLabels.find(plant => labelLower.includes(plant));
      
      if (matchedPlant) {
        plantName = capitalize(matchedPlant);
      }
    }
    
    // If still no plant name, use generic names based on classification
    if (!plantName && existingInsights?.plantName) {
      plantName = existingInsights.plantName;
    } else if (!plantName) {
      // Determine if this is likely a houseplant or outdoor plant
      const houseplantKeywords = ['pot', 'indoor', 'house', 'potted'];
      const isHouseplant = houseplantKeywords.some(keyword => 
        label.toLowerCase().includes(keyword)
      );
      
      plantName = isHouseplant ? 'Indoor Plant' : 'Garden Plant';
    }
    
    // Determine if plant is healthy with improved accuracy
    // If explicit health status was provided in the result, use that
    // Otherwise, infer from label using expanded disease keywords
    const isHealthy = typeof result.healthy === 'boolean' 
      ? result.healthy 
      : !label.toLowerCase().match(/disease|infected|spot|blight|rot|rust|mildew|virus|bacteria|pest|damage|wilting|unhealthy|infected|deficiency|burned|chlorosis|necrosis|dying/);
    
    // Determine the plant part from the label with improved accuracy
    const detectedPlantPart = result.plantPart || getPlantPartFromLabel(label) || 'whole plant';
    
    // Create or enhance multi-service insights
    const multiServiceInsights = {
      ...existingInsights,
      isHealthy,
      plantName,
      plantPart: detectedPlantPart,
      confidenceLevel: score > 0.8 ? 'high' : score > 0.5 ? 'medium' : 'low',
      huggingFaceResult: {
        label,
        score
      }
    };
    
    // Always consider it a plant if we've gotten this far in the analysis
    // But preserve any detailed verification information if available
    const isPlant = plantVerification?.isPlant || isPlantLabel(label) || true;
    
    // Return formatted result with enhanced properties
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
    
    // Return more informative basic formatted result in case of error
    return {
      label: result.label || 'Unknown',
      score: result.score || 0.5,
      multiServiceInsights: {
        isHealthy: true,
        plantName: 'Unknown Plant',
        plantPart: 'whole plant',
        confidenceLevel: 'low',
        errorDetails: error instanceof Error ? error.message : 'Unknown error'
      },
      plantVerification: {
        isPlant: true,
        confidence: 0.6
      }
    };
  }
};
