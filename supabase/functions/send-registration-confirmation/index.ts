
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';

console.log("Starting send-registration-confirmation function");

// Supabase credentials
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Email configuration - using SendGrid API
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "noreply@drplant.app";
const APP_URL = Deno.env.get("APP_URL") || "https://plant-patho-pal.lovable.app";

// Debug log di tutti i parametri di configurazione
console.log("Configuration:", {
  SUPABASE_URL: SUPABASE_URL ? "Set" : "Not set",
  SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Not set",
  EMAIL_FROM,
  APP_URL,
  SENDGRID_API_KEY: SENDGRID_API_KEY ? "Set" : "Not set",
});

// SendGrid API for email sending
async function sendWithSendGridAPI(toEmail: string, username: string, confirmationUrl?: string) {
  if (!SENDGRID_API_KEY) {
    throw new Error("SendGrid API key is not configured");
  }

  console.log(`Using SendGrid API to send email to ${toEmail}`);

  // Create the email template
  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 28px; }
          .logo { width: 80px; height: 80px; margin: 0 auto 20px; background-color: white; padding: 10px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
          .content { padding: 30px; background-color: #f9fafb; border-left: 1px solid #eaeaea; border-right: 1px solid #eaeaea; }
          .welcome-text { font-size: 18px; margin-bottom: 25px; }
          .features { background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .feature-item { margin-bottom: 15px; display: flex; align-items: center; }
          .feature-icon { margin-right: 10px; color: #10b981; }
          .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold; }
          .security-notice { margin-top: 25px; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; border-top: 1px solid #eaeaea; background-color: #f9fafb; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🌱</div>
            <h1>Benvenuto su Dr.Plant!</h1>
          </div>
          <div class="content">
            <p class="welcome-text">Ciao ${username},</p>
            <p>Grazie per esserti registrato su Dr.Plant! La tua registrazione è stata completata con successo.</p>
            
            <div class="features">
              <h3>Con Dr.Plant, puoi:</h3>
              <div class="feature-item"><span class="feature-icon">✅</span> Diagnosticare problemi delle piante usando la nostra tecnologia AI</div>
              <div class="feature-item"><span class="feature-icon">✅</span> Ottenere consigli da esperti patologi vegetali professionisti</div>
              <div class="feature-item"><span class="feature-icon">✅</span> Accedere alla nostra completa libreria di malattie delle piante</div>
              <div class="feature-item"><span class="feature-icon">✅</span> Tenere traccia della salute delle tue piante nel tempo</div>
            </div>
            
            <p>Puoi accedere al tuo account usando la tua email: <strong>${toEmail}</strong></p>
            <div style="text-align: center;">
              <a href="${APP_URL}/login" class="button">Accedi al tuo account</a>
            </div>
            
            <div class="security-notice">
              <h3>Inizia subito!</h3>
              <p>Il tuo account è pronto per l'uso. Accedi ora per iniziare a prenderti cura delle tue piante con l'aiuto dei nostri esperti.</p>
            </div>
            
            <p>Se hai domande o hai bisogno di assistenza, non esitare a contattare il nostro team di supporto.</p>
            <p>Cordiali saluti,<br>Il Team Dr.Plant</p>
          </div>
          <div class="footer">
            <p>© 2025 Dr.Plant. Tutti i diritti riservati.</p>
            <p>Questa email è stata inviata a ${toEmail} perché ti sei registrato sul nostro sito.</p>
            <p>Se non ti sei registrato per Dr.Plant, <a href="${APP_URL}/contact">contatta il nostro team di supporto</a>.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  console.log("About to call SendGrid API");
  
  try {
    // Call SendGrid API using v3 Mail Send API
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SENDGRID_API_KEY}`
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [
              {
                email: toEmail
              }
            ]
          }
        ],
        from: {
          email: "noreply@drplant.app",
          name: "Dr.Plant"
        },
        subject: "Benvenuto su Dr.Plant! Registrazione Confermata",
        content: [
          {
            type: "text/html",
            value: htmlContent
          }
        ]
      })
    });
    
    console.log(`SendGrid API response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error("SendGrid API error:", errorData);
      throw new Error(`SendGrid API error: ${response.status} ${response.statusText}. Details: ${errorData}`);
    }
    
    console.log("✅ Email sent successfully via SendGrid API");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to send via SendGrid API:", error.message);
    throw error;
  }
}

// Send registration confirmation email
async function sendConfirmationEmail(email: string, username: string, confirmationUrl?: string) {
  try {
    console.log(`Attempting to send email to ${email} using username ${username}`);
    
    if (!SENDGRID_API_KEY) {
      console.error("❌ SendGrid API key not configured");
      throw new Error("Email service not configured");
    }
    
    await sendWithSendGridAPI(email, username, confirmationUrl);
    console.log(`✅ Confirmation email sent to ${email} successfully`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Error sending email to ${email}:`, error);
    throw error;
  }
}

serve(async (req) => {
  console.log("🚀 Registration confirmation webhook received");
  console.log("Method:", req.method);
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    let body;
    try {
      const rawBody = await req.text();
      console.log("Raw body:", rawBody);
      
      if (rawBody) {
        body = JSON.parse(rawBody);
      } else {
        body = {};
      }
    } catch (error) {
      console.error("Error parsing JSON body:", error);
      body = {}; // Default to empty object if parsing fails
    }
    
    console.log("Parsed request body:", JSON.stringify(body, null, 2));
    
    // Handle both direct calls and Supabase auth webhook format
    const user = body.record || body.user || body;
    const email = user?.email || body.email;
    
    if (!email) {
      console.error("❌ Missing email in request");
      console.log("Available data:", JSON.stringify(body, null, 2));
      throw new Error("Missing email in request");
    }
    
    console.log(`📧 Processing registration confirmation for: ${email}`);
    
    // Initialize Supabase client with service role to access auth admin functions
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Create user profile in the database if user ID is available
    if (user?.id) {
      console.log(`👤 Creating profile for user ID: ${user.id}`);
      
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
        
      if (!existingProfile) {
        const username = email.split('@')[0];
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: user.id,
            email: email,
            username: username,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
            
        if (profileError) {
          console.error("❌ Error creating profile:", profileError);
        } else {
          console.log(`✅ Profile created successfully for: ${email}`);
        }
      } else {
        console.log(`👤 Profile already exists for: ${email}`);
      }
    }
    
    // Send confirmation email
    try {
      const username = email.split('@')[0];
      console.log(`📤 Sending confirmation email to: ${email}`);
      
      await sendConfirmationEmail(email, username);
      console.log(`✅ Confirmation email sent successfully to: ${email}`);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Registration confirmation email sent successfully"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    } catch (emailError) {
      console.error("❌ Error sending email:", emailError);
      
      // Still return success to avoid blocking user registration
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "User registered successfully, but email sending failed",
          warning: emailError.message 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }
    
  } catch (error: any) {
    console.error("❌ Error during registration confirmation:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
