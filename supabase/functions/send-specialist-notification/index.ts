import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  // Handle CORS preflight
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

    console.log("📧 Processing notification request via SMTP:", {
      conversation_id,
      sender_id,
      recipient_id,
      expert_email,
      recipient_email,
      has_user_details: !!user_details,
      has_image: !!image_url,
      has_plant_details: !!plant_details,
    });

    // Recupera profilo mittente
    let senderProfile = null;
    if (sender_id) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", sender_id)
        .single();
      senderProfile = profile;
    }

    // Nome del mittente
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

    // Corpo HTML dell'email
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://drplant.lovable.app/lovable-uploads/72d5a60c-404a-4167-9430-511af91c523b.png" alt="Dr.Plant Logo" style="height: 60px;">
          <h1 style="color: #1e40af; margin: 10px 0;">Dr.Plant</h1>
        </div>

        <div style="background-color: #f8fafc; padding: 25px; border-radius: 10px; border-left: 4px solid #10b981;">
          <h2 style="color: #1e40af; margin-top: 0;">${emailSubject}</h2>

          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin-top: 0;">💬 Messaggio:</h3>
            <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 10px 0; padding: 15px; background-color: #f9fafb; border-radius: 6px;">${message_text}</p>

            ${
              image_url
                ? `
              <h3 style="color: #059669;">📸 Immagine allegata:</h3>
              <div style="text-align: center; margin: 15px 0;">
                <img src="${image_url}" alt="Immagine della pianta" style="max-width: 100%; max-height: 300px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              </div>
            `
                : ""
            }

            ${
              senderProfile
                ? `
              <h3 style="color: #059669;">👤 Dettagli del mittente:</h3>
              <div style="background-color: #f0f9ff; padding: 15px; border-radius: 6px;">
                <p><strong>Nome:</strong> ${senderName}</p>
                <p><strong>Email:</strong> ${senderProfile.email}</p>
              </div>
            `
                : ""
            }

            ${
              plant_details && plant_details.length > 0
                ? `
              <h3 style="color: #059669;">🌱 Prodotti consigliati:</h3>
              <ul style="background-color: #f0fdf4; padding: 15px; border-radius: 6px;">
                ${plant_details
                  .map(
                    (product) =>
                      `<li style="margin: 5px 0;"><strong>${product.name}</strong> - €${product.price}</li>`
                  )
                  .join("")}
              </ul>
            `
                : ""
            }
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://drplant.lovable.app/"
              style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Accedi alla Dashboard
            </a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
            Questo messaggio è stato inviato automaticamente dal sistema di chat di Dr.Plant.
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
            © 2025 Dr.Plant - Il tuo assistente personale per la cura delle piante
          </p>
        </div>
      </div>
    `;

    // ✅ INVIO EMAIL VIA SMTP
    const targetEmail = "agrotecnicomarconigro@gmail.com";

    try {
      const SMTP_HOSTNAME = Deno.env.get("SMTP_HOSTNAME");
      const SMTP_PORT = Number(Deno.env.get("SMTP_PORT") || 465);
      const SMTP_USER = Deno.env.get("SMTP_USER");
      const SMTP_PASS = Deno.env.get("SMTP_PASS");

      if (!SMTP_HOSTNAME || !SMTP_USER || !SMTP_PASS) {
        throw new Error("Missing SMTP environment variables");
      }

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
      console.log(`✅ Email inviata via SMTP a ${targetEmail}`);
    } catch (emailError) {
      console.error("❌ Errore nell'invio SMTP:", emailError);
    }

    // 📦 Salvataggio notifica nel database
    const { error: notificationError } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: recipient_id || sender_id,
        title: `Nuovo messaggio da ${senderName}`,
        message:
          message_text.slice(0, 200) +
          (message_text.length > 200 ? "..." : ""),
        type: "message",
        data: {
          conversation_id,
          sender_id,
          message_preview: message_text.slice(0, 100),
        },
      });

    if (notificationError) {
      console.error("⚠️ Error storing notification:", notificationError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notification processed successfully via SMTP",
        recipient: targetEmail,
        subject: emailSubject,
        notification_stored: !notificationError,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Error in send-specialist-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
