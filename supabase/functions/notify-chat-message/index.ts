import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messageData } = await req.json()
    
    console.log('📱 Processing chat notification for message:', messageData)

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get conversation details to find recipient
    const { data: conversation, error: conversationError } = await supabaseClient
      .from('conversations')
      .select('user_id, expert_id')
      .eq('id', messageData.conversation_id)
      .single()

    if (conversationError || !conversation) {
      console.error('❌ Error fetching conversation:', conversationError)
      throw new Error('Conversation not found')
    }

    // Determine recipient (if sender is user, notify expert and vice versa)
    let recipientUserId: string

    if (messageData.sender_id === conversation.user_id) {
      // User sent message, notify expert
      recipientUserId = conversation.expert_id
    } else if (messageData.sender_id === conversation.expert_id) {
      // Expert sent message, notify user
      recipientUserId = conversation.user_id
    } else {
      console.log('⚠️ Sender is neither user nor expert in conversation')
      return new Response(JSON.stringify({
        success: false,
        message: 'Sender not part of conversation'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!recipientUserId) {
      console.log('⚠️ No recipient found for notification')
      return new Response(JSON.stringify({
        success: false,
        message: 'No recipient found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get sender profile info
    const { data: senderProfile } = await supabaseClient
      .from('profiles')
      .select('first_name, last_name, role')
      .eq('id', messageData.sender_id)
      .single()

    const senderName = senderProfile 
      ? `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim()
      : 'Utente'

    const isExpert = senderProfile?.role === 'expert' || senderProfile?.role === 'admin'
    
    const title = isExpert 
      ? `🌱 Risposta dall'esperto ${senderName}`
      : `💬 Nuovo messaggio da ${senderName}`

    const body = messageData.content && messageData.content.length > 100 
      ? messageData.content.substring(0, 97) + '...'
      : messageData.content || 'Nuovo messaggio in chat'

    // Send Firebase notification
    const notificationResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-firebase-notification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipientUserId,
        title,
        body,
        data: {
          type: 'chat_message',
          conversationId: messageData.conversation_id,
          messageId: messageData.id,
          senderId: messageData.sender_id,
          url: `/?conversation=${messageData.conversation_id}`
        }
      })
    })

    const notificationResult = await notificationResponse.json()
    
    console.log('✅ Chat notification processed:', notificationResult)

    return new Response(JSON.stringify({
      success: true,
      notificationResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Chat notification error:', error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})