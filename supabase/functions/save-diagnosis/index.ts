import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    // Authenticate user
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("Authentication failed");
    }

    const user = userData.user;
    const diagnosisData = await req.json();

    console.log('💾 Saving diagnosis for user:', user.id);

    // Insert diagnosis into database using service role (bypasses RLS)
    const { data, error } = await supabaseClient
      .from('diagnoses')
      .insert({
        ...diagnosisData,
        user_id: user.id // Ensure user_id is set correctly
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving diagnosis:', error);
      throw error;
    }

    console.log('✅ Diagnosis saved successfully:', data.id);

    return new Response(JSON.stringify({ 
      success: true, 
      data: data,
      message: 'Diagnosis saved successfully' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in save-diagnosis function:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});