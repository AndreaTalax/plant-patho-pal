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
    console.log('🔐 Checking OpenAI API Key...');
    
    if (!openAIApiKey) {
      console.error('❌ OPENAI_API_KEY non configurata nel file env');
      console.log('Available env vars:', Object.keys(Deno.env.toObject()));
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key non configurata',
          debug: 'OPENAI_API_KEY non trovata nei secrets'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ OpenAI API Key trovata, lunghezza:', openAIApiKey.length);

    const { imageUrl, plantInfo } = await req.json();
    
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'URL immagine richiesto' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🖼️ Analizzando immagine con GPT-4 Vision:', imageUrl);

    // Prompt specializzato per fitopatologia con focus sui sintomi visibili
    const systemPrompt = `Sei un esperto fitopatologo con 20 anni di esperienza nella diagnosi delle malattie delle piante. 
Analizza ATTENTAMENTE l'immagine fornita e identifica TUTTI i sintomi visibili e le possibili malattie.

IMPORTANTE: Se vedi macchie, decolorazioni, necrosi, muffe, lesioni o qualsiasi anomalia sulle foglie o altre parti della pianta, DEVI identificarle come segni di malattia.

Fornisci una diagnosi dettagliata in formato JSON con le seguenti informazioni:

{
  "species": "Nome scientifico e comune della specie identificata",
  "healthStatus": "diseased" se ci sono QUALSIASI sintomi visibili, altrimenti "healthy",
  "confidence": numero da 0.6 a 0.95 (sii conservativo ma accurato),
  "diseases": [
    {
      "name": "Nome specifico della malattia (es. Oidio, Peronospora, Antracnosi, ecc.)",
      "confidence": numero da 0.6 a 0.95,
      "severity": "low", "medium" o "high" basato su estensione dei sintomi,
      "symptoms": ["descrivi ESATTAMENTE cosa vedi: colore macchie, forma, posizione, etc."],
      "causes": ["agente patogeno specifico: fungo, batterio, virus, carenza nutrizionale"],
      "treatment": "Trattamento specifico e dettagliato per questa malattia"
    }
  ],
  "symptoms": ["TUTTI i sintomi visibili nell'immagine con dettagli precisi"],
  "recommendations": ["raccomandazioni specifiche basate sui sintomi osservati"],
  "urgency": "high" se ci sono molti sintomi gravi, "medium" se sintomi moderati, "low" se sintomi lievi
}

ESEMPI DI SINTOMI DA IDENTIFICARE:
- Macchie bianche/grigiastre = Oidio (Powdery Mildew)
- Macchie gialle con margini scuri = Peronospora 
- Macchie brune circolari = Antracnosi
- Ingiallimento foglie = Carenze nutrizionali o virosi
- Macchie nere = Fumaggine o malattie batteriche
- Foglie arricciate = Virus o afidi
- Necrosi margini = Bruciature da fertilizzanti o stress idrico

CONCENTRATI su: macchie fogliari, decolorazioni, muffe, necrosi, deformazioni, presenza di parassiti, appassimenti.`;

    const userPrompt = plantInfo 
      ? `Analizza questa pianta (${plantInfo.name || 'specie da identificare'}) per malattie o problemi di salute. 
         ${plantInfo.symptoms ? `Sintomi riferiti dal proprietario: ${plantInfo.symptoms}` : ''}
         
         OSSERVA ATTENTAMENTE ogni foglia, stelo e parte visibile della pianta. 
         Se vedi QUALSIASI macchia, decolorazione o anomalia, identifica la possibile malattia.
         NON dire che è sana se ci sono sintomi visibili.`
      : `Analizza questa pianta per identificare specie e TUTTE le malattie o problemi di salute visibili.
         ESAMINA ogni dettaglio dell'immagine per sintomi di malattie.
         Se vedi macchie, muffe, decolorazioni o anomalie, identifica la malattia specifica.`;

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
        max_tokens: 2000,
        temperature: 0.1 // Più deterministica per diagnosi accurate
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Errore OpenAI API:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: `OpenAI API non disponibile (${response.status})`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});