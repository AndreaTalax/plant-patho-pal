
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const MARCO_NIGRO_ID = "07c7fe19-33c3-4782-b9a0-4e87c8aa7044";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authentication token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error("❌ Authentication error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ User authenticated:", user.id);

    // Get conversations for Marco Nigro (expert)
    const { data: conversations, error: conversationsError } = await supabaseClient
      .from('conversations')
      .select(`
        id,
        user_id,
        expert_id,
        last_message_text,
        last_message_at,
        status,
        created_at,
        updated_at,
        title
      `)
      .eq('expert_id', MARCO_NIGRO_ID)
      .order('updated_at', { ascending: false });

    if (conversationsError) {
      console.error("❌ Error fetching conversations:", conversationsError);
      return new Response(JSON.stringify({ 
        error: "Failed to fetch conversations", 
        details: conversationsError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ Conversations fetched:", conversations?.length || 0);

    // Get user profiles for each conversation
    const conversationsWithProfiles = await Promise.all(
      (conversations || []).map(async (conversation) => {
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('first_name, last_name, email, avatar_url')
          .eq('id', conversation.user_id)
          .single();
        
        if (profileError) {
          console.error("⚠️ Error fetching profile for user:", conversation.user_id, profileError);
        }

        // Get message count for this conversation
        const { count: messageCount, error: countError } = await supabaseClient
          .from('messages')
          .select('*', { count: 'exact' })
          .eq('conversation_id', conversation.id);

        if (countError) {
          console.error("⚠️ Error counting messages:", countError);
        }
        
        return {
          ...conversation,
          user_profile: profile,
          message_count: messageCount || 0
        };
      })
    );

    console.log("✅ Conversations with profiles prepared:", conversationsWithProfiles.length);

    return new Response(JSON.stringify({ 
      conversations: conversationsWithProfiles,
      total: conversationsWithProfiles.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("❌ Unexpected error in get-conversations:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      message: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
