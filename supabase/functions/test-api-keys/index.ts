import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  console.log(`🔍 === Test API Keys === ${new Date().toISOString()}`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const results = {
      plantId: { status: 'unknown', error: null },
      plantIdCropHealth: { status: 'unknown', error: null },
      plantNet: { status: 'unknown', error: null },
      eppo: { status: 'unknown', error: null }
    };

    // Test Plant.ID API
    const plantIdKey = Deno.env.get('PLANT_ID_API_KEY');
    if (plantIdKey) {
      try {
        console.log('🌱 Testing Plant.ID API...');
        const testImage = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='; // Tiny test image
        
        const response = await fetch('https://api.plant.id/v3/identification', {
          method: 'POST',
          headers: {
            'Api-Key': plantIdKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            images: [testImage],
            similar_images: true,
            plant_details: ['common_names']
          }),
        });

        if (response.ok) {
          results.plantId.status = 'working';
          console.log('✅ Plant.ID API is working');
        } else {
          const errorText = await response.text();
          results.plantId.status = 'error';
          results.plantId.error = `HTTP ${response.status}: ${errorText}`;
          console.log(`❌ Plant.ID API error: ${response.status} - ${errorText}`);
        }
      } catch (error) {
        results.plantId.status = 'error';
        results.plantId.error = error.message;
        console.log(`❌ Plant.ID API exception: ${error.message}`);
      }
    } else {
      results.plantId.status = 'missing_key';
      console.log('❌ Plant.ID API key missing');
    }

    // Test Plant.ID Crop Health API
    const plantIdCropHealthKey = Deno.env.get('PLANT_ID_CROP_HEALTH_API_KEY');
    if (plantIdCropHealthKey) {
      try {
        console.log('🌱 Testing Plant.ID Crop Health API...');
        const testImage = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
        
        const response = await fetch('https://crop.disease.id/api/v1/identification', {
          method: 'POST',
          headers: {
            'Api-Key': plantIdCropHealthKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            images: [testImage],
            modifiers: ['crops_fast'],
            disease_details: ['description']
          }),
        });

        if (response.ok) {
          results.plantIdCropHealth.status = 'working';
          console.log('✅ Plant.ID Crop Health API is working');
        } else {
          const errorText = await response.text();
          results.plantIdCropHealth.status = 'error';
          results.plantIdCropHealth.error = `HTTP ${response.status}: ${errorText}`;
          console.log(`❌ Plant.ID Crop Health API error: ${response.status} - ${errorText}`);
        }
      } catch (error) {
        results.plantIdCropHealth.status = 'error';
        results.plantIdCropHealth.error = error.message;
        console.log(`❌ Plant.ID Crop Health API exception: ${error.message}`);
      }
    } else {
      results.plantIdCropHealth.status = 'missing_key';
      console.log('❌ Plant.ID Crop Health API key missing');
    }

    // Test PlantNet API
    const plantNetKey = Deno.env.get('PLANT_NET_KEY');
    if (plantNetKey) {
      try {
        console.log('🌿 Testing PlantNet API...');
        // Simple test call to check if key is valid
        const response = await fetch(`https://my-api.plantnet.org/v2/projects/weurope/identify/${plantNetKey}`, {
          method: 'GET'
        });

        if (response.status === 405) {
          // Method not allowed is expected for GET on this endpoint, means API key is valid
          results.plantNet.status = 'working';
          console.log('✅ PlantNet API key is valid');
        } else if (response.status === 401 || response.status === 403) {
          results.plantNet.status = 'expired';
          results.plantNet.error = 'API key expired or invalid';
          console.log('❌ PlantNet API key expired or invalid');
        } else {
          const errorText = await response.text();
          results.plantNet.status = 'error';
          results.plantNet.error = `HTTP ${response.status}: ${errorText}`;
          console.log(`❌ PlantNet API error: ${response.status} - ${errorText}`);
        }
      } catch (error) {
        results.plantNet.status = 'error';
        results.plantNet.error = error.message;
        console.log(`❌ PlantNet API exception: ${error.message}`);
      }
    } else {
      results.plantNet.status = 'missing_key';
      console.log('❌ PlantNet API key missing');
    }

    // Test EPPO API
    const eppoToken = Deno.env.get('EPPO_AUTH_TOKEN');
    if (eppoToken) {
      try {
        console.log('🔬 Testing EPPO API...');
        const response = await fetch('https://data.eppo.int/api/rest/1.0/taxon?authtoken=' + eppoToken + '&kw=test');
        
        if (response.ok) {
          results.eppo.status = 'working';
          console.log('✅ EPPO API is working');
        } else {
          const errorText = await response.text();
          results.eppo.status = 'error';
          results.eppo.error = `HTTP ${response.status}: ${errorText}`;
          console.log(`❌ EPPO API error: ${response.status} - ${errorText}`);
        }
      } catch (error) {
        results.eppo.status = 'error';
        results.eppo.error = error.message;
        console.log(`❌ EPPO API exception: ${error.message}`);
      }
    } else {
      results.eppo.status = 'missing_key';
      console.log('❌ EPPO API token missing');
    }

    console.log('📊 Final test results:', results);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("❌ Error testing API keys:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to test API keys",
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});