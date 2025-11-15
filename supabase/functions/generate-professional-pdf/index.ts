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

    console.log("📄 Starting PDF generation for:", user.id);

    try {
      // Inizializza jsPDF
      const doc = new jsPDF();
      let yPosition = 20;
      const pageWidth = 210; // A4 width in mm
      const marginLeft = 25;
      const marginRight = 15;
      const maxWidth = pageWidth - marginLeft - marginRight; // 170mm
      
      // Helper function to add wrapped text
      const addWrappedText = (text: string, x: number, fontSize: number = 12, isBold: boolean = false) => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        const lines = doc.splitTextToSize(text, maxWidth - (x - marginLeft));
        
        lines.forEach((line: string) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, x, yPosition);
          yPosition += fontSize * 0.5; // Line height proportional to font size
        });
      };

      // Aggiungi il logo Hortives
      try {
        // Carica il logo specifico per PDF dal deployment pubblico
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
        
        // Aggiungi logo Hortives centrato in alto (50x25 mm)
        doc.addImage(`data:image/jpeg;base64,${logoBase64}`, 'JPEG', 80, yPosition, 50, 25);
        console.log("✅ Logo Hortives aggiunto al PDF");
      } catch (logoError) {
        console.warn("⚠️ Logo non caricato:", logoError);
        // Procedi senza logo se non disponibile
      }

      yPosition += 25;

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
        addWrappedText(line, 25, 12, false);
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
        addWrappedText(line, 25, 12, false);
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

              if (disease.symptoms && disease.symptoms.length > 0) {
                const symptomsText = `   Sintomi: ${disease.symptoms.slice(0, 3).join(', ')}`;
                addWrappedText(symptomsText, 30, 12, false);
              }

              if (disease.treatments && disease.treatments.length > 0) {
                addWrappedText(`   Trattamenti suggeriti:`, 30, 12, false);
                disease.treatments.slice(0, 2).forEach((treatment: any) => {
                  const treatmentText = typeof treatment === 'string' ? treatment : treatment.name || treatment.description || '';
                  if (treatmentText) {
                    addWrappedText(`     - ${treatmentText}`, 30, 12, false);
                  }
                });
              }

              if (disease.severity) {
                const severityLabel = disease.severity === 'high' ? 'Alta' : disease.severity === 'medium' ? 'Media' : 'Bassa';
                doc.text(`   Gravita: ${severityLabel}`, 30, yPosition);
                yPosition += 7;
              }

              yPosition += 3;
            });
          }

          if (diagnosisResult.healthAssessment) {
            yPosition += 5;
            addWrappedText(`Valutazione generale: ${diagnosisResult.healthAssessment}`, 25, 12, true);
          }

          if (diagnosisResult.plantIdentification) {
            yPosition += 5;
            addWrappedText(`Identificazione pianta: ${diagnosisResult.plantIdentification}`, 25, 12, false);
          }

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
      if (yPosition > 230) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("NOTE PER L'ESPERTO", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");

      const expertNotes = [
        "Questo documento contiene tutti i dati forniti dal paziente per la consulenza fitopatologo.",
        "Si prega di procedere con la diagnosi professionale e fornire raccomandazioni di trattamento specifiche.",
        "",
        "I dati della diagnosi AI sono forniti a scopo informativo e richiedono validazione professionale."
      ];

      expertNotes.forEach(note => {
        if (note === "") {
          yPosition += 3;
        } else {
          addWrappedText(note, 25, 12, false);
        }
      });

      // Genera il PDF come blob
      const pdfBlob = doc.output("blob");
      const fileName = `consultation-${conversationId}-${Date.now()}.pdf`;

      console.log("📄 Uploading PDF to storage...");

      // Upload del PDF a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseClient
        .storage
        .from("pdfs")
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
        .from("pdfs")
        .getPublicUrl(fileName);

      const pdfUrl = publicUrlData.publicUrl;

      console.log("✅ PDF generated and uploaded successfully:", fileName);
      console.log("📎 Public URL:", pdfUrl);

      // Risposta con success, pdfUrl e fileName
      return new Response(JSON.stringify({
        success: true,
        pdfUrl: pdfUrl,
        fileName: fileName,
        message: "PDF generated successfully"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } catch (pdfError: any) {
      console.error("❌ Error during PDF generation:", pdfError);
      return new Response(JSON.stringify({
        success: false,
        error: pdfError.message || "Failed to generate PDF"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

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