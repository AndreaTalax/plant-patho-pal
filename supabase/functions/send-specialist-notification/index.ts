
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

console.log("Hello from send-specialist-notification");

// Get email settings from environment variables
const SMTP_HOSTNAME = Deno.env.get("SMTP_HOSTNAME") || "smtp.example.com";
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT")) || 587;
const SMTP_USERNAME = Deno.env.get("SMTP_USERNAME") || "";
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") || "";
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "no-reply@plantpathopal.com";
const EMAIL_TO = "agrotecnicomarconigro@gmail.com"; // Email dell'Agrotecnico Marco Nigro
const APP_URL = Deno.env.get("APP_URL") || "https://plantpathopal.app";

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const { expertName, userEmail, userName, message } = await req.json();
    
    // Connect to SMTP server using environment variables
    const client = new SmtpClient();
    
    await client.connectTLS({
      hostname: SMTP_HOSTNAME,
      port: SMTP_PORT,
      username: SMTP_USERNAME,
      password: SMTP_PASSWORD,
    });
    
    // Send email to the agrotecnico
    await client.send({
      from: EMAIL_FROM,
      to: EMAIL_TO, // L'email dell'Agrotecnico Marco Nigro
      subject: `Plant Patho Pal: Nuovo messaggio da ${userName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #e6f7e9; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2e7d32;">Plant Patho Pal</h1>
            <p style="color: #555;">Sistema di consulenza specialistica per le piante</p>
          </div>
          
          <p>Ciao ${expertName},</p>
          
          <p>Hai ricevuto un nuovo messaggio da <strong>${userName}</strong> (${userEmail}):</p>
          
          <div style="background-color: #f5f5f5; border-left: 4px solid #2e7d32; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #333;">"${message}"</p>
          </div>
          
          <p>Per rispondere, accedi alla piattaforma Plant Patho Pal e vai alla sezione chat.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${APP_URL}/login" style="background-color: #2e7d32; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accedi alla chat</a>
          </div>
          
          <p style="margin-top: 30px; color: #777; font-size: 12px;">
            Questa è una notifica automatica, per favore non rispondere direttamente a questa email.
          </p>
        </div>
      `,
    });
    
    await client.close();
    
    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error sending email:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
