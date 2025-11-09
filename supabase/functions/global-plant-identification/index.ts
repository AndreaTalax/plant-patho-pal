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
// Simplified implementations for the services

async function identifyWithPlantNet(imageBase64: string) {
  console.log("PlantNet service called");
  return null;
}

async function analyzeWithLovableAI(imageBase64: string) {
  console.log("Lovable AI (Gemini) service called");
  return null;
}

async function diagnoseWithResNet(imageBase64: string) {
  console.log("ResNet-50 via Hugging Face called");
  return [];
}

async function searchEppoDatabase(plantName: string, scientificName: string) {
  console.log("EPPO service called");
  return null;
}

async function identifyWithINaturalist(plantName: string) {
  console.log("iNaturalist service called");
  return [];
}

async function analyzeWithGBIF(scientificName: string) {
  console.log("GBIF service called");
  return null;
}

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

    // 1. PlantNet
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

    // 2. Lovable AI (Gemini) for visual analysis
    log("Lovable AI (Gemini) Vision...");
    const aiResult = await analyzeWithLovableAI(imageBase64);
    if (aiResult?.plantInfo) {
      result.plantIdentification.push({
        name: aiResult.plantInfo.nomeComune ?? "Pianta identificata",
        scientificName: aiResult.plantInfo.nomeScientifico ?? "",
        confidence: safeConfidence(aiResult.plantInfo.confidenza),
        source: "Lovable AI (Gemini)",
        family: aiResult.plantInfo.famiglia,
      });
    }
    aiResult?.malattie?.forEach((m: any) =>
      result.diseases.push({
        name: m.nome,
        confidence: safeConfidence(m.confidenza),
        symptoms: m.sintomi ?? [],
        treatments: m.trattamenti ?? [],
        cause: m.causa ?? "Causa da determinare",
        source: "Lovable AI (Gemini)",
      })
    );

    // 3. ResNet-50 Hugging Face for disease detection
    log("ResNet-50 Hugging Face...");
    const resNetResult = await diagnoseWithResNet(imageBase64);
    resNetResult?.forEach((disease: any) =>
      result.diseases.push({
        name: disease.name,
        confidence: safeConfidence(disease.confidence),
        symptoms: disease.symptoms ?? [],
        treatments: disease.treatments ?? [],
        cause: disease.cause ?? "Analisi AI",
        source: "ResNet-50 HF",
      })
    );

    // 4. iNaturalist
    log("iNaturalist...");
    const iNatResult = await identifyWithINaturalist(plantNetResult?.name ?? "plant");
    iNatResult?.forEach((plant: any) =>
      result.plantIdentification.push({
        name: plant.plantName,
        scientificName: plant.scientificName,
        confidence: safeConfidence(plant.confidence - 5),
        source: "iNaturalist",
        family: plant.family,
      })
    );

    // 5. EPPO
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

    // 6. GBIF
    log("GBIF...");
    const gbifResult = await analyzeWithGBIF(bestPlant?.scientificName ?? "");
    if (gbifResult) {
      // Add GBIF info to result if needed
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
