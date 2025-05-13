
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const huggingFaceToken = Deno.env.get("HUGGINGFACE_ACCESS_TOKEN");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Common plant names for identification
const plantSpeciesMap = {
  'tomato': 'Tomato (Solanum lycopersicum)',
  'potato': 'Potato (Solanum tuberosum)',
  'apple': 'Apple (Malus domestica)',
  'grape': 'Grape (Vitis vinifera)',
  'corn': 'Corn (Zea mays)',
  'strawberry': 'Strawberry (Fragaria ananassa)',
  'pepper': 'Pepper (Capsicum annuum)',
  'peach': 'Peach (Prunus persica)',
  'orange': 'Orange (Citrus sinensis)',
  'cherry': 'Cherry (Prunus avium)'
};

// Function to determine if plant is healthy based on label
const isPlantHealthy = (label: string): boolean => {
  const healthyTerms = ['healthy', 'normal', 'no disease', 'good', 'well'];
  const label_lower = label.toLowerCase();
  return healthyTerms.some(term => label_lower.includes(term));
};

// Function to extract plant name from label
const extractPlantName = (label: string): string | null => {
  // Try to extract plant name from common formats like "Tomato: Healthy" or "Healthy Apple Tree"
  for (const [key, value] of Object.entries(plantSpeciesMap)) {
    if (label.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  return null;
};

// Improved plant verification function that accepts more plant-related terms
const isPlantLabel = (label: string): boolean => {
  const plantLabels = ["plant", "leaf", "leaves", "flower", "potted plant", "foliage", "shrub", "vegetation",
                      "botanical", "flora", "garden", "herb", "houseplant", "tree"];
  return plantLabels.some(keyword => label.toLowerCase().includes(keyword));
};

// Function to check if an image contains a plant using the plant-specific model
async function verifyImageContainsPlant(imageArrayBuffer: ArrayBuffer): Promise<{isPlant: boolean, confidence: number, aiServices: any[]}> {
  try {
    // Try using the plantdoc/vit-plantdoc model first for better plant recognition
    const response = await fetch(
      "https://api-inference.huggingface.co/models/plantdoc/vit-plantdoc",
      {
        headers: {
          Authorization: `Bearer ${huggingFaceToken}`,
          "Content-Type": "application/octet-stream",
        },
        method: "POST",
        body: new Uint8Array(imageArrayBuffer),
      }
    );
    
    if (!response.ok) {
      console.error(`PlantDoc API Error: ${await response.text()}`);
      
      // Fall back to general image classification models
      // Try ViT model first
      const vitResponse = await fetch(
        "https://api-inference.huggingface.co/models/google/vit-base-patch16-224",
        {
          headers: {
            Authorization: `Bearer ${huggingFaceToken}`,
            "Content-Type": "application/octet-stream",
          },
          method: "POST",
          body: new Uint8Array(imageArrayBuffer),
        }
      );
      
      if (!vitResponse.ok) {
        console.error(`ViT API Error: ${await vitResponse.text()}`);
        
        // Try Microsoft's ResNet-50 as backup
        const resnetResponse = await fetch(
          "https://api-inference.huggingface.co/models/microsoft/resnet-50",
          {
            headers: {
              Authorization: `Bearer ${huggingFaceToken}`,
              "Content-Type": "application/octet-stream",
            },
            method: "POST",
            body: new Uint8Array(imageArrayBuffer),
          }
        );
        
        if (!resnetResponse.ok) {
          console.error(`ResNet-50 API Error: ${await resnetResponse.text()}`);
          // Default to true if all models fail to avoid blocking legitimate images
          return { isPlant: true, confidence: 0.5, aiServices: [] };
        }
        
        const resnetResult = await resnetResponse.json();
        return processClassificationResult(resnetResult, "ResNet-50");
      }
      
      const vitResult = await vitResponse.json();
      return processClassificationResult(vitResult, "ViT");
    }
    
    // If we get a response from the plant-specific model, assume it's a plant
    // but still check the label for confirmation
    const result = await response.json();
    
    // Plant-specific model result processing
    if (Array.isArray(result)) {
      // Plant-specific model often returns array of predictions
      // Check if any top predictions are plant-related
      const topPredictions = result.slice(0, 3);
      const isPlant = true; // Plant-specific model assumes input is a plant
      const confidence = topPredictions[0]?.score || 0.7;
      
      return {
        isPlant: confidence >= 0.25, // Lower threshold for plant-specific model (0.25)
        confidence,
        aiServices: [{
          serviceName: "PlantDoc Classification",
          result: true,
          confidence
        }]
      };
    }
    
    // Default fallback to general image classification
    return processClassificationResult(result, "PlantDoc");
    
  } catch (err) {
    console.error('Plant verification error:', err.message);
    // Default to true in case of errors to avoid blocking legitimate images
    return { isPlant: true, confidence: 0.5, aiServices: [] };
  }
}

// Helper function to process classification results from general models
function processClassificationResult(result: any, modelName: string): {isPlant: boolean, confidence: number, aiServices: any[]} {
  // Define plant-related keywords to look for in labels
  const plantKeywords = ['plant', 'leaf', 'flower', 'tree', 'vegetation', 'garden', 'herb', 
                        'foliage', 'houseplant', 'botanical', 'flora', 'potted plant'];
  
  // Check if any of the top 5 predictions match plant-related terms
  const topPredictions = Array.isArray(result) ? result.slice(0, 5) : [];
  
  const plantDetections = topPredictions.filter(prediction => {
    const label = prediction.label.toLowerCase();
    return plantKeywords.some(keyword => label.includes(keyword));
  });
  
  const isPlant = plantDetections.length > 0;
  const confidence = plantDetections.length > 0 ? plantDetections[0].score : 0;
  
  const aiServices = [{
    serviceName: `${modelName} Classification`,
    result: isPlant,
    confidence: confidence
  }];
  
  // Lower threshold to 0.3 as requested
  return {
    isPlant: isPlant && confidence > 0.3, 
    confidence,
    aiServices
  };
}

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
    const plantVerification = await verifyImageContainsPlant(imageArrayBuffer);
    
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
    
    // Try specialized plant disease models first, then fallbacks
    const models = [
      "plantdoc/vit-plantdoc",           // Primary plant-specific model
      "dima806/plant_disease_classification", // Secondary specialized model
      "noah-fl/plant_disease_detection",  // Fallback options
      "lsassaman/plant-disease",
      "VineetJohn/plant-disease-detection"
    ];
    
    let result = null;
    let errorMessages = [];
    
    // Try each model in order until one works
    for (const model of models) {
      try {
        console.log(`Trying model: ${model}`);
        const response = await fetch(
          `https://api-inference.huggingface.co/models/${model}`,
          {
            headers: {
              Authorization: `Bearer ${huggingFaceToken}`,
              "Content-Type": "application/octet-stream",
            },
            method: "POST",
            body: new Uint8Array(imageArrayBuffer),
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
    
    // If all models failed, return an error
    if (!result) {
      return new Response(
        JSON.stringify({
          error: 'All plant disease detection models failed',
          details: errorMessages.join('; '),
          isValidPlantImage: true // The image contained a plant, but we couldn't analyze the disease
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // If we have an array result, get the top prediction
    let topPrediction;
    if (Array.isArray(result)) {
      topPrediction = result[0] || { label: 'Unknown', score: 0 };
    } else if (result.label) {
      // Some models return a single prediction object
      topPrediction = result;
    } else if (result.predictions) {
      // Some models use a "predictions" field 
      topPrediction = result.predictions[0] || { label: 'Unknown', score: 0 };
    } else {
      // If the result format is unknown, create a default prediction
      topPrediction = { label: 'Unknown Format', score: 0 };
    }
    
    // Ensure allPredictions is an array
    const allPredictions = Array.isArray(result) ? result :
                         result.predictions ? result.predictions : 
                         result.label ? [result] : [];

    // Check for low confidence - if under 0.6, mark the prediction as unreliable
    const isReliable = topPrediction.score >= 0.6;
    
    // Determine if plant is healthy
    const healthy = isPlantHealthy(topPrediction.label);
    
    // Extract plant name if possible
    let plantName = extractPlantName(topPrediction.label);
    
    // If no specific plant is identified, use a generic placeholder
    if (!plantName) {
      plantName = healthy ? 'Healthy Plant (Unidentified species)' : 'Plant (Unidentified species)';
    }
    
    // Format the analysis result
    const analysisResult = {
      label: topPrediction.label,
      score: topPrediction.score || 0,
      allPredictions: allPredictions,
      timestamp: new Date().toISOString(),
      healthy: healthy,
      plantName: plantName,
      plantVerification: plantVerification,
      isValidPlantImage: plantVerification.isPlant,
      isReliable: isReliable
    };

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
        malattia: healthy ? 'Healthy' : topPrediction.label,
        accuratezza: topPrediction.score,
        data: new Date().toISOString(),
        risultati_completi: {
          ...analysisResult,
          plantName: plantName,
          healthy: healthy
        },
        user_id: userId
      });
    
    if (insertError) {
      console.error(`Error saving to Supabase: ${insertError.message}`);
      // Continue with the response even if storage fails
    } else {
      console.log("Analysis saved to Supabase successfully");
    }

    console.log(`Analysis completed: ${JSON.stringify(analysisResult)}`);

    return new Response(
      JSON.stringify({
        ...analysisResult,
        message: insertError ? "Diagnosis completed but not saved" : "Diagnosis completed and saved"
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
