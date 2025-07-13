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
    const { plantName } = await req.json()
    
    if (!plantName) {
      return new Response(
        JSON.stringify({ error: 'Plant name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🌿 EPPO search for plant:', plantName)

    const eppoApiKey = Deno.env.get('EPPO_API_KEY')
    
    if (!eppoApiKey) {
      console.log('⚠️ EPPO_API_KEY not found, using fallback results')
      
      // Fallback results when API key is not available
      const fallbackResult = {
        pests: [],
        plants: [{
          code: 'PLANT_001',
          name: plantName,
          fullname: `${plantName} (identificazione locale)`,
          scientificname: plantName
        }],
        diseases: [],
        searchTerm: plantName,
        source: 'fallback'
      }
      
      return new Response(JSON.stringify(fallbackResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const headers = {
      'Authorization': `Bearer ${eppoApiKey}`,
      'Content-Type': 'application/json'
    }

    console.log('📡 Making EPPO API calls...')
    
    const searchQueries = [
      { type: 'pests', url: `https://data.eppo.int/api/rest/1.0/tools/search?kw=${encodeURIComponent(plantName)}&searchfor=pests` },
      { type: 'plants', url: `https://data.eppo.int/api/rest/1.0/tools/search?kw=${encodeURIComponent(plantName)}&searchfor=plants` },
      { type: 'diseases', url: `https://data.eppo.int/api/rest/1.0/tools/search?kw=${encodeURIComponent(plantName)}&searchfor=diseases` }
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
      source: 'eppo_api'
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
    console.error('❌ Error in EPPO search:', error)
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