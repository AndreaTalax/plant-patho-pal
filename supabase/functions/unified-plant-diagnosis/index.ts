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
const plantNetKey = Deno.env.get('PLANT_NET_KEY');
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

// EPPO database search
async function searchEppoDatabase(plantName: string): Promise<any> {
  if (!eppoAuthToken || !plantName) {
    logWithTimestamp('WARN', 'EPPO API key not available or no plant name');
    return null;
  }

  try {
    logWithTimestamp('INFO', 'Starting EPPO database search', { plantName });
    
    const searchQueries = [
      { type: 'pests', url: `https://data.eppo.int/api/rest/1.0/tools/search?kw=${encodeURIComponent(plantName)}&searchfor=pests&authtoken=${eppoAuthToken}` },
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
      diseases: [] as any[]
    };

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        const { type, data } = result.value;
        eppoResult[type as keyof typeof eppoResult] = data;
      }
    });

    logWithTimestamp('INFO', 'EPPO search successful');
    return eppoResult;

  } catch (error) {
    logWithTimestamp('ERROR', 'EPPO search failed', { error: error.message });
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

    // Step 1: Validate image with OpenAI
    const validation = await validateImageWithOpenAI(imageBase64);
    
    if (!validation.isPlant || validation.confidence < 30) {
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

    // Step 2: Comprehensive diagnosis with OpenAI
    const openaiDiagnosis = await diagnoseWithOpenAI(imageBase64, plantInfo);

    // Step 3: Cross-validate with Plant.ID (parallel)
    const plantIdResult = await analyzeWithPlantId(imageBase64);

    // Step 4: Search EPPO database if plant identified
    let eppoResult = null;
    if (openaiDiagnosis.plantIdentification?.name) {
      eppoResult = await searchEppoDatabase(openaiDiagnosis.plantIdentification.name);
    }

    // Step 5: Merge and enhance results
    const enhancedDiagnosis = {
      ...openaiDiagnosis,
      crossValidation: {
        plantId: plantIdResult,
        eppo: eppoResult
      },
      analysisDetails: {
        source: 'Enhanced AI Analysis',
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - requestStartTime,
        imageQuality: validation.confidence / 100,
        confidence: openaiDiagnosis.plantIdentification?.confidence || 75
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
    if (plantIdResult?.health?.health_assessment?.diseases) {
      const plantIdDiseases = plantIdResult.health.health_assessment.diseases
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