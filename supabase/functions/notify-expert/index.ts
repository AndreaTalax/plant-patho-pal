
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MARCO_NIGRO_ID = '07c7fe19-33c3-4782-b9a0-4e87c8aa7044';
const MARCO_NIGRO_EMAIL = 'agrotecnicomarconigro@gmail.com';

serve(async (req) => {
  try {
    const { consultationId, userId, plantInfo, imageUrl } = await req.json()
    
    // Inizializza Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Crea una notifica per Marco Nigro
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: MARCO_NIGRO_ID,
        title: 'Nuova richiesta di consulenza',
        message: `Nuova richiesta per ${plantInfo?.plantType || 'pianta'} da parte dell'utente`,
        type: 'consultation_request',
        data: {
          consultationId,
          userId,
          plantInfo,
          imageUrl
        },
        read: false
      })

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
      throw notificationError
    }

    // Aggiorna la consultazione con l'ID dell'esperto
    const { error: updateError } = await supabase
      .from('consultations')
      .update({ 
        expert_id: MARCO_NIGRO_ID,
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .eq('id', consultationId)

    if (updateError) {
      console.error('Error updating consultation:', updateError)
      throw updateError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Expert notified successfully',
        expertId: MARCO_NIGRO_ID,
        expertEmail: MARCO_NIGRO_EMAIL
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in notify-expert function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
