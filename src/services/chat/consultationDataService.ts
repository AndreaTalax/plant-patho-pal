import { supabase } from '@/integrations/supabase/client';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { MessageService } from './messageService';
import { uploadBase64Image } from '@/utils/imageStorage';

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
        hasDiagnosis: !!diagnosisResult
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

      // IMPORTANTE: Verifica il tipo di conversazione
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('conversation_type')
        .eq('id', conversationId)
        .single();

      if (convError) {
        console.error('❌ Errore recupero tipo conversazione:', convError);
      }

      // Se c'è una diagnosi AI, invia sempre un nuovo PDF aggiornato
      // Altrimenti controlla se i dati base sono già stati inviati
      if (!diagnosisResult) {
        const alreadySent = await this.isConsultationDataSent(conversationId);
        if (alreadySent) {
          console.log('ℹ️ Dati base già inviati, nessuna diagnosi AI da aggiungere');
          return true;
        }
      } else {
        console.log('🔄 Invio PDF con diagnosi AI aggiornata...');
      }

      // Genera il PDF professionale
      console.log('📄 Generazione PDF in corso...', {
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

      console.log('📄 Risposta PDF function:', { pdfResult, pdfError });

      if (pdfError) {
        console.error('❌ Errore generazione PDF:', pdfError);
        // Fallback: invia i dati come messaggio testuale
        return await this.sendTextualConsultationData(conversationId, plantData, userProfile, diagnosisResult);
      }

      if (!pdfResult?.success || !pdfResult?.pdfUrl) {
        console.error('❌ PDF function returned no success or no pdfUrl:', pdfResult);
        // Fallback: invia i dati come messaggio testuale
        return await this.sendTextualConsultationData(conversationId, plantData, userProfile, diagnosisResult);
      }

      console.log('✅ PDF generato con successo:', pdfResult.fileName);
      console.log('📎 URL PDF generato:', pdfResult.pdfUrl);

      // Carica l'immagine su storage se è un blob URL o base64
      let uploadedImageUrl = null;
      if (plantData?.imageUrl) {
        console.log('📸 Verifica e caricamento immagine su storage...');
        const imageUrl = plantData.imageUrl;
        
        // Verifica se è un blob URL o base64
        if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
          try {
            console.log('🔄 Caricamento immagine blob/base64 su storage...');
            uploadedImageUrl = await uploadBase64Image(imageUrl, user.id);
            console.log('✅ Immagine caricata su storage:', uploadedImageUrl);
          } catch (uploadError) {
            console.error('⚠️ Errore caricamento immagine su storage:', uploadError);
            // Continua senza immagine se il caricamento fallisce
          }
        } else {
          // È già un URL pubblico
          uploadedImageUrl = imageUrl;
          console.log('✅ Immagine già su storage:', uploadedImageUrl);
        }
      }

      // 🔥 LOGICA DIFFERENZIATA PER TIPO CONVERSAZIONE
      if (conversation?.conversation_type === 'professional_quote') {
        // PROFESSIONISTI: Testo + PDF (senza foto)
        console.log('📋 Invio messaggio PROFESSIONAL_QUOTE: testo + PDF');
        
        const professionalMessage = [
          "📋 **CONSULENZA PROFESSIONALE - DATI COMPLETI**",
          "",
          "Ho preparato un documento PDF completo con tutti i dati della consulenza:",
          "",
          "• Dati personali del paziente",
          "• Informazioni dettagliate della pianta", 
          "• Risultati della diagnosi AI (se disponibili)",
          "",
          "Il documento è pronto per la revisione professionale."
        ].join('\n');

        const { data: messageResult, error: messageError } = await supabase.functions.invoke('send-message', {
          body: {
            conversationId,
            recipientId: MARCO_NIGRO_ID,
            text: professionalMessage,
            imageUrl: null, // NO foto per professionisti
            pdfPath: pdfResult.pdfUrl,
            products: null
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (messageError || !messageResult?.success) {
          console.error('❌ Errore invio messaggio professionale:', messageError);
          return await this.sendPDFLinkMessage(conversationId, pdfResult.pdfUrl, pdfResult.fileName);
        }

      } else {
        // PRIVATI/BUSINESS: Solo foto + PDF (NO testo)
        console.log('📸 Invio messaggio PRIVATE/BUSINESS: foto + PDF (senza testo)');

        const { data: messageResult, error: messageError } = await supabase.functions.invoke('send-message', {
          body: {
            conversationId,
            recipientId: MARCO_NIGRO_ID,
            text: ' ', // Spazio singolo (campo obbligatorio)
            imageUrl: uploadedImageUrl, // Foto della pianta
            pdfPath: pdfResult.pdfUrl,  // PDF con dati
            products: null
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (messageError || !messageResult?.success) {
          console.error('❌ Errore invio messaggio private/business:', messageError);
          return await this.sendPDFLinkMessage(conversationId, pdfResult.pdfUrl, pdfResult.fileName);
        }
      }

      console.log('✅ Messaggio inviato con successo');
      console.log('✅ INVIO PDF CONSULTAZIONE - COMPLETATO CON SUCCESSO');
      return true;

    } catch (error) {
      console.error('❌ ERRORE CRITICO INVIO PDF CONSULTAZIONE:', error);
      // Ultimo fallback: invia dati testuali
      return await this.sendTextualConsultationData(conversationId, plantData, userProfile, diagnosisResult);
    }
  }

  /**
   * Fallback method: invia il PDF come link diretto
   */
  private static async sendPDFLinkMessage(
    conversationId: string, 
    pdfUrl: string, 
    fileName?: string
  ): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const linkMessage = [
        "📋 **CONSULENZA PROFESSIONALE - PDF GENERATO**",
        "",
        "I dati della consulenza sono stati compilati in un documento PDF professionale.",
        "",
        `📎 **[Scarica ${fileName || 'Consulenza Completa'}](${pdfUrl})**`,
        "",
        "Il documento contiene tutti i dettagli necessari per la diagnosi professionale."
      ].join('\n');

      const { data: result, error } = await supabase.functions.invoke('send-message', {
        body: {
          conversationId,
          recipientId: MARCO_NIGRO_ID,
          text: linkMessage,
          imageUrl: null,
          products: null
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      return !error && result?.success;
    } catch (error) {
      console.error('❌ Errore invio link PDF:', error);
      return false;
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
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const textualMessage = formatConsultationMessage(plantData, userProfile);
      
      // Aggiungi i risultati della diagnosi AI se disponibili
      let fullMessage = textualMessage;
      if (diagnosisResult) {
        fullMessage += [
          "",
          "🤖 **RISULTATI DIAGNOSI AI:**",
          `• Malattia identificata: ${diagnosisResult.disease || 'Non identificata'}`,
          `• Confidenza: ${diagnosisResult.confidence || 'N/A'}%`,
          `• Trattamento suggerito: ${diagnosisResult.treatment || 'Da definire'}`,
        ].join('\n');
      }

      const { data: result, error } = await supabase.functions.invoke('send-message', {
        body: {
          conversationId,
          recipientId: MARCO_NIGRO_ID,
          text: fullMessage,
          imageUrl: null,
          products: null
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!error && result?.success) {
        console.log('✅ Dati consultazione inviati come testo');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Errore invio dati testuali:', error);
      return false;
    }
  }

  static async isConsultationDataSent(conversationId: string): Promise<boolean> {
    try {
      console.log('🔍 Verifica rapida dati consultazione per:', conversationId);
      
      const { data: messages, error } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .or('text.ilike.%CONSULENZA PROFESSIONALE - DATI COMPLETI%,text.ilike.%DATI PERSONALI DEL PAZIENTE%')
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
