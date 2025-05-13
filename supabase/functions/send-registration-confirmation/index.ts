
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
const EMAIL_HOST = Deno.env.get("EMAIL_HOST") || "smtp.sendgrid.net"; // Fixed this to match SendGrid's correct hostname
const EMAIL_PORT = Number(Deno.env.get("EMAIL_PORT")) || 465;
const EMAIL_USERNAME = Deno.env.get("EMAIL_USERNAME") || "";
const EMAIL_PASSWORD = Deno.env.get("EMAIL_PASSWORD") || "";
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "Dr.Plant <noreply@drplant.app>";
const APP_URL = Deno.env.get("APP_URL") || "https://drplant.app";

// Send registration confirmation email with better error handling
async function sendConfirmationEmail(email: string, username: string) {
  const client = new SmtpClient();
  
  try {
    console.log(`Connecting to SMTP server: ${EMAIL_HOST}:${EMAIL_PORT}`);
    console.log(`Using credentials: ${EMAIL_USERNAME} / [password hidden]`);
    
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
              <h1>Welcome to Dr.Plant!</h1>
            </div>
            <div class="content">
              <p class="welcome-text">Hello ${username},</p>
              <p>Thank you for registering with Dr.Plant! Your registration has been successfully confirmed.</p>
              
              <div class="features">
                <h3>With Dr.Plant, you can:</h3>
                <div class="feature-item"><span class="feature-icon">✅</span> Diagnose plant problems using our AI technology</div>
                <div class="feature-item"><span class="feature-icon">✅</span> Get expert advice from professional plant pathologists</div>
                <div class="feature-item"><span class="feature-icon">✅</span> Access our comprehensive plant disease library</div>
                <div class="feature-item"><span class="feature-icon">✅</span> Track your plants' health history over time</div>
              </div>
              
              <p>You can access your account using your email: <strong>${email}</strong></p>
              <a href="${APP_URL}/login" class="button">Login to your account</a>
              
              <div class="security-notice">
                <h3>Important Security Information:</h3>
                <p>For your security, any verification codes (OTPs) sent to you will expire after 15 minutes.</p>
                <p>Always use verification codes immediately after receiving them and never share them with anyone.</p>
              </div>
              
              <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              <p>Best regards,<br>The Dr.Plant Team</p>
            </div>
            <div class="footer">
              <p>© 2025 Dr.Plant. All rights reserved.</p>
              <p>This email was sent to ${email} because you registered on our site.</p>
              <p>If you didn't register for Dr.Plant, please <a href="${APP_URL}/contact">contact our support team</a>.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log(`Sending email to: ${email}`);
    
    await client.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Welcome to Dr.Plant! Registration Confirmed",
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
  console.log("Registration confirmation request received");
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const { user, email_token } = await req.json();
    
    if (!user || !email_token) {
      console.error("Missing user or email_token in request");
      throw new Error("Missing user or email_token");
    }
    
    console.log(`Processing registration for user: ${user.email}`);
    
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
    
    console.log(`Profile created successfully for: ${user.email}`);
    
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
