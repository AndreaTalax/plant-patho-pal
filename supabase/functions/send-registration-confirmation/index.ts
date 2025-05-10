
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

console.log("Hello from send-registration-confirmation");

// Supabase credentials
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Email configuration - reading from environment variables
const EMAIL_HOST = Deno.env.get("EMAIL_HOST") || "smtp.sendgrid.net"; 
const EMAIL_PORT = Number(Deno.env.get("EMAIL_PORT")) || 465;
const EMAIL_USERNAME = Deno.env.get("EMAIL_USERNAME") || "";
const EMAIL_PASSWORD = Deno.env.get("EMAIL_PASSWORD") || "";
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "Plant Patho Pal <noreply@plantpathopal.app>";
const APP_URL = Deno.env.get("APP_URL") || "https://plantpathopal.app";

// Send registration confirmation email
async function sendConfirmationEmail(email: string, username: string) {
  const client = new SmtpClient();
  
  try {
    await client.connectTLS({
      hostname: EMAIL_HOST,
      port: EMAIL_PORT,
      username: EMAIL_USERNAME,
      password: EMAIL_PASSWORD,
    });

    const message = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Benvenuto su Plant Patho Pal!</h1>
            </div>
            <div class="content">
              <p>Ciao ${username},</p>
              <p>Grazie per esserti registrato a Plant Patho Pal! La tua registrazione è stata confermata con successo.</p>
              <p>Con Plant Patho Pal, puoi:</p>
              <ul>
                <li>Diagnosticare problemi delle tue piante</li>
                <li>Ricevere consigli personalizzati da esperti</li>
                <li>Accedere alla nostra libreria di risorse e informazioni</li>
              </ul>
              <p>Puoi accedere al tuo account utilizzando la tua email: <strong>${email}</strong></p>
              <p>Se hai domande o hai bisogno di assistenza, non esitare a contattarci.</p>
              <p>Cordiali saluti,<br>Il team di Plant Patho Pal</p>
            </div>
            <div class="footer">
              <p>© 2025 Plant Patho Pal. Tutti i diritti riservati.</p>
              <p>Questa email è stata inviata a ${email} perché ti sei registrato sul nostro sito.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await client.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Benvenuto su Plant Patho Pal!",
      content: message,
      html: message,
    });

    console.log(`Email di conferma inviata a ${email} con successo`);
    await client.close();
  } catch (error) {
    console.error(`Errore nell'invio dell'email a ${email}:`, error);
    await client.close();
    throw error;
  }
}

serve(async (req) => {
  // This Edge Function is automatically triggered by Supabase Auth when a user signs up
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const { user, email_token } = await req.json();
    
    if (!user || !email_token) {
      throw new Error("Missing user or email_token");
    }
    
    // Initialize Supabase client with service role to access auth admin functions
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Create user profile in the database
    const username = user.email.split('@')[0];
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        username: username,
        created_at: new Date(),
        updated_at: new Date()
      });
      
    if (profileError) {
      console.error("Errore nella creazione del profilo:", profileError);
      throw profileError;
    }
    
    // Send confirmation email
    try {
      await sendConfirmationEmail(user.email, username);
      console.log(`Email di conferma inviata a ${user.email}`);
    } catch (emailError) {
      console.error("Errore nell'invio dell'email di conferma:", emailError);
      // Continuiamo anche se l'invio dell'email fallisce, l'utente è comunque registrato
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Utente registrato, ma si è verificato un errore nell'invio dell'email" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Errore durante la registrazione:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
