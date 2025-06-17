
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Delete conversation function initialized')

serve(async (req) => {
  console.log(`🔍 === NEW REQUEST === ${new Date().toISOString()}`)
  console.log(`🔍 Request method: ${req.method}`)
  console.log(`🔍 Request URL: ${req.url}`)
  console.log(`🔍 Request headers:`, Object.fromEntries(req.headers.entries()))

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔍 Creating Supabase client...')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    console.log('🔍 Environment variables:', {
      supabaseUrl: supabaseUrl ? 'present' : 'missing',
      supabaseAnonKey: supabaseAnonKey ? 'present' : 'missing'
    })

    const authHeader = req.headers.get('Authorization')
    console.log('🔍 Authorization header:', authHeader ? 'present' : 'missing')
    
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('🔍 Extracted token length:', token.length)

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    })

    console.log('🔍 Verifying user authentication...')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('❌ Authentication failed:', authError)
      throw new Error('User not authenticated')
    }

    console.log('✅ User authenticated:', user.id)

    // Parse request body
    const rawBody = await req.text()
    console.log('📝 Raw request body:', rawBody)
    console.log('📝 Body length:', rawBody.length)

    const body = JSON.parse(rawBody)
    console.log('📝 Parsed request body:', body)

    const { conversationId } = body
    console.log('🔍 Extracted conversationId:', conversationId)

    if (!conversationId) {
      throw new Error('Missing conversationId in request body')
    }

    console.log('🗑️ Starting conversation deletion process...')

    // First, verify the conversation exists and user has permission
    console.log('🔍 Verifying conversation ownership...')
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select('id, user_id, expert_id')
      .eq('id', conversationId)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching conversation:', fetchError)
      throw new Error(`Conversation not found: ${fetchError.message}`)
    }

    console.log('✅ Conversation found:', conversation)

    // Check if user is either the conversation participant or an expert
    const isAuthorized = conversation.user_id === user.id || conversation.expert_id === user.id
    
    if (!isAuthorized) {
      console.error('❌ User not authorized to delete this conversation')
      throw new Error('Not authorized to delete this conversation')
    }

    console.log('✅ User authorized to delete conversation')

    // Delete all messages first (due to foreign key constraints)
    console.log('🗑️ Deleting messages...')
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId)

    if (messagesError) {
      console.error('❌ Error deleting messages:', messagesError)
      throw new Error(`Failed to delete messages: ${messagesError.message}`)
    }

    console.log('✅ Messages deleted successfully')

    // Delete the conversation
    console.log('🗑️ Deleting conversation...')
    const { error: conversationError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)

    if (conversationError) {
      console.error('❌ Error deleting conversation:', conversationError)
      throw new Error(`Failed to delete conversation: ${conversationError.message}`)
    }

    console.log('✅ Conversation deleted successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Conversation deleted successfully',
        conversationId 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Error in delete-conversation function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
