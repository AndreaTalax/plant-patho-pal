
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
    const { endpoint, query, userInput } = await req.json();
    
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
    
    // Add search parameters based on user input if provided
    let searchQuery = query || '';
    if (userInput && endpoint === 'pests') {
      // Try to extract symptoms or keywords from user input
      const symptoms = extractSymptoms(userInput);
      if (symptoms.length > 0) {
        searchQuery = `name=${encodeURIComponent(symptoms.join(' OR '))}`;
      }
    }
    
    if (searchQuery) {
      eppoUrl += `?${searchQuery}`;
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
    
    // Se è stata fornita una descrizione del problema dall'utente, elabora i risultati
    // per generare una spiegazione comprensibile
    let explanation = null;
    if (userInput && data) {
      explanation = generateExplanation(data, userInput, endpoint);
    }
    
    return new Response(
      JSON.stringify({
        data,
        explanation
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

// Funzione per estrarre possibili sintomi dalla descrizione dell'utente
function extractSymptoms(userInput: string): string[] {
  const input = userInput.toLowerCase();
  
  const symptomKeywords = [
    'macchie', 'gialle', 'ruggine', 'appassimento', 'foglie', 'secche', 'marciume',
    'muffe', 'bianco', 'nero', 'marrone', 'insetti', 'afidi', 'larve', 'buchi',
    'decolorazione', 'caduta', 'spotting', 'ingiallimento', 'oidio', 'cocciniglia'
  ];
  
  return symptomKeywords.filter(keyword => input.includes(keyword));
}

// Funzione per generare spiegazioni basate sui risultati dell'API e l'input dell'utente
function generateExplanation(data: any, userInput: string, endpoint: string): string {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return "Non sono stati trovati risultati rilevanti nel database EPPO per i sintomi descritti.";
  }
  
  // Genera spiegazione in base al tipo di endpoint
  switch (endpoint) {
    case 'pests':
      if (Array.isArray(data)) {
        if (data.length === 0) {
          return "Non ho trovato parassiti nel database EPPO che corrispondano ai sintomi descritti.";
        }
        
        const topResults = data.slice(0, 3);
        
        const explanation = 
          `In base ai sintomi descritti ("${userInput}"), ho trovato ${data.length} possibili cause nel database EPPO. ` +
          `Le più rilevanti potrebbero essere: \n\n` +
          topResults.map((pest, index) => 
            `${index + 1}. ${pest.preferredname || pest.name}: ${pest.description || 'Parassita/malattia delle piante che può causare i sintomi descritti.'}`
          ).join('\n\n');
          
        return explanation;
      } else {
        return `Ho trovato informazioni su ${data.preferredname || data.name} nel database EPPO. ` +
               `Questo ${data.type || 'organismo'} può causare i sintomi come quelli descritti.`;
      }
    case 'hosts':
      return `In base all'analisi del database EPPO, ho trovato informazioni sulle piante ospiti che potrebbero essere colpite dai sintomi descritti.`;
    default:
      return `Ho consultato il database EPPO e ho trovato delle informazioni che potrebbero essere utili per diagnosticare il problema della tua pianta.`;
  }
}
