
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
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "Dr.Plant <noreply@drplant.app>";
const APP_URL = Deno.env.get("APP_URL") || "https://drplant.app";

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
            .security-notice { margin-top: 20px; padding: 10px; background-color: #fef3c7; border-left: 4px solid #f59e0b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Dr.Plant!</h1>
            </div>
            <div class="content">
              <p>Hello ${username},</p>
              <p>Thank you for registering with Dr.Plant! Your registration has been successfully confirmed.</p>
              <p>With Dr.Plant, you can:</p>
              <ul>
                <li>Diagnose your plant problems</li>
                <li>Receive personalized advice from experts</li>
                <li>Access our library of resources and information</li>
              </ul>
              <p>You can access your account using your email: <strong>${email}</strong></p>
              
              <div class="security-notice">
                <h3>Important Security Information:</h3>
                <p>For your security, any verification codes (OTPs) sent to you will expire after 15 minutes.</p>
                <p>Always use verification codes immediately after receiving them and never share them with anyone.</p>
              </div>
              
              <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
              <p>Best regards,<br>The Dr.Plant Team</p>
            </div>
            <div class="footer">
              <p>© 2025 Dr.Plant. All rights reserved.</p>
              <p>This email was sent to ${email} because you registered on our site.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await client.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Welcome to Dr.Plant!",
      content: message,
      html: message,
    });

    console.log(`Confirmation email sent to ${email} successfully`);
    await client.close();
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
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
      console.error("Error creating profile:", profileError);
      throw profileError;
    }
    
    // Send confirmation email
    try {
      await sendConfirmationEmail(user.email, username);
      console.log(`Confirmation email sent to ${user.email}`);
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Continue even if email sending fails, the user is still registered
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "User registered, but an error occurred sending the email" 
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
