import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, scientificName } = await req.json()

    if (action === 'getPlantInfo') {
      // Plantarium API endpoint - utilizzando il servizio open source
      const plantariumUrl = `https://www.plantarium.ru/api/plants/search?name=${encodeURIComponent(scientificName)}&format=json&lang=en`
      
      console.log(`Searching Plantarium for: ${scientificName}`)
      
      const plantariumResponse = await fetch(plantariumUrl, {
        headers: {
          'User-Agent': 'Plant-Identification-App/1.0'
        }
      })
      
      if (!plantariumResponse.ok) {
        // Se Plantarium non risponde, proviamo con un approccio alternativo
        // usando Wikipedia API come fallback
        return await searchWikipediaFallback(scientificName)
      }
      
      const plantariumData = await plantariumResponse.json()
      
      if (!plantariumData.plants || plantariumData.plants.length === 0) {
        // Fallback a Wikipedia se non troviamo nulla su Plantarium
        return await searchWikipediaFallback(scientificName)
      }
      
      // Prendi il primo risultato più rilevante
      const plant = plantariumData.plants[0]
      
      const plantInfo = {
        scientificName: plant.scientific_name || scientificName,
        commonName: plant.common_name,
        family: plant.family,
        genus: plant.genus,
        species: plant.species,
        description: plant.description,
        morphology: plant.morphology,
        habitat: plant.habitat,
        distribution: plant.distribution,
        characteristics: plant.characteristics,
        imageUrl: plant.image_url
      }
      
      return new Response(
        JSON.stringify(plantInfo),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )

  } catch (error) {
    console.error('Plantarium proxy error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

// Funzione fallback che usa Wikipedia per ottenere informazioni enciclopediche
async function searchWikipediaFallback(scientificName: string) {
  try {
    console.log(`Using Wikipedia fallback for: ${scientificName}`)
    
    // Cerca su Wikipedia in italiano
    const searchUrl = `https://it.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(scientificName)}`
    
    const wikiResponse = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Plant-Identification-App/1.0'
      }
    })
    
    if (!wikiResponse.ok) {
      throw new Error('Wikipedia search failed')
    }
    
    const wikiData = await wikiResponse.json()
    
    const plantInfo = {
      scientificName: scientificName,
      commonName: wikiData.displaytitle !== scientificName ? wikiData.displaytitle : undefined,
      description: wikiData.extract || 'Informazioni enciclopediche non disponibili.',
      characteristics: wikiData.extract ? `Estratto da Wikipedia: ${wikiData.extract}` : undefined,
      imageUrl: wikiData.thumbnail?.source
    }
    
    return new Response(
      JSON.stringify(plantInfo),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
    
  } catch (error) {
    console.error('Wikipedia fallback error:', error)
    
    // Ultimo fallback con informazioni generiche
    const plantInfo = {
      scientificName: scientificName,
      description: 'Informazioni enciclopediche non disponibili per questa specie. La pianta è stata identificata ma non sono disponibili dati dettagliati nei database consultati.',
      characteristics: 'Per informazioni più dettagliate, si consiglia di consultare fonti botaniche specializzate o contattare un esperto.'
    }
    
    return new Response(
      JSON.stringify(plantInfo),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  }
}