import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const GBIF_BASE_URL = 'https://api.gbif.org/v1'

// 🔎 Funzione helper con fallback COUNTRY → GADM_GID
async function fetchOccurrenceWithFallback(speciesKey: string) {
  const facetsToTry = ["COUNTRY", "GADM_GID"]

  for (const facet of facetsToTry) {
    const occurrenceUrl = `${GBIF_BASE_URL}/occurrence/search?taxon_key=${speciesKey}&facet=${facet}&facetLimit=200&limit=0`
    console.log(`📡 GBIF: Fetching occurrence data with facet=${facet} → ${occurrenceUrl}`)

    try {
      const response = await fetch(occurrenceUrl)
      if (response.ok) {
        const data = await response.json()
        const facetData = data.facets?.find((f: any) => f.field === facet)

        if (facetData?.counts?.length) {
          console.log(`✅ GBIF: Found ${facetData.counts.length} results using facet=${facet}`)
          return { ...data, usedFacet: facet }
        } else {
          console.log(`ℹ️ GBIF: No results with facet=${facet}, trying next...`)
        }
      } else {
        console.warn(`⚠️ GBIF: Occurrence request failed with status ${response.status}`)
      }
    } catch (err) {
      console.warn(`⚠️ GBIF occurrence fetch error with facet=${facet}:`, err)
    }
  }

  console.warn("⚠️ GBIF: Nessun facet valido trovato")
  return { count: 0, facets: [], usedFacet: null }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, scientificName, speciesKey } = await req.json()
    console.log(`🔍 GBIF: Received request - action: ${action}, scientificName: ${scientificName}, speciesKey: ${speciesKey}`)

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

      // 2. Occorrenze aggregate con fallback facet
      const occurrenceData = await fetchOccurrenceWithFallback(speciesKey)

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
