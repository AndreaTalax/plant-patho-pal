import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const eppoAuthToken = Deno.env.get("EPPO_AUTH_TOKEN");
const eppoBaseUrl = "https://data.eppo.int/api/rest/1.0";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchTerm, searchType = "general" } = await req.json();

    if (!eppoAuthToken) {
      return new Response(
        JSON.stringify({ error: "Missing EPPO_AUTH_TOKEN in environment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!searchTerm) {
      return new Response(
        JSON.stringify({ error: "searchTerm parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Costruisci la query EPPO
    const searchParams = new URLSearchParams({
      kw: searchTerm,
      searchfor: "1", // Search for names and codes
      searchmode: "3", // Containing the word
      authtoken: eppoAuthToken,
    });

    // Filtra per tipo
    if (searchType === "plants") searchParams.append("typeorg", "1");
    if (searchType === "pests") searchParams.append("typeorg", "2");
    if (searchType === "diseases") searchParams.append("typeorg", "3");

    const eppoUrl = `${eppoBaseUrl}/tools/search?${searchParams.toString()}`;
    console.log(`Calling EPPO API: ${eppoUrl}`);

    const response = await fetch(eppoUrl, { headers: { Accept: "application/json" } });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`EPPO API Error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: "EPPO API error", details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const eppoData = await response.json();

    // ✅ Mappa i risultati in un formato uniforme
    const mappedData = (eppoData?.results || []).map((item: any) => ({
      eppoCode: item.codeid || item.eppocode || null,
      preferredName: item.fullname || item.prefname || item.name || null,
      category: searchType,
      otherNames: item.othernames || [],
      family: item.family || null,
      taxonomy: {
        kingdom: item.kingdom || null,
        phylum: item.phylum || null,
        class: item.class || null,
        order: item.order || null,
        family: item.family || null,
        genus: item.genus || null,
      },
    }));

    return new Response(
      JSON.stringify({ data: mappedData, count: mappedData.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in EPPO API function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
