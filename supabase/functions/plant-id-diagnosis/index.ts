
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.3"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const PLANT_ID_API_KEY = Deno.env.get('PLANT_ID_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

    if (!PLANT_ID_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return new Response(
        JSON.stringify({ error: 'Missing Plant.id API key or Supabase URL/Key.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Read multipart or base64
    const contentType = req.headers.get("content-type") || ""
    let imageBase64 = ""
    if (contentType.includes("application/json")) {
      const body = await req.json()
      imageBase64 = body.imageBase64 || ""
    } else if (contentType.includes("multipart/form-data")) {
      const form = await req.formData()
      const file = form.get("image")
      if (file && typeof file === "object" && "arrayBuffer" in file) {
        const bytes = new Uint8Array(await file.arrayBuffer())
        imageBase64 = btoa(String.fromCharCode(...bytes))
      }
    }

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image data provided" }),
        { status: 400, headers: corsHeaders }
      )
    }

    // PLANT.ID API CALL - Back to v2 endpoint (v3 might need different auth)
    const plantIdUrl = "https://api.plant.id/v2/identify"
    const plantIdRes = await fetch(plantIdUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": PLANT_ID_API_KEY
      },
      body: JSON.stringify({
        images: [imageBase64],
        plant_details: ["common_names", "url"],
        plant_language: "en",
        classification_level: "all",
        similar_images: true,
        health: "all"
      })
    })
    const plantIdData = await plantIdRes.json()
    return new Response(
      JSON.stringify(plantIdData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status: 500, headers: corsHeaders }
    )
  }
})
