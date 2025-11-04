import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { conversationId, senderId, recipientId, text, imageUrl, products, attachments } = await req.json();

    if (!conversationId || !senderId || !recipientId || !text) {
      throw new Error("Missing required fields: conversationId, senderId, recipientId, text");
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Controlla se la conversazione esiste
    let { data: conversation } = await supabaseClient
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .maybeSingle();

    // Se non esiste, creala
    if (!conversation) {
      const { data: newConversation, error: createError } = await supabaseClient
        .from('conversations')
        .insert({
          id: conversationId,
          user_id: senderId,
          expert_id: "07c7fe19-33c3-4782-b9a0-4e87c8aa7044",
          status: 'active',
          title: 'Consulenza esperto'
        })
        .select()
        .single();

      if (createError) throw createError;
      conversation = newConversation;
    }

    // Inserisci il messaggio
    const { data: message, error: messageError } = await supabaseClient
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        recipient_id: recipientId,
        text,
        content: text,
        image_url: imageUrl || null,
        products: products || null,
        metadata: {
          timestamp: new Date().toISOString(),
          messageType: imageUrl ? 'image' : (attachments ? 'attachment' : 'text'),
          attachments: attachments || null
        }
      })
      .select()
      .single();

    if (messageError) throw messageError;

    // Aggiorna la conversazione con ultimo messaggio
    await supabaseClient
      .from('conversations')
      .update({
        last_message_text: text,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active'
      })
      .eq('id', conversationId);

    // Chiama funzione serverless per notifiche
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const notificationResponse = await fetch(`${supabaseUrl}/functions/v1/send-message-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({ messageId: message.id })
    });

    const notificationResult = await notificationResponse.json();
    console.log('✅ Notification result:', notificationResult);

    return new Response(JSON.stringify({
      success: true,
      message: 'Messaggio inviato e notifiche triggerate',
      messageData: message,
      conversationId,
      notificationResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Errore sendMessage:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
