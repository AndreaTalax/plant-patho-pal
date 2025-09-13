import { serve } from "https://deno.land/std@0.190.0/http/server.ts"; 
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { Resend } from "npm:resend@2.0.0";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

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
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Preventivo Professionale - Dr.Plant</title>
<style>
  body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
  h1, h2, h3 { color: #2E7D32; }
  .section { margin-bottom: 20px; }
  .label { font-weight: bold; width: 150px; display: inline-block; }
  .value { color: #333; }
</style>
</head>
<body>
  <h1>🌱 Richiesta Preventivo Professionale</h1>
  <p><b>Data:</b> ${new Date().toLocaleDateString("it-IT")}</p>
  
  <div class="section">
    <h2>📋 Informazioni Aziendali</h2>
    <p><span class="label">Azienda:</span><span class="value">${data.companyName}</span></p>
    <p><span class="label">Contatto:</span><span class="value">${data.contactPerson}</span></p>
    <p><span class="label">Email:</span><span class="value">${data.email}</span></p>
    <p><span class="label">Telefono:</span><span class="value">${data.phone}</span></p>
    <p><span class="label">Tipo Business:</span><span class="value">${data.businessType}</span></p>
  </div>

  <div class="section">
    <h2>🌿 Requisiti Tecnici</h2>
    <p><b>Tipi di Piante:</b></p>
    <ul>${data.plantTypes.map(p => `<li>${p}</li>`).join("")}</ul>
    <p><b>Volume Previsto:</b> ${data.expectedVolume}</p>
    <p><b>Funzionalità Richieste:</b></p>
    <ul>${data.preferredFeatures.map(f => `<li>${f}</li>`).join("")}</ul>
  </div>

  <div class="section">
    <h2>⚠️ Sfide Attuali</h2>
    <p>${data.currentChallenges}</p>
  </div>

  <div class="section">
    <h2>💰 Budget e Timeline</h2>
    <p><b>Budget:</b> ${data.budget}</p>
    <p><b>Timeline:</b> ${data.timeline}</p>
  </div>

  ${data.additionalInfo ? `<div class="section"><h2>📝 Info Aggiuntive</h2><p>${data.additionalInfo}</p></div>` : ""}
</body>
</html>`;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "" // serve service role per upload
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const { formData } = await req.json();

    console.log("Generating PDF for professional quote:", formData);

    // 🔹 Genera HTML
    const htmlContent = generatePDFContent(formData);

    // 🔹 Avvia browser headless con Puppeteer e genera PDF
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();

     // 🔹 Carica PDF su Supabase Storage
    const fileName = `professional_quotes/${formData.companyName.replace(/\s+/g, "_")}_${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("pdfs")
      .upload(fileName, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload failed:", uploadError);
      throw new Error("Failed to upload PDF file");
    }

    // 🔹 Crea URL firmato per il PDF
    const { data: signedUrlData } = await supabase.storage
      .from("pdfs")
      .createSignedUrl(fileName, 60 * 60 * 24 * 7); // valido 7 giorni

    const pdfUrl = signedUrlData?.signedUrl;
    console.log("PDF uploaded and accessible at:", pdfUrl);

    // 🔹 Invia email con link al PDF
    await resend.emails.send({
      from: "Dr.Plant <noreply@drplant.app>",
      to: ["agrotecnicomarconigro@gmail.com"],
      subject: `🌱 Nuova Richiesta Preventivo Professionale - ${formData.companyName}`,
      html: `<p>Nuova richiesta da <b>${formData.companyName}</b>.</p>
             <p>Scarica il PDF: <a href="${pdfUrl}">clicca qui</a></p>`,
    });

    // ==============================
    // 🔹 CREAZIONE CONVERSAZIONE CHAT
    // ==============================
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    let userId = null;

    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await serviceSupabase.auth.getUser(token);
        userId = user?.id;
      } catch (error) {
        console.error('Error getting user from token:', error);
      }
    }

    if (userId) {
      console.log('Creating conversation for user:', userId);

      // Trova l'esperto (Marco Nigro)
      const { data: expertProfile } = await serviceSupabase
        .from('profiles')
        .select('id')
        .eq('email', 'agrotecnicomarconigro@gmail.com')
        .single();

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
          }
        }

        await serviceSupabase
  .from('messages')
  .insert({
    conversation_id: conversationId,
    sender_id: userId,
    recipient_id: expertProfile.id,
    content: `📋 **Richiesta Preventivo Professionale - ${formData.companyName}**

Ho generato il preventivo dettagliato con tutte le informazioni fornite.  

👉 [Scarica il PDF qui](${pdfUrl})

*Generato il ${new Date().toLocaleString('it-IT')}*`,
    text: `📋 Preventivo Professionale - ${formData.companyName}`,
    // 🔹 NON usare più image_url per i PDF
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
    }

    return new Response(
      JSON.stringify({
        success: true,
        pdfUrl,
        message: 'PDF generato, caricato, email inviata e conversazione aggiornata'
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
