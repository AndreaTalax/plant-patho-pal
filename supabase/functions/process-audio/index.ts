
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
      throw new Error("User not authenticated");
    }

    const formData = await req.formData();
    const conversationId = formData.get('conversationId') as string;
    const senderId = formData.get('senderId') as string;
    const recipientId = formData.get('recipientId') as string;
    const audioFile = formData.get('audio') as File;

    if (!conversationId || !senderId || !recipientId || !audioFile) {
      throw new Error("Missing required fields");
    }

    console.log("📤 Processing audio message:", {
      conversationId,
      senderId,
      recipientId,
      audioSize: audioFile.size
    });

    // Upload audio to storage
    const fileName = `audio_${Date.now()}_${Math.random().toString(36).substring(7)}.webm`;
    const filePath = `${senderId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('plant-images')
      .upload(filePath, audioFile, {
        contentType: 'audio/webm',
        upsert: false
      });

    if (uploadError) {
      console.error("❌ Storage upload error:", uploadError);
      throw new Error("Failed to upload audio file");
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('plant-images')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error("Failed to get audio URL");
    }

    console.log("✅ Audio uploaded:", urlData.publicUrl);

    // Insert message with audio URL
    const messageData = {
      conversation_id: conversationId,
      sender_id: senderId,
      recipient_id: recipientId,
      content: "🎵 Messaggio vocale",
      text: "🎵 Messaggio vocale",
      image_url: urlData.publicUrl,
      metadata: {
        timestamp: new Date().toISOString(),
        messageType: 'audio',
        audioUrl: urlData.publicUrl
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

    console.log("✅ Audio message inserted:", message.id);

    // Update conversation
    const { error: updateError } = await supabaseClient
      .from('conversations')
      .update({
        last_message_text: "🎵 Messaggio vocale",
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (updateError) {
      console.error("⚠️ Warning: Could not update conversation:", updateError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: message,
      audioUrl: urlData.publicUrl
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("❌ Error in process-audio function:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to process audio message" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
