import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Edge function temporanea per caricare il logo nel bucket plant-images
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Logo Hortives in base64 (semplice per l'esempio - sostituire con logo reale)
    const logoUrl = 'https://otdmqmpxukifoxjlgzmq.supabase.co/storage/v1/object/public/plant-images/dr-plant-logo-main.jpg';
    
    console.log('📥 Scaricamento logo da:', logoUrl);
    
    const response = await fetch(logoUrl);
    if (!response.ok) {
      throw new Error(`Impossibile scaricare il logo: ${response.status}`);
    }
    
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    
    console.log('📤 Upload logo nel bucket plant-images...');
    
    const { data, error } = await supabaseClient.storage
      .from('plant-images')
      .upload('hortives-logo.jpg', arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.error('❌ Errore upload logo:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabaseClient.storage
      .from('plant-images')
      .getPublicUrl('hortives-logo.jpg');

    console.log('✅ Logo caricato con successo:', publicUrl);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Logo caricato con successo',
        publicUrl
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Errore:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
