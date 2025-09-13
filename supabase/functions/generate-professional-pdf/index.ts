import { serve } from "https://deno.land/std@0.190.0/http/server.ts"; 
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { Resend } from "npm:resend@2.0.0";
import jsPDF from "npm:jspdf@2.5.1";

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

const generatePDF = (data: ProfessionalFormData): Uint8Array => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // Configurazione font e colori
  const primaryColor = [46, 125, 50]; // Verde Dr.Plant
  const secondaryColor = [21, 101, 192]; // Blu
  const textColor = [51, 51, 51]; // Grigio scuro
  const lightGrayColor = [171, 171, 171]; // Grigio chiaro
  
  let yPosition = 20;
  
  // Header
  pdf.setFontSize(24);
  pdf.setTextColor(...primaryColor);
  pdf.text('🌱 Dr.Plant', 105, yPosition, { align: 'center' });
  
  yPosition += 10;
  pdf.setFontSize(18);
  pdf.setTextColor(...secondaryColor);
  pdf.text('Richiesta Preventivo Professionale', 105, yPosition, { align: 'center' });
  
  yPosition += 8;
  pdf.setFontSize(10);
  pdf.setTextColor(...lightGrayColor);
  pdf.text(`Data: ${new Date().toLocaleDateString('it-IT')}`, 105, yPosition, { align: 'center' });
  
  // Linea separatrice
  yPosition += 8;
  pdf.setDrawColor(...primaryColor);
  pdf.setLineWidth(0.5);
  pdf.line(20, yPosition, 190, yPosition);
  
  yPosition += 15;
  
  // Funzione helper per aggiungere sezioni
  const addSection = (title: string, fields: Array<{label: string, value: string | string[]}>) => {
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 20;
    }
    
    // Titolo sezione
    pdf.setFontSize(14);
    pdf.setTextColor(...primaryColor);
    pdf.text(title, 20, yPosition);
    yPosition += 8;
    
    // Linea sotto il titolo
    pdf.setDrawColor(221, 221, 221);
    pdf.setLineWidth(0.3);
    pdf.line(20, yPosition, 190, yPosition);
    yPosition += 8;
    
    // Campi
    pdf.setFontSize(10);
    fields.forEach(field => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
      
      // Label
      pdf.setTextColor(85, 85, 85);
      pdf.setFont(pdf.getFont().fontName, 'bold');
      pdf.text(`${field.label}:`, 25, yPosition);
      
      // Value
      pdf.setTextColor(...textColor);
      pdf.setFont(pdf.getFont().fontName, 'normal');
      
      if (Array.isArray(field.value)) {
        yPosition += 5;
        field.value.forEach(item => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(`• ${item}`, 30, yPosition);
          yPosition += 5;
        });
      } else {
        // Gestione testo lungo con a capo automatico
        const lines = pdf.splitTextToSize(field.value, 120);
        pdf.text(lines, 80, yPosition);
        yPosition += lines.length * 5;
      }
      
      yPosition += 3;
    });
    
    yPosition += 8;
  };
  
  // Informazioni Aziendali
  addSection('📋 Informazioni Aziendali', [
    { label: 'Nome Azienda', value: data.companyName },
    { label: 'Persona di Contatto', value: data.contactPerson },
    { label: 'Email', value: data.email },
    { label: 'Telefono', value: data.phone },
    { label: 'Tipo di Business', value: data.businessType }
  ]);
  
  // Requisiti Tecnici
  addSection('🌿 Requisiti Tecnici', [
    { label: 'Tipi di Piante', value: data.plantTypes },
    { label: 'Volume Previsto', value: data.expectedVolume || 'Non specificato' },
    { label: 'Funzionalità Richieste', value: data.preferredFeatures.length > 0 ? data.preferredFeatures : ['Nessuna funzionalità specifica richiesta'] }
  ]);
  
  // Sfide Attuali
  if (data.currentChallenges) {
    addSection('⚠️ Sfide Attuali', [
      { label: 'Descrizione', value: data.currentChallenges }
    ]);
  }
  
  // Budget e Timeline
  addSection('💰 Budget e Timeline', [
    { label: 'Budget', value: data.budget || 'Non specificato' },
    { label: 'Timeline', value: data.timeline || 'Non specificata' }
  ]);
  
  // Informazioni Aggiuntive
  if (data.additionalInfo) {
    addSection('📝 Informazioni Aggiuntive', [
      { label: 'Note', value: data.additionalInfo }
    ]);
  }
  
  // Footer
  if (yPosition > 250) {
    pdf.addPage();
    yPosition = 20;
  }
  
  yPosition = 280; // Posizione fissa per il footer
  pdf.setDrawColor(...lightGrayColor);
  pdf.setLineWidth(0.3);
  pdf.line(20, yPosition - 5, 190, yPosition - 5);
  
  pdf.setFontSize(8);
  pdf.setTextColor(...lightGrayColor);
  pdf.text('Dr.Plant - Diagnosi Professionale delle Piante', 105, yPosition, { align: 'center' });
  pdf.text(`Documento generato automaticamente il ${new Date().toLocaleString('it-IT')}`, 105, yPosition + 5, { align: 'center' });
  
  // Restituisci il PDF come array di byte
  return new Uint8Array(pdf.output('arraybuffer'));
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

    // Genera PDF reale
    const pdfBytes = generatePDF(formData);
    const pdfFileName = `professional_quote_${Date.now()}.pdf`;

    // Carica in Supabase Storage
    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: uploadError } = await serviceSupabase.storage
      .from("professional-quotes")
      .upload(pdfFileName, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    // Ottieni signed URL
    const { data: signedUrlData } = await serviceSupabase.storage
      .from("professional-quotes")
      .createSignedUrl(pdfFileName, 60 * 60 * 24 * 7); // valido 7 giorni

    const pdfUrl = signedUrlData?.signedUrl;
    console.log("Generated PDF URL:", pdfUrl);

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
