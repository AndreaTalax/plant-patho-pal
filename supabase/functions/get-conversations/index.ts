
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

    // Get all conversations where the user is an expert
    const { data: conversations, error } = await supabaseClient
      .from('conversations')
      .select(`
        id,
        title,
        last_message_text,
        last_message_at,
        created_at,
        profiles!conversations_user_id_fkey(id, first_name, last_name, avatar_url)
      `)
      .eq('expert_id', user.id)
      .order('last_message_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform the data to match the expected format
    const transformedConversations = (conversations || []).map(conv => ({
      id: conv.id,
      title: conv.title || 'Conversazione',
      last_message_text: conv.last_message_text || '',
      last_message_at: conv.last_message_at || conv.created_at,
      unread_count: 0, // TODO: Calculate actual unread count
      user_profile: {
        id: conv.profiles?.id || '',
        first_name: conv.profiles?.first_name || '',
        last_name: conv.profiles?.last_name || '',
        avatar_url: conv.profiles?.avatar_url
      }
    }));

    return new Response(JSON.stringify({ 
      success: true,
      conversations: transformedConversations
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
