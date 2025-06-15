
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY") || "";

// Marco Nigro UUID fisso
const MARCO_NIGRO_ID = "07c7fe19-33c3-4782-b9a0-4e87c8aa7044";

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sendExpertEmail(expertEmail: string, emailHtml: string, subject: string) {
  if (!SENDGRID_API_KEY) return { success: false, message: "Missing SendGrid key" };
  // SendGrid: semplificato per demo
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: expertEmail }] }],
      from: { email: "noreply@drplant.it", name: "Dr. Plant" },
      subject,
      content: [{ type: "text/html", value: emailHtml }],
    }),
  });
  return { ok: res.ok, status: res.status };
}
// --- NUOVA FUNZIONE: Invia mail anche all’utente se arriva risposta dall’esperto
async function sendUserEmail(userEmail: string, emailHtml: string, subject: string) {
  if (!SENDGRID_API_KEY) return { success: false, message: "Missing SendGrid key" };
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: userEmail }] }],
      from: { email: "noreply@drplant.it", name: "Dr. Plant" },
      subject,
      content: [{ type: "text/html", value: emailHtml }],
    }),
  });
  return { ok: res.ok, status: res.status };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const {
      conversation_id,
      sender_id,
      recipient_id,
      message_text,
      expert_email,
      user_details,
      image_url,
      plant_details,
      recipient_email, // AGGIUNTO PER UTENTE
    } = await req.json();

    // Usa sempre Marco ID quando destinatario è specialista
    const expertId = recipient_id === "MARCO_NIGRO_ID" ? MARCO_NIGRO_ID : recipient_id;

    // Aggiorna unread_count nella conversazione per il destinatario
    if (conversation_id) {
      await supabaseAdmin
        .from("conversations")
        .update({
            last_message_text: message_text?.slice(0, 100),
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            unread_count: supabaseAdmin.sql`COALESCE(unread_count,0) + 1`,
            last_sender_id: sender_id,
        })
        .eq("id", conversation_id);
    }

    // Notifica realtime all’ESPERTO
    try {
      const expertChannel = supabaseAdmin.channel(`expert-notifications:${expertId}`);
      await expertChannel.send({
        type: "broadcast",
        event: "new_plant_consultation",
        payload: {
          conversation_id,
          sender_id,
          message_preview: message_text?.slice(0, 50),
          timestamp: new Date().toISOString(),
          sender_type: "user"
        },
      });
    } catch (e) {}

    // Notifica realtime all’UTENTE (se non è lo specialista che scrive)
    if (user_details?.id && sender_id === expertId) {
      try {
        const userChannel = supabaseAdmin.channel(`user-notifications:${user_details.id}`);
        await userChannel.send({
          type: "broadcast",
          event: "expert_reply",
          payload: {
            conversation_id,
            sender_id,
            message_preview: message_text?.slice(0, 50),
            timestamp: new Date().toISOString(),
            sender_type: "expert"
          },
        });
      } catch (e) {}
    }

    // --- Invio email ESPERTO
    if (expert_email) {
      const subject = "Nuova richiesta di diagnosi";
      const emailHtml = `
        <div>
          <h1>Nuovo messaggio da ${user_details?.firstName || "Utente sconosciuto"}</h1>
          <p>${message_text || ""}</p>
        </div>
      `;
      await sendExpertEmail(expert_email, emailHtml, subject);
    }

    // --- Invio email UTENTE (quando risponde esperto e recipient_email disponibile)
    if (recipient_email && sender_id === expertId) {
      const subject = "Risposta del fitopatologo Marco Nigro";
      const emailHtml = `
        <div>
          <h1>Marco Nigro ha risposto alla tua richiesta</h1>
          <p>${message_text || ""}</p>
          <p>Accedi per leggere e rispondere direttamente:</p>
          <a href="https://drplant.lovable.app/chat">Entra nella chat</a>
        </div>
      `;
      await sendUserEmail(recipient_email, emailHtml, subject);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
