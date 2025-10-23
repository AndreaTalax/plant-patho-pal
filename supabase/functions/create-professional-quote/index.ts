import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    
    // Verifica autenticazione
    const regularClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    
    const { data: { user } } = await regularClient.auth.getUser(token);
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { formData } = await req.json();

    console.log("📋 Creating professional quote for user:", user.id);

    // Ottieni il profilo dell'utente per le email
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // ID dell'esperto (fitopatologo Marco Nigro)
    const expertId = '07c7fe19-33c3-4782-b9a0-4e87c8aa7044';

    // 1. Crea una nuova conversazione di tipo "professional_quote"
    const { data: conversation, error: convError } = await supabaseClient
      .from('conversations')
      .insert({
        user_id: user.id,
        expert_id: expertId,
        conversation_type: 'professional_quote',
        title: `Preventivo ${formData.companyName}`,
        status: 'active'
      })
      .select()
      .single();

    if (convError) {
      console.error("Error creating conversation:", convError);
      throw new Error("Failed to create conversation");
    }

    console.log("✅ Conversation created:", conversation.id);

    // 2. Genera il PDF del preventivo professionale
    const doc = new jsPDF();
    let yPosition = 20;

    // Aggiungi il logo
    try {
      const logoBase64 = await fetch('https://drplant.lovable.app/hortives-logo-pdf.jpg')
        .then(res => res.arrayBuffer())
        .then(buffer => {
          const bytes = new Uint8Array(buffer);
          let binary = '';
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          return btoa(binary);
        });
      
      doc.addImage(`data:image/jpeg;base64,${logoBase64}`, 'JPEG', 80, yPosition, 50, 25);
      console.log("✅ Logo added to PDF");
    } catch (logoError) {
      console.warn("⚠️ Logo not loaded:", logoError);
    }

    yPosition += 35;

    // Header
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("RICHIESTA DI PREVENTIVO", 105, yPosition, { align: 'center' });
    yPosition += 8;
    
    doc.setFontSize(20);
    doc.setTextColor(34, 139, 34);
    doc.text("Soluzione Professionale Dr.Plant", 105, yPosition, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    yPosition += 15;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Data richiesta: ${new Date().toLocaleDateString('it-IT')}`, 20, yPosition);
    doc.text(`ID Richiesta: ${conversation.id.substring(0, 8)}`, 150, yPosition);
    yPosition += 12;

    // Linea separatrice
    doc.setDrawColor(34, 139, 34);
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 12;

    // Informazioni aziendali
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 139, 34);
    doc.text("INFORMAZIONI AZIENDA", 20, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    
    const companyInfo = [
      { label: 'Nome Azienda:', value: formData.companyName },
      { label: 'Persona di Contatto:', value: formData.contactPerson },
      { label: 'Email:', value: formData.email },
      { label: 'Telefono:', value: formData.phone },
      { label: 'Tipo di Business:', value: formData.businessType }
    ];

    companyInfo.forEach(item => {
      doc.setFont("helvetica", "bold");
      doc.text(item.label, 25, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(item.value, 70, yPosition);
      yPosition += 6;
    });

    yPosition += 8;

    // Linea separatrice
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 12;

    // Tipi di piante di interesse
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 139, 34);
    doc.text("PIANTE DI INTERESSE", 20, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const plantTypes = formData.plantTypes.join(', ');
    const plantTypeLines = doc.splitTextToSize(plantTypes, 165);
    plantTypeLines.forEach((line: string) => {
      doc.text(line, 25, yPosition);
      yPosition += 6;
    });
    yPosition += 8;

    // Linea separatrice
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 12;

    // Sfide attuali
    if (formData.currentChallenges) {
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(34, 139, 34);
      doc.text("SFIDE E PROBLEMATICHE ATTUALI", 20, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const challengeLines = doc.splitTextToSize(formData.currentChallenges, 165);
      challengeLines.forEach((line: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 25, yPosition);
        yPosition += 6;
      });
      yPosition += 8;

      // Linea separatrice
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 12;
    }

    // Requisiti e preferenze
    if (yPosition > 230) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 139, 34);
    doc.text("REQUISITI E PREFERENZE", 20, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    
    if (formData.expectedVolume) {
      doc.setFont("helvetica", "bold");
      doc.text("Volume diagnosi previsto:", 25, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(formData.expectedVolume, 80, yPosition);
      yPosition += 7;
    }

    if (formData.preferredFeatures && formData.preferredFeatures.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Funzionalità richieste:", 25, yPosition);
      yPosition += 6;
      doc.setFont("helvetica", "normal");
      const featuresText = formData.preferredFeatures.join(', ');
      const featureLines = doc.splitTextToSize(featuresText, 160);
      featureLines.forEach((line: string) => {
        doc.text(line, 30, yPosition);
        yPosition += 6;
      });
      yPosition += 1;
    }

    if (formData.budget) {
      doc.setFont("helvetica", "bold");
      doc.text("Budget indicativo:", 25, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(formData.budget, 65, yPosition);
      yPosition += 7;
    }

    if (formData.timeline) {
      doc.setFont("helvetica", "bold");
      doc.text("Tempistiche:", 25, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(formData.timeline, 55, yPosition);
      yPosition += 7;
    }

    yPosition += 8;

    // Linea separatrice
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 12;

    // Informazioni aggiuntive
    if (formData.additionalInfo) {
      if (yPosition > 230) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(34, 139, 34);
      doc.text("INFORMAZIONI AGGIUNTIVE", 20, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const additionalLines = doc.splitTextToSize(formData.additionalInfo, 165);
      additionalLines.forEach((line: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 25, yPosition);
        yPosition += 6;
      });
      yPosition += 8;
    }

    // Footer
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Box informativo finale
    doc.setFillColor(240, 248, 240);
    doc.rect(15, yPosition, 180, 25, 'F');
    
    yPosition += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 139, 34);
    doc.text("Il nostro team analizzerà la vostra richiesta e vi contatterà entro 2-3 giorni lavorativi", 105, yPosition, { align: 'center' });
    yPosition += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("con un preventivo personalizzato e dettagliato per le vostre esigenze aziendali.", 105, yPosition, { align: 'center' });
    yPosition += 6;
    doc.text("Riceverete una risposta via email e tramite la chat della piattaforma.", 105, yPosition, { align: 'center' });

    // Genera il PDF
    const pdfBlob = doc.output("blob");
    const fileName = `professional-quote-${conversation.id}-${Date.now()}.pdf`;

    console.log("📄 Uploading PDF to storage...");

    // Upload del PDF
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from("professional-quotes")
      .upload(fileName, pdfBlob, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ Upload error:", uploadError);
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    // Ottieni URL pubblico
    const { data: publicUrlData } = supabaseClient
      .storage
      .from("professional-quotes")
      .getPublicUrl(fileName);

    const pdfUrl = publicUrlData.publicUrl;

    console.log("✅ PDF uploaded:", pdfUrl);

    // 3. Salva la richiesta di preventivo nel database
    const { error: quoteError } = await supabaseClient
      .from('professional_quotes')
      .insert({
        user_id: user.id,
        conversation_id: conversation.id,
        company_name: formData.companyName,
        contact_person: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        business_type: formData.businessType,
        plant_types: formData.plantTypes,
        current_challenges: formData.currentChallenges,
        expected_volume: formData.expectedVolume,
        preferred_features: formData.preferredFeatures,
        budget: formData.budget,
        timeline: formData.timeline,
        additional_info: formData.additionalInfo,
        pdf_url: pdfUrl,
        status: 'pending'
      });

    if (quoteError) {
      console.error("Error saving quote:", quoteError);
      throw new Error("Failed to save quote");
    }

    // 4. Crea un messaggio nella conversazione con il PDF allegato
    const { error: messageError } = await supabaseClient
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        recipient_id: expertId,
        content: `Richiesta di preventivo professionale per ${formData.companyName}`,
        text: `Richiesta di preventivo professionale per ${formData.companyName}`,
        pdf_path: pdfUrl,
        metadata: {
          type: 'professional_quote',
          company_name: formData.companyName,
          quote_id: conversation.id
        }
      });

    if (messageError) {
      console.error("Error creating message:", messageError);
      throw new Error("Failed to create message");
    }

    console.log("✅ Professional quote request completed successfully");

    // 5. Invia notifica all'esperto
    try {
      await supabaseClient.functions.invoke('notify-expert', {
        body: {
          conversationId: conversation.id,
          message: `Nuova richiesta di preventivo professionale da ${formData.companyName}`
        }
      });
    } catch (notifyError) {
      console.warn("⚠️ Failed to notify expert:", notifyError);
      // Non bloccare la richiesta se la notifica fallisce
    }

    return new Response(JSON.stringify({
      success: true,
      conversationId: conversation.id,
      pdfUrl: pdfUrl,
      message: "Professional quote request created successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("❌ Error processing request:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Failed to process request"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});