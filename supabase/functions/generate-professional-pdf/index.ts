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
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; color: #333; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #2E7D32; padding-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: #2E7D32; margin-bottom: 10px; }
        .title { font-size: 20px; color: #1565C0; margin: 20px 0; }
        .section { margin-bottom: 25px; background: #f9f9f9; padding: 15px; border-radius: 8px; }
        .section h3 { color: #2E7D32; margin-top: 0; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .field { margin-bottom: 12px; }
        .label { font-weight: bold; color: #555; display: inline-block; width: 150px; }
        .value { color: #333; }
        .list-item { margin-left: 20px; margin-bottom: 5px; }
        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
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
        <div class="field"><span class="label">Nome Azienda:</span><span class="value">${data.companyName}</span></div>
        <div class="field"><span class="label">Persona di Contatto:</span><span class="value">${data.contactPerson}</span></div>
        <div class="field"><span class="label">Email:</span><span class="value">${data.email}</span></div>
        <div class="field"><span class="label">Telefono:</span><span class="value">${data.phone}</span></div>
        <div class="field"><span class="label">Tipo di Business:</span><span class="value">${data.businessType}</span></div>
    </div>

    <div class="section">
        <h3>🌿 Requisiti Tecnici</h3>
        <div class="field">
            <span class="label">Tipi di Piante:</span>
            <div class="value">${data.plantTypes.map(type => `<div class="list-item">• ${type}</div>`).join('')}</div>
        </div>
        <div class="field"><span class="label">Volume Previsto:</span><span class="value">${data.expectedVolume}</span></div>
        <div class="field">
            <span class="label">Funzionalità Richieste:</span>
            <div class="value">${data.preferredFeatures.map(feature => `<div class="list-item">• ${feature}</div>`).join('')}</div>
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
        <div class="field"><span class="label">Budget:</span><span class="value">${data.budget}</span></div>
        <div class="field"><span class="label">Timeline:</span><span class="value">${data.timeline}</span></div>
    </div>

    ${data.additionalInfo ? `
    <div class="section">
        <h3>📝 Informazioni Aggiuntive</h3>
        <div class="value" style="background: white; padding: 10px; border-radius: 4px;">${data.additionalInfo}</div>
    </div>` : ''}

    <div class="footer">
        <p><strong>Dr.Plant - Diagnosi Professionale delle Piante</strong></p>
        <p>Documento generato automaticamente il ${new Date().toLocaleString('it-IT')}</p>
    </div>
</body>
</html>`.trim();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { formData } = await req.json();

    console.log("Generating PDF for professional quote:", formData);

    // Ottieni userId da token
    const authHeader = req.headers.get("Authorization");
    let userId = null;
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id;
      } catch (error) {
        console.error("Error getting user from token:", error);
      }
    }

    console.log("User ID for conversation:", userId);

    // Genera HTML PDF
    const htmlContent = generatePDFContent(formData);
    const pdfFileName = `professional_quote_${Date.now()}.html`;

    // Carica in Supabase Storage
    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: uploadError } = await serviceSupabase.storage
      .from("professional-quotes")
      .upload(pdfFileName, new Blob([htmlContent], { type: "text/html" }), {
        contentType: "text/html",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Ottieni signed URL
    const { data: signedUrlData } = await serviceSupabase.storage
      .from("professional-quotes")
      .createSignedUrl(pdfFileName, 60 * 60 * 24 * 7); // valido 7 giorni

    const pdfUrl = signedUrlData?.signedUrl;
    console.log("Generated signed PDF URL:", pdfUrl);

    // Invia email con link
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
            <p><a href="${pdfUrl}" target="_blank">📎 Scarica il PDF completo</a></p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    // Crea conversazione
    if (userId && pdfUrl) {
      const { data: expertProfile } = await serviceSupabase
        .from("profiles")
        .select("id")
        .eq("email", "agrotecnicomarconigro@gmail.com")
        .single();

      if (expertProfile) {
        let { data: existingConv } = await serviceSupabase
          .from("conversations")
          .select("id")
          .eq("user_id", userId)
          .eq("expert_id", expertProfile.id)
          .eq("status", "active")
          .single();

        let conversationId = existingConv?.id;
        if (!conversationId) {
          const { data: conversation } = await serviceSupabase
            .from("conversations")
            .insert({
              user_id: userId,
              expert_id: expertProfile.id,
              title: `Preventivo Professionale - ${formData.companyName}`,
              status: "active",
              last_message_at: new Date().toISOString(),
            })
            .select()
            .single();
          conversationId = conversation?.id;
        }

        if (conversationId) {
          await serviceSupabase.from("messages").insert({
            conversation_id: conversationId,
            sender_id: userId,
            recipient_id: expertProfile.id,
            content: `📋 **Richiesta Preventivo Professionale - ${formData.companyName}**

Ho generato il preventivo dettagliato con tutte le informazioni fornite.  

👉 [Scarica il PDF qui](${pdfUrl})

*Generato il ${new Date().toLocaleString("it-IT")}*`,
            text: `📋 Preventivo Professionale - ${formData.companyName}`,
            metadata: {
              type: "professional_quote",
              company: formData.companyName,
              pdf_url: pdfUrl,
              generated_at: new Date().toISOString(),
            },
          });

          await serviceSupabase
            .from("conversations")
            .update({
              last_message_at: new Date().toISOString(),
              last_message_text: `📋 Preventivo Professionale - ${formData.companyName}`,
            })
            .eq("id", conversationId);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailSent: !!emailResponse,
        pdfGenerated: true,
        conversationCreated: !!userId,
        message: "PDF generato, email inviata e conversazione creata con successo",
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in generate-professional-pdf function:", error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
