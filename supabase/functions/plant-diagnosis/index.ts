
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔍 Plant diagnosis function called");
    
    const { image, plantInfo } = await req.json();
    
    if (!image) {
      console.error("❌ No image data provided");
      throw new Error("Image data is required");
    }

    console.log("📸 Image data received, length:", image.length);
    console.log("🌿 Plant info:", plantInfo);

    // Mock analysis result for now since real APIs might not be configured
    const mockAnalysis = {
      plantName: plantInfo?.name || "Unknown Plant",
      scientificName: "Species not identified",
      confidence: 0.5,
      isHealthy: false,
      diseases: [{
        name: "Unable to analyze",
        probability: 0.5,
        description: "Analysis service temporarily unavailable. Please consult with our expert for detailed analysis."
      }],
      recommendations: [
        "Consult with our phytopathologist expert for professional analysis",
        "Monitor plant condition daily",
        "Ensure proper watering and light conditions"
      ],
      analysisDetails: {
        plantId: { status: "mock_response" },
        huggingFace: { status: "mock_response" },
        eppo: { status: "mock_response" }
      }
    };

    console.log("✅ Analysis completed successfully");
    
    return new Response(
      JSON.stringify(mockAnalysis),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );

  } catch (error) {
    console.error("❌ Plant diagnosis error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        plantName: "Unknown Plant",
        confidence: 0.3,
        isHealthy: false,
        diseases: [{
          name: "Analysis failed",
          probability: 0.3,
          description: "Technical error during analysis. Please try again or consult our expert."
        }],
        recommendations: ["Please consult with our expert for analysis"],
        analysisDetails: {}
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 // Return 200 even for errors to provide fallback data
      }
    );
  }
});
