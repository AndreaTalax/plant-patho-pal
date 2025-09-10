import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ================== CONFIG ==================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface INaturalistResult {
  plantName: string;
  scientificName: string;
  confidence: number;
  family?: string;
  imageUrl?: string;
  observations?: number;
  wikipediaUrl?: string;
}

// ================== HELPERS ==================
function safeConfidence(base: number, index: number, opts?: { commonName?: boolean; observations?: number }): number {
  let confidence = base - index * 3;

  if (opts?.commonName) confidence += 5;
  if ((opts?.observations ?? 0) > 1000) confidence += 5;

  return Math.max(1, Math.min(95, confidence));
}

// ================== MAIN SERVER ==================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, location } = await req.json();
    if (!query) throw new Error("Query di ricerca non fornita");

    console.log("🔍 Ricerca iNaturalist per:", query);

    const results = await searchINaturalist(query, location);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Errore ricerca iNaturalist:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message ?? "Errore sconosciuto",
      results: [],
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ================== INATURALIST API ==================
async function searchINaturalist(query: string, location?: { lat: number; lng: number }): Promise<INaturalistResult[]> {
  let url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(query)}&rank=species,genus,family&per_page=10&only_id=false`;

  if (location) {
    url += `&lat=${location.lat}&lng=${location.lng}&radius=50`;
  }

  console.log("🌐 URL iNaturalist:", url);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "DrPlant-App/1.0",
      "Accept": "application/json",
    },
  });

  if (!response.ok) throw new Error(`iNaturalist API error: ${response.status}`);

  const data = await response.json();
  if (!Array.isArray(data.results) || data.results.length === 0) {
    console.log("📭 Nessun risultato trovato su iNaturalist");
    return [];
  }

  console.log(`✅ Trovati ${data.results.length} risultati su iNaturalist`);

  return data.results.map((taxon: any, index: number): INaturalistResult => {
    const commonName = taxon.preferred_common_name ||
                       taxon.english_common_name ||
                       taxon.matched_term ||
                       taxon.name;

    const confidence = safeConfidence(85, index, {
      commonName: !!taxon.preferred_common_name,
      observations: taxon.observations_count,
    });

    return {
      plantName: commonName,
      scientificName: taxon.name,
      confidence,
      family: taxon.iconic_taxon_name ?? taxon.ancestry?.split("/")?.pop(),
      imageUrl: taxon.default_photo?.medium_url,
      observations: taxon.observations_count,
      wikipediaUrl: taxon.wikipedia_url,
    };
  });
}

// ================== FUTURE EXTENSION ==================
async function searchByImage(_imageBase64: string): Promise<INaturalistResult[]> {
  console.log("🖼️ Ricerca per immagine non supportata da iNaturalist (placeholder)");
  return [];
}
