import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Importa jsPDF per generare PDF
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

    const { plantData, userProfile, diagnosisResult, conversationId } = await req.json();

    console.log("📄 Generating professional consultation PDF for:", user.id);

    // Crea nuovo documento PDF
    const doc = new jsPDF();
    let yPosition = 20;

    // Header del documento
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Dr.Plant - Consulenza Professionale", 20, yPosition);
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Generato il: ${new Date().toLocaleDateString('it-IT')}`, 20, yPosition);
    yPosition += 20;

    // Sezione dati personali
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("DATI PERSONALI DEL PAZIENTE", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    
    const firstName = userProfile?.firstName || userProfile?.first_name || "Non specificato";
    const lastName = userProfile?.lastName || userProfile?.last_name || "Non specificato";
    const email = userProfile?.email || "Non specificato";
    const birthDate = userProfile?.birthDate || userProfile?.birth_date || "Non specificata";
    const birthPlace = userProfile?.birthPlace || userProfile?.birth_place || "Non specificato";
    const address = userProfile?.address || "Non specificato";
    const phone = userProfile?.phone || "Non specificato";

    const personalData = [
      `Nome completo: ${firstName} ${lastName}`,
      `Email: ${email}`,
      `Data di nascita: ${birthDate}`,
      `Luogo di nascita: ${birthPlace}`,
      `Indirizzo: ${address}`,
      `Telefono: ${phone}`
    ];

    personalData.forEach(line => {
      doc.text(line, 25, yPosition);
      yPosition += 7;
    });

    yPosition += 10;

    // Sezione informazioni pianta
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("INFORMAZIONI PIANTA IN CONSULENZA", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    const plantName = plantData?.plantName || plantData?.plant_name || 'Specie da identificare';
    const environment = plantData?.environment || 'Da specificare';
    const sunExposure = plantData?.sunExposure || plantData?.sun_exposure || 'Da specificare';
    const wateringFrequency = plantData?.wateringFrequency || plantData?.watering_frequency || 'Da specificare';
    const symptoms = plantData?.symptoms || 'Da descrivere durante la consulenza';
    const plantAge = plantData?.plantAge || plantData?.plant_age || 'Non specificata';
    const fertilizer = plantData?.fertilizer || 'Non specificato';
    const soilType = plantData?.soilType || plantData?.soil_type || 'Non specificato';

    const plantInfo = [
      `Nome/Tipo: ${plantName}`,
      `Ambiente di coltivazione: ${environment}`,
      `Esposizione alla luce solare: ${sunExposure}`,
      `Frequenza di irrigazione: ${wateringFrequency}`,
      `Età della pianta: ${plantAge}`,
      `Tipo di fertilizzante: ${fertilizer}`,
      `Tipo di terreno: ${soilType}`,
      `Sintomi osservati: ${symptoms}`
    ];

    plantInfo.forEach(line => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 25, yPosition);
      yPosition += 7;
    });

    yPosition += 10;

    // Sezione diagnosi AI (se disponibile)
    if (diagnosisResult) {
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("RISULTATI DIAGNOSI AI", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");

      // Handle different result structures
      const diseases = diagnosisResult.diseases || [];
      
      if (diseases && diseases.length > 0) {
        doc.text("Malattie e problemi identificati:", 25, yPosition);
        yPosition += 7;

        diseases.forEach((disease: any, index: number) => {
          if (yPosition > 260) {
            doc.addPage();
            yPosition = 20;
          }
          
          const diseaseName = disease.disease || disease.name || 'Malattia sconosciuta';
          const confidence = disease.confidence ? `(${Math.round(disease.confidence)}% confidenza)` : '';
          
          doc.setFont("helvetica", "bold");
          doc.text(`${index + 1}. ${diseaseName} ${confidence}`, 30, yPosition);
          yPosition += 7;
          
          doc.setFont("helvetica", "normal");

          // Symptoms
          if (disease.symptoms && disease.symptoms.length > 0) {
            doc.text(`   Sintomi: ${disease.symptoms.slice(0, 3).join(', ')}`, 30, yPosition);
            yPosition += 7;
          }

          // Treatments
          if (disease.treatments && disease.treatments.length > 0) {
            doc.text(`   Trattamenti suggeriti:`, 30, yPosition);
            yPosition += 7;
            disease.treatments.slice(0, 2).forEach((treatment: any) => {
              if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
              }
              const treatmentText = typeof treatment === 'string' ? treatment : treatment.name || treatment.description || '';
              if (treatmentText) {
                doc.text(`     - ${treatmentText.substring(0, 60)}`, 30, yPosition);
                yPosition += 6;
              }
            });
          }

          // Severity
          if (disease.severity) {
            const severityLabel = disease.severity === 'high' ? 'Alta' : disease.severity === 'medium' ? 'Media' : 'Bassa';
            doc.text(`   Gravita: ${severityLabel}`, 30, yPosition);
            yPosition += 7;
          }

          yPosition += 3; // Space between diseases
        });
      }

      // Health assessment
      if (diagnosisResult.healthAssessment) {
        yPosition += 5;
        doc.setFont("helvetica", "bold");
        doc.text(`Valutazione generale: ${diagnosisResult.healthAssessment}`, 25, yPosition);
        yPosition += 7;
        doc.setFont("helvetica", "normal");
      }

      // Plant identification from diagnosis
      if (diagnosisResult.plantIdentification) {
        yPosition += 5;
        doc.text(`Identificazione pianta: ${diagnosisResult.plantIdentification}`, 25, yPosition);
        yPosition += 7;
      }

      // Primary disease summary
      if (diagnosisResult.primaryDisease && diagnosisResult.primaryDisease.name) {
        yPosition += 5;
        doc.setFont("helvetica", "bold");
        doc.text(`Problema principale: ${diagnosisResult.primaryDisease.name}`, 25, yPosition);
        yPosition += 7;
        doc.setFont("helvetica", "normal");
        
        if (diagnosisResult.primaryDisease.confidence) {
          doc.text(`Confidenza: ${diagnosisResult.primaryDisease.confidence}%`, 25, yPosition);
          yPosition += 7;
        }
      }
    }

    // Note per l'esperto
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }

    yPosition += 10;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("NOTE PER L'ESPERTO", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const expertNotes = [
      "• Tutti i dati del paziente e della pianta sono stati raccolti automaticamente",
      "• L'immagine della pianta è allegata alla conversazione",
      "• Procedere con diagnosi professionale e consigli di trattamento personalizzati",
      "• Verificare la compatibilità dei trattamenti con l'ambiente di coltivazione"
    ];

    expertNotes.forEach(note => {
      doc.text(note, 25, yPosition);
      yPosition += 7;
    });

    // Footer
    yPosition = 280;
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("Documento generato automaticamente da Dr.Plant - Sistema di Consulenza Professionale", 20, yPosition);

    // Genera il PDF come buffer
    const pdfBuffer = doc.output('arraybuffer');
    
    // Carica il PDF su Supabase Storage
    const fileName = `consultation-${conversationId}-${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('pdfs')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Error uploading PDF:', uploadError);
      throw new Error('Failed to save PDF');
    }

    // Ottieni URL pubblico del PDF
    const { data: { publicUrl } } = supabaseClient.storage
      .from('pdfs')
      .getPublicUrl(fileName);

    console.log('✅ PDF generated and uploaded successfully:', fileName);

    return new Response(JSON.stringify({
      success: true,
      pdfUrl: publicUrl,
      fileName: fileName
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("❌ Error generating PDF:", error);
    return new Response(JSON.stringify({
      error: error.message || "Failed to generate PDF"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});