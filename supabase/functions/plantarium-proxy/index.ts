import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, scientificName } = await req.json();

    if (action === 'getPlantInfo') {
      const plantariumUrl = `https://www.plantarium.ru/api/plants/search?name=${encodeURIComponent(scientificName)}&format=json&lang=en`;

      console.log(`🌿 Searching Plantarium for: ${scientificName}`);

      const plantariumResponse = await fetch(plantariumUrl, {
        headers: { 'User-Agent': 'Plant-Identification-App/1.0' }
      });

      let plantInfo: any = {
        scientificName,
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
      };

      if (plantariumResponse.ok) {
        const plantariumData = await plantariumResponse.json();
        console.log('📄 Plantarium raw response:', JSON.stringify(plantariumData, null, 2));

        if (plantariumData.plants && plantariumData.plants.length > 0) {
          const plant = plantariumData.plants[0];
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
          };
          console.log('✅ Found Plantarium data for:', scientificName);
        } else {
          console.log('⚠️ No plants found in Plantarium response');
        }
      } else {
        console.log('❌ Plantarium API request failed:', plantariumResponse.status);
      }

      // Se mancano dati importanti, integra con Wikipedia
      const needsDistribution = !plantInfo.distribution;
      const needsHabitat = !plantInfo.habitat;
      const needsDescription = !plantInfo.description;

      if (needsDistribution || needsHabitat || needsDescription) {
        console.log(`🔍 Missing data - distribution: ${needsDistribution}, habitat: ${needsHabitat}, description: ${needsDescription}`);
        try {
          const wikiData = await getWikipediaData(scientificName);
          if (wikiData) {
            if (needsDistribution && wikiData.distribution) plantInfo.distribution = wikiData.distribution;
            if (needsHabitat && wikiData.habitat) plantInfo.habitat = wikiData.habitat;
            if (needsDescription && wikiData.description) plantInfo.description = wikiData.description;
            if (!plantInfo.description && wikiData.extract) plantInfo.description = wikiData.extract;
          }
        } catch (wikiError) {
          console.error('❌ Wikipedia integration failed:', wikiError);
        }
      }

      // Fallback completo se ancora non ci sono dati enciclopedici
      if (!plantInfo.description && !plantInfo.characteristics) {
        console.log('🔄 No data found, using complete fallback to Wikipedia');
        return await searchWikipediaFallback(scientificName);
      }

      console.log('📦 Final plant info:', {
        hasDescription: !!plantInfo.description,
        hasHabitat: !!plantInfo.habitat,
        hasDistribution: !!plantInfo.distribution,
        hasCharacteristics: !!plantInfo.characteristics
      });

      return new Response(JSON.stringify(plantInfo), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });

  } catch (error) {
    console.error('Plantarium proxy error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

// --- Funzioni di supporto ---

async function getWikipediaData(scientificName: string) {
  try {
    console.log(`🔍 Fetching Wikipedia data for: ${scientificName}`);
    const searchUrl = `https://it.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(scientificName)}`;
    let wikiResponse = await fetch(searchUrl, { headers: { 'User-Agent': 'Plant-Identification-App/1.0' } });

    if (!wikiResponse.ok) {
      console.log('❌ Italian Wikipedia summary not found, trying English Wikipedia');
      const enSearchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(scientificName)}`;
      wikiResponse = await fetch(enSearchUrl, { headers: { 'User-Agent': 'Plant-Identification-App/1.0' } });
      if (!wikiResponse.ok) throw new Error('Wikipedia page not found in both IT and EN');
    }

    const wikiData = await wikiResponse.json();
    const fullContent = await getWikipediaFullContent(scientificName) || wikiData.extract || '';

    return {
      extract: wikiData.extract,
      description: wikiData.extract,
      distribution: extractDistributionFromText(fullContent),
      habitat: extractHabitatFromText(fullContent)
    };

  } catch (error) {
    console.error('❌ Error fetching Wikipedia data:', error);
    return null;
  }
}

async function getWikipediaFullContent(scientificName: string) {
  try {
    const contentUrl = `https://it.wikipedia.org/api/rest_v1/page/mobile-sections/${encodeURIComponent(scientificName)}`;
    const contentResponse = await fetch(contentUrl, { headers: { 'User-Agent': 'Plant-Identification-App/1.0' } });
    if (!contentResponse.ok) return null;
    const contentData = await contentResponse.json();
    return contentData.sections?.map((section: any) => section.text).join(' ') || '';
  } catch {
    return null;
  }
}

function extractDistributionFromText(text: string): string | null {
  if (!text) return null;
  const regexes = [
    /distribuzione[^.]*(?:europa|asia|africa|america|oceania|mediterraneo|tropicale|temperato|subtropicale)[^.]*/gi,
    /nativ[ao][^.]*(?:europa|asia|africa|america|oceania|mediterraneo|tropicale|temperato|subtropicale)[^.]*/gi,
    /originari[ao][^.]*(?:europa|asia|africa|america|oceania|mediterraneo|tropicale|temperato|subtropicale)[^.]*/gi,
    /diffus[ao][^.]*(?:europa|asia|africa|america|oceania|mediterraneo|tropicale|temperato|subtropicale)[^.]*/gi,
    /presente[^.]*(?:europa|asia|africa|america|oceania|mediterraneo|tropicale|temperato|subtropicale)[^.]*/gi
  ];
  for (const re of regexes) {
    const match = text.match(re);
    if (match) return match[0].trim();
  }
  return null;
}

function extractHabitatFromText(text: string): string | null {
  if (!text) return null;
  const regexes = [
    /habitat[^.]*(?:bosco|foresta|prato|campo|montagna|collina|pianura|costa|mare|fiume|lago|palude|stagno)[^.]*/gi,
    /cresce[^.]*(?:bosco|foresta|prato|campo|montagna|collina|pianura|costa|mare|fiume|lago|palude|stagno)[^.]*/gi,
    /vive[^.]*(?:bosco|foresta|prato|campo|montagna|collina|pianura|costa|mare|fiume|lago|palude|stagno)[^.]*/gi,
    /si trova[^.]*(?:bosco|foresta|prato|campo|montagna|collina|pianura|costa|mare|fiume|lago|palude|stagno)[^.]*/gi,
    /ambiente[^.]*(?:bosco|foresta|prato|campo|montagna|collina|pianura|costa|mare|fiume|lago|palude|stagno)[^.]*/gi
  ];
  for (const re of regexes) {
    const match = text.match(re);
    if (match) return match[0].trim();
  }
  return null;
}

async function searchWikipediaFallback(scientificName: string) {
  try {
    const searchUrl = `https://it.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(scientificName)}`;
    const wikiResponse = await fetch(searchUrl, { headers: { 'User-Agent': 'Plant-Identification-App/1.0' } });
    if (!wikiResponse.ok) throw new Error('Wikipedia search failed');
    const wikiData = await wikiResponse.json();
    const plantInfo = {
      scientificName,
      commonName: wikiData.displaytitle !== scientificName ? wikiData.displaytitle : undefined,
      description: wikiData.extract || 'Informazioni enciclopediche non disponibili.',
      characteristics: wikiData.extract ? `Estratto da Wikipedia: ${wikiData.extract}` : undefined,
      imageUrl: wikiData.thumbnail?.source
    };
    return new Response(JSON.stringify(plantInfo), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch {
    const plantInfo = {
      scientificName,
      description: 'Informazioni enciclopediche non disponibili per questa specie. La pianta è stata identificata ma non sono disponibili dati dettagliati nei database consultati.',
      characteristics: 'Per informazioni più dettagliate, si consiglia di consultare fonti botaniche specializzate o contattare un esperto.'
    };
    return new Response(JSON.stringify(plantInfo), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  }
}
