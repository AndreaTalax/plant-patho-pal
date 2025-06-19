
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
      console.log('📤 INVIO DATI CONSULTAZIONE - START:', {
        conversationId,
        userProfile: userProfile?.email,
        plantData: plantData?.plantName,
        hasImage: !!plantData?.imageUrl
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ User non autenticato');
        return false;
      }

      // Controlla se i dati sono già stati inviati
      const alreadySent = await this.isConsultationDataSent(conversationId);
      if (alreadySent) {
        console.log('✅ Dati già inviati, skip');
        return true;
      }

      // 1. INVIA MESSAGGIO PRINCIPALE con dati utente e pianta
      const mainMessage = formatConsultationMessage(plantData, userProfile);
      
      console.log('📝 Invio messaggio principale con dati completi...');
      const mainSuccess = await MessageService.sendMessage(
        conversationId,
        user.id,
        mainMessage,
        {
          type: 'consultation_data',
          autoSent: true,
          fromAIDiagnosis,
          consultationType: fromAIDiagnosis ? 'ai_diagnosis_review' : 'direct_consultation',
          userData: userProfile,
          plantData: plantData
        }
      );

      if (!mainSuccess) {
        console.error('❌ Errore invio messaggio principale');
        return false;
      }

      // 2. INVIA IMMAGINE come messaggio separato se disponibile
      if (plantData?.imageUrl) {
        console.log('📸 Invio immagine della pianta...');
        
        // Prima invia un messaggio che descrive l'immagine
        await MessageService.sendMessage(
          conversationId,
          user.id,
          '📸 **FOTO DELLA PIANTA IN CONSULENZA:**',
          {
            type: 'image_caption',
            autoSent: true,
            isPlantImage: true
          }
        );
        
        // Poi invia l'immagine vera e propria
        await MessageService.sendImageMessage(conversationId, user.id, plantData.imageUrl);
      }

      console.log('✅ INVIO DATI CONSULTAZIONE - COMPLETATO');
      return true;

    } catch (error) {
      console.error('❌ ERRORE INVIO DATI CONSULTAZIONE:', error);
      return false;
    }
  }

  static async isConsultationDataSent(conversationId: string): Promise<boolean> {
    return MessageService.checkConsultationDataSent(conversationId);
  }
}
