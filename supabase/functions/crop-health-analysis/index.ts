import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, plantName, modifiers, diseaseDetails } =
      await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "imageBase64 is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("🏥 Crop-Health Analysis: Starting disease analysis...");

    // ✅ Usa la chiave PLANT_ID_API_KEY corretta
    const cropHealthApiKey = Deno.env.get("PLANT_ID_API_KEY");
    if (!cropHealthApiKey) {
      console.error("❌ PLANT_ID_API_KEY not found");
      return new Response(
        JSON.stringify({ error: "Plant.id API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    // ✅ Payload corretto per Plant.id
    const payload = {
      images: [cleanBase64],
      modifiers: modifiers ||
        ["crops_fast", "similar_images", "health_all"],
      disease_details: diseaseDetails ||
        [
          "cause",
          "common_names",
          "classification",
          "description",
          "treatment",
          "url",
        ],
      plant_details: ["common_names", "url", "taxonomy"], // <-- array valido
    };

    console.log("📡 Calling Plant.id Health API...");

    const response = await fetch("https://api.plant.id/v3/health_assessment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": cropHealthApiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `❌ Plant.id API error: ${response.status} - ${errorText}`,
      );
      return new Response(
        JSON.stringify({
          error: `Crop Health API error: ${response.status}`,
          details: errorText,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await response.json();
    console.log("✅ Crop Health analysis completed successfully");

    if (data.health_assessment?.diseases) {
      console.log(
        `🔍 Diseases detected: ${data.health_assessment.diseases.length}`,
      );
      data.health_assessment.diseases.forEach(
        (disease: any, index: number) => {
          console.log(
            `  ${index + 1}. ${disease.name} (${Math.round(
              disease.probability * 100,
            )}%)`,
          );
        },
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Function error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error during crop health analysis",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
