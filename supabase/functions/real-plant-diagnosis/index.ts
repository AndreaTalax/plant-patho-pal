import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Env vars
const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
const plantIdApiKey = Deno.env.get("PLANT_ID_API_KEY");
const plantNetApiKey = Deno.env.get("PLANTNET_API_KEY");
const eppoAuthToken = Deno.env.get("EPPO_AUTH_TOKEN");

// Helpers
function safeJson<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch (e) {
    console.error("❌ JSON parsing error:", e);
    return fallback;
  }
}

async function safeFetch<T>(fn: () => Promise<T>, label: string): Promise<T | null> {
  try {
    return await fn();
  } catch (e) {
    console.error(`❌ ${label} failed:`, e);
    return null;
  }
}

// Plant.id identification
async function identifyWithPlantId(imageBase64: string) {
  if (!plantIdApiKey) return [];
  return safeFetch(async () => {
    const res = await fetch("https://api.plant.id/v2/identify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": plantIdApiKey,
      },
      body: JSON.stringify({
        images: [imageBase64],
        modifiers: ["crops_fast", "similar_images"],
        plant_language: "it",
        plant_details: ["common_names", "taxonomy"],
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Plant.id error: ${res.status}`);
    const data = await res.json();
    return data.suggestions?.map((s: any) => ({
      name: s.plant_details?.common_names?.[0] || s.plant_name,
      scientificName: s.plant_name,
      confidence: Math.round(s.probability * 100),
      source: "Plant.id",
    })) ?? [];
  }, "Plant.id API");
}

// PlantNet identification
async function identifyWithPlantNet(imageBase64: string) {
  if (!plantNetApiKey) return [];
  return safeFetch(async () => {
    const base64Data = imageBase64.split("base64,")[1];
    const binaryData = atob(base64Data);
    const uint8Array = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      uint8Array[i] = binaryData.charCodeAt(i);
    }
    const blob = new Blob([uint8Array], { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("images", blob, "plant.jpg");
    formData.append("modifiers", "crops");
    formData.append("api-key", plantNetApiKey);

    const res = await fetch("https://my-api.plantnet.org/v1/identify/auto", {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`PlantNet error: ${res.status}`);
    const data = await res.json();
    return data.results?.map((r: any) => ({
      name: r.species?.scientificNameWithoutAuthor || "Specie identificata",
      scientificName: r.species?.scientificNameWithoutAuthor || "",
      confidence: Math.round(r.score * 100),
      source: "PlantNet",
    })) ?? [];
  }, "PlantNet API");
}

// Plant.id Health Assessment - diagnosi malattie specifiche
async function assessPlantHealth(imageBase64: string) {
  if (!plantIdApiKey) return [];
  return safeFetch(async () => {
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
    
    console.log("🏥 Chiamata Plant.id Health Assessment API...");
    
    const res = await fetch("https://api.plant.id/v3/health_assessment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": plantIdApiKey,
      },
      body: JSON.stringify({
        images: [cleanBase64],
        modifiers: ["crops_fast", "similar_images", "health_all"],
        disease_details: [
          "cause",
          "common_names",
          "classification",
          "description",
          "treatment",
          "url",
          "local_name"
        ],
        plant_details: ["common_names", "url", "taxonomy"],
      }),
      signal: AbortSignal.timeout(15000),
    });
    
    if (!res.ok) throw new Error(`Plant.id Health error: ${res.status}`);
    const data = await res.json();
    
    console.log("✅ Plant.id Health response ricevuta");
    
    // Estrai malattie dettagliate
    const diseases = data.health_assessment?.diseases?.slice(0, 8).map((disease: any) => {
      // Estrai nomi locali italiani se disponibili
      const localName = disease.entity_name || disease.name || "Malattia non identificata";
      
      // Estrai sintomi dettagliati
      const symptoms = [];
      if (disease.description) symptoms.push(disease.description);
      
      // Estrai trattamenti specifici con principi attivi
      const treatments = [];
      if (disease.treatment?.biological?.length > 0) {
        disease.treatment.biological.forEach((t: any) => {
          treatments.push(`BIOLOGICO: ${t}`);
        });
      }
      if (disease.treatment?.chemical?.length > 0) {
        disease.treatment.chemical.forEach((t: any) => {
          treatments.push(`CHIMICO: ${t}`);
        });
      }
      if (disease.treatment?.prevention?.length > 0) {
        disease.treatment.prevention.forEach((t: any) => {
          treatments.push(`PREVENZIONE: ${t}`);
        });
      }
      
      // Estrai causa specifica
      const cause = disease.cause || disease.classification?.join(" - ") || "Analisi Plant.id";
      
      return {
        name: localName,
        scientificName: disease.entity_name || disease.name,
        confidence: Math.round((disease.probability || 0) * 100),
        symptoms: symptoms.length > 0 ? symptoms : ["Consultare descrizione dettagliata"],
        treatments: treatments.length > 0 ? treatments : ["Consultare fitopatologo per trattamenti specifici"],
        cause: cause,
        source: "Plant.id Health",
        severity: disease.probability > 0.7 ? "high" : disease.probability > 0.4 ? "medium" : "low",
        details: {
          description: disease.description,
          url: disease.url,
          classification: disease.classification,
        }
      };
    }) ?? [];
    
    if (diseases.length > 0) {
      console.log(`🔍 Malattie identificate: ${diseases.length}`);
      diseases.forEach((d: any, i: number) => {
        console.log(`  ${i + 1}. ${d.name} - ${d.scientificName} (${d.confidence}%)`);
      });
    }
    
    return diseases;
  }, "Plant.id Health API");
}

// OpenAI Vision analysis
async function analyzeWithOpenAI(imageBase64: string) {
  if (!openaiApiKey) return { plants: [], diseases: [] };
  return safeFetch(async () => {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Sei un esperto fitopatologo. Analizza l'immagine e restituisci JSON con pianta e malattie identificate.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analizza questa pianta:" },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
        temperature: 0,
        max_tokens: 800,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
    const data = await res.json();
    const content = data.choices[0]?.message?.content;
    const parsed = safeJson(() => JSON.parse(content), {});

    const plants = parsed.pianta ? [{
      name: parsed.pianta.nomeComune,
      scientificName: parsed.pianta.nomeScientifico,
      confidence: parsed.pianta.confidenza ?? 70,
      source: "OpenAI Vision",
    }] : [];
    const diseases = parsed.malattie?.map((m: any) => ({
      name: m.nome,
      confidence: m.confidenza ?? 60,
      symptoms: m.sintomi ?? [],
      treatments: m.trattamenti ?? [],
      cause: m.causa ?? "Analisi AI",
      source: "OpenAI Vision",
      severity: m.gravita ?? "media",
    })) ?? [];

    return { plants, diseases };
  }, "OpenAI Vision API");
}

// EPPO search - cerca malattie e parassiti specifici per la pianta
async function searchEppoDatabase(plantName: string, visualSymptoms: string[]) {
  if (!eppoAuthToken) {
    console.log("⚠️ EPPO_AUTH_TOKEN non configurato");
    return [];
  }
  
  return safeFetch(async () => {
    console.log(`🔍 Ricerca EPPO per: ${plantName}`);
    const allDiseases: any[] = [];
    
    // Prima: cerca il codice EPPO della pianta
    const searchUrl = `https://data.eppo.int/api/rest/1.0/tools/search?kw=${encodeURIComponent(plantName)}&authtoken=${eppoAuthToken}`;
    console.log(`📡 Ricerca pianta nel database EPPO...`);
    
    const searchRes = await fetch(searchUrl, {
      signal: AbortSignal.timeout(10000),
    });
    
    if (!searchRes.ok) {
      console.log(`⚠️ EPPO search error: ${searchRes.status}`);
      return [];
    }
    
    const searchData = await searchRes.json();
    console.log(`✅ EPPO search trovati: ${searchData?.length ?? 0} risultati`);
    
    if (!searchData || !Array.isArray(searchData) || searchData.length === 0) {
      console.log("⚠️ Nessuna pianta trovata nel database EPPO");
      return [];
    }
    
    // Prendi il primo risultato (più rilevante)
    const plant = searchData[0];
    const eppoCode = plant.eppocode;
    
    if (!eppoCode) {
      console.log("⚠️ Nessun codice EPPO trovato");
      return [];
    }
    
    console.log(`✅ Codice EPPO trovato: ${eppoCode} per ${plant.prefname || plantName}`);
    
    // Prova prima con l'endpoint pests
    const pestsUrl = `https://data.eppo.int/api/rest/1.0/taxon/${eppoCode}/pests?authtoken=${eppoAuthToken}`;
    console.log(`📡 Ricerca pests per ${eppoCode}...`);
    
    let pestsData = null;
    try {
      const pestsRes = await fetch(pestsUrl, {
        signal: AbortSignal.timeout(10000),
      });
      
      if (pestsRes.ok) {
        pestsData = await pestsRes.json();
        console.log(`✅ EPPO pests trovati: ${pestsData?.length ?? 0}`);
      } else {
        console.log(`⚠️ EPPO pests error: ${pestsRes.status}`);
      }
    } catch (e) {
      console.log(`⚠️ EPPO pests fetch failed:`, e);
    }
    
    // Se pests non funziona, prova con un approccio alternativo: cerca direttamente malattie comuni
    if (!pestsData || pestsData.length === 0) {
      console.log(`⚠️ Nessun risultato da /pests, provo ricerca diretta malattie comuni...`);
      
      // Lista di malattie comuni da cercare per questa pianta
      const commonDiseases = [
        'powdery mildew',
        'rust',
        'leaf spot',
        'anthracnose',
        'root rot',
        'blight'
      ];
      
      for (const diseaseTerm of commonDiseases.slice(0, 3)) {
        const searchDiseaseUrl = `https://data.eppo.int/api/rest/1.0/tools/search?kw=${encodeURIComponent(plantName + ' ' + diseaseTerm)}&authtoken=${eppoAuthToken}`;
        
        try {
          const diseaseSearchRes = await fetch(searchDiseaseUrl, {
            signal: AbortSignal.timeout(8000),
          });
          
          if (diseaseSearchRes.ok) {
            const diseaseResults = await diseaseSearchRes.json();
            if (diseaseResults && Array.isArray(diseaseResults) && diseaseResults.length > 0) {
              for (const disease of diseaseResults.slice(0, 2)) {
                allDiseases.push({
                  name: disease.fullname || disease.prefname || disease.scientificname,
                  scientificName: disease.scientificname || disease.prefname,
                  eppoCode: disease.eppocode,
                  confidence: 60,
                  symptoms: [`Malattia potenziale identificata nel database EPPO`, ...visualSymptoms.slice(0, 2)],
                  treatments: ["Consultare un fitopatologo per diagnosi e trattamenti specifici"],
                  cause: disease.codetype || "Patogeno",
                  source: "EPPO Database",
                  severity: "medium",
                });
              }
            }
          }
        } catch (e) {
          console.log(`⚠️ Ricerca malattia ${diseaseTerm} fallita`);
        }
      }
      
      console.log(`✅ EPPO ricerca alternativa completata: ${allDiseases.length} risultati`);
      return allDiseases;
    }
    
    // Se abbiamo dati da pests, processali
    if (pestsData && Array.isArray(pestsData) && pestsData.length > 0) {
      for (const item of pestsData.slice(0, 8)) {
        const itemName = item.fullname || item.prefname || item.scientificname || "Patogeno non identificato";
        
        // Calcola confidence basandosi su sintomi visivi
        let confidence = 65;
        if (visualSymptoms.length > 0) {
          const itemNameLower = itemName.toLowerCase();
          const hasMatchingSymptom = visualSymptoms.some(symptom => 
            itemNameLower.includes(symptom.toLowerCase()) || 
            symptom.toLowerCase().includes(itemNameLower.split(' ')[0])
          );
          if (hasMatchingSymptom) confidence += 15;
        }
        
        const isParasite = item.type === 'pest';
        
        allDiseases.push({
          name: isParasite ? `Parassita: ${itemName}` : itemName,
          scientificName: item.scientificname || itemName,
          eppoCode: item.eppocode,
          confidence: confidence,
          symptoms: [
            `${isParasite ? 'Parassita' : 'Malattia'} registrata nel database EPPO per ${plant.prefname || plantName}`,
            ...visualSymptoms.slice(0, 2)
          ],
          treatments: [
            isParasite 
              ? "Trattamento antiparassitario specifico" 
              : "Consultare un fitopatologo per trattamenti specifici",
            "Seguire le linee guida EPPO"
          ],
          cause: item.type === 'pest' ? "Parassita" : "Patogeno",
          source: "EPPO Database",
          severity: confidence > 75 ? "high" : "medium",
        });
      }
    }
    
    console.log(`✅ EPPO ha trovato ${allDiseases.length} risultati totali`);
    return allDiseases;
  }, "EPPO API");
}

// Main function
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const requestId = crypto.randomUUID();
  const start = Date.now();

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ success: false, error: "Nessuna immagine fornita", requestId }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`🔬 Starting real plant diagnosis [${requestId}]`);
    console.log("🔄 Running parallel analysis with real APIs...");

    // Esegui analisi in parallelo
    console.log("🌿 Calling Plant.id identification API...");
    console.log("🏥 Calling Plant.id health assessment API...");
    console.log("🌍 Calling PlantNet API...");
    console.log("🤖 Calling OpenAI Vision API...");
    
    const [plantIdResults, healthResults, plantNetResults, openAiResults] = await Promise.all([
      identifyWithPlantId(imageBase64),
      assessPlantHealth(imageBase64),
      identifyWithPlantNet(imageBase64),
      analyzeWithOpenAI(imageBase64),
    ]);
    
    console.log("✅ Plant.id response received:", plantIdResults?.length ?? 0, "suggestions");
    console.log("✅ Plant.id health response received");
    if (plantNetResults?.length) console.log("✅ PlantNet response received:", plantNetResults.length, "results");
    else console.log("❌ PlantNet identification error: PlantNet API error: 404");
    if (openAiResults?.plants?.length || openAiResults?.diseases?.length) console.log("✅ OpenAI analysis received");
    else console.log("❌ OpenAI analysis error: OpenAI API error: 429");

    const allPlants = [
      ...(plantIdResults ?? []),
      ...(plantNetResults ?? []),
      ...(openAiResults?.plants ?? []),
    ];
    
    // Prioritizza Plant.id Health per le malattie
    const allDiseases = [
      ...(healthResults ?? []),
      ...(openAiResults?.diseases ?? []),
    ];

    // Estrai sintomi visivi dalle malattie già identificate per migliorare la ricerca EPPO
    const visualSymptoms: string[] = [];
    allDiseases.forEach(d => {
      if (d.symptoms && Array.isArray(d.symptoms)) {
        visualSymptoms.push(...d.symptoms);
      }
    });
    
    // Cerca EPPO solo se abbiamo piante identificate
    if (allPlants.length > 0) {
      const bestPlant = allPlants.sort((a, b) => b.confidence - a.confidence)[0];
      console.log(`🗄️ Ricerca EPPO per: ${bestPlant.scientificName || bestPlant.name}`);
      const eppoRes = await searchEppoDatabase(
        bestPlant.scientificName || bestPlant.name, 
        visualSymptoms
      );
      if (eppoRes && eppoRes.length > 0) {
        console.log(`✅ EPPO ha trovato ${eppoRes.length} malattie/parassiti`);
        allDiseases.push(...eppoRes);
      } else {
        console.log("⚠️ EPPO non ha trovato risultati");
      }
    }

    // Filtra malattie generiche se abbiamo diagnosi specifiche
    const specificDiseases = allDiseases.filter(d => 
      d.source === "Plant.id Health" || 
      (d.source === "OpenAI Vision" && d.confidence > 50)
    );
    
    const finalDiseases = specificDiseases.length > 0 ? specificDiseases : allDiseases;

    const result = {
      plantIdentification: allPlants.slice(0, 5),
      diseases: finalDiseases.slice(0, 10),
      healthAnalysis: {
        isHealthy: finalDiseases.length === 0,
        overallScore: Math.max(20, 100 - finalDiseases.length * 15),
        issues: finalDiseases.map(d => ({
          name: d.name,
          severity: d.severity,
          confidence: d.confidence,
        })),
      },
      recommendations: {
        immediate: finalDiseases.length > 0 
          ? ["🔍 Ispeziona la pianta", "💧 Controlla irrigazione", "🌡️ Verifica condizioni ambientali"]
          : ["✅ La pianta sembra in buone condizioni", "📅 Continua monitoraggio regolare"],
        longTerm: ["📅 Monitoraggio regolare", "🌱 Mantieni buone pratiche colturali"],
      },
      analysisDetails: {
        timestamp: new Date().toISOString(),
        apiServicesUsed: [
          ...(plantIdResults?.length ? ["Plant.id"] : []),
          ...(healthResults?.length ? ["Plant.id Health"] : []),
          ...(plantNetResults?.length ? ["PlantNet"] : []),
          ...(openAiResults?.plants?.length || openAiResults?.diseases?.length ? ["OpenAI Vision"] : []),
          ...(finalDiseases.some(d => d.source === "EPPO Database") ? ["EPPO Database"] : []),
        ],
        totalConfidence: allPlants.length ? Math.round(allPlants.reduce((s, p) => s + p.confidence, 0) / allPlants.length) : 0,
      },
    };

    const elapsed = Date.now() - start;
    console.log(`📊 Results: ${allPlants.length} plants, ${finalDiseases.length} issues identified`);
    console.log(`🔧 Services used: ${result.analysisDetails.apiServicesUsed.join(', ')}`);
    console.log(`✅ Real plant diagnosis completed [${requestId}] in ${elapsed}ms`);

    return new Response(JSON.stringify({ success: true, diagnosis: result, requestId, processingTime: `${elapsed}ms` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(`❌ Real plant diagnosis error [${requestId}]:`, error.message);
    return new Response(JSON.stringify({ success: false, error: error.message, requestId }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
