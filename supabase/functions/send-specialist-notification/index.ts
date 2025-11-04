import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import webpush from "https://esm.sh/web-push@3.6.0";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// Configura Web Push con chiavi VAPID
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_EMAIL = Deno.env.get("VAPID_EMAIL") ?? "";

webpush.setVapidDetails(`mailto:${VAPID_EMAIL}`, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST")
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const {
      conversation_id,
      sender_id,
      recipient_id,
      message_text,
      expert_email,
      recipient_email,
      user_details,
      image_url,
      plant_details,
    } = await req.json();

    console.log("📨 Elaborazione notifica:", { conversation_id, sender_id, recipient_id });

    // Recupera profilo del mittente
    let senderProfile = null;
    if (sender_id) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", sender_id)
        .single();
      senderProfile = profile;
    }

    const senderName =
      senderProfile
        ? `${senderProfile.first_name || ""} ${senderProfile.last_name || ""}`.trim() ||
          senderProfile.email
        : user_details?.firstName && user_details?.lastName
        ? `${user_details.firstName} ${user_details.lastName}`
        : user_details?.email || "Utente sconosciuto";

    const emailSubject = expert_email
      ? `Dr.Plant - Nuovo messaggio da ${senderName}`
      : `Dr.Plant - Risposta dal Dr. Marco Nigro`;

    const emailBody = `
      <div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e40af;">${emailSubject}</h2>
        <p>${message_text}</p>
        ${
          image_url
            ? `<img src="${image_url}" style="max-width:100%; border-radius:8px;" alt="Immagine">`
            : ""
        }
        <p><a href="https://drplant.lovable.app/?conversation=${conversation_id}">Apri la chat</a></p>
      </div>
    `;

    // ✅ INVIO EMAIL VIA SMTP
    const targetEmail = expert_email || recipient_email;
    try {
      const SMTP_HOSTNAME = Deno.env.get("SMTP_HOSTNAME");
      const SMTP_PORT = Number(Deno.env.get("SMTP_PORT") || 465);
      const SMTP_USER = Deno.env.get("SMTP_USER");
      const SMTP_PASS = Deno.env.get("SMTP_PASS");

      const smtp = new SmtpClient();
      await smtp.connectTLS({
        hostname: SMTP_HOSTNAME,
        port: SMTP_PORT,
        username: SMTP_USER,
        password: SMTP_PASS,
      });

      await smtp.send({
        from: `Dr.Plant <${SMTP_USER}>`,
        to: targetEmail,
        subject: emailSubject,
        content: emailBody,
        html: emailBody,
      });

      await smtp.close();
      console.log(`✅ Email inviata a ${targetEmail}`);
    } catch (emailError) {
      console.error("❌ Errore invio email:", emailError);
    }

    // ✅ Salvataggio notifica nel DB
    const { error: notificationError } = await supabaseAdmin.from("notifications").insert({
      user_id: recipient_id,
      title: `Nuovo messaggio da ${senderName}`,
      message: message_text.slice(0, 200),
      type: "message",
      data: { conversation_id, sender_id, message_preview: message_text.slice(0, 100) },
    });

    if (notificationError) console.error("⚠️ Errore salvataggio notifica:", notificationError);

    // ✅ INVIO NOTIFICA PUSH (se esiste una sottoscrizione)
    const { data: subscriptions } = await supabaseAdmin
      .from("push_subscriptions")
      .select("endpoint, expirationTime, keys")
      .eq("user_id", recipient_id);

    if (subscriptions && subscriptions.length > 0) {
      console.log(`🔔 Invio notifica push a ${subscriptions.length} dispositivi`);

      const payload = JSON.stringify({
        title: "💬 Nuovo messaggio su Dr.Plant",
        body: message_text,
        data: { conversationId: conversation_id },
      });

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(sub, payload);
          console.log("✅ Notifica push inviata");
        } catch (pushError) {
          console.error("❌ Errore invio push:", pushError);
        }
      }
    } else {
      console.log("ℹ️ Nessuna sottoscrizione push trovata per l’utente");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notifica inviata con successo" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("❌ Errore generale:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
