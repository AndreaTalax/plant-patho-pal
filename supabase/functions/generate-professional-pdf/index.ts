import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProfessionalFormData {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  businessType: string;
  plantTypes: string[];
  currentChallenges: string;
  expectedVolume: string;
  preferredFeatures: string[];
  budget: string;
  timeline: string;
  additionalInfo: string;
}

const generatePDFContent = (data: ProfessionalFormData): string => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Richiesta Preventivo Professionale - Dr.Plant</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 40px; 
            line-height: 1.6; 
            color: #333;
        }
        .header { 
            text-align: center; 
            margin-bottom: 40px; 
            border-bottom: 2px solid #2E7D32;
            padding-bottom: 20px;
        }
        .logo { 
            font-size: 24px; 
            font-weight: bold; 
            color: #2E7D32; 
            margin-bottom: 10px;
        }
        .title { 
            font-size: 20px; 
            color: #1565C0; 
            margin: 20px 0;
        }
        .section { 
            margin-bottom: 25px; 
            background: #f9f9f9; 
            padding: 15px; 
            border-radius: 8px;
        }
        .section h3 { 
            color: #2E7D32; 
            margin-top: 0; 
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        .field { 
            margin-bottom: 12px; 
        }
        .label { 
            font-weight: bold; 
            color: #555; 
            display: inline-block;
            width: 150px;
        }
        .value { 
            color: #333; 
        }
        .list-item { 
            margin-left: 20px; 
            margin-bottom: 5px;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🌱 Dr.Plant</div>
        <div class="title">Richiesta Preventivo Professionale</div>
        <div style="color: #666; font-size: 14px;">Data: ${new Date().toLocaleDateString('it-IT')}</div>
    </div>

    <div class="section">
        <h3>📋 Informazioni Aziendali</h3>
        <div class="field">
            <span class="label">Nome Azienda:</span>
            <span class="value">${data.companyName}</span>
        </div>
        <div class="field">
            <span class="label">Persona di Contatto:</span>
            <span class="value">${data.contactPerson}</span>
        </div>
        <div class="field">
            <span class="label">Email:</span>
            <span class="value">${data.email}</span>
        </div>
        <div class="field">
            <span class="label">Telefono:</span>
            <span class="value">${data.phone}</span>
        </div>
        <div class="field">
            <span class="label">Tipo di Business:</span>
            <span class="value">${data.businessType}</span>
        </div>
    </div>

    <div class="section">
        <h3>🌿 Requisiti Tecnici</h3>
        <div class="field">
            <span class="label">Tipi di Piante:</span>
            <div class="value">
                ${data.plantTypes.map(type => `<div class="list-item">• ${type}</div>`).join('')}
            </div>
        </div>
        <div class="field">
            <span class="label">Volume Previsto:</span>
            <span class="value">${data.expectedVolume}</span>
        </div>
        <div class="field">
            <span class="label">Funzionalità Richieste:</span>
            <div class="value">
                ${data.preferredFeatures.map(feature => `<div class="list-item">• ${feature}</div>`).join('')}
            </div>
        </div>
    </div>

    <div class="section">
        <h3>⚠️ Sfide Attuali</h3>
        <div class="value" style="background: white; padding: 10px; border-radius: 4px; border-left: 4px solid #FF9800;">
            ${data.currentChallenges}
        </div>
    </div>

    <div class="section">
        <h3>💰 Budget e Timeline</h3>
        <div class="field">
            <span class="label">Budget:</span>
            <span class="value">${data.budget}</span>
        </div>
        <div class="field">
            <span class="label">Timeline:</span>
            <span class="value">${data.timeline}</span>
        </div>
    </div>

    ${data.additionalInfo ? `
    <div class="section">
        <h3>📝 Informazioni Aggiuntive</h3>
        <div class="value" style="background: white; padding: 10px; border-radius: 4px;">
            ${data.additionalInfo}
        </div>
    </div>
    ` : ''}

    <div class="footer">
        <p><strong>Dr.Plant - Diagnosi Professionale delle Piante</strong></p>
        <p>Documento generato automaticamente il ${new Date().toLocaleString('it-IT')}</p>
    </div>
</body>
</html>
  `.trim();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    const { formData } = await req.json();
    
    console.log('Generating PDF for professional quote:', formData);

    // Get user ID from request headers (JWT token)
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id;
      } catch (error) {
        console.error('Error getting user from token:', error);
      }
    }

    console.log('User ID for conversation:', userId);

    // Genera contenuto HTML per il PDF
    const htmlContent = generatePDFContent(formData);
    
    // Crea un file HTML strutturato come PDF
    const fileName = `preventivo-${formData.companyName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.html`;
    const htmlBuffer = new TextEncoder().encode(htmlContent);

    // Usa service role per l'upload al bucket storage
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Salva il file HTML in Supabase Storage (verrà visualizzato come PDF nel browser)
    const { data: uploadData, error: uploadError } = await serviceSupabase.storage
      .from('pdfs')
      .upload(fileName, htmlBuffer, {
        contentType: 'text/html',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading HTML file:', uploadError);
      throw new Error('Failed to upload PDF file');
    }

    // Ottieni URL pubblico del file
    const { data: publicUrlData } = serviceSupabase.storage
      .from('pdfs')
      .getPublicUrl(fileName);
    
    const pdfUrl = publicUrlData.publicUrl;
    
    // Invia email con il PDF
    const emailResponse = await resend.emails.send({
      from: "Dr.Plant <noreply@drplant.app>",
      to: ["agrotecnicomarconigro@gmail.com"],
      subject: `🌱 Nuova Richiesta Preventivo Professionale - ${formData.companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2E7D32, #4CAF50); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">🌱 Dr.Plant</h1>
            <p style="margin: 10px 0 0 0;">Nuova Richiesta Preventivo Professionale</p>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="color: #2E7D32;">Dettagli della Richiesta</h2>
            <p><strong>Azienda:</strong> ${formData.companyName}</p>
            <p><strong>Contatto:</strong> ${formData.contactPerson}</p>
            <p><strong>Email:</strong> ${formData.email}</p>
            <p><strong>Telefono:</strong> ${formData.phone}</p>
            <p><strong>Tipo Business:</strong> ${formData.businessType}</p>
            <p><strong>Budget:</strong> ${formData.budget}</p>
            <p><strong>Timeline:</strong> ${formData.timeline}</p>
          </div>
          
          <div style="padding: 20px;">
            <h3 style="color: #1565C0;">Sfide Attuali:</h3>
            <p style="background: white; padding: 15px; border-left: 4px solid #FF9800; border-radius: 4px;">
              ${formData.currentChallenges}
            </p>
            
            <h3 style="color: #1565C0;">Tipi di Piante:</h3>
            <ul style="background: white; padding: 15px; border-radius: 4px;">
              ${formData.plantTypes.map(type => `<li>${type}</li>`).join('')}
            </ul>
            
            <h3 style="color: #1565C0;">Funzionalità Richieste:</h3>
            <ul style="background: white; padding: 15px; border-radius: 4px;">
              ${formData.preferredFeatures.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
            
            ${formData.additionalInfo ? `
            <h3 style="color: #1565C0;">Informazioni Aggiuntive:</h3>
            <p style="background: white; padding: 15px; border-radius: 4px;">
              ${formData.additionalInfo}
            </p>
            ` : ''}
          </div>
          
          <div style="background: #e8f5e8; padding: 15px; text-align: center; color: #2E7D32;">
            <p><strong>Ricevuto il:</strong> ${new Date().toLocaleString('it-IT')}</p>
            <p>Questo è un messaggio automatico da Dr.Plant</p>
          </div>
        </div>
      `,
    });

    console.log('Email sent successfully:', emailResponse);

    // serviceSupabase già inizializzato sopra per l'upload
    
    if (userId) {
      console.log('Creating conversation for user:', userId);
      
      // Trova l'ID dell'esperto (Marco Nigro) 
      const { data: expertProfile } = await serviceSupabase
        .from('profiles')
        .select('id')
        .eq('email', 'agrotecnicomarconigro@gmail.com')
        .single();

      console.log('Expert profile found:', expertProfile);

      if (expertProfile) {
        // Verifica se esiste già una conversazione attiva
        const { data: existingConv } = await serviceSupabase
          .from('conversations')
          .select('id')
          .eq('user_id', userId)
          .eq('expert_id', expertProfile.id)
          .eq('status', 'active')
          .single();

        let conversationId = existingConv?.id;

        if (!conversationId) {
          // Crea nuova conversazione
          const { data: conversation, error: convError } = await serviceSupabase
            .from('conversations')
            .insert({
              user_id: userId,
              expert_id: expertProfile.id,
              title: `Preventivo Professionale - ${formData.companyName}`,
              status: 'active',
              last_message_at: new Date().toISOString()
            })
            .select()
            .single();

          if (convError) {
            console.error('Error creating conversation:', convError);
          } else {
            conversationId = conversation.id;
            console.log('New conversation created:', conversationId);
          }
        } else {
          console.log('Using existing conversation:', conversationId);
        }

        if (conversationId) {
          // Invia messaggio in chat con il PDF allegato
          const { error: messageError } = await serviceSupabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              sender_id: userId,
              recipient_id: expertProfile.id,
              content: `📋 **Richiesta Preventivo Professionale - ${formData.companyName}**

Ho generato il preventivo dettagliato con tutte le informazioni fornite. Il documento PDF contiene:

• Dettagli aziendali e contatti
• Requisiti tecnici e tipi di piante
• Sfide attuali e volume previsto  
• Budget e timeline
• Funzionalità richieste

Ti ricontatterò presto per discutere la soluzione più adatta alle tue esigenze.

*Generato il ${new Date().toLocaleString('it-IT')}*`,
              text: `📋 Preventivo Professionale - ${formData.companyName}`,
              image_url: pdfUrl,
              metadata: {
                type: 'professional_quote',
                company: formData.companyName,
                pdf_url: pdfUrl,
                generated_at: new Date().toISOString()
              }
            });

          if (messageError) {
            console.error('Error sending chat message:', messageError);
          } else {
            console.log('Chat message sent successfully');
            
            // Aggiorna la conversazione con l'ultimo messaggio
            await serviceSupabase
              .from('conversations')
              .update({
                last_message_at: new Date().toISOString(),
                last_message_text: `📋 Preventivo Professionale - ${formData.companyName}`
              })
              .eq('id', conversationId);
          }
        }
      }
    } else {
      console.log('No user ID found, skipping conversation creation');
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailSent: !!emailResponse,
        pdfGenerated: true,
        conversationCreated: !!userId,
        message: 'PDF generato, email inviata e conversazione creata con successo'
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in generate-professional-pdf function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);