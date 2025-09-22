import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, scientificName, speciesKey } = await req.json()

    const GBIF_BASE_URL = 'https://api.gbif.org/v1'

    if (action === 'searchSpecies') {
      // Cerca la specie nel registry GBIF
      const searchUrl = `${GBIF_BASE_URL}/species/search?q=${encodeURIComponent(scientificName)}&limit=5`
      const searchResponse = await fetch(searchUrl)
      
      if (!searchResponse.ok) {
        throw new Error(`GBIF search failed: ${searchResponse.status}`)
      }
      
      const searchData = await searchResponse.json()
      
      return new Response(
        JSON.stringify(searchData),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'getDistribution' && speciesKey) {
      // Ottieni le occorrenze per paese
      const occurrenceUrl = `${GBIF_BASE_URL}/occurrence/search?taxon_key=${speciesKey}&facet=country&limit=0`
      const occurrenceResponse = await fetch(occurrenceUrl)
      
      if (!occurrenceResponse.ok) {
        throw new Error(`GBIF occurrence search failed: ${occurrenceResponse.status}`)
      }
      
      const occurrenceData = await occurrenceResponse.json()
      
      // Ottieni informazioni dettagliate sulla distribuzione
      const distributionUrl = `${GBIF_BASE_URL}/species/${speciesKey}/distributions`
      let distributionData = null
      
      try {
        const distributionResponse = await fetch(distributionUrl)
        if (distributionResponse.ok) {
          distributionData = await distributionResponse.json()
        }
      } catch (error) {
        console.warn('GBIF distribution details not available:', error)
      }
      
      return new Response(
        JSON.stringify({
          occurrence: occurrenceData,
          distribution: distributionData
        }),
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
    console.error('GBIF proxy error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})