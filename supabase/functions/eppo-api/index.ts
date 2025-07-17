
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Configura gli header CORS per consentire le richieste dalla nostra app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// L'auth token dell'EPPO (salvato come segreto su Supabase)
const eppoAuthToken = Deno.env.get('EPPO_AUTH_TOKEN');
const eppoBaseUrl = 'https://data.eppo.int/api/rest/1.0';

serve(async (req) => {
  // Gestisci le richieste preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Ottieni parametri dalla richiesta
    const { searchTerm, searchType = 'general' } = await req.json();
    
    if (!searchTerm) {
      return new Response(
        JSON.stringify({ error: 'searchTerm parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Costruisci l'URL per l'API EPPO usando l'endpoint di ricerca generale
    let eppoUrl = `${eppoBaseUrl}/tools/search`;
    
    // Parametri di ricerca per l'API EPPO
    const searchParams = new URLSearchParams({
      kw: searchTerm,
      searchfor: '1', // Names or EPPO codes
      searchmode: '3', // Containing the word
      authtoken: eppoAuthToken || ''
    });
    
    // Se è specificato un tipo di ricerca, filtra per categoria
    if (searchType === 'plants') {
      searchParams.append('typeorg', '1'); // Plant (Species level)
    } else if (searchType === 'pests') {
      searchParams.append('typeorg', '2'); // Animal (Species level) 
    } else if (searchType === 'diseases') {
      searchParams.append('typeorg', '3'); // Microorganism (Species level)
    }
    
    eppoUrl += `?${searchParams.toString()}`;
    
    console.log(`Calling EPPO API: ${eppoUrl}`);
    
    // Effettua la chiamata all'API EPPO
    const response = await fetch(eppoUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`EPPO API Error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: 'Error from EPPO API', 
          status: response.status, 
          details: errorText 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Ottieni i dati dalla risposta
    const data = await response.json();
    
    return new Response(
      JSON.stringify({
        data,
        searchType,
        searchTerm
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error(`Error in EPPO API function: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

