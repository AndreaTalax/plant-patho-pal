import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Firebase Server Key (you'll need to add this as a secret)
const FIREBASE_SERVER_KEY = Deno.env.get('FIREBASE_SERVER_KEY')

interface PushNotificationRequest {
  recipientUserId: string
  title: string
  body: string
  data?: {
    type: string
    conversationId?: string
    messageId?: string
    url?: string
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { recipientUserId, title, body, data }: PushNotificationRequest = await req.json()

    console.log(`📱 Sending push notification to user: ${recipientUserId}`)
    console.log(`📝 Title: ${title}`)
    console.log(`📝 Body: ${body}`)

    // Get FCM tokens for the recipient user
    const { data: subscriptions, error: subscriptionsError } = await supabaseClient
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', recipientUserId)

    if (subscriptionsError) {
      console.error('❌ Error fetching push subscriptions:', subscriptionsError)
      throw subscriptionsError
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('⚠️ No push subscriptions found for user')
      return new Response(JSON.stringify({
        success: false,
        message: 'No push subscriptions found for user'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`📱 Found ${subscriptions.length} push subscriptions`)

    const results = []

    // Send notification to each FCM token
    for (const subscription of subscriptions) {
      try {
        const fcmData = subscription.subscription as any
        
        if (fcmData.type === 'fcm' && fcmData.token) {
          const result = await sendFirebaseNotification(
            fcmData.token,
            title,
            body,
            data
          )
          results.push(result)
          console.log('✅ Notification sent via FCM:', result)
        }
      } catch (error) {
        console.error('❌ Error sending to subscription:', error)
        results.push({ success: false, error: error.message })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    console.log(`📊 Notification results: ${successCount} success, ${failureCount} failures`)

    return new Response(JSON.stringify({
      success: successCount > 0,
      results: {
        total: results.length,
        success: successCount,
        failures: failureCount
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Push notification error:', error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function sendFirebaseNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!FIREBASE_SERVER_KEY) {
      throw new Error('Firebase Server Key not configured')
    }

    const payload = {
      to: fcmToken,
      notification: {
        title: title,
        body: body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        click_action: data?.url || '/',
        tag: data?.type || 'chat-message'
      },
      data: {
        ...data,
        timestamp: new Date().toISOString()
      }
    }

    console.log('🚀 Sending FCM payload:', JSON.stringify(payload, null, 2))

    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${FIREBASE_SERVER_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const result = await response.json()

    if (response.ok && result.success >= 1) {
      return { success: true }
    } else {
      console.error('❌ FCM send failed:', result)
      return { 
        success: false, 
        error: result.results?.[0]?.error || 'FCM send failed' 
      }
    }

  } catch (error) {
    console.error('❌ Firebase notification error:', error)
    return { 
      success: false, 
      error: error.message 
    }
  }
}

// Helper function to send chat notifications
export async function sendChatNotification(
  senderUserId: string,
  recipientUserId: string,
  messageContent: string,
  conversationId: string,
  messageId: string
) {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get sender info
    const { data: senderProfile } = await supabaseClient
      .from('profiles')
      .select('first_name, last_name, role')
      .eq('id', senderUserId)
      .single()

    const senderName = senderProfile 
      ? `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim()
      : 'Utente'

    const isExpert = senderProfile?.role === 'expert' || senderProfile?.role === 'admin'
    
    const title = isExpert 
      ? `💬 Risposta dall'esperto ${senderName}`
      : `💬 Nuovo messaggio da ${senderName}`

    const body = messageContent.length > 100 
      ? messageContent.substring(0, 97) + '...'
      : messageContent

    const notificationData = {
      type: 'chat_message',
      conversationId: conversationId,
      messageId: messageId,
      senderId: senderUserId,
      url: `/?conversation=${conversationId}`
    }

    // Send the notification
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
        data: notificationData
      })
    })

    const result = await notificationResponse.json()
    console.log('📱 Chat notification sent:', result)

    return result

  } catch (error) {
    console.error('❌ Error sending chat notification:', error)
    return { success: false, error: error.message }
  }
}