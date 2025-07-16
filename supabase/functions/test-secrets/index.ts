import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Test Secrets - Verifica configurazione');
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const plantIdKey = Deno.env.get('PLANT_ID_API_KEY');
    const plantNetKey = Deno.env.get('PLANTNET') || Deno.env.get('PLANT_NET_KEY');
    const eppoKey = Deno.env.get('EPPO_API_KEY');
    
    console.log('✅ Secrets check:');
    console.log('- OPENAI_API_KEY:', openAIApiKey ? `Presente (${openAIApiKey.length} caratteri)` : 'MANCANTE');
    console.log('- PLANT_ID_API_KEY:', plantIdKey ? `Presente (${plantIdKey.length} caratteri)` : 'MANCANTE');
    console.log('- PLANTNET/PLANT_NET_KEY:', plantNetKey ? `Presente (${plantNetKey.length} caratteri)` : 'MANCANTE');
    console.log('- EPPO_API_KEY:', eppoKey ? `Presente (${eppoKey.length} caratteri)` : 'MANCANTE');
    
    const result = {
      success: true,
      secrets: {
        openai: !!openAIApiKey,
        plantId: !!plantIdKey,
        plantNet: !!plantNetKey,
        eppo: !!eppoKey
      },
      message: 'Test secrets completato'
    };
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('❌ Errore test secrets:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});