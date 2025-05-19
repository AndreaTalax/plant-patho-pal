
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

// Function to analyze with Plant.id API
async function analyzeWithPlantId(imageBase64: string): Promise<any> {
  try {
    if (!plantIdApiKey) {
      console.log("Plant.id API key not provided. Skipping Plant.id analysis.");
      return { identification: null, health: null };
    }
    
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
    
    // Process identification results
    let identificationResult = null;
    if (identifyPromise.status === 'fulfilled') {
      const response = identifyPromise.value;
      if (response.ok) {
        identificationResult = await response.json();
      } else {
        console.error("Plant.id identification API error:", await response.text());
      }
    }
    
    // Process health assessment results
    let healthResult = null;
    if (healthPromise.status === 'fulfilled') {
      const response = healthPromise.value;
      if (response.ok) {
        healthResult = await response.json();
      } else {
        console.error("Plant.id health API error:", await response.text());
      }
    }
    
    return { identification: identificationResult, health: healthResult };
  } catch (error) {
    console.error("Error in Plant.id analysis:", error);
    return { identification: null, health: null };
  }
}

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if the request is a POST request
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the request body
    const formData = await req.formData();
    const imageFile = formData.get('image');
    const imageBase64 = formData.get('imageBase64') as string || null;

    if (!imageFile || !(imageFile instanceof File)) {
      return new Response(JSON.stringify({ error: 'No image file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Analyzing plant image with size: ${imageFile.size} bytes`);

    // Read the image file as an ArrayBuffer
    const imageArrayBuffer = await imageFile.arrayBuffer();
    
    // First, verify that the image contains a plant
    const plantVerification = await verifyImageContainsPlant(imageArrayBuffer, huggingFaceToken);
    
    // If the image doesn't appear to contain a plant with sufficient confidence, return an error
    if (!plantVerification.isPlant) {
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
        status: 200, // We return 200 instead of error status so frontend can handle the message display
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Store the detected plant type if available
    const detectedPlantType = plantVerification.detectedPlantType;
    console.log(`Detected plant type from verification: ${detectedPlantType || 'Unknown'}`);
    
    // Analyze with different services in parallel for better performance
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
    
    const floraIncognitaResult = floraIncognitaResultPromise.status === 'fulfilled' ? floraIncognitaResultPromise.value : null;
    const plantSnapResult = plantSnapResultPromise.status === 'fulfilled' ? plantSnapResultPromise.value : null;
    const isLeaf = isLeafPromise.status === 'fulfilled' ? isLeafPromise.value : false;
    const eppoCheck = eppoCheckPromise.status === 'fulfilled' ? eppoCheckPromise.value : null;
    const plantIdResult = plantIdResultPromise.status === 'fulfilled' ? plantIdResultPromise.value : null;
    
    // Process Plant.id results if available
    let plantIdProcessedResult = null;
    if (plantIdResult) {
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
        } else {
          plantIdProcessedResult.isHealthy = true;
          plantIdProcessedResult.diseases = [];
        }
      }
    }
    
    // Choose plant-type specific model if available
    let plantTypeModels = {}; 
    if (detectedPlantType) {
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
    }
    
    // Analyze the image using Hugging Face models
    const { result, errorMessages } = await analyzeImageWithModels(
      imageArrayBuffer, 
      huggingFaceToken, 
      isLeaf,
      plantTypeModels
    );
    
    // If all models failed but we have either Flora Incognita, PlantSnap or Plant.id results,
    // we can still provide some analysis
    let analysisResult;
    if (!result && (floraIncognitaResult || plantSnapResult || plantIdProcessedResult)) {
      // Create a substitute result based on available APIs
      // Prioritize Plant.id if available since it's more comprehensive
      if (plantIdProcessedResult && plantIdProcessedResult.confidence > 0.7) {
        analysisResult = {
          label: plantIdProcessedResult.plantName || "Unknown Plant",
          score: plantIdProcessedResult.confidence || 0.7
        };
      } else if (floraIncognitaResult?.score > (plantSnapResult?.score || 0)) {
        analysisResult = {
          label: floraIncognitaResult.species || "Unknown Plant",
          score: floraIncognitaResult.score || 0.7
        };
      } else if (plantSnapResult) {
        analysisResult = {
          label: plantSnapResult.species || "Unknown Plant",
          score: plantSnapResult.score || 0.7
        };
      }
    } else if (!result) {
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
    }

    // Extract plant name from our available API results
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
    }
    // Check Flora Incognita next
    else if (floraIncognitaResult && floraIncognitaResult.score > bestConfidence) {
      bestConfidence = floraIncognitaResult.score;
      plantName = `${floraIncognitaResult.species} (${floraIncognitaResult.family})`;
    } 
    // Check PlantSnap last
    else if (plantSnapResult && plantSnapResult.score > bestConfidence) {
      bestConfidence = plantSnapResult.score;
      plantName = `${plantSnapResult.species} (${plantSnapResult.family})`;
      if (plantSnapResult.details?.common_names?.[0]) {
        plantName = `${plantSnapResult.details.common_names[0]} (${plantSnapResult.species})`;
      }
    }

    // Format the analysis result
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
    }
    
    // Create the final analysis result
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
        
        // Use Supabase to get user info from token
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (!authError && user) {
          userId = user.id;
          console.log(`Authenticated user: ${userId}`);
        }
      } catch (e) {
        console.error('Error extracting user ID:', e);
        // Continue without user ID
      }
    }

    // Save the analysis result to Supabase
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
      console.error(`Error saving to Supabase: ${insertError.message}`);
      // Continue with the response even if storage fails
    } else {
      console.log("Analysis saved to Supabase successfully");
    }

    console.log(`Analysis completed: ${JSON.stringify({
      label: finalAnalysisResult.label,
      score: finalAnalysisResult.score,
      healthy: finalAnalysisResult.healthy,
      dataSource: finalAnalysisResult.dataSource,
      plantType: detectedPlantType,
      usingPlantId: !!plantIdProcessedResult
    })}`);

    // Prepare the result before sending
    return new Response(
      JSON.stringify({
        ...finalAnalysisResult,
        message: insertError ? "Plant analysis completed but not saved" : "Plant analysis completed and saved",
        dataSource: finalAnalysisResult.dataSource,
        eppoIntegrated: true,
        plantIdIntegrated: !!plantIdProcessedResult
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error(`Error in analyze-plant function: ${error.message}`);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
