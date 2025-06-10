
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from "../_shared/cors.ts";
import { 
  verifyImageContainsPlant, 
  isLeafImage,
  checkForEppoConcerns,
} from "./plant-verification.ts";
import { 
  analyzeWithFloraIncognita, 
  analyzeWithPlantSnap 
} from "./api-services.ts";
import { 
  analyzeImageWithModels, 
  formatModelResult,
  formatAnalysisResult,
  capitalize
} from "./model-analysis.ts";

// Environment variables
const huggingFaceToken = Deno.env.get("HUGGINGFACE_ACCESS_TOKEN");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const floraIncognitaKey = Deno.env.get("FLORA_INCOGNITA_API_KEY");
const plantSnapKey = Deno.env.get("PLANTSNAP_API_KEY");
const eppoApiKey = Deno.env.get("EPPO_API_KEY");
const plantIdApiKey = Deno.env.get("PLANT_ID_API_KEY");

// Utility function for detailed logging
/**
* Logs a message with a timestamp and a specified log level ("INFO", "WARN", "ERROR").
* @example
* logWithTimestamp('INFO', 'Process started', { id: 123 })
* // [2023-03-17T12:44:11.678Z] [INFO] Process started { "id": 123 }
* @param {'INFO' | 'WARN' | 'ERROR'} level - The severity level of the log.
* @param {string} message - The message to log.
* @param {any} [data] - Optional additional data to be logged.
* @returns {void} No return value.
* @description
*   - Automatically appends an ISO timestamp to each log message.
*   - Uses console.error for ERROR level messages, console.warn for WARN level, and console.log for INFO level.
*   - Formats additional data as a JSON string if provided.
*   - Handles optional data gracefully by omitting it if not provided.
*/
function logWithTimestamp(level: 'INFO' | 'WARN' | 'ERROR', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  
  if (level === 'ERROR') {
    console.error(logMessage, data ? JSON.stringify(data, null, 2) : '');
  } else if (level === 'WARN') {
    console.warn(logMessage, data ? JSON.stringify(data, null, 2) : '');
  } else {
    console.log(logMessage, data ? JSON.stringify(data, null, 2) : '');
  }
}

// Function to analyze with Plant.id API
/**
 * Analyzes an image using Plant.id APIs to retrieve plant identification and health assessment data.
 * @example
 * analyzeWithPlantId("imageBase64String").then(result => {
 *   console.log(result);
 * });
 * @param {string} imageBase64 - A Base64 encoded string representing the image to be analyzed.
 * @returns {Promise<any>} An object containing identification and health assessment results, or `null` in case of missing API key or errors.
 * @description
 *   - Utilizes Plant.id API key to perform identification and health assessments.
 *   - Executes API calls in parallel with a timeout of 15 seconds for each request.
 *   - If the API key is not provided, returns an object with `null` identification and health data without making API calls.
 *   - Logs detailed information about API call outcomes, including success and error statuses.
 */
async function analyzeWithPlantId(imageBase64: string): Promise<any> {
  const startTime = Date.now();
  logWithTimestamp('INFO', 'Starting Plant.id analysis');
  
  try {
    if (!plantIdApiKey) {
      logWithTimestamp('WARN', "Plant.id API key not provided. Skipping Plant.id analysis.");
      return { identification: null, health: null };
    }
    
    logWithTimestamp('INFO', 'Preparing Plant.id API requests');
    
    // Call both identification and health assessment APIs in parallel
    const [identifyPromise, healthPromise] = await Promise.allSettled([
      // Identification API
      fetch("https://api.plant.id/v2/identify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": plantIdApiKey
        },
        body: JSON.stringify({
          images: [imageBase64],
          modifiers: ["crops_fast", "similar_images"],
          plant_language: "it",
          plant_details: [
            "common_names",
            "url",
            "wiki_description",
            "taxonomy",
            "synonyms",
            "edible_parts"
          ]
        }),
        signal: AbortSignal.timeout(15000), // 15 second timeout
      }),
      
      // Health assessment API
      fetch("https://api.plant.id/v2/health_assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": plantIdApiKey
        },
        body: JSON.stringify({
          images: [imageBase64],
          modifiers: ["crops_fast"],
          language: "it",
          disease_details: [
            "common_names",
            "description",
            "treatment",
            "classification"
          ]
        }),
        signal: AbortSignal.timeout(15000), // 15 second timeout
      })
    ]);
    
    logWithTimestamp('INFO', `Plant.id API calls completed in ${Date.now() - startTime}ms`);
    
    // Process identification results
    let identificationResult = null;
    if (identifyPromise.status === 'fulfilled') {
      const response = identifyPromise.value;
      logWithTimestamp('INFO', `Plant.id identification response status: ${response.status}`);
      
      if (response.ok) {
        identificationResult = await response.json();
        logWithTimestamp('INFO', 'Plant.id identification successful', {
          suggestions_count: identificationResult.suggestions?.length || 0
        });
      } else {
        const errorText = await response.text();
        logWithTimestamp('ERROR', "Plant.id identification API error", { 
          status: response.status, 
          error: errorText 
        });
      }
    } else {
      logWithTimestamp('ERROR', 'Plant.id identification promise rejected', {
        reason: identifyPromise.reason
      });
    }
    
    // Process health assessment results
    let healthResult = null;
    if (healthPromise.status === 'fulfilled') {
      const response = healthPromise.value;
      logWithTimestamp('INFO', `Plant.id health assessment response status: ${response.status}`);
      
      if (response.ok) {
        healthResult = await response.json();
        logWithTimestamp('INFO', 'Plant.id health assessment successful', {
          diseases_count: healthResult.health_assessment?.diseases?.length || 0
        });
      } else {
        const errorText = await response.text();
        logWithTimestamp('ERROR', "Plant.id health API error", { 
          status: response.status, 
          error: errorText 
        });
      }
    } else {
      logWithTimestamp('ERROR', 'Plant.id health assessment promise rejected', {
        reason: healthPromise.reason
      });
    }
    
    const result = { identification: identificationResult, health: healthResult };
    logWithTimestamp('INFO', `Plant.id analysis completed in ${Date.now() - startTime}ms`, result);
    return result;
    
  } catch (error) {
    logWithTimestamp('ERROR', "Error in Plant.id analysis", {
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    });
    return { identification: null, health: null };
  }
}

// Main handler function
serve(async (req) => {
  const requestId = crypto.randomUUID();
  const requestStartTime = Date.now();
  
  logWithTimestamp('INFO', `=== Plant Analysis Request Started ===`, { requestId });
  logWithTimestamp('INFO', 'Request details', {
    method: req.method,
    url: req.url,
    userAgent: req.headers.get('user-agent'),
    contentType: req.headers.get('content-type'),
    authorization: req.headers.get('authorization') ? 'Bearer [REDACTED]' : 'None'
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    logWithTimestamp('INFO', 'Handling CORS preflight request', { requestId });
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if the request is a POST request
    if (req.method !== 'POST') {
      logWithTimestamp('WARN', `Invalid HTTP method: ${req.method}`, { requestId });
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the request body
    logWithTimestamp('INFO', 'Parsing form data', { requestId });
    const formData = await req.formData();
    const imageFile = formData.get('image');
    const imageBase64 = formData.get('imageBase64') as string || null;

    logWithTimestamp('INFO', 'Form data parsed', {
      requestId,
      hasImageFile: !!imageFile,
      hasImageBase64: !!imageBase64,
      imageFileName: imageFile instanceof File ? imageFile.name : 'N/A',
      imageFileSize: imageFile instanceof File ? imageFile.size : 'N/A'
    });

    if (!imageFile || !(imageFile instanceof File)) {
      logWithTimestamp('ERROR', 'No valid image file provided', { requestId });
      return new Response(JSON.stringify({ error: 'No image file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    logWithTimestamp('INFO', `Processing plant image: ${imageFile.name} (${imageFile.size} bytes)`, { requestId });

    // Read the image file as an ArrayBuffer
    const imageProcessingStart = Date.now();
    const imageArrayBuffer = await imageFile.arrayBuffer();
    logWithTimestamp('INFO', `Image converted to ArrayBuffer in ${Date.now() - imageProcessingStart}ms`, {
      requestId,
      bufferSize: imageArrayBuffer.byteLength
    });
    
    // First, verify that the image contains a plant
    logWithTimestamp('INFO', 'Starting plant verification', { requestId });
    const verificationStart = Date.now();
    const plantVerification = await verifyImageContainsPlant(imageArrayBuffer, huggingFaceToken);
    logWithTimestamp('INFO', `Plant verification completed in ${Date.now() - verificationStart}ms`, {
      requestId,
      isPlant: plantVerification.isPlant,
      confidence: plantVerification.confidence,
      detectedType: plantVerification.detectedPlantType
    });
    
    // If the image doesn't appear to contain a plant with sufficient confidence, return an error
    if (!plantVerification.isPlant) {
      logWithTimestamp('WARN', 'Image verification failed - not a plant', {
        requestId,
        confidence: plantVerification.confidence,
        threshold: 0.7
      });
      
      return new Response(JSON.stringify({
        error: false,
        plantVerification: {
          isPlant: false,
          confidence: plantVerification.confidence,
          aiServices: plantVerification.aiServices,
          message: "The image does not appear to contain a plant. Please upload a valid plant photo."
        },
        isValidPlantImage: false
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Store the detected plant type if available
    const detectedPlantType = plantVerification.detectedPlantType;
    logWithTimestamp('INFO', `Plant verification successful`, {
      requestId,
      detectedPlantType: detectedPlantType || 'Unknown',
      confidence: plantVerification.confidence
    });
    
    // Analyze with different services in parallel for better performance
    logWithTimestamp('INFO', 'Starting parallel analysis with multiple services', { requestId });
    const parallelAnalysisStart = Date.now();
    
    const [
      floraIncognitaResultPromise, 
      plantSnapResultPromise, 
      isLeafPromise, 
      eppoCheckPromise,
      plantIdResultPromise
    ] = await Promise.allSettled([
      analyzeWithFloraIncognita(imageArrayBuffer, floraIncognitaKey),
      analyzeWithPlantSnap(imageArrayBuffer, plantSnapKey),
      isLeafImage(imageArrayBuffer, huggingFaceToken),
      checkForEppoConcerns(imageArrayBuffer, huggingFaceToken),
      // Only run Plant.id analysis if we have the base64 image and API key
      imageBase64 ? analyzeWithPlantId(imageBase64) : Promise.resolve(null)
    ]);
    
    logWithTimestamp('INFO', `Parallel analysis completed in ${Date.now() - parallelAnalysisStart}ms`, { requestId });
    
    const floraIncognitaResult = floraIncognitaResultPromise.status === 'fulfilled' ? floraIncognitaResultPromise.value : null;
    const plantSnapResult = plantSnapResultPromise.status === 'fulfilled' ? plantSnapResultPromise.value : null;
    const isLeaf = isLeafPromise.status === 'fulfilled' ? isLeafPromise.value : false;
    const eppoCheck = eppoCheckPromise.status === 'fulfilled' ? eppoCheckPromise.value : null;
    const plantIdResult = plantIdResultPromise.status === 'fulfilled' ? plantIdResultPromise.value : null;
    
    logWithTimestamp('INFO', 'Analysis results summary', {
      requestId,
      floraIncognitaSuccess: !!floraIncognitaResult,
      plantSnapSuccess: !!plantSnapResult,
      isLeaf,
      eppoCheckSuccess: !!eppoCheck,
      plantIdSuccess: !!plantIdResult
    });
    
    // Process Plant.id results if available
    let plantIdProcessedResult = null;
    if (plantIdResult) {
      const plantIdProcessingStart = Date.now();
      logWithTimestamp('INFO', 'Processing Plant.id results', { requestId });
      
      const identification = plantIdResult.identification;
      const health = plantIdResult.health;
      
      // Format Plant.id results into our standard format
      if (identification || health) {
        plantIdProcessedResult = {
          source: "Plant.id API",
          confidence: 0,
          isReliable: false
        };
        
        // Process identification data
        if (identification && identification.suggestions && identification.suggestions.length > 0) {
          const bestMatch = identification.suggestions[0];
          plantIdProcessedResult.plantName = bestMatch.plant_name;
          plantIdProcessedResult.scientificName = bestMatch.plant_details?.scientific_name || bestMatch.plant_name;
          plantIdProcessedResult.commonNames = bestMatch.plant_details?.common_names || [];
          plantIdProcessedResult.confidence = bestMatch.probability;
          plantIdProcessedResult.isReliable = bestMatch.probability > 0.7;
          plantIdProcessedResult.taxonomy = bestMatch.plant_details?.taxonomy || {};
          plantIdProcessedResult.wikiDescription = bestMatch.plant_details?.wiki_description?.value || "";
          plantIdProcessedResult.similarImages = bestMatch.similar_images || [];
          plantIdProcessedResult.edibleParts = bestMatch.plant_details?.edible_parts || [];
          
          logWithTimestamp('INFO', 'Plant.id identification processed', {
            requestId,
            plantName: plantIdProcessedResult.plantName,
            confidence: plantIdProcessedResult.confidence,
            isReliable: plantIdProcessedResult.isReliable
          });
        }
        
        // Process health assessment data
        if (health && health.health_assessment && health.health_assessment.diseases) {
          const diseases = health.health_assessment.diseases;
          const isHealthy = diseases.length === 0 || 
            (diseases.length === 1 && diseases[0].name.toLowerCase().includes("healthy"));
          
          plantIdProcessedResult.isHealthy = isHealthy;
          plantIdProcessedResult.diseases = diseases.map((disease: any) => ({
            name: disease.name,
            probability: disease.probability,
            description: disease.disease_details?.description || "",
            treatment: disease.disease_details?.treatment || {
              biological: [],
              chemical: [],
              prevention: []
            },
            classification: disease.disease_details?.classification || {}
          }));
          
          // Update reliability based on disease probability if a disease is detected
          if (!isHealthy && diseases[0].probability > 0.7) {
            plantIdProcessedResult.isReliable = true;
          }
          
          logWithTimestamp('INFO', 'Plant.id health assessment processed', {
            requestId,
            isHealthy,
            diseasesCount: diseases.length,
            topDiseaseProb: diseases[0]?.probability || 0
          });
        } else {
          plantIdProcessedResult.isHealthy = true;
          plantIdProcessedResult.diseases = [];
        }
        
        logWithTimestamp('INFO', `Plant.id processing completed in ${Date.now() - plantIdProcessingStart}ms`, { requestId });
      }
    }
    
    // Choose plant-type specific model if available
    let plantTypeModels = {}; 
    if (detectedPlantType) {
      logWithTimestamp('INFO', `Selecting specialized models for plant type: ${detectedPlantType}`, { requestId });
      
      // Select specialized models based on detected plant type
      switch(detectedPlantType) {
        case 'palm':
          plantTypeModels = {
            primary: 'Xenova/palm-identification-v1',
            secondary: 'Xenova/tropical-plant-diseases'
          };
          break;
        case 'succulent':
          plantTypeModels = {
            primary: 'Xenova/succulent-identification',
            secondary: 'google/vit-base-patch16-224'
          };
          break;
        case 'houseplant':
          plantTypeModels = {
            primary: 'Xenova/houseplant-identification',
            secondary: 'microsoft/resnet-50'
          };
          break;
        case 'vegetable':
          plantTypeModels = {
            primary: 'Xenova/vegetable-disease-classification',
            secondary: 'facebook/deit-base-patch16-224'
          };
          break;
        case 'flowering':
          plantTypeModels = {
            primary: 'Xenova/flower-classification-v1',
            secondary: 'google/vit-base-patch16-224'
          };
          break;
        // Add more specialized models as needed
      }
      
      logWithTimestamp('INFO', 'Selected plant type models', {
        requestId,
        plantType: detectedPlantType,
        models: plantTypeModels
      });
    }
    
    // Analyze the image using Hugging Face models
    logWithTimestamp('INFO', 'Starting Hugging Face model analysis', { requestId });
    const modelAnalysisStart = Date.now();
    
    const { result, errorMessages } = await analyzeImageWithModels(
      imageArrayBuffer, 
      huggingFaceToken, 
      isLeaf,
      plantTypeModels
    );
    
    logWithTimestamp('INFO', `Hugging Face model analysis completed in ${Date.now() - modelAnalysisStart}ms`, {
      requestId,
      hasResult: !!result,
      errorCount: errorMessages.length,
      resultScore: result?.score || 0
    });
    
    if (errorMessages.length > 0) {
      logWithTimestamp('WARN', 'Model analysis had errors', {
        requestId,
        errors: errorMessages
      });
    }
    
    // If all models failed but we have either Flora Incognita, PlantSnap or Plant.id results,
    // we can still provide some analysis
    let analysisResult;
    if (!result && (floraIncognitaResult || plantSnapResult || plantIdProcessedResult)) {
      logWithTimestamp('INFO', 'Using fallback analysis from external APIs', { requestId });
      
      // Create a substitute result based on available APIs
      // Prioritize Plant.id if available since it's more comprehensive
      if (plantIdProcessedResult && plantIdProcessedResult.confidence > 0.7) {
        analysisResult = {
          label: plantIdProcessedResult.plantName || "Unknown Plant",
          score: plantIdProcessedResult.confidence || 0.7
        };
        logWithTimestamp('INFO', 'Using Plant.id as primary analysis result', { requestId });
      } else if (floraIncognitaResult?.score > (plantSnapResult?.score || 0)) {
        analysisResult = {
          label: floraIncognitaResult.species || "Unknown Plant",
          score: floraIncognitaResult.score || 0.7
        };
        logWithTimestamp('INFO', 'Using Flora Incognita as primary analysis result', { requestId });
      } else if (plantSnapResult) {
        analysisResult = {
          label: plantSnapResult.species || "Unknown Plant",
          score: plantSnapResult.score || 0.7
        };
        logWithTimestamp('INFO', 'Using PlantSnap as primary analysis result', { requestId });
      }
    } else if (!result) {
      logWithTimestamp('ERROR', 'All analysis methods failed', {
        requestId,
        modelErrors: errorMessages,
        externalAPIsAvailable: {
          floraIncognita: !!floraIncognitaResult,
          plantSnap: !!plantSnapResult,
          plantId: !!plantIdProcessedResult
        }
      });
      
      // If all models failed and we don't have any other API results
      return new Response(
        JSON.stringify({
          error: 'All plant classification models failed',
          details: errorMessages.join('; '),
          isValidPlantImage: true // The image contained a plant, but we couldn't analyze it further
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      analysisResult = result;
      logWithTimestamp('INFO', 'Using Hugging Face model result as primary analysis', { requestId });
    }

    // Extract plant name from our available API results
    logWithTimestamp('INFO', 'Extracting best plant name from available results', { requestId });
    let plantName = null;
    let bestConfidence = analysisResult.score || 0;
    
    // Check Plant.id first as it's comprehensive
    if (plantIdProcessedResult && plantIdProcessedResult.confidence > bestConfidence) {
      bestConfidence = plantIdProcessedResult.confidence;
      if (plantIdProcessedResult.commonNames && plantIdProcessedResult.commonNames.length > 0) {
        plantName = `${plantIdProcessedResult.commonNames[0]} (${plantIdProcessedResult.plantName})`;
      } else {
        plantName = plantIdProcessedResult.plantName;
      }
      logWithTimestamp('INFO', 'Selected Plant.id name as best result', { requestId, plantName, confidence: bestConfidence });
    }
    // Check Flora Incognita next
    else if (floraIncognitaResult && floraIncognitaResult.score > bestConfidence) {
      bestConfidence = floraIncognitaResult.score;
      plantName = `${floraIncognitaResult.species} (${floraIncognitaResult.family})`;
      logWithTimestamp('INFO', 'Selected Flora Incognita name as best result', { requestId, plantName, confidence: bestConfidence });
    } 
    // Check PlantSnap last
    else if (plantSnapResult && plantSnapResult.score > bestConfidence) {
      bestConfidence = plantSnapResult.score;
      plantName = `${plantSnapResult.species} (${plantSnapResult.family})`;
      if (plantSnapResult.details?.common_names?.[0]) {
        plantName = `${plantSnapResult.details.common_names[0]} (${plantSnapResult.species})`;
      }
      logWithTimestamp('INFO', 'Selected PlantSnap name as best result', { requestId, plantName, confidence: bestConfidence });
    }

    // Format the analysis result
    logWithTimestamp('INFO', 'Formatting analysis result', { requestId });
    const formattedData = formatModelResult(
      analysisResult, 
      plantName, 
      null, // plantPart will be determined in formatModelResult
      isLeaf, 
      floraIncognitaResult, 
      plantSnapResult,
      analysisResult.isReliable !== undefined ? analysisResult.isReliable : true,
      detectedPlantType, // Add detected plant type
      plantIdProcessedResult // Add the Plant.id results
    );
    
    // Check if we have EPPO concerns
    if (eppoCheck && eppoCheck.hasEppoConcern) {
      formattedData.eppoRegulatedConcern = {
        name: eppoCheck.concernName,
        code: eppoCheck.eppoCode,
        type: eppoCheck.concernType,
        regulatoryStatus: eppoCheck.regulatoryStatus
      };
      logWithTimestamp('WARN', 'EPPO regulated species detected', {
        requestId,
        concernName: eppoCheck.concernName,
        eppoCode: eppoCheck.eppoCode
      });
    }
    
    // Create the final analysis result
    logWithTimestamp('INFO', 'Creating final analysis result', { requestId });
    const finalAnalysisResult = formatAnalysisResult(
      analysisResult, 
      plantVerification, 
      isLeaf, 
      floraIncognitaResult, 
      plantSnapResult, 
      formattedData,
      detectedPlantType, // Add detected plant type
      eppoCheck,
      plantIdProcessedResult // Add Plant.id results
    );

    // Initialize Supabase client with service role key to bypass RLS
    logWithTimestamp('INFO', 'Initializing Supabase client for data storage', { requestId });
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceRoleKey
    );

    // Get user ID from request headers if available
    const authorization = req.headers.get('Authorization');
    let userId = null;
    
    if (authorization) {
      try {
        // Extract JWT from Bearer token
        const token = authorization.replace('Bearer ', '');
        logWithTimestamp('INFO', 'Extracting user ID from JWT token', { requestId });
        
        // Use Supabase to get user info from token
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (!authError && user) {
          userId = user.id;
          logWithTimestamp('INFO', `Authenticated user identified: ${userId}`, { requestId });
        } else {
          logWithTimestamp('WARN', 'Failed to authenticate user from token', { requestId, error: authError?.message });
        }
      } catch (e) {
        logWithTimestamp('ERROR', 'Error extracting user ID from token', { requestId, error: e.message });
        // Continue without user ID
      }
    } else {
      logWithTimestamp('INFO', 'No authorization header provided - proceeding anonymously', { requestId });
    }

    // Save the analysis result to Supabase
    logWithTimestamp('INFO', 'Saving analysis result to database', { requestId });
    const dbSaveStart = Date.now();
    
    const { error: insertError } = await supabase
      .from('diagnosi_piante')
      .insert({
        immagine_nome: imageFile.name,
        malattia: finalAnalysisResult.healthy ? 'Healthy' : finalAnalysisResult.label,
        accuratezza: formattedData.primaryConfidence || finalAnalysisResult.score,
        data: new Date().toISOString(),
        risultati_completi: {
          ...finalAnalysisResult,
          plantName: finalAnalysisResult.plantName,
          plantPart: finalAnalysisResult.plantPart,
          healthy: finalAnalysisResult.healthy,
          isLeaf: isLeaf,
          eppoRegulated: finalAnalysisResult.eppoRegulatedConcern !== null,
          detectedPlantType: detectedPlantType,
          plantIdResults: plantIdProcessedResult // Store the Plant.id results
        },
        user_id: userId
      });
    
    if (insertError) {
      logWithTimestamp('ERROR', `Failed to save analysis to database in ${Date.now() - dbSaveStart}ms`, {
        requestId,
        error: insertError.message,
        code: insertError.code
      });
      // Continue with the response even if storage fails
    } else {
      logWithTimestamp('INFO', `Analysis saved to database successfully in ${Date.now() - dbSaveStart}ms`, { requestId });
    }

    const totalProcessingTime = Date.now() - requestStartTime;
    logWithTimestamp('INFO', `=== Plant Analysis Request Completed Successfully ===`, {
      requestId,
      totalProcessingTime: `${totalProcessingTime}ms`,
      finalResult: {
        label: finalAnalysisResult.label,
        score: finalAnalysisResult.score,
        healthy: finalAnalysisResult.healthy,
        dataSource: finalAnalysisResult.dataSource,
        plantType: detectedPlantType,
        usingPlantId: !!plantIdProcessedResult
      }
    });

    // Prepare the result before sending, ensuring it includes the standardized structure
    return new Response(
      JSON.stringify({
        // Standard fields that must always be present
        label: finalAnalysisResult.label,
        plantPart: finalAnalysisResult.plantPart || "whole plant",
        healthy: finalAnalysisResult.healthy === undefined ? true : finalAnalysisResult.healthy,
        disease: finalAnalysisResult.disease || null,
        score: finalAnalysisResult.score || finalAnalysisResult.confidence || 0,
        confidence: finalAnalysisResult.confidence || finalAnalysisResult.score || 0,
        eppoRegulatedConcern: finalAnalysisResult.eppoRegulatedConcern || null,
        
        // Additional fields for richer information
        dataSource: finalAnalysisResult.dataSource,
        plantName: finalAnalysisResult.plantName,
        plantIdIntegrated: !!plantIdProcessedResult,
        eppoIntegrated: true,
        isValidPlantImage: finalAnalysisResult.isValidPlantImage || plantVerification.isPlant,
        
        // Message about the result
        message: insertError ? "Plant analysis completed but not saved" : "Plant analysis completed and saved",
        
        // Debug info
        processingTime: totalProcessingTime,
        requestId
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    const totalProcessingTime = Date.now() - requestStartTime;
    logWithTimestamp('ERROR', `=== Plant Analysis Request Failed ===`, {
      requestId,
      totalProcessingTime: `${totalProcessingTime}ms`,
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred', 
        details: error.message,
        requestId,
        processingTime: totalProcessingTime
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
