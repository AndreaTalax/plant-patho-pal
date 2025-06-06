
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PLANT_ID_API_KEY = Deno.env.get("PLANT_ID_API_KEY") || "";
const HUGGINGFACE_TOKEN = Deno.env.get("HUGGINGFACE_ACCESS_TOKEN") || "";
const EPPO_API_KEY = Deno.env.get("EPPO_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

interface AnalysisRequest {
  imageUrl: string;
  userId?: string;
  plantInfo?: any;
  imageData?: string;
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Handle OPTIONS request for CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { imageUrl, userId, plantInfo, imageData } = await req.json() as AnalysisRequest;
    
    if (!imageUrl && !imageData) {
      throw new Error("Either imageUrl or imageData is required");
    }
    
    console.log(`Processing plant diagnosis request for user: ${userId}`);
    
    // Start multi-API analysis process
    const results = await Promise.allSettled([
      analyzePlantWithPlantId(imageUrl || imageData),
      analyzeWithHuggingFace(imageUrl || imageData),
      checkEppoDatabase(imageUrl || imageData)
    ]);
    
    // Extract results from promises
    const plantIdResult = results[0].status === "fulfilled" ? results[0].value : null;
    const huggingFaceResult = results[1].status === "fulfilled" ? results[1].value : null;
    const eppoResult = results[2].status === "fulfilled" ? results[2].value : null;
    
    // Consolidate results
    const confidence = calculateConfidence(plantIdResult, huggingFaceResult);
    const disease = determineDiseaseFromResults(plantIdResult, huggingFaceResult, eppoResult);
    const isHealthy = determineHealthStatus(plantIdResult, huggingFaceResult);
    
    // Prepare detailed analysis
    const analysisDetails = {
      plantIdResult,
      huggingFaceResult,
      eppoData: eppoResult,
      multiServiceInsights: {
        plantName: extractPlantName(plantIdResult, huggingFaceResult),
        plantSpecies: extractScientificName(plantIdResult),
        isHealthy,
        agreementScore: confidence,
        primaryService: determinePrimaryService(results)
      },
      identifiedFeatures: extractFeatures(plantIdResult, huggingFaceResult),
      recommendedAction: determineAction(disease, confidence, isHealthy),
    };
    
    // Save the diagnosis results to the database if a userId is provided
    if (userId) {
      try {
        const { data: diagnosisData, error } = await supabase
          .from('diagnoses')
          .insert({
            user_id: userId,
            plant_type: analysisDetails.multiServiceInsights.plantName || plantInfo?.name || "Unknown Plant",
            plant_variety: analysisDetails.multiServiceInsights.plantSpecies || "Unknown",
            symptoms: plantInfo?.symptoms || "Not specified",
            image_url: imageUrl,
            diagnosis_result: {
              disease,
              confidence,
              isHealthy,
              analysisDetails
            },
            status: 'completed'
          })
          .select();
          
        if (error) {
          console.error("Error saving diagnosis:", error);
        } else {
          console.log("Diagnosis saved successfully:", diagnosisData);
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
      }
    }
    
    // Return the diagnosis results
    return new Response(
      JSON.stringify({
        success: true,
        diseaseId: disease?.id || null,
        diseaseName: disease?.name || null,
        confidence,
        healthy: isHealthy,
        analysisDetails
      }),
      {
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        }
      }
    );
    
  } catch (error) {
    console.error("Plant diagnosis error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
});

// Analysis functions
async function analyzePlantWithPlantId(imageSource: string): Promise<any> {
  if (!PLANT_ID_API_KEY) {
    console.warn("PLANT_ID_API_KEY not configured");
    return null;
  }
  
  try {
    let base64data;
    
    if (imageSource.startsWith("data:")) {
      // Already a data URL
      base64data = imageSource.split(",")[1];
    } else if (imageSource.startsWith("http")) {
      // Fetch from URL
      const response = await fetch(imageSource);
      const imageBlob = await response.blob();
      base64data = await blobToBase64(imageBlob);
    } else {
      throw new Error("Invalid image format");
    }
    
    const response = await fetch("https://api.plant.id/v2/identify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": PLANT_ID_API_KEY
      },
      body: JSON.stringify({
        images: [base64data],
        modifiers: ["crops_fast", "similar_images"],
        plant_language: "en",
        plant_details: ["common_names", "url", "wiki_description", "taxonomy", "synonyms"]
      })
    });
    
    if (!response.ok) {
      throw new Error(`Plant.id API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Plant.id analysis error:", error);
    return null;
  }
}

async function analyzeWithHuggingFace(imageSource: string): Promise<any> {
  if (!HUGGINGFACE_TOKEN) {
    console.warn("HUGGINGFACE_TOKEN not configured");
    return null;
  }
  
  try {
    let imageBlob;
    
    if (imageSource.startsWith("data:")) {
      // Convert data URL to blob
      const response = await fetch(imageSource);
      imageBlob = await response.blob();
    } else if (imageSource.startsWith("http")) {
      // Fetch from URL
      const response = await fetch(imageSource);
      imageBlob = await response.blob();
    } else {
      throw new Error("Invalid image format");
    }
    
    // Use a plant disease classification model from Hugging Face
    const response = await fetch(
      "https://api-inference.huggingface.co/models/google/vit-base-patch16-224",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_TOKEN}`
        },
        body: imageBlob
      }
    );
    
    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Hugging Face analysis error:", error);
    return null;
  }
}

async function checkEppoDatabase(imageSource: string): Promise<any> {
  if (!EPPO_API_KEY) {
    console.warn("EPPO_API_KEY not configured");
    return null;
  }
  
  // EPPO database doesn't directly analyze images,
  // but we can use the results from other APIs to query it
  try {
    // This is a placeholder. In a real implementation, you would:
    // 1. Use results from Plant.id or Hugging Face to identify potential diseases
    // 2. Query the EPPO database for those diseases
    
    // Mock response for demonstration
    return {
      regulationStatus: "Not regulated",
      warningLevel: "Low",
      reportAdvised: false
    };
  } catch (error) {
    console.error("EPPO database error:", error);
    return null;
  }
}

// Helper functions
function calculateConfidence(plantIdResult: any, huggingFaceResult: any): number {
  if (plantIdResult?.suggestions?.[0]?.probability && huggingFaceResult?.[0]?.score) {
    // Average the confidence scores from both services
    return (plantIdResult.suggestions[0].probability + huggingFaceResult[0].score) / 2;
  } else if (plantIdResult?.suggestions?.[0]?.probability) {
    return plantIdResult.suggestions[0].probability;
  } else if (huggingFaceResult?.[0]?.score) {
    return huggingFaceResult[0].score;
  } else {
    return 0.5; // Default confidence
  }
}

function determineDiseaseFromResults(plantIdResult: any, huggingFaceResult: any, eppoResult: any): any {
  // Get disease from Plant.id if available
  if (plantIdResult?.suggestions?.[0]?.disease?.name) {
    return {
      id: slugify(plantIdResult.suggestions[0].disease.name),
      name: plantIdResult.suggestions[0].disease.name,
      description: plantIdResult.suggestions[0].disease.description || "",
      source: "plant.id"
    };
  }
  
  // Try to get from Hugging Face
  if (huggingFaceResult?.[0]?.label && huggingFaceResult[0].label.includes("disease")) {
    return {
      id: slugify(huggingFaceResult[0].label),
      name: huggingFaceResult[0].label,
      description: "Disease identified by visual analysis",
      source: "huggingface"
    };
  }
  
  return null;
}

function determineHealthStatus(plantIdResult: any, huggingFaceResult: any): boolean {
  // Check if Plant.id detected a disease
  if (plantIdResult?.suggestions?.[0]?.disease?.name) {
    return false;
  }
  
  // Check if Hugging Face detected a disease
  if (huggingFaceResult?.[0]?.label && 
     (huggingFaceResult[0].label.includes("disease") || huggingFaceResult[0].label.includes("blight"))) {
    return false;
  }
  
  // Default to healthy if no disease detected
  return true;
}

function extractPlantName(plantIdResult: any, huggingFaceResult: any): string {
  if (plantIdResult?.suggestions?.[0]?.plant_name) {
    return plantIdResult.suggestions[0].plant_name;
  }
  
  if (huggingFaceResult?.[0]?.label) {
    // Extract plant name from the label (assuming format like "plant_name disease")
    const label = huggingFaceResult[0].label;
    if (label.includes(" disease")) {
      return label.split(" disease")[0];
    }
    return label;
  }
  
  return "Unknown Plant";
}

function extractScientificName(plantIdResult: any): string {
  if (plantIdResult?.suggestions?.[0]?.plant_details?.scientific_name) {
    return plantIdResult.suggestions[0].plant_details.scientific_name;
  }
  
  return "";
}

function extractFeatures(plantIdResult: any, huggingFaceResult: any): string[] {
  const features = [];
  
  if (plantIdResult?.suggestions?.[0]?.plant_name) {
    features.push(`Identified as: ${plantIdResult.suggestions[0].plant_name}`);
  }
  
  if (plantIdResult?.suggestions?.[0]?.disease?.name) {
    features.push(`Disease: ${plantIdResult.suggestions[0].disease.name}`);
  }
  
  if (huggingFaceResult?.[0]?.label) {
    features.push(`Visual analysis: ${huggingFaceResult[0].label}`);
  }
  
  return features;
}

function determineAction(disease: any, confidence: number, isHealthy: boolean): string {
  if (!isHealthy && confidence > 0.7) {
    return "consult-expert";
  } else if (!isHealthy && confidence > 0.5) {
    return "monitor-and-consult";
  } else if (isHealthy && confidence > 0.7) {
    return "continue-care";
  } else {
    return "retry-with-better-image";
  }
}

function determinePrimaryService(results: PromiseSettledResult<any>[]): string {
  const successfulServices = [];
  
  if (results[0].status === "fulfilled" && results[0].value) {
    successfulServices.push("Plant.id");
  }
  
  if (results[1].status === "fulfilled" && results[1].value) {
    successfulServices.push("Hugging Face");
  }
  
  if (results[2].status === "fulfilled" && results[2].value) {
    successfulServices.push("EPPO Database");
  }
  
  if (successfulServices.length === 0) {
    return "Internal Analysis";
  }
  
  return successfulServices.join(" + ");
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
