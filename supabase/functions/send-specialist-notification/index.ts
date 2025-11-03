import { serve } from "[https://deno.land/std@0.168.0/http/server.ts](https://deno.land/std@0.168.0/http/server.ts)";
import { createClient } from "[https://esm.sh/@supabase/supabase-js@2](https://esm.sh/@supabase/supabase-js@2)";
import { Resend } from "npm:resend@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseAdmin = createClient(
Deno.env.get("SUPABASE_URL") ?? "",
Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// ✅ Tutte le email vanno solo a Marco Nigro
const ADMIN_EMAIL = "[agrotecnicomarconigro@gmail.com](mailto:agrotecnicomarconigro@gmail.com)";

serve(async (req) => {
if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
if (req.method !== "POST")
return new Response(JSON.stringify({ error: "Method not allowed" }), {
status: 405,
headers: { ...corsHeaders, "Content-Type": "application/json" },
});

try {
const { conversation_id, sender_id, message_text, image_url } = await req.json();

```
console.log("📩 Preparing email to Marco Nigro for message:", {
  conversation_id,
  sender_id,
  has_image: !!image_url,
});

// Recupera il profilo del mittente
let senderProfile = null;
if (sender_id) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("first_name, last_name, email")
    .eq("id", sender_id)
    .single();
  senderProfile = data;
}

const senderName = senderProfile
  ? `${senderProfile.first_name || ""} ${senderProfile.last_name || ""}`.trim() ||
    senderProfile.email
  : "Utente sconosciuto";

const emailSubject = `🌿 Dr.Plant - Nuovo messaggio da ${senderName}`;

const emailBody = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <img src="https://drplant.lovable.app/lovable-uploads/72d5a60c-404a-4167-9430-511af91c523b.png" alt="Dr.Plant Logo" style="height: 60px;">
      <h1 style="color: #1e40af; margin: 10px 0;">Dr.Plant</h1>
    </div>

    <div style="background-color: #f8fafc; padding: 25px; border-radius: 10px; border-left: 4px solid #10b981;">
      <h2 style="color: #1e40af; margin-top: 0;">Hai ricevuto un nuovo messaggio da ${senderName}</h2>
      
      <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 10px 0; padding: 15px; background-color: #f9fafb; border-radius: 6px;">
        ${message_text}
      </p>

      ${
        image_url
          ? `<div style="text-align: center; margin-top: 20px;">
               <img src="${image_url}" alt="Immagine inviata" style="max-width:100%; border-radius:8px;">
             </div>`
          : ""
      }

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://drplant.lovable.app/?conversation=${conversation_id}" 
           style="display: inline-block; background: #1e40af; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">
          Apri conversazione
        </a>
      </div>
    </div>

    <div style="text-align: center; margin-top: 30px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
      Email automatica da Dr.Plant Chat System
    </div>
  </div>
`;

// ✅ Invia email solo a Marco Nigro
const emailResponse = await resend.emails.send({
  from: "Dr.Plant <noreply@drplant.lovable.app>",
  to: [ADMIN_EMAIL],
  subject: emailSubject,
  html: emailBody,
});

console.log("✅ Email inviata con successo a Marco Nigro:", emailResponse);

// Log nel database (facoltativo)
const { error: notificationError } = await supabaseAdmin.from("notifications").insert({
  user_id: sender_id,
  title: `Nuovo messaggio da ${senderName}`,
  message: message_text.slice(0, 200),
  type: "message",
  data: { conversation_id },
});

if (notificationError) console.error("⚠️ Errore salvataggio notifica:", notificationError);

return new Response(
  JSON.stringify({ success: true, recipient: ADMIN_EMAIL, emailResponse }),
  {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  }
);
```

} catch (error) {
console.error("❌ Errore in send-specialist-notification:", error);
return new Response(JSON.stringify({ error: error.message }), {
status: 500,
headers: { ...corsHeaders, "Content-Type": "application/json" },
});
}
});
