import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const { plantName, isIndoor, currentWatering, currentLight, symptoms } = await req.json();

    console.log('🌱 Generating care recommendations for:', plantName);

    const prompt = `Come esperto fitopatologo, fornisci raccomandazioni di cura dettagliate per una ${plantName}.

Contesto attuale:
- Ambiente: ${isIndoor ? 'Interno' : 'Esterno'}
- Frequenza irrigazione attuale: ${currentWatering || 'Non specificata'}
- Esposizione luce attuale: ${currentLight || 'Non specificata'}
- Sintomi osservati: ${symptoms || 'Nessun sintomo specifico'}

Fornisci una risposta in formato JSON con questa struttura esatta:
{
  "watering": {
    "frequency": "frequenza specifica per questa pianta",
    "method": "metodo di irrigazione raccomandato",
    "warnings": ["avvertimento 1", "avvertimento 2"]
  },
  "lighting": {
    "requirements": "requisiti specifici di luce",
    "recommendations": ["raccomandazione 1", "raccomandazione 2"]
  },
  "environment": {
    "humidity": "percentuale umidità ideale",
    "temperature": "range temperatura ideale",
    "location": "posizione ideale"
  },
  "nutrition": {
    "fertilizer": "tipo di fertilizzante raccomandato",
    "schedule": "frequenza fertilizzazione"
  }
}

Personalizza le raccomandazioni in base ai sintomi se presenti e considera l'ambiente attuale.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'Sei un esperto fitopatologo specializzato nella cura delle piante. Fornisci sempre risposte in formato JSON valido e raccomandazioni specifiche basate su conoscenze agronomiche.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log('🤖 OpenAI response received');

    // Prova a parsare la risposta JSON
    try {
      const careRecommendations = JSON.parse(content);
      
      return new Response(JSON.stringify(careRecommendations), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('❌ Error parsing OpenAI JSON response:', parseError);
      
      // Fallback con raccomandazioni generiche
      const fallbackRecommendations = {
        watering: {
          frequency: isIndoor ? "1-2 volte a settimana" : "2-3 volte a settimana",
          method: "Innaffia quando il terreno è asciutto in superficie",
          warnings: ["Evita ristagni d'acqua", "Controlla il drenaggio del vaso"]
        },
        lighting: {
          requirements: isIndoor ? "Luce indiretta brillante" : "Luce solare diretta o indiretta",
          recommendations: ["Ruota la pianta periodicamente", "Evita cambi drastici di illuminazione"]
        },
        environment: {
          humidity: "40-60%",
          temperature: "18-24°C",
          location: isIndoor ? "Vicino a finestra luminosa" : "Zona riparata dal vento forte"
        },
        nutrition: {
          fertilizer: "Fertilizzante bilanciato N-P-K 10-10-10",
          schedule: "Ogni 2-4 settimane durante primavera ed estate"
        }
      };

      return new Response(JSON.stringify(fallbackRecommendations), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('❌ Error in generate-care-recommendations:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      fallback: true 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});