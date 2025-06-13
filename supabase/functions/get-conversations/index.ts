
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

    // Check if user is Marco Nigro (expert)
    const { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('role, first_name, last_name')
      .eq('id', user.id)
      .single();

    const isExpert = userProfile?.role === 'admin' || user.id === '6ee6b888-8064-40a1-8b26-0658343f4360';

    let conversationsQuery;

    if (isExpert) {
      // Expert sees all conversations
      conversationsQuery = supabaseClient
        .from('conversations')
        .select(`
          *,
          profiles!conversations_user_id_fkey(id, first_name, last_name, avatar_url),
          unread_count:messages!messages_conversation_id_fkey(count)
        `)
        .not('expert_id', 'is', null)
        .order('last_message_at', { ascending: false });
    } else {
      // Regular users see only their conversations
      conversationsQuery = supabaseClient
        .from('conversations')
        .select(`
          *,
          profiles!conversations_expert_id_fkey(id, first_name, last_name, avatar_url),
          unread_count:messages!messages_conversation_id_fkey(count)
        `)
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false });
    }

    const { data: conversations, error: conversationsError } = await conversationsQuery;

    if (conversationsError) {
      throw conversationsError;
    }

    // Get unread message counts for each conversation
    const conversationsWithUnread = await Promise.all(
      (conversations || []).map(async (conv) => {
        const { count } = await supabaseClient
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('recipient_id', user.id)
          .eq('read', false);

        return {
          ...conv,
          unread_count: count || 0
        };
      })
    );

    return new Response(JSON.stringify({ 
      success: true,
      conversations: conversationsWithUnread,
      isExpert: isExpert,
      totalConversations: conversationsWithUnread.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error getting conversations:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to get conversations" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
