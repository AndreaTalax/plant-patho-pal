
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const pathologistEmail = "fitopatologo@example.com"; // Replace with actual pathologist email

interface ConsultationRequest {
  userId: string;
  imageUrl: string;
  symptoms: string;
  plantInfo: {
    isIndoor: boolean;
    wateringFrequency: number;
  };
  userName?: string;
  userEmail?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body: ConsultationRequest = await req.json();
    
    const { userId, imageUrl, symptoms, plantInfo, userName, userEmail } = body;
    
    if (!userId || !imageUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required data" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Get user information if not provided
    let userFullName = userName;
    let userEmailAddress = userEmail;
    
    if (!userName || !userEmail) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', userId)
        .single();
      
      if (profileData) {
        userFullName = `${profileData.first_name} ${profileData.last_name}`;
        userEmailAddress = profileData.email;
      }
    }
    
    // Create a consultation record
    const { data: consultationData, error: consultationError } = await supabase
      .from('expert_consultations')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        symptoms,
        plant_info: plantInfo,
        status: 'pending'
      })
      .select()
      .single();
    
    if (consultationError) {
      throw consultationError;
    }
    
    // Create chat conversation for this consultation if it doesn't exist
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('is_consultation', true)
      .maybeSingle();
    
    let conversationId = existingConversation?.id;
    
    if (!conversationId) {
      // Create a new conversation
      const { data: newConversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          expert_id: 'pathologist_user_id', // Replace with the actual pathologist user ID
          is_consultation: true,
          last_message_text: 'Nuova richiesta di diagnosi pianta',
          last_message_timestamp: new Date().toISOString()
        })
        .select()
        .single();
      
      if (conversationError) {
        throw conversationError;
      }
      
      conversationId = newConversation.id;
    }
    
    // Send initial message with consultation details
    if (conversationId) {
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          text: `Nuova richiesta di consulto. Sintomi: ${symptoms}. Pianta ${plantInfo.isIndoor ? 'indoor' : 'outdoor'}, annaffiata ${plantInfo.wateringFrequency} volte a settimana.`,
          sent_at: new Date().toISOString(),
          read: false,
          metadata: {
            consultation_id: consultationData.id,
            has_image: true,
            image_url: imageUrl
          }
        });
    }
    
    // Send notification email (mock implementation)
    console.log(`Notifica email inviata a ${pathologistEmail} per consulto da ${userFullName} (${userEmailAddress})`);
    console.log(`Dettagli consulto: ${symptoms}`);
    console.log(`Immagine: ${imageUrl}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Richiesta inviata con successo",
        consultation_id: consultationData.id,
        conversation_id: conversationId
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Errore:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
