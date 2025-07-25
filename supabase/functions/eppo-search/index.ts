import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { plantName, eppoCode, action } = await req.json()
    
    const eppoAuthToken = Deno.env.get('EPPO_AUTH_TOKEN')
    
    if (!eppoAuthToken) {
      console.log('⚠️ EPPO_AUTH_TOKEN not found, using fallback results')
      
      const fallbackResult = {
        pests: [],
        plants: plantName ? [{
          code: 'PLANT_001',
          name: plantName,
          fullname: `${plantName} (identificazione locale)`,
          scientificname: plantName
        }] : [],
        diseases: [],
        searchTerm: plantName || eppoCode,
        source: 'fallback'
      }
      
      return new Response(JSON.stringify(fallbackResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const headers = {
      'Content-Type': 'application/json'
    }

    console.log(`🌿 EPPO ${action || 'search'} for:`, plantName || eppoCode)

    // Handle different actions
    if (action === 'getTaxon' && eppoCode) {
      try {
        const url = `https://data.eppo.int/api/rest/1.0/taxon/${eppoCode}?authtoken=${eppoAuthToken}`
        console.log('📡 Getting taxon details from EPPO:', url)
        
        const response = await fetch(url, { headers })
        
        if (!response.ok) {
          console.log('❌ EPPO taxon request failed:', response.status)
          throw new Error(`EPPO API error: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('✅ EPPO taxon details received')
        
        return new Response(JSON.stringify({
          taxon: data,
          source: 'eppo_taxon_api'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
        
      } catch (error) {
        console.error('❌ Error fetching taxon details:', error)
        return new Response(JSON.stringify({ 
          error: error.message,
          source: 'error_fallback'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Default search action
    if (!plantName) {
      return new Response(
        JSON.stringify({ error: 'Plant name is required for search' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const searchQueries = [
      { type: 'pests', url: `https://data.eppo.int/api/rest/1.0/tools/search?kw=${encodeURIComponent(plantName)}&searchfor=pests&authtoken=${eppoAuthToken}` },
      { type: 'plants', url: `https://data.eppo.int/api/rest/1.0/tools/search?kw=${encodeURIComponent(plantName)}&searchfor=plants&authtoken=${eppoAuthToken}` },
      { type: 'diseases', url: `https://data.eppo.int/api/rest/1.0/tools/search?kw=${encodeURIComponent(plantName)}&searchfor=diseases&authtoken=${eppoAuthToken}` }
    ]

    const results = await Promise.allSettled(
      searchQueries.map(async query => {
        try {
          const response = await fetch(query.url, { headers })
          if (!response.ok) {
            console.log(`❌ EPPO ${query.type} search failed:`, response.status)
            return { type: query.type, data: [] }
          }
          const data = await response.json()
          console.log(`✅ EPPO ${query.type} results:`, Array.isArray(data) ? data.length : 'non-array')
          return { type: query.type, data: Array.isArray(data) ? data : [] }
        } catch (error) {
          console.error(`❌ Error fetching ${query.type}:`, error)
          return { type: query.type, data: [] }
        }
      })
    )

    const eppoResult = {
      pests: [],
      plants: [],
      diseases: [],
      searchTerm: plantName,
      source: 'eppo_search_api'
    }

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        const { type, data } = result.value
        eppoResult[type] = data
      }
    })

    console.log('✅ EPPO search completed')
    
    return new Response(JSON.stringify(eppoResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Error in EPPO function:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      pests: [],
      plants: [],
      diseases: [],
      source: 'error_fallback'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})