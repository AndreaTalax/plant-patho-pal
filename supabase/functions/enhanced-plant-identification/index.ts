import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const plantIdApiKey = Deno.env.get('PLANT_ID_API_KEY');
const plantNetKey = Deno.env.get('PLANT_NET_KEY') || Deno.env.get('PLANTNET');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    console.log('🔍 Avvio identificazione pianta avanzata...');
    
    if (!imageBase64) {
      throw new Error('Immagine mancante');
    }

    // Risultato consolidato che combina tutte le API
    const identificationResult = {
      identifications: [],
      consensus: {
        mostProbabile: null,
        confidenza: 0,
        fonti: []
      },
      dettagliTecnici: {
        famiglia: '',
        genere: '',
        specie: '',
        nomeComune: '',
        nomiAlternativi: [],
        caratteristiche: [],
        distribuzione: '',
        habitat: ''
      },
      informazioniCura: {
        irrigazione: '',
        luce: '',
        terreno: '',
        temperatura: '',
        umidita: '',
        fertilizzazione: '',
        rinvaso: '',
        potatura: ''
      },
      curiosita: [],
      identificazioneSuccesso: false
    };

    const apiResults = await Promise.allSettled([
      callPlantNetAPI(imageBase64),
      callPlantIdAPI(imageBase64), 
      callOpenAIVision(imageBase64)
    ]);

    console.log('📊 Risultati API:', apiResults.map((r, i) => 
      r.status === 'fulfilled' ? `API ${i+1}: success` : `API ${i+1}: ${r.reason}`
    ));

    // Elabora risultati PlantNet
    if (apiResults[0].status === 'fulfilled' && apiResults[0].value) {
      const plantNetResult = apiResults[0].value;
      if (plantNetResult.results && plantNetResult.results.length > 0) {
        const topMatch = plantNetResult.results[0];
        identificationResult.identifications.push({
          nomeComune: topMatch.species?.commonNames?.[0] || 'Nome non disponibile',
          nomeScientifico: topMatch.species?.scientificNameWithoutAuthor || topMatch.gbif?.scientificName || 'Non identificato',
          confidenza: Math.round((topMatch.score || 0) * 100),
          fonte: 'PlantNet (Database botanico globale)',
          famiglia: topMatch.species?.family?.scientificNameWithoutAuthor || '',
          genere: topMatch.species?.genus?.scientificNameWithoutAuthor || ''
        });
      }
    }

    // Elabora risultati Plant.ID
    if (apiResults[1].status === 'fulfilled' && apiResults[1].value) {
      const plantIdResult = apiResults[1].value;
      if (plantIdResult.suggestions && plantIdResult.suggestions.length > 0) {
        const suggestion = plantIdResult.suggestions[0];
        identificationResult.identifications.push({
          nomeComune: suggestion.plant_name || 'Nome non disponibile',
          nomeScientifico: suggestion.plant_details?.scientific_name || 'Non identificato',
          confidenza: Math.round((suggestion.probability || 0) * 100),
          fonte: 'Plant.ID (AI specializzata)',
          informazioniExtra: {
            strutture: suggestion.plant_details?.structured_name,
            sinonimi: suggestion.plant_details?.synonyms
          }
        });
      }
    }

    // Elabora risultati OpenAI Vision
    if (apiResults[2].status === 'fulfilled' && apiResults[2].value) {
      const openAIResult = apiResults[2].value;
      if (openAIResult.plantInfo) {
        identificationResult.identifications.push({
          nomeComune: openAIResult.plantInfo.nomeComune || 'Identificazione AI',
          nomeScientifico: openAIResult.plantInfo.nomeScientifico || 'Analisi visuale',
          confidenza: openAIResult.plantInfo.confidenza || 75,
          fonte: 'OpenAI Vision (Analisi visuale AI)',
          descrizione: openAIResult.plantInfo.descrizione,
          caratteristiche: openAIResult.plantInfo.caratteristiche || []
        });
        
        // OpenAI spesso fornisce informazioni di cura dettagliate
        if (openAIResult.curaConsigli) {
          identificationResult.informazioniCura = {
            ...identificationResult.informazioniCura,
            ...openAIResult.curaConsigli
          };
        }
        
        if (openAIResult.curiosita) {
          identificationResult.curiosita = openAIResult.curiosita;
        }
      }
    }

    // Determina il consenso tra le API
    if (identificationResult.identifications.length > 0) {
      // Ordina per confidenza
      identificationResult.identifications.sort((a, b) => b.confidenza - a.confidenza);
      
      const topIdentification = identificationResult.identifications[0];
      identificationResult.consensus.mostProbabile = topIdentification;
      identificationResult.consensus.confidenza = topIdentification.confidenza;
      identificationResult.consensus.fonti = identificationResult.identifications.map(id => id.fonte);
      
      // Popola dettagli tecnici dal risultato migliore
      identificationResult.dettagliTecnici.nomeComune = topIdentification.nomeComune;
      identificationResult.dettagliTecnici.famiglia = topIdentification.famiglia || '';
      identificationResult.dettagliTecnici.genere = topIdentification.genere || '';
      
      identificationResult.identificazioneSuccesso = true;
      
      console.log(`✅ Pianta identificata: ${topIdentification.nomeComune} (${topIdentification.confidenza}%)`);
    } else {
      console.log('❌ Nessuna identificazione riuscita');
      // Fallback per quando nessuna API riesce
      identificationResult.consensus.mostProbabile = {
        nomeComune: 'Pianta non identificata',
        nomeScientifico: 'Specie indeterminata',
        confidenza: 0,
        fonte: 'Sistema di fallback',
        descrizione: 'Non è stato possibile identificare con certezza questa pianta. Si consiglia di consultare un esperto botanico.'
      };
    }

    return new Response(JSON.stringify({
      success: true,
      identificazione: identificationResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Errore identificazione pianta:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      identificazione: {
        identificazioneSuccesso: false,
        consensus: {
          mostProbabile: {
            nomeComune: 'Errore identificazione',
            nomeScientifico: 'Non disponibile',
            confidenza: 0,
            fonte: 'Sistema',
            descrizione: 'Si è verificato un errore durante l\'identificazione. Riprovare.'
          }
        }
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// PlantNet API call
async function callPlantNetAPI(imageBase64: string) {
  if (!plantNetKey) {
    console.log('⚠️ PlantNet API key mancante');
    return null;
  }

  try {
    console.log('🌐 Chiamata PlantNet API...');
    
    const base64Data = imageBase64.split(',')[1];
    const formData = new FormData();
    
    // Convert base64 to blob
    const response = await fetch(imageBase64);
    const blob = await response.blob();
    formData.append('images', blob);
    formData.append('organs', 'leaf');
    formData.append('include-related-images', 'false');
    
    const plantNetResponse = await fetch(
      `https://my-api.plantnet.org/v1/identify/weurope?api-key=${plantNetKey}`, 
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!plantNetResponse.ok) {
      console.log('❌ PlantNet API error:', plantNetResponse.status);
      return null;
    }

    const result = await plantNetResponse.json();
    console.log('✅ PlantNet risposta ricevuta');
    return result;
    
  } catch (error) {
    console.error('❌ Errore PlantNet:', error);
    return null;
  }
}

// Plant.ID API call
async function callPlantIdAPI(imageBase64: string) {
  if (!plantIdApiKey) {
    console.log('⚠️ Plant.ID API key mancante');
    return null;
  }

  try {
    console.log('🔬 Chiamata Plant.ID API...');
    
    const response = await fetch('https://api.plant.id/v3/identification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': plantIdApiKey
      },
      body: JSON.stringify({
        images: [imageBase64],
        similar_images: true,
        plant_details: ["common_names", "synonyms"],
      })
    });

    if (!response.ok) {
      console.log('❌ Plant.ID API error:', response.status);
      return null;
    }

    const result = await response.json();
    console.log('✅ Plant.ID risposta ricevuta');
    return result;
    
  } catch (error) {
    console.error('❌ Errore Plant.ID:', error);
    return null;
  }
}

// OpenAI Vision call con prompt specializzato per identificazione piante
async function callOpenAIVision(imageBase64: string) {
  if (!openaiApiKey) {
    console.log('⚠️ OpenAI API key mancante');
    return null;
  }

  try {
    console.log('🤖 Chiamata OpenAI Vision...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `Sei un botanico esperto. Analizza l'immagine e identifica la pianta nel modo più accurato possibile. 

Fornisci una risposta JSON con questa struttura:
{
  "plantInfo": {
    "nomeComune": "nome comune in italiano",
    "nomeScientifico": "nome scientifico completo",
    "famiglia": "famiglia botanica",
    "genere": "genere",
    "confidenza": numero da 1 a 100,
    "descrizione": "breve descrizione della pianta",
    "caratteristiche": ["caratteristica1", "caratteristica2"]
  },
  "curaConsigli": {
    "irrigazione": "consigli irrigazione",
    "luce": "requisiti di luce",
    "terreno": "tipo di terreno",
    "temperatura": "temperatura ideale"
  },
  "curiosita": ["fatto interessante 1", "fatto interessante 2"]
}

Sii molto preciso nell'identificazione e indica sempre il livello di confidenza realistico.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Identifica questa pianta con il massimo dettaglio possibile'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
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
      console.log('❌ OpenAI API error:', response.status);
      return null;
    }

    const result = await response.json();
    console.log('✅ OpenAI Vision risposta ricevuta');
    
    try {
      const content = result.choices[0].message.content;
      return JSON.parse(content);
    } catch (parseError) {
      console.error('❌ Errore parsing OpenAI response:', parseError);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Errore OpenAI Vision:', error);
    return null;
  }
}