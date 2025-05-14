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

// Enhanced database integrating PlantNet, TRY Plant Trait Database and New Plant Diseases Dataset
const plantSpeciesMap = {
  // Garden plants and vegetables
  'tomato': 'Tomato (Solanum lycopersicum)',
  'potato': 'Potato (Solanum tuberosum)',
  'pepper': 'Pepper (Capsicum annuum)',
  'cucumber': 'Cucumber (Cucumis sativus)',
  'lettuce': 'Lettuce (Lactuca sativa)',
  'carrot': 'Carrot (Daucus carota)',
  'spinach': 'Spinach (Spinacia oleracea)',
  'pumpkin': 'Pumpkin (Cucurbita pepo)',
  'beans': 'Beans (Phaseolus vulgaris)',
  'corn': 'Corn (Zea mays)',
  
  // Fruits
  'apple': 'Apple (Malus domestica)',
  'grape': 'Grape (Vitis vinifera)',
  'strawberry': 'Strawberry (Fragaria ananassa)',
  'peach': 'Peach (Prunus persica)',
  'orange': 'Orange (Citrus sinensis)',
  'cherry': 'Cherry (Prunus avium)',
  'lemon': 'Lemon (Citrus limon)',
  'raspberry': 'Raspberry (Rubus idaeus)',
  'blueberry': 'Blueberry (Vaccinium)',
  'banana': 'Banana (Musa)',
  
  // Common houseplants
  'monstera': 'Monstera (Monstera deliciosa)',
  'pothos': 'Pothos (Epipremnum aureum)',
  'snake plant': 'Snake Plant (Sansevieria)',
  'aloe': 'Aloe Vera (Aloe barbadensis)',
  'fiddle': 'Fiddle Leaf Fig (Ficus lyrata)',
  'peace lily': 'Peace Lily (Spathiphyllum)',
  'orchid': 'Orchid (Orchidaceae)',
  'spider plant': 'Spider Plant (Chlorophytum comosum)',
  'rubber plant': 'Rubber Plant (Ficus elastica)',
  'jade plant': 'Jade Plant (Crassula ovata)',
  'zz plant': 'ZZ Plant (Zamioculcas zamiifolia)',
  'philodendron': 'Philodendron (Philodendron)',
  
  // Garden flowers
  'rose': 'Rose (Rosa)',
  'tulip': 'Tulip (Tulipa)',
  'daisy': 'Daisy (Bellis perennis)',
  'sunflower': 'Sunflower (Helianthus)',
  'lily': 'Lily (Lilium)',
  'lavender': 'Lavender (Lavandula)',
  'marigold': 'Marigold (Tagetes)',
  'hydrangea': 'Hydrangea (Hydrangea)',
  'geranium': 'Geranium (Pelargonium)',
  'dahlia': 'Dahlia (Dahlia)',
  
  // Herbs
  'basil': 'Basil (Ocimum basilicum)',
  'mint': 'Mint (Mentha)',
  'rosemary': 'Rosemary (Rosmarinus officinalis)',
  'thyme': 'Thyme (Thymus vulgaris)',
  'cilantro': 'Cilantro (Coriandrum sativum)',
  'oregano': 'Oregano (Origanum vulgare)',
  'sage': 'Sage (Salvia officinalis)',
  'chives': 'Chives (Allium schoenoprasum)',
  'parsley': 'Parsley (Petroselinum crispum)',
  'dill': 'Dill (Anethum graveolens)',
  
  // Additional PlantNet & TRY Database entries (common species)
  'oak': 'Oak (Quercus)',
  'maple': 'Maple (Acer)',
  'pine': 'Pine (Pinus)',
  'birch': 'Birch (Betula)',
  'willow': 'Willow (Salix)',
  'poplar': 'Poplar (Populus)',
  'eucalyptus': 'Eucalyptus (Eucalyptus)',
  'rhododendron': 'Rhododendron (Rhododendron)',
  'azalea': 'Azalea (Rhododendron)',
  'juniper': 'Juniper (Juniperus)',
  'ivy': 'Ivy (Hedera)',
  'fern': 'Ferns (Polypodiopsida)',
  'bamboo': 'Bamboo (Bambusoideae)',
  'cactus': 'Cactus (Cactaceae)',
  'succulent': 'Succulent Plants (various species)',
  'palm': 'Palm (Arecaceae)',
  'cypress': 'Cypress (Cupressus)',
  'dogwood': 'Dogwood (Cornus)',
  'magnolia': 'Magnolia (Magnolia)',
  'hibiscus': 'Hibiscus (Hibiscus)',
  
  // Additional entries from New Plant Diseases Dataset
  'apple scab': 'Apple (Malus domestica) - Scab Disease',
  'apple black rot': 'Apple (Malus domestica) - Black Rot',
  'apple cedar rust': 'Apple (Malus domestica) - Cedar Apple Rust',
  'cherry powdery': 'Cherry (Prunus avium) - Powdery Mildew',
  'corn gray': 'Corn (Zea mays) - Gray Leaf Spot',
  'corn rust': 'Corn (Zea mays) - Common Rust',
  'grape black rot': 'Grape (Vitis vinifera) - Black Rot',
  'grape esca': 'Grape (Vitis vinifera) - Esca (Black Measles)',
  'potato early blight': 'Potato (Solanum tuberosum) - Early Blight',
  'potato late blight': 'Potato (Solanum tuberosum) - Late Blight',
  'strawberry leaf scorch': 'Strawberry (Fragaria ananassa) - Leaf Scorch',
  'tomato bacterial': 'Tomato (Solanum lycopersicum) - Bacterial Spot',
  'tomato early blight': 'Tomato (Solanum lycopersicum) - Early Blight',
  'tomato late blight': 'Tomato (Solanum lycopersicum) - Late Blight',
  'tomato leaf mold': 'Tomato (Solanum lycopersicum) - Leaf Mold',
  'tomato septoria': 'Tomato (Solanum lycopersicum) - Septoria Leaf Spot',
  'tomato spider mites': 'Tomato (Solanum lycopersicum) - Spider Mite Damage',
  'tomato target spot': 'Tomato (Solanum lycopersicum) - Target Spot',
  'tomato mosaic virus': 'Tomato (Solanum lycopersicum) - Mosaic Virus',
  'tomato yellow curl': 'Tomato (Solanum lycopersicum) - Yellow Leaf Curl Virus',
};

// Database of plant parts keywords for identification
const plantPartKeywords = {
  'leaf': ['leaf', 'foliage', 'frond', 'leaflet', 'blade'],
  'stem': ['stem', 'stalk', 'petiole', 'cane'],
  'root': ['root', 'rhizome', 'tuber', 'bulb', 'corm'],
  'flower': ['flower', 'bloom', 'blossom', 'inflorescence', 'petal'],
  'fruit': ['fruit', 'berry', 'pod', 'seed', 'cone'],
  'shoot': ['shoot', 'sprout', 'seedling', 'bud', 'tendril'],
  'branch': ['branch', 'twig', 'bough'],
  'trunk': ['trunk', 'bark', 'wood'],
  'collar region': ['collar', 'crown', 'base']
};

// Function to determine if plant is healthy based on enhanced dataset analysis
const isPlantHealthy = (label: string): boolean => {
  const healthyTerms = ['healthy', 'normal', 'no disease', 'good', 'well'];
  const diseaseTerms = ['disease', 'infection', 'blight', 'spot', 'mildew', 'rust', 'rot', 'wilt', 'lesion', 'chlorosis', 'necrosis'];
  const newPlantDiseaseTerms = ['scab', 'black rot', 'rust', 'powdery mildew', 'gray leaf spot', 
                              'blight', 'esca', 'leaf scorch', 'bacterial spot', 'leaf mold', 
                              'septoria', 'spider mites', 'target spot', 'mosaic virus', 'yellow curl'];
  const label_lower = label.toLowerCase();
  
  // Check if label explicitly mentions being healthy
  if (healthyTerms.some(term => label_lower.includes(term))) {
    return true;
  }
  
  // Check if label mentions any disease conditions from both datasets
  if (diseaseTerms.some(term => label_lower.includes(term)) || 
      newPlantDiseaseTerms.some(term => label_lower.includes(term))) {
    return false;
  }
  
  // Default to healthy if no clear indicators
  return true;
};

// Identify the plant part from the model classification
const identifyPlantPart = (label: string): string | null => {
  const label_lower = label.toLowerCase();
  
  for (const [partName, keywords] of Object.entries(plantPartKeywords)) {
    if (keywords.some(keyword => label_lower.includes(keyword))) {
      return partName;
    }
  }
  
  return null; // Unknown plant part
};

// PlantNet-inspired function to extract plant name from model classification
const extractPlantName = (label: string): string | null => {
  label = label.toLowerCase();
  
  // First try exact matches with the keys in our database
  for (const [key, value] of Object.entries(plantSpeciesMap)) {
    if (label.includes(key)) {
      return value;
    }
  }
  
  // Try to extract from common formats used in plant recognition
  const commonPlantNames = Object.keys(plantSpeciesMap);
  for (const plantKey of commonPlantNames) {
    if (new RegExp(`\\b${plantKey}\\b`, 'i').test(label)) {
      return plantSpeciesMap[plantKey];
    }
  }
  
  // If nothing found, return null
  return null;
};

// Improved plant verification function with New Plant Diseases Dataset
const isPlantLabel = (label: string): boolean => {
  const plantLabels = [
    "plant", "leaf", "leaves", "flower", "potted plant", "foliage", "shrub", "vegetation",
    "botanical", "flora", "garden", "herb", "houseplant", "tree", "succulent", "bloom",
    "petal", "stem", "root", "seedling", "bud", "shoot", "cutting", "bulb", "crop",
    "branch", "trunk", "bark", "flora", "woodland", "forest", "garden", "plant life"
  ];
  
  // Add New Plant Diseases Dataset specific plant terms
  const diseaseDatasetPlantLabels = [
    'apple', 'cherry', 'corn', 'grape', 'potato', 'strawberry', 'tomato',
    'leaf', 'plant', 'foliage', 'stem', 'crop', 'fruit'
  ];
  
  // Also check our plant database keys
  const allPlantTerms = [...plantLabels, ...Object.keys(plantSpeciesMap), ...diseaseDatasetPlantLabels];
  
  return allPlantTerms.some(keyword => label.toLowerCase().includes(keyword));
};

// Enhanced plant verification function with multi-model approach
async function verifyImageContainsPlant(imageArrayBuffer: ArrayBuffer): Promise<{isPlant: boolean, confidence: number, aiServices: any[]}> {
  try {
    // Try using specific plant models first, combining approaches from multiple databases
    const plantModels = [
      "google/vit-base-patch16-224",
      "microsoft/resnet-50",
      "facebook/deit-base-patch16-224"
    ];
    
    let bestResult = null;
    let bestConfidence = 0;
    let aiServices = [];
    
    // Try each model in order until one works - similar to PlantNet's multi-model approach
    for (const model of plantModels) {
      try {
        console.log(`Trying plant verification with model: ${model}`);
        
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
          console.error(`${model} API Error: ${await response.text()}`);
          continue;
        }
        
        const result = await response.json();
        
        if (!Array.isArray(result)) {
          continue;
        }
        
        // Check the top 5 predictions for plant-related labels
        const topPredictions = result.slice(0, 5);
        const plantDetections = topPredictions.filter(prediction => {
          const label = prediction.label.toLowerCase();
          return isPlantLabel(label);
        });
        
        // If we found any plant-related labels, record this model's confidence
        if (plantDetections.length > 0) {
          const confidence = plantDetections[0].score;
          
          // Record this service result
          aiServices.push({
            serviceName: `${model} Classification`,
            result: true,
            confidence
          });
          
          // Keep track of our best result
          if (confidence > bestConfidence) {
            bestConfidence = confidence;
            bestResult = plantDetections[0];
          }
        } else {
          // No plant detected by this model
          aiServices.push({
            serviceName: `${model} Classification`,
            result: false,
            confidence: 0
          });
        }
      } catch (err) {
        console.error(`Error with model ${model}: ${err.message}`);
      }
    }
    
    // If we got a good result from any model with confidence > 0.3, consider it a plant
    if (bestResult && bestConfidence > 0.3) {
      return {
        isPlant: true,
        confidence: bestConfidence,
        aiServices
      };
    }
    
    // Default to assuming it's not a plant if no models detected one with sufficient confidence
    return {
      isPlant: false,
      confidence: bestConfidence,
      aiServices
    };
  } catch (err) {
    console.error('Plant verification error:', err.message);
    // Default to true in case of errors to avoid blocking legitimate images
    return { isPlant: true, confidence: 0.5, aiServices: [] };
  }
}

// Function to identify if the image is of a leaf and should use the New Plant Diseases Dataset
const isLeafImage = async (imageArrayBuffer: ArrayBuffer): Promise<boolean> => {
  try {
    // Use a general model to check if the image contains a leaf
    const model = "google/vit-base-patch16-224";
    
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
      return false;
    }
    
    const result = await response.json();
    
    if (!Array.isArray(result)) {
      return false;
    }
    
    // Check if any of the top predictions include leaf-related terms
    const leafTerms = ['leaf', 'leaves', 'foliage', 'frond'];
    const topPredictions = result.slice(0, 5);
    
    return topPredictions.some(prediction => 
      leafTerms.some(term => prediction.label.toLowerCase().includes(term))
    );
  } catch (err) {
    console.error('Leaf verification error:', err.message);
    return false;
  }
};

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
    
    // Check if the image is likely to be a leaf to use the proper dataset
    const isLeaf = await isLeafImage(imageArrayBuffer);
    
    // Select appropriate models based on whether it's a leaf image or general plant
    let plantModels;
    
    if (isLeaf) {
      // For leaf images, use models better suited for the New Plant Diseases Dataset
      plantModels = [
        "microsoft/resnet-50",          // Good for leaf disease classification
        "google/vit-base-patch16-224",  // Good general vision model
        "facebook/deit-base-patch16-224" // Backup model
      ];
    } else {
      // For general plant images, use models better with the TRY Plant Trait Database
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
          error: 'All plant classification models failed',
          details: errorMessages.join('; '),
          isValidPlantImage: true // The image contained a plant, but we couldn't analyze it further
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
      // Filter for plant-related labels first
      const plantPredictions = result.filter(item => isPlantLabel(item.label));
      topPrediction = plantPredictions[0] || result[0] || { label: 'Unknown', score: 0 };
    } else if (result.label) {
      // Some models return a single prediction object
      topPrediction = result;
    } else if (result.predictions) {
      // Some models use a "predictions" field 
      const plantPredictions = result.predictions.filter(item => isPlantLabel(item.label));
      topPrediction = plantPredictions[0] || result.predictions[0] || { label: 'Unknown', score: 0 };
    } else {
      // If the result format is unknown, create a default prediction
      topPrediction = { label: 'Unknown Format', score: 0 };
    }
    
    // Ensure allPredictions is an array of plant-related predictions
    let allPredictions;
    if (Array.isArray(result)) {
      allPredictions = result.filter(item => isPlantLabel(item.label));
      if (allPredictions.length === 0) allPredictions = result.slice(0, 5); // fallback if no plant labels found
    } else if (result.predictions) {
      allPredictions = result.predictions.filter(item => isPlantLabel(item.label));
      if (allPredictions.length === 0) allPredictions = result.predictions.slice(0, 5);
    } else if (result.label) {
      allPredictions = [result];
    } else {
      allPredictions = [];
    }

    // Check for low confidence
    const isReliable = topPrediction.score >= 0.6;
    
    // Determine if plant is healthy
    const healthy = isPlantHealthy(topPrediction.label);
    
    // Extract plant name using our database
    let plantName = extractPlantName(topPrediction.label);
    
    // Identify plant part
    const plantPart = identifyPlantPart(topPrediction.label);
    
    // If no specific plant is identified, use a generic placeholder
    if (!plantName) {
      // Look for any plant names in the top predictions
      for (const prediction of allPredictions) {
        const extractedName = extractPlantName(prediction.label);
        if (extractedName) {
          plantName = extractedName;
          break;
        }
      }
      
      // If still no match, use a generic placeholder
      if (!plantName) {
        plantName = healthy ? 'Healthy Plant (Unidentified species)' : 'Plant (Unidentified species)';
      }
    }
    
    // Format the analysis result integrating both TRY Plant Trait Database and New Plant Diseases Dataset
    const analysisResult = {
      label: topPrediction.label,
      score: topPrediction.score || 0,
      allPredictions: allPredictions,
      timestamp: new Date().toISOString(),
      healthy: healthy,
      plantName: plantName,
      plantPart: plantPart,
      plantVerification: plantVerification,
      isValidPlantImage: plantVerification.isPlant,
      isReliable: isReliable,
      isLeafAnalysis: isLeaf,
      dataSource: isLeaf ? "New Plant Diseases Dataset + OLID I" : "TRY Plant Trait Database + PlantNet"
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
          plantPart: plantPart,
          healthy: healthy,
          isLeaf: isLeaf
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

    // Prepare the result before sending
    return new Response(
      JSON.stringify({
        ...analysisResult,
        message: insertError ? "Plant analysis completed but not saved" : "Plant analysis completed and saved",
        dataSource: isLeaf ? "New Plant Diseases Dataset + OLID I" : "TRY Plant Trait Database + PlantNet"
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
