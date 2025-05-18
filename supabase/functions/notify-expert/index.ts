
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface NotifyExpertRequest {
  consultationId: string;
  userId: string;
  imageUrl: string;
  symptoms: string;
  plantInfo: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { consultationId, userId, imageUrl, symptoms, plantInfo } = await req.json() as NotifyExpertRequest;

    if (!consultationId || !userId) {
      return new Response(
        JSON.stringify({ error: "Dati richiesti mancanti: consultationId, userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile info
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error("Error getting user profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Errore nel recupero del profilo utente" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User profile retrieved:", userProfile);

    // Get all experts (users with role = 'expert')
    const { data: experts, error: expertsError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, username, first_name, last_name')
      .eq('role', 'master')
      .limit(1);
    
    if (expertsError) {
      console.error("Error getting experts:", expertsError);
      return new Response(
        JSON.stringify({ error: "Errore nel recupero degli esperti" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!experts || experts.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nessun esperto trovato" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const expert = experts[0]; // Get the first expert
    
    // Create a conversation between the user and the expert if it doesn't exist
    const { data: existingConversation, error: convCheckError } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('expert_id', expert.id)
      .single();
    
    let conversationId = existingConversation?.id;
    
    if (!conversationId) {
      // Create new conversation
      const { data: newConversation, error: convError } = await supabaseAdmin
        .from('conversations')
        .insert({
          user_id: userId,
          expert_id: expert.id,
          status: 'active'
        })
        .select('id')
        .single();
      
      if (convError) {
        console.error("Error creating conversation:", convError);
        return new Response(
          JSON.stringify({ error: "Errore nella creazione della conversazione" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      conversationId = newConversation.id;
    }
    
    // Format user profile information
    const userName = userProfile?.first_name || "Utente";
    const userLastName = userProfile?.last_name || "";
    const userBirthDate = userProfile?.birth_date || "Non specificata";
    const userBirthPlace = userProfile?.birth_place || "Non specificato";
    
    // Create a message with the diagnosis information and user details
    if (conversationId) {
      const messageText = `Nuova richiesta di diagnosi:
      
Sintomi: ${symptoms}

Dettagli pianta:
- Ambiente: ${plantInfo.isIndoor ? 'Interno' : 'Esterno'}
- Frequenza irrigazione: ${plantInfo.wateringFrequency} volte a settimana
- Esposizione luce: ${plantInfo.lightExposure}

Informazioni utente:
- Nome: ${userName}
- Cognome: ${userLastName}
- Data di nascita: ${userBirthDate}
- Luogo di nascita: ${userBirthPlace}

ID Consultazione: ${consultationId}`;
      
      // Create message with user info and plant image
      const { error: msgError } = await supabaseAdmin
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          recipient_id: expert.id,
          text: messageText,
          // Include the plant image and details directly in the message
          products: { 
            plantImage: imageUrl,
            consultationId: consultationId,
            plantDetails: {
              isIndoor: plantInfo.isIndoor,
              wateringFrequency: plantInfo.wateringFrequency,
              lightExposure: plantInfo.lightExposure,
              symptoms: symptoms
            },
            userDetails: {
              firstName: userName,
              lastName: userLastName,
              birthDate: userBirthDate,
              birthPlace: userBirthPlace
            }
          }
        });
      
      if (msgError) {
        console.error("Error creating message:", msgError);
        // Continue anyway, we don't want to fail the whole request just because the message failed
      }

      // Send email to the expert
      try {
        console.log(`Sending email notification to expert ${expert.email}`);
        
        await supabaseAdmin.functions.invoke('send-specialist-notification', {
          body: {
            conversation_id: conversationId,
            sender_id: userId,
            recipient_id: expert.id,
            message_text: messageText,
            expert_email: expert.email,
            user_name: userName + " " + userLastName,
            image_url: imageUrl,
            plant_details: plantInfo,
            user_details: {
              firstName: userName,
              lastName: userLastName,
              birthDate: userBirthDate,
              birthPlace: userBirthPlace
            }
          }
        });
        
        console.log("Email notification sent to expert");
      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
        // Continue anyway, don't fail if email sending fails
      }
      
      console.log(`Notifica inviata all'esperto ${expert.username || expert.email} per la consultazione ${consultationId}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notifica inviata con successo all'esperto",
        conversationId
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in notify-expert function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
