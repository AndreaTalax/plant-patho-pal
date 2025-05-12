
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

console.log("Hello from send-specialist-notification");

// Get email settings from environment variables - using consistent naming with send-registration-confirmation
// Changed from "smtp.example.com" to use the same environment variable as registration confirmation
const EMAIL_HOST = Deno.env.get("EMAIL_HOST") || "smtp.sendgrid.net";
const EMAIL_PORT = Number(Deno.env.get("EMAIL_PORT")) || 465;
const EMAIL_USERNAME = Deno.env.get("EMAIL_USERNAME") || "";
const EMAIL_PASSWORD = Deno.env.get("EMAIL_PASSWORD") || "";
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "no-reply@drplant.app";
const EMAIL_TO = "agrotecnicomarconigro@gmail.com"; // Marco Nigro's email
const APP_URL = Deno.env.get("APP_URL") || "https://drplant.app";

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const { expertName, userEmail, userName, message } = await req.json();
    
    // Connect to SMTP server using environment variables
    const client = new SmtpClient();
    
    console.log(`Connecting to SMTP server: ${EMAIL_HOST}:${EMAIL_PORT}`);
    console.log(`Using credentials: ${EMAIL_USERNAME} / [password hidden]`);
    
    await client.connectTLS({
      hostname: EMAIL_HOST,
      port: EMAIL_PORT,
      username: EMAIL_USERNAME,
      password: EMAIL_PASSWORD,
    });
    
    console.log("Connected to SMTP server successfully");
    
    // Send email to the plant pathologist
    console.log(`Sending notification to: ${EMAIL_TO} about message from ${userEmail}`);
    
    await client.send({
      from: EMAIL_FROM,
      to: EMAIL_TO, // Marco Nigro's email
      subject: `Dr.Plant: New message from ${userName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #e6f7e9; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2e7d32;">Dr.Plant</h1>
            <p style="color: #555;">Plant Specialist Consultation System</p>
          </div>
          
          <p>Hello ${expertName},</p>
          
          <p>You have received a new message from <strong>${userName}</strong> (${userEmail}):</p>
          
          <div style="background-color: #f5f5f5; border-left: 4px solid #2e7d32; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #333;">"${message}"</p>
          </div>
          
          <p>To respond, log in to the Dr.Plant platform and go to the chat section.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${APP_URL}/login" style="background-color: #2e7d32; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Access the chat</a>
          </div>
          
          <p style="margin-top: 30px; color: #777; font-size: 12px;">
            This is an automatic notification, please do not reply directly to this email.
          </p>
        </div>
      `,
    });
    
    console.log(`Notification email sent successfully to ${EMAIL_TO}`);
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
