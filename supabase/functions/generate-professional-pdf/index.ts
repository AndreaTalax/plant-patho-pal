// Supabase Edge Function - generate-consultation-pdf.ts
// Versione aggiornata per gestire utenti professionisti

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://cdn.skypack.dev/pdf-lib";

serve(async (req) => {
  try {
    // Autenticazione Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { plantData, userProfile, diagnosisResult, conversationId } = await req.json();

    // Recupera profilo utente per tipo di abbonamento
    const { data: profileData, error: profileError } = await supabaseClient
      .from("profiles")
      .select("id, subscription_type")
      .eq("id", userProfile.id)
      .single();

    if (profileError) throw profileError;
    const isProfessional = profileData?.subscription_type === "professional";

    // Crea nuovo PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const { height } = page.getSize();

    let y = height - 60;

    // Header
    page.drawText("🪴 DrPlant - Diagnosi Pianta", {
      x: 50,
      y,
      size: 20,
      font,
      color: rgb(0.16, 0.45, 0.27),
    });
    y -= 40;

    // 🔹 Se non è professionista, includi i blocchi con dati personali e pianta
    if (!isProfessional) {
      page.drawText("👤 Dati Personali", {
        x: 50,
        y,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      });
      y -= 20;
      page.drawText(`Nome: ${userProfile.name || "N/D"}`, { x: 60, y, size: 12, font });
      y -= 15;
      page.drawText(`Email: ${userProfile.email || "N/D"}`, { x: 60, y, size: 12, font });
      y -= 30;

      page.drawText("🌿 Informazioni Pianta", {
        x: 50,
        y,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      });
      y -= 20;
      page.drawText(`Specie: ${plantData.species || "N/D"}`, { x: 60, y, size: 12, font });
      y -= 15;
      page.drawText(`Sintomi: ${plantData.symptoms || "N/D"}`, { x: 60, y, size: 12, font });
      y -= 30;
    }

    // Sezione diagnosi
    page.drawText("🩺 Diagnosi", {
      x: 50,
      y,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });
    y -= 20;

    const diagnosisText = diagnosisResult || "Nessuna diagnosi disponibile";
    const wrappedText = wrapText(diagnosisText, 80);
    wrappedText.forEach((line) => {
      page.drawText(line, { x: 60, y, size: 12, font });
      y -= 14;
    });

    // Salva PDF in buffer
    const pdfBytes = await pdfDoc.save();

    // Upload su Supabase Storage
    const fileName = `diagnosis_${conversationId}_${Date.now()}.pdf`;
    const { error: uploadError } = await supabaseClient.storage
      .from("consultation_pdfs")
      .upload(fileName, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Ottieni URL pubblico
    const { data: publicUrl } = supabaseClient.storage
      .from("consultation_pdfs")
      .getPublicUrl(fileName);

    // Salva nel DB (tabella messages o simile)
    await supabaseClient.from("messages").insert([
      {
        conversation_id: conversationId,
        sender: "system",
        text: "📄 Diagnosi completata — Scarica il PDF allegato",
        pdf_path: publicUrl.publicUrl,
        created_at: new Date().toISOString(),
      },
    ]);

    return new Response(JSON.stringify({ success: true, pdf_url: publicUrl.publicUrl }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Errore generazione PDF:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Utility per andare a capo nel testo
function wrapText(text: string, maxChars: number) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + word).length > maxChars) {
      lines.push(currentLine.trim());
      currentLine = word + " ";
    } else {
      currentLine += word + " ";
    }
  }
  if (currentLine.trim()) lines.push(currentLine.trim());
  return lines;
}
