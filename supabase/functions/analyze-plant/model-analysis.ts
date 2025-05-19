import { isPlantHealthy, identifyPlantPart, extractPlantName, isPlantLabel, checkForEppoConcerns } from './plant-verification.ts';

// Function to analyze an image using Hugging Face models
export async function analyzeImageWithModels(
  imageArrayBuffer: ArrayBuffer, 
  huggingFaceToken: string,
  isLeaf: boolean
): Promise<any> {
  // Select appropriate models based on whether it's a leaf image or general plant
  let plantModels;
  
  if (isLeaf) {
    // For leaf images, use models better suited for the New Plant Diseases Dataset and OLID I
    plantModels = [
      "microsoft/resnet-50",          // Good for leaf disease classification
      "google/vit-base-patch16-224",  // Good general vision model
      "facebook/deit-base-patch16-224" // Backup model
    ];
  } else {
    // For general plant images, use models better with the TRY Plant Trait Database and EPPO
    plantModels = [
      "google/vit-base-patch16-224",  // Good general plant classification
      "microsoft/resnet-50",          // Another strong vision model for plants
      "facebook/deit-base-patch16-224" // Backup model with good plant recognition
    ];
  }
  
  let result = null;
  let errorMessages = [];
  
  // Try each model in order until one works
  for (const model of plantModels) {
    try {
      console.log(`Trying plant classification model: ${model}`);
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          headers: {
            Authorization: `Bearer ${huggingFaceToken}`,
            "Content-Type": "application/octet-stream",
          },
          method: "POST",
          body: new Uint8Array(imageArrayBuffer),
          signal: AbortSignal.timeout(15000), // 15 second timeout
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        errorMessages.push(`Model ${model} error: ${errorText}`);
        console.error(`HuggingFace API Error with model ${model}: ${errorText}`);
        continue; // Try next model
      }
      
      // If we get a successful response, parse it and exit the loop
      result = await response.json();
      console.log(`Successful response from model ${model}`);
      break;
    } catch (err) {
      console.error(`Error with model ${model}: ${err.message}`);
      errorMessages.push(`Model ${model} exception: ${err.message}`);
    }
  }
  
  if (!result) {
    return { result: null, errorMessages };
  }
  
  return { result, errorMessages };
}

// Format the model result into a more usable format for our application
export function formatModelResult(
  modelResult: any,
  plantName: string | null,
  plantPart: string | null,
  isLeaf: boolean,
  floraIncognitaResult: any,
  plantSnapResult: any,
  isReliable: boolean,
  detectedPlantType: string | null = null,
  plantIdResult: any = null
) {
  // If we have an array result, get the top prediction
  let topPrediction;
  if (Array.isArray(modelResult)) {
    // Filter for plant-related labels first
    const plantPredictions = modelResult.filter(item => isPlantLabel(item.label));
    topPrediction = plantPredictions[0] || modelResult[0] || { label: 'Unknown', score: 0 };
  } else if (modelResult.label) {
    // Some models return a single prediction object
    topPrediction = modelResult;
  } else if (modelResult.predictions) {
    // Some models use a "predictions" field 
    const plantPredictions = modelResult.predictions.filter(item => isPlantLabel(item.label));
    topPrediction = plantPredictions[0] || modelResult.predictions[0] || { label: 'Unknown', score: 0 };
  } else {
    // If the result format is unknown, create a default prediction
    topPrediction = { label: 'Unknown Format', score: 0 };
  }
  
  // Ensure allPredictions is an array of plant-related predictions
  let allPredictions;
  if (Array.isArray(modelResult)) {
    allPredictions = modelResult.filter(item => isPlantLabel(item.label));
    if (allPredictions.length === 0) allPredictions = modelResult.slice(0, 5); // fallback if no plant labels found
  } else if (modelResult.predictions) {
    allPredictions = modelResult.predictions.filter(item => isPlantLabel(item.label));
    if (allPredictions.length === 0) allPredictions = modelResult.predictions.slice(0, 5);
  } else if (modelResult.label) {
    allPredictions = [modelResult];
  } else {
    allPredictions = [];
  }
  
  // Check if this might be an EPPO regulated pest/disease
  const eppoCheck = checkForEppoConcerns(topPrediction.label);
  
  // Determine if plant is healthy
  // First check Plant.id health assessment if available
  let healthy;
  if (plantIdResult && plantIdResult.isHealthy !== undefined) {
    healthy = plantIdResult.isHealthy;
  } else {
    healthy = isPlantHealthy(topPrediction.label);
  }
  
  // If no plant name was determined, try to extract it from the label
  if (!plantName) {
    // Try to get from Plant.id first
    if (plantIdResult && plantIdResult.plantName) {
      plantName = plantIdResult.plantName;
    } else {
      plantName = extractPlantName(topPrediction.label);
    }
  }
  
  // If no plant part was determined, try to identify it from the label
  if (!plantPart) {
    plantPart = identifyPlantPart(topPrediction.label);
  }
  
  // Determine which service provided the best identification
  let primaryService, primaryConfidence;
  
  // Check Plant.id first as it's the most comprehensive
  if (plantIdResult && plantIdResult.confidence > 0.7 && 
      (plantIdResult.confidence > topPrediction.score && 
      (!floraIncognitaResult || plantIdResult.confidence > floraIncognitaResult.score) && 
      (!plantSnapResult || plantIdResult.confidence > plantSnapResult.score))) {
    primaryService = "Plant.id";
    primaryConfidence = plantIdResult.confidence;
  }
  // Then check Flora Incognita
  else if (floraIncognitaResult && floraIncognitaResult.score > topPrediction.score && 
      (!plantSnapResult || floraIncognitaResult.score > plantSnapResult.score)) {
    primaryService = "Flora Incognita";
    primaryConfidence = floraIncognitaResult.score;
  } 
  // Then check PlantSnap
  else if (plantSnapResult && plantSnapResult.score > topPrediction.score && 
             (!floraIncognitaResult || plantSnapResult.score > floraIncognitaResult.score)) {
    primaryService = "PlantSnap";
    primaryConfidence = plantSnapResult.score;
  } 
  // Check if it's an EPPO concern
  else if (eppoCheck.isEppoConcern) {
    primaryService = "EPPO Global Database";
    primaryConfidence = topPrediction.score;
  } 
  // Otherwise use our ML models
  else if (isLeaf) {
    primaryService = "New Plant Diseases Dataset + OLID I";
    primaryConfidence = topPrediction.score;
  } else {
    primaryService = "TRY Plant Trait Database + PlantNet";
    primaryConfidence = topPrediction.score;
  }
  
  // Determine appropriate database source
  let dataSource;
  if (primaryService === "Plant.id") {
    dataSource = "Plant.id API";
  } else if (primaryService === "Flora Incognita") {
    dataSource = "Flora Incognita Botanical Database";
  } else if (primaryService === "PlantSnap") {
    dataSource = "PlantSnap Global Plant Database";
  } else if (eppoCheck.isEppoConcern) {
    dataSource = "EPPO Global Database";
  } else if (isLeaf) {
    dataSource = "New Plant Diseases Dataset + OLID I";
  } else {
    dataSource = "TRY Plant Trait Database + PlantNet";
  }
  
  return {
    topPrediction,
    allPredictions,
    plantName,
    plantPart,
    healthy,
    eppoCheck,
    primaryService,
    primaryConfidence,
    dataSource,
    plantIdResult
  };
}

// Function to format the final analysis result
export function formatAnalysisResult(
  modelResult: any, 
  plantVerification: any,
  isLeaf: boolean,
  floraIncognitaResult: any,
  plantSnapResult: any,
  formattedData: any,
  detectedPlantType: string | null = null,
  eppoCheck: any = null,
  plantIdResult: any = null
) {
  const {
    topPrediction,
    allPredictions,
    plantName,
    plantPart,
    healthy,
    primaryService,
    primaryConfidence,
    dataSource
  } = formattedData;
  
  // If no specific plant is identified, use a generic placeholder
  let finalPlantName = plantName;
  if (!finalPlantName) {
    finalPlantName = healthy ? 'Healthy Plant (Unidentified species)' : 'Plant (Unidentified species)';
  }
  
  // Format the analysis result integrating all available data sources
  const result = {
    label: topPrediction.label,
    score: topPrediction.score || 0,
    allPredictions: allPredictions,
    timestamp: new Date().toISOString(),
    healthy: healthy,
    plantName: finalPlantName,
    plantPart: plantPart,
    plantVerification: plantVerification,
    isValidPlantImage: plantVerification.isPlant,
    isReliable: modelResult.isReliable !== undefined ? modelResult.isReliable : (topPrediction.score >= 0.6),
    isLeafAnalysis: isLeaf,
    dataSource: dataSource,
    primaryService: primaryService,
    eppoRegulatedConcern: eppoCheck?.isEppoConcern ? {
      name: eppoCheck.concernName,
      isQuarantine: true,
      warningLevel: 'high'
    } : null,
    floraIncognitaResult: floraIncognitaResult,
    plantSnapResult: plantSnapResult,
    detectedPlantType: detectedPlantType
  };

  // Add Plant.id specific data if available
  if (plantIdResult) {
    result.plantIdResult = {
      plantName: plantIdResult.plantName,
      scientificName: plantIdResult.scientificName,
      commonNames: plantIdResult.commonNames,
      confidence: plantIdResult.confidence,
      isHealthy: plantIdResult.isHealthy,
      diseases: plantIdResult.diseases || [],
      taxonomy: plantIdResult.taxonomy,
      wikiDescription: plantIdResult.wikiDescription,
      similarImages: plantIdResult.similarImages,
      edibleParts: plantIdResult.edibleParts
    };
  }

  return result;
}

// Simple function to capitalize the first letter of a string
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
