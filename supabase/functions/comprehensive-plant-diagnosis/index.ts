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

// Preliminary image classification using CLIP model
async function classifyImageContentWithCLIP(imageBase64: string): Promise<{ isValidPlant: boolean; topLabel: string; confidence: number; allLabels?: any[] }> {
  const huggingFaceToken = Deno.env.get('HUGGINGFACE_ACCESS_TOKEN');
  
  if (!huggingFaceToken) {
    logWithTimestamp('WARN', 'Hugging Face token not available, skipping preliminary classification');
    return { isValidPlant: true, topLabel: "plant", confidence: 0.5 };
  }

  try {
    logWithTimestamp('INFO', 'Starting preliminary CLIP classification');
    
    if (!imageBase64 || !imageBase64.includes(',')) {
      throw new Error("Formato immagine non valido o mancante (base64)");
    }
    
    // Convert base64 to bytes
    const base64Data = imageBase64.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const labels = ["plant", "leaf", "tree", "flower", "soil", "nothing", "animal", "background", "wall", "person", "food", "object"];
    
    const response = await fetch('https://api-inference.huggingface.co/models/openai/clip-vit-base-patch16', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${huggingFaceToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          image: Array.from(bytes)
        },
        parameters: {
          candidate_labels: labels
        }
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      logWithTimestamp('ERROR', `CLIP classification failed with status: ${response.status}`);
      return { isValidPlant: true, topLabel: "plant", confidence: 0.5 };
    }

    const result = await response.json();
    logWithTimestamp('INFO', 'CLIP classification result', result);
    
    const topLabel = result?.[0]?.label?.toLowerCase() || "unknown";
    const confidence = result?.[0]?.score || 0;
    
    const isValidPlant = ["plant", "leaf", "tree", "flower"].includes(topLabel);
    
    logWithTimestamp('INFO', `CLIP result: ${topLabel} (${Math.round(confidence * 100)}%) - isValidPlant: ${isValidPlant}`);
    
    return {
      isValidPlant,
      topLabel,
      confidence,
      allLabels: result
    };
    
  } catch (error) {
    logWithTimestamp('ERROR', 'Error in CLIP classification:', error);
    return { isValidPlant: true, topLabel: "plant", confidence: 0.5 };
  }
}

// Hugging Face Image Analysis - Enhanced with CLIP preliminary validation
async function analyzeWithHuggingFace(imageBase64: string): Promise<any> {
  const huggingFaceToken = Deno.env.get('HUGGINGFACE_ACCESS_TOKEN');
  
  if (!huggingFaceToken) {
    logWithTimestamp('WARN', 'Hugging Face token not available');
    return null;
  }

  try {
    logWithTimestamp('INFO', 'Starting Hugging Face analysis with CLIP validation');
    
    // First, perform preliminary CLIP classification
    const clipResult = await classifyImageContentWithCLIP(imageBase64);
    
    // If CLIP says it's not a plant, return early with specific error
    if (!clipResult.isValidPlant) {
      let errorMessage = "Immagine non valida. Assicurati che ci sia una pianta visibile e riprova.";
      
      if (clipResult.topLabel === "animal") {
        errorMessage = "È stato rilevato un animale nell'immagine. Carica un'immagine che contenga una pianta.";
      } else if (clipResult.topLabel === "person") {
        errorMessage = "È stata rilevata una persona nell'immagine. Carica un'immagine che contenga una pianta.";
      } else if (clipResult.topLabel === "food") {
        errorMessage = "È stato rilevato del cibo nell'immagine. Carica un'immagine di una pianta viva.";
      } else if (clipResult.topLabel === "wall" || clipResult.topLabel === "background") {
        errorMessage = "L'immagine sembra contenere solo sfondo. Carica un'immagine con una pianta chiaramente visibile.";
      } else if (clipResult.topLabel === "nothing" || clipResult.topLabel === "object") {
        errorMessage = "Nessuna pianta rilevata nell'immagine. Prova a scattare una nuova foto di una pianta.";
      }
      
      logWithTimestamp('WARN', `CLIP validation failed: ${clipResult.topLabel} (${Math.round(clipResult.confidence * 100)}%)`);
      return { 
        isNotPlant: true, 
        detectedType: clipResult.topLabel,
        confidence: clipResult.confidence,
        message: errorMessage 
      };
    }
    
    logWithTimestamp('INFO', `CLIP validation passed: ${clipResult.topLabel} (${Math.round(clipResult.confidence * 100)}%)`);
    
    // Continue with detailed analysis if CLIP validation passed
    const base64Data = imageBase64.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
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

    return { 
      diseases: diseaseData, 
      isValidPlant: true,
      clipValidation: clipResult
    };

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
  let overallHealthScore = 0.5; // Start with neutral score

  // Enhanced visual analysis - if we can't identify properly, assume there might be issues
  let hasVisualSymptoms = false;
  let visualSymptomsDescription = "";
  
  // Process Plant.id results
  if (plantIdResult?.identification?.suggestions?.length > 0) {
    const bestMatch = plantIdResult.identification.suggestions[0];
    // Limit confidence to max 70%
    const limitedConfidence = Math.min(bestMatch.probability, 0.70);
    
    if (limitedConfidence > bestIdentification.confidence) {
      bestIdentification = {
        name: bestMatch.plant_name,
        scientificName: bestMatch.plant_details?.scientific_name || bestMatch.plant_name,
        confidence: limitedConfidence,
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
      if (disease.probability > 0.05) { // Lower threshold for better detection
        diseases.push({
          name: disease.name,
          probability: Math.min(disease.probability, 0.70), // Limit to 70%
          description: disease.disease_details?.description || "",
          treatment: disease.disease_details?.treatment || {},
          source: "Plant.id",
          affectedAreas: ["Foglie", "Steli"], // Default affected areas
          recommendedProducts: [
            "Fungicida Rame Biologico 500ml",
            "Olio di Neem Puro 250ml",
            "Propoli Spray Protettivo 200ml"
          ]
        });
        hasVisualSymptoms = true;
        overallHealthScore -= disease.probability * 0.4;
      }
    });
  }

  // If no diseases detected but low identification confidence, add visual assessment
  if (diseases.length === 0 && bestIdentification.confidence < 0.4) {
    hasVisualSymptoms = true;
    visualSymptomsDescription = "Rilevati possibili sintomi visivi non classificati automaticamente";
    
    diseases.push({
      name: "Sintomi Visivi Non Identificati",
      probability: 0.60, // Moderate confidence
      description: "Sono visibili alterazioni del colore e della struttura delle foglie che potrebbero indicare problemi di salute della pianta. Raccomandato controllo di un esperto.",
      treatment: {
        biological: ["Trattamento preventivo con prodotti biologici"],
        chemical: ["Controllo fitosanitario mirato"],
        cultural: ["Miglioramento delle condizioni di crescita"]
      },
      source: "Analisi Visiva",
      affectedAreas: ["Foglie", "Superficie fogliare"],
      recommendedProducts: [
        "Fungicida Rame Biologico 500ml",
        "Olio di Neem Puro 250ml", 
        "Stimolante Radicale 250ml",
        "Propoli Spray Protettivo 200ml"
      ]
    });
  }

  // Process PlantNet results
  if (plantNetResult?.results?.length > 0) {
    const bestMatch = plantNetResult.results[0];
    // Limit confidence to max 70%
    const limitedScore = Math.min(bestMatch.score, 0.70);
    
    if (limitedScore > bestIdentification.confidence) {
      bestIdentification = {
        name: bestMatch.species?.scientificNameWithoutAuthor || "Unknown",
        scientificName: bestMatch.species?.scientificNameWithoutAuthor || "Unknown",
        confidence: limitedScore,
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
          probability: 0.65, // Limited to reasonable confidence
          description: `Malattia identificata nel database EPPO: ${disease.prefname || disease.fullname}`,
          treatment: {
            biological: ["Trattamento biologico mirato"],
            chemical: ["Prodotti fitosanitari specifici"],
            cultural: ["Pratiche colturali preventive"]
          },
          source: "EPPO",
          affectedAreas: ["Zone fogliari", "Tessuti vegetali"],
          recommendedProducts: [
            "Fungicida Rame Biologico 500ml",
            "Bacillus Thuringiensis 100g",
            "Zolfo Bagnabile 1kg"
          ]
        });
      });
    }

    if (eppoResult.pests?.length > 0) {
      eppoResult.pests.forEach((pest: any) => {
        pests.push({
          name: pest.prefname || pest.fullname || "Parassita sconosciuto",
          probability: 0.65,
          description: `Parassita identificato nel database EPPO: ${pest.prefname || pest.fullname}`,
          treatment: "Consultare un esperto per il trattamento specifico",
          source: "EPPO",
          affectedAreas: ["Foglie", "Steli", "Radici"],
          recommendedProducts: [
            "Olio di Neem Puro 250ml",
            "Sapone Potassico 500ml",
            "Bacillus Thuringiensis 100g"
          ]
        });
      });
    }

    if (!sources.includes("EPPO")) {
      sources.push("EPPO");
    }
  }

  // Process Hugging Face results
  if (huggingFaceResult?.diseases) {
    if (!sources.includes("Hugging Face")) {
      sources.push("Hugging Face");
    }
  }

  // Generate enhanced recommendations
  if (diseases.length === 0 && pests.length === 0) {
    // Even if no specific diseases found, provide preventive care
    recommendations.push("🔍 Controllo visivo: Potrebbero essere presenti sintomi non facilmente classificabili");
    recommendations.push("🛡️ Trattamento preventivo raccomandato con prodotti biologici");
    recommendations.push("👨‍🔬 Consultazione con un esperto per una diagnosi più precisa");
    
    // Add some suggested products for general plant health
    diseases.push({
      name: "Prevenzione e Cura Generale",
      probability: 0.50,
      description: "Trattamento preventivo per mantenere la salute della pianta e prevenire problemi futuri",
      treatment: {
        biological: ["Prodotti biologici preventivi"],
        cultural: ["Cure colturali appropriate"]
      },
      source: "Raccomandazione Preventiva",
      affectedAreas: ["Intera pianta"],
      recommendedProducts: [
        "Propoli Spray Protettivo 200ml",
        "Stimolante Radicale 250ml",
        "Plant Vitality Boost"
      ]
    });
  } else {
    recommendations.push("⚠️ Sono state rilevate possibili problematiche sulla pianta");
    recommendations.push("🩺 Si consiglia una valutazione da parte di un esperto agronomo");
    
    if (diseases.length > 0) {
      recommendations.push("🦠 Malattie rilevate: trattamento antifungino appropriato raccomandato");
    }
    
    if (pests.length > 0) {
      recommendations.push("🐛 Parassiti rilevati: trattamento antiparassitario necessario");
    }
  }

  // Add general care recommendations based on plant type
  if (bestIdentification.name !== "Pianta sconosciuta") {
    recommendations.push(`🌱 Per ${bestIdentification.name}: seguire le cure specifiche per questa specie`);
  } else {
    recommendations.push("🔎 Identificazione della specie raccomandata per cure mirate");
  }

  // Calculate health status - be more conservative
  const isHealthy = diseases.length === 0 || (diseases.length === 1 && diseases[0].name === "Prevenzione e Cura Generale");
  overallHealthScore = Math.max(0.1, Math.min(0.9, overallHealthScore)); // Keep between 10-90%

  // Ensure confidence is never above 70%
  bestIdentification.confidence = Math.min(bestIdentification.confidence, 0.70);

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
      imageQuality: "good",
      apiResponsesReceived: sources
    }
  };

  logWithTimestamp('INFO', 'All results processed successfully', {
    plantName: bestIdentification.name,
    confidence: bestIdentification.confidence,
    diseaseCount: diseases.length,
    pestCount: pests.length,
    sources: sources.length,
    isHealthy,
    hasVisualSymptoms
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
      logWithTimestamp('WARN', 'Image validation failed - not a plant', {
        detectedType: huggingFace.detectedType,
        confidence: huggingFace.confidence
      });
      return new Response(JSON.stringify({
        error: huggingFace.message,
        detectedType: huggingFace.detectedType,
        confidence: huggingFace.confidence,
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