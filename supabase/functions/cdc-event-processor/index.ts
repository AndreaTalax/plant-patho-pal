import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CDCEvent {
  id: string
  table_name: string
  operation: string
  old_data?: any
  new_data?: any
  user_id?: string
  occurred_at: string
  processed: boolean
  metadata?: any
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

    console.log("🔄 CDC Event Processor started")

    // Get unprocessed CDC events
    const { data: events, error } = await supabaseClient
      .from('cdc_events')
      .select('*')
      .eq('processed', false)
      .order('occurred_at', { ascending: true })
      .limit(50)

    if (error) {
      console.error("❌ Error fetching CDC events:", error)
      throw error
    }

    console.log(`📊 Found ${events?.length || 0} unprocessed CDC events`)

    const processedEvents = []

    for (const event of events || []) {
      try {
        await processEvent(event, supabaseClient)
        processedEvents.push(event.id)
        console.log(`✅ Processed event ${event.id} for table ${event.table_name}`)
      } catch (error) {
        console.error(`❌ Error processing event ${event.id}:`, error)
      }
    }

    // Mark events as processed
    if (processedEvents.length > 0) {
      const { error: updateError } = await supabaseClient
        .from('cdc_events')
        .update({ processed: true })
        .in('id', processedEvents)

      if (updateError) {
        console.error("❌ Error marking events as processed:", updateError)
      } else {
        console.log(`✅ Marked ${processedEvents.length} events as processed`)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed_count: processedEvents.length,
      total_events: events?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error("❌ CDC Event Processor error:", error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function processEvent(event: CDCEvent, supabaseClient: any) {
  console.log(`🔄 Processing ${event.operation} on ${event.table_name}`)

  // Route to appropriate microservice based on table and operation
  switch (event.table_name) {
    case 'messages':
      await processMessageEvent(event, supabaseClient)
      break
    case 'conversations':
      await processConversationEvent(event, supabaseClient)
      break
    case 'diagnoses':
      await processDiagnosisEvent(event, supabaseClient)
      break
    case 'consultations':
      await processConsultationEvent(event, supabaseClient)
      break
    case 'profiles':
      await processProfileEvent(event, supabaseClient)
      break
    default:
      console.log(`⚠️ No handler for table: ${event.table_name}`)
  }
}

async function processMessageEvent(event: CDCEvent, supabaseClient: any) {
  if (event.operation === 'INSERT' && event.new_data) {
    console.log('💬 Processing new message for notifications')
    
    // Send Firebase notification for chat message
    try {
      await supabaseClient.functions.invoke('notify-chat-message', {
        body: {
          messageData: event.new_data
        }
      })
      console.log('✅ Firebase chat notification triggered')
    } catch (error) {
      console.error('❌ Error sending Firebase notification:', error)
    }

    // Notify expert when new message from user (legacy)
    if (event.new_data.sender_id !== event.new_data.recipient_id) {
      await supabaseClient.functions.invoke('notify-expert', {
        body: {
          conversationId: event.new_data.conversation_id,
          messageId: event.new_data.id,
          senderId: event.new_data.sender_id,
          content: event.new_data.content
        }
      })
    }

    // Update conversation last message
    await supabaseClient
      .from('conversations')
      .update({
        last_message_text: event.new_data.content,
        last_message_at: event.new_data.sent_at,
        updated_at: new Date().toISOString()
      })
      .eq('id', event.new_data.conversation_id)
  }
}

async function processConversationEvent(event: CDCEvent, supabaseClient: any) {
  if (event.operation === 'INSERT' && event.new_data) {
    console.log(`💬 New conversation created: ${event.new_data.id}`)
    
    // Send notification to experts about new conversation
    await supabaseClient.functions.invoke('send-specialist-notification', {
      body: {
        conversationId: event.new_data.id,
        userId: event.new_data.user_id,
        title: event.new_data.title || 'Nuova conversazione'
      }
    })
  }
}

async function processDiagnosisEvent(event: CDCEvent, supabaseClient: any) {
  if (event.operation === 'INSERT' && event.new_data) {
    console.log(`🔬 New diagnosis created: ${event.new_data.id}`)
    
    // Send notification about new diagnosis
    await supabaseClient.functions.invoke('send-diagnosis-notification', {
      body: {
        diagnosisId: event.new_data.id,
        userId: event.new_data.user_id,
        plantType: event.new_data.plant_type
      }
    })
  }
}

async function processConsultationEvent(event: CDCEvent, supabaseClient: any) {
  if (event.operation === 'INSERT' && event.new_data) {
    console.log(`👨‍⚕️ New consultation created: ${event.new_data.id}`)
    
    // Notify experts about new consultation
    await supabaseClient.functions.invoke('notify-expert', {
      body: {
        consultationId: event.new_data.id,
        userId: event.new_data.user_id,
        symptoms: event.new_data.symptoms
      }
    })
  }
}

async function processProfileEvent(event: CDCEvent, supabaseClient: any) {
  if (event.operation === 'UPDATE' && event.new_data && event.old_data) {
    // Check if subscription plan changed
    if (event.old_data.subscription_plan !== event.new_data.subscription_plan) {
      console.log(`💳 Subscription changed for user ${event.new_data.id}: ${event.old_data.subscription_plan} -> ${event.new_data.subscription_plan}`)
      
      // Handle subscription change logic
      // You can add more microservice calls here
    }
  }
}