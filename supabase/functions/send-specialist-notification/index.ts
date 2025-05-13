
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Ottieni le variabili d'ambiente
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Crea un client Supabase con la chiave di servizio per operazioni privilegiate
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Gestisci richieste CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Ottieni dati dalla richiesta
    const { conversation_id, sender_id, recipient_id, message_text } = await req.json();

    // Verifica che i dati richiesti siano presenti
    if (!conversation_id || !sender_id || !recipient_id || !message_text) {
      return new Response(
        JSON.stringify({
          error: "Mancano dati richiesti: conversation_id, sender_id, recipient_id, message_text"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log(`Nuovo messaggio in conversazione ${conversation_id}: da ${sender_id} a ${recipient_id}`);

    // Ottieni il profilo del destinatario per maggiori informazioni
    const { data: recipientProfile, error: recipientError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', recipient_id)
      .single();

    if (recipientError) {
      console.error("Errore nel recupero del profilo del destinatario:", recipientError);
      // Continuiamo comunque anche se non troviamo il profilo
    }

    // Ottieni il profilo del mittente per le notifiche
    const { data: senderProfile, error: senderError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', sender_id)
      .single();

    if (senderError) {
      console.error("Errore nel recupero del profilo del mittente:", senderError);
      // Continuiamo comunque anche se non troviamo il profilo
    }

    const senderName = senderProfile?.username || senderProfile?.email || "Un utente";

    // Qui puoi implementare l'invio di notifiche, ad esempio:
    // - Email al destinatario
    // - Notifica push
    // - WebSockets per aggiornamenti in tempo reale

    console.log(`Notifica inviata per messaggio da ${senderName} a ${recipientProfile?.username || recipient_id}`);

    // Aggiorna la conversazione con l'ultimo messaggio
    const { error: updateError } = await supabaseAdmin
      .from('conversations')
      .update({
        last_message_text: message_text,
        last_message_timestamp: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversation_id);

    if (updateError) {
      console.error("Errore nell'aggiornamento della conversazione:", updateError);
      // Continuiamo comunque anche se l'aggiornamento fallisce
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notifica inviata con successo" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );

  } catch (error) {
    console.error("Errore nell'invio della notifica:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
