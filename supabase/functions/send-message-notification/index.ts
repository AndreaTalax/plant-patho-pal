import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
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

    // Ottieni il messaggio
    const { data: message, error: messageError } = await supabaseClient
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      console.error('❌ Message not found:', messageError);
      throw new Error('Message not found');
    }

    // Ottieni la conversazione
    const { data: conversation, error: conversationError } = await supabaseClient
      .from('conversations')
      .select('user_id, expert_id')
      .eq('id', message.conversation_id)
      .single();

    if (conversationError || !conversation) {
      console.error('❌ Conversation not found:', conversationError);
      throw new Error('Conversation not found');
    }

    // Determina mittente e destinatario
    const senderId = message.sender_id;
    const recipientId = message.recipient_id;

    // Ottieni profili
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

    if (!recipientProfile?.email) {
      console.log('⚠️ Recipient has no email, skipping email notification');
      return new Response(JSON.stringify({
        success: false,
        message: 'Recipient has no email'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const senderName = senderProfile 
      ? `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim()
      : 'Utente';

    const recipientName = recipientProfile
      ? `${recipientProfile.first_name || ''} ${recipientProfile.last_name || ''}`.trim()
      : 'Utente';

    const isExpert = senderProfile?.role === 'expert' || senderProfile?.role === 'admin';
    const isPDF = message.image_url && message.image_url.toLowerCase().endsWith('.pdf');

    // Prepara contenuto email
    let emailSubject: string;
    let emailBody: string;

    if (isPDF) {
      emailSubject = isExpert 
        ? `📋 Dr.Plant - Nuovo PDF dall'esperto ${senderName}`
        : `📋 Dr.Plant - Nuovo PDF da ${senderName}`;

      emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #22c55e; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🌱 Dr.Plant</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9fafb;">
            <h2 style="color: #1f2937;">Ciao ${recipientName}!</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              ${isExpert ? 'L\'esperto' : 'L\'utente'} <strong>${senderName}</strong> ti ha inviato un documento PDF nella consulenza.
            </p>

            ${message.text ? `
              <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #4b5563; margin: 0;">${message.text}</p>
              </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://f9facd6a-d78c-457c-9293-2d4b03f009cd.lovableproject.com/?conversation=${message.conversation_id}" 
                 style="background-color: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                📋 Visualizza PDF
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Accedi a Dr.Plant per visualizzare e scaricare il documento completo.
            </p>
          </div>

          <div style="background-color: #e5e7eb; padding: 20px; text-align: center;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Dr.Plant - Servizio di consulenza fitopatologa
            </p>
          </div>
        </div>
      `;
    } else {
      emailSubject = isExpert 
        ? `💬 Dr.Plant - Nuova risposta dall'esperto ${senderName}`
        : `💬 Dr.Plant - Nuovo messaggio da ${senderName}`;

      const messagePreview = message.text && message.text.length > 200
        ? message.text.substring(0, 197) + '...'
        : message.text || 'Nuovo messaggio in chat';

      emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #22c55e; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🌱 Dr.Plant</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9fafb;">
            <h2 style="color: #1f2937;">Ciao ${recipientName}!</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              ${isExpert ? 'L\'esperto' : 'L\'utente'} <strong>${senderName}</strong> ti ha inviato un messaggio:
            </p>

            <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 20px 0;">
              <p style="color: #1f2937; margin: 0; white-space: pre-wrap;">${messagePreview}</p>
            </div>

            ${message.image_url && !isPDF ? `
              <div style="text-align: center; margin: 20px 0;">
                <p style="color: #6b7280; font-size: 14px;">📸 Il messaggio contiene un'immagine</p>
              </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://f9facd6a-d78c-457c-9293-2d4b03f009cd.lovableproject.com/?conversation=${message.conversation_id}" 
                 style="background-color: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                💬 Rispondi ora
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Accedi a Dr.Plant per continuare la conversazione.
            </p>
          </div>

          <div style="background-color: #e5e7eb; padding: 20px; text-align: center;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Dr.Plant - Servizio di consulenza fitopatologa
            </p>
          </div>
        </div>
      `;
    }

    // Invia email
    console.log(`📧 Sending email to: ${recipientProfile.email}`);
    
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Dr.Plant <onboarding@resend.dev>',
      to: [recipientProfile.email],
      subject: emailSubject,
      html: emailBody,
    });

    if (emailError) {
      console.error('❌ Error sending email:', emailError);
      throw emailError;
    }

    console.log('✅ Email sent successfully:', emailData);

    // Invia notifica push
    console.log('📱 Sending push notification...');
    
    const pushTitle = isPDF
      ? (isExpert ? `📋 Nuovo PDF dall'esperto` : `📋 Nuovo PDF`)
      : (isExpert ? `💬 Risposta dall'esperto ${senderName}` : `💬 Messaggio da ${senderName}`);

    const pushBody = isPDF
      ? `${senderName} ti ha inviato un documento PDF`
      : (message.text.length > 100 ? message.text.substring(0, 97) + '...' : message.text);

    const pushResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-firebase-notification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipientUserId: recipientId,
        title: pushTitle,
        body: pushBody,
        data: {
          type: isPDF ? 'pdf_message' : 'chat_message',
          conversationId: message.conversation_id,
          messageId: message.id,
          senderId: senderId,
          url: `/?conversation=${message.conversation_id}`
        }
      })
    });

    const pushResult = await pushResponse.json();
    console.log('✅ Push notification result:', pushResult);

    return new Response(JSON.stringify({
      success: true,
      email: emailData,
      push: pushResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Notification error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});