
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const resend = new Resend(RESEND_API_KEY);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { consultationId, userId, plantInfo, imageUrl, conversationId, message, isProfessionalQuote, pdfUrl, companyName, contactPerson } = await req.json();

    console.log('Received notification request:', { consultationId, userId, plantInfo, isProfessionalQuote, pdfUrl });

    // Get user info for better context
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user profile:', userError);
    }

    // Log the expert notification in the database
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: '07c7fe19-33c3-4782-b9a0-4e87c8aa7044', // Marco Nigro ID (expert)
        title: isProfessionalQuote ? 'Nuova Richiesta di Preventivo' : 'Nuova Consulenza Ricevuta',
        message: message || `Nuova richiesta ${isProfessionalQuote ? 'di preventivo professionale' : 'di consulenza'} da ${userProfile?.first_name || 'Utente'} ${userProfile?.last_name || ''}`,
        type: isProfessionalQuote ? 'professional_quote' : 'expert_consultation',
        data: {
          consultationId,
          conversationId,
          userId,
          plantInfo,
          imageUrl,
          pdfUrl,
          userProfile,
          isProfessionalQuote
        }
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

    // Invia email per i preventivi professionali
    if (isProfessionalQuote && pdfUrl) {
      console.log('📧 Sending professional quote email to agrotecnicomarconigro@gmail.com');
      
      try {
        const emailSubject = `🌿 Nuova Richiesta di Preventivo Professionale - ${companyName || 'Azienda'}`;
        
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #228B22 0%, #32CD32 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🌿 Dr.Plant</h1>
              <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Nuova Richiesta di Preventivo</p>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
              <h2 style="color: #228B22; margin-top: 0;">Dettagli Richiesta</h2>
              
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 8px 0;"><strong>🏢 Azienda:</strong> ${companyName || 'Non specificata'}</p>
                <p style="margin: 8px 0;"><strong>👤 Contatto:</strong> ${contactPerson || 'Non specificato'}</p>
                <p style="margin: 8px 0;"><strong>📧 Email:</strong> ${userProfile?.email || 'Non specificata'}</p>
              </div>
              
              <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #228B22; margin: 20px 0;">
                <p style="margin: 0; color: #2d5016;"><strong>📋 Il PDF completo con tutti i dettagli della richiesta è disponibile qui:</strong></p>
                <a href="${pdfUrl}" 
                   style="display: inline-block; margin-top: 15px; padding: 12px 24px; background: #228B22; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  📄 Scarica Preventivo PDF
                </a>
              </div>
              
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>💬 Importante:</strong> Il preventivo è anche disponibile nella chat della piattaforma Dr.Plant per una comunicazione diretta con il cliente.
                </p>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Ricordati di rispondere al cliente entro 2-3 giorni lavorativi con un preventivo dettagliato.
              </p>
            </div>
            
            <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Questo è un messaggio automatico da Dr.Plant
              </p>
            </div>
          </div>
        `;

        const emailResponse = await resend.emails.send({
          from: "Dr.Plant <onboarding@resend.dev>",
          to: ["agrotecnicomarconigro@gmail.com"],
          subject: emailSubject,
          html: emailHtml,
        });

        console.log("✅ Professional quote email sent successfully:", emailResponse);
      } catch (emailError) {
        console.error("❌ Error sending professional quote email:", emailError);
        // Non blocchiamo la richiesta se l'email fallisce
      }
    }

    console.log('Expert notification processed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Expert notified successfully',
        consultationId,
        emailSent: isProfessionalQuote
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Error in notify-expert function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
