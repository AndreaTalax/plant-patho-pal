import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
import nodemailer from "npm:nodemailer";

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

    const regularClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: { user } } = await regularClient.auth.getUser(token);
    if (!user) throw new Error("User not authenticated");

    const { formData } = await req.json();
    console.log("📋 Creating professional quote for user:", user.id);

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const expertId = '07c7fe19-33c3-4782-b9a0-4e87c8aa7044';
    const fileName = `quote-${user.id}-${Date.now()}.pdf`;

    // CREA CONVERSAZIONE, PDF, UPLOAD ecc... (tutta la tua parte invariata)
    // ⬇️ (Mantieni fino alla parte dove invii l'email)

    // --- dopo il PDF upload, la parte sotto resta identica ---

    const { data: publicUrlData } = supabaseClient
      .storage
      .from("professional-quotes")
      .getPublicUrl(fileName);

    const pdfUrl = publicUrlData.publicUrl;
    console.log("✅ PDF uploaded:", pdfUrl);

    // --- SALVATAGGIO quote e messaggi ---
    // (Mantieni tutto invariato fino al punto in cui parte "📧 Sending email with PDF attachment...")

    // 5. Invia email con PDF allegato tramite Gmail
    try {
      console.log("📧 Sending email with PDF attachment via Gmail...");

      // Crea trasporto Gmail
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: Deno.env.get("SMTP_USER"), // es. drplant.info@gmail.com
          pass: Deno.env.get("SMTP_PASS"), // password per app (16 caratteri)
        },
      });

      // Scarica PDF da Supabase Storage
      const { data: pdfData, error: downloadError } = await supabaseClient
        .storage
        .from("professional-quotes")
        .download(fileName);

      if (downloadError) throw new Error(`Error downloading PDF: ${downloadError.message}`);

      const arrayBuffer = await pdfData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // HTML email
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #228B22 0%, #32CD32 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Dr.Plant - Nuova Richiesta Preventivo</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #228B22;">Richiesta di Preventivo Professionale</h2>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Azienda:</strong> ${formData.companyName}</p>
              <p><strong>Contatto:</strong> ${formData.contactPerson}</p>
              <p><strong>Email:</strong> ${formData.email}</p>
              <p><strong>Telefono:</strong> ${formData.phone}</p>
              <p><strong>Tipo di Business:</strong> ${formData.businessType}</p>
            </div>
            <p>📎 Il PDF completo con tutti i dettagli è allegato a questa email.</p>
          </div>
        </div>
      `;

      // Invia email
      const info = await transporter.sendMail({
        from: `"Dr.Plant" <${Deno.env.get("SMTP_USER")}>`,
        to: "agrotecnicomarconigro@gmail.com",
        subject: `🌱 Nuova richiesta preventivo da ${formData.companyName}`,
        html: emailHtml,
        attachments: [
          {
            filename: fileName,
            content: buffer,
          },
        ],
      });

      console.log("✅ Email inviata con successo:", info.messageId);
    } catch (emailError) {
      console.error("❌ Failed to send email:", emailError);
    }

    // --- NOTIFICA esperto (resta identico) ---

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
