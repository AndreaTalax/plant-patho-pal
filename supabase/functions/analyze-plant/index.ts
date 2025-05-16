
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
    
    // Analyze with Flora Incognita and PlantSnap in parallel
    const [floraIncognitaResultPromise, plantSnapResultPromise, isLeafPromise] = await Promise.allSettled([
      analyzeWithFloraIncognita(imageArrayBuffer, floraIncognitaKey),
      analyzeWithPlantSnap(imageArrayBuffer, plantSnapKey),
      isLeafImage(imageArrayBuffer, huggingFaceToken)
    ]);
    
    const floraIncognitaResult = floraIncognitaResultPromise.status === 'fulfilled' ? floraIncognitaResultPromise.value : null;
    const plantSnapResult = plantSnapResultPromise.status === 'fulfilled' ? plantSnapResultPromise.value : null;
    const isLeaf = isLeafPromise.status === 'fulfilled' ? isLeafPromise.value : false;
    
    // Analyze the image using Hugging Face models
    const { result, errorMessages } = await analyzeImageWithModels(imageArrayBuffer, huggingFaceToken, isLeaf);
    
    // If all models failed but we have either Flora Incognita or PlantSnap results,
    // we can still provide some analysis
    let analysisResult;
    if (!result && (floraIncognitaResult || plantSnapResult)) {
      // Create a substitute result based on Flora Incognita or PlantSnap
      analysisResult = {
        label: (floraIncognitaResult?.species || plantSnapResult?.species || "Unknown Plant"),
        score: (floraIncognitaResult?.score || plantSnapResult?.score || 0.7)
      };
    } else if (!result) {
      // If all models failed and we don't have Flora Incognita or PlantSnap results either
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

    // Extract plant name if we have Flora Incognita or PlantSnap results
    let plantName = null;
    if (floraIncognitaResult && floraIncognitaResult.score > (analysisResult.score || 0)) {
      plantName = `${floraIncognitaResult.species} (${floraIncognitaResult.family})`;
    } else if (plantSnapResult && plantSnapResult.score > (analysisResult.score || 0)) {
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
      analysisResult.isReliable !== undefined ? analysisResult.isReliable : true
    );
    
    // Create the final analysis result
    const finalAnalysisResult = formatAnalysisResult(
      analysisResult, 
      plantVerification, 
      isLeaf, 
      floraIncognitaResult, 
      plantSnapResult, 
      formattedData
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
          eppoRegulated: finalAnalysisResult.eppoRegulatedConcern !== null
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
      dataSource: finalAnalysisResult.dataSource
    })}`);

    // Prepare the result before sending
    return new Response(
      JSON.stringify({
        ...finalAnalysisResult,
        message: insertError ? "Plant analysis completed but not saved" : "Plant analysis completed and saved",
        dataSource: finalAnalysisResult.dataSource
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
