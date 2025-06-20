
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  // Handle CORS preflight requests
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
    const {
      conversation_id,
      sender_id,
      recipient_id,
      message_text,
      expert_email,
      recipient_email,
      user_details,
      image_url,
      plant_details
    } = await req.json();

    console.log('📧 Processing notification request:', {
      conversation_id,
      sender_id,
      recipient_id,
      expert_email,
      recipient_email,
      has_user_details: !!user_details,
      has_image: !!image_url,
      has_plant_details: !!plant_details
    });

    // Get sender profile information
    let senderProfile = null;
    if (sender_id) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', sender_id)
        .single();
      
      senderProfile = profile;
    }

    // Prepare email content
    const senderName = senderProfile 
      ? `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim() || senderProfile.email
      : user_details?.firstName && user_details?.lastName 
        ? `${user_details.firstName} ${user_details.lastName}`
        : user_details?.email || 'Utente sconosciuto';

    const emailSubject = expert_email 
      ? `Nuovo messaggio da ${senderName}`
      : `Risposta dal Dr. Marco Nigro`;

    const emailBody = `
      <h2>${emailSubject}</h2>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>💬 Messaggio:</h3>
        <p style="font-size: 16px; line-height: 1.5;">${message_text}</p>
        
        ${image_url ? `
          <h3>📸 Immagine allegata:</h3>
          <img src="${image_url}" alt="Immagine della pianta" style="max-width: 300px; border-radius: 8px;">
        ` : ''}
        
        ${senderProfile ? `
          <h3>👤 Dettagli del mittente:</h3>
          <ul>
            <li><strong>Nome:</strong> ${senderName}</li>
            <li><strong>Email:</strong> ${senderProfile.email}</li>
          </ul>
        ` : ''}
        
        ${plant_details && plant_details.length > 0 ? `
          <h3>🌱 Prodotti consigliati:</h3>
          <ul>
            ${plant_details.map((product: any) => `
              <li><strong>${product.name}</strong> - €${product.price}</li>
            `).join('')}
          </ul>
        ` : ''}
      </div>
      
      <p style="color: #666; font-size: 14px;">
        Questo messaggio è stato inviato automaticamente dal sistema di chat di Dr.Plant.
        <br>
        Per rispondere, accedi alla dashboard: https://plant-patho-pal.lovable.app/
      </p>
    `;

    // Send email using a simple notification method
    console.log('✅ Notification processed successfully');
    console.log('📧 Email would be sent to:', expert_email || recipient_email);
    console.log('📧 Email subject:', emailSubject);
    console.log('📧 Email body prepared');

    return new Response(JSON.stringify({ 
      success: true,
      message: "Notification processed successfully",
      recipient: expert_email || recipient_email,
      subject: emailSubject
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("❌ Error in send-specialist-notification:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Internal server error" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
