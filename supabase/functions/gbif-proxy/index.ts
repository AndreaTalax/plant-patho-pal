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
      console.log(`🔍 GBIF: Searching distribution for species key ${speciesKey}`)
      
      // Prova multiple strategie per ottenere dati di distribuzione
      
      // 1. Occorrenze per paese con più risultati
      const occurrenceUrl = `${GBIF_BASE_URL}/occurrence/search?taxon_key=${speciesKey}&facet=country&limit=50`
      console.log(`📡 GBIF: Fetching occurrences from ${occurrenceUrl}`)
      
      const occurrenceResponse = await fetch(occurrenceUrl)
      
      if (!occurrenceResponse.ok) {
        throw new Error(`GBIF occurrence search failed: ${occurrenceResponse.status}`)
      }
      
      const occurrenceData = await occurrenceResponse.json()
      console.log(`📊 GBIF: Found ${occurrenceData.count || 0} total occurrences`)
      
      // 2. Distribuzione dettagliata dalla specie
      const distributionUrl = `${GBIF_BASE_URL}/species/${speciesKey}/distributions`
      let distributionData = null
      
      try {
        console.log(`🗺️ GBIF: Fetching distribution from ${distributionUrl}`)
        const distributionResponse = await fetch(distributionUrl)
        if (distributionResponse.ok) {
          distributionData = await distributionResponse.json()
          console.log(`📍 GBIF: Found ${distributionData?.results?.length || 0} distribution records`)
        } else {
          console.warn(`⚠️ GBIF: Distribution endpoint failed with status ${distributionResponse.status}`)
        }
      } catch (error) {
        console.warn('GBIF distribution details not available:', error)
      }
      
      // 3. Se non ci sono dati specifici, prova a cercare il genere
      if ((!occurrenceData.facets || occurrenceData.facets.length === 0) && !distributionData?.results?.length) {
        console.log('🔄 GBIF: No specific data found, trying genus-level search')
        
        // Estrai il genere dal nome scientifico (prima parola)
        const genusUrl = `${GBIF_BASE_URL}/species/search?q=${encodeURIComponent(scientificName.split(' ')[0])}&limit=5`
        try {
          const genusResponse = await fetch(genusUrl)
          if (genusResponse.ok) {
            const genusData = await genusResponse.json()
            if (genusData.results && genusData.results.length > 0) {
              const genusKey = genusData.results[0].key
              const genusOccurrenceUrl = `${GBIF_BASE_URL}/occurrence/search?taxon_key=${genusKey}&facet=country&limit=20`
              const genusOccurrenceResponse = await fetch(genusOccurrenceUrl)
              if (genusOccurrenceResponse.ok) {
                const genusOccurrenceData = await genusOccurrenceResponse.json()
                console.log(`🌿 GBIF: Found ${genusOccurrenceData.count || 0} genus-level occurrences`)
                
                // Unisci i dati se il genere ha più informazioni
                if (genusOccurrenceData.facets && genusOccurrenceData.facets.length > 0) {
                  occurrenceData.facets = genusOccurrenceData.facets
                  occurrenceData.count = genusOccurrenceData.count
                }
              }
            }
          }
        } catch (error) {
          console.warn('GBIF genus search failed:', error)
        }
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