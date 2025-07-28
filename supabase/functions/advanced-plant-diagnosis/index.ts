import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlantDiagnosisResult {
  plantIdentification: {
    name: string;
    scientificName: string;
    family: string;
    genus: string;
    confidence: number;
    description: string;
  };
  healthAnalysis: {
    isHealthy: boolean;
    overallScore: number;
    issues: Array<{
      type: 'disease' | 'pest' | 'nutritional' | 'environmental';
      name: string;
      severity: 'low' | 'medium' | 'high';
      confidence: number;
      description: string;
      symptoms: string[];
      causes: string[];
      treatment: string[];
    }>;
  };
  recommendations: {
    immediate: string[];
    longTerm: string[];
    prevention: string[];
  };
  careInstructions: {
    watering: string;
    light: string;
    temperature: string;
    humidity: string;
    fertilization: string;
  };
}

async function analyzeWithAdvancedAI(imageBase64: string): Promise<PlantDiagnosisResult> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `
  Analizza questa immagine di una pianta come un esperto agronomo e fitopatologo. Fornisci una diagnosi completa e dettagliata.

  IMPORTANTE: Rispondere SOLO in formato JSON valido, senza testo aggiuntivo.

  Analizza:
  1. IDENTIFICAZIONE DELLA PIANTA (molto precisa)
  2. STATO DI SALUTE (dettagliatissimo)
  3. PROBLEMI SPECIFICI (malattie, parassiti, carenze)
  4. RACCOMANDAZIONI PRATICHE

  Risposta in JSON:
  {
    "plantIdentification": {
      "name": "Nome comune preciso",
      "scientificName": "Nome scientifico completo",
      "family": "Famiglia botanica",
      "genus": "Genere",
      "confidence": numero_da_0_a_1,
      "description": "Descrizione dettagliata della pianta"
    },
    "healthAnalysis": {
      "isHealthy": boolean,
      "overallScore": numero_da_0_a_1,
      "issues": [
        {
          "type": "disease|pest|nutritional|environmental",
          "name": "Nome specifico del problema",
          "severity": "low|medium|high",
          "confidence": numero_da_0_a_1,
          "description": "Descrizione dettagliata del problema",
          "symptoms": ["sintomo1", "sintomo2"],
          "causes": ["causa1", "causa2"],
          "treatment": ["trattamento1", "trattamento2"]
        }
      ]
    },
    "recommendations": {
      "immediate": ["azione immediata 1", "azione immediata 2"],
      "longTerm": ["azione a lungo termine 1", "azione a lungo termine 2"],
      "prevention": ["prevenzione 1", "prevenzione 2"]
    },
    "careInstructions": {
      "watering": "Istruzioni specifiche per l'irrigazione",
      "light": "Requisiti di luce specifici",
      "temperature": "Range di temperatura ottimale",
      "humidity": "Livello di umidità ideale",
      "fertilization": "Programma di fertilizzazione specifico"
    }
  }

  Sii estremamente specifico su:
  - Nome esatto della pianta (varietà inclusa se visibile)
  - Malattie fungine, batteriche o virali specifiche
  - Parassiti identificabili (afidi, acari, cocciniglie, etc.)
  - Carenze nutrizionali (azoto, fosforo, potassio, microelementi)
  - Problemi ambientali (stress idrico, luminosità, temperatura)
  - Trattamenti chimici e biologici specifici
  - Dosaggi e tempistiche dei trattamenti
  `;

  try {
    console.log('🔬 Iniziando analisi avanzata con GPT-4o Vision');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Sei un esperto agronomo e fitopatologo con 20+ anni di esperienza. Analizza le piante con precisione scientifica e fornisci diagnosi dettagliate.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1, // Bassa temperatura per precisione
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Errore OpenAI:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;

    console.log('🔬 Risposta GPT-4o ricevuta:', analysisText.substring(0, 200) + '...');

    // Parse del JSON dalla risposta
    try {
      // Rimuovi eventuali backticks o prefissi
      const cleanedText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const result = JSON.parse(cleanedText);
      
      console.log('✅ Analisi avanzata completata con successo');
      return result;
    } catch (parseError) {
      console.error('❌ Errore parsing JSON:', parseError);
      console.error('Testo ricevuto:', analysisText);
      throw new Error('Errore nel parsing della risposta AI');
    }

  } catch (error) {
    console.error('❌ Errore nell\'analisi avanzata:', error);
    throw error;
  }
}

// Funzione di fallback per problemi comuni
async function generateFallbackDiagnosis(imageBase64: string): Promise<PlantDiagnosisResult> {
  console.log('⚠️ Usando diagnosi di fallback');
  
  return {
    plantIdentification: {
      name: "Pianta non identificata",
      scientificName: "Specie non determinata",
      family: "Famiglia non identificata",
      genus: "Genere non identificato",
      confidence: 0.3,
      description: "Non è stato possibile identificare la pianta con certezza. Si consiglia una valutazione diretta da parte di un esperto."
    },
    healthAnalysis: {
      isHealthy: false,
      overallScore: 0.5,
      issues: [
        {
          type: "environmental",
          name: "Analisi richiesta",
          severity: "medium",
          confidence: 0.5,
          description: "È necessaria un'analisi più approfondita per determinare eventuali problemi",
          symptoms: ["Aspetto generale da valutare"],
          causes: ["Cause da determinare"],
          treatment: ["Consultare un esperto agronomo"]
        }
      ]
    },
    recommendations: {
      immediate: ["Consultare un esperto agronomo locale"],
      longTerm: ["Monitorare la pianta regolarmente"],
      prevention: ["Mantenere condizioni di crescita ottimali"]
    },
    careInstructions: {
      watering: "Mantenere il terreno leggermente umido ma non saturo",
      light: "Fornire luce adeguata secondo le esigenze della specie",
      temperature: "Mantenere temperatura ambiente stabile",
      humidity: "Mantenere umidità moderata",
      fertilization: "Applicare fertilizzante bilanciato secondo necessità"
    }
  };
}

serve(async (req) => {
  console.log('🚀 Advanced Plant Diagnosis - Richiesta ricevuta');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { imageBase64, plantInfo } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'imageBase64 è richiesto' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('📸 Immagine ricevuta, avvio analisi avanzata...');

    let result: PlantDiagnosisResult;

    try {
      // Prova prima l'analisi avanzata con GPT-4o
      result = await analyzeWithAdvancedAI(imageBase64);
      
      // Aggiungi informazioni aggiuntive se fornite dall'utente
      if (plantInfo) {
        console.log('📝 Informazioni aggiuntive fornite dall\'utente:', plantInfo);
        
        // Integra le informazioni dell'utente nelle raccomandazioni
        if (plantInfo.symptoms) {
          result.recommendations.immediate.unshift(`Sintomi riportati: ${plantInfo.symptoms}`);
        }
        
        if (plantInfo.location) {
          result.recommendations.longTerm.push(`Considerare il clima di ${plantInfo.location} nelle cure`);
        }
      }
      
    } catch (error) {
      console.error('❌ Errore nell\'analisi avanzata, uso fallback:', error);
      result = await generateFallbackDiagnosis(imageBase64);
    }

    console.log('✅ Diagnosi completata:', {
      plant: result.plantIdentification.name,
      confidence: result.plantIdentification.confidence,
      issues: result.healthAnalysis.issues.length,
      isHealthy: result.healthAnalysis.isHealthy
    });

    return new Response(JSON.stringify({
      success: true,
      diagnosis: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Errore generale nella diagnosi:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Errore nella diagnosi della pianta',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});