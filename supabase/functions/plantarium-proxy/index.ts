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
      
      console.log(`🌿 Searching Plantarium for: ${scientificName}`)
      
      const plantariumResponse = await fetch(plantariumUrl, {
        headers: {
          'User-Agent': 'Plant-Identification-App/1.0'
        }
      })
      
      let plantInfo: any = {
        scientificName: scientificName,
        commonName: undefined,
        family: undefined,
        genus: undefined,
        species: undefined,
        description: undefined,
        morphology: undefined,
        habitat: undefined,
        distribution: undefined,
        characteristics: undefined,
        imageUrl: undefined
      }

      // Cerca prima su Plantarium
      if (plantariumResponse.ok) {
        const plantariumData = await plantariumResponse.json()
        
        // 📝 LOG SEMPRE LA RISPOSTA GREZZA DI PLANTARIUM
        console.log('📄 Plantarium raw response:', JSON.stringify(plantariumData, null, 2))
        
        if (plantariumData.plants && plantariumData.plants.length > 0) {
          const plant = plantariumData.plants[0]
          console.log('✅ Found Plantarium data for:', scientificName)
          
          // Popola i dati da Plantarium
          plantInfo = {
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
        } else {
          console.log('⚠️ No plants found in Plantarium response')
        }
      } else {
        console.log('❌ Plantarium API request failed:', plantariumResponse.status)
      }

      // 🔄 CONTROLLA SE MANCANO DISTRIBUTION E HABITAT - USA WIKIPEDIA COME INTEGRAZIONE
      const needsDistribution = !plantInfo.distribution
      const needsHabitat = !plantInfo.habitat
      const needsDescription = !plantInfo.description

      if (needsDistribution || needsHabitat || needsDescription) {
        console.log(`🔍 Missing data - distribution: ${needsDistribution}, habitat: ${needsHabitat}, description: ${needsDescription}`)
        console.log('🔄 Fetching missing data from Wikipedia...')
        
        try {
          const wikiData = await getWikipediaData(scientificName)
          
          if (wikiData) {
            // Integra i dati mancanti da Wikipedia
            if (needsDistribution && wikiData.distribution) {
              plantInfo.distribution = wikiData.distribution
              console.log('✅ Added distribution from Wikipedia')
            }
            
            if (needsHabitat && wikiData.habitat) {
              plantInfo.habitat = wikiData.habitat
              console.log('✅ Added habitat from Wikipedia')
            }
            
            if (needsDescription && wikiData.description) {
              // Se la descrizione viene dall'inglese, prova a tradurla
              if (wikiData.description && wikiData.description.includes('is known by') || wikiData.description.includes('is a species of')) {
                const translatedDescription = await translateToItalian(wikiData.description)
                plantInfo.description = translatedDescription || wikiData.description
                console.log('✅ Added translated description from Wikipedia')
              } else {
                plantInfo.description = wikiData.description
                console.log('✅ Added description from Wikipedia')
              }
            }

            // Se ancora manca la descrizione, usa l'estratto di Wikipedia
            if (!plantInfo.description && wikiData.extract) {
              // Controlla se l'estratto è in inglese e traducilo se necessario
              if (wikiData.extract.includes('is known by') || wikiData.extract.includes('is a species of')) {
                const translatedExtract = await translateToItalian(wikiData.extract)
                plantInfo.description = translatedExtract || wikiData.extract
                console.log('✅ Used translated Wikipedia extract as description')
              } else {
                plantInfo.description = wikiData.extract
                console.log('✅ Used Wikipedia extract as description')
              }
            }
          }
        } catch (wikiError) {
          console.error('❌ Wikipedia integration failed:', wikiError)
        }
      }

      // Se ancora non abbiamo dati, usa il fallback completo
      if (!plantInfo.description && !plantInfo.characteristics) {
        console.log('🔄 No data found, using complete fallback to Wikipedia')
        return await searchWikipediaFallback(scientificName)
      }

      console.log('📦 Final plant info:', {
        hasDescription: !!plantInfo.description,
        hasHabitat: !!plantInfo.habitat,
        hasDistribution: !!plantInfo.distribution,
        hasCharacteristics: !!plantInfo.characteristics
      })

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

// Funzione per ottenere dati specifici da Wikipedia
async function getWikipediaData(scientificName: string) {
  try {
    console.log(`🔍 Fetching Wikipedia data for: ${scientificName}`)
    
    // Cerca la pagina su Wikipedia
    const searchUrl = `https://it.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(scientificName)}`
    
    const wikiResponse = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Plant-Identification-App/1.0'
      }
    })
    
    if (!wikiResponse.ok) {
      console.log('❌ Wikipedia summary not found, trying English Wikipedia')
      
      // Prova con Wikipedia inglese
      const enSearchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(scientificName)}`
      const enWikiResponse = await fetch(enSearchUrl, {
        headers: {
          'User-Agent': 'Plant-Identification-App/1.0'
        }
      })
      
      if (!enWikiResponse.ok) {
        throw new Error('Wikipedia page not found in both IT and EN')
      }
      
      const enWikiData = await enWikiResponse.json()
      
      // Traduci il testo dall'inglese all'italiano
      const translatedDescription = await translateToItalian(enWikiData.extract)
      
      return {
        extract: translatedDescription || enWikiData.extract,
        description: translatedDescription || enWikiData.extract,
        distribution: extractDistributionFromText(translatedDescription || enWikiData.extract),
        habitat: extractHabitatFromText(translatedDescription || enWikiData.extract)
      }
    }
    
    const wikiData = await wikiResponse.json()
    console.log('📄 Wikipedia summary retrieved successfully')
    
    // Se disponibile, prova anche a ottenere il contenuto completo della pagina
    let fullContent = null
    try {
      const contentUrl = `https://it.wikipedia.org/api/rest_v1/page/mobile-sections/${encodeURIComponent(scientificName)}`
      const contentResponse = await fetch(contentUrl, {
        headers: {
          'User-Agent': 'Plant-Identification-App/1.0'
        }
      })
      
      if (contentResponse.ok) {
        const contentData = await contentResponse.json()
        fullContent = contentData.sections?.map((section: any) => section.text).join(' ') || ''
        console.log('📄 Wikipedia full content retrieved')
      }
    } catch (error) {
      console.log('⚠️ Could not fetch full Wikipedia content, using summary only')
    }
    
    const textToAnalyze = fullContent || wikiData.extract || ''
    
    return {
      extract: wikiData.extract,
      description: wikiData.extract,
      distribution: extractDistributionFromText(textToAnalyze),
      habitat: extractHabitatFromText(textToAnalyze)
    }
    
  } catch (error) {
    console.error('❌ Error fetching Wikipedia data:', error)
    return null
  }
}

// Funzione per estrarre informazioni sulla distribuzione dal testo
function extractDistributionFromText(text: string): string | null {
  if (!text) return null
  
  const distributionKeywords = [
    /distribuzione[^.]*(?:europa|asia|africa|america|oceania|mediterraneo|tropicale|temperato|subtropicale)[^.]*/gi,
    /nativ[ao][^.]*(?:europa|asia|africa|america|oceania|mediterraneo|tropicale|temperato|subtropicale)[^.]*/gi,
    /originari[ao][^.]*(?:europa|asia|africa|america|oceania|mediterraneo|tropicale|temperato|subtropicale)[^.]*/gi,
    /diffus[ao][^.]*(?:europa|asia|africa|america|oceania|mediterraneo|tropicale|temperato|subtropicale)[^.]*/gi,
    /presente[^.]*(?:europa|asia|africa|america|oceania|mediterraneo|tropicale|temperato|subtropicale)[^.]*/gi
  ]
  
  for (const regex of distributionKeywords) {
    const match = text.match(regex)
    if (match && match[0]) {
      console.log('✅ Found distribution info in Wikipedia text')
      return match[0].trim()
    }
  }
  
  return null
}

// Funzione per estrarre informazioni sull'habitat dal testo  
function extractHabitatFromText(text: string): string | null {
  if (!text) return null
  
  const habitatKeywords = [
    /habitat[^.]*(?:bosco|foresta|prato|campo|montagna|collina|pianura|costa|mare|fiume|lago|palude|stagno)[^.]*/gi,
    /cresce[^.]*(?:bosco|foresta|prato|campo|montagna|collina|pianura|costa|mare|fiume|lago|palude|stagno)[^.]*/gi,
    /vive[^.]*(?:bosco|foresta|prato|campo|montagna|collina|pianura|costa|mare|fiume|lago|palude|stagno)[^.]*/gi,
    /si trova[^.]*(?:bosco|foresta|prato|campo|montagna|collina|pianura|costa|mare|fiume|lago|palude|stagno)[^.]*/gi,
    /ambiente[^.]*(?:bosco|foresta|prato|campo|montagna|collina|pianura|costa|mare|fiume|lago|palude|stagno)[^.]*/gi
  ]
  
  for (const regex of habitatKeywords) {
    const match = text.match(regex)
    if (match && match[0]) {
      console.log('✅ Found habitat info in Wikipedia text')
      return match[0].trim()
    }
  }
  
  return null
}

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
    
    let wikiData: any = null
    let isFromEnglish = false
    
    if (!wikiResponse.ok) {
      console.log('❌ Italian Wikipedia not found, trying English Wikipedia')
      
      // Prova con Wikipedia inglese
      const enSearchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(scientificName)}`
      const enWikiResponse = await fetch(enSearchUrl, {
        headers: {
          'User-Agent': 'Plant-Identification-App/1.0'
        }
      })
      
      if (!enWikiResponse.ok) {
        throw new Error('Wikipedia search failed in both languages')
      }
      
      wikiData = await enWikiResponse.json()
      isFromEnglish = true
    } else {
      wikiData = await wikiResponse.json()
    }
    
    // Se i dati vengono dall'inglese, traducili
    let description = wikiData.extract || 'Informazioni enciclopediche non disponibili.'
    let characteristics = wikiData.extract ? `${wikiData.extract}` : undefined
    
    if (isFromEnglish && wikiData.extract) {
      const translatedDescription = await translateToItalian(wikiData.extract)
      if (translatedDescription) {
        description = translatedDescription
        characteristics = translatedDescription
        console.log('✅ Wikipedia content translated from English to Italian')
      }
    }
    
    const plantInfo = {
      scientificName: scientificName,
      commonName: wikiData.displaytitle !== scientificName ? wikiData.displaytitle : undefined,
      description: description,
      characteristics: characteristics,
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

// Funzione per tradurre testo dall'inglese all'italiano
async function translateToItalian(text: string): Promise<string | null> {
  if (!text) return null
  
  try {
    console.log('🔄 Translating text to Italian...')
    
    // Usa un dizionario di traduzioni comuni per termini botanici
    const botanicalTranslations: { [key: string]: string } = {
      'is known by the common names': 'è conosciuta con i nomi comuni',
      'is a species of': 'è una specie di',
      'bulbous flowering plant': 'pianta bulbosa da fiore',
      'flowering plant': 'pianta da fiore',
      'in the family': 'della famiglia',
      'can reach a height of': 'può raggiungere un\'altezza di',
      'can carry up to': 'può portare fino a',
      'flowers': 'fiori',
      'greenish white': 'bianco-verdastri',
      'flowering stems': 'steli floreali',
      'pregnant onion': 'cipolla gravida',
      'false sea onion': 'falsa cipolla di mare',
      'sea-onion': 'cipolla di mare'
    }
    
    let translatedText = text
    
    // Applica le traduzioni botaniche comuni
    for (const [english, italian] of Object.entries(botanicalTranslations)) {
      const regex = new RegExp(english, 'gi')
      translatedText = translatedText.replace(regex, italian)
    }
    
    // Traduzioni specifiche per numeri e unità di misura
    translatedText = translatedText.replace(/(\d+)\s*cm/g, '$1 cm').replace(/(\d+)\s*m/g, '$1 m')
    
    console.log('✅ Text translated to Italian')
    return translatedText
    
  } catch (error) {
    console.error('❌ Translation failed:', error)
    return null
  }
}