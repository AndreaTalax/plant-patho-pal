import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetEmailRequest {
  user: {
    email: string;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing password reset email request");
    
    const requestData: PasswordResetEmailRequest = await req.json();
    console.log("Request data:", JSON.stringify(requestData, null, 2));

    const { user, email_data } = requestData;
    const { token_hash, email_action_type } = email_data;
    
    // Forza il redirect alla pagina corretta di reset password
    const correctRedirectUrl = "https://plant-patho-pal.lovable.app/reset-password";
    const resetUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(correctRedirectUrl)}`;
    
    console.log("Reset URL:", resetUrl);

    const emailResponse = await resend.emails.send({
      from: "Plant Patho Pal <noreply@resend.dev>",
      to: [user.email],
      subject: "Reset della Password - Plant Patho Pal",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #16a34a; margin: 0; font-size: 28px;">🌱 Plant Patho Pal</h1>
            </div>
            
            <h2 style="color: #333; margin-bottom: 20px;">Reset della Password</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Ciao! Abbiamo ricevuto una richiesta per reimpostare la password del tuo account Plant Patho Pal.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                Reimposta Password
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 15px; font-size: 14px;">
              Se il pulsante non funziona, copia e incolla questo link nel tuo browser:
            </p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 12px; margin-bottom: 25px;">
              ${resetUrl}
            </div>
            
            <p style="color: #999; font-size: 14px; line-height: 1.5;">
              <strong>Importante:</strong><br>
              • Questo link è valido per 1 ora<br>
              • Se non hai richiesto il reset, ignora questa email<br>
              • Per sicurezza, non condividere mai questo link
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              Plant Patho Pal - Il tuo assistente per la salute delle piante
            </p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);