
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
   * Invia automaticamente i dati completi di consultazione nella chat - VERSIONE OTTIMIZZATA
   */
  static async sendInitialConsultationData(
    conversationId: string,
    plantData: any,
    userProfile: any,
    fromAIDiagnosis: boolean = false
  ): Promise<boolean> {
    try {
      console.log('📤 INVIO DATI CONSULTAZIONE - INIZIO OTTIMIZZATO:', {
        conversationId,
        userProfile: userProfile?.email,
        plantData: plantData?.plantName,
        hasImage: !!plantData?.imageUrl,
        fromAIDiagnosis
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

      // Prepara tutti i messaggi da inviare
      const messages = [];
      
      // 1. Messaggio principale con dati
      const mainMessage = formatConsultationMessage(plantData, userProfile);
      messages.push({
        conversationId,
        recipientId: MARCO_NIGRO_ID,
        text: mainMessage,
        imageUrl: null,
        products: null
      });

      // 2. Se c'è un'immagine, aggiungi i messaggi dell'immagine
      if (plantData?.imageUrl) {
        messages.push({
          conversationId,
          recipientId: MARCO_NIGRO_ID,
          text: '📸 **FOTO DELLA PIANTA IN CONSULENZA:**',
          imageUrl: null,
          products: null
        });
        
        messages.push({
          conversationId,
          recipientId: MARCO_NIGRO_ID,
          text: '📸 Immagine della pianta',
          imageUrl: plantData.imageUrl,
          products: null
        });
      }

      // Invia tutti i messaggi in parallelo per velocizzare
      console.log('📝 Invio messaggi in parallelo...');
      
      const sendPromises = messages.map(message => 
        supabase.functions.invoke('send-message', {
          body: message,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })
      );

      const results = await Promise.allSettled(sendPromises);
      
      // Controlla se tutti i messaggi sono stati inviati con successo
      const allSuccessful = results.every(result => 
        result.status === 'fulfilled' && result.value?.data?.success
      );

      if (allSuccessful) {
        console.log('✅ INVIO DATI CONSULTAZIONE - COMPLETATO CON SUCCESSO');
        return true;
      } else {
        console.error('❌ Alcuni messaggi non sono stati inviati correttamente');
        return false;
      }

    } catch (error) {
      console.error('❌ ERRORE CRITICO INVIO DATI CONSULTAZIONE:', error);
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
        .ilike('content', '%DATI PERSONALI DEL PAZIENTE%')
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
