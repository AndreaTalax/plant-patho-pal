
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { consultationId, userId, plantInfo, imageUrl } = await req.json();

    console.log('Received notification request:', { consultationId, userId, plantInfo });

    // Get user info for better context
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user profile:', userError);
    }

    // Log the expert notification in the database
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: '6ee6b888-8064-40a1-8b26-0658343f4360', // Marco Nigro ID (expert)
        title: 'Nuova Consulenza Ricevuta',
        message: `Nuova richiesta di consulenza da ${userProfile?.first_name || 'Utente'} ${userProfile?.last_name || ''} per ${plantInfo?.name || 'pianta non identificata'}`,
        type: 'expert_consultation',
        data: {
          consultationId,
          userId,
          plantInfo,
          imageUrl,
          userProfile
        }
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

    // Here you could add email notification logic if needed
    // For now, we'll just log that the notification was processed
    console.log('Expert notification processed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Expert notified successfully',
        consultationId 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Error in notify-expert function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
