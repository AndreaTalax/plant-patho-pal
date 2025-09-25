
import { supabase } from '@/integrations/supabase/client';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { MessageService } from './messageService';

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

      // Controlla prima se il PDF è già stato inviato
      const alreadySent = await this.isConsultationDataSent(conversationId);
      if (alreadySent) {
        console.log('ℹ️ PDF consultazione già inviato per questa conversazione');
        return true;
      }

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
        return false;
      }

      if (!pdfResult?.success) {
        console.error('❌ PDF function returned no success:', pdfResult);
        return false;
      }

      console.log('✅ PDF generato con successo:', pdfResult.fileName);

      // Invia il messaggio con il PDF
      const pdfMessage = [
        "📋 **CONSULENZA PROFESSIONALE - DATI COMPLETI**",
        "",
        "Ho preparato un documento PDF completo con tutti i dati della consulenza:",
        "",
        "• Dati personali del paziente",
        "• Informazioni dettagliate della pianta",
        "• Risultati della diagnosi AI (se disponibili)",
        "• Photo della pianta allegata alla conversazione",
        "",
        "Il documento è pronto per la revisione professionale.",
        "",
        `📎 [Scarica PDF Consulenza](${pdfResult.pdfUrl})`
      ].join('\n');

      // Invia il messaggio principale con PDF
      const { data: messageResult, error: messageError } = await supabase.functions.invoke('send-message', {
        body: {
          conversationId,
          recipientId: MARCO_NIGRO_ID,
          text: pdfMessage,
          imageUrl: null,
          products: null
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (messageError || !messageResult?.success) {
        console.error('❌ Errore invio messaggio PDF:', messageError);
        return false;
      }

      // Se c'è un'immagine, inviala come messaggio separato
      if (plantData?.imageUrl) {
        console.log('📸 Invio immagine pianta...');
        const { data: imageResult, error: imageError } = await supabase.functions.invoke('send-message', {
          body: {
            conversationId,
            recipientId: MARCO_NIGRO_ID,
            text: '📸 Foto della pianta in consulenza',
            imageUrl: plantData.imageUrl,
            products: null
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
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
        .ilike('text', '%CONSULENZA PROFESSIONALE - DATI COMPLETI%')
        .limit(1);

      if (error) {
        console.error('❌ Errore verifica dati consultazione:', error);
        return false;
      }

      const hasConsultationData = messages && messages.length > 0;
      console.log('🔍 PDF consultazione già inviato:', hasConsultationData);
      return hasConsultationData;
    } catch (error) {
      console.error('❌ Errore verifica stato dati consultazione:', error);
      return false;
    }
  }
}
