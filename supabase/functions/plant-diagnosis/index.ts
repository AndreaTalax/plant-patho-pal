
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// EPPO symptoms database - moved directly into the function
const eppoSymptoms = [
  {
    keyword: 'citrus greening',
    name: 'Citrus Greening',
    description: 'A serious bacterial disease affecting citrus trees',
    category: 'bacterial disease',
    symptoms: ['yellow mottling', 'leaf asymmetry', 'vein yellowing', 'stunted growth', 'blotchy mottle']
  },
  {
    keyword: 'citrus canker',
    name: 'Citrus Canker',
    description: 'A bacterial disease causing lesions on citrus fruit, leaves, and stems',
    category: 'bacterial disease',
    symptoms: ['water-soaked lesions', 'circular lesions', 'raised corky tissue', 'chlorotic halo', 'ruptured epidermis']
  },
  {
    keyword: 'xylella',
    name: 'Xylella Fastidiosa',
    description: 'A bacterial pathogen affecting multiple host plants',
    category: 'bacterial disease',
    symptoms: ['leaf scorch', 'marginal leaf burn', 'wilting', 'dieback', 'stunted growth']
  },
  {
    keyword: 'fire blight',
    name: 'Fire Blight',
    description: 'A destructive bacterial disease affecting apple, pear and related species',
    category: 'bacterial disease',
    symptoms: ['blackened leaves', 'shepherd\'s crook', 'bacterial ooze', 'cankers', 'fruit mummification']
  },
  {
    keyword: 'sudden oak death',
    name: 'Sudden Oak Death',
    description: 'A disease caused by Phytophthora ramorum affecting oak trees',
    category: 'fungal disease',
    symptoms: ['trunk cankers', 'bleeding trunk', 'wilting foliage', 'black leaf lesions', 'shoot dieback']
  },
  {
    keyword: 'ash dieback',
    name: 'Ash Dieback',
    description: 'A serious disease of ash trees caused by a fungus',
    category: 'fungal disease',
    symptoms: ['diamond-shaped lesions', 'wilting leaves', 'crown dieback', 'bark lesions', 'wood discoloration']
  },
  {
    keyword: 'dutch elm disease',
    name: 'Dutch Elm Disease',
    description: 'A fungal disease affecting elm trees, spread by bark beetles',
    category: 'fungal disease',
    symptoms: ['yellowing foliage', 'wilting leaves', 'vascular discoloration', 'crown dieback', 'bark beetles']
  },
  {
    keyword: 'grape flavescence',
    name: 'Flavescence Dorée',
    description: 'A phytoplasma disease affecting grapevines',
    category: 'phytoplasma disease',
    symptoms: ['downward leaf rolling', 'leaf discoloration', 'lack of lignification', 'flower abortion', 'berry shrivel']
  },
  {
    keyword: 'bacterial wilt',
    name: 'Bacterial Wilt',
    description: 'A bacterial disease affecting a wide range of plants',
    category: 'bacterial disease',
    symptoms: ['rapid wilting', 'vascular discoloration', 'bacterial streaming', 'epinasty', 'adventitious roots']
  },
  {
    keyword: 'plum pox',
    name: 'Plum Pox Virus',
    description: 'A viral disease affecting stone fruit trees',
    category: 'viral disease',
    symptoms: ['chlorotic rings', 'vein yellowing', 'leaf deformation', 'fruit rings', 'fruit deformation']
  }
];

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

    // Function to enrich analysis with EPPO database
    function enrichWithEppo(analysis) {
      if (!analysis || !analysis.plantName) return analysis;
      
      const label = analysis.plantName.toLowerCase();
      console.log("🔍 Checking EPPO database for:", label);
      
      // Search for matches in eppoSymptoms (by keyword or symptoms)
      let found = null;
      
      // First, check by keyword
      for (const eppoItem of eppoSymptoms) {
        if (eppoItem.keyword && label.includes(eppoItem.keyword.toLowerCase())) {
          found = eppoItem;
          console.log("✅ Found EPPO match by keyword:", eppoItem.keyword);
          break;
        }
      }
      
      // If not found by keyword, check by symptoms in disease descriptions
      if (!found && analysis.diseases && Array.isArray(analysis.diseases)) {
        for (const diseaseObj of analysis.diseases) {
          if (diseaseObj.description) {
            for (const eppoItem of eppoSymptoms) {
              if (eppoItem.symptoms && Array.isArray(eppoItem.symptoms)) {
                const matchingSymptom = eppoItem.symptoms.some(symptom => 
                  diseaseObj.description.toLowerCase().includes(symptom.toLowerCase())
                );
                if (matchingSymptom) {
                  found = eppoItem;
                  console.log("✅ Found EPPO match by symptom:", eppoItem.name);
                  break;
                }
              }
            }
            if (found) break;
          }
        }
      }
      
      if (found) {
        // Check if this disease is already in the list
        const alreadyExists = analysis.diseases?.some(d => d.name === found.name);
        if (!alreadyExists) {
          console.log("🆕 Adding EPPO disease to analysis:", found.name);
          analysis.diseases = [
            ...(analysis.diseases || []),
            {
              name: found.name,
              probability: analysis.confidence || 0.6,
              description: found.description,
              treatment: "Consulta normativa EPPO e fitopatologo per trattamento specifico"
            }
          ];
          
          // Enrich recommendations
          analysis.recommendations = [
            ...(analysis.recommendations || []),
            "⚠️ Attenzione: Possibile patologia di importanza regolamentata (EPPO)"
          ];
          
          analysis.analysisDetails = {
            ...analysis.analysisDetails,
            eppo: {
              keyword: found.keyword,
              name: found.name,
              category: found.category
            },
            source: analysis.analysisDetails?.source || "Plant.id/EPPO AI"
          };
        }
      }
      
      return analysis;
    }

    // Apply EPPO enrichment
    analysis = enrichWithEppo(analysis);

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
