import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !authData?.user) {
      throw new Error("Utente non autenticato");
    }

    const user = authData.user;

    const { data: profileData, error: profileError } = await supabaseClient
      .from("profiles")
      .select("subscription_type")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;

    const isProfessional = profileData?.subscription_type === "professional";
    console.log("👤 Utente:", user.id, "Abbonamento:", profileData?.subscription_type);

    const { plantData, userProfile, diagnosisResult, conversationId } = await req.json();

    console.log("📄 Generazione PDF iniziata per conversazione:", conversationId);
    console.log("🔍 diagnosisResult ricevuto:", JSON.stringify(diagnosisResult, null, 2));

    // Estrai le malattie da tutte le possibili strutture
    let diseases = [];
    
    if (diagnosisResult) {
      // Prova tutti i possibili percorsi dove potrebbero essere le malattie
      diseases = diagnosisResult.diseases || 
                 diagnosisResult.primaryDiseases || 
                 diagnosisResult.healthAssessment?.diseases ||
                 diagnosisResult.detectedDiseases ||
                 [];
      
      console.log("🦠 Malattie estratte:", diseases.length, "malattie trovate");
    }

    // Crea documento PDF
    const doc = new jsPDF();
    let y = 20;

    // Logo
    try {
      const logoArrayBuffer = await fetch("https://drplant.lovable.app/hortives-logo-pdf.jpg")
        .then((r) => r.arrayBuffer());
      const logoBase64 = btoa(
        new Uint8Array(logoArrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );
      doc.addImage(`data:image/jpeg;base64,${logoBase64}`, "JPEG", 80, y, 50, 25);
      y += 30;
    } catch (err) {
      console.warn("⚠️ Impossibile caricare il logo:", err);
      y += 10;
    }

    // Titolo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Dr.Plant - Consulenza Professionale", 20, y);
    y += 15;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Generato il: ${new Date().toLocaleDateString("it-IT")}`, 20, y);
    y += 20;

    // Dati personali (solo per utenti non professional)
    if (!isProfessional) {
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("DATI PERSONALI DEL PAZIENTE", 20, y);
      y += 10;

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");

      const personalData = [
        `Nome completo: ${userProfile?.firstName || ""} ${userProfile?.lastName || ""}`,
        `Email: ${userProfile?.email || "Non specificata"}`,
        `Data di nascita: ${userProfile?.birthDate || "Non specificata"}`,
        `Luogo di nascita: ${userProfile?.birthPlace || "Non specificato"}`,
        `Indirizzo: ${userProfile?.address || "Non specificato"}`,
        `Telefono: ${userProfile?.phone || "Non specificato"}`
      ];

      personalData.forEach((line) => {
        doc.text(line, 25, y);
        y += 7;
      });
      y += 10;

      // Informazioni pianta
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("INFORMAZIONI PIANTA IN CONSULENZA", 20, y);
      y += 10;

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");

      const plantInfo = [
        `Nome/Tipo: ${plantData?.plantName || "Specie non specificata"}`,
        `Ambiente: ${plantData?.environment || "Non specificato"}`,
        `Esposizione solare: ${plantData?.sunExposure || "Non specificata"}`,
        `Irrigazione: ${plantData?.wateringFrequency || "Non specificata"}`,
        `Età: ${plantData?.plantAge || "Non specificata"}`,
        `Terreno: ${plantData?.soilType || "Non specificato"}`,
        `Fertilizzante: ${plantData?.fertilizer || "Non specificato"}`,
        `Sintomi: ${plantData?.symptoms || "Non descritti"}`
      ];

      plantInfo.forEach((line) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 25, y);
        y += 7;
      });
      y += 10;
    }

    // Diagnosi AI - SEZIONE MIGLIORATA
    if (diseases.length > 0) {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("RISULTATI DIAGNOSI AI", 20, y);
      y += 10;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);

      diseases.forEach((disease, index) => {
        // Estrai il nome della malattia
        const name = disease.disease || disease.name || disease.disease_name || "Malattia sconosciuta";
        const confidence = disease.confidence 
          ? ` (Confidenza: ${Math.round(disease.confidence * 100)}%)`
          : "";

        // Nome malattia
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}. ${name}${confidence}`, 25, y);
        y += 7;
        doc.setFont("helvetica", "normal");

        // Descrizione
        if (disease.description) {
          const descLines = doc.splitTextToSize(`${disease.description}`, 160);
          descLines.forEach((line) => {
            if (y > 270) {
              doc.addPage();
              y = 20;
            }
            doc.text(line, 30, y);
            y += 6;
          });
          y += 3;
        }

        // Sintomi
        if (disease.symptoms && Array.isArray(disease.symptoms) && disease.symptoms.length > 0) {
          doc.text("Sintomi:", 30, y);
          y += 6;
          disease.symptoms.forEach((symptom) => {
            if (y > 270) {
              doc.addPage();
              y = 20;
            }
            const symptomLines = doc.splitTextToSize(`• ${symptom}`, 155);
            symptomLines.forEach((line) => {
              doc.text(line, 35, y);
              y += 6;
            });
          });
          y += 3;
        }

        // Trattamenti
        if (disease.treatments && Array.isArray(disease.treatments) && disease.treatments.length > 0) {
          doc.text("Trattamenti consigliati:", 30, y);
          y += 6;
          disease.treatments.forEach((treatment) => {
            if (y > 270) {
              doc.addPage();
              y = 20;
            }
            const treatmentLines = doc.splitTextToSize(`• ${treatment}`, 155);
            treatmentLines.forEach((line) => {
              doc.text(line, 35, y);
              y += 6;
            });
          });
          y += 3;
        } else if (disease.treatment) {
          // Trattamento singolo (non array)
          doc.text("Trattamento consigliato:", 30, y);
          y += 6;
          const treatmentLines = doc.splitTextToSize(`• ${disease.treatment}`, 155);
          treatmentLines.forEach((line) => {
            if (y > 270) {
              doc.addPage();
              y = 20;
            }
            doc.text(line, 35, y);
            y += 6;
          });
          y += 3;
        }

        y += 5; // Spazio tra malattie
      });
    }

    // Note finali
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("NOTE PER L'ESPERTO", 20, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const notes = [
      "Questo documento riassume la consulenza Dr.Plant.",
      "I risultati della diagnosi AI sono informativi e richiedono validazione professionale.",
      "Si raccomanda una visita in loco per una diagnosi definitiva."
    ];
    notes.forEach((note) => {
      const lines = doc.splitTextToSize(note, 160);
      lines.forEach((line) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 25, y);
        y += 6;
      });
    });

    // Upload PDF
    const pdfBlob = doc.output("blob");
    const fileName = `consultation-${conversationId}-${Date.now()}.pdf`;

    console.log("📤 Upload PDF:", fileName);

    const { error: uploadError } = await supabaseClient.storage
      .from("pdfs")
      .upload(fileName, pdfBlob, { contentType: "application/pdf" });

    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabaseClient.storage.from("pdfs").getPublicUrl(fileName);

    console.log("✅ PDF caricato:", publicUrl.publicUrl);

    // Inserisci messaggio nella chat con PDF
    const { error: chatError } = await supabaseClient
      .from("chat_messages")
      .insert({
        conversation_id: conversationId,
        sender: "system",
        text: "📄 Diagnosi AI completa — scarica il PDF allegato qui sotto.",
        pdf_url: publicUrl.publicUrl,
        created_at: new Date().toISOString()
      });

    if (chatError) {
      console.error("❌ Errore inserimento messaggio chat:", chatError);
      throw chatError;
    }

    console.log("✅ Messaggio PDF inserito in chat con successo!");

    return new Response(
      JSON.stringify({
        success: true,
        pdfUrl: publicUrl.publicUrl,
        fileName: fileName,
        message: "PDF generato e inviato in chat con successo"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    console.error("❌ Errore:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
