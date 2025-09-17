import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlantNetResult {
  isPlant: boolean;
  confidence: number;
  species?: string;
  scientificName?: string;
  commonNames?: string[];
  family?: string;
  genus?: string;
  images?: string[];
  score?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🌐 Avvio identificazione PlantNet...');
    
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Immagine non fornita' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const plantNetApiKey = Deno.env.get('PLANT_NET_KEY') || Deno.env.get('PLANTNET');
    console.log('🔑 Controllo PLANT_NET_KEY:', plantNetApiKey ? 'PRESENTE' : 'ASSENTE');
    
    if (!plantNetApiKey) {
      console.log('⚠️ PLANT_NET_KEY non trovata nei segreti');
      return new Response(
        JSON.stringify({ 
          error: 'Chiave API PlantNet non configurata'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Converti base64 in blob per PlantNet
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    
    // Decodifica base64 in Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Crea un blob dall'array di byte
    const blob = new Blob([bytes], { type: 'image/jpeg' });

    // Prepara FormData per PlantNet
    const formData = new FormData();
    formData.append('images', blob, 'plant.jpg');
    formData.append('organs', 'leaf');
    formData.append('organs', 'flower');
    formData.append('organs', 'fruit');
    formData.append('organs', 'bark');
    formData.append('include-related-images', 'true');

    console.log('📡 Chiamata API PlantNet...');
    
    // Chiama l'API PlantNet - ENDPOINT CORRETTO 2025
    const response = await fetch(
      `https://my-api.plantnet.org/v2/identify/all?api-key=${plantNetApiKey}`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      console.error(`❌ Errore API PlantNet: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Dettagli errore:', errorText);
      
      // Errore reale - non fallback
      return new Response(
        JSON.stringify({ 
          error: `PlantNet non disponibile (${response.status})`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('✅ Risposta PlantNet ricevuta');

    // Processa i risultati PlantNet
    const result: PlantNetResult = processPlantNetResults(data);
    
    console.log('🌿 Risultato elaborato:', {
      isPlant: result.isPlant,
      confidence: result.confidence,
      species: result.species
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Errore in plantnet-identification:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Errore interno del server',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function processPlantNetResults(data: any): PlantNetResult {
  console.log('🔍 Elaborazione risultati PlantNet...');
  
  if (!data.results || data.results.length === 0) {
    console.log('❌ Nessun risultato trovato');
    return {
      isPlant: false,
      confidence: 0
    };
  }

  // Prendi il primo risultato (più probabile)
  const bestResult = data.results[0];
  const score = bestResult.score || 0;
  
  // Considera una pianta se lo score è superiore a 0.1 (10%)
  const isPlant = score > 0.1;
  const confidence = Math.min(score, 0.95); // Massimo 95%

  const result: PlantNetResult = {
    isPlant,
    confidence,
    score,
    species: bestResult.species?.scientificNameWithoutAuthor,
    scientificName: bestResult.species?.scientificNameWithoutAuthor,
    commonNames: bestResult.species?.commonNames || [],
    family: bestResult.species?.family?.scientificNameWithoutAuthor,
    genus: bestResult.species?.genus?.scientificNameWithoutAuthor,
    images: bestResult.images?.map((img: any) => img.url?.m || img.url?.s || img.url?.o) || []
  };

  console.log('✅ Risultato elaborato:', {
    species: result.species,
    confidence: result.confidence,
    family: result.family
  });

  return result;
}