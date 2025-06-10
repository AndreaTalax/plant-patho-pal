
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from "../_shared/cors.ts";

const googleApiKey = Deno.env.get("GOOGLE_CLOUD_VISION_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!googleApiKey) {
      throw new Error("API key for Google Cloud Vision not configured");
    }

    // Parse the incoming request
    const formData = await req.formData();
    const imageFile = formData.get('image');
    const analysisType = formData.get('type') || 'LABEL_DETECTION'; // Default to label detection

    if (!imageFile || !(imageFile instanceof File)) {
      return new Response(JSON.stringify({ error: 'No image file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Analyzing image with Google Cloud Vision API, size: ${imageFile.size} bytes`);
    
    // Read image as array buffer
    const imageArrayBuffer = await imageFile.arrayBuffer();
    const imageBase64 = btoa(String.fromCharCode(...new Uint8Array(imageArrayBuffer)));
    
    // Prepare request to Google Cloud Vision API
    const features = [];
    
    // Add requested analysis types
    if (analysisType === 'LABEL_DETECTION' || analysisType === 'all') {
      features.push({ "type": "LABEL_DETECTION", "maxResults": 10 });
    }
    
    if (analysisType === 'CROP_HINTS' || analysisType === 'all') {
      features.push({ "type": "CROP_HINTS", "maxResults": 5 });
    }
    
    if (analysisType === 'WEB_DETECTION' || analysisType === 'all') {
      features.push({ "type": "WEB_DETECTION", "maxResults": 5 });
    }

    if (analysisType === 'IMAGE_PROPERTIES' || analysisType === 'all') {
      features.push({ "type": "IMAGE_PROPERTIES", "maxResults": 5 });
    }
    
    if (analysisType === 'OBJECT_LOCALIZATION' || analysisType === 'all') {
      features.push({ "type": "OBJECT_LOCALIZATION", "maxResults": 10 });
    }

    const requestBody = {
      "requests": [
        {
          "image": {
            "content": imageBase64
          },
          "features": features
        }
      ]
    };

    // Call Google Cloud Vision API
    const googleVisionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${googleApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(15000) // 15 seconds timeout
      }
    );

    if (!googleVisionResponse.ok) {
      const errorText = await googleVisionResponse.text();
      console.error("Google Vision API error:", errorText);
      throw new Error(`Google Vision API returned: ${googleVisionResponse.status} ${errorText}`);
    }

    const visionResults = await googleVisionResponse.json();
    console.log("Vision API results received");
    
    // Process results for plant identification
    const processedResults = processVisionResults(visionResults);
    
    // Store results in Supabase if user is authenticated
    const authorization = req.headers.get('Authorization');
    if (authorization) {
      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
      try {
        const token = authorization.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (!authError && user) {
          const userId = user.id;
          await storeAnalysisResults(supabase, userId, processedResults, imageFile.name);
        }
      } catch (e) {
        console.error('Error storing results:', e);
        // Continue without storing
      }
    }

    // Return the processed results
    return new Response(JSON.stringify(processedResults), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in analyze-with-cloud-vision:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to analyze image with Google Cloud Vision',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Process the raw Vision API results into a more useful format for our application
/**
 * Processes the results from the Vision API to determine if an image contains a plant.
 * @example
 * processVisionResults(visionResults)
 * { success: true, isPlant: false, confidence: 0, plantDetails: null, labels: [...], colors: [...], webEntities: [...], objects: [...], rawData: response }
 * @param {object} visionResults - The result object returned from the Vision API analysis.
 * @returns {object} An object containing analysis results such as labels, colors, web entities, and object localization with plant identification.
 * @description
 *   - Determines the presence of a plant in the image based on label and object annotations.
 *   - Extracts top 5 dominant colors with RGB and HEX values from the image properties.
 *   - Retrieves the top 5 web entities and best guess labels related to the image.
 *   - Performs an additional check for plant-related object localization annotations.
 */
function processVisionResults(visionResults) {
  if (!visionResults.responses || visionResults.responses.length === 0) {
    return { success: false, message: "No results from Vision API" };
  }
  
  const response = visionResults.responses[0];
  const result = {
    success: true,
    isPlant: false,
    confidence: 0,
    plantDetails: null,
    labels: [],
    colors: [],
    webEntities: [],
    objects: [],
    rawData: response
  };

  // Extract labels
  if (response.labelAnnotations) {
    result.labels = response.labelAnnotations.map(label => ({
      description: label.description,
      score: label.score
    }));
    
    // Check if any label suggests this is a plant
    const plantLabels = response.labelAnnotations.filter(label => 
      ['plant', 'flower', 'tree', 'leaf', 'herb', 'shrub', 'botanical', 'vegetation', 'flora'].some(
        plantTerm => label.description.toLowerCase().includes(plantTerm)
      )
    );
    
    if (plantLabels.length > 0) {
      result.isPlant = true;
      result.confidence = Math.max(...plantLabels.map(l => l.score));
      
      // Get most confident plant label
      const topPlantLabel = plantLabels.reduce(
        (prev, current) => (current.score > prev.score) ? current : prev, 
        plantLabels[0]
      );
      
      result.plantDetails = {
        type: topPlantLabel.description,
        confidence: topPlantLabel.score
      };
    }
  }
  
  // Extract color information
  if (response.imagePropertiesAnnotation?.dominantColors?.colors) {
    result.colors = response.imagePropertiesAnnotation.dominantColors.colors
      .map(color => ({
        color: {
          red: color.color.red,
          green: color.color.green,
          blue: color.color.blue
        },
        score: color.score,
        pixelFraction: color.pixelFraction,
        hex: rgbToHex(color.color.red, color.color.green, color.color.blue)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5 colors
  }
  
  // Extract web detection results
  if (response.webDetection) {
    if (response.webDetection.webEntities) {
      result.webEntities = response.webDetection.webEntities
        .map(entity => ({
          description: entity.description,
          score: entity.score
        }))
        .filter(entity => entity.description) // Filter out entities without descriptions
        .slice(0, 5); // Top 5 entities
    }
    
    if (response.webDetection.bestGuessLabels) {
      result.bestGuessLabels = response.webDetection.bestGuessLabels.map(label => label.label);
    }
  }
  
  // Extract object localization
  if (response.localizedObjectAnnotations) {
    result.objects = response.localizedObjectAnnotations.map(obj => ({
      name: obj.name,
      score: obj.score,
      boundingPoly: obj.boundingPoly
    }));
    
    // Additional check for plant objects
    const plantObjects = response.localizedObjectAnnotations.filter(obj => 
      ['Plant', 'Flower', 'Tree', 'Houseplant', 'Leaf'].includes(obj.name)
    );
    
    if (plantObjects.length > 0 && !result.isPlant) {
      result.isPlant = true;
      result.confidence = Math.max(...plantObjects.map(o => o.score));
      result.plantDetails = {
        type: plantObjects[0].name,
        confidence: plantObjects[0].score
      };
    }
  }
  
  return result;
}

// Helper function to convert RGB to hex
function rgbToHex(r, g, b) {
  return '#' + 
    Math.round(r).toString(16).padStart(2, '0') + 
    Math.round(g).toString(16).padStart(2, '0') + 
    Math.round(b).toString(16).padStart(2, '0');
}

// Store analysis results in Supabase
/**
* Stores the analysis results into the 'vision_analysis_results' table in the database
* @example
* storeAnalysisResults(supabaseClient, 12345, analysisResults, "image.jpg")
* // Successfully stores the results in the database and logs confirmation
* @param {Object} supabase - The Supabase client used to interact with the database.
* @param {number} userId - The ID of the user related to the analysis results.
* @param {Object} results - The results of the image analysis containing properties like isPlant, confidence, plantDetails, etc.
* @param {string} imageName - The name of the image being analyzed.
* @returns {void} No return value, but logs messages indicating success or failure.
* @description
*   - Utilizes the Supabase client to perform database operations.
*   - Catches and logs errors during the database operation.
*/
async function storeAnalysisResults(supabase, userId, results, imageName) {
  try {
    await supabase.from('vision_analysis_results').insert({
      user_id: userId,
      image_name: imageName,
      is_plant: results.isPlant,
      confidence: results.confidence,
      plant_details: results.plantDetails,
      labels: results.labels,
      colors: results.colors,
      web_entities: results.webEntities,
      detected_objects: results.objects,
      analysis_date: new Date().toISOString()
    });
    console.log('Analysis results stored in database');
  } catch (error) {
    console.error('Failed to store analysis results:', error);
  }
}
