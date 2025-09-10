import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, location } = await req.json();
    
    if (!query) {
      throw new Error('Query di ricerca non fornita');
    }

    console.log('🔍 Ricerca iNaturalist per:', query);

    const result = await searchINaturalist(query, location);

    return new Response(JSON.stringify({
      success: true,
      results: result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Errore ricerca iNaturalist:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      results: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function searchINaturalist(query: string, location?: { lat: number; lng: number }): Promise<INaturalistResult[]> {
  try {
    // Costruisci URL per la ricerca
    let url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(query)}`;
    url += '&rank=species,genus,family&per_page=10&only_id=false';
    
    // Aggiungi filtro geografico se disponibile
    if (location) {
      url += `&lat=${location.lat}&lng=${location.lng}&radius=50`;
    }

    console.log('🌐 URL iNaturalist:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DrPlant-App/1.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`iNaturalist API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.log('📭 Nessun risultato trovato su iNaturalist');
      return [];
    }

    console.log(`✅ Trovati ${data.results.length} risultati su iNaturalist`);

    // Trasforma i risultati nel formato desiderato
    return data.results.map((taxon: any, index: number): INaturalistResult => {
      const commonName = taxon.preferred_common_name || 
                        taxon.english_common_name || 
                        taxon.matched_term ||
                        taxon.name;

      // Calcola confidence basato su posizione e qualità dei dati
      let confidence = 85 - (index * 3);
      
      // Aumenta confidence se ha un nome comune preferito
      if (taxon.preferred_common_name) confidence += 5;
      
      // Aumenta confidence se ha molte osservazioni
      if (taxon.observations_count > 1000) confidence += 5;
      
      // Assicurati che sia tra 1 e 95
      confidence = Math.max(1, Math.min(95, confidence));

      return {
        plantName: commonName,
        scientificName: taxon.name,
        confidence,
        family: taxon.iconic_taxon_name || taxon.ancestry?.split('/').pop(),
        imageUrl: taxon.default_photo?.medium_url,
        observations: taxon.observations_count,
        wikipediaUrl: taxon.wikipedia_url
      };
    });

  } catch (error) {
    console.error('iNaturalist search error:', error);
    throw error;
  }
}

// Funzione helper per ricerca per immagine (se supportata in futuro)
async function searchByImage(imageBase64: string): Promise<INaturalistResult[]> {
  try {
    // Per ora iNaturalist non supporta ricerca per immagine diretta
    // Ma possiamo usare questo per future implementazioni
    console.log('🖼️ Ricerca per immagine non ancora supportata da iNaturalist API');
    return [];
  } catch (error) {
    console.error('iNaturalist image search error:', error);
    return [];
  }
}