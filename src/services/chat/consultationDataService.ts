import { supabase } from '@/integrations/supabase/client';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';

/**
 * Formatta i dati di consultazione come messaggio leggibile per la chat
 */
function formatConsultationMessage(plantData: any, userProfile: any) {
  const firstName = userProfile?.firstName || "Non specificato";
  const lastName = userProfile?.lastName || "Non specificato";
  const email = userProfile?.email || "Non specificato";
  const birthDate = userProfile?.birthDate || "Non specificata";
  const birthPlace = userProfile?.birthPlace || "Non specificato";

  const plantName = plantData?.plantName || 'Specie da identificare';
  const environment = plantData?.environment || 'Da specificare';
  const sunExposure = plantData?.sunExposure || 'Da specificare';
  const wateringFrequency = plantData?.wateringFrequency || 'Da specificare';
  const symptoms = plantData?.symptoms || 'Da descrivere durante la consulenza';

  return [
    "👤 **DATI PERSONALI DEL PAZIENTE:**",
    `• Nome completo: ${firstName} ${lastName}`,
    `• Email: ${email}`,
    `• Data di nascita: ${birthDate}`,
    `• Luogo di nascita: ${birthPlace}`,
    "",
    "🌱 **INFORMAZIONI PIANTA IN CONSULENZA:**",
    `• Nome/Tipo: ${plantName}`,
    `• Ambiente coltivazione: ${environment}`,
    `• Esposizione luce solare: ${sunExposure}`,
    `• Frequenza irrigazione: ${wateringFrequency}`,
    `• Sintomi osservati: ${symptoms}`,
    "",
    "📋 **NOTE PER L'ESPERTO:**",
    "Tutti i dati del paziente e della pianta sono stati inviati automaticamente.",
    "Procedere con diagnosi e consigli di trattamento."
  ].join('\n');
}

export class ConsultationDataService {
  /**
   * Invia automaticamente i dati completi di consultazione come PDF professionale
   */
  static async sendInitialConsultationData(
    conversationId: string,
    plantData: any,
    userProfile: any,
    fromAIDiagnosis: boolean = false,
    diagnosisResult?: any
  ): Promise<boolean> {
    try {
      console.log('📄 GENERAZIONE PDF CONSULTAZIONE - INIZIO:', {
        conversationId,
        userProfile: userProfile?.email,
        plantData: plantData?.plantName,
        hasImage: !!plantData?.imageUrl,
        fromAIDiagnosis,
        hasDiagnosis: !!diagnosisResult,
        diagnosisResult
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ User non autenticato');
        return false;
      }

      // Ottieni la sessione una sola volta
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ No active session');
        return false;
      }

      // IMPORTANTE: Verifica se questa è una conversazione di tipo "professional_quote"
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('conversation_type')
        .eq('id', conversationId)
        .single();

      if (convError) {
        console.error('❌ Errore recupero tipo conversazione:', convError);
      }

      if (conversation?.conversation_type === 'professional_quote') {
        console.log('ℹ️ Questa è una conversazione professional_quote - PDF già generato, skip invio automatico');
        return true;
      }

      // Se c'è una diagnosi AI, invia sempre un nuovo PDF aggiornato
      if (!diagnosisResult) {
        const alreadySent = await this.isConsultationDataSent(conversationId);
        if (alreadySent) {
          console.log('ℹ️ Dati base già inviati, nessuna diagnosi AI da aggiungere');
          return true;
        }
      } else {
        console.log('🔄 Invio PDF con diagnosi AI aggiornata...');
      }

      // Chiama generate-professional-pdf (la funzione esistente aggiornata)
      console.log('📄 Chiamata a generate-professional-pdf con dati:', {
        plantData,
        userProfile,
        diagnosisResult,
        conversationId
      });
      
      const { data: pdfResult, error: pdfError } = await supabase.functions.invoke('generate-professional-pdf', {
        body: {
          plantData,
          userProfile,
          diagnosisResult,
          conversationId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('📄 Risposta generate-consultation-pdf:', { 
        success: pdfResult?.success,
        pdfUrl: pdfResult?.pdfUrl,
        message: pdfResult?.message,
        error: pdfError 
      });

      if (pdfError) {
        console.error('❌ Errore generazione PDF:', pdfError);
        // Fallback: invia i dati come messaggio testuale
        return await this.sendTextualConsultationData(conversationId, plantData, userProfile, diagnosisResult);
      }

      if (!pdfResult?.success) {
        console.error('❌ PDF function returned no success:', pdfResult);
        // Fallback: invia i dati come messaggio testuale
        return await this.sendTextualConsultationData(conversationId, plantData, userProfile, diagnosisResult);
      }

      console.log('✅ PDF generato e inserito in chat con successo!');
      console.log('📎 URL PDF:', pdfResult.pdfUrl);

      // Se c'è un'immagine della pianta, inviala come messaggio separato
      if (plantData?.imageUrl) {
        console.log('📸 Invio immagine pianta...');
        
        // Inserisci direttamente in chat_messages invece di usare send-message
        const { error: imageError } = await supabase
          .from('chat_messages')
          .insert({
            conversation_id: conversationId,
            sender: 'user',
            text: '📸 Foto della pianta in consulenza',
            image_url: plantData.imageUrl,
            created_at: new Date().toISOString()
          });

        if (imageError) {
          console.error('⚠️ Warning: Errore invio immagine:', imageError);
        } else {
          console.log('✅ Immagine inviata con successo');
        }
      }

      console.log('✅ INVIO PDF CONSULTAZIONE - COMPLETATO CON SUCCESSO');
      return true;

    } catch (error) {
      console.error('❌ ERRORE CRITICO INVIO PDF CONSULTAZIONE:', error);
      // Ultimo fallback: invia dati testuali
      return await this.sendTextualConsultationData(conversationId, plantData, userProfile, diagnosisResult);
    }
  }

  /**
   * Fallback method: invia i dati come messaggio testuale formattato
   */
  private static async sendTextualConsultationData(
    conversationId: string,
    plantData: any,
    userProfile: any,
    diagnosisResult?: any
  ): Promise<boolean> {
    try {
      console.log('📝 Invio dati consultazione come testo (fallback)');
      
      const textualMessage = formatConsultationMessage(plantData, userProfile);
      
      // Aggiungi i risultati della diagnosi AI se disponibili
      let fullMessage = textualMessage;
      if (diagnosisResult) {
        const diseases = diagnosisResult.diseases || diagnosisResult.primaryDiseases || [];
        if (diseases.length > 0) {
          fullMessage += "\n\n🤖 **RISULTATI DIAGNOSI AI:**\n";
          diseases.forEach((disease: any, index: number) => {
            const name = disease.disease || disease.name || 'Non identificata';
            const confidence = disease.confidence ? `${Math.round(disease.confidence * 100)}%` : 'N/A';
            fullMessage += `\n${index + 1}. ${name} (Confidenza: ${confidence})`;
            
            if (disease.treatments && disease.treatments.length > 0) {
              fullMessage += `\n   Trattamenti: ${disease.treatments.slice(0, 2).join(', ')}`;
            }
          });
        }
      }

      // Inserisci direttamente in chat_messages
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender: 'system',
          text: fullMessage,
          created_at: new Date().toISOString()
        });

      if (!error) {
        console.log('✅ Dati consultazione inviati come testo');
        return true;
      }
      
      console.error('❌ Errore invio messaggio testuale:', error);
      return false;
    } catch (error) {
      console.error('❌ Errore invio dati testuali:', error);
      return false;
    }
  }

  static async isConsultationDataSent(conversationId: string): Promise<boolean> {
    try {
      console.log('🔍 Verifica rapida dati consultazione per:', conversationId);
      
      // Controlla nella tabella corretta: chat_messages
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .or('text.ilike.%CONSULENZA PROFESSIONALE%,text.ilike.%DATI PERSONALI DEL PAZIENTE%,pdf_url.not.is.null')
        .limit(1);

      if (error) {
        console.error('❌ Errore verifica dati consultazione:', error);
        return false;
      }

      const hasConsultationData = messages && messages.length > 0;
      console.log('🔍 Dati consultazione già inviati:', hasConsultationData);
      return hasConsultationData;
    } catch (error) {
      console.error('❌ Errore verifica stato dati consultazione:', error);
      return false;
    }
  }
}
