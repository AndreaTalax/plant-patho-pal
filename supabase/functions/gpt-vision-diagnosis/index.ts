import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    console.log('🔍 GPT Vision Diagnosis - Inizio analisi');
    
    if (!openAIApiKey) {
      console.error('❌ OPENAI_API_KEY non configurata');
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key non configurata',
          fallback: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { imageUrl, plantInfo } = await req.json();
    
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'URL immagine richiesto' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🖼️ Analizzando immagine con GPT-4 Vision:', imageUrl);

    // Prompt specializzato per fitopatologia
    const systemPrompt = `Sei un esperto fitopatologo specializzato nella diagnosi delle malattie delle piante. 
Analizza l'immagine fornita e fornisci una diagnosi dettagliata in formato JSON con le seguenti informazioni:

{
  "species": "Nome scientifico e comune della specie identificata",
  "healthStatus": "healthy" | "diseased" | "stressed",
  "confidence": numero da 0 a 1,
  "diseases": [
    {
      "name": "Nome della malattia",
      "confidence": numero da 0 a 1,
      "severity": "low" | "medium" | "high",
      "symptoms": ["lista dei sintomi osservati"],
      "causes": ["possibili cause (fungo, batterio, virus, carenza, etc.)"],
      "treatment": "Trattamento raccomandato"
    }
  ],
  "symptoms": ["tutti i sintomi visibili nell'immagine"],
  "recommendations": ["raccomandazioni generali per la cura"],
  "urgency": "low" | "medium" | "high"
}

Concentrati su dettagli come: macchie fogliari, decolorazioni, necrosi, muffe, presenza di parassiti, deformazioni, appassimenti.`;

    const userPrompt = plantInfo 
      ? `Analizza questa pianta (${plantInfo.name || 'specie non specificata'}) per malattie o problemi di salute. ${plantInfo.symptoms ? `Sintomi riferiti: ${plantInfo.symptoms}` : ''}`
      : 'Analizza questa pianta per identificare specie, malattie o problemi di salute.';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: userPrompt },
              { 
                type: 'image_url', 
                image_url: { 
                  url: imageUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Errore OpenAI API:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: `OpenAI API non disponibile (${response.status})`,
          fallback: true,
          fallbackReason: `OpenAI API error: ${response.status}`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    
    console.log('📋 Risposta GPT-4 Vision ricevuta');

    try {
      // Prova a parsare come JSON
      const analysisResult = JSON.parse(analysisText);
      
      console.log('✅ Analisi GPT-4 Vision completata:', {
        species: analysisResult.species,
        healthStatus: analysisResult.healthStatus,
        confidence: analysisResult.confidence,
        diseasesCount: analysisResult.diseases?.length || 0
      });

      return new Response(
        JSON.stringify({
          success: true,
          provider: 'gpt-vision',
          analysis: analysisResult,
          confidence: analysisResult.confidence || 0.8,
          processingTime: Date.now()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } catch (parseError) {
      // Se non è JSON valido, ritorna il testo come analisi testuale
      console.log('📝 Risposta GPT-4 in formato testo');
      
      return new Response(
        JSON.stringify({
          success: true,
          provider: 'gpt-vision',
          analysis: {
            textAnalysis: analysisText,
            confidence: 0.7,
            healthStatus: 'unknown'
          },
          confidence: 0.7,
          processingTime: Date.now()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('❌ Errore generale:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Errore interno del servizio',
        details: error.message,
        fallback: true
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});