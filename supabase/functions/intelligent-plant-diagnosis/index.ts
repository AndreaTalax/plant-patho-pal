import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IntelligentPlantResult {
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
  visualFeatures: {
    hasLargeLeaves: boolean;
    hasFlowers: boolean;
    seemsSucculent: boolean;
    leafColor: string;
    plantType: 'houseplant' | 'herb' | 'vegetable' | 'flower' | 'tree' | 'succulent' | 'unknown';
  };
  success: boolean;
  isFallback: boolean;
  fallbackMessage?: string;
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

    console.log('🧠 Avvio identificazione intelligente pianta...');

    const result: IntelligentPlantResult = {
      plantIdentification: [],
      diseases: [],
      visualFeatures: {
        hasLargeLeaves: false,
        hasFlowers: false,
        seemsSucculent: false,
        leafColor: 'verde',
        plantType: 'unknown'
      },
      success: false,
      isFallback: false
    };

    // 1. ANALISI VISIVA APPROFONDITA CON GPT VISION
    console.log('👁️ Analisi visiva approfondita con GPT Vision...');
    const gptAnalysis = await analyzeWithGPTVision(imageBase64);
    
    if (gptAnalysis) {
      console.log('✅ GPT Vision ha identificato:', gptAnalysis.plantInfo?.nomeComune);
      
      if (gptAnalysis.plantInfo) {
        result.plantIdentification.push({
          name: gptAnalysis.plantInfo.nomeComune,
          scientificName: gptAnalysis.plantInfo.nomeScientifico || '',
          confidence: Math.min(gptAnalysis.plantInfo.confidenza || 60, 75),
          source: 'GPT Vision AI',
          family: gptAnalysis.plantInfo.famiglia
        });
      }

      if (gptAnalysis.malattie && gptAnalysis.malattie.length > 0) {
        gptAnalysis.malattie.forEach((malattia: any) => {
          result.diseases.push({
            name: malattia.nome,
            confidence: Math.min(malattia.confidenza || 50, 75),
            symptoms: malattia.sintomi || [],
            treatments: malattia.trattamenti || [],
            cause: malattia.causa || 'Identificata tramite analisi visiva AI',
            source: 'GPT Vision AI'
          });
        });
      }

      // Estrai caratteristiche visive
      if (gptAnalysis.caratteristicheVisive) {
        result.visualFeatures = {
          hasLargeLeaves: gptAnalysis.caratteristicheVisive.foglieGrandi || false,
          hasFlowers: gptAnalysis.caratteristicheVisive.fiori || false,
          seemsSucculent: gptAnalysis.caratteristicheVisive.succulenta || false,
          leafColor: gptAnalysis.caratteristicheVisive.coloreFoglie || 'verde',
          plantType: gptAnalysis.caratteristicheVisive.tipoPianta || 'unknown'
        };
      }
    }

    // 2. IDENTIFICAZIONE CON PLANT.ID (se disponibile)
    console.log('🌱 Tentativo identificazione con Plant.ID...');
    const plantIdResult = await identifyWithPlantId(imageBase64);
    if (plantIdResult) {
      result.plantIdentification.push({
        name: plantIdResult.plantName,
        scientificName: plantIdResult.scientificName,
        confidence: Math.min(plantIdResult.confidence, 75),
        source: 'Plant.ID',
        family: plantIdResult.family,
        genus: plantIdResult.genus
      });
    }

    // 3. FALLBACK INTELLIGENTE BASATO SU CARATTERISTICHE VISIVE
    if (result.plantIdentification.length === 0) {
      console.log('🔄 Attivando fallback intelligente...');
      const intelligentFallback = generateIntelligentFallback(result.visualFeatures, gptAnalysis?.osservazioni);
      
      result.plantIdentification = intelligentFallback.plants;
      result.diseases = intelligentFallback.diseases;
      result.isFallback = true;
      result.fallbackMessage = intelligentFallback.message;
    }

    // 4. MIGLIORAMENTO NOMI PIANTE CON PLANT-NAME-EXTRACTOR
    result.plantIdentification = await improveWithPlantNameExtractor(result.plantIdentification);

    // Rimuovi duplicati e ordina per confidenza
    result.plantIdentification = removeDuplicatePlants(result.plantIdentification);
    result.diseases = removeDuplicateDiseases(result.diseases);
    result.success = result.plantIdentification.length > 0 || result.diseases.length > 0;

    console.log(`✅ Identificazione intelligente completata: ${result.plantIdentification.length} piante, ${result.diseases.length} problemi`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Errore identificazione intelligente:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      plantIdentification: [],
      diseases: [],
      visualFeatures: {
        hasLargeLeaves: false,
        hasFlowers: false,
        seemsSucculent: false,
        leafColor: 'verde',
        plantType: 'unknown'
      },
      isFallback: true,
      fallbackMessage: 'Errore durante l\'analisi. Riprova con una foto più chiara.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeWithGPTVision(imageBase64: string) {
  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      console.log('⚠️ OpenAI API key non configurata');
      return null;
    }

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
            content: `Sei un botanico esperto specializzato nell'identificazione delle piante. Analizza l'immagine con grande attenzione ai dettagli e fornisci un'identificazione precisa.

ISTRUZIONI SPECIFICHE:
- Guarda ATTENTAMENTE la forma delle foglie, il colore, la texture, la disposizione
- Se vedi foglie piccole e ovali tipiche del BASILICO, identificala come basilico
- Se vedi foglie grandi con fenestrazione, potrebbe essere Monstera
- Se vedi foglie succulente spesse, identifica come pianta grassa
- Se vedi fiori, descrivili nel dettaglio
- Osserva il tipo di vaso, terra, ambiente per determinare se è pianta da interno/esterno

Fornisci una risposta JSON precisa con questa struttura:
{
  "plantInfo": {
    "nomeComune": "nome italiano preciso della pianta (es: basilico, pomodoro, rosa, monstera)",
    "nomeScientifico": "nome scientifico completo", 
    "famiglia": "famiglia botanica",
    "confidenza": numero da 60 a 90 (sii realistico),
    "descrizione": "descrizione dettagliata di quello che vedi nell'immagine"
  },
  "caratteristicheVisive": {
    "foglieGrandi": true/false,
    "fiori": true/false,
    "succulenta": true/false,
    "coloreFoglie": "verde/giallo/marrone/rosso",
    "tipoPianta": "houseplant/herb/vegetable/flower/tree/succulent",
    "formaaFoglie": "ovale/rotonda/lanceolata/dentata",
    "tessitura": "liscia/rugosa/pelosa/cerosa"
  },
  "malattie": [
    {
      "nome": "nome specifico del problema se presente",
      "confidenza": numero da 40 a 80,
      "sintomi": ["sintomo osservato nell'immagine"],
      "trattamenti": ["trattamento specifico"],
      "causa": "causa specifica basata su quello che vedi"
    }
  ],
  "osservazioni": "descrizione dettagliata di quello che osservi nell'immagine"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analizza questa pianta e identificala con precisione. Concentrati sui dettagli delle foglie, dei fiori se presenti, e su qualsiasi segno di malattia o problema.'
              },
              {
                type: 'image_url',
                image_url: { url: imageBase64 }
              }
            ]
          }
        ],
        max_completion_tokens: 2000
      }),
    });

    if (!response.ok) {
      console.error('Errore OpenAI API:', response.status);
      return null;
    }

    const result = await response.json();
    try {
      const content = result.choices[0].message.content;
      const parsedResult = JSON.parse(content);
      console.log('📋 GPT Vision ha identificato:', parsedResult.plantInfo?.nomeComune);
      return parsedResult;
    } catch (parseError) {
      console.error('Errore parsing JSON GPT Vision:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Errore GPT Vision:', error);
    return null;
  }
}

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
    console.error('Errore Plant.ID:', error);
    return null;
  }
}

function generateIntelligentFallback(visualFeatures: any, observations?: string) {
  const plants = [];
  const diseases = [];
  let message = "Non sono riuscito a identificare con certezza la pianta";

  // Fallback intelligente basato sulle caratteristiche visive
  if (visualFeatures.plantType === 'herb') {
    plants.push(
      { name: 'Basilico', scientificName: 'Ocimum basilicum', confidence: 65, source: 'Analisi Caratteristiche', family: 'Lamiaceae' },
      { name: 'Menta', scientificName: 'Mentha spicata', confidence: 60, source: 'Analisi Caratteristiche', family: 'Lamiaceae' },
      { name: 'Rosmarino', scientificName: 'Rosmarinus officinalis', confidence: 55, source: 'Analisi Caratteristiche', family: 'Lamiaceae' }
    );
    message = "Sembra essere un'erba aromatica. Ecco i suggerimenti più probabili:";
  } else if (visualFeatures.seemsSucculent) {
    plants.push(
      { name: 'Aloe Vera', scientificName: 'Aloe barbadensis', confidence: 70, source: 'Analisi Caratteristiche', family: 'Asphodelaceae' },
      { name: 'Echeveria', scientificName: 'Echeveria elegans', confidence: 65, source: 'Analisi Caratteristiche', family: 'Crassulaceae' },
      { name: 'Jade Plant', scientificName: 'Crassula ovata', confidence: 60, source: 'Analisi Caratteristiche', family: 'Crassulaceae' }
    );
    message = "Sembra essere una pianta succulenta. Ecco i tipi più comuni:";
  } else if (visualFeatures.hasLargeLeaves) {
    plants.push(
      { name: 'Monstera Deliciosa', scientificName: 'Monstera deliciosa', confidence: 60, source: 'Analisi Caratteristiche', family: 'Araceae' },
      { name: 'Filodendro', scientificName: 'Philodendron hederaceum', confidence: 55, source: 'Analisi Caratteristiche', family: 'Araceae' },
      { name: 'Pothos', scientificName: 'Epipremnum aureum', confidence: 50, source: 'Analisi Caratteristiche', family: 'Araceae' }
    );
    message = "Sembra avere foglie grandi. Potrebbe essere una di queste piante da interno:";
  } else if (visualFeatures.hasFlowers) {
    plants.push(
      { name: 'Rosa', scientificName: 'Rosa spp.', confidence: 55, source: 'Analisi Caratteristiche', family: 'Rosaceae' },
      { name: 'Orchidea', scientificName: 'Orchidaceae', confidence: 50, source: 'Analisi Caratteristiche', family: 'Orchidaceae' },
      { name: 'Geranio', scientificName: 'Pelargonium spp.', confidence: 45, source: 'Analisi Caratteristiche', family: 'Geraniaceae' }
    );
    message = "Vedo dei fiori. Potrebbe essere una di queste piante da fiore:";
  } else {
    // Fallback generale per piante da interno comuni
    plants.push(
      { name: 'Ficus', scientificName: 'Ficus elastica', confidence: 50, source: 'Suggerimento Generale', family: 'Moraceae' },
      { name: 'Sansevieria', scientificName: 'Sansevieria trifasciata', confidence: 45, source: 'Suggerimento Generale', family: 'Asparagaceae' },
      { name: 'Pothos', scientificName: 'Epipremnum aureum', confidence: 40, source: 'Suggerimento Generale', family: 'Araceae' }
    );
    message = "Ecco alcune piante da interno comuni che potrebbero corrispondere:";
  }

  // Aggiungi problemi comuni se ci sono segni visibili
  if (visualFeatures.leafColor !== 'verde') {
    diseases.push({
      name: 'Ingiallimento foglie',
      confidence: 60,
      symptoms: ['Foglie gialle o scolorite'],
      treatments: ['Controllare irrigazione', 'Verificare esposizione alla luce', 'Fertilizzante bilanciato'],
      cause: 'Possibile stress idrico o carenza nutrizionale',
      source: 'Analisi Visiva'
    });
  }

  return { plants, diseases, message };
}

async function improveWithPlantNameExtractor(identifications: any[]) {
  // Simulazione del plant-name-extractor per migliorare i nomi
  const plantMap: Record<string, string> = {
    'basilico': 'Basilico (Ocimum basilicum)',
    'basil': 'Basilico (Ocimum basilicum)',
    'pomodoro': 'Pomodoro (Solanum lycopersicum)',
    'tomato': 'Pomodoro (Solanum lycopersicum)',
    'rosa': 'Rosa (Rosa spp.)',
    'rose': 'Rosa (Rosa spp.)',
    'monstera': 'Monstera Deliciosa (Monstera deliciosa)',
    'pothos': 'Pothos (Epipremnum aureum)',
    'aloe': 'Aloe Vera (Aloe barbadensis)'
  };

  return identifications.map(plant => {
    const lowerName = plant.name.toLowerCase();
    for (const [key, improvedName] of Object.entries(plantMap)) {
      if (lowerName.includes(key)) {
        return {
          ...plant,
          name: improvedName.split('(')[0].trim(),
          scientificName: plant.scientificName || improvedName.match(/\((.*?)\)/)?.[1] || plant.scientificName
        };
      }
    }
    return plant;
  });
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
    if (seen.has(disease.name)) return false;
    seen.add(disease.name);
    return true;
  }).sort((a, b) => b.confidence - a.confidence);
}