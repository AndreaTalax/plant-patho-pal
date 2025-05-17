
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Configura gli header CORS per consentire le richieste dalla nostra app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// La chiave API dell'EPPO (salvata come segreto su Supabase)
const eppoApiKey = Deno.env.get('EPPO_API_KEY');
const eppoBaseUrl = 'https://data.eppo.int/api/rest/1.0';

serve(async (req) => {
  // Gestisci le richieste preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Ottieni parametri dalla richiesta
    const { endpoint, query } = await req.json();
    
    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: 'Endpoint parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Costruisci l'URL per l'API EPPO
    let eppoUrl = `${eppoBaseUrl}/${endpoint}`;
    if (query) {
      eppoUrl += `?${query}`;
    }
    
    console.log(`Calling EPPO API: ${eppoUrl}`);
    
    // Effettua la chiamata all'API EPPO
    const response = await fetch(eppoUrl, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${eppoApiKey}`
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
      JSON.stringify(data),
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
