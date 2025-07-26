import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  console.log(`🔍 === API Status Check === ${new Date().toISOString()}`);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check available API keys
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const plantidKey = Deno.env.get('PLANT_ID_API_KEY');
    const eppoToken = Deno.env.get('EPPO_AUTH_TOKEN');
    const plantnetKey = Deno.env.get('PLANT_NET_KEY');

    console.log('🔑 Checking API keys availability...');
    console.log(`OpenAI: ${openaiKey ? '✅ Available' : '❌ Missing'}`);
    console.log(`Plant.ID: ${plantidKey ? '✅ Available' : '❌ Missing'}`);
    console.log(`EPPO: ${eppoToken ? '✅ Available' : '❌ Missing'}`);
    console.log(`PlantNet: ${plantnetKey ? '✅ Available' : '❌ Missing'}`);

    const status = {
      openai: !!openaiKey,
      plantid: !!plantidKey,
      eppo: !!eppoToken,
      plantnet: !!plantnetKey,
      summary: {
        total: 4,
        configured: [openaiKey, plantidKey, eppoToken, plantnetKey].filter(Boolean).length,
        missing: [
          !openaiKey && 'OPENAI_API_KEY',
          !plantidKey && 'PLANT_ID_API_KEY', 
          !eppoToken && 'EPPO_AUTH_TOKEN',
          !plantnetKey && 'PLANT_NET_KEY'
        ].filter(Boolean)
      }
    };

    console.log('📊 Final status:', status);

    return new Response(JSON.stringify(status), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("❌ Error checking API status:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to check API status",
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});