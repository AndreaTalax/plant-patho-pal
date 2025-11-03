import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
'Access-Control-Allow-Origin': '*',
'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MARCO_NIGRO_ID = "07c7fe19-33c3-4782-b9a0-4e87c8aa7044";

serve(async (req) => {
if (req.method === 'OPTIONS') {
return new Response('ok', { headers: corsHeaders });
}

  try {
    const { messageId } = await req.json();

    console.log('📧 Processing notifications for message:', messageId);

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Recupera il messaggio
const { data: message, error: messageError } = await supabaseClient
  .from('messages')
  .select('*')
  .eq('id', messageId)
  .single();

if (messageError || !message) {
  console.error('❌ Message not found:', messageError);
  throw new Error('Message not found');
}

// Recupera la conversazione
const { data: conversation, error: conversationError } = await supabaseClient
  .from('conversations')
  .select('user_id, expert_id')
  .eq('id', message.conversation_id)
  .single();

if (conversationError || !conversation) {
  console.error('❌ Conversation not found:', conversationError);
  throw new Error('Conversation not found');
}

const senderId = message.sender_id;
const recipientId = message.recipient_id;

// Se il destinatario è Marco Nigro → salta l'invio email (gestito da send-specialist-notification)
if (recipientId === MARCO_NIGRO_ID) {
  console.log("📭 Destinatario è Marco Nigro — skip email (handled by send-specialist-notification)");
} else {
  // Recupera i profili
  const { data: senderProfile } = await supabaseClient
    .from('profiles')
    .select('first_name, last_name, email, role')
    .eq('id', senderId)
    .single();

  const { data: recipientProfile } = await supabaseClient
    .from('profiles')
    .select('first_name, last_name, email, role')
    .eq('id', recipientId)
    .single();

  const recipientEmail = recipientProfile?.email;

  if (recipientEmail) {
    const senderName = senderProfile
      ? `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim()
      : 'Utente';

    const recipientName = recipientProfile
      ? `${recipientProfile.first_name || ''} ${recipientProfile.last_name || ''}`.trim()
      : 'Utente';

    const isExpert = senderProfile?.role === 'expert' || senderProfile?.role === 'admin';
    const isPDF = message.image_url && message.image_url.toLowerCase().endsWith('.pdf');

    const emailSubject = isExpert
      ? `💬 Dr.Plant - Risposta dall'esperto ${senderName}`
      : `💬 Dr.Plant - Nuovo messaggio da ${senderName}`;

    const messagePreview = message.text && message.text.length > 200
      ? message.text.substring(0, 197) + '...'
      : message.text || 'Nuovo messaggio in chat';

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
            <a href="https://f9facd6a-d78c-457c-9293-2d4b03f009cd.lovableproject.com/?conversation=${message.conversation_id}"
               style="background-color: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              💬 Rispondi ora
            </a>
          </div>
        </div>
      </div>
    `;

    try {
      const smtpUser = Deno.env.get("SMTP_USER");
      const smtpPass = Deno.env.get("SMTP_PASS");

      if (!smtpUser || !smtpPass) throw new Error("SMTP credentials not configured");

      const smtpClient = new SMTPClient({
        connection: {
          hostname: "smtp.gmail.com",
          port: 465,
          tls: true,
          auth: { username: smtpUser, password: smtpPass },
        },
      });

      await smtpClient.send({
        from: `Dr.Plant <${smtpUser}>`,
        to: recipientEmail,
        subject: emailSubject,
        html: emailBody,
      });

      await smtpClient.close();

      console.log("✅ Email sent successfully to:", recipientEmail);
    } catch (emailError) {
      console.error("❌ Error sending email:", emailError);
    }
  } else {
    console.log("⚠️ Recipient has no email, skipping email notification");
  }
}

// 🔔 Invia notifica push (sempre)
console.log("📱 Sending push notification...");

const pushResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-firebase-notification`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    recipientUserId: recipientId,
    title: `💬 Nuovo messaggio`,
    body: message.text ?? "Hai ricevuto un nuovo messaggio",
    data: {
      type: 'chat_message',
      conversationId: message.conversation_id,
      messageId: message.id,
      senderId: senderId,
      url: `/?conversation=${message.conversation_id}`
    }
  })
});

const pushResult = await pushResponse.json();
console.log("✅ Push notification result:", pushResult);

return new Response(JSON.stringify({
  success: true,
  message: "Notification sent (email skipped for Marco if applicable)",
  push: pushResult,
}), {
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

} catch (error) {
console.error("❌ Notification error:", error);
return new Response(JSON.stringify({ error: error.message }), {
status: 500,
headers: { ...corsHeaders, "Content-Type": "application/json" },
});
}
});
