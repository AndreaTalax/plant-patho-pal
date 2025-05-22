
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// ID dell'esperto/fitopatologo
const EXPERT_ID = "premium-user-id";

/**
 * Edge Function che notifica il fitopatologo di una nuova richiesta di consulenza
 * Crea una conversazione nella chat e invia il primo messaggio con l'immagine della pianta
 * e le informazioni fornite dall'utente
 */
serve(async (req) => {
  // Gestisci le richieste CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Ottieni i dati dalla richiesta
    const {
      consultationId,
      userId,
      imageUrl,
      symptoms,
      plantInfo,
      diagnosisResult, // Aggiungi il risultato della diagnosi AI se disponibile
      useAI // Flag per indicare se è stata usata l'AI
    } = await req.json();
    
    if (!userId || !consultationId) {
      return new Response(
        JSON.stringify({ 
          error: 'Dati mancanti', 
          details: 'userId e consultationId sono richiesti' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Inizializza il client Supabase con la service role key per bypassare RLS
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Ottieni il profilo dell'utente
    const { data: userProfile, error: userProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userProfileError) {
      console.error("Errore nel recupero del profilo utente:", userProfileError);
      return new Response(
        JSON.stringify({ error: 'Errore nel recupero del profilo utente' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verifica se esiste già una conversazione tra l'utente e l'esperto
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('expert_id', EXPERT_ID)
      .eq('status', 'active')
      .single();
    
    let conversationId;
    
    // Se non esiste una conversazione, creane una nuova
    if (!existingConversation) {
      const { data: newConversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          expert_id: EXPERT_ID,
          status: 'active'
        })
        .select()
        .single();
      
      if (conversationError) {
        console.error("Errore nella creazione della conversazione:", conversationError);
        return new Response(
          JSON.stringify({ error: 'Errore nella creazione della conversazione' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      conversationId = newConversation.id;
    } else {
      conversationId = existingConversation.id;
    }
    
    // Prepara il messaggio con le informazioni appropriate
    const username = userProfile.first_name 
      ? `${userProfile.first_name} ${userProfile.last_name || ''}`
      : userProfile.email || 'Utente';
      
    let messageText = `Nuova richiesta di consulenza da ${username}:\n\n`;
    
    if (useAI && diagnosisResult) {
      // Messaggio con risultato AI
      messageText += "Analisi AI:\n";
      messageText += `- Pianta: ${diagnosisResult.label || diagnosisResult.name}\n`;
      messageText += `- Parte riconosciuta: ${diagnosisResult.plantPart || "Intera pianta"}\n`;
      messageText += `- Stato salute: ${diagnosisResult.healthy ? 'Sana' : 'Malata'}\n`;
      messageText += `- Confidenza: ${Math.round((diagnosisResult.score || diagnosisResult.confidence || 0) * 100)}%\n\n`;
      
      // Se c'è una malattia identificata
      if (!diagnosisResult.healthy && diagnosisResult.disease) {
        messageText += `- Malattia rilevata: ${diagnosisResult.disease.name}\n`;
        messageText += `- Confidenza malattia: ${Math.round(diagnosisResult.disease.confidence * 100)}%\n`;
        if (diagnosisResult.disease.description) {
          messageText += `- Descrizione: ${diagnosisResult.disease.description}\n`;
        }
      }
      
      if (diagnosisResult.eppoRegulatedConcern) {
        messageText += `\n⚠️ ALLERTA: Possibile rilevamento di ${diagnosisResult.eppoRegulatedConcern.name}, un organismo regolamentato!\n`;
        messageText += `Tipo: ${diagnosisResult.eppoRegulatedConcern.type || "Non specificato"}\n`;
        messageText += `Stato normativo: ${diagnosisResult.eppoRegulatedConcern.regulatoryStatus || "Non specificato"}\n\n`;
      }
      
      messageText += "\nL'utente richiede un'ulteriore valutazione da parte dell'esperto.\n\n";
    } else {
      // Messaggio diretto all'esperto (senza AI)
      messageText += "L'utente ha scelto di NON utilizzare l'AI per questa diagnosi.\n\n";
    }
    
    // Aggiungi sempre i sintomi e le informazioni sulla pianta
    messageText += symptoms ? `Sintomi: ${symptoms}\n\n` : '';
    
    if (plantInfo) {
      messageText += "Informazioni sulla pianta:\n";
      messageText += `- Ambiente: ${plantInfo.isIndoor ? 'Interno' : 'Esterno'}\n`;
      messageText += `- Frequenza di irrigazione: ${plantInfo.wateringFrequency || 'Non specificata'} volte/settimana\n`;
      messageText += `- Esposizione alla luce: ${plantInfo.lightExposure || 'Non specificata'}\n`;
    }
    
    messageText += `\nID Consultazione: ${consultationId}`;
    
    // Crea il messaggio nella chat
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        recipient_id: EXPERT_ID,
        text: messageText
      })
      .select();
    
    if (messageError) {
      console.error("Errore nell'invio del messaggio:", messageError);
      return new Response(
        JSON.stringify({ error: 'Errore nell\'invio del messaggio' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Se c'è un'immagine, invia un secondo messaggio con l'immagine
    if (imageUrl) {
      const { error: imageMessageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          recipient_id: EXPERT_ID,
          text: "Immagine della pianta:",
          image_url: imageUrl
        });
      
      if (imageMessageError) {
        console.error("Errore nell'invio dell'immagine:", imageMessageError);
        // Continua comunque, il messaggio principale è stato inviato
      }
    }
    
    // Aggiorna lo stato della consultazione
    await supabase
      .from('expert_consultations')
      .update({ status: 'sent_to_expert' })
      .eq('id', consultationId);
    
    // Invia una notifica al fitopatologo usando la edge function di notifica specialistica
    try {
      await supabase.functions.invoke('send-specialist-notification', {
        body: {
          conversation_id: conversationId,
          sender_id: userId,
          recipient_id: EXPERT_ID,
          message_text: messageText,
          expert_email: 'fitopatologo@drplant.it', // Replace with actual expert email
          user_name: username,
          image_url: imageUrl,
          plant_details: plantInfo,
          user_details: {
            firstName: userProfile.first_name || '',
            lastName: userProfile.last_name || '',
            birthDate: userProfile.birth_date || '',
            birthPlace: userProfile.birth_place || '',
          }
        }
      });
      console.log('Notifica specialista inviata con successo');
    } catch (notifyError) {
      console.error('Errore nell\'invio della notifica al fitopatologo:', notifyError);
      // Continue even if notification fails
    }
    
    // Tutto è andato a buon fine
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Richiesta inviata con successo al fitopatologo',
        conversationId
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Errore nella notifica all'esperto:", error);
    return new Response(
      JSON.stringify({
        error: 'Si è verificato un errore interno',
        details: (error as Error).message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
