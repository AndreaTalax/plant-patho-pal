import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
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

    const regularClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: { user } } = await regularClient.auth.getUser(token);
    if (!user) throw new Error("User not authenticated");

    const { formData } = await req.json();
    console.log("📋 Creating private/business quote for user:", user.id);

    // 1️⃣ Crea conversazione
    const { data: conversation, error: convError } = await supabaseClient
      .from('conversations')
      .insert({
        user_id: user.id,
        conversation_type: 'private_business',
        title: `Richiesta ${formData.companyName || "Privato"}`,
        status: 'active'
      })
      .select()
      .single();

    if (convError) throw convError;
    console.log("✅ Conversation created:", conversation.id);

    // 2️⃣ Genera PDF
    const doc = new jsPDF();
    let yPosition = 20;

    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("RICHIESTA DI DIAGNOSI / BUSINESS", 105, yPosition, { align: 'center' });
    yPosition += 12;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    if (formData.name) doc.text(`Nome: ${formData.name}`, 20, yPosition);
    if (formData.email) doc.text(`Email: ${formData.email}`, 20, yPosition += 6);
    if (formData.phone) doc.text(`Telefono: ${formData.phone}`, 20, yPosition += 6);
    if (formData.companyName) doc.text(`Azienda: ${formData.companyName}`, 20, yPosition += 6);
    if (formData.details) {
      yPosition += 6;
      doc.setFont("helvetica", "bold");
      doc.text("Dettagli richiesta:", 20, yPosition);
      doc.setFont("helvetica", "normal");
      yPosition += 6;
      doc.splitTextToSize(formData.details, 170).forEach(line => {
        doc.text(line, 20, yPosition);
        yPosition += 6;
      });
    }

    // 3️⃣ Convert PDF in Uint8Array per Supabase Storage
    const pdfBytes = new Uint8Array(await doc.output("arraybuffer"));
    const fileName = `private-business-${conversation.id}-${Date.now()}.pdf`;

    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from("pdfs")
      .upload(fileName, pdfBytes, { contentType: "application/pdf", upsert: true });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabaseClient
      .storage
      .from("pdfs")
      .getPublicUrl(fileName);

    const pdfUrl = publicUrlData.publicUrl;
    console.log("✅ PDF uploaded:", pdfUrl);

    // 4️⃣ Salva richiesta su user_diagnosis
    const { error: diagnosisError } = await supabaseClient
      .from('user_diagnosis')
      .insert({
        user_id: user.id,
        conversation_id: conversation.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company_name: formData.companyName,
        details: formData.details,
        pdf_url: pdfUrl,
        status: 'pending'
      });

    if (diagnosisError) throw diagnosisError;

    // 5️⃣ Ottieni l'ID dell'admin/esperto per recipient_id
    const { data: adminUser } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .single();

    // 6️⃣ Inserisci UN SOLO messaggio con solo foto + PDF
    const { error: messageError } = await supabaseClient
      .from('messages')
      .insert([{
        conversation_id: conversation.id,
        sender_id: user.id,
        recipient_id: adminUser?.id || user.id, // Admin o fallback al sender
        content: ' ', // Spazio singolo (NOT NULL requirement)
        text: '', // Vuoto (ha default)
        image_url: formData.imageUrl || null,
        pdf_path: pdfUrl,
        metadata: { 
          type: 'user_request', 
          auto_generated: true
        }
      }]);

    if (messageError) throw messageError;

    return new Response(JSON.stringify({
      success: true,
      conversationId: conversation.id,
      pdfUrl,
      message: "Private/Business request created successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
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
