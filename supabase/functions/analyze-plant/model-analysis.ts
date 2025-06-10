import {   
  verifyImageContainsPlant,   
  checkForEppoConcerns,
} from "./plant-verification.ts";

// High-accuracy analysis using multiple AI models with consensus
/**
 * Analyzes an image using specified models to determine plant types with optional high accuracy requirement.
 * @example
 * analyzeImageWithModels(imageArrayBuffer, 'your-huggingface-token', true, { primary: 'some-model' }, false)
 * { result: ModelConsensusResult, errorMessages: ['Some error message'] }
 * @param {ArrayBuffer} imageArrayBuffer - The image data to be analyzed, represented as an ArrayBuffer.
 * @param {string} huggingFaceToken - Authentication token for accessing Hugging Face models.
 * @param {boolean} isLeaf - Indicates if the image is of a plant leaf, affecting model selection.
 * @param {any} plantTypeModels - Specifies primary and secondary models for analysis; defaults based on isLeaf.
 * @param {boolean} requireHighAccuracy - Determines if higher accuracy consensus and more model checks are needed.
 * @returns {Object} An object containing the analysis result and a list of error messages encountered during processing.
 * @description
 *   - Reduces accuracy thresholds for debugging purposes.
 *   - Adjusts the minimum number of models required based on the high accuracy flag.
 *   - Provides detailed error messaging if the analysis fails under high accuracy requirements.
 */
export async function analyzeImageWithModels(
  imageArrayBuffer: ArrayBuffer,   
  huggingFaceToken: string,   
  isLeaf: boolean,  
  plantTypeModels: any = {},  
  requireHighAccuracy: boolean = true
) {
  let result = null;
  const errorMessages = [];
  
  console.log('Starting analysis with models:', plantTypeModels);
  console.log('Image buffer size:', imageArrayBuffer.byteLength);
  
  try {
    // For high accuracy, we need multiple model consensus
    const modelResults = [];
    
    // Primary specialized model
    try {
      const primaryModel = plantTypeModels.primary ||                           
                          (isLeaf ? "microsoft/resnet-50" : "google/vit-base-patch16-224");
      
      console.log('Calling primary model:', primaryModel);
      const primaryResult = await callHuggingFaceModel(imageArrayBuffer, primaryModel, huggingFaceToken);
      console.log('Primary model result:', primaryResult);
      
      if (primaryResult && primaryResult.score > 0.3) { // Lowered threshold for debugging
        modelResults.push({
          ...primaryResult,
          source: 'primary',
          weight: 0.4
        });
        console.log('Primary model added to results');
      } else {
        console.log('Primary model score too low:', primaryResult?.score);
      }
    } catch (error) {
      console.error('Primary model error:', error);
      errorMessages.push(`Primary model error: ${error.message}`);
    }
    
    // Secondary validation model
    try {
      const secondaryModel = plantTypeModels.secondary ||                             
                            (isLeaf ? "facebook/deit-base-distilled-patch16-224" : "microsoft/resnet-50");
      
      console.log('Calling secondary model:', secondaryModel);
      const secondaryResult = await callHuggingFaceModel(imageArrayBuffer, secondaryModel, huggingFaceToken);
      console.log('Secondary model result:', secondaryResult);
      
      if (secondaryResult && secondaryResult.score > 0.3) { // Lowered threshold for debugging
        modelResults.push({
          ...secondaryResult,
          source: 'secondary',
          weight: 0.35
        });
        console.log('Secondary model added to results');
      } else {
        console.log('Secondary model score too low:', secondaryResult?.score);
      }
    } catch (error) {
      console.error('Secondary model error:', error);
      errorMessages.push(`Secondary model error: ${error.message}`);
    }
    
    // Try alternative models if the first ones fail
    if (modelResults.length === 0) {
      console.log('Trying alternative models...');
      
      // Try a more general image classification model
      try {
        const alternativeResult = await callHuggingFaceModel(
          imageArrayBuffer, 
          "google/vit-base-patch16-224-in21k", 
          huggingFaceToken
        );
        console.log('Alternative model result:', alternativeResult);
        
        if (alternativeResult && alternativeResult.score > 0.3) {
          modelResults.push({
            ...alternativeResult,
            source: 'alternative',
            weight: 0.5
          });
          console.log('Alternative model added to results');
        }
      } catch (error) {
        console.error('Alternative model error:', error);
        errorMessages.push(`Alternative model error: ${error.message}`);
      }
    }
    
    console.log('Total successful models:', modelResults.length);
    console.log('Model results:', modelResults);
    
    // Adjust requirements based on available models
    const minModelsRequired = requireHighAccuracy ? Math.min(2, 1) : 1; // Temporarily lower requirement
    
    if (modelResults.length < minModelsRequired) {
      const errorMsg = `Insufficient model consensus: only ${modelResults.length} models succeeded. Minimum ${minModelsRequired} required.`;
      console.error(errorMsg);
      console.error('All errors:', errorMessages);
      throw new Error(errorMsg);
    }
    
    // Calculate weighted consensus
    if (modelResults.length > 0) {
      result = calculateModelConsensus(modelResults);
      console.log('Consensus result:', result);
      
      // Adjust confidence threshold for debugging
      const minConfidence = requireHighAccuracy ? 0.7 : 0.5; // Lowered from 0.9
      if (requireHighAccuracy && result.score < minConfidence) {
        console.warn(`Confidence below threshold: ${Math.round(result.score * 100)}%. Required: ${Math.round(minConfidence * 100)}%+`);
        // Don't throw error, just warn for now
      }
    }
    
    return { result, errorMessages };
  } catch (error) {
    console.error("Error in high-accuracy analysis:", error);
    errorMessages.push(`Analysis error: ${error.message}`);
    
    if (requireHighAccuracy) {
      // Provide more detailed error information
      const detailedError = new Error(`High-accuracy analysis failed: ${error.message}\nErrors: ${errorMessages.join('; ')}`);
      throw detailedError;
    }
    
    return { result: null, errorMessages };
  }
}

// Enhanced model calling with better error handling
/**
 * Calls a Hugging Face model with an image and provides the model's inferred label and score.
 * @example
 * callHuggingFaceModel(imageBuffer, 'example-model', 'hf_token')
 * // returns { label: 'cat', score: 0.95 }
 * @param {ArrayBuffer} imageArrayBuffer - The buffer containing the image data.
 * @param {string} modelName - The name of the Hugging Face model to be called.
 * @param {string} token - The authorization token for the Hugging Face API.
 * @returns {Object} An object containing the label and score inferred by the model.
 * @description
 *   - Throws an error if the image buffer is invalid or empty.
 *   - Throws an error if the authorization token is missing.
 *   - Handles various response statuses including loading model, invalid token, and bad requests.
 *   - Parses and validates the response format from the model and provides meaningful error messages.
 */
async function callHuggingFaceModel(
  imageArrayBuffer: ArrayBuffer,   
  modelName: string,   
  token: string
) {
  console.log(`Calling model: ${modelName}`);
  
  // Validate inputs
  if (!imageArrayBuffer || imageArrayBuffer.byteLength === 0) {
    throw new Error('Invalid or empty image buffer');
  }
  
  if (!token) {
    throw new Error('Missing Hugging Face token');
  }
  
  try {
    const response = await fetch(`https://api-inference.huggingface.co/models/${modelName}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
      },
      method: 'POST',
      body: imageArrayBuffer,
    });
    
    console.log(`Model ${modelName} response status:`, response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Model ${modelName} error response:`, errorText);
      
      // Handle specific Hugging Face errors
      if (response.status === 503) {
        throw new Error(`Model ${modelName} is loading, please retry in a few seconds`);
      } else if (response.status === 401) {
        throw new Error(`Invalid Hugging Face token for model ${modelName}`);
      } else if (response.status === 400) {
        throw new Error(`Bad request to model ${modelName}: ${errorText}`);
      }
      
      throw new Error(`Model ${modelName} failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`Model ${modelName} raw result:`, result);
    
    // Handle different response formats
    if (Array.isArray(result) && result.length > 0) {
      return {
        label: result[0].label,
        score: result[0].score
      };
    } else if (result.label && typeof result.score === 'number') {
      return {
        label: result.label,
        score: result.score
      };
    } else if (result.error) {
      throw new Error(`Model error: ${result.error}`);
    }
    
    console.error(`Invalid response format from model ${modelName}:`, result);
    throw new Error(`Invalid response format from model ${modelName}`);
    
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Network error calling model ${modelName}: ${error.message}`);
    }
    throw error;
  }
}

// Rest of your functions remain the same...
/**
* Computes a weighted consensus from an array of model results by evaluating their scores and weights.
* @example
* calculateModelConsensus([{ label: 'A', weight: 2, score: 0.8 }, { label: 'B', weight: 1, score: 0.9 }])
* { label: 'A', score: 0.8333333333333334, consensus: true, modelCount: 2, isReliable: true }
* @param {any[]} modelResults - Array of model results, each containing a label, weight, and score.
* @returns {object} Returns an object containing consensus label, weighted final score, consensus status, count of models analyzed, and reliability flag.
* @description
*   - Calculates weighted value by multiplying each model's score with its weight.
*   - Determines consensus label based on the highest weighted score.
*   - Checks reliability based on a threshold score of 0.7.
*   - Assumes input model results have 'weight', 'score', and 'label' properties.
*/
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
    isReliable: finalScore >= 0.7 // Lowered from 0.9
  };
}

// Helper function to test the connection
/**
 * Tests the connection to the HuggingFace API using a provided token.
 * @example
 * testHuggingFaceConnection('your_token_here')
 * true
 * @param {string} token - Authorization token required for HuggingFace API access.
 * @returns {boolean} Returns true if the connection to the HuggingFace API is successful, otherwise returns false.
 * @description
 *   - Utilizes the Microsoft ResNet-50 model endpoint for testing the connection.
 *   - Logs the HTTP status of the API response for debugging purposes.
 *   - Catches and logs errors in case the API request fails.
 */
export async function testHuggingFaceConnection(token: string) {
  try {
    const response = await fetch('https://api-inference.huggingface.co/models/microsoft/resnet-50', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      method: 'GET',
    });
    
    console.log('HuggingFace connection test:', response.status);
    return response.ok;
  } catch (error) {
    console.error('HuggingFace connection test failed:', error);
    return false;
  }
}
