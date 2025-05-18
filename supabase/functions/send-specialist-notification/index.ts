
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Ottieni le variabili d'ambiente
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Crea un client Supabase con la chiave di servizio per operazioni privilegiate
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Gestisci richieste CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Ottieni dati dalla richiesta
    const { 
      conversation_id, 
      sender_id, 
      recipient_id, 
      message_text,
      expert_email,
      user_name,
      image_url,
      plant_details,
      user_details
    } = await req.json();

    // Verifica che i dati richiesti siano presenti
    if (!conversation_id || !sender_id || !recipient_id || !message_text) {
      return new Response(
        JSON.stringify({
          error: "Mancano dati richiesti: conversation_id, sender_id, recipient_id, message_text"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log(`Nuovo messaggio in conversazione ${conversation_id}: da ${sender_id} a ${recipient_id}`);
    if (user_details) {
      console.log(`Dettagli utente: ${user_details.firstName} ${user_details.lastName}`);
    }

    // Ottieni il profilo del destinatario per maggiori informazioni
    const { data: recipientProfile, error: recipientError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', recipient_id)
      .single();

    if (recipientError) {
      console.error("Errore nel recupero del profilo del destinatario:", recipientError);
      // Continuiamo comunque anche se non troviamo il profilo
    }

    // Ottieni il profilo del mittente per le notifiche
    const { data: senderProfile, error: senderError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', sender_id)
      .single();

    if (senderError) {
      console.error("Errore nel recupero del profilo del mittente:", senderError);
      // Continuiamo comunque anche se non troviamo il profilo
    }

    const senderName = user_details ? 
      `${user_details.firstName} ${user_details.lastName}` : 
      senderProfile?.username || senderProfile?.email || user_name || "Un utente";

    // Aggiorna la conversazione con l'ultimo messaggio
    const { error: updateError } = await supabaseAdmin
      .from('conversations')
      .update({
        last_message_text: message_text,
        last_message_timestamp: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversation_id);

    if (updateError) {
      console.error("Errore nell'aggiornamento della conversazione:", updateError);
      // Continuiamo comunque anche se l'aggiornamento fallisce
    }

    // Invia email al fitopatologo se abbiamo l'indirizzo email
    if (expert_email) {
      try {
        console.log(`Invio email al fitopatologo: ${expert_email}`);

        // Prepara l'HTML dell'email
        const emailHtml = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4CAF50; color: white; padding: 10px; text-align: center; }
              .content { padding: 20px; background-color: #f9f9f9; }
              .footer { font-size: 12px; text-align: center; margin-top: 30px; color: #666; }
              img.plant-image { max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; margin: 15px 0; }
              .info-box { background-color: #e8f5e9; border-left: 4px solid #4CAF50; padding: 10px; margin: 15px 0; }
              .user-info-box { background-color: #e3f2fd; border-left: 4px solid #2196F3; padding: 10px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Nuova Richiesta di Diagnosi</h1>
              </div>
              <div class="content">
                <p>Caro Fitopatologo,</p>
                <p>Hai ricevuto una nuova richiesta di diagnosi da <strong>${senderName}</strong>.</p>
                
                <div class="user-info-box">
                  <h3>Informazioni Utente:</h3>
                  <ul>
                    <li><strong>Nome:</strong> ${user_details?.firstName || 'Non specificato'}</li>
                    <li><strong>Cognome:</strong> ${user_details?.lastName || 'Non specificato'}</li>
                    <li><strong>Data di nascita:</strong> ${user_details?.birthDate || 'Non specificata'}</li>
                    <li><strong>Luogo di nascita:</strong> ${user_details?.birthPlace || 'Non specificato'}</li>
                  </ul>
                </div>
                
                <div class="info-box">
                  <h3>Sintomi riportati:</h3>
                  <p>${message_text.split('Sintomi:')[1]?.split('\n\n')[0] || 'Non specificati'}</p>
                  
                  <h3>Dettagli pianta:</h3>
                  <ul>
                    ${plant_details ? `
                      <li>Ambiente: ${plant_details.isIndoor ? 'Interno' : 'Esterno'}</li>
                      <li>Frequenza irrigazione: ${plant_details.wateringFrequency} volte a settimana</li>
                      <li>Esposizione luce: ${plant_details.lightExposure}</li>
                    ` : '<li>Nessun dettaglio disponibile</li>'}
                  </ul>
                </div>

                ${image_url ? `
                <h3>Immagine della pianta:</h3>
                <img src="${image_url}" alt="Immagine della pianta" class="plant-image">
                ` : '<p>Nessuna immagine fornita.</p>'}

                <p>Puoi rispondere direttamente dalla piattaforma Dr. Plant accedendo alla sezione chat.</p>
              </div>
              <div class="footer">
                <p>Questa è un'email automatica. Per favore non rispondere direttamente a questa email.</p>
                <p>© ${new Date().getFullYear()} Dr. Plant - Tutti i diritti riservati</p>
              </div>
            </div>
          </body>
        </html>
        `;

        // Invia l'email usando la funzione appropriata
        // Per ora stiamo solo simulando l'invio dell'email, aggiorna con il tuo metodo di invio
        console.log(`Email HTML generata per ${expert_email}`);
        console.log(`Simulazione invio email a ${expert_email} completata`);

        // Uncomment and implement this when you have an email service set up
        // This is an example if you're using SendGrid:
        /*
        const apiKey = Deno.env.get("SENDGRID_API_KEY");
        const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: expert_email }] }],
            from: { email: "noreply@drplant.it", name: "Dr. Plant" },
            subject: `Nuova richiesta di diagnosi da ${senderName}`,
            content: [{ type: "text/html", value: emailHtml }],
          }),
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Errore nell'invio dell'email:", errorText);
          throw new Error(`SendGrid API returned ${res.status}: ${errorText}`);
        }
        */
      } catch (emailError) {
        console.error("Errore nell'invio dell'email:", emailError);
        // Continuiamo comunque anche se l'invio dell'email fallisce
      }
    }

    console.log(`Notifica inviata per messaggio da ${senderName} a ${recipientProfile?.username || recipient_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notifica inviata con successo" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );

  } catch (error) {
    console.error("Errore nell'invio della notifica:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
