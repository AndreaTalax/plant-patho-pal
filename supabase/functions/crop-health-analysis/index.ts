import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, plantName, modifiers, diseaseDetails } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'imageBase64 is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🏥 Crop-Health Analysis: Starting disease analysis...');
    console.log('📥 Received data:', {
      hasImage: !!imageBase64,
      imageLength: imageBase64?.length,
      plantName,
      modifiers,
      diseaseDetails
    });
    
    const cropHealthApiKey = Deno.env.get('PLANT_ID_CROP_HEALTH_API_KEY');
    if (!cropHealthApiKey) {
      console.error('❌ PLANT_ID_CROP_HEALTH_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'Crop Health API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('🔑 Using Crop Health API key:', cropHealthApiKey.substring(0, 8) + '...');

    // Verifica che l'immagine sia nel formato corretto
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    console.log('🖼️ Image processing:', {
      originalLength: imageBase64.length,
      cleanedLength: cleanBase64.length,
      isBase64: /^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)
    });

    // Prepara il payload per Plant.ID Crop Health API
    const payload = {
      images: [cleanBase64],
      modifiers: modifiers || ["crops_fast", "similar_images", "health_all"],
      disease_details: diseaseDetails || ["cause", "common_names", "classification", "description", "treatment", "url"],
      ...(plantName && { plant_details: plantName })
    };

    console.log('📡 Calling Plant.ID Crop Health API...');
    console.log('📦 Payload structure:', {
      imageCount: payload.images.length,
      modifiers: payload.modifiers,
      diseaseDetails: payload.disease_details,
      hasPlantDetails: !!payload.plant_details
    });
    
    const response = await fetch('https://crop.disease.id/api/v1/identification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': cropHealthApiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Plant.ID Crop Health API error: ${response.status} - ${errorText}`);
      
      return new Response(
        JSON.stringify({ 
          error: `Crop Health API error: ${response.status}`,
          details: errorText 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('✅ Crop Health analysis completed successfully');

    // Log delle malattie rilevate per debugging
    if (data.health_assessment?.diseases) {
      console.log(`🔍 Diseases detected: ${data.health_assessment.diseases.length}`);
      data.health_assessment.diseases.forEach((disease: any, index: number) => {
        console.log(`  ${index + 1}. ${disease.name} (${Math.round(disease.probability * 100)}%)`);
      });
    }

    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Crop Health analysis function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error during crop health analysis',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});