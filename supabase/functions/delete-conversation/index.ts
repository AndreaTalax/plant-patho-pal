
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Marco Nigro UUID fisso
const MARCO_NIGRO_ID = "07c7fe19-33c3-4782-b9a0-4e87c8aa7044";

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      headers: corsHeaders,
      status: 200 
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { conversationId } = await req.json();

    // Verifica autenticazione
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization header required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verifica che l'utente sia Marco Nigro (admin)
    if (user.id !== MARCO_NIGRO_ID) {
      return new Response(JSON.stringify({ error: "Unauthorized: Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!conversationId) {
      return new Response(JSON.stringify({ error: "conversationId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prima elimina tutti i messaggi della conversazione
    const { error: messagesError } = await supabaseAdmin
      .from("messages")
      .delete()
      .eq("conversation_id", conversationId);

    if (messagesError) {
      console.error("Error deleting messages:", messagesError);
      return new Response(JSON.stringify({ error: "Failed to delete messages" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Poi elimina la conversazione
    const { error: conversationError } = await supabaseAdmin
      .from("conversations")
      .delete()
      .eq("id", conversationId);

    if (conversationError) {
      console.error("Error deleting conversation:", conversationError);
      return new Response(JSON.stringify({ error: "Failed to delete conversation" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Conversation ${conversationId} and related messages deleted successfully`);

    return new Response(JSON.stringify({ 
      success: true,
      message: "Conversation and messages deleted successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in delete-conversation:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Internal server error" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
