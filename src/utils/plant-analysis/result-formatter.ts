
import { getPlantPartFromLabel, capitalize } from './plant-part-utils';

/**
 * Transforms the model result into a format compatible with our app
 * Integrating PlantSnap, Flora Incognita, TRY Plant Trait Database for plants, 
 * New Plant Diseases Dataset/OLID I for leaf diseases, and EPPO Global Database 
 * for regulated pests and diseases
 * @param modelResult The raw result from the image classification
 * @returns Analysis details formatted for our application
 */
export const formatHuggingFaceResult = (modelResult: any) => {
  if (!modelResult || !modelResult.label) {
    return null;
  }

  // Use the plant name from the result if available
  const plantName = modelResult.plantName || null;
  let plantNameOnly;
  let speciesOnly;
  
  if (plantName) {
    // Use the plantName provided by the backend
    const parts = plantName.split(" (");
    plantNameOnly = parts[0];
    speciesOnly = parts[1]?.replace(")", "") || "Unidentified";
  } else {
    // Fallback to a generic name
    plantNameOnly = "Unknown Plant";
    speciesOnly = "Unidentified";
  }

  // Extract the primary prediction
  const mainPrediction = {
    label: modelResult.label,
    score: modelResult.score || 0
  };

  // Check for health flag directly from the result, or determine from label
  const isHealthy = modelResult.healthy !== undefined ? 
                   modelResult.healthy : 
                   mainPrediction.label.toLowerCase().includes('healthy') || 
                   mainPrediction.label.toLowerCase().includes('normal');
                    
  // Format all predictions for alternative diagnoses
  const alternativeDiagnoses = modelResult.allPredictions
    ? modelResult.allPredictions
        .slice(1) // Skip the main prediction which is already used
        .map((pred: any) => ({
          disease: pred.label,
          probability: pred.score
        }))
    : [];
    
  // Identify plant part from analysis if available
  const plantPart = modelResult.plantPart || getPlantPartFromLabel(mainPrediction.label);
  
  // Determine if this is a leaf analysis
  const isLeafAnalysis = plantPart === 'leaf' || 
                        mainPrediction.label.toLowerCase().includes('leaf') || 
                        (modelResult.leafVerification && modelResult.leafVerification.isLeaf) ||
                        modelResult.isLeafAnalysis === true;

  // Check if this is an EPPO regulated pest/disease
  const isEppoRegulated = modelResult.eppoRegulatedConcern !== undefined && 
                          modelResult.eppoRegulatedConcern !== null;

  // Determine which service provided the best identification
  let primaryIdentificationService = modelResult.primaryService || "";
  
  // Check if Flora Incognita or PlantSnap data is available
  if (modelResult.floraIncognitaResult && modelResult.floraIncognitaResult.score > (modelResult.score || 0)) {
    primaryIdentificationService = "Flora Incognita";
  } else if (modelResult.plantSnapResult && modelResult.plantSnapResult.score > (modelResult.score || 0)) {
    primaryIdentificationService = "PlantSnap";
  } else if (isEppoRegulated) {
    primaryIdentificationService = 'EPPO Regulatory Database';
  } else if (isLeafAnalysis) {
    primaryIdentificationService = 'Leaf Disease Classifier';
  } else {
    primaryIdentificationService = 'TRY-PlantNet Classifier';
  }
  
  // Create data source info based on what dataset was used
  let dataSource = modelResult.dataSource;
  if (!dataSource) {
    if (primaryIdentificationService === "Flora Incognita") {
      dataSource = "Flora Incognita Plant Database";
    } else if (primaryIdentificationService === "PlantSnap") {
      dataSource = "PlantSnap Global Database";
    } else if (isEppoRegulated) {
      dataSource = 'EPPO Global Database';
    } else if (isLeafAnalysis) {
      dataSource = 'New Plant Diseases Dataset + OLID I';
    } else {
      dataSource = 'TRY Plant Trait Database + PlantNet';
    }
  }

  // Create a formatted analysis details object
  return {
    multiServiceInsights: {
      huggingFaceResult: mainPrediction,
      agreementScore: Math.round(mainPrediction.score * 100),
      primaryService: primaryIdentificationService,
      plantSpecies: speciesOnly,
      plantName: plantNameOnly,
      plantPart: plantPart,
      isHealthy: isHealthy,
      isValidPlantImage: modelResult.isValidPlantImage !== undefined ? 
                         modelResult.isValidPlantImage : true,
      isReliable: modelResult.isReliable !== undefined ? 
                 modelResult.isReliable : mainPrediction.score >= 0.6,
      dataSource: dataSource,
      eppoRegulated: isEppoRegulated ? modelResult.eppoRegulatedConcern : null,
      floraIncognitaMatch: modelResult.floraIncognitaResult || null,
      plantSnapMatch: modelResult.plantSnapResult || null
    },
    identifiedFeatures: isHealthy ? 
      [
        `Healthy ${plantPart || 'plant'} tissue`,
        'Good coloration',
        'Normal growth pattern',
        'No visible disease symptoms'
      ] : isEppoRegulated ?
      [
        `ALERT: Potential ${modelResult.eppoRegulatedConcern.name} detected`,
        'This may be a regulated pest/disease',
        'Consider reporting to plant health authorities',
        'Further laboratory testing advised'
      ] :
      [
        `${capitalize(plantPart || 'Plant')} with signs of ${mainPrediction.label}`,
        'Patterns recognized by the AI model',
        isLeafAnalysis ? 'Leaf analysis completed using specialized disease datasets' : 'Plant analysis completed'
      ],
    alternativeDiagnoses: isHealthy ? [] : alternativeDiagnoses,
    leafVerification: modelResult.leafVerification || {
      isLeaf: plantPart === 'leaf',
      partName: plantPart || null,
      confidence: modelResult.score ? Math.round(modelResult.score * 100) : null,
      boundingBox: modelResult.boundingBox || null
    },
    plantVerification: modelResult.plantVerification || {
      isPlant: modelResult.isValidPlantImage !== undefined ? 
               modelResult.isValidPlantImage : true,
      aiServices: [
        ...(modelResult.plantVerification?.aiServices || []),
        ...(modelResult.floraIncognitaResult ? [{
          serviceName: 'Flora Incognita',
          result: true,
          confidence: modelResult.floraIncognitaResult.score || 0.8
        }] : []),
        ...(modelResult.plantSnapResult ? [{
          serviceName: 'PlantSnap',
          result: true,
          confidence: modelResult.plantSnapResult.score || 0.8
        }] : [])
      ],
      dataSource: dataSource
    },
    plantixInsights: {
      severity: isEppoRegulated ? 'high' : isHealthy ? 'none' : 'unknown',
      progressStage: isHealthy ? 'healthy' : 'medium',
      spreadRisk: isEppoRegulated ? 'very high' : isHealthy ? 'none' : 'medium',
      environmentalFactors: isHealthy ? 
        ['Adequate light exposure', 'Proper watering', 'Good growing conditions'] :
        ['Unable to determine from image'],
      reliability: isHealthy ? 'high' : 'medium',
      confidenceNote: isEppoRegulated ?
        'Analysis identifies potential regulated pest/disease from EPPO Global Database' :
        isHealthy ? 
        'Plant appears healthy with high confidence' : 
        isLeafAnalysis ?
          'Diagnosis based on New Plant Diseases Dataset and OLID I, specialized for leaf diseases' :
          'Diagnosis based on TRY-PlantNet analysis, consider expert consultation'
    },
    eppoData: isEppoRegulated ? {
      regulationStatus: 'Quarantine pest/disease',
      reportAdvised: true,
      warningLevel: modelResult.eppoRegulatedConcern.warningLevel || 'high',
      infoLink: `https://gd.eppo.int/search?q=${encodeURIComponent(modelResult.eppoRegulatedConcern.name)}`
    } : null
  };
};
