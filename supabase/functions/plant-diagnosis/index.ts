
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

    // Try Plant.id API first
    let plantIdResult = null;
    const PLANT_ID_API_KEY = Deno.env.get('PLANT_ID_API_KEY');
    
    if (PLANT_ID_API_KEY) {
      try {
        console.log("🌱 Attempting Plant.id identification...");
        const plantIdResponse = await fetch('https://api.plant.id/v3/identification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Api-Key': PLANT_ID_API_KEY,
          },
          body: JSON.stringify({
            images: [image],
            similar_images: true,
            plant_details: ["common_names", "url"],
            disease_details: ["common_names", "description", "treatment"],
          }),
        });

        if (plantIdResponse.ok) {
          plantIdResult = await plantIdResponse.json();
          console.log("✅ Plant.id response received");
        } else {
          console.log("⚠️ Plant.id API failed:", plantIdResponse.status);
        }
      } catch (error) {
        console.log("⚠️ Plant.id error:", error.message);
      }
    }

    // Try HuggingFace as fallback
    let huggingFaceResult = null;
    const HUGGINGFACE_ACCESS_TOKEN = Deno.env.get('HUGGINGFACE_ACCESS_TOKEN');
    
    if (HUGGINGFACE_ACCESS_TOKEN && !plantIdResult) {
      try {
        console.log("🤖 Attempting HuggingFace classification...");
        
        // Convert base64 to binary for HuggingFace
        const binaryString = atob(image);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const hfResponse = await fetch(
          'https://api-inference.huggingface.co/models/google/vit-base-patch16-224',
          {
            headers: {
              'Authorization': `Bearer ${HUGGINGFACE_ACCESS_TOKEN}`,
              'Content-Type': 'application/octet-stream',
            },
            method: 'POST',
            body: bytes,
          }
        );

        if (hfResponse.ok) {
          huggingFaceResult = await hfResponse.json();
          console.log("✅ HuggingFace response received");
        } else {
          console.log("⚠️ HuggingFace API failed:", hfResponse.status);
        }
      } catch (error) {
        console.log("⚠️ HuggingFace error:", error.message);
      }
    }

    // Process results
    let analysis = null;

    if (plantIdResult && plantIdResult.suggestions && plantIdResult.suggestions.length > 0) {
      const topSuggestion = plantIdResult.suggestions[0];
      const confidence = topSuggestion.probability || 0;
      
      // Check for diseases
      const hasDisease = plantIdResult.health_assessment && 
                        plantIdResult.health_assessment.diseases && 
                        plantIdResult.health_assessment.diseases.length > 0;
      
      const diseases = hasDisease ? 
        plantIdResult.health_assessment.diseases.map(disease => ({
          name: disease.name || 'Malattia sconosciuta',
          probability: disease.probability || 0.5,
          description: disease.description || 'Malattia rilevata dall\'analisi',
          treatment: disease.treatment?.biological?.[0] || disease.treatment?.chemical?.[0] || 'Consulta un esperto'
        })) : [];

      analysis = {
        plantName: topSuggestion.plant_name || topSuggestion.plant_details?.common_names?.[0] || 'Pianta non identificata',
        scientificName: topSuggestion.plant_details?.scientific_name || 'Specie sconosciuta',
        confidence: confidence,
        isHealthy: !hasDisease,
        diseases: diseases,
        recommendations: hasDisease ? 
          ['Controlla regolarmente la pianta', 'Consulta un fitopatologo se i sintomi peggiorano'] :
          ['Mantieni le cure standard', 'Continua a monitorare la salute della pianta'],
        analysisDetails: {
          plantId: { status: 'success', confidence: confidence },
          source: 'Plant.id API'
        }
      };

    } else if (huggingFaceResult && Array.isArray(huggingFaceResult) && huggingFaceResult.length > 0) {
      const topResult = huggingFaceResult[0];
      const confidence = topResult.score || 0;
      
      analysis = {
        plantName: topResult.label || 'Pianta non identificata',
        scientificName: 'Specie da determinare',
        confidence: confidence,
        isHealthy: true, // HuggingFace doesn't detect diseases
        diseases: [],
        recommendations: [
          'Identificazione basata su AI generale',
          'Per diagnosi precise consulta un fitopatologo',
          'Mantieni cure standard per la pianta'
        ],
        analysisDetails: {
          huggingFace: { status: 'success', confidence: confidence },
          source: 'HuggingFace Vision AI'
        }
      };

    } else {
      // Fallback analysis
      analysis = {
        plantName: plantInfo?.name || 'Pianta non identificata',
        scientificName: 'Specie non determinata',
        confidence: 0.3,
        isHealthy: false,
        diseases: [{
          name: 'Analisi non completata',
          probability: 0.5,
          description: 'I servizi di identificazione AI non sono riusciti ad analizzare l\'immagine. Potrebbe essere necessaria un\'immagine più chiara o una consulenza diretta con un esperto.',
          treatment: 'Consulenza esperta raccomandata'
        }],
        recommendations: [
          'Riprova con un\'immagine più chiara e nitida',
          'Assicurati che la pianta sia ben illuminata',
          'Consulta direttamente il nostro fitopatologo per un\'analisi professionale'
        ],
        analysisDetails: {
          fallback: true,
          reason: 'Servizi AI non disponibili o immagine non processabile'
        }
      };
    }

    console.log("✅ Analysis completed successfully");
    console.log("📊 Analysis result:", JSON.stringify(analysis, null, 2));
    
    return new Response(
      JSON.stringify(analysis),
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
        plantName: "Analisi fallita",
        confidence: 0.2,
        isHealthy: false,
        diseases: [{
          name: "Errore di analisi",
          probability: 0.3,
          description: "Si è verificato un errore tecnico durante l'analisi. Riprova o consulta direttamente l'esperto.",
          treatment: "Riprova l'analisi o consulta l'esperto"
        }],
        recommendations: ["Riprova l'analisi", "Consulta direttamente l'esperto"],
        analysisDetails: { error: true }
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 // Return 200 even for errors to provide fallback data
      }
    );
  }
});
