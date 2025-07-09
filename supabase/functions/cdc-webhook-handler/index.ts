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
    const { tableName, operation, eventData, userId } = await req.json()
    
    console.log(`📡 CDC Webhook received: ${operation} on ${tableName}`)
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Route to appropriate microservice endpoint
    const endpoints = {
      messages: await handleMessageWebhook(operation, eventData, supabaseClient),
      conversations: await handleConversationWebhook(operation, eventData, supabaseClient),
      diagnoses: await handleDiagnosisWebhook(operation, eventData, supabaseClient),
      consultations: await handleConsultationWebhook(operation, eventData, supabaseClient),
      profiles: await handleProfileWebhook(operation, eventData, supabaseClient)
    }

    const handler = endpoints[tableName as keyof typeof endpoints]
    
    if (!handler) {
      return new Response(JSON.stringify({
        error: `No handler found for table: ${tableName}`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      tableName,
      operation,
      processed: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error("❌ CDC Webhook error:", error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function handleMessageWebhook(operation: string, data: any, supabaseClient: any) {
  console.log(`💬 Processing message webhook: ${operation}`)
  
  if (operation === 'INSERT') {
    // Real-time notification to experts
    await supabaseClient
      .channel('expert-notifications')
      .send({
        type: 'broadcast',
        event: 'new_message',
        payload: {
          conversationId: data.conversation_id,
          senderId: data.sender_id,
          content: data.content,
          timestamp: data.sent_at
        }
      })
  }
  
  return { processed: true, service: 'message-service' }
}

async function handleConversationWebhook(operation: string, data: any, supabaseClient: any) {
  console.log(`🗣️ Processing conversation webhook: ${operation}`)
  
  if (operation === 'INSERT') {
    // Notify available experts
    await supabaseClient
      .channel('expert-dashboard')
      .send({
        type: 'broadcast',
        event: 'new_conversation',
        payload: {
          conversationId: data.id,
          userId: data.user_id,
          title: data.title,
          status: data.status
        }
      })
  }
  
  return { processed: true, service: 'conversation-service' }
}

async function handleDiagnosisWebhook(operation: string, data: any, supabaseClient: any) {
  console.log(`🔬 Processing diagnosis webhook: ${operation}`)
  
  if (operation === 'INSERT') {
    // Analytics and monitoring
    await supabaseClient
      .channel('analytics')
      .send({
        type: 'broadcast',
        event: 'new_diagnosis',
        payload: {
          diagnosisId: data.id,
          plantType: data.plant_type,
          symptoms: data.symptoms,
          userId: data.user_id
        }
      })
      
    // Auto-assign to specialist if needed
    if (data.status === 'pending') {
      await supabaseClient.functions.invoke('assign-specialist', {
        body: {
          diagnosisId: data.id,
          plantType: data.plant_type,
          severity: data.diagnosis_result?.severity || 'medium'
        }
      })
    }
  }
  
  return { processed: true, service: 'diagnosis-service' }
}

async function handleConsultationWebhook(operation: string, data: any, supabaseClient: any) {
  console.log(`👨‍⚕️ Processing consultation webhook: ${operation}`)
  
  if (operation === 'INSERT') {
    // Priority routing based on plant type
    const priority = determinePriority(data.plant_info, data.symptoms)
    
    await supabaseClient
      .channel('expert-queue')
      .send({
        type: 'broadcast',
        event: 'new_consultation',
        payload: {
          consultationId: data.id,
          priority,
          plantType: data.plant_info?.type,
          symptoms: data.symptoms,
          userId: data.user_id
        }
      })
  }
  
  return { processed: true, service: 'consultation-service' }
}

async function handleProfileWebhook(operation: string, data: any, supabaseClient: any) {
  console.log(`👤 Processing profile webhook: ${operation}`)
  
  if (operation === 'UPDATE') {
    // Handle subscription changes
    await supabaseClient
      .channel('user-updates')
      .send({
        type: 'broadcast',
        event: 'profile_updated',
        payload: {
          userId: data.id,
          subscription: data.subscription_plan,
          isOnline: data.is_online
        }
      })
  }
  
  return { processed: true, service: 'profile-service' }
}

function determinePriority(plantInfo: any, symptoms: string): 'low' | 'medium' | 'high' {
  if (!symptoms) return 'low'
  
  const highPriorityKeywords = ['morte', 'morendo', 'grave', 'urgente', 'emergenza']
  const mediumPriorityKeywords = ['malato', 'problemi', 'aiuto', 'preoccupato']
  
  const symptomsLower = symptoms.toLowerCase()
  
  if (highPriorityKeywords.some(keyword => symptomsLower.includes(keyword))) {
    return 'high'
  }
  
  if (mediumPriorityKeywords.some(keyword => symptomsLower.includes(keyword))) {
    return 'medium'
  }
  
  return 'low'
}