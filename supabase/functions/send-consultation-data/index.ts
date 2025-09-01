
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const MARCO_NIGRO_ID = "07c7fe19-33c3-4782-b9a0-4e87c8aa7044";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const regularClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await regularClient.auth.getUser(token);
    
    if (!user) {
      console.error("❌ User not authenticated");
      throw new Error("User not authenticated");
    }

    const { conversationId, plantData, userData, useAI } = await req.json();

    console.log("📤 Received consultation data:", {
      conversationId,
      hasPlantData: !!plantData,
      hasUserData: !!userData,
      useAI,
      senderId: user.id
    });

    if (!conversationId || !plantData || !userData) {
      console.error("❌ Missing required fields");
      throw new Error("Missing required fields: conversationId, plantData, userData");
    }

    // Verifica/crea conversazione
    let { data: conversation } = await supabaseClient
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .maybeSingle();

    if (!conversation) {
      const { data: newConversation, error: createError } = await supabaseClient
        .from('conversations')
        .insert({
          id: conversationId,
          user_id: user.id,
          expert_id: MARCO_NIGRO_ID,
          status: 'active',
          title: `Consulenza per ${plantData.plantName || 'pianta'}`
        })
        .select()
        .single();

      if (createError) {
        console.error("❌ Error creating conversation:", createError);
        throw createError;
      }
      conversation = newConversation;
    }

    // Prepara messaggio automatico completo
    let autoMessage = `🤖 **DATI AUTOMATICI DELLA CONSULTAZIONE**\n\n`;
    
    // Dati utente
    autoMessage += `👤 **UTENTE:**\n`;
    autoMessage += `• Nome: ${userData.firstName} ${userData.lastName}\n`;
    autoMessage += `• Email: ${userData.email}\n`;
    autoMessage += `• Data nascita: ${userData.birthDate}\n`;
    autoMessage += `• Luogo nascita: ${userData.birthPlace}\n\n`;

    // Dati pianta
    autoMessage += `🌱 **PIANTA:**\n`;
    autoMessage += `• Nome: ${plantData.plantName}\n`;
    autoMessage += `• Sintomi: ${plantData.symptoms}\n`;
    autoMessage += `• Frequenza irrigazione: ${plantData.wateringFrequency}\n`;
    autoMessage += `• Esposizione solare: ${plantData.sunExposure}\n`;
    autoMessage += `• Ambiente: ${plantData.environment}\n\n`;

    // Analisi AI se presente
    if (useAI && plantData.aiDiagnosis) {
      autoMessage += `🤖 **ANALISI AI:**\n`;
      if (typeof plantData.aiDiagnosis === 'string') {
        autoMessage += plantData.aiDiagnosis;
      } else {
        autoMessage += `\`\`\`json\n${JSON.stringify(plantData.aiDiagnosis, null, 2)}\n\`\`\``;
      }
      autoMessage += `\n\n`;
    }

    autoMessage += `📸 Immagine allegata: ${plantData.imageUrl ? 'Sì' : 'No'}\n\n`;
    autoMessage += `Ciao Marco, questi sono i dati automatici della consultazione. L'utente attende la tua diagnosi professionale.`;

    // Invia messaggio automatico
    const messageData = {
      conversation_id: conversationId,
      sender_id: user.id,
      recipient_id: MARCO_NIGRO_ID,
      content: autoMessage,
      text: autoMessage,
      image_url: null,
      metadata: {
        timestamp: new Date().toISOString(),
        messageType: 'consultation_data',
        autoSent: true
      }
    };

    const { data: message, error: messageError } = await supabaseClient
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (messageError) {
      console.error("❌ Message insert error:", messageError);
      throw messageError;
    }

    console.log("✅ Consultation data message sent:", message.id);

    // Invia immagine separatamente se presente
    if (plantData.imageUrl) {
      const imageMessageData = {
        conversation_id: conversationId,
        sender_id: user.id,
        recipient_id: MARCO_NIGRO_ID,
        content: '📸 Immagine della pianta per la consultazione',
        text: '📸 Immagine della pianta per la consultazione',
        image_url: plantData.imageUrl,
        metadata: {
          timestamp: new Date().toISOString(),
          messageType: 'consultation_image',
          autoSent: true
        }
      };

      const { error: imageError } = await supabaseClient
        .from('messages')
        .insert(imageMessageData);

      if (imageError) {
        console.error("⚠️ Error sending image:", imageError);
      } else {
        console.log("✅ Consultation image sent");
      }
    }

    // Aggiorna conversazione
    await supabaseClient
      .from('conversations')
      .update({
        last_message_text: autoMessage,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    // Notifica a Marco Nigro
    try {
      await supabaseClient.functions.invoke('send-specialist-notification', {
        body: {
          conversation_id: conversationId,
          sender_id: user.id,
          recipient_id: MARCO_NIGRO_ID,
          message_text: `Nuova consultazione automatica da ${userData.firstName} ${userData.lastName}`,
          expert_email: "marco.nigro@drplant.it",
          user_details: userData,
          image_url: plantData.imageUrl,
          plant_details: plantData
        }
      });
    } catch (notifyError) {
      console.error("⚠️ Error sending notification:", notifyError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: message,
      conversationId: conversationId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("❌ Error in send-consultation-data function:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to send consultation data" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
