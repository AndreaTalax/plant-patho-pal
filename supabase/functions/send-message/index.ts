
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

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
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    
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

    // Verify user has access to this conversation
    const { data: conversation, error: conversationError } = await supabaseClient
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .or(`user_id.eq.${user.id},expert_id.eq.${user.id}`)
      .single();

    if (conversationError || !conversation) {
      console.error("❌ Conversation access error:", conversationError);
      throw new Error("Conversation not found or access denied");
    }

    console.log("✅ Conversation access verified");

    // Insert the message
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

    console.log("💾 Inserting message:", messageData);

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

    // Update conversation last message
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
      // Non bloccare il processo se l'update della conversazione fallisce
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
