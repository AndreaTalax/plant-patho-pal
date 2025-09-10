import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// ================== CONFIG ==================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_CONFIDENCE = 70;

// ================== TYPES ==================
interface PlantInfo {
  name: string;
  scientificName: string;
  confidence: number;
  source: string;
  family?: string;
  genus?: string;
}

interface DiseaseInfo {
  name: string;
  confidence: number;
  symptoms: string[];
  treatments: string[];
  cause: string;
  source: string;
}

interface GlobalIdentificationResult {
  plantIdentification: PlantInfo[];
  diseases: DiseaseInfo[];
  eppoInfo?: {
    plants: any[];
    pests: any[];
    diseases: any[];
  };
  success: boolean;
}

// ================== HELPERS ==================
function log(step: string) {
  console.log(`➡️ ${step}`);
}

function safeConfidence(value: number | undefined, max = MAX_CONFIDENCE) {
  return Math.min(value ?? 0, max);
}

function base64ToBlob(base64: string, type = "image/jpeg"): Blob {
  const clean = base64.includes(",") ? base64.split(",")[1] : base64;
  const bytes = Uint8Array.from(atob(clean), c => c.charCodeAt(0));
  return new Blob([bytes], { type });
}

function deduplicate<T>(items: T[], keyFn: (x: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ================== API WRAPPERS ==================
import {
  identifyWithPlantId,
  identifyWithPlantNet,
  analyzeWithOpenAI,
  diagnoseWithPlantIdHealth,
  searchEppoDatabase,
  analyzeWithHuggingFace,
  identifyWithINaturalist,
} from "./services.ts";

// ================== MAIN SERVER ==================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) throw new Error("Immagine non fornita");

    log("Avvio identificazione globale...");

    const result: GlobalIdentificationResult = {
      plantIdentification: [],
      diseases: [],
      success: false,
    };

    // 1. Plant.ID
    log("Plant.ID...");
    const plantIdResult = await identifyWithPlantId(imageBase64);
    if (plantIdResult) {
      result.plantIdentification.push({
        name: plantIdResult.plantName,
        scientificName: plantIdResult.scientificName,
        confidence: safeConfidence(plantIdResult.confidence),
        source: "Plant.ID",
        family: plantIdResult.family,
        genus: plantIdResult.genus,
      });
    }

    // 2. PlantNet
    log("PlantNet...");
    const plantNetResult = await identifyWithPlantNet(imageBase64);
    if (plantNetResult) {
      result.plantIdentification.push({
        name: plantNetResult.species ?? "Specie sconosciuta",
        scientificName: plantNetResult.scientificName ?? "",
        confidence: safeConfidence(Math.round(plantNetResult.confidence * 100)),
        source: "PlantNet",
        family: plantNetResult.family,
        genus: plantNetResult.genus,
      });
    }

    // 3. OpenAI
    log("OpenAI Vision...");
    const openAiResult = await analyzeWithOpenAI(imageBase64);
    if (openAiResult?.plantInfo) {
      result.plantIdentification.push({
        name: openAiResult.plantInfo.nomeComune ?? "Pianta identificata",
        scientificName: openAiResult.plantInfo.nomeScientifico ?? "",
        confidence: safeConfidence(openAiResult.plantInfo.confidenza),
        source: "OpenAI Vision",
        family: openAiResult.plantInfo.famiglia,
      });
    }
    openAiResult?.malattie?.forEach((m: any) =>
      result.diseases.push({
        name: m.nome,
        confidence: safeConfidence(m.confidenza),
        symptoms: m.sintomi ?? [],
        treatments: m.trattamenti ?? [],
        cause: m.causa ?? "Causa da determinare",
        source: "OpenAI Vision",
      })
    );

    // 4. iNaturalist
    log("iNaturalist...");
    const iNatResult = await identifyWithINaturalist(plantIdResult?.plantName ?? "plant");
    iNatResult?.forEach((plant: any) =>
      result.plantIdentification.push({
        name: plant.plantName,
        scientificName: plant.scientificName,
        confidence: safeConfidence(plant.confidence - 5),
        source: "iNaturalist",
        family: plant.family,
      })
    );

    // 5. Plant.ID Health
    log("Plant.ID Health...");
    const healthResult = await diagnoseWithPlantIdHealth(imageBase64);
    healthResult?.forEach((disease: any) =>
      result.diseases.push({
        name: disease.name,
        confidence: safeConfidence(disease.confidence),
        symptoms: disease.symptoms ?? [],
        treatments: disease.treatments ?? [],
        cause: disease.cause ?? "Analisi AI",
        source: "Plant.ID Health",
      })
    );

    // 6. EPPO
    log("EPPO...");
    const bestPlant = result.plantIdentification.sort((a, b) => b.confidence - a.confidence)[0];
    if (bestPlant) {
      const eppoResult = await searchEppoDatabase(bestPlant.name, bestPlant.scientificName);
      if (eppoResult) {
        result.eppoInfo = eppoResult;
        // aggiunta malattie/parassiti EPPO
        [...(eppoResult.diseases ?? []), ...(eppoResult.pests ?? [])].forEach((d: any) =>
          result.diseases.push({
            name: d.preferredName ?? d.name,
            confidence: 65,
            symptoms: ["Registrato nel database EPPO"],
            treatments: ["Consultare protocolli EPPO"],
            cause: "Fonte EPPO",
            source: "Database EPPO",
          })
        );
      }
    }

    // 7. Hugging Face
    log("Hugging Face...");
    const hfResult = await analyzeWithHuggingFace(imageBase64);
    if (hfResult) {
      result.diseases.push({
        name: hfResult.disease ?? "Condizione rilevata",
        confidence: safeConfidence(hfResult.confidence),
        symptoms: hfResult.symptoms ?? [],
        treatments: ["Trattamento AI"],
        cause: hfResult.cause ?? "Analisi AI",
        source: "Hugging Face AI",
      });
    }

    // Deduplica
    result.plantIdentification = deduplicate(result.plantIdentification, p => p.scientificName || p.name);
    result.diseases = deduplicate(result.diseases, d => d.name.toLowerCase());

    result.success = result.plantIdentification.length > 0 || result.diseases.length > 0;

    log(`✅ Completato: ${result.plantIdentification.length} piante, ${result.diseases.length} problemi`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Errore globale:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      plantIdentification: [],
      diseases: [],
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
