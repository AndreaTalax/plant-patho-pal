
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
    
    console.log("Received image data for Plant Diseases AI analysis");
    
    // In a real implementation, we would call the Plant Diseases AI service here
    // For now, we'll simulate a response since we don't have actual API access

    // Simulated processing delay to mimic API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate a simulated response
    const diseaseAnalysis = simulatePlantDiseaseAIResponse();
    
    console.log("Plant Diseases AI analysis completed");
    
    return new Response(
      JSON.stringify(diseaseAnalysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in Plant Diseases AI analysis:", error);
    
    return new Response(
      JSON.stringify({ error: 'Analysis failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Simulate Plant Diseases AI response with realistic disease data
/**
 * Simulates AI-based plant disease analysis and returns a random plant disease report.
 * @example
 * simulatePlantDiseaseAIResponse()
 * {
 *   plantName: "Cucumber",
 *   diseaseName: "Powdery Mildew",
 *   confidence: 0.92,
 *   isHealthy: false,
 *   plantPart: "leaf",
 *   symptoms: [
 *     "White powdery spots on leaves and stems",
 *     "Yellowing leaves",
 *     "Premature leaf drop",
 *     "Stunted growth"
 *   ],
 *   treatment: {
 *     biological: [
 *       "Apply neem oil spray",
 *       "Use milk spray (1:10 milk to water ratio)",
 *       "Prune affected leaves"
 *     ],
 *     chemical: [
 *       "Apply sulfur-based fungicides",
 *       "Use potassium bicarbonate-based fungicides"
 *     ],
 *     prevention: [
 *       "Space plants properly for good air circulation",
 *       "Avoid overhead watering",
 *       "Plant resistant varieties"
 *     ]
 *   }
 * }
 * @returns {Object} An object containing plant disease analysis with treatment suggestions.
 * @description
 *   - Randomly selects a plant disease report from predefined diseases.
 *   - Has a 25% chance of returning a report indicating the plant is healthy.
 */
function simulatePlantDiseaseAIResponse() {
  const plantDiseases = [
    {
      plantName: "Tomato",
      diseaseName: "Late Blight",
      confidence: 0.89,
      isHealthy: false,
      plantPart: "leaf",
      symptoms: [
        "Dark brown spots on leaves",
        "White fungal growth on underside of leaves",
        "Rotting fruit with greasy appearance"
      ],
      treatment: {
        biological: [
          "Remove and destroy infected plant parts",
          "Improve air circulation around plants",
          "Apply copper-based fungicide"
        ],
        chemical: [
          "Apply fungicides containing chlorothalonil or mancozeb",
          "Follow with systemic fungicides in severe cases"
        ],
        prevention: [
          "Plant resistant varieties",
          "Use drip irrigation to keep foliage dry",
          "Rotate crops with non-solanaceous plants"
        ]
      }
    },
    {
      plantName: "Cucumber",
      diseaseName: "Powdery Mildew",
      confidence: 0.92,
      isHealthy: false,
      plantPart: "leaf",
      symptoms: [
        "White powdery spots on leaves and stems",
        "Yellowing leaves",
        "Premature leaf drop",
        "Stunted growth"
      ],
      treatment: {
        biological: [
          "Apply neem oil spray",
          "Use milk spray (1:10 milk to water ratio)",
          "Prune affected leaves"
        ],
        chemical: [
          "Apply sulfur-based fungicides",
          "Use potassium bicarbonate-based fungicides"
        ],
        prevention: [
          "Space plants properly for good air circulation",
          "Avoid overhead watering",
          "Plant resistant varieties"
        ]
      }
    },
    {
      plantName: "Rose",
      diseaseName: "Black Spot",
      confidence: 0.95,
      isHealthy: false,
      plantPart: "leaf",
      symptoms: [
        "Black or dark brown spots on leaves",
        "Yellow halos around spots",
        "Premature leaf drop",
        "Reduced flowering"
      ],
      treatment: {
        biological: [
          "Remove and dispose of infected leaves",
          "Apply compost tea spray",
          "Use baking soda solution (1 tsp baking soda, 1 tsp horticultural oil, 1 qt water)"
        ],
        chemical: [
          "Apply chlorothalonil fungicide",
          "Use myclobutanil-based fungicides"
        ],
        prevention: [
          "Plant disease-resistant varieties",
          "Space roses for good air circulation",
          "Water at base of plant to keep foliage dry",
          "Clean up fallen leaves in autumn"
        ]
      }
    },
    {
      plantName: "Healthy Plant",
      diseaseName: null,
      confidence: 0.91,
      isHealthy: true,
      plantPart: "leaf",
      symptoms: ["No symptoms of disease detected"],
      treatment: {
        biological: ["Continue regular plant care"],
        chemical: ["No chemical treatment needed"],
        prevention: [
          "Maintain good plant hygiene",
          "Monitor plant regularly for early signs of issues",
          "Ensure appropriate watering and light conditions"
        ]
      }
    }
  ];
  
  // Return a random disease analysis (75% chance of disease, 25% chance of healthy)
  if (Math.random() < 0.25) {
    return plantDiseases[3]; // Return healthy result
  } else {
    // Return a random disease
    return plantDiseases[Math.floor(Math.random() * 3)];
  }
}
