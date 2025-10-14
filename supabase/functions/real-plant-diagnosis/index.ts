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

// ---------- Helpers ----------
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

// ---------- Identification (unchanged logic, mantenuto come prima) ----------

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
    // Assicurati che l'immagine sia base64 pura senza prefisso data:image
    let cleanBase64 = imageBase64;
    if (imageBase64.includes("base64,")) {
      cleanBase64 = imageBase64.split("base64,")[1];
    }
    
    console.log("🏥 Chiamata Plant.id Health Assessment API...");
    console.log(`📏 Dimensione immagine base64: ${cleanBase64.length} caratteri`);

    const res = await fetch("https://api.plant.id/v3/health_assessment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": plantIdApiKey,
      },
      body: JSON.stringify({
        images: [cleanBase64],
        similar_images: true,
        health: "all",
        language: "it"
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ Plant.id Health API error ${res.status}: ${errorText}`);
      throw new Error(`Plant.id Health error: ${res.status}`);
    }
    const data = await res.json();

    console.log("✅ Plant.id Health response ricevuta");
    
    if (!data.result?.is_healthy_probability) {
      console.log("⚠️ Risposta Plant.id Health senza dati di salute");
      console.log("🔍 Raw response:", JSON.stringify(data, null, 2));
    }

    // Verifica lo stato di salute
    const isHealthy = data.result?.is_healthy?.binary ?? true;
    const healthProbability = data.result?.is_healthy?.probability ?? 1.0;
    
    console.log(`🏥 Stato salute: ${isHealthy ? 'Sana' : 'Malata'} (confidenza: ${Math.round(healthProbability * 100)}%)`);

    // Estrai malattie se presenti
    const diseases = [];
    
    if (data.result?.disease?.suggestions && Array.isArray(data.result.disease.suggestions)) {
      console.log(`🔍 Trovate ${data.result.disease.suggestions.length} possibili malattie`);
      
      for (const disease of data.result.disease.suggestions.slice(0, 15)) {
        if (disease.probability < 0.01) continue; // Soglia minima 1%
        
        const diseaseName = disease.name || "Malattia non identificata";
        const symptoms = [];
        
        if (disease.details?.description) symptoms.push(disease.details.description);
        
        const treatments = [];
        if (disease.details?.treatment?.biological) {
          treatments.push(...disease.details.treatment.biological.map((t: string) => `BIOLOGICO: ${t}`));
        }
        if (disease.details?.treatment?.chemical) {
          treatments.push(...disease.details.treatment.chemical.map((t: string) => `CHIMICO: ${t}`));
        }
        if (disease.details?.treatment?.prevention) {
          treatments.push(...disease.details.treatment.prevention.map((t: string) => `PREVENZIONE: ${t}`));
        }

        diseases.push({
          name: diseaseName,
          scientificName: disease.entity_name || disease.name,
          confidence: Math.min(1, Math.max(0, disease.probability)),
          symptoms: symptoms.length > 0 ? symptoms : ["Consultare descrizione dettagliata"],
          treatments: treatments.length > 0 ? treatments : ["Consultare fitopatologo per trattamenti specifici"],
          cause: disease.details?.cause || "Analisi Plant.id",
          source: "Plant.id Health",
          severity: disease.probability > 0.7 ? "high" : disease.probability > 0.4 ? "medium" : "low",
          details: {
            description: disease.details?.description,
            url: disease.details?.url,
          }
        });
      }
      
      console.log(`✅ ${diseases.length} malattie aggiunte da Plant.id Health`);
    } else {
      console.log("⚠️ Nessuna malattia rilevata da Plant.id Health");
    }

    return diseases;
  }, "Plant.id Health API");
}

// Lovable AI (Gemini) analysis - sostituisce OpenAI
async function analyzeWithAI(imageBase64: string) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    console.log("⚠️ LOVABLE_API_KEY non configurato");
    return { plants: [], diseases: [] };
  }
  
  return safeFetch(async () => {
    console.log("🤖 Chiamata Lovable AI (Gemini 2.5 Flash)...");
    
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Sei un esperto fitopatologo. Analizza con ESTREMA attenzione le immagini di piante.

IMPORTANTE: Cerca QUALSIASI segno di problema, anche minimo:
- Macchie, punti, decolorazioni (anche piccole)
- Bordi foglie secchi, arricciati, danneggiati
- Stress idrico, foglie cadenti
- Colorazione anomala (giallo, marrone, rossastro, pallido)
- Presenza di insetti, uova, larve
- Texture anomala, buchi, striature
- Crescita irregolare, foglie deformi
- Muffa, patina biancastra, residui

Rispondi SEMPRE in formato JSON:
{
  "pianta": {
    "nomeComune": "string",
    "nomeScientifico": "string",
    "confidenza": number 0-100
  },
  "malattie": [
    {
      "nome": "nome specifico malattia/problema",
      "confidenza": number 0-100,
      "sintomi": ["descrizione dettagliata sintomi visibili"],
      "trattamenti": ["trattamento specifico"],
      "causa": "causa identificata",
      "gravita": "low|medium|high"
    }
  ]
}

Se davvero non vedi NESSUN problema (raro), usa malattie: []`
          },
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: "Analizza questa immagine di pianta. Sii MOLTO critico: cerca QUALSIASI segno di malattia, stress, parassiti o danno. Anche problemi minimi vanno segnalati." 
              },
              { 
                type: "image_url", 
                image_url: { url: `data:image/jpeg;base64,${cleanBase64}` } 
              },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
      signal: AbortSignal.timeout(30000),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ Lovable AI error ${res.status}:`, errorText);
      throw new Error(`Lovable AI error: ${res.status}`);
    }
    
    const data = await res.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      console.log("⚠️ Lovable AI: nessun contenuto nella risposta");
      return { plants: [], diseases: [] };
    }
    
    console.log("🤖 Lovable AI raw response:", content.substring(0, 500));
    
    const parsed = safeJson(() => JSON.parse(content), {});

    const plants = parsed.pianta ? [{
      name: parsed.pianta.nomeComune,
      scientificName: parsed.pianta.nomeScientifico,
      confidence: Math.min(100, Math.max(0, parsed.pianta.confidenza ?? 70)),
      source: "Lovable AI (Gemini)",
    }] : [];
    
    const diseases = (parsed.malattie || []).map((m: any) => ({
      name: m.nome,
      confidence: Math.min(1, Math.max(0, (m.confidenza ?? 60) / 100)),
      symptoms: m.sintomi ?? [],
      treatments: m.trattamenti ?? [],
      cause: m.causa ?? "Analisi AI",
      source: "Lovable AI (Gemini)",
      severity: m.gravita ?? "medium",
    }));

    console.log(`✅ Lovable AI: ${plants.length} piante, ${diseases.length} malattie identificate`);
    
    if (diseases.length > 0) {
      diseases.forEach((d: any, i: number) => {
        console.log(`  ${i + 1}. ${d.name} (${Math.round(d.confidence * 100)}%)`);
      });
    }
    
    return { plants, diseases };
  }, "Lovable AI");
}

// ---------- EPPO search (potenziata) ----------
async function searchEppoDatabase(plantName: string, visualSymptoms: string[]) {
  if (!eppoAuthToken) {
    console.log("⚠️ EPPO_AUTH_TOKEN non configurato");
    return [];
  }

  return safeFetch(async () => {
    console.log(`🔍 Ricerca malattie EPPO - Pianta: "${plantName}", Sintomi: ${visualSymptoms.length}`);

    const allDiseases: any[] = [];
    const seenEppoCodes = new Set<string>();

    // Funzione helper per chiamata EPPO search
    async function queryEppo(kw: string, typeorg: string) {
      const params = new URLSearchParams({
        kw,
        searchfor: "1",
        searchmode: "3",
        typeorg,
        authtoken: eppoAuthToken!,
      });
      const url = `https://data.eppo.int/api/rest/1.0/tools/search?${params.toString()}`;
      try {
        const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) });
        if (!res.ok) {
          console.log(`⚠️ EPPO returned ${res.status} for kw=${kw} type=${typeorg}`);
          return null;
        }
        return await res.json();
      } catch (err) {
        console.log(`⚠️ EPPO query error for kw=${kw}:`, err);
        return null;
      }
    }

    // 1) Cerca malattie specifiche per nome della pianta (diseases - typeorg=3)
    const plantQuery = (plantName || "").trim();
    if (plantQuery && plantQuery !== "Pianta non identificata") {
      console.log(`📡 EPPO: Ricerca malattie per pianta: ${plantQuery}`);
      const diseasesData = await queryEppo(plantQuery, "3");
      if (Array.isArray(diseasesData) && diseasesData.length > 0) {
        console.log(`✅ EPPO: Trovate ${diseasesData.length} malattie per ${plantQuery}`);
        
        for (const disease of diseasesData.slice(0, 5)) {
          const eppoCode = disease.eppocode;
          if (!eppoCode || seenEppoCodes.has(eppoCode)) continue;
          seenEppoCodes.add(eppoCode);

          const diseaseName = disease.fullname || disease.prefname || disease.scientificname || "Malattia non identificata";
          
          let confidence = 0.75;
          
          const diseaseNameLower = diseaseName.toLowerCase();
          const hasMatchingSymptoms = visualSymptoms.some(symptom => {
            const s = symptom.toLowerCase();
            return diseaseNameLower.includes(s) || s.includes(diseaseNameLower.split(' ')[0]);
          });
          if (hasMatchingSymptoms) confidence = Math.min(0.90, confidence + 0.15);

          allDiseases.push({
            name: diseaseName,
            scientificName: disease.scientificname || diseaseName,
            eppoCode,
            confidence: Math.min(1, Math.max(0, confidence)), // Normalizza 0-1
            symptoms: visualSymptoms.length > 0 ? visualSymptoms.slice(0, 3) : [`Malattia registrata EPPO per ${plantQuery}`],
            treatments: ["Consultare un fitopatologo per trattamenti mirati", "Seguire le linee guida EPPO specifiche"],
            cause: disease.codetype || "Patogeno",
            source: "EPPO Database",
            severity: confidence > 0.85 ? "high" : confidence > 0.70 ? "medium" : "low",
          });
        }
      }

      // 2) Cerca anche parassiti specifici della pianta (typeorg=2)
      console.log(`📡 EPPO: Ricerca parassiti per pianta: ${plantQuery}`);
      const pestsData = await queryEppo(plantQuery, "2");
      if (Array.isArray(pestsData) && pestsData.length > 0) {
        console.log(`✅ EPPO: Trovati ${pestsData.length} parassiti per ${plantQuery}`);
        
        for (const pest of pestsData.slice(0, 3)) {
          const eppoCode = pest.eppocode;
          if (!eppoCode || seenEppoCodes.has(eppoCode)) continue;
          seenEppoCodes.add(eppoCode);

          const pestName = pest.fullname || pest.prefname || pest.scientificname || "Parassita non identificato";
          allDiseases.push({
            name: pestName,
            scientificName: pest.scientificname || pestName,
            eppoCode,
            confidence: 0.70, // Già normalizzato 0-1
            symptoms: visualSymptoms.length > 0 ? visualSymptoms.slice(0, 2) : [`Parassita segnalato su ${plantQuery}`],
            treatments: ["Trattamento antiparassitario specifico", "Consultare un fitopatologo per la gestione integrata"],
            cause: "Parassita",
            source: "EPPO Database",
            severity: "medium",
          });
        }
      }
    }

    // 3) NUOVO: Cerca anche per sintomi comuni se abbiamo sintomi ma poche malattie trovate
    if (visualSymptoms.length > 0 && allDiseases.length < 3) {
      console.log(`📡 EPPO: Ricerca per sintomi comuni (fallback)...`);
      
      // Keywords comuni per sintomi visibili
      const symptomKeywords = [
        "leaf spot", "macchia fogliare", "fungal",
        "rust", "ruggine", "mildew", "oidio",
        "blight", "peronospora", "wilt", "appassimento",
        "rot", "marciume", "canker", "cancro"
      ];
      
      for (const keyword of symptomKeywords.slice(0, 3)) {
        const symptomResults = await queryEppo(keyword, "3");
        if (Array.isArray(symptomResults) && symptomResults.length > 0) {
          console.log(`✅ EPPO: Trovate ${symptomResults.length} malattie comuni per "${keyword}"`);
          
          for (const disease of symptomResults.slice(0, 2)) {
            const eppoCode = disease.eppocode;
            if (!eppoCode || seenEppoCodes.has(eppoCode)) continue;
            seenEppoCodes.add(eppoCode);

            allDiseases.push({
              name: disease.fullname || disease.prefname || "Malattia comune",
              scientificName: disease.scientificname || "",
              eppoCode,
              confidence: 0.50, // Già normalizzato 0-1
              symptoms: visualSymptoms.slice(0, 2),
              treatments: ["Identificazione richiesta da specialista"],
              cause: "Sintomi comuni",
              source: "EPPO Database (sintomo generico)",
              severity: "low",
            });
          }
        }
        
        // Evita troppe chiamate
        if (allDiseases.length >= 5) break;
      }
    }

    console.log(`✅ EPPO ricerca completata: ${allDiseases.length} risultati totali`);
    return allDiseases;
  }, "EPPO API");
}

// ---------- Main function ----------
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
    console.log("🤖 Calling Lovable AI (Gemini)...");

    const [plantIdResults, healthResults, plantNetResults, aiResults] = await Promise.all([
      identifyWithPlantId(imageBase64),
      assessPlantHealth(imageBase64),
      identifyWithPlantNet(imageBase64),
      analyzeWithAI(imageBase64),
    ]);

    console.log("✅ Plant.id response received:", plantIdResults?.length ?? 0, "suggestions");
    console.log("✅ Plant.id health response received");
    if (plantNetResults?.length) console.log("✅ PlantNet response received:", plantNetResults.length, "results");
    else console.log("❌ PlantNet identification error or no results");
    if (aiResults?.plants?.length || aiResults?.diseases?.length) console.log("✅ AI analysis received");
    else console.log("❌ AI analysis error or no results");

    const allPlants = [
      ...(plantIdResults ?? []),
      ...(plantNetResults ?? []),
      ...(aiResults?.plants ?? []),
    ];

    // Prioritizza Plant.id Health per le malattie
    const allDiseases = [
      ...(healthResults ?? []),
      ...(aiResults?.diseases ?? []),
    ];

    // Estrai sintomi visivi dalle malattie già identificate per migliorare la ricerca EPPO
    const visualSymptoms: string[] = [];
    allDiseases.forEach(d => {
      if (d.symptoms && Array.isArray(d.symptoms)) {
        visualSymptoms.push(...d.symptoms);
      } else if (typeof d.description === "string") {
        visualSymptoms.push(d.description);
      }
    });

    // SEMPRE cercare EPPO, anche se non ci sono piante identificate
    let eppoRes: any[] = [];
    if (allPlants.length > 0) {
      const bestPlant = allPlants.sort((a, b) => b.confidence - a.confidence)[0];
      console.log(`🗄️ Ricerca EPPO per pianta identificata: ${bestPlant.scientificName || bestPlant.name}`);
      eppoRes = await searchEppoDatabase(
        bestPlant.scientificName || bestPlant.name,
        visualSymptoms
      ) ?? [];
    } else {
      // Anche senza piante identificate, cerca EPPO per sintomi generici
      console.log(`🗄️ Ricerca EPPO per sintomi generici (nessuna pianta identificata)`);
      eppoRes = await searchEppoDatabase(
        "plant disease", // Query generica
        visualSymptoms.length > 0 ? visualSymptoms : ["leaf damage", "plant stress"]
      ) ?? [];
    }
    
    if (eppoRes && eppoRes.length > 0) {
      console.log(`✅ EPPO ha trovato ${eppoRes.length} malattie/parassiti`);
      allDiseases.push(...eppoRes);
    } else {
      console.log("⚠️ EPPO non ha trovato risultati");
    }

    // Filtra malattie generiche se abbiamo diagnosi specifiche
    const specificDiseases = allDiseases.filter(d =>
      d.source === "Plant.id Health" ||
      (d.source === "Lovable AI (Gemini)" && d.confidence > 0.5) ||
      d.source === "EPPO Database" ||
      d.source === "Local mapping"
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
          ...(aiResults?.plants?.length || aiResults?.diseases?.length ? ["Lovable AI (Gemini)"] : []),
          ...(finalDiseases.some(d => d.source === "EPPO Database") ? ["EPPO Database"] : []),
          ...(finalDiseases.some(d => d.source === "Local mapping") ? ["Local mapping"] : []),
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
    console.error(`❌ Real plant diagnosis error [${requestId}]:`, error?.message ?? error);
    return new Response(JSON.stringify({ success: false, error: error?.message ?? String(error), requestId }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
