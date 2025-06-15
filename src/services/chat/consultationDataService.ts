
import { supabase } from '@/integrations/supabase/client';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { toast } from 'sonner';
import { ConsultationDataBuilder } from './consultationDataBuilder';
import { MessageService } from './messageService';

/**
 * Formatta i dati user e pianta come un testo leggibile per la chat.
 */
function formatConsultationChatMessage(plantData: any, userProfile: any) {
  // User
  const firstName = userProfile?.firstName || "Non specificato";
  const lastName = userProfile?.lastName || "Non specificato";
  const email = userProfile?.email || "Non specificato";
  const birthDate = userProfile?.birthDate || "Non specificata";
  const birthPlace = userProfile?.birthPlace || "Non specificato";

  // Plant
  const plantName = plantData?.plantName || 'Specie da identificare';
  const environment = plantData?.environment || 'Da specificare';
  const sunExposure = plantData?.sunExposure || 'Da specificare';
  const wateringFrequency = plantData?.wateringFrequency || 'Da specificare';
  const symptoms = plantData?.symptoms || 'Da descrivere durante la consulenza';

  // Componi testo strutturato
  return [
    "👤 **Dati personali:**",
    `• Nome: ${firstName} ${lastName}`,
    `• Email: ${email}`,
    `• Data di nascita: ${birthDate}`,
    `• Luogo di nascita: ${birthPlace}`,
    "",
    "🌱 **Informazioni pianta:**",
    `• Nome/Tipo: ${plantName}`,
    `• Ambiente: ${environment}`,
    `• Esposizione luce: ${sunExposure}`,
    `• Irrigazione: ${wateringFrequency}`,
    `• Sintomi descritti: ${symptoms}`
  ].join('\n');
}

interface PlantData {
  symptoms?: string;
  wateringFrequency?: string;
  sunExposure?: string;
  environment?: string;
  plantName?: string;
  imageUrl?: string;
  aiDiagnosis?: any;
  useAI?: boolean;
  sendToExpert?: boolean;
}

interface UserProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  birthDate?: string;
  birthPlace?: string;
}

export class ConsultationDataService {
  /**
   * Invia automaticamente i dati iniziali di consultazione nella chat
   */
  static async sendInitialConsultationData(
    conversationId: string,
    plantData: PlantData,
    userProfile: UserProfile,
    fromAIDiagnosis: boolean = false
  ): Promise<boolean> {
    try {
      console.log('📤 Starting consultation data send...', {
        conversationId,
        hasImage: !!plantData.imageUrl,
        plantName: plantData.plantName,
        userProfile: userProfile
      });

      // Ottieni l'ID utente corrente
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ User not authenticated');
        return false;
      }

      // Costruisci messaggio principale (personalizzato leggibile)
      const mainMessage = formatConsultationChatMessage(plantData, userProfile);

      console.log('📝 Sending main consultation message (FULL):', mainMessage);

      // Invia il messaggio principale
      const mainMessageSent = await MessageService.sendMessage(
        conversationId,
        user.id,
        mainMessage,
        {
          type: 'consultation_data',
          autoSent: true,
          fromAIDiagnosis,
          consultationType: fromAIDiagnosis ? 'ai_diagnosis_review' : 'direct_consultation'
        }
      );

      if (!mainMessageSent) {
        console.error('❌ Error sending main message');
        return false;
      }

      // Invia l'immagine come messaggio separato, aggiungendo una didascalia per forzare la visualizzazione completa
      if (plantData.imageUrl) {
        console.log('📸 Sending plant image as separate message...');
        // Caption per evitare che sia "troncata"
        const imageMsgCaption = 'Foto allegata della pianta:';
        const captionMessage = await MessageService.sendMessage(
          conversationId,
          user.id,
          imageMsgCaption,
          {
            type: 'image_caption',
            autoSent: true,
            isPlantImage: true,
            timestamp: new Date().toISOString()
          }
        );
        // Poi invio l'immagine vera e propria
        await MessageService.sendImageMessage(conversationId, user.id, plantData.imageUrl);
      }

      console.log('✅ Consultation data sent successfully');
      return true;

    } catch (error) {
      console.error('❌ Error sending consultation data:', error);
      return false;
    }
  }

  static async isConsultationDataSent(conversationId: string): Promise<boolean> {
    return MessageService.checkConsultationDataSent(conversationId);
  }
}

