import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiagnosisResult {
  plantIdentification: {
    name: string;
    scientificName: string;
    confidence: number;
    commonNames: string[];
    family?: string;
    genus?: string;
    source: string;
  };
  healthAssessment: {
    isHealthy: boolean;
    overallHealthScore: number;
    diseases: Array<{
      name: string;
      probability: number;
      description: string;
      treatment: any;
      source: string;
    }>;
    pests: Array<{
      name: string;
      probability: number;
      description: string;
      treatment: string;
      source: string;
    }>;
  };
  recommendations: string[];
  sources: string[];
  confidence: number;
  metadata: {
    analysisTime: number;
    imageQuality: string;
    apiResponsesReceived: string[];
  };
}

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

// Plant.id API Analysis
async function analyzeWithPlantId(imageBase64: string): Promise<any> {
  const plantIdApiKey = Deno.env.get('PLANT_ID_API_KEY');
  
  if (!plantIdApiKey) {
    logWithTimestamp('WARN', 'Plant.id API key not available');
    return null;
  }

  try {
    logWithTimestamp('INFO', 'Starting Plant.id analysis');
    
    const [identifyResponse, healthResponse] = await Promise.allSettled([
      // Identification
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
        signal: AbortSignal.timeout(15000),
      }),
      
      // Health Assessment
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
        signal: AbortSignal.timeout(15000),
      })
    ]);

    let identification = null;
    let health = null;

    if (identifyResponse.status === 'fulfilled' && identifyResponse.value.ok) {
      identification = await identifyResponse.value.json();
      logWithTimestamp('INFO', 'Plant.id identification successful');
    }

    if (healthResponse.status === 'fulfilled' && healthResponse.value.ok) {
      health = await healthResponse.value.json();
      logWithTimestamp('INFO', 'Plant.id health assessment successful');
    }

    return { identification, health };

  } catch (error) {
    logWithTimestamp('ERROR', 'Plant.id analysis failed', { error: error.message });
    return null;
  }
}

// PlantNet API Analysis
async function analyzeWithPlantNet(imageBase64: string): Promise<any> {
  const plantNetApiKey = Deno.env.get('PLANT_NET_KEY') || Deno.env.get('PLANTNET');
  
  if (!plantNetApiKey) {
    logWithTimestamp('WARN', 'PlantNet API key not available');
    return null;
  }

  try {
    logWithTimestamp('INFO', 'Starting PlantNet analysis');
    
    // Convert base64 to blob
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('images', blob, 'plant.jpg');
    formData.append('organs', 'leaf');
    formData.append('organs', 'flower');
    formData.append('organs', 'fruit');
    formData.append('organs', 'bark');
    formData.append('include-related-images', 'true');

    const response = await fetch(
      `https://my-api.plantnet.org/v2/identify/weurope?api-key=${plantNetApiKey}`,
      {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      throw new Error(`PlantNet API error: ${response.status}`);
    }

    const data = await response.json();
    logWithTimestamp('INFO', 'PlantNet analysis successful');
    return data;

  } catch (error) {
    logWithTimestamp('ERROR', 'PlantNet analysis failed', { error: error.message });
    return null;
  }
}

// EPPO Database Analysis
async function analyzeWithEPPO(plantName: string): Promise<any> {
  const eppoAuthToken = Deno.env.get('EPPO_AUTH_TOKEN');
  
  if (!eppoAuthToken || !plantName) {
    logWithTimestamp('WARN', 'EPPO API key not available or no plant name');
    return null;
  }

  try {
    logWithTimestamp('INFO', 'Starting EPPO analysis', { plantName });
    
    const searchQueries = [
      { type: 'pests', url: `https://data.eppo.int/api/rest/1.0/tools/search?kw=${encodeURIComponent(plantName)}&searchfor=pests&authtoken=${eppoAuthToken}` },
      { type: 'plants', url: `https://data.eppo.int/api/rest/1.0/tools/search?kw=${encodeURIComponent(plantName)}&searchfor=plants&authtoken=${eppoAuthToken}` },
      { type: 'diseases', url: `https://data.eppo.int/api/rest/1.0/tools/search?kw=${encodeURIComponent(plantName)}&searchfor=diseases&authtoken=${eppoAuthToken}` }
    ];

    const results = await Promise.allSettled(
      searchQueries.map(async query => {
        try {
          const response = await fetch(query.url, {
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(10000),
          });
          
          if (!response.ok) {
            throw new Error(`EPPO ${query.type} search failed: ${response.status}`);
          }
          
          const data = await response.json();
          return { type: query.type, data: Array.isArray(data) ? data : [] };
        } catch (error) {
          logWithTimestamp('ERROR', `EPPO ${query.type} search failed`, { error: error.message });
          return { type: query.type, data: [] };
        }
      })
    );

    const eppoResult = {
      pests: [] as any[],
      plants: [] as any[],
      diseases: [] as any[]
    };

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        const { type, data } = result.value;
        eppoResult[type as keyof typeof eppoResult] = data;
      }
    });

    logWithTimestamp('INFO', 'EPPO analysis successful');
    return eppoResult;

  } catch (error) {
    logWithTimestamp('ERROR', 'EPPO analysis failed', { error: error.message });
    return null;
  }
}

// Hugging Face Image Analysis - Enhanced with plant validation
async function analyzeWithHuggingFace(imageBase64: string): Promise<any> {
  const huggingFaceToken = Deno.env.get('HUGGINGFACE_ACCESS_TOKEN');
  
  if (!huggingFaceToken) {
    logWithTimestamp('WARN', 'Hugging Face token not available');
    return null;
  }

  try {
    logWithTimestamp('INFO', 'Starting Hugging Face analysis');
    
    // Aggiungi check per il formato immagine base64
    if (!imageBase64 || !imageBase64.includes(',')) {
      throw new Error("Formato immagine non valido o mancante (base64)");
    }
    
    // Convert base64 to blob
    const base64Data = imageBase64.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // First, validate if the image contains a plant using general image classification
    const validationResponse = await fetch(
      "https://api-inference.huggingface.co/models/google/vit-base-patch16-224",
      {
        headers: {
          Authorization: `Bearer ${huggingFaceToken}`,
          "Content-Type": "application/octet-stream",
        },
        method: "POST",
        body: bytes,
        signal: AbortSignal.timeout(15000),
      }
    );

    let isPlantImage = false;
    if (validationResponse.ok) {
      const validationData = await validationResponse.json();
      logWithTimestamp('INFO', 'Image classification result', validationData);
      
      // Check if the image contains plant-related content
      if (Array.isArray(validationData)) {
        const plantRelatedLabels = validationData.filter(item => 
          item.label && (
            item.label.toLowerCase().includes('plant') ||
            item.label.toLowerCase().includes('leaf') ||
            item.label.toLowerCase().includes('flower') ||
            item.label.toLowerCase().includes('tree') ||
            item.label.toLowerCase().includes('grass') ||
            item.label.toLowerCase().includes('herb') ||
            item.label.toLowerCase().includes('botanical') ||
            item.label.toLowerCase().includes('garden') ||
            item.label.toLowerCase().includes('vegetation') ||
            item.label.toLowerCase().includes('foliage')
          )
        );
        
        isPlantImage = plantRelatedLabels.length > 0 && plantRelatedLabels[0].score > 0.1;
        logWithTimestamp('INFO', `Plant validation result: ${isPlantImage}`, plantRelatedLabels);
      }
    }

    // If not a plant image, return validation error
    if (!isPlantImage) {
      logWithTimestamp('WARN', 'Image does not appear to contain a plant');
      return { 
        isNotPlant: true, 
        message: "L'immagine caricata non sembra contenere una pianta. Per favore carica un'immagine di una pianta per ottenere una diagnosi accurata." 
      };
    }

    // Continue with plant disease classification if it's a plant
    const diseaseResponse = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/resnet-50",
      {
        headers: {
          Authorization: `Bearer ${huggingFaceToken}`,
          "Content-Type": "application/octet-stream",
        },
        method: "POST",
        body: bytes,
        signal: AbortSignal.timeout(15000),
      }
    );

    let diseaseData = null;
    if (diseaseResponse.ok) {
      diseaseData = await diseaseResponse.json();
      logWithTimestamp('INFO', 'Hugging Face disease analysis successful');
    }

    return { diseases: diseaseData, isValidPlant: true };

  } catch (error) {
    logWithTimestamp('ERROR', 'Hugging Face analysis failed', { error: error.message });
    return null;
  }
}

// Combine and process all results
function processAllResults(plantIdResult: any, plantNetResult: any, eppoResult: any, huggingFaceResult: any): DiagnosisResult {
  logWithTimestamp('INFO', 'Processing all analysis results');
  
  let bestIdentification = {
    name: "Pianta sconosciuta",
    scientificName: "Unknown species",
    confidence: 0,
    commonNames: [] as string[],
    family: "",
    genus: "",
    source: "unknown"
  };

  const diseases: any[] = [];
  const pests: any[] = [];
  const recommendations: string[] = [];
  const sources: string[] = [];
  let overallHealthScore = 1.0;

  // Process Plant.id results
  if (plantIdResult?.identification?.suggestions?.length > 0) {
    const bestMatch = plantIdResult.identification.suggestions[0];
    if (bestMatch.probability > bestIdentification.confidence) {
      bestIdentification = {
        name: bestMatch.plant_name,
        scientificName: bestMatch.plant_details?.scientific_name || bestMatch.plant_name,
        confidence: bestMatch.probability,
        commonNames: bestMatch.plant_details?.common_names || [],
        family: bestMatch.plant_details?.taxonomy?.family || "",
        genus: bestMatch.plant_details?.taxonomy?.genus || "",
        source: "Plant.id"
      };
    }
    sources.push("Plant.id");
  }

  // Process Plant.id health assessment
  if (plantIdResult?.health?.health_assessment?.diseases) {
    plantIdResult.health.health_assessment.diseases.forEach((disease: any) => {
      if (disease.probability > 0.1) { // Only include diseases with >10% probability
        diseases.push({
          name: disease.name,
          probability: disease.probability,
          description: disease.disease_details?.description || "",
          treatment: disease.disease_details?.treatment || {},
          source: "Plant.id"
        });
        overallHealthScore -= disease.probability * 0.3; // Reduce health score
      }
    });
  }

  // Process PlantNet results
  if (plantNetResult?.results?.length > 0) {
    const bestMatch = plantNetResult.results[0];
    if (bestMatch.score > bestIdentification.confidence) {
      bestIdentification = {
        name: bestMatch.species?.scientificNameWithoutAuthor || "Unknown",
        scientificName: bestMatch.species?.scientificNameWithoutAuthor || "Unknown",
        confidence: bestMatch.score,
        commonNames: bestMatch.species?.commonNames || [],
        family: bestMatch.species?.family?.scientificNameWithoutAuthor || "",
        genus: bestMatch.species?.genus?.scientificNameWithoutAuthor || "",
        source: "PlantNet"
      };
    }
    if (!sources.includes("PlantNet")) {
      sources.push("PlantNet");
    }
  }

  // Process EPPO results
  if (eppoResult) {
    if (eppoResult.diseases?.length > 0) {
      eppoResult.diseases.forEach((disease: any) => {
        diseases.push({
          name: disease.prefname || disease.fullname || "Malattia sconosciuta",
          probability: 0.7, // EPPO doesn't provide probability, use moderate confidence
          description: `Malattia identificata nel database EPPO: ${disease.prefname || disease.fullname}`,
          treatment: "Consultare un esperto per il trattamento specifico",
          source: "EPPO"
        });
      });
    }

    if (eppoResult.pests?.length > 0) {
      eppoResult.pests.forEach((pest: any) => {
        pests.push({
          name: pest.prefname || pest.fullname || "Parassita sconosciuto",
          probability: 0.7,
          description: `Parassita identificato nel database EPPO: ${pest.prefname || pest.fullname}`,
          treatment: "Consultare un esperto per il trattamento specifico",
          source: "EPPO"
        });
      });
    }

    if (!sources.includes("EPPO")) {
      sources.push("EPPO");
    }
  }

  // Process Hugging Face results
  if (huggingFaceResult?.diseases) {
    // Add any disease classifications from Hugging Face
    if (!sources.includes("Hugging Face")) {
      sources.push("Hugging Face");
    }
  }

  // Generate recommendations
  if (diseases.length === 0 && pests.length === 0) {
    recommendations.push("La pianta sembra essere sana!");
    recommendations.push("Continua a fornire cure regolari e monitora la crescita.");
  } else {
    recommendations.push("Sono state rilevate possibili problematiche sulla pianta.");
    recommendations.push("Si consiglia una valutazione da parte di un esperto agronomo.");
    
    if (diseases.length > 0) {
      recommendations.push("Malattie rilevate: considera trattamenti antifungini appropriati.");
    }
    
    if (pests.length > 0) {
      recommendations.push("Parassiti rilevati: valuta trattamenti antiparassitari.");
    }
  }

  // Add general care recommendations based on plant type
  if (bestIdentification.name !== "Pianta sconosciuta") {
    recommendations.push(`Per ${bestIdentification.name}: assicurati di seguire le cure specifiche per questa specie.`);
  }

  const isHealthy = diseases.length === 0 && pests.length === 0;
  overallHealthScore = Math.max(0, Math.min(1, overallHealthScore));

  const finalResult: DiagnosisResult = {
    plantIdentification: bestIdentification,
    healthAssessment: {
      isHealthy,
      overallHealthScore,
      diseases,
      pests
    },
    recommendations,
    sources,
    confidence: bestIdentification.confidence,
    metadata: {
      analysisTime: Date.now(),
      imageQuality: "good", // You could implement image quality assessment
      apiResponsesReceived: sources
    }
  };

  logWithTimestamp('INFO', 'All results processed successfully', {
    plantName: bestIdentification.name,
    confidence: bestIdentification.confidence,
    diseaseCount: diseases.length,
    pestCount: pests.length,
    sources: sources.length
  });

  return finalResult;
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  logWithTimestamp('INFO', '=== Comprehensive Plant Diagnosis Started ===', { requestId });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    let imageBase64: string | null = null;
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const body = await req.json();
      imageBase64 = body.imageBase64;
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('image') as File;
      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        imageBase64 = `data:image/jpeg;base64,${btoa(String.fromCharCode(...bytes))}`;
      }
    }

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    logWithTimestamp('INFO', 'Starting parallel API analysis');

    // Run all analyses in parallel for better performance
    const [plantIdResult, plantNetResult, huggingFaceResult] = await Promise.allSettled([
      analyzeWithPlantId(imageBase64),
      analyzeWithPlantNet(imageBase64),
      analyzeWithHuggingFace(imageBase64)
    ]);

    // Get results from settled promises
    const plantId = plantIdResult.status === 'fulfilled' ? plantIdResult.value : null;
    const plantNet = plantNetResult.status === 'fulfilled' ? plantNetResult.value : null;
    const huggingFace = huggingFaceResult.status === 'fulfilled' ? huggingFaceResult.value : null;

    // Check if Hugging Face detected that this is not a plant image
    if (huggingFace?.isNotPlant) {
      logWithTimestamp('WARN', 'Image validation failed - not a plant');
      return new Response(JSON.stringify({
        error: 'NOT_A_PLANT',
        message: huggingFace.message,
        plantName: "Non è una pianta",
        scientificName: "Immagine non valida",
        confidence: 0,
        isHealthy: false,
        diseases: [{
          name: "Validazione fallita",
          probability: 1.0,
          description: huggingFace.message,
          treatment: "Carica un'immagine che contenga chiaramente una pianta per ottenere una diagnosi accurata."
        }],
        recommendations: [
          "Assicurati che l'immagine contenga una pianta chiaramente visibile",
          "Usa una buona illuminazione per fotografare la pianta",
          "Evita sfondi confusi o altri oggetti nell'inquadratura",
          "Prova con diverse angolazioni della stessa pianta"
        ],
        analysisDetails: {
          source: "Image Validation",
          fallback: false,
          reason: "Image does not contain plant content",
          timestamp: new Date().toISOString()
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get plant name for EPPO search
    let plantNameForEPPO = "";
    if (plantId?.identification?.suggestions?.[0]) {
      plantNameForEPPO = plantId.identification.suggestions[0].plant_name;
    } else if (plantNet?.results?.[0]) {
      plantNameForEPPO = plantNet.results[0].species?.scientificNameWithoutAuthor || "";
    }

    // Run EPPO analysis with identified plant name
    let eppoResult = null;
    if (plantNameForEPPO) {
      const eppoAnalysis = await analyzeWithEPPO(plantNameForEPPO);
      eppoResult = eppoAnalysis;
    }

    // Process and combine all results
    const finalDiagnosis = processAllResults(plantId, plantNet, eppoResult, huggingFace);

    const totalTime = Date.now() - startTime;
    logWithTimestamp('INFO', `=== Comprehensive Plant Diagnosis Completed in ${totalTime}ms ===`, {
      requestId,
      plantName: finalDiagnosis.plantIdentification.name,
      confidence: finalDiagnosis.confidence,
      isHealthy: finalDiagnosis.healthAssessment.isHealthy
    });

    return new Response(JSON.stringify(finalDiagnosis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    logWithTimestamp('ERROR', 'Comprehensive diagnosis failed', {
      requestId,
      error: error.message,
      duration: totalTime
    });

    return new Response(JSON.stringify({
      error: 'Diagnosis failed',
      details: error.message,
      requestId
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});