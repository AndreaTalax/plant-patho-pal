
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
   * Invia automaticamente i dati completi di consultazione nella chat
   */
  static async sendInitialConsultationData(
    conversationId: string,
    plantData: any,
    userProfile: any,
    fromAIDiagnosis: boolean = false
  ): Promise<boolean> {
    try {
      console.log('📤 INVIO DATI CONSULTAZIONE - FORZA START:', {
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

      // NON controllare se già inviati - FORZA l'invio sempre
      console.log('🔄 FORZA invio senza controlli precedenti');

      // 1. INVIA MESSAGGIO PRINCIPALE con dati utente e pianta
      const mainMessage = formatConsultationMessage(plantData, userProfile);
      
      console.log('📝 FORZA invio messaggio principale con dati completi...');
      
      // Usa la send-message edge function per bypassare RLS
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ No active session');
        return false;
      }

      const { data, error } = await supabase.functions.invoke('send-message', {
        body: {
          conversationId,
          recipientId: MARCO_NIGRO_ID,
          text: mainMessage,
          imageUrl: null,
          products: null
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error || !data?.success) {
        console.error('❌ Error sending consultation data via edge function:', error);
        return false;
      }

      console.log('✅ Consultation data sent successfully via edge function');

      // 2. INVIA IMMAGINE come messaggio separato se disponibile
      if (plantData?.imageUrl) {
        console.log('📸 FORZA invio immagine della pianta...');
        
        // Prima invia un messaggio che descrive l'immagine
        const { data: captionData, error: captionError } = await supabase.functions.invoke('send-message', {
          body: {
            conversationId,
            recipientId: MARCO_NIGRO_ID,
            text: '📸 **FOTO DELLA PIANTA IN CONSULENZA:**',
            imageUrl: null,
            products: null
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (captionError) {
          console.error('⚠️ Warning: Could not send image caption');
        }
        
        // Poi invia l'immagine vera e propria
        const { data: imageData, error: imageError } = await supabase.functions.invoke('send-message', {
          body: {
            conversationId,
            recipientId: MARCO_NIGRO_ID,
            text: '📸 Immagine della pianta',
            imageUrl: plantData.imageUrl,
            products: null
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (imageError) {
          console.error('⚠️ Warning: Could not send plant image');
        } else {
          console.log('✅ Plant image sent successfully');
        }
      }

      console.log('✅ INVIO DATI CONSULTAZIONE - COMPLETATO CON SUCCESSO');
      return true;

    } catch (error) {
      console.error('❌ ERRORE CRITICO INVIO DATI CONSULTAZIONE:', error);
      return false;
    }
  }

  static async isConsultationDataSent(conversationId: string): Promise<boolean> {
    try {
      console.log('🔍 Checking if consultation data already sent for conversation:', conversationId);
      
      const { data: messages, error } = await supabase
        .from('messages')
        .select('metadata, content')
        .eq('conversation_id', conversationId)
        .ilike('content', '%DATI PERSONALI DEL PAZIENTE%');

      if (error) {
        console.error('❌ Error checking consultation data:', error);
        return false;
      }

      const hasConsultationData = messages && messages.length > 0;
      console.log('🔍 Consultation data already sent:', hasConsultationData);
      return hasConsultationData;
    } catch (error) {
      console.error('❌ Error checking consultation data status:', error);
      return false;
    }
  }
}
