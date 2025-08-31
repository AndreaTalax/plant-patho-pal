
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GlobalIdentificationResult {
  plantIdentification: {
    name: string;
    scientificName: string;
    confidence: number;
    source: string;
    family?: string;
    genus?: string;
  }[];
  diseases: {
    name: string;
    confidence: number;
    symptoms: string[];
    treatments: string[];
    cause: string;
    source: string;
  }[];
  eppoInfo?: {
    plants: any[];
    pests: any[];
    diseases: any[];
  };
  success: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      throw new Error('Immagine non fornita');
    }

    console.log('🚀 Avvio identificazione globale pianta...');

    const result: GlobalIdentificationResult = {
      plantIdentification: [],
      diseases: [],
      success: false
    };

    // 1. IDENTIFICAZIONE PIANTA CON PLANT.ID
    console.log('🌱 Identificazione con Plant.ID...');
    const plantIdResult = await identifyWithPlantId(imageBase64);
    if (plantIdResult) {
      result.plantIdentification.push({
        name: plantIdResult.plantName,
        scientificName: plantIdResult.scientificName,
        confidence: Math.min(plantIdResult.confidence, 70),
        source: 'Plant.ID',
        family: plantIdResult.family,
        genus: plantIdResult.genus
      });
    }

    // 2. IDENTIFICAZIONE CON PLANTNET
    console.log('🌐 Identificazione con PlantNet...');
    const plantNetResult = await identifyWithPlantNet(imageBase64);
    if (plantNetResult) {
      result.plantIdentification.push({
        name: plantNetResult.species || 'Specie sconosciuta',
        scientificName: plantNetResult.scientificName || '',
        confidence: Math.min(Math.round(plantNetResult.confidence * 100), 70),
        source: 'PlantNet',
        family: plantNetResult.family,
        genus: plantNetResult.genus
      });
    }

    // 3. ANALISI VISIVA CON OPENAI
    console.log('👁️ Analisi visiva con OpenAI...');
    const openAiResult = await analyzeWithOpenAI(imageBase64);
    if (openAiResult) {
      if (openAiResult.plantInfo) {
        result.plantIdentification.push({
          name: openAiResult.plantInfo.nomeComune || 'Pianta identificata',
          scientificName: openAiResult.plantInfo.nomeScientifico || '',
          confidence: Math.min(openAiResult.plantInfo.confidenza || 60, 70),
          source: 'OpenAI Vision',
          family: openAiResult.plantInfo.famiglia
        });
      }
      
      if (openAiResult.malattie && openAiResult.malattie.length > 0) {
        openAiResult.malattie.forEach((malattia: any) => {
          result.diseases.push({
            name: malattia.nome,
            confidence: Math.min(malattia.confidenza || 50, 70),
            symptoms: malattia.sintomi || [],
            treatments: malattia.trattamenti || [],
            cause: malattia.causa || 'Causa da determinare tramite analisi visiva',
            source: 'OpenAI Vision'
          });
        });
      }
    }

    // 4. DIAGNOSI MALATTIE CON PLANT.ID HEALTH
    console.log('🏥 Diagnosi malattie con Plant.ID Health...');
    const healthResult = await diagnoseWithPlantIdHealth(imageBase64);
    if (healthResult && healthResult.length > 0) {
      healthResult.forEach((disease: any) => {
        result.diseases.push({
          name: disease.name,
          confidence: Math.min(disease.confidence, 70),
          symptoms: disease.symptoms || [],
          treatments: disease.treatments || [],
          cause: disease.cause || 'Identificata tramite analisi AI specializzata',
          source: 'Plant.ID Health'
        });
      });
    }

    // 5. RICERCA NEL DATABASE EPPO
    console.log('📚 Ricerca nel database EPPO...');
    const bestPlant = result.plantIdentification.sort((a, b) => b.confidence - a.confidence)[0];
    if (bestPlant) {
      const eppoResult = await searchEppoDatabase(bestPlant.name, bestPlant.scientificName);
      if (eppoResult) {
        result.eppoInfo = eppoResult;
        
        // Aggiungi informazioni EPPO se disponibili
        if (eppoResult.diseases && eppoResult.diseases.length > 0) {
          eppoResult.diseases.forEach((disease: any) => {
            result.diseases.push({
              name: disease.preferredName || disease.name,
              confidence: 65,
              symptoms: ['Malattia registrata nel database EPPO'],
              treatments: ['Consultare protocolli EPPO per trattamento specifico'],
              cause: 'Patogeno registrato in database ufficiale EPPO',
              source: 'Database EPPO'
            });
          });
        }

        if (eppoResult.pests && eppoResult.pests.length > 0) {
          eppoResult.pests.forEach((pest: any) => {
            result.diseases.push({
              name: `Parassita: ${pest.preferredName || pest.name}`,
              confidence: 65,
              symptoms: ['Parassita identificato nel database EPPO'],
              treatments: ['Trattamento antiparassitario secondo protocolli EPPO'],
              cause: 'Infestazione da parassita registrato nel database EPPO',
              source: 'Database EPPO'
            });
          });
        }
      }
    }

    // 6. ANALISI CON HUGGING FACE (se disponibile)
    console.log('🤗 Analisi con Hugging Face...');
    const hfResult = await analyzeWithHuggingFace(imageBase64);
    if (hfResult) {
      result.diseases.push({
        name: hfResult.disease || 'Condizione rilevata',
        confidence: Math.min(hfResult.confidence || 50, 70),
        symptoms: hfResult.symptoms || [],
        treatments: ['Trattamento basato su analisi AI'],
        cause: hfResult.cause || 'Identificata tramite modello di machine learning',
        source: 'Hugging Face AI'
      });
    }

    // Rimuovi duplicati e ordina per confidenza
    result.plantIdentification = removeDuplicatePlants(result.plantIdentification);
    result.diseases = removeDuplicateDiseases(result.diseases);
    
    result.success = result.plantIdentification.length > 0 || result.diseases.length > 0;

    console.log(`✅ Identificazione completata: ${result.plantIdentification.length} piante, ${result.diseases.length} problemi identificati`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Errore identificazione globale:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      plantIdentification: [],
      diseases: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Funzioni helper per ogni API
async function identifyWithPlantId(imageBase64: string) {
  try {
    const apiKey = Deno.env.get('PLANT_ID_API_KEY');
    if (!apiKey) return null;

    const response = await fetch('https://api.plant.id/v3/identification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey
      },
      body: JSON.stringify({
        images: [imageBase64],
        similar_images: true,
        plant_details: ["common_names", "taxonomy", "synonyms"],
      })
    });

    if (!response.ok) return null;
    
    const data = await response.json();
    const topSuggestion = data.suggestions?.[0];
    
    if (!topSuggestion) return null;

    return {
      plantName: topSuggestion.plant_name,
      scientificName: topSuggestion.plant_details?.scientific_name,
      confidence: Math.round((topSuggestion.probability || 0) * 100),
      family: topSuggestion.plant_details?.taxonomy?.family,
      genus: topSuggestion.plant_details?.taxonomy?.genus
    };
  } catch (error) {
    console.error('Plant.ID error:', error);
    return null;
  }
}

async function identifyWithPlantNet(imageBase64: string) {
  try {
    const apiKey = Deno.env.get('PLANTNET') || Deno.env.get('PLANT_NET_KEY');
    if (!apiKey) return null;

    // Converti base64 in blob
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

    const response = await fetch(
      `https://my-api.plantnet.org/v2/identify/weurope?api-key=${apiKey}`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) return null;
    
    const data = await response.json();
    const bestResult = data.results?.[0];
    
    if (!bestResult || bestResult.score < 0.1) return null;

    return {
      species: bestResult.species?.scientificNameWithoutAuthor,
      scientificName: bestResult.species?.scientificNameWithoutAuthor,
      confidence: bestResult.score,
      family: bestResult.species?.family?.scientificNameWithoutAuthor,
      genus: bestResult.species?.genus?.scientificNameWithoutAuthor
    };
  } catch (error) {
    console.error('PlantNet error:', error);
    return null;
  }
}

async function analyzeWithOpenAI(imageBase64: string) {
  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) return null;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `Sei un botanico esperto. Analizza l'immagine e fornisci una diagnosi completa in italiano.

Fornisci una risposta JSON con questa struttura:
{
  "plantInfo": {
    "nomeComune": "nome comune in italiano",
    "nomeScientifico": "nome scientifico completo", 
    "famiglia": "famiglia botanica",
    "confidenza": numero da 1 a 70,
    "descrizione": "descrizione della pianta osservata"
  },
  "malattie": [
    {
      "nome": "nome della malattia/problema",
      "confidenza": numero da 1 a 70,
      "sintomi": ["sintomo1", "sintomo2"],
      "trattamenti": ["trattamento1", "trattamento2"],
      "causa": "causa specifica osservata nell'immagine (es: macchie fungine visibili, ingiallimento da carenza, parassiti visibili)"
    }
  ],
  "osservazioni": "quello che vedi direttamente nell'immagine"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analizza questa pianta e identifica eventuali problemi o malattie. Concentrati su cosa osservi direttamente nell\'immagine.'
              },
              {
                type: 'image_url',
                image_url: { url: imageBase64 }
              }
            ]
          }
        ],
        max_completion_tokens: 1500
      }),
    });

    if (!response.ok) return null;

    const result = await response.json();
    try {
      const content = result.choices[0].message.content;
      return JSON.parse(content);
    } catch (parseError) {
      console.error('OpenAI JSON parse error:', parseError);
      return null;
    }
  } catch (error) {
    console.error('OpenAI error:', error);
    return null;
  }
}

async function diagnoseWithPlantIdHealth(imageBase64: string) {
  try {
    const apiKey = Deno.env.get('PLANT_ID_API_KEY');
    if (!apiKey) return [];

    const response = await fetch('https://api.plant.id/v3/health_assessment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey
      },
      body: JSON.stringify({
        images: [imageBase64],
        similar_images: true,
        disease_details: ["description", "treatment"]
      })
    });

    if (!response.ok) return [];
    
    const data = await response.json();
    
    if (!data.health_assessment?.diseases) return [];

    return data.health_assessment.diseases.map((disease: any) => ({
      name: disease.name || 'Malattia identificata',
      confidence: Math.round((disease.probability || 0) * 100),
      symptoms: disease.disease_details?.description ? [disease.disease_details.description] : [],
      treatments: disease.disease_details?.treatment ? [disease.disease_details.treatment] : [],
      cause: `Malattia identificata tramite analisi AI: ${disease.name}`
    }));
  } catch (error) {
    console.error('Plant.ID Health error:', error);
    return [];
  }
}

async function searchEppoDatabase(plantName: string, scientificName?: string) {
  try {
    const eppoKey = Deno.env.get('EPPO_API_KEY') || Deno.env.get('EPPO_AUTH_TOKEN');
    if (!eppoKey) return null;

    const searchTerms = [plantName, scientificName].filter(Boolean);
    const results = { plants: [], pests: [], diseases: [] };

    for (const term of searchTerms) {
      try {
        // Cerca piante
        const plantResponse = await fetch(`https://gd.eppo.int/search?q=${encodeURIComponent(term)}&format=json`, {
          headers: { 'Authorization': `Token ${eppoKey}` }
        });
        
        if (plantResponse.ok) {
          const plantData = await plantResponse.json();
          if (plantData && Array.isArray(plantData)) {
            results.plants.push(...plantData.slice(0, 3));
          }
        }

        // Cerca parassiti e malattie
        const pestResponse = await fetch(`https://gd.eppo.int/search?q=${encodeURIComponent(term + ' pest')}&format=json`, {
          headers: { 'Authorization': `Token ${eppoKey}` }
        });
        
        if (pestResponse.ok) {
          const pestData = await pestResponse.json();
          if (pestData && Array.isArray(pestData)) {
            results.pests.push(...pestData.slice(0, 3));
          }
        }
      } catch (error) {
        console.warn(`EPPO search failed for ${term}:`, error);
      }
    }

    return results;
  } catch (error) {
    console.error('EPPO search error:', error);
    return null;
  }
}

async function analyzeWithHuggingFace(imageBase64: string) {
  try {
    const token = Deno.env.get('HUGGINGFACE_ACCESS_TOKEN');
    if (!token) return null;

    // Usa un modello di classificazione di malattie delle piante
    const response = await fetch(
      'https://api-inference.huggingface.co/models/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification',
      {
        headers: { 'Authorization': `Bearer ${token}` },
        method: 'POST',
        body: base64ToBlob(imageBase64)
      }
    );

    if (!response.ok) return null;
    
    const result = await response.json();
    const topResult = Array.isArray(result) ? result[0] : null;
    
    if (!topResult || topResult.score < 0.3) return null;

    return {
      disease: topResult.label.replace(/_/g, ' '),
      confidence: Math.round(topResult.score * 100),
      symptoms: [`Classificato come: ${topResult.label}`],
      cause: 'Identificato tramite modello di classificazione AI specializzato'
    };
  } catch (error) {
    console.error('Hugging Face error:', error);
    return null;
  }
}

function base64ToBlob(base64: string): Blob {
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: 'image/jpeg' });
}

function removeDuplicatePlants(plants: any[]): any[] {
  const seen = new Set();
  return plants.filter(plant => {
    const key = plant.scientificName || plant.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => b.confidence - a.confidence);
}

function removeDuplicateDiseases(diseases: any[]): any[] {
  const seen = new Set();
  return diseases.filter(disease => {
    const key = disease.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => b.confidence - a.confidence);
}
