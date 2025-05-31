import { 
  verifyImageContainsPlant, 
  checkForEppoConcerns,
} from "./plant-verification.ts";

// High-accuracy analysis using multiple AI models with consensus
export async function analyzeImageWithModels(
  imageArrayBuffer: ArrayBuffer, 
  huggingFaceToken: string, 
  isLeaf: boolean,
  plantTypeModels: any = {},
  requireHighAccuracy: boolean = true
) {
  let result = null;
  const errorMessages = [];
  
  try {
    // For high accuracy, we need multiple model consensus
    const modelResults = [];
    
    // Primary specialized model
    try {
      const primaryModel = plantTypeModels.primary || 
                          (isLeaf ? "microsoft/resnet-50" : "google/vit-base-patch16-224");
      
      const primaryResult = await callHuggingFaceModel(imageArrayBuffer, primaryModel, huggingFaceToken);
      if (primaryResult && primaryResult.score > 0.7) {
        modelResults.push({
          ...primaryResult,
          source: 'primary',
          weight: 0.4
        });
      }
    } catch (error) {
      errorMessages.push(`Primary model error: ${error.message}`);
    }
    
    // Secondary validation model
    try {
      const secondaryModel = plantTypeModels.secondary || 
                            (isLeaf ? "facebook/deit-base-distilled-patch16-224" : "microsoft/resnet-50");
      
      const secondaryResult = await callHuggingFaceModel(imageArrayBuffer, secondaryModel, huggingFaceToken);
      if (secondaryResult && secondaryResult.score > 0.7) {
        modelResults.push({
          ...secondaryResult,
          source: 'secondary',
          weight: 0.35
        });
      }
    } catch (error) {
      errorMessages.push(`Secondary model error: ${error.message}`);
    }
    
    // Specialized plant recognition model
    try {
      const specializedResult = await callHuggingFaceModel(
        imageArrayBuffer, 
        "Xenova/plant-disease-classification", 
        huggingFaceToken
      );
      if (specializedResult && specializedResult.score > 0.7) {
        modelResults.push({
          ...specializedResult,
          source: 'specialized',
          weight: 0.25
        });
      }
    } catch (error) {
      errorMessages.push(`Specialized model error: ${error.message}`);
    }
    
    // Require minimum number of successful models for high accuracy
    if (requireHighAccuracy && modelResults.length < 2) {
      throw new Error(`Insufficient model consensus: only ${modelResults.length} models succeeded. Minimum 2 required for 90% accuracy.`);
    }
    
    // Calculate weighted consensus
    if (modelResults.length > 0) {
      result = calculateModelConsensus(modelResults);
      
      // Verify confidence threshold for high accuracy
      if (requireHighAccuracy && result.score < 0.9) {
        throw new Error(`Confidence too low: ${Math.round(result.score * 100)}%. Required: 90%+`);
      }
    }
    
    return { result, errorMessages };
  } catch (error) {
    console.error("Error in high-accuracy analysis:", error);
    errorMessages.push(`Analysis error: ${error.message}`);
    
    if (requireHighAccuracy) {
      // Don't provide fallbacks for high-accuracy mode
      throw new Error(`High-accuracy analysis failed: ${error.message}`);
    }
    
    return { result: null, errorMessages };
  }
}

// Calculate consensus from multiple model results
function calculateModelConsensus(modelResults: any[]) {
  let totalWeight = 0;
  let weightedScore = 0;
  let consensusLabel = '';
  let maxWeightedScore = 0;
  
  // Calculate weighted averages
  for (const result of modelResults) {
    const weightedValue = result.weight * result.score;
    totalWeight += result.weight;
    weightedScore += weightedValue;
    
    if (weightedValue > maxWeightedScore) {
      maxWeightedScore = weightedValue;
      consensusLabel = result.label;
    }
  }
  
  const finalScore = weightedScore / totalWeight;
  
  return {
    label: consensusLabel,
    score: finalScore,
    consensus: true,
    modelCount: modelResults.length,
    isReliable: finalScore >= 0.9
  };
}

// Call individual Hugging Face model
async function callHuggingFaceModel(
  imageArrayBuffer: ArrayBuffer, 
  modelName: string, 
  token: string
) {
  const response = await fetch(`https://api-inference.huggingface.co/models/${modelName}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
    },
    method: 'POST',
    body: imageArrayBuffer,
  });

  if (!response.ok) {
    throw new Error(`Model ${modelName} failed: ${response.statusText}`);
  }

  const result = await response.json();
  
  if (Array.isArray(result) && result.length > 0) {
    return {
      label: result[0].label,
      score: result[0].score
    };
  }
  
  throw new Error(`Invalid response from model ${modelName}`);
}

// Format the model result for high-accuracy output
export function formatModelResult(
  modelResult: any,
  plantName: string | null,
  plantPart: string | null,
  isLeaf: boolean,
  floraIncognitaResult: any | null,
  plantSnapResult: any | null,
  isReliable: boolean = true,
  detectedPlantType: string | null = null,
  plantIdResult: any | null = null
) {
  // For high-accuracy mode, require reliable results
  if (!isReliable || !modelResult || modelResult.score < 0.9) {
    throw new Error("Insufficient reliability for high-accuracy mode");
  }
  
  return {
    label: modelResult.label,
    score: modelResult.score,
    isReliable: true,
    highAccuracy: true,
    primaryConfidence: modelResult.score,
    plantName: plantName || extractPlantNameFromLabel(modelResult.label),
    plantPart: determinePlantPart(modelResult.label, plantPart, isLeaf),
    isLeafAnalysis: isLeaf,
    detectedPlantType: detectedPlantType,
    dataSource: modelResult.consensus ? "Multi-Model Consensus" : "Single High-Accuracy Model",
    disease: isDiseaseDetected(modelResult.label) ? {
      name: extractDiseaseName(modelResult.label),
      confidence: modelResult.score
    } : null,
    healthy: isHealthyPlant(modelResult.label),
    modelConsensus: modelResult.consensus || false,
    modelCount: modelResult.modelCount || 1
  };
}

// Format the full analysis result
export function formatAnalysisResult(
  modelResult: any,
  plantVerification: any,
  isLeaf: boolean,
  floraIncognitaResult: any | null,
  plantSnapResult: any | null,
  formattedData: any,
  detectedPlantType: string | null,
  eppoCheck: any | null,
  plantIdResult: any | null
) {
  return {
    // Base properties
    label: formattedData.label,
    score: formattedData.score,
    confidence: formattedData.primaryConfidence,
    plantName: formattedData.plantName,
    plantPart: formattedData.plantPart,
    detectedPlantType: detectedPlantType,
    
    // Health assessment
    healthy: formattedData.healthy,
    disease: formattedData.disease,
    eppoRegulatedConcern: eppoCheck?.hasEppoConcern ? {
      name: eppoCheck.concernName,
      code: eppoCheck.eppoCode,
      type: eppoCheck.concernType,
      regulatoryStatus: eppoCheck.regulatoryStatus
    } : null,
    
    // Reliability metrics
    isReliable: formattedData.isReliable,
    isValidPlantImage: plantVerification.isPlant,
    
    // Data sources
    dataSource: formattedData.dataSource,
    floraIncognitaResult,
    plantSnapResult,
    plantIdResult: plantIdResult ? {
      plantName: plantIdResult.plantName,
      confidence: plantIdResult.confidence,
      healthy: plantIdResult.isHealthy
    } : null,
    
    // Additional data
    isLeafAnalysis: isLeaf
  };
}

// Helper function to capitalize a string
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
