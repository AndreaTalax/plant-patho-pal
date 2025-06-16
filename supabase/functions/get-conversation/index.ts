
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  console.log(`🔍 === NEW REQUEST === ${new Date().toISOString()}`);
  console.log(`🔍 Request method: ${req.method}`);
  console.log(`🔍 Request URL: ${req.url}`);
  console.log(`🔍 Request headers:`, Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("✅ Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    console.error(`❌ Method not allowed: ${req.method}. Expected POST.`);
    return new Response(JSON.stringify({ error: "Method not allowed. Use POST." }), {
      status: 405,
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json",
        "Allow": "POST"
      },
    });
  }

  try {
    console.log("🔍 Creating Supabase client...");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    console.log("🔍 Environment variables:", {
      supabaseUrl: supabaseUrl ? "present" : "missing",
      supabaseAnonKey: supabaseAnonKey ? "present" : "missing"
    });

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("❌ Missing environment variables");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey
    );

    // Get authentication token
    const authHeader = req.headers.get("Authorization");
    console.log("🔍 Authorization header:", authHeader ? "present" : "missing");
    
    if (!authHeader) {
      console.error("❌ Missing authorization header");
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("🔍 Extracted token length:", token.length);
    
    console.log("🔍 Verifying user authentication...");
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
    let requestBody;
    try {
      const bodyText = await req.text();
      console.log("📝 Raw request body:", bodyText);
      console.log("📝 Body length:", bodyText.length);
      
      if (!bodyText.trim()) {
        console.error("❌ Empty request body");
        return new Response(JSON.stringify({ error: "Empty request body" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      requestBody = JSON.parse(bodyText);
      console.log("📝 Parsed request body:", requestBody);
    } catch (parseError) {
      console.error("❌ Error parsing request body:", parseError);
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const { conversationId } = requestBody;
    console.log("🔍 Extracted conversationId:", conversationId);
    
    if (!conversationId) {
      console.error("❌ Missing conversationId in request body");
      return new Response(JSON.stringify({ error: "Missing conversationId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("🔍 Loading conversation:", conversationId);

    // Get conversation details
    console.log("📊 Querying conversations table...");
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

    console.log("✅ Conversation found:", {
      id: conversation.id,
      userId: conversation.user_id,
      expertId: conversation.expert_id,
      status: conversation.status
    });

    // Get messages for this conversation
    console.log("📊 Querying messages table...");
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
    if (messages && messages.length > 0) {
      console.log("📋 Sample message:", {
        id: messages[0].id,
        senderId: messages[0].sender_id,
        text: messages[0].text?.slice(0, 50) + "..."
      });
    }

    // Get user profile for the conversation
    console.log("📊 Querying user profile...");
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', conversation.user_id)
      .single();

    if (profileError) {
      console.error("⚠️ Error fetching user profile:", profileError);
    } else {
      console.log("✅ User profile loaded:", {
        firstName: userProfile?.first_name,
        lastName: userProfile?.last_name,
        email: userProfile?.email
      });
    }

    const response = {
      conversation: {
        ...conversation,
        user_profile: userProfile
      },
      messages: messages || [],
      total_messages: messages?.length || 0
    };

    console.log("✅ Preparing successful response with", {
      messagesCount: response.messages.length,
      conversationId: response.conversation.id,
      hasUserProfile: !!response.conversation.user_profile
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("❌ Unexpected error in get-conversation:", error);
    console.error("❌ Error stack:", error.stack);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      message: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
