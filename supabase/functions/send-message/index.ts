
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
    // Create client with service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Also create regular client for auth verification
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

    const { conversationId, recipientId, text, imageUrl, products } = await req.json();

    console.log("📤 Received message data:", {
      conversationId,
      recipientId,
      textLength: text?.length || 0,
      hasImage: !!imageUrl,
      hasProducts: !!products,
      senderId: user.id
    });

    if (!conversationId || !recipientId || !text) {
      console.error("❌ Missing required fields:", { conversationId, recipientId, text });
      throw new Error("Missing required fields: conversationId, recipientId, text");
    }

    // Use service role client to bypass RLS for conversation lookup/creation
    let { data: conversation, error: conversationError } = await supabaseClient
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .maybeSingle();

    if (conversationError) {
      console.error("❌ Conversation query error:", conversationError);
      throw new Error("Error checking conversation access");
    }

    // If conversation doesn't exist, create it using service role
    if (!conversation) {
      console.log("🆕 Creating new conversation with service role");
      const { data: newConversation, error: createError } = await supabaseClient
        .from('conversations')
        .insert({
          id: conversationId,
          user_id: user.id === MARCO_NIGRO_ID ? recipientId : user.id,
          expert_id: MARCO_NIGRO_ID,
          status: 'active',
          title: 'Consulenza esperto'
        })
        .select()
        .single();

      if (createError) {
        console.error("❌ Error creating conversation with service role:", createError);
        throw new Error("Failed to create conversation");
      }
      
      conversation = newConversation;
      console.log("✅ New conversation created with service role:", conversation.id);
    }

    console.log("✅ Conversation ready");

    // Insert the message using service role to bypass RLS
    const messageData = {
      conversation_id: conversationId,
      sender_id: user.id,
      recipient_id: recipientId,
      content: text,
      text: text,
      image_url: imageUrl || null,
      products: products || null,
      metadata: {
        timestamp: new Date().toISOString(),
        messageType: imageUrl ? 'image' : 'text'
      }
    };

    console.log("💾 Inserting message with service role:", messageData);

    const { data: message, error: messageError } = await supabaseClient
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (messageError) {
      console.error("❌ Message insert error:", messageError);
      throw messageError;
    }

    console.log("✅ Message inserted successfully:", message.id);

    // Update conversation last message using service role
    const { error: updateError } = await supabaseClient
      .from('conversations')
      .update({
        last_message_text: text,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (updateError) {
      console.error("⚠️ Warning: Could not update conversation:", updateError);
    }

    // Send notification to Marco Nigro if he's the recipient
    if (recipientId === MARCO_NIGRO_ID && user.id !== MARCO_NIGRO_ID) {
      console.log("🔔 Sending notification to Marco Nigro");
      
      // Get sender profile for notification
      const { data: senderProfile } = await supabaseClient
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', user.id)
        .single();

      const senderName = senderProfile 
        ? `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim() || senderProfile.email
        : 'Utente sconosciuto';

      // Call notification service
      try {
        const { error: notifyError } = await supabaseClient.functions.invoke('send-specialist-notification', {
          body: {
            conversation_id: conversationId,
            sender_id: user.id,
            recipient_id: recipientId,
            message_text: text,
            expert_email: "marco.nigro@drplant.it",
            user_details: {
              id: user.id,
              firstName: senderProfile?.first_name || '',
              lastName: senderProfile?.last_name || '',
              email: senderProfile?.email || ''
            },
            image_url: imageUrl,
            plant_details: products
          }
        });

        if (notifyError) {
          console.error("⚠️ Error sending notification:", notifyError);
        } else {
          console.log("✅ Notification sent successfully");
        }
      } catch (notifyError) {
        console.error("⚠️ Error in notification service:", notifyError);
      }
    }

    // Send notification to user if Marco replies
    if (user.id === MARCO_NIGRO_ID && recipientId !== MARCO_NIGRO_ID) {
      console.log("🔔 Sending reply notification to user");
      
      // Get recipient profile for notification
      const { data: recipientProfile } = await supabaseClient
        .from('profiles')
        .select('email')
        .eq('id', recipientId)
        .single();

      if (recipientProfile?.email) {
        try {
          const { error: notifyError } = await supabaseClient.functions.invoke('send-specialist-notification', {
            body: {
              conversation_id: conversationId,
              sender_id: user.id,
              recipient_id: recipientId,
              message_text: text,
              recipient_email: recipientProfile.email,
              user_details: {
                id: recipientId
              }
            }
          });

          if (notifyError) {
            console.error("⚠️ Error sending user notification:", notifyError);
          } else {
            console.log("✅ User notification sent successfully");
          }
        } catch (notifyError) {
          console.error("⚠️ Error in user notification service:", notifyError);
        }
      }
    }

    console.log("✅ Send message operation completed successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      message: message,
      conversationId: conversationId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("❌ Error in send-message function:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to send message" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
