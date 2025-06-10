
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'No image data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log("Received image data for RougeN AI analysis");
    
    // In a real implementation, we would call the RougeN AI service here
    // For now, we'll simulate a response since we don't have actual API access

    // Simulated processing delay to mimic API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate a simulated response
    const plantData = simulateRougenAIResponse();
    
    console.log("RougeN AI analysis completed");
    
    return new Response(
      JSON.stringify(plantData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in RougeN AI analysis:", error);
    
    return new Response(
      JSON.stringify({ error: 'Analysis failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Simulate RougeN AI response with realistic plant data
/**
* Simulates a RougenAI response by returning a random plant profile
* @example
* simulateRougenAIResponse()
* {
*   plantName: "Monstera Deliciosa",
*   scientificName: "Monstera deliciosa",
*   commonNames: ["Swiss Cheese Plant", "Split-leaf Philodendron"],
*   confidence: 0.93,
*   isHealthy: true,
*   habitat: "Tropical forests of Southern Mexico and Panama",
*   ...
* }
* @returns {Object} A randomly selected plant profile containing details like name, common names, care instructions, and taxonomy.
* @description
*   - Each plant object includes a confidence score and randomly determined health status.
*   - The health status is simulated with a predefined probability for each plant type.
*   - Plant care details cover aspects such as watering, light conditions, and propagation.
*/
function simulateRougenAIResponse() {
  const plants = [
    {
      plantName: "Monstera Deliciosa",
      scientificName: "Monstera deliciosa",
      commonNames: ["Swiss Cheese Plant", "Split-leaf Philodendron"],
      confidence: 0.93,
      isHealthy: Math.random() > 0.3, // 70% chance of being healthy
      habitat: "Tropical forests of Southern Mexico and Panama",
      plantPart: "leaf",
      care: {
        watering: "Water when the top 1-2 inches of soil are dry. Reduce in winter.",
        light: "Bright, indirect light. Can tolerate some shade.",
        soil: "Well-draining potting mix rich in organic matter.",
        humidity: "Prefers high humidity. Mist regularly or use a humidifier.",
        temperature: "18-30°C (65-86°F). Not frost tolerant.",
        fertilizer: "Feed monthly during growing season with balanced liquid fertilizer.",
        propagation: "Easily propagated through stem cuttings with nodes."
      },
      taxonomy: {
        family: "Araceae",
        genus: "Monstera",
        order: "Alismatales"
      }
    },
    {
      plantName: "Peace Lily",
      scientificName: "Spathiphyllum wallisii",
      commonNames: ["Peace Lily", "White Sail Plant"],
      confidence: 0.91,
      isHealthy: Math.random() > 0.3,
      habitat: "Tropical rainforests of Central and South America",
      plantPart: "whole plant",
      care: {
        watering: "Keep soil consistently moist. Drooping leaves indicate need for water.",
        light: "Low to moderate indirect light. No direct sunlight.",
        soil: "Rich, loose potting mix with good drainage.",
        humidity: "Prefers high humidity. Mist regularly.",
        temperature: "18-30°C (65-85°F). Protect from cold drafts.",
        fertilizer: "Feed every 6-8 weeks with balanced liquid fertilizer.",
        propagation: "Divide plants during repotting."
      },
      taxonomy: {
        family: "Araceae",
        genus: "Spathiphyllum",
        order: "Alismatales"
      }
    },
    {
      plantName: "Snake Plant",
      scientificName: "Dracaena trifasciata",
      commonNames: ["Snake Plant", "Mother-in-law's Tongue", "Sansevieria"],
      confidence: 0.95,
      isHealthy: Math.random() > 0.2,
      habitat: "West Africa, from Nigeria east to the Congo",
      plantPart: "leaf",
      care: {
        watering: "Allow soil to dry completely between waterings. Water sparingly in winter.",
        light: "Adapts to various light conditions from low light to bright indirect light.",
        soil: "Well-draining potting mix or cactus mix.",
        humidity: "Tolerates dry air well. No special humidity requirements.",
        temperature: "18-27°C (65-80°F). Can tolerate temperature fluctuations.",
        fertilizer: "Feed sparingly, only during growing season.",
        propagation: "Leaf cuttings or division during repotting."
      },
      taxonomy: {
        family: "Asparagaceae",
        genus: "Dracaena",
        order: "Asparagales"
      }
    }
  ];
  
  // Return a random plant from our dataset
  return plants[Math.floor(Math.random() * plants.length)];
}
