
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
  analyzeWithPlantSnap,
  analyzeWithPlantNet,
  analyzeWithKindWise
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
const kindWiseApiKey = Deno.env.get("KINDWISE_API_KEY");

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
    const optimized = formData.get('optimized') === 'true';

    if (!imageFile || !(imageFile instanceof File)) {
      return new Response(JSON.stringify({ error: 'No image file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Analyzing plant image with size: ${imageFile.size} bytes, optimized: ${optimized}`);

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
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Store the detected plant type if available
    const detectedPlantType = plantVerification.detectedPlantType;
    console.log(`Detected plant type from verification: ${detectedPlantType || 'Unknown'}`);
    
    // Run all analysis services in parallel
    const [
      floraIncognitaResultPromise, 
      plantSnapResultPromise, 
      plantNetResultPromise,
      kindWiseResultPromise,
      isLeafPromise, 
      eppoCheckPromise
    ] = await Promise.allSettled([
      floraIncognitaKey ? analyzeWithFloraIncognita(imageArrayBuffer, floraIncognitaKey) : Promise.resolve(null),
      plantSnapKey ? analyzeWithPlantSnap(imageArrayBuffer, plantSnapKey) : Promise.resolve(null),
      analyzeWithPlantNet(imageArrayBuffer),
      kindWiseApiKey ? analyzeWithKindWise(imageArrayBuffer, kindWiseApiKey) : Promise.resolve(null),
      isLeafImage(imageArrayBuffer, huggingFaceToken),
      eppoApiKey ? checkForEppoConcerns(imageArrayBuffer, huggingFaceToken) : Promise.resolve(null)
    ]);
    
    const floraIncognitaResult = floraIncognitaResultPromise.status === 'fulfilled' ? floraIncognitaResultPromise.value : null;
    const plantSnapResult = plantSnapResultPromise.status === 'fulfilled' ? plantSnapResultPromise.value : null;
    const plantNetResult = plantNetResultPromise.status === 'fulfilled' ? plantNetResultPromise.value : null;
    const kindWiseResult = kindWiseResultPromise.status === 'fulfilled' ? kindWiseResultPromise.value : null;
    const isLeaf = isLeafPromise.status === 'fulfilled' ? isLeafPromise.value : false;
    const eppoCheck = eppoCheckPromise.status === 'fulfilled' ? eppoCheckPromise.value : null;
    
    // If we have a KindWise result, prioritize it
    if (kindWiseResult && kindWiseResult.success) {
      console.log("Using KindWise analysis results");
      
      // Format the KindWise response into our standard format
      const formattedResult = {
        label: kindWiseResult.disease || "Healthy plant",
        score: kindWiseResult.confidence || 0.95,
        healthy: !kindWiseResult.disease,
        isReliable: kindWiseResult.confidence > 0.6,
        plantName: kindWiseResult.plantName || detectedPlantType || "Plant",
        plantPart: kindWiseResult.plantPart || (isLeaf ? "leaf" : "whole plant"),
        detectedPlantType: detectedPlantType,
        dataSource: "KindWise Plant Health API",
        kindWiseResult,
        floraIncognitaResult,
        plantSnapResult,
        plantNetResult,
        multiServiceInsights: {
          agreementScore: Math.round((kindWiseResult.confidence || 0.8) * 100),
          primaryService: "KindWise Plant Health",
          kindWiseDetails: kindWiseResult.details || {},
          plantPart: kindWiseResult.plantPart || (isLeaf ? "leaf" : "whole plant"),
          isHealthy: !kindWiseResult.disease,
          leafAnalysis: kindWiseResult.leafAnalysis || {
            leafColor: kindWiseResult.color || "green",
            patternDetected: kindWiseResult.pattern || "normal",
            healthStatus: !kindWiseResult.disease ? "healthy" : "diseased"
          },
          advancedLeafAnalysis: true
        }
      };
      
      // Add EPPO data if available
      if (eppoCheck && eppoCheck.hasEppoConcern) {
        formattedResult.eppoRegulatedConcern = {
          name: eppoCheck.concernName,
          code: eppoCheck.eppoCode,
          type: eppoCheck.concernType,
          regulatoryStatus: eppoCheck.regulatoryStatus
        };
      }
      
      // Initialize Supabase client
      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
      
      // Get user ID from request headers if available
      const authorization = req.headers.get('Authorization');
      let userId = null;
      
      if (authorization) {
        try {
          const token = authorization.replace('Bearer ', '');
          const { data: { user }, error: authError } = await supabase.auth.getUser(token);
          
          if (!authError && user) {
            userId = user.id;
            console.log(`Authenticated user: ${userId}`);
          }
        } catch (e) {
          console.error('Error extracting user ID:', e);
        }
      }
      
      // Save the analysis result to Supabase
      const { error: insertError } = await supabase
        .from('diagnosi_piante')
        .insert({
          immagine_nome: imageFile.name,
          malattia: formattedResult.healthy ? 'Healthy' : formattedResult.label,
          accuratezza: kindWiseResult.confidence || 0.85,
          data: new Date().toISOString(),
          risultati_completi: {
            ...formattedResult,
            isLeaf: isLeaf,
            eppoRegulated: formattedResult.eppoRegulatedConcern !== null,
            detectedPlantType: detectedPlantType
          },
          user_id: userId,
          service: "KindWise"
        });
      
      if (insertError) {
        console.error(`Error saving to Supabase: ${insertError.message}`);
      } else {
        console.log("KindWise analysis saved to Supabase successfully");
      }
      
      return new Response(
        JSON.stringify({
          ...formattedResult,
          message: "Plant analysis completed with KindWise integration",
          dataSource: "KindWise Plant Health API",
          kindWiseIntegrated: true
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
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
    
    // If all models failed but we have other API results,
    // we can still provide some analysis
    let analysisResult;
    if (!result && (plantNetResult || floraIncognitaResult || plantSnapResult)) {
      // Find the best result from the APIs
      let bestResult = null;
      let bestScore = 0;
      
      if (plantNetResult && plantNetResult.score > bestScore) {
        bestResult = plantNetResult;
        bestScore = plantNetResult.score;
      }
      
      if (floraIncognitaResult && floraIncognitaResult.score > bestScore) {
        bestResult = floraIncognitaResult;
        bestScore = floraIncognitaResult.score;
      }
      
      if (plantSnapResult && plantSnapResult.score > bestScore) {
        bestResult = plantSnapResult;
        bestScore = plantSnapResult.score;
      }
      
      // Create a substitute result based on the best API result
      analysisResult = {
        label: (bestResult?.species || "Unknown Plant"),
        score: (bestResult?.score || 0.7)
      };
    } else if (!result) {
      // If all models failed and we don't have any API results either
      return new Response(
        JSON.stringify({
          error: 'All plant classification models failed',
          details: errorMessages.join('; '),
          isValidPlantImage: true
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      analysisResult = result;
    }

    // Extract plant name from API results
    let plantName = null;
    if (plantNetResult && plantNetResult.score > (analysisResult.score || 0)) {
      plantName = plantNetResult.species;
    } else if (floraIncognitaResult && floraIncognitaResult.score > (analysisResult.score || 0)) {
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
      null,
      isLeaf, 
      floraIncognitaResult, 
      plantSnapResult,
      analysisResult.isReliable !== undefined ? analysisResult.isReliable : true,
      detectedPlantType,
      plantNetResult
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
      detectedPlantType,
      eppoCheck,
      plantNetResult
    );

    // Initialize Supabase client with service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

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
          sistemaDigitaleFoglia: isLeaf
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
      plantType: detectedPlantType
    })}`);

    // Prepare the result before sending
    return new Response(
      JSON.stringify({
        ...finalAnalysisResult,
        message: insertError ? "Plant analysis completed but not saved" : "Plant analysis completed and saved",
        dataSource: finalAnalysisResult.dataSource,
        eppoIntegrated: true,
        kindWiseIntegrated: false // Not using KindWise this time
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
