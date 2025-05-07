
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';

console.log("Hello from send-registration-confirmation");

serve(async (req) => {
  // This Edge Function is automatically triggered by Supabase Auth when a user signs up
  // It's configured in the Supabase Dashboard > Authentication > Email Templates
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const { user, email_token } = await req.json();
    
    if (!user || !email_token) {
      throw new Error("Missing user or email_token");
    }
    
    // Initialize Supabase client with service role to access auth admin functions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
    
    // Create user profile in the database
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        username: user.email.split('@')[0],
        created_at: new Date(),
        updated_at: new Date()
      });
      
    if (profileError) {
      throw profileError;
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error processing registration:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
