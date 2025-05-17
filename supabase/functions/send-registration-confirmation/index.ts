
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

console.log("Starting send-registration-confirmation function");

// Supabase credentials
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Email configuration - using SendGrid's correct hostname
const EMAIL_HOST = Deno.env.get("EMAIL_HOST") || "smtp.sendgrid.net";
const EMAIL_PORT = Number(Deno.env.get("EMAIL_PORT")) || 465;
const EMAIL_USERNAME = Deno.env.get("EMAIL_USERNAME") || "";
const EMAIL_PASSWORD = Deno.env.get("EMAIL_PASSWORD") || "";
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "Dr.Plant <noreply@drplant.app>";
const APP_URL = Deno.env.get("APP_URL") || "https://drplant.app";

// Either use SMTP or SendGrid API depending on availability of API key
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");

// Debug log di tutti i parametri di configurazione
console.log("Configuration:", {
  SUPABASE_URL: SUPABASE_URL ? "Set" : "Not set",
  SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Not set",
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USERNAME: EMAIL_USERNAME ? "Set" : "Not set",
  EMAIL_PASSWORD: EMAIL_PASSWORD ? "Set" : "Not set",
  EMAIL_FROM,
  APP_URL,
  SENDGRID_API_KEY: SENDGRID_API_KEY ? "Set" : "Not set",
});

// SendGrid API for email sending when API key is available
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
            <p>${confirmationUrl 
              ? 'Grazie per esserti registrato su Dr.Plant! Conferma la tua email per completare la registrazione.' 
              : 'Grazie per esserti registrato su Dr.Plant! La tua registrazione è stata completata.'}
            </p>
            
            ${confirmationUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" class="button">Conferma la tua email</a>
            </div>
            <p>Se il pulsante sopra non funziona, puoi copiare e incollare il seguente link nel tuo browser:</p>
            <p style="word-break: break-all; background-color: #f0f9ff; padding: 10px; border-radius: 4px; font-size: 14px;">
              ${confirmationUrl}
            </p>
            ` : ''}
            
            <div class="features">
              <h3>Con Dr.Plant, puoi:</h3>
              <div class="feature-item"><span class="feature-icon">✅</span> Diagnosticare problemi delle piante usando la nostra tecnologia AI</div>
              <div class="feature-item"><span class="feature-icon">✅</span> Ottenere consigli da esperti patologi vegetali professionisti</div>
              <div class="feature-item"><span class="feature-icon">✅</span> Accedere alla nostra completa libreria di malattie delle piante</div>
              <div class="feature-item"><span class="feature-icon">✅</span> Tenere traccia della salute delle tue piante nel tempo</div>
            </div>
            
            <p>Puoi accedere al tuo account usando la tua email: <strong>${toEmail}</strong></p>
            <a href="${APP_URL}/login" class="button">Accedi al tuo account</a>
            
            <div class="security-notice">
              <h3>Informazioni importanti sulla sicurezza:</h3>
              <p>Per la tua sicurezza, i link di conferma e i codici di verifica (OTP) inviati a te scadranno dopo 24 ore.</p>
              <p>Usa sempre i codici di verifica immediatamente dopo averli ricevuti e non condividerli mai con nessuno.</p>
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
          email: EMAIL_FROM.includes('<') ? EMAIL_FROM.match(/<(.+)>/)?.[1] || "noreply@drplant.app" : EMAIL_FROM,
          name: "Dr.Plant"
        },
        subject: confirmationUrl 
          ? "Conferma la tua Email - Registrazione Dr.Plant" 
          : "Benvenuto su Dr.Plant! Registrazione Confermata",
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
    
    const result = await response.json();
    console.log("SendGrid API response:", result);
    return result;
  } catch (error: any) {
    console.error("Failed to send via SendGrid API:", error.message);
    throw error;
  }
}

// Send registration confirmation email with better error handling
async function sendConfirmationEmail(email: string, username: string, confirmationUrl?: string) {
  try {
    console.log(`Attempting to send email to ${email} using username ${username}`);
    
    // Try SendGrid API first if API key is configured
    if (SENDGRID_API_KEY) {
      console.log("Using SendGrid API for email delivery");
      try {
        return await sendWithSendGridAPI(email, username, confirmationUrl);
      } catch (sendgridError) {
        console.error("SendGrid API failed:", sendgridError);
        console.log("Falling back to SMTP...");
        // Fall back to SMTP if SendGrid API fails
      }
    } else {
      console.log("No SendGrid API key found, using SMTP");
    }
    
    // SMTP Configuration validation
    if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USERNAME || !EMAIL_PASSWORD) {
      throw new Error("SMTP configuration incomplete. Check EMAIL_HOST, EMAIL_PORT, EMAIL_USERNAME, EMAIL_PASSWORD");
    }
    
    const client = new SmtpClient();
    
    console.log(`Connecting to SMTP server: ${EMAIL_HOST}:${EMAIL_PORT}`);
    console.log(`Using credentials: ${EMAIL_USERNAME} / [password hidden]`);
    
    try {
      await client.connectTLS({
        hostname: EMAIL_HOST,
        port: EMAIL_PORT,
        username: EMAIL_USERNAME,
        password: EMAIL_PASSWORD,
      });

      console.log("Connected to SMTP server successfully");
      
      // Create an improved email template with better design and branding
      const message = `
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
                <p>${confirmationUrl 
                  ? 'Grazie per esserti registrato su Dr.Plant! Conferma la tua email per completare la registrazione.' 
                  : 'Grazie per esserti registrato su Dr.Plant! La tua registrazione è stata completata.'}
                </p>
                
                ${confirmationUrl ? `
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${confirmationUrl}" class="button">Conferma la tua email</a>
                </div>
                <p>Se il pulsante sopra non funziona, puoi copiare e incollare il seguente link nel tuo browser:</p>
                <p style="word-break: break-all; background-color: #f0f9ff; padding: 10px; border-radius: 4px; font-size: 14px;">
                  ${confirmationUrl}
                </p>
                ` : ''}
                
                <div class="features">
                  <h3>Con Dr.Plant, puoi:</h3>
                  <div class="feature-item"><span class="feature-icon">✅</span> Diagnosticare problemi delle piante usando la nostra tecnologia AI</div>
                  <div class="feature-item"><span class="feature-icon">✅</span> Ottenere consigli da esperti patologi vegetali professionisti</div>
                  <div class="feature-item"><span class="feature-icon">✅</span> Accedere alla nostra completa libreria di malattie delle piante</div>
                  <div class="feature-item"><span class="feature-icon">✅</span> Tenere traccia della salute delle tue piante nel tempo</div>
                </div>
                
                <p>Puoi accedere al tuo account usando la tua email: <strong>${email}</strong></p>
                <a href="${APP_URL}/login" class="button">Accedi al tuo account</a>
                
                <div class="security-notice">
                  <h3>Informazioni importanti sulla sicurezza:</h3>
                  <p>Per la tua sicurezza, i link di conferma e i codici di verifica (OTP) inviati a te scadranno dopo 24 ore.</p>
                  <p>Usa sempre i codici di verifica immediatamente dopo averli ricevuti e non condividerli mai con nessuno.</p>
                </div>
                
                <p>Se hai domande o hai bisogno di assistenza, non esitare a contattare il nostro team di supporto.</p>
                <p>Cordiali saluti,<br>Il Team Dr.Plant</p>
              </div>
              <div class="footer">
                <p>© 2025 Dr.Plant. Tutti i diritti riservati.</p>
                <p>Questa email è stata inviata a ${email} perché ti sei registrato sul nostro sito.</p>
                <p>Se non ti sei registrato per Dr.Plant, <a href="${APP_URL}/contact">contatta il nostro team di supporto</a>.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      console.log(`Sending email to: ${email}`);
      
      await client.send({
        from: EMAIL_FROM,
        to: email,
        subject: confirmationUrl 
          ? "Conferma la tua Email - Registrazione Dr.Plant" 
          : "Benvenuto su Dr.Plant! Registrazione Confermata",
        content: message,
        html: message,
      });

      console.log(`Confirmation email sent to ${email} successfully`);
      await client.close();
      return { success: true };
    } catch (smtpError) {
      console.error("SMTP error:", smtpError);
      await client.close().catch(closeError => console.error("Error closing SMTP connection:", closeError));
      throw smtpError;
    }
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
    throw error;
  }
}

serve(async (req) => {
  // This Edge Function is automatically triggered by Supabase Auth when a user signs up
  console.log("Registration confirmation request received");
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error("Error parsing JSON body:", error);
      body = {}; // Default to empty object if parsing fails
    }
    
    console.log("Request body:", body);
    
    const { user, email, confirmationToken, confirmationUrl } = body;
    
    if (!user && !email) {
      console.error("Missing user or email in request");
      throw new Error("Missing user or email");
    }
    
    const userEmail = user?.email || email;
    console.log(`Processing registration for user: ${userEmail}`);
    
    // Initialize Supabase client with service role to access auth admin functions
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Create user profile in the database if not already exists
    if (user?.id) {
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
        
      if (!existingProfile) {
        const username = userEmail.split('@')[0];
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: user.id,
            email: userEmail,
            username: username,
            created_at: new Date(),
            updated_at: new Date()
          });
            
        if (profileError) {
          console.error("Error creating profile:", profileError);
        } else {
          console.log(`Profile created successfully for: ${userEmail}`);
        }
      }
    }
    
    // Send confirmation or welcome email based on context
    try {
      const username = userEmail.split('@')[0];
      await sendConfirmationEmail(userEmail, username, confirmationUrl);
      console.log(`Email sent to ${userEmail}`);
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // Continue even if email sending fails, the user is still registered
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "User registered, but an error occurred sending the email",
          error: emailError.message 
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
  } catch (error: any) {
    console.error("Error during registration:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
