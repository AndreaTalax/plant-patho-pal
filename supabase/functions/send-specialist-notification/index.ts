import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import webpush from "npm:web-push@3.6.7";
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
        .select("first_name, last_name, email, role")
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

    // Recupera profilo del destinatario
    let recipientProfile = null;
    if (recipient_id) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("first_name, last_name, email, role, email_notifications_enabled, push_notifications_enabled")
        .eq("id", recipient_id)
        .single();
      recipientProfile = profile;
    }

    const recipientName = recipientProfile
      ? `${recipientProfile.first_name || ""} ${recipientProfile.last_name || ""}`.trim() || recipientProfile.email
      : "Utente";

    const emailNotificationsEnabled = recipientProfile?.email_notifications_enabled ?? true;
    const pushNotificationsEnabled = recipientProfile?.push_notifications_enabled ?? true;

    const isExpert = senderProfile?.role === 'expert' || senderProfile?.role === 'admin';
    const messagePreview = message_text && message_text.length > 200
      ? message_text.substring(0, 197) + '...'
      : message_text || 'Nuovo messaggio in chat';

    const emailSubject = expert_email
      ? `💬 Dr.Plant - Nuovo messaggio da ${senderName}`
      : `💬 Dr.Plant - Risposta dall'esperto ${senderName}`;

    // ✅ INVIO EMAIL VIA SMTP (solo se abilitato)
    const targetEmail = expert_email || recipient_email;
    if (targetEmail && emailNotificationsEnabled) {
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #22c55e; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🌱 Dr.Plant</h1>
          </div>
          <div style="padding: 30px; background-color: #f9fafb;">
            <h2 style="color: #1f2937;">Ciao ${recipientName}!</h2>
            <p style="color: #4b5563; font-size: 16px;">${isExpert ? 'L\'esperto' : 'L\'utente'} <strong>${senderName}</strong> ti ha inviato un messaggio:</p>
            <div style="background-color: white; padding: 20px; border-left: 4px solid #22c55e; margin: 20px 0;">
              <p style="color: #1f2937; margin: 0; white-space: pre-wrap;">${messagePreview}</p>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://drplant.lovable.app/?tab=chat&conversation=${conversation_id}"
                 style="background-color: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                💬 Apri chat
              </a>
            </div>
          </div>
        </div>
      `;

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
    } else if (targetEmail && !emailNotificationsEnabled) {
      console.log("⚠️ Email notifications disabled for recipient, skipping email");
    } else {
      console.log("⚠️ Recipient has no email, skipping email notification");
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

    // ✅ INVIO NOTIFICA PUSH (solo se abilitato)
    if (pushNotificationsEnabled) {
      const { data: subscriptions, error: subsError } = await supabaseAdmin
        .from("push_subscriptions")
        .select("subscription")
        .eq("user_id", recipient_id);

      if (subsError) console.error("⚠️ Errore lettura sottoscrizioni:", subsError);

      if (subscriptions && subscriptions.length > 0) {
        console.log(`🔔 Invio notifica push a ${subscriptions.length} dispositivi`);

        const payload = JSON.stringify({
          title: "💬 Nuovo messaggio su Dr.Plant",
          body: message_text,
          data: { conversationId: conversation_id },
        });

        for (const record of subscriptions) {
          try {
            const subscription = typeof record.subscription === "string"
              ? JSON.parse(record.subscription)
              : record.subscription;
            await webpush.sendNotification(subscription, payload);
            console.log("✅ Notifica push inviata");
          } catch (pushError) {
            console.error("❌ Errore invio push:", pushError);
          }
        }
      } else {
        console.log("ℹ️ Nessuna sottoscrizione push trovata per l'utente");
      }
    } else {
      console.log("⚠️ Push notifications disabled for recipient, skipping push notification");
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
