
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

console.log("Hello from send-specialist-notification");

// Get email settings from environment variables - using consistent naming with send-registration-confirmation
const EMAIL_HOST = Deno.env.get("EMAIL_HOST") || "smtp.sendgrid.net";
const EMAIL_PORT = Number(Deno.env.get("EMAIL_PORT")) || 465;
const EMAIL_USERNAME = Deno.env.get("EMAIL_USERNAME") || "";
const EMAIL_PASSWORD = Deno.env.get("EMAIL_PASSWORD") || "";
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "no-reply@drplant.app";
const EXPERT_EMAIL = "agrotecnicomarconigro@gmail.com"; // Marco Nigro's email
const APP_URL = Deno.env.get("APP_URL") || "https://drplant.app";

// Either use SMTP or SendGrid API depending on availability of API key
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");

// SendGrid API implementation for sending notification
async function sendWithSendGridAPI(expertName: string, userEmail: string, userName: string, message: string) {
  if (!SENDGRID_API_KEY) {
    throw new Error("SendGrid API key is not configured");
  }

  console.log(`Using SendGrid API to send notification to ${EXPERT_EMAIL} about message from ${userEmail}`);

  // Create the email content
  const htmlContent = `
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
  `;
  
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
              email: EXPERT_EMAIL
            }
          ]
        }
      ],
      from: {
        email: EMAIL_FROM.includes('<') ? EMAIL_FROM.match(/<(.+)>/)?.[1] || "no-reply@drplant.app" : EMAIL_FROM,
        name: "Dr.Plant Notifications"
      },
      subject: `Dr.Plant: New message from ${userName}`,
      content: [
        {
          type: "text/html",
          value: htmlContent
        }
      ]
    })
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    console.error("SendGrid API error:", errorData);
    throw new Error(`SendGrid API error: ${response.status} ${response.statusText}`);
  }
  
  const result = await response.json();
  console.log("SendGrid API response:", result);
  return result;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const { expertName, userEmail, userName, message } = await req.json();
    
    try {
      // Try using SendGrid API first if available
      if (SENDGRID_API_KEY) {
        console.log("Using SendGrid API for specialist notification");
        await sendWithSendGridAPI(expertName, userEmail, userName, message);
        console.log(`Notification email sent successfully to ${EXPERT_EMAIL} via SendGrid API`);
        
        return new Response(
          JSON.stringify({ success: true }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          },
        );
      }
      
      // Fall back to SMTP if no API key
      console.log("No SendGrid API key found, falling back to SMTP");
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
      console.log(`Sending notification to: ${EXPERT_EMAIL} about message from ${userEmail}`);
      
      await client.send({
        from: EMAIL_FROM,
        to: EXPERT_EMAIL,
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
      
      console.log(`Notification email sent successfully to ${EXPERT_EMAIL}`);
      await client.close();
      
      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    } catch (error) {
      console.error("Email Sending Error:", error);
      // Even if email sending fails, we still want to save the message in the database
      return new Response(
        JSON.stringify({ success: true, emailSent: false }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
