
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
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
      console.error("❌ Missing authorization header");
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

    // Get request body
    const { conversationId } = await req.json();
    
    if (!conversationId) {
      console.error("❌ Missing conversationId");
      return new Response(JSON.stringify({ error: "Missing conversationId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("🔍 Loading conversation:", conversationId);

    // Get conversation details
    const { data: conversation, error: conversationError } = await supabaseClient
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (conversationError) {
      console.error("❌ Error fetching conversation:", conversationError);
      return new Response(JSON.stringify({ 
        error: "Conversation not found", 
        details: conversationError.message 
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ Conversation found:", conversation.id);

    // Get messages for this conversation
    const { data: messages, error: messagesError } = await supabaseClient
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        recipient_id,
        content,
        text,
        image_url,
        metadata,
        sent_at,
        created_at
      `)
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: true });

    if (messagesError) {
      console.error("❌ Error fetching messages:", messagesError);
      return new Response(JSON.stringify({ 
        error: "Failed to fetch messages", 
        details: messagesError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ Messages loaded:", messages?.length || 0);

    // Get user profile for the conversation
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', conversation.user_id)
      .single();

    if (profileError) {
      console.error("⚠️ Error fetching user profile:", profileError);
    }

    const response = {
      conversation: {
        ...conversation,
        user_profile: userProfile
      },
      messages: messages || [],
      total_messages: messages?.length || 0
    };

    console.log("✅ Response prepared successfully");

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("❌ Unexpected error in get-conversation:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      message: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
