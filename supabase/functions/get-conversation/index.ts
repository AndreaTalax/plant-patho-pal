
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
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
    const url = new URL(req.url);
    const conversationId = url.pathname.split('/').pop();

    if (!conversationId) {
      throw new Error("Conversation ID is required");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get conversation details with user profile info
    const { data: conversation, error: conversationError } = await supabaseClient
      .from('conversations')
      .select(`
        *,
        profiles!conversations_user_id_fkey(id, first_name, last_name, avatar_url)
      `)
      .eq('id', conversationId)
      .or(`user_id.eq.${user.id},expert_id.eq.${user.id}`)
      .single();

    if (conversationError || !conversation) {
      throw new Error("Conversation not found or access denied");
    }

    // Get all messages for this conversation
    const { data: messages, error: messagesError } = await supabaseClient
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: true });

    if (messagesError) {
      throw messagesError;
    }

    // Mark messages as read for the current user
    await supabaseClient
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .eq('recipient_id', user.id);

    return new Response(JSON.stringify({ 
      success: true,
      conversation: conversation,
      messages: messages || [],
      totalMessages: messages?.length || 0
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error getting conversation:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to get conversation" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
