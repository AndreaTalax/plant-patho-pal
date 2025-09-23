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
      
      // 1. Prova prima con endpoint classico delle occorrenze
      let occurrenceData: any = { count: 0, facets: [] }
      const basicOccurrenceUrl = `${GBIF_BASE_URL}/occurrence/search?taxon_key=${speciesKey}&facet=country&limit=0`
      console.log(`📡 GBIF: Trying basic occurrence search: ${basicOccurrenceUrl}`)
      
      try {
        const basicResponse = await fetch(basicOccurrenceUrl)
        if (basicResponse.ok) {
          const basicData = await basicResponse.json()
          console.log(`📊 GBIF: Basic search found ${basicData.count || 0} occurrences`)
          if (basicData.facets && basicData.facets.length > 0) {
            occurrenceData = basicData
          }
        }
      } catch (error) {
        console.warn('Basic occurrence search failed:', error)
      }
      
      // 2. Se non funziona, prova con parametri estesi 
      if (!occurrenceData.facets || occurrenceData.facets.length === 0) {
        const extendedUrl = `${GBIF_BASE_URL}/occurrence/search?taxon_key=${speciesKey}&facet=country&facet=publishingCountry&limit=100`
        console.log(`📡 GBIF: Trying extended search: ${extendedUrl}`)
        
        try {
          const extendedResponse = await fetch(extendedUrl)
          if (extendedResponse.ok) {
            const extendedData = await extendedResponse.json()
            console.log(`📊 GBIF: Extended search found ${extendedData.count || 0} occurrences`)
            if (extendedData.facets && extendedData.facets.length > 0) {
              occurrenceData = extendedData
            }
          }
        } catch (error) {
          console.warn('Extended occurrence search failed:', error)
        }
      }
      
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
      
      // 3. Se non ci sono dati specifici, prova a cercare il genere E anche altri approcci
      if ((!occurrenceData.facets || occurrenceData.facets.length === 0) && !distributionData?.results?.length) {
        console.log('🔄 GBIF: No specific data found, trying alternative approaches')
        console.log(`🧬 GBIF: Scientific name provided: ${scientificName}`)
        
        if (scientificName) {
          // Prova 1: Cerca con il nome completo senza parametri extra
          const fullNameUrl = `${GBIF_BASE_URL}/occurrence/search?scientificName=${encodeURIComponent(scientificName)}&limit=0&facet=country`
          console.log(`🔍 GBIF: Trying full name search: ${fullNameUrl}`)
          
          try {
            const fullNameResponse = await fetch(fullNameUrl)
            if (fullNameResponse.ok) {
              const fullNameData = await fullNameResponse.json()
              console.log(`📊 GBIF: Full name search found ${fullNameData.count || 0} occurrences`)
              
              if (fullNameData.facets && fullNameData.facets.length > 0) {
                occurrenceData.facets = fullNameData.facets
                occurrenceData.count = fullNameData.count
                console.log(`✅ GBIF: Using full name search results`)
              }
            }
          } catch (error) {
            console.warn('GBIF full name search failed:', error)
          }
          
          // Prova 2: Se ancora niente, cerca solo il genere
          if ((!occurrenceData.facets || occurrenceData.facets.length === 0)) {
            const genus = scientificName.split(' ')[0]
            console.log(`🌿 GBIF: Trying genus search for: ${genus}`)
            const genusUrl = `${GBIF_BASE_URL}/species/search?q=${encodeURIComponent(genus)}&limit=5`
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
                      console.log(`✅ GBIF: Using genus-level results`)
                    }
                  }
                }
              }
            } catch (error) {
              console.warn('GBIF genus search failed:', error)
            }
          }
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