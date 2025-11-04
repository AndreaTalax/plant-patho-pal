import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebPushNotificationRequest {
  recipientUserId: string
  title: string
  body: string
  icon?: string
  data?: {
    type?: string
    conversationId?: string
    messageId?: string
    senderId?: string
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

    const { recipientUserId, title, body, icon, data }: WebPushNotificationRequest = await req.json()

    console.log(`📱 Sending Web Push notification to user: ${recipientUserId}`)
    console.log(`📝 Title: ${title}`)
    console.log(`📝 Body: ${body}`)

    // Get Web Push subscriptions for the recipient user
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

    // Get VAPID keys from environment
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidEmail = Deno.env.get('VAPID_EMAIL') || 'mailto:agrotecnicomarconigro@gmail.com'

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not configured. Please add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY secrets.')
    }

    const results = []

    // Prepare notification payload
    const notificationPayload = JSON.stringify({
      title,
      body,
      icon: icon || '/lovable-uploads/72d5a60c-404a-4167-9430-511af91c523b.png',
      badge: '/lovable-uploads/72d5a60c-404a-4167-9430-511af91c523b.png',
      tag: data?.type || 'dr-plant-notification',
      data: data || {},
      timestamp: Date.now(),
      requireInteraction: true
    })

    // Send notification to each subscription
    for (const sub of subscriptions) {
      try {
        const subscription = sub.subscription as PushSubscription

        // Use Web Push Protocol
        const result = await sendWebPushNotification(
          subscription,
          notificationPayload,
          vapidPublicKey,
          vapidPrivateKey,
          vapidEmail
        )
        
        results.push(result)
        console.log('✅ Notification sent via Web Push:', result)
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
    console.error('❌ Web Push notification error:', error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function sendWebPushNotification(
  subscription: PushSubscription,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Import web-push functionality
    const webpush = await import('npm:web-push@3.6.7')
    
    // Set VAPID details
    webpush.default.setVapidDetails(
      vapidEmail,
      vapidPublicKey,
      vapidPrivateKey
    )

    // Send notification
    await webpush.default.sendNotification(subscription, payload)
    
    return { success: true }
  } catch (error) {
    console.error('❌ Web Push send error:', error)
    
    // Handle specific errors
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log('🗑️ Subscription expired or invalid, should be removed from database')
      return { 
        success: false, 
        error: 'Subscription expired or invalid'
      }
    }
    
    return { 
      success: false, 
      error: error.message 
    }
  }
}
