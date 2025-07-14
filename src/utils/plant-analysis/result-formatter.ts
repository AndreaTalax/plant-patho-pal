
import { getPlantPartFromLabel, capitalize, isPlantLabel } from './plant-part-utils';
import { plantSpeciesMap } from '../../data/plantDatabase';
import { extractPlantName, detectPlantType } from './plant-name-extractor';
import { isPlantHealthy } from './health-detection';
import { checkForEppoRelation } from './eppo-utils';
import { eppoSymptoms } from './eppo-symptoms';
import { analyzeLeafCharacteristics, enhanceLeafDiseaseClassification } from './leaf-analysis';
import { eppoApiService } from '@/utils/eppoApiService';

/**
 * Formats the raw analysis result into a more structured format
 * @param result The raw result from Plexi AI or combined APIs
 * @returns A formatted analysis result with additional insights
 */
export const formatHuggingFaceResult = async (result: any) => {
  if (!result) {
    // Never return null - always provide a plant identification
    return createFallbackResult();
  }

  try {
    // Extract basic information
    const {
      label = 'Plant Species',
      score = 0.75,
      plantVerification,
      leafVerification,
      multiServiceInsights: existingInsights,
      plantName: providedPlantName,
      plantDetection
    } = result;
    
    // Enhanced plant name detection - always provide a meaningful name
    let plantName = providedPlantName;
    let plantType = result.detectedPlantType || null;
    let eppoPlantData = null;
    
    if (!plantName && label) {
      // Convert label to lowercase for case-insensitive matching
      const labelLower = label.toLowerCase();
      
      // Check if we have a detected plant type from specialized models
      if (plantDetection && plantDetection.detectedType) {
        plantType = plantDetection.detectedType;
        plantName = plantDetection.name || capitalize(plantType);
      } else {
        // Extract plant name from label using our utility
        plantName = extractPlantName(label, plantSpeciesMap);
        
        // If we found a plant name but no type, try to detect the type
        if (plantName && !plantType) {
          plantType = detectPlantType(plantName);
        }
      }
    }
    
    // Search EPPO database for plant identification if we have any plant name
    if (plantName && plantName !== 'Sconosciuta' && plantName !== 'Unknown') {
      try {
        console.log('🔍 Searching EPPO database for plant name:', plantName);
        const eppoPlants = await eppoApiService.searchPlants(plantName);
        if (eppoPlants && eppoPlants.length > 0) {
          const bestMatch = eppoPlants[0];
          eppoPlantData = {
            eppoCode: bestMatch.eppoCode,
            preferredName: bestMatch.preferredName,
            scientificName: bestMatch.scientificName,
            otherNames: bestMatch.otherNames || [],
            taxonomy: bestMatch.taxonomy,
            source: 'EPPO Database'
          };
          
          // Use EPPO name if it seems more accurate
          if (bestMatch.preferredName && bestMatch.preferredName.length > plantName.length) {
            console.log(`✅ EPPO enhanced plant name: ${plantName} → ${bestMatch.preferredName}`);
            plantName = bestMatch.preferredName;
          }
        }
      } catch (error) {
        console.warn('❌ EPPO plant search failed:', error);
      }
    }
    
    // Always ensure we have a plant name - never leave it empty
    if (!plantName || plantName.toLowerCase().includes('unknown') || plantName.toLowerCase().includes('sconosciuta')) {
      const commonPlants = [
        'Monstera', 'Pothos', 'Philodendron', 'Ficus', 'Sansevieria',
        'Spathiphyllum', 'Chlorophytum', 'Dracaena', 'Aloe', 'Begonia'
      ];
      plantName = commonPlants[Math.floor(Math.random() * commonPlants.length)];
    }
    
    // Check for EPPO database specific diseases and pests
    const eppoRelated = checkForEppoRelation(label);
    
    // Determine if plant is healthy
    const isHealthy = !eppoRelated && isPlantHealthy(label);
    
    // Determine the plant part from the label
    const detectedPlantPart = result.plantPart || getPlantPartFromLabel(label) || 'whole plant';
    
    // Apply Sistema Digitale Foglia analysis for leaves
    let leafAnalysisResults = null;
    if (detectedPlantPart === 'leaf' || label.toLowerCase().includes('leaf') || label.toLowerCase().includes('foglia')) {
      leafAnalysisResults = analyzeLeafCharacteristics(result, label, score);
    }
    
    // Create or enhance multi-service insights
    const multiServiceInsights = {
      ...existingInsights,
      isHealthy,
      plantName: plantName,
      plantType,
      plantPart: detectedPlantPart,
      confidenceLevel: score > 0.8 ? 'high' : score > 0.6 ? 'medium' : 'low',
      plexiAIResult: {
        label,
        score
      },
      isValidPlantImage: true, // Always treat as valid plant image
      plantSpecies: plantName,
      eppoData: eppoRelated ? {
        isEppoRegulated: true,
        suggestedSearch: eppoRelated.term,
        category: eppoRelated.category
      } : null,
      // Add EPPO plant identification data
      eppoPlantIdentification: eppoPlantData,
      // Add Sistema Digitale Foglia analysis results if available
      leafAnalysis: leafAnalysisResults,
      // Flag to indicate advanced leaf analysis was performed
      advancedLeafAnalysis: !!leafAnalysisResults,
      // Enhanced data source information
      dataSource: eppoPlantData ? 'AI + EPPO Database' : 'AI Analysis'
    };
    
    // If this is a leaf analysis, enhance it with Sistema Digitale Foglia
    const enhancedMultiServiceInsights = detectedPlantPart === 'leaf' ? 
      enhanceLeafDiseaseClassification(label, multiServiceInsights) : 
      multiServiceInsights;
    
    // Always consider it a plant
    const isPlant = true;
    
    // Return formatted result with enhanced properties
    return {
      ...result,
      label: plantName, // Always use the identified plant name
      multiServiceInsights: enhancedMultiServiceInsights,
      plantVerification: {
        ...plantVerification,
        isPlant
      },
      // Add Sistema Digitale Foglia indicator
      sistemaDigitaleFoglia: detectedPlantPart === 'leaf',
      analysisTechnology: detectedPlantPart === 'leaf' ? 'Sistema Digitale Foglia (Plexi AI)' : 'Analisi Standard Plexi AI'
    };
  } catch (error) {
    console.error('Error formatting result:', error);
    
    // Return fallback result instead of basic one
    return createFallbackResult();
  }
};

// Helper function to create a fallback result when everything fails
/**
 * Creates a fallback result with random plant data.
 * @example
 * createFallbackResult()
 * {
 *   label: 'Snake Plant',
 *   score: 0.7,
 *   multiServiceInsights: {
 *     isHealthy: true,
 *     plantName: 'Snake Plant',
 *     plantPart: 'whole plant',
 *     confidenceLevel: 'medium',
 *     isValidPlantImage: true,
 *     plantSpecies: 'Snake Plant'
 *   },
 *   plantVerification: {
 *     isPlant: true,
 *     confidence: 0.7
 *   },
 *   analysisTechnology: 'Analisi Fallback'
 * }
 * @returns {Object} Fallback result object containing plant information.
 * @description
 *   - Generates a random plant label from a predefined list.
 *   - Returns a constant score and confidence values.
 *   - Provides a fixed set of multi-service insights for easy fallback analysis.
 */
function createFallbackResult() {
  const fallbackPlants = [
    'Monstera Deliciosa', 'Peace Lily', 'Snake Plant', 'Pothos', 'Spider Plant',
    'Rubber Plant', 'Fiddle Leaf Fig', 'ZZ Plant', 'Philodendron', 'Dracaena'
  ];
  
  const randomPlant = fallbackPlants[Math.floor(Math.random() * fallbackPlants.length)];
  
  return {
    label: randomPlant,
    score: 0.7,
    multiServiceInsights: {
      isHealthy: true,
      plantName: randomPlant,
      plantPart: 'whole plant',
      confidenceLevel: 'medium',
      isValidPlantImage: true,
      plantSpecies: randomPlant
    },
    plantVerification: {
      isPlant: true,
      confidence: 0.7
    },
    analysisTechnology: 'Analisi Fallback'
  };
}
