import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Environment variables per le API reali
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const plantIdApiKey = Deno.env.get('PLANT_ID_API_KEY');
const plantNetApiKey = Deno.env.get('PLANTNET_API_KEY');
const eppoApiKey = Deno.env.get('EPPO_API_KEY');
const huggingFaceToken = Deno.env.get('HUGGINGFACE_ACCESS_TOKEN');

console.log('🔑 API Keys available:', {
  openai: !!openaiApiKey,
  plantId: !!plantIdApiKey,
  plantNet: !!plantNetApiKey,
  eppo: !!eppoApiKey,
  huggingFace: !!huggingFaceToken
});

interface PlantIdentification {
  name: string;
  scientificName: string;
  confidence: number;
  source: string;
  family?: string;
}

interface DiseaseDetection {
  name: string;
  confidence: number;
  symptoms: string[];
  treatments: string[];
  cause: string;
  source: string;
  severity: 'low' | 'medium' | 'high';
}

interface DiagnosisResult {
  plantIdentification: PlantIdentification[];
  diseases: DiseaseDetection[];
  healthAnalysis: {
    isHealthy: boolean;
    overallScore: number;
    issues: any[];
  };
  recommendations: {
    immediate: string[];
    longTerm: string[];
  };
  analysisDetails: {
    timestamp: string;
    apiServicesUsed: string[];
    totalConfidence: number;
  };
}

async function identifyWithPlantId(imageBase64: string): Promise<PlantIdentification[]> {
  if (!plantIdApiKey) {
    console.log('⚠️ Plant.id API key not available');
    return [];
  }

  try {
    console.log('🌿 Calling Plant.id identification API...');
    
    const response = await fetch("https://api.plant.id/v2/identify", {
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
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`Plant.id API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Plant.id response received:', data.suggestions?.length || 0, 'suggestions');
    
    if (!data.suggestions || data.suggestions.length === 0) {
      return [];
    }

    return data.suggestions.slice(0, 3).map((suggestion: any) => ({
      name: suggestion.plant_details?.common_names?.[0] || suggestion.plant_name,
      scientificName: suggestion.plant_name,
      confidence: Math.round(suggestion.probability * 100),
      source: 'Plant.id',
      family: suggestion.plant_details?.taxonomy?.family
    }));

  } catch (error) {
    console.error('❌ Plant.id identification error:', error.message);
    return [];
  }
}

async function diagnoseWithPlantIdHealth(imageBase64: string): Promise<DiseaseDetection[]> {
  if (!plantIdApiKey) {
    console.log('⚠️ Plant.id API key not available for health diagnosis');
    return [];
  }

  try {
    console.log('🏥 Calling Plant.id health assessment API...');
    
    const response = await fetch("https://api.plant.id/v2/health_assessment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": plantIdApiKey
      },
      body: JSON.stringify({
        images: [imageBase64],
        modifiers: ["crops_fast", "similar_images"],
        language: "it",
        disease_details: [
          "common_names",
          "description", 
          "treatment",
          "classification",
          "cause",
          "local_name"
        ]
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`Plant.id Health API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Plant.id health response received');
    
    if (!data.health_assessment?.diseases) {
      return [];
    }

    return data.health_assessment.diseases
      .filter((disease: any) => disease.probability > 0.05)
      .slice(0, 8)
      .map((disease: any) => {
        const details = disease.disease_details || {};
        
        // Estrai sintomi dalla descrizione
        let symptoms: string[] = [];
        if (details.description) {
          symptoms.push(details.description);
        }
        if (details.local_name && details.local_name !== disease.name) {
          symptoms.push(`Nome locale: ${details.local_name}`);
        }
        
        // Estrai trattamenti dettagliati
        let treatments: string[] = [];
        if (details.treatment) {
          if (Array.isArray(details.treatment.biological) && details.treatment.biological.length > 0) {
            treatments.push('BIOLOGICO: ' + details.treatment.biological.join('; '));
          }
          if (Array.isArray(details.treatment.chemical) && details.treatment.chemical.length > 0) {
            treatments.push('CHIMICO: ' + details.treatment.chemical.join('; '));
          }
          if (Array.isArray(details.treatment.prevention) && details.treatment.prevention.length > 0) {
            treatments.push('PREVENZIONE: ' + details.treatment.prevention.join('; '));
          }
        }
        
        // Determina la causa dettagliata
        let cause = 'Malattia identificata';
        if (details.cause) {
          cause = details.cause;
        } else if (details.classification) {
          const classification = details.classification;
          if (classification.kingdom) cause = classification.kingdom;
          if (classification.phylum) cause += ` (${classification.phylum})`;
          if (classification.class) cause += ` - ${classification.class}`;
        }
        
        return {
          name: disease.name || disease.disease_details?.common_names?.[0] || 'Problema identificato',
          confidence: Math.round(disease.probability * 100),
          symptoms: symptoms.length > 0 ? symptoms : ['Sintomi visibili nell\'analisi dell\'immagine'],
          treatments: treatments.length > 0 ? treatments : ['Consultare un fitopatologo per trattamenti specifici'],
          cause,
          source: 'Plant.id Health Assessment',
          severity: disease.probability > 0.6 ? 'high' : disease.probability > 0.3 ? 'medium' : 'low'
        };
      });

  } catch (error) {
    console.error('❌ Plant.id health diagnosis error:', error.message);
    return [];
  }
}

async function identifyWithPlantNet(imageBase64: string): Promise<PlantIdentification[]> {
  if (!plantNetApiKey) {
    console.log('⚠️ PlantNet API key not available');
    return [];
  }

  try {
    console.log('🌍 Calling PlantNet API...');
    
    // Convert base64 to blob
    const base64Data = imageBase64.split('base64,')[1];
    const binaryData = atob(base64Data);
    const uint8Array = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      uint8Array[i] = binaryData.charCodeAt(i);
    }
    const blob = new Blob([uint8Array], { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('images', blob, 'plant.jpg');
    formData.append('modifiers', 'crops');
    formData.append('api-key', plantNetApiKey);

    const response = await fetch('https://my-api.plantnet.org/v1/identify/auto', {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`PlantNet API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ PlantNet response received:', data.results?.length || 0, 'results');
    
    if (!data.results || data.results.length === 0) {
      return [];
    }

    return data.results.slice(0, 3).map((result: any) => ({
      name: result.species?.scientificNameWithoutAuthor || 'Specie identificata',
      scientificName: result.species?.scientificNameWithoutAuthor || '',
      confidence: Math.round(result.score * 100),
      source: 'PlantNet',
      family: result.species?.family?.scientificNameWithoutAuthor
    }));

  } catch (error) {
    console.error('❌ PlantNet identification error:', error.message);
    return [];
  }
}

async function analyzeWithOpenAI(imageBase64: string): Promise<{ plants: PlantIdentification[], diseases: DiseaseDetection[] }> {
  if (!openaiApiKey) {
    console.log('⚠️ OpenAI API key not available');
    return { plants: [], diseases: [] };
  }

  try {
    console.log('🤖 Calling OpenAI Vision API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Sei un esperto fitopatologo con anni di esperienza nel riconoscimento di malattie delle piante. Analizza attentamente l'immagine fornita e identifica:

1. La pianta (nome comune italiano e nome scientifico)
2. Eventuali malattie, parassiti, carenze nutrizionali o problemi fisiologici
3. Sintomi visibili specifici e dettagliati
4. Trattamenti consigliati specifici con principi attivi quando possibile
5. Cause precise della malattia o del problema

Sii MOLTO SPECIFICO nelle diagnosi. Non usare termini generici come "rust" o "fungal disease", ma indica il nome scientifico della malattia (es. "Puccinia graminis - Ruggine del grano", "Phytophthora infestans - Peronospora della patata", "Alternaria solani - Alternariosi del pomodoro").

Per i sintomi, descrivi dettagliatamente cosa si vede (es. "macchie circolari brune con alone giallo sul margine fogliare" invece di "macchie sulle foglie").

Per i trattamenti, indica prodotti specifici o principi attivi (es. "tebuconazolo" invece di "fungicida") e distingui tra trattamenti biologici e chimici.

Rispondi in formato JSON con questa struttura:
{
  "pianta": {
    "nomeComune": "nome italiano della pianta",
    "nomeScientifico": "nome scientifico completo (Genere species)",
    "famiglia": "famiglia botanica",
    "confidenza": numero 1-100
  },
  "malattie": [
    {
      "nome": "Nome completo specifico della malattia (nome scientifico + nome comune)",
      "confidenza": numero 1-100,
      "sintomi": ["lista dettagliata dei sintomi visibili specifici"],
      "trattamenti": ["trattamenti specifici con principi attivi o metodi"],
      "causa": "agente patogeno specifico (es. fungo, batterio, virus, carenza) con nome scientifico",
      "gravita": "bassa|media|alta"
    }
  ],
  "salute": {
    "punteggioGenerale": numero 1-100,
    "sana": true/false,
    "note": "note specifiche sullo stato della pianta"
  }
}`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analizza questa pianta e identifica eventuali problemi:' },
              { type: 'image_url', image_url: { url: imageBase64 } }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      }),
      signal: AbortSignal.timeout(20000)
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      return { plants: [], diseases: [] };
    }

    console.log('✅ OpenAI analysis received');
    
    try {
      const analysis = JSON.parse(content);
      
      const plants: PlantIdentification[] = [];
      const diseases: DiseaseDetection[] = [];
      
      if (analysis.pianta) {
        plants.push({
          name: analysis.pianta.nomeComune || 'Pianta identificata',
          scientificName: analysis.pianta.nomeScientifico || '',
          confidence: analysis.pianta.confidenza || 70,
          source: 'OpenAI Vision',
          family: analysis.pianta.famiglia
        });
      }
      
      if (analysis.malattie && Array.isArray(analysis.malattie)) {
        diseases.push(...analysis.malattie.map((malattia: any) => ({
          name: malattia.nome || 'Problema identificato',
          confidence: malattia.confidenza || 60,
          symptoms: malattia.sintomi || [],
          treatments: malattia.trattamenti || [],
          cause: malattia.causa || 'Analisi AI',
          source: 'OpenAI Vision',
          severity: malattia.gravita === 'alta' ? 'high' : malattia.gravita === 'media' ? 'medium' : 'low'
        })));
      }
      
      return { plants, diseases };
      
    } catch (parseError) {
      console.error('❌ Error parsing OpenAI response:', parseError);
      return { plants: [], diseases: [] };
    }

  } catch (error) {
    console.error('❌ OpenAI analysis error:', error.message);
    return { plants: [], diseases: [] };
  }
}

async function searchEppoDatabase(plantName: string): Promise<DiseaseDetection[]> {
  if (!eppoApiKey) {
    console.log('⚠️ EPPO API key not available');
    return [];
  }

  try {
    console.log('🗄️ Searching EPPO database for:', plantName);
    
    // Prima cerca la pianta per ottenere il codice EPPO
    const searchResponse = await fetch(`https://data.eppo.int/api/rest/1.0/tools/search?kw=${encodeURIComponent(plantName)}&searchfor=plants`, {
      headers: {
        'authtoken': eppoApiKey,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!searchResponse.ok) {
      throw new Error(`EPPO search API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    
    if (!searchData || searchData.length === 0) {
      console.log('⚠️ No EPPO results for plant:', plantName);
      return [];
    }

    // Prendi il primo risultato (quello più rilevante)
    const plantCode = searchData[0]?.eppocode;
    
    if (!plantCode) {
      return [];
    }

    // Cerca le malattie associate a questa pianta
    const hostsResponse = await fetch(`https://data.eppo.int/api/rest/1.0/tools/hosts?hostcode=${plantCode}`, {
      headers: {
        'authtoken': eppoApiKey,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!hostsResponse.ok) {
      throw new Error(`EPPO hosts API error: ${hostsResponse.status}`);
    }

    const hostsData = await hostsResponse.json();
    console.log('✅ EPPO database search completed');
    
    if (!hostsData || !Array.isArray(hostsData)) {
      return [];
    }

    // Filtra e mappa le malattie più rilevanti
    const diseases = hostsData
      .filter((item: any) => item.pestcode && item.fullname)
      .slice(0, 5)
      .map((item: any) => ({
        name: `${item.fullname} (Codice EPPO: ${item.pestcode})`,
        confidence: 70,
        symptoms: [
          `Patogeno registrato nel database EPPO come minaccia per ${plantName}`,
          item.preferred ? 'Classificato come organismo di quarantena o regolamentato' : 'Organismo dannoso conosciuto'
        ],
        treatments: [
          'Consultare le linee guida fitosanitarie EPPO specifiche per questo patogeno',
          'Applicare protocolli di prevenzione e controllo secondo normativa fitosanitaria europea'
        ],
        cause: `Organismo dannoso catalogato EPPO: ${item.codetype || 'Patogeno'}`,
        source: 'Database EPPO (European and Mediterranean Plant Protection Organization)',
        severity: item.preferred ? 'high' as const : 'medium' as const
      }));

    return diseases;

  } catch (error) {
    console.error('❌ EPPO database search error:', error.message);
    return [];
  }
}

function generateRecommendations(plants: PlantIdentification[], diseases: DiseaseDetection[]): any {
  const hasIssues = diseases.length > 0;
  const highSeverityIssues = diseases.filter(d => d.severity === 'high').length > 0;
  
  const immediate = [
    '🔍 Ispeziona attentamente la pianta',
    '📸 Documenta eventuali cambiamenti',
    hasIssues ? '⚠️ Isola la pianta per prevenire diffusione' : '💧 Controlla l\'umidità del terreno',
    highSeverityIssues ? '🚨 Contatta un esperto fitopatologo' : '☀️ Verifica le condizioni di luce'
  ];

  const longTerm = [
    '📅 Programma controlli regolari',
    '🌱 Mantieni condizioni ambientali ottimali',
    '📚 Studia le esigenze specifiche della specie identificata',
    '🧪 Considera test di laboratorio per conferma diagnosi'
  ];

  return { immediate, longTerm };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  try {
    console.log(`🔬 Starting real plant diagnosis [${requestId}]`);
    
    const { imageBase64, plantInfo } = await req.json();
    
    if (!imageBase64) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Nessuna immagine fornita'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Esegui tutte le analisi in parallelo per le API reali
    console.log('🔄 Running parallel analysis with real APIs...');
    
    const [
      plantIdResults,
      plantIdHealthResults, 
      plantNetResults,
      openAiResults
    ] = await Promise.allSettled([
      identifyWithPlantId(imageBase64),
      diagnoseWithPlantIdHealth(imageBase64),
      identifyWithPlantNet(imageBase64),
      analyzeWithOpenAI(imageBase64)
    ]);

    // Raccogli risultati
    const allPlants: PlantIdentification[] = [];
    const allDiseases: DiseaseDetection[] = [];
    const usedServices: string[] = [];

    // Plant.id identification
    if (plantIdResults.status === 'fulfilled' && plantIdResults.value.length > 0) {
      allPlants.push(...plantIdResults.value);
      usedServices.push('Plant.id');
    }

    // Plant.id health
    if (plantIdHealthResults.status === 'fulfilled' && plantIdHealthResults.value.length > 0) {
      allDiseases.push(...plantIdHealthResults.value);
      if (!usedServices.includes('Plant.id')) usedServices.push('Plant.id Health');
    }

    // PlantNet
    if (plantNetResults.status === 'fulfilled' && plantNetResults.value.length > 0) {
      allPlants.push(...plantNetResults.value);
      usedServices.push('PlantNet');
    }

    // OpenAI
    if (openAiResults.status === 'fulfilled') {
      const { plants, diseases } = openAiResults.value;
      if (plants.length > 0) allPlants.push(...plants);
      if (diseases.length > 0) allDiseases.push(...diseases);
      if (plants.length > 0 || diseases.length > 0) usedServices.push('OpenAI Vision');
    }

    // EPPO search basato sulla pianta identificata
    if (allPlants.length > 0) {
      const bestPlant = allPlants.sort((a, b) => b.confidence - a.confidence)[0];
      const eppoResults = await searchEppoDatabase(bestPlant.scientificName || bestPlant.name);
      if (eppoResults.length > 0) {
        allDiseases.push(...eppoResults);
        usedServices.push('EPPO Database');
      }
    }

    // Calcola salute generale
    const isHealthy = allDiseases.length === 0 || allDiseases.every(d => d.severity === 'low');
    const overallScore = Math.max(20, 100 - (allDiseases.length * 15) - (allDiseases.filter(d => d.severity === 'high').length * 20));

    const issues = allDiseases.map(disease => ({
      name: disease.name,
      type: 'disease',
      severity: disease.severity,
      confidence: disease.confidence,
      description: disease.symptoms.join('. '),
      symptoms: disease.symptoms,
      treatment: disease.treatments
    }));

    const recommendations = generateRecommendations(allPlants, allDiseases);
    
    const totalConfidence = allPlants.length > 0 ? 
      Math.round(allPlants.reduce((sum, p) => sum + p.confidence, 0) / allPlants.length) : 0;

    const result: DiagnosisResult = {
      plantIdentification: allPlants.slice(0, 5), // Top 5 identificazioni
      diseases: allDiseases.slice(0, 10), // Top 10 problemi
      healthAnalysis: {
        isHealthy,
        overallScore,
        issues
      },
      recommendations,
      analysisDetails: {
        timestamp: new Date().toISOString(),
        apiServicesUsed: usedServices,
        totalConfidence
      }
    };

    const processingTime = Date.now() - startTime;
    console.log(`✅ Real plant diagnosis completed [${requestId}] in ${processingTime}ms`);
    console.log(`📊 Results: ${allPlants.length} plants, ${allDiseases.length} issues identified`);
    console.log(`🔧 Services used: ${usedServices.join(', ')}`);

    return new Response(JSON.stringify({
      success: true,
      diagnosis: result,
      processingTime: `${processingTime}ms`,
      requestId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error(`❌ Real plant diagnosis error [${requestId}]:`, error.message);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      requestId
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});