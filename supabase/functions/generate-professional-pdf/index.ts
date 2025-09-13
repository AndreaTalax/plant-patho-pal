import { serve } from "https://deno.land/std@0.190.0/http/server.ts"; 
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { Resend } from "npm:resend@2.0.0";
import { PDFDocument, rgb, StandardFonts } from 'https://cdn.skypack.dev/pdf-lib@1.17.1';

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

const generatePDF = async (data: ProfessionalFormData): Promise<Uint8Array> => {
  // Crea un nuovo documento PDF
  const pdfDoc = await PDFDocument.create();
  
  // Incorpora i font standard
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Colori
  const primaryColor = rgb(0.18, 0.49, 0.196); // Verde Dr.Plant
  const secondaryColor = rgb(0.082, 0.396, 0.753); // Blu
  const textColor = rgb(0.2, 0.2, 0.2); // Grigio scuro
  const lightGrayColor = rgb(0.67, 0.67, 0.67); // Grigio chiaro
  
  // Aggiungi una pagina
  let page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();
  let yPosition = height - 50;
  
  // Header
  page.drawText('Dr.Plant', {
    x: width / 2 - 40,
    y: yPosition,
    size: 24,
    font: timesRomanBoldFont,
    color: primaryColor,
  });
  
  yPosition -= 30;
  page.drawText('Richiesta Preventivo Professionale', {
    x: width / 2 - 140,
    y: yPosition,
    size: 18,
    font: timesRomanBoldFont,
    color: secondaryColor,
  });
  
  yPosition -= 20;
  page.drawText(`Data: ${new Date().toLocaleDateString('it-IT')}`, {
    x: width / 2 - 50,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: lightGrayColor,
  });
  
  // Linea separatrice
  yPosition -= 15;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 1,
    color: primaryColor,
  });
  
  yPosition -= 30;
  
  // Funzione helper per aggiungere sezioni
  const addSection = (title: string, fields: Array<{label: string, value: string | string[]}>) => {
    // Controlla se abbiamo bisogno di una nuova pagina
    if (yPosition < 150) {
      page = pdfDoc.addPage([595.28, 841.89]);
      yPosition = height - 50;
    }
    
    // Titolo sezione
    page.drawText(title, {
      x: 50,
      y: yPosition,
      size: 14,
      font: timesRomanBoldFont,
      color: primaryColor,
    });
    yPosition -= 8;
    
    // Linea sotto il titolo
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 0.5,
      color: lightGrayColor,
    });
    yPosition -= 20;
    
    // Campi
    fields.forEach(field => {
      if (yPosition < 50) {
        page = pdfDoc.addPage([595.28, 841.89]);
        yPosition = height - 50;
      }
      
      // Label
      page.drawText(`${field.label}:`, {
        x: 60,
        y: yPosition,
        size: 10,
        font: timesRomanBoldFont,
        color: textColor,
      });
      
      // Value
      if (Array.isArray(field.value)) {
        yPosition -= 15;
        field.value.forEach(item => {
          if (yPosition < 50) {
            page = pdfDoc.addPage([595.28, 841.89]);
            yPosition = height - 50;
          }
          page.drawText(`• ${item}`, {
            x: 70,
            y: yPosition,
            size: 9,
            font: helveticaFont,
            color: textColor,
          });
          yPosition -= 12;
        });
      } else {
        // Gestione testo lungo con a capo automatico (semplificato)
        const maxLineLength = 65;
        const words = field.value.split(' ');
        let line = '';
        
        for (const word of words) {
          if ((line + word).length > maxLineLength) {
            page.drawText(line, {
              x: 160,
              y: yPosition,
              size: 9,
              font: helveticaFont,
              color: textColor,
            });
            yPosition -= 12;
            line = word + ' ';
            
            if (yPosition < 50) {
              page = pdfDoc.addPage([595.28, 841.89]);
              yPosition = height - 50;
            }
          } else {
            line += word + ' ';
          }
        }
        
        if (line.trim()) {
          page.drawText(line, {
            x: 160,
            y: yPosition,
            size: 9,
            font: helveticaFont,
            color: textColor,
          });
          yPosition -= 12;
        }
      }
      
      yPosition -= 8;
    });
    
    yPosition -= 15;
  };
  
  // Informazioni Aziendali
  addSection('Informazioni Aziendali', [
    { label: 'Nome Azienda', value: data.companyName },
    { label: 'Persona di Contatto', value: data.contactPerson },
    { label: 'Email', value: data.email },
    { label: 'Telefono', value: data.phone },
    { label: 'Tipo di Business', value: data.businessType }
  ]);
  
  // Requisiti Tecnici
  addSection('Requisiti Tecnici', [
    { label: 'Tipi di Piante', value: data.plantTypes },
    { label: 'Volume Previsto', value: data.expectedVolume || 'Non specificato' },
    { label: 'Funzionalita Richieste', value: data.preferredFeatures.length > 0 ? data.preferredFeatures : ['Nessuna funzionalita specifica richiesta'] }
  ]);
  
  // Sfide Attuali
  if (data.currentChallenges) {
    addSection('Sfide Attuali', [
      { label: 'Descrizione', value: data.currentChallenges }
    ]);
  }
  
  // Budget e Timeline
  addSection('Budget e Timeline', [
    { label: 'Budget', value: data.budget || 'Non specificato' },
    { label: 'Timeline', value: data.timeline || 'Non specificata' }
  ]);
  
  // Informazioni Aggiuntive
  if (data.additionalInfo) {
    addSection('Informazioni Aggiuntive', [
      { label: 'Note', value: data.additionalInfo }
    ]);
  }
  
  // Footer
  if (yPosition < 100) {
    page = pdfDoc.addPage([595.28, 841.89]);
    yPosition = height - 50;
  }
  
  // Posiziona footer in basso
  const footerY = 50;
  page.drawLine({
    start: { x: 50, y: footerY + 20 },
    end: { x: width - 50, y: footerY + 20 },
    thickness: 0.5,
    color: lightGrayColor,
  });
  
  page.drawText('Dr.Plant - Diagnosi Professionale delle Piante', {
    x: width / 2 - 120,
    y: footerY + 10,
    size: 8,
    font: helveticaFont,
    color: lightGrayColor,
  });
  
  page.drawText(`Documento generato automaticamente il ${new Date().toLocaleString('it-IT')}`, {
    x: width / 2 - 130,
    y: footerY,
    size: 8,
    font: helveticaFont,
    color: lightGrayColor,
  });
  
  // Serializza il PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
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
    const pdfBytes = await generatePDF(formData);
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

👉 [📥 Scarica il PDF qui](${pdfUrl})

Il documento PDF contiene:
• Dettagli aziendali e contatti
• Requisiti tecnici e tipi di piante
• Sfide attuali e volume previsto  
• Budget e timeline
• Funzionalità richieste

Ti ricontatterò presto per discutere la soluzione più adatta alle tue esigenze.

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
