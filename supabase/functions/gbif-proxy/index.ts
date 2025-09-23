import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, scientificName, speciesKey } = await req.json()
    console.log(`🔍 GBIF: Received request - action: ${action}, scientificName: ${scientificName}, speciesKey: ${speciesKey}`)

    const GBIF_BASE_URL = 'https://api.gbif.org/v1'

    // 🔎 Ricerca specie
    if (action === 'searchSpecies') {
      const searchUrl = `${GBIF_BASE_URL}/species/search?q=${encodeURIComponent(scientificName)}&limit=5`
      console.log(`📡 GBIF: Searching species → ${searchUrl}`)

      const searchResponse = await fetch(searchUrl)
      if (!searchResponse.ok) {
        throw new Error(`GBIF search failed: ${searchResponse.status}`)
      }

      const searchData = await searchResponse.json()
      return new Response(JSON.stringify(searchData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 🗺️ Distribuzione e occorrenze
    if (action === 'getDistribution' && speciesKey) {
      console.log(`🔍 GBIF: Fetching distribution for species key ${speciesKey}`)

      // 1. Distribuzione dettagliata
      const distributionUrl = `${GBIF_BASE_URL}/species/${speciesKey}/distributions`
      let distributionData: any = { results: [] }

      try {
        const distributionResponse = await fetch(distributionUrl)
        if (distributionResponse.ok) {
          distributionData = await distributionResponse.json()
          console.log(`📍 GBIF: Found ${distributionData?.results?.length || 0} distribution records`)
        } else {
          console.warn(`⚠️ GBIF: Distribution request failed with status ${distributionResponse.status}`)
        }
      } catch (err) {
        console.warn('⚠️ GBIF distribution fetch error:', err)
      }

      // 2. Occorrenze aggregate per paese (✅ usa taxonKey)
      const occurrenceUrl = `${GBIF_BASE_URL}/occurrence/search?taxonKey=${speciesKey}&facet=COUNTRY&facetLimit=200&limit=0`
      let occurrenceData: any = { count: 0, facets: [] }

      try {
        console.log(`📡 GBIF: Fetching occurrence data → ${occurrenceUrl}`)
        const occurrenceResponse = await fetch(occurrenceUrl)
        if (occurrenceResponse.ok) {
          occurrenceData = await occurrenceResponse.json()
          console.log(`📊 GBIF: Found ${occurrenceData.count || 0} occurrences`)
        } else {
          console.warn(`⚠️ GBIF: Occurrence request failed with status ${occurrenceResponse.status}`)
        }
      } catch (err) {
        console.warn('⚠️ GBIF occurrence fetch error:', err)
      }

      return new Response(JSON.stringify({
        occurrence: occurrenceData,
        distribution: distributionData,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })

  } catch (error) {
    console.error('❌ GBIF proxy error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
