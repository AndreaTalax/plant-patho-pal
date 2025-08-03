import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Environment variables
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const plantIdApiKey = Deno.env.get('PLANT_ID_API_KEY');
const eppoAuthToken = Deno.env.get('EPPO_AUTH_TOKEN');
const plantNetKey = Deno.env.get('PLANT_NET_KEY') || Deno.env.get('PLANTNET');
const huggingFaceToken = Deno.env.get('HUGGINGFACE_ACCESS_TOKEN');

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

// Enhanced image validation using OpenAI GPT-4o Vision
async function validateImageWithOpenAI(imageBase64: string): Promise<{
  isPlant: boolean;
  confidence: number;
  plantType?: string;
  issues?: string[];
  errorMessage?: string;
}> {
  if (!openaiApiKey) {
    logWithTimestamp('WARN', 'OpenAI API key not available');
    return { isPlant: true, confidence: 0.5 }; // Assume valid if we can't validate
  }

  try {
    logWithTimestamp('INFO', 'Starting OpenAI image validation');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analizza questa immagine e determina:
1. Se contiene una pianta (foglie, fiori, frutti, tronco, radici visibili)
2. La confidenza (0-100%) che sia una pianta
3. Che tipo di pianta potrebbe essere (se identificabile)
4. Se ci sono problemi visibili (malattie, parassiti, danni)

Rispondi SOLO in formato JSON:
{
  "isPlant": boolean,
  "confidence": number (0-100),
  "plantType": "string or null",
  "issues": ["array di problemi visibili"],
  "errorMessage": "string se non è una pianta"
}`
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }],
        max_tokens: 500,
        temperature: 0.1
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    
    try {
      const validation = JSON.parse(content);
      logWithTimestamp('INFO', 'OpenAI validation successful', validation);
      return validation;
    } catch (parseError) {
      logWithTimestamp('ERROR', 'Failed to parse OpenAI response', { content });
      return { isPlant: true, confidence: 50 };
    }

  } catch (error) {
    logWithTimestamp('ERROR', 'OpenAI validation failed', { error: error.message });
    return { isPlant: true, confidence: 50 }; // Assume valid on error
  }
}

// Comprehensive diagnosis using OpenAI GPT-4o Vision
async function diagnoseWithOpenAI(imageBase64: string, plantInfo?: any): Promise<any> {
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    logWithTimestamp('INFO', 'Starting comprehensive OpenAI diagnosis');
    
    let contextInfo = '';
    if (plantInfo) {
      contextInfo = `
Informazioni aggiuntive sulla pianta:
- Nome: ${plantInfo.plantName || 'Non specificato'}
- Ambiente: ${plantInfo.isIndoor ? 'Interno' : 'Esterno'}
- Frequenza irrigazione: ${plantInfo.wateringFrequency || 'Non specificata'}
- Esposizione luce: ${plantInfo.lightExposure || 'Non specificata'}
- Sintomi osservati: ${plantInfo.symptoms || 'Nessuno'}
`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Sei un esperto fitopatologo. Analizza questa immagine di pianta in dettaglio e fornisci una diagnosi completa.

${contextInfo}

Analizza:
1. IDENTIFICAZIONE: Identifica la pianta (nome comune, scientifico, famiglia)
2. STATO DI SALUTE: Valuta lo stato generale (1-100%)
3. PROBLEMI: Rileva malattie, parassiti, carenze, danni
4. DIAGNOSI: Per ogni problema identificato, fornisci nome, gravità, confidenza
5. CURE: Raccomandazioni specifiche per ogni problema
6. PREVENZIONE: Consigli per prevenire futuri problemi

Rispondi in formato JSON strutturato:
{
  "plantIdentification": {
    "name": "nome comune",
    "scientificName": "nome scientifico",
    "family": "famiglia botanica",
    "confidence": number (0-100)
  },
  "healthAnalysis": {
    "isHealthy": boolean,
    "overallScore": number (0-100),
    "issues": [
      {
        "name": "nome problema",
        "type": "disease|pest|deficiency|physical_damage",
        "severity": "low|medium|high",
        "confidence": number (0-100),
        "description": "descrizione dettagliata",
        "symptoms": ["lista sintomi"],
        "treatment": ["lista trattamenti"]
      }
    ]
  },
  "recommendations": {
    "immediate": ["azioni immediate"],
    "longTerm": ["cure a lungo termine"]
  },
  "careInstructions": {
    "watering": "istruzioni irrigazione",
    "light": "requisiti di luce",
    "temperature": "temperatura ideale",
    "fertilization": "fertilizzazione"
  }
}`
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }],
        max_tokens: 2000,
        temperature: 0.2
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      throw new Error(`OpenAI diagnosis failed: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    
    try {
      const diagnosis = JSON.parse(content);
      logWithTimestamp('INFO', 'OpenAI diagnosis successful');
      return diagnosis;
    } catch (parseError) {
      logWithTimestamp('ERROR', 'Failed to parse OpenAI diagnosis', { content });
      throw new Error('Invalid diagnosis format from OpenAI');
    }

  } catch (error) {
    logWithTimestamp('ERROR', 'OpenAI diagnosis failed', { error: error.message });
    throw error;
  }
}

// Plant.ID analysis for cross-validation
async function analyzeWithPlantId(imageBase64: string): Promise<any> {
  if (!plantIdApiKey) {
    logWithTimestamp('WARN', 'Plant.ID API key not available');
    return null;
  }

  try {
    logWithTimestamp('INFO', 'Starting Plant.ID analysis');
    
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
            "synonyms"
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
      logWithTimestamp('INFO', 'Plant.ID identification successful');
    }

    if (healthResponse.status === 'fulfilled' && healthResponse.value.ok) {
      health = await healthResponse.value.json();
      logWithTimestamp('INFO', 'Plant.ID health assessment successful');
    }

    return { identification, health };

  } catch (error) {
    logWithTimestamp('ERROR', 'Plant.ID analysis failed', { error: error.message });
    return null;
  }
}

// PlantNet analysis for plant identification
async function analyzeWithPlantNet(imageBase64: string): Promise<any> {
  if (!plantNetKey) {
    logWithTimestamp('WARN', 'PlantNet API key not available');
    return null;
  }

  try {
    logWithTimestamp('INFO', 'Starting PlantNet analysis');
    
    // Convert base64 to blob for PlantNet
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    
    // Decode base64 into Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create blob from byte array
    const blob = new Blob([bytes], { type: 'image/jpeg' });

    // Prepare FormData for PlantNet
    const formData = new FormData();
    formData.append('images', blob, 'plant.jpg');
    formData.append('organs', 'leaf');
    formData.append('organs', 'flower');
    formData.append('organs', 'fruit');
    formData.append('organs', 'bark');
    formData.append('include-related-images', 'true');

    // Call PlantNet API
    const response = await fetch(
      `https://my-api.plantnet.org/v2/identify/weurope?api-key=${plantNetKey}`,
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

    // Process PlantNet results
    if (!data.results || data.results.length === 0) {
      return null;
    }

    const bestResult = data.results[0];
    const score = bestResult.score || 0;
    
    return {
      isPlant: score > 0.1,
      confidence: Math.min(score, 0.95),
      score,
      species: bestResult.species?.scientificNameWithoutAuthor,
      scientificName: bestResult.species?.scientificNameWithoutAuthor,
      commonNames: bestResult.species?.commonNames || [],
      family: bestResult.species?.family?.scientificNameWithoutAuthor,
      genus: bestResult.species?.genus?.scientificNameWithoutAuthor,
      images: bestResult.images?.map((img: any) => img.url?.m || img.url?.s || img.url?.o) || []
    };

  } catch (error) {
    logWithTimestamp('ERROR', 'PlantNet analysis failed', { error: error.message });
    return null;
  }
}

// Enhanced EPPO database search with comprehensive lookup
async function searchEppoDatabase(plantName: string, scientificName?: string): Promise<any> {
  if (!eppoAuthToken || !plantName) {
    logWithTimestamp('WARN', 'EPPO API key not available or no plant name');
    return null;
  }

  try {
    logWithTimestamp('INFO', 'Starting enhanced EPPO database search', { plantName, scientificName });
    
    // Create multiple search terms for better coverage
    const searchTerms = [plantName];
    if (scientificName && scientificName !== plantName) {
      searchTerms.push(scientificName);
    }

    // Search for plants, pests, and diseases
    const searchQueries = [];
    
    for (const term of searchTerms) {
      searchQueries.push(
        { type: 'plants', term, url: `https://data.eppo.int/api/rest/1.0/tools/search?kw=${encodeURIComponent(term)}&searchfor=plants&authtoken=${eppoAuthToken}` },
        { type: 'pests', term, url: `https://data.eppo.int/api/rest/1.0/tools/search?kw=${encodeURIComponent(term)}&searchfor=pests&authtoken=${eppoAuthToken}` },
        { type: 'diseases', term, url: `https://data.eppo.int/api/rest/1.0/tools/search?kw=${encodeURIComponent(term)}&searchfor=diseases&authtoken=${eppoAuthToken}` }
      );
    }

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
          return { type: query.type, term: query.term, data: Array.isArray(data) ? data : [] };
        } catch (error) {
          logWithTimestamp('ERROR', `EPPO ${query.type} search failed for ${query.term}`, { error: error.message });
          return { type: query.type, term: query.term, data: [] };
        }
      })
    );

    const eppoResult = {
      plants: [] as any[],
      pests: [] as any[],
      diseases: [] as any[],
      searchTerms: searchTerms
    };

    // Aggregate results and remove duplicates
    const seenCodes = new Set();
    
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        const { type, data } = result.value;
        data.forEach((item: any) => {
          const code = item.codeid || item.eppocode;
          if (code && !seenCodes.has(code)) {
            seenCodes.add(code);
            eppoResult[type as keyof typeof eppoResult].push(item);
          }
        });
      }
    });

    logWithTimestamp('INFO', 'Enhanced EPPO search successful', {
      plants: eppoResult.plants.length,
      pests: eppoResult.pests.length,
      diseases: eppoResult.diseases.length
    });
    
    return eppoResult;

  } catch (error) {
    logWithTimestamp('ERROR', 'Enhanced EPPO search failed', { error: error.message });
    return null;
  }
}

// Main handler
serve(async (req) => {
  const requestId = crypto.randomUUID();
  const requestStartTime = Date.now();
  
  logWithTimestamp('INFO', `=== Unified Plant Diagnosis Started ===`, { requestId });

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

    const { imageBase64, plantInfo } = await req.json();
    
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'No image data provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    logWithTimestamp('INFO', 'Starting unified plant diagnosis', { requestId });

    // Step 1: Validate image with OpenAI (with fallback)
    let validation = { isPlant: true, confidence: 85, errorMessage: '' };
    try {
      validation = await validateImageWithOpenAI(imageBase64);
    } catch (validationError) {
      logWithTimestamp('WARN', 'OpenAI validation failed, proceeding with basic validation', { error: validationError.message });
      // Fallback: assume it's a plant if other validations pass
      validation = { isPlant: true, confidence: 75, errorMessage: 'Validazione base utilizzata' };
    }
    
    if (!validation.isPlant || validation.confidence < 20) {
      const errorMessage = validation.errorMessage || 
        'Immagine non valida. Assicurati che ci sia una pianta chiaramente visibile.';
      
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage,
        validation,
        isValidPlantImage: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 2: Run all AI services in parallel for maximum efficiency
    const [openaiDiagnosis, plantIdResult, plantNetResult] = await Promise.allSettled([
      diagnoseWithOpenAI(imageBase64, plantInfo),
      analyzeWithPlantId(imageBase64),
      analyzeWithPlantNet(imageBase64)
    ]);

    // Extract results from settled promises
    const aiDiagnosis = openaiDiagnosis.status === 'fulfilled' ? openaiDiagnosis.value : null;
    const plantIdData = plantIdResult.status === 'fulfilled' ? plantIdResult.value : null;
    const plantNetData = plantNetResult.status === 'fulfilled' ? plantNetResult.value : null;

    // Check if we have at least one working AI service
    if (!aiDiagnosis && !plantIdData && !plantNetData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Tutti i servizi AI non sono disponibili. Riprova più tardi.',
        requestId,
        validation
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create fallback diagnosis if OpenAI fails but other services work
    let baseDiagnosis = aiDiagnosis;
    if (!aiDiagnosis) {
      logWithTimestamp('WARN', 'OpenAI failed, creating fallback diagnosis from other services');
      baseDiagnosis = {
        plantIdentification: {
          name: plantNetData?.commonNames?.[0] || plantIdData?.identification?.suggestions?.[0]?.plant_name || 'Pianta non identificata',
          scientificName: plantNetData?.scientificName || plantIdData?.identification?.suggestions?.[0]?.plant_details?.scientific_name || 'Specie sconosciuta',
          family: plantNetData?.family || plantIdData?.identification?.suggestions?.[0]?.plant_details?.taxonomy?.family || 'Famiglia sconosciuta',
          confidence: Math.max(
            (plantNetData?.confidence || 0) * 100,
            (plantIdData?.identification?.suggestions?.[0]?.probability || 0) * 100
          )
        },
        healthAnalysis: {
          isHealthy: true,
          overallScore: 75,
          issues: []
        },
        recommendations: {
          immediate: ['Consultare un esperto per una diagnosi più dettagliata'],
          longTerm: ['Monitorare regolarmente la pianta']
        },
        careInstructions: {
          watering: 'Innaffiare quando il terreno è asciutto',
          light: 'Fornire luce adeguata',
          temperature: 'Mantenere a temperatura ambiente',
          fertilization: 'Fertilizzare durante la stagione di crescita'
        }
      };
    }

    // Step 3: Enhanced plant identification using all sources
    let bestPlantName = aiDiagnosis.plantIdentification?.name;
    let bestScientificName = aiDiagnosis.plantIdentification?.scientificName;

    // Use PlantNet data for better identification if available
    if (plantNetData?.scientificName && plantNetData.confidence > 0.3) {
      bestScientificName = plantNetData.scientificName;
      if (plantNetData.commonNames?.length > 0) {
        bestPlantName = plantNetData.commonNames[0];
      }
    }

    // Step 4: Enhanced EPPO database search with multiple identifiers
    let eppoResult = null;
    if (bestPlantName) {
      eppoResult = await searchEppoDatabase(bestPlantName, bestScientificName);
    }

    // Step 5: Merge and enhance results with all AI sources
    const enhancedDiagnosis = {
      ...aiDiagnosis,
      plantIdentification: {
        ...aiDiagnosis.plantIdentification,
        // Override with PlantNet data if more reliable
        name: bestPlantName,
        scientificName: bestScientificName,
        // Add PlantNet specific data
        plantNetMatch: plantNetData ? {
          species: plantNetData.species,
          family: plantNetData.family,
          genus: plantNetData.genus,
          confidence: plantNetData.confidence,
          commonNames: plantNetData.commonNames
        } : null
      },
      crossValidation: {
        plantId: plantIdData,
        plantNet: plantNetData,
        eppo: eppoResult
      },
      analysisDetails: {
        source: 'Multi-AI Enhanced Analysis',
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - requestStartTime,
        imageQuality: validation.confidence / 100,
        confidence: Math.max(
          aiDiagnosis.plantIdentification?.confidence || 0,
          plantNetData?.confidence * 100 || 0
        ),
        aiServicesUsed: {
          openai: !!aiDiagnosis,
          plantId: !!plantIdData,
          plantNet: !!plantNetData,
          eppo: !!eppoResult
        }
      }
    };

    // Add EPPO findings to health analysis if available
    if (eppoResult) {
      if (eppoResult.diseases?.length > 0) {
        enhancedDiagnosis.healthAnalysis.issues.push(
          ...eppoResult.diseases.map((disease: any) => ({
            name: disease.prefname || disease.fullname,
            type: 'disease',
            severity: 'medium',
            confidence: 80,
            description: `Malattia identificata nel database EPPO: ${disease.prefname || disease.fullname}`,
            symptoms: [],
            treatment: ['Consultare database EPPO per trattamenti specifici']
          }))
        );
      }

      if (eppoResult.pests?.length > 0) {
        enhancedDiagnosis.healthAnalysis.issues.push(
          ...eppoResult.pests.map((pest: any) => ({
            name: pest.prefname || pest.fullname,
            type: 'pest',
            severity: 'medium',
            confidence: 80,
            description: `Parassita identificato nel database EPPO: ${pest.prefname || pest.fullname}`,
            symptoms: [],
            treatment: ['Consultare database EPPO per trattamenti specifici']
          }))
        );
      }
    }

    // Add Plant.ID cross-validation data
    if (plantIdData?.health?.health_assessment?.diseases) {
      const plantIdDiseases = plantIdData.health.health_assessment.diseases
        .filter((disease: any) => disease.probability > 0.2)
        .map((disease: any) => ({
          name: disease.name,
          type: 'disease',
          severity: disease.probability > 0.7 ? 'high' : disease.probability > 0.4 ? 'medium' : 'low',
          confidence: Math.round(disease.probability * 100),
          description: disease.disease_details?.description || '',
          symptoms: [],
          treatment: Object.values(disease.disease_details?.treatment || {}).flat()
        }));

      enhancedDiagnosis.healthAnalysis.issues.push(...plantIdDiseases);
    }

    logWithTimestamp('INFO', 'Unified diagnosis completed successfully', { 
      requestId,
      plantName: enhancedDiagnosis.plantIdentification.name,
      issuesFound: enhancedDiagnosis.healthAnalysis.issues.length,
      processingTime: Date.now() - requestStartTime
    });

    return new Response(JSON.stringify({
      success: true,
      diagnosis: enhancedDiagnosis,
      validation,
      isValidPlantImage: true
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    logWithTimestamp('ERROR', 'Unified diagnosis failed', { 
      requestId,
      error: error.message,
      stack: error.stack,
      processingTime: Date.now() - requestStartTime
    });

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Errore durante la diagnosi',
      requestId
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});