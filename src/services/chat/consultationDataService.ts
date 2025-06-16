
import { supabase } from '@/integrations/supabase/client';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { toast } from 'sonner';
import { ConsultationDataBuilder } from './consultationDataBuilder';
import { MessageService } from './messageService';

/**
 * Formatta i dati user e pianta come un testo leggibile per la chat.
 */
function formatConsultationChatMessage(plantData: any, userProfile: any) {
  // Dati utente - sempre presenti e dettagliati
  const firstName = userProfile?.firstName || "Non specificato";
  const lastName = userProfile?.lastName || "Non specificato";
  const email = userProfile?.email || "Non specificato";
  const birthDate = userProfile?.birthDate || "Non specificata";
  const birthPlace = userProfile?.birthPlace || "Non specificato";

  // Dati pianta
  const plantName = plantData?.plantName || 'Specie da identificare';
  const environment = plantData?.environment || 'Da specificare';
  const sunExposure = plantData?.sunExposure || 'Da specificare';
  const wateringFrequency = plantData?.wateringFrequency || 'Da specificare';
  const symptoms = plantData?.symptoms || 'Da descrivere durante la consulenza';

  // Componi messaggio strutturato con dati completi
  return [
    "👤 **Dati personali del paziente:**",
    `• Nome completo: ${firstName} ${lastName}`,
    `• Email: ${email}`,
    `• Data di nascita: ${birthDate}`,
    `• Luogo di nascita: ${birthPlace}`,
    "",
    "🌱 **Informazioni pianta in consulenza:**",
    `• Nome/Tipo: ${plantName}`,
    `• Ambiente coltivazione: ${environment}`,
    `• Esposizione luce solare: ${sunExposure}`,
    `• Frequenza irrigazione: ${wateringFrequency}`,
    `• Sintomi osservati: ${symptoms}`,
    "",
    "📋 **Note per l'esperto:**",
    "Tutti i dati del paziente e della pianta sono stati inviati automaticamente.",
    "Rispondere con diagnosi dettagliata e consigli di trattamento."
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
   * Invia automaticamente i dati completi di consultazione (utente + pianta) nella chat
   */
  static async sendInitialConsultationData(
    conversationId: string,
    plantData: PlantData,
    userProfile: UserProfile,
    fromAIDiagnosis: boolean = false
  ): Promise<boolean> {
    try {
      console.log('📤 Starting complete consultation data send...', {
        conversationId,
        hasImage: !!plantData.imageUrl,
        plantName: plantData.plantName,
        userEmail: userProfile.email,
        fromAIDiagnosis
      });

      // Ottieni l'ID utente corrente
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ User not authenticated');
        return false;
      }

      // Validazione dati utente - assicurati che siano sempre presenti
      if (!userProfile.email && !userProfile.firstName) {
        console.error('❌ Missing essential user data');
        return false;
      }

      // Costruisci messaggio principale con dati utente COMPLETI
      const mainMessage = formatConsultationChatMessage(plantData, userProfile);

      console.log('📝 Sending complete consultation message with user data:', {
        userDataIncluded: {
          name: `${userProfile.firstName} ${userProfile.lastName}`,
          email: userProfile.email,
          birthInfo: `${userProfile.birthDate} - ${userProfile.birthPlace}`
        },
        messageLength: mainMessage.length
      });

      // Invia il messaggio principale con dati utente e pianta
      const mainMessageSent = await MessageService.sendMessage(
        conversationId,
        user.id,
        mainMessage,
        {
          type: 'consultation_data',
          autoSent: true,
          fromAIDiagnosis,
          consultationType: fromAIDiagnosis ? 'ai_diagnosis_review' : 'direct_consultation',
          userData: {
            firstName: userProfile.firstName,
            lastName: userProfile.lastName,
            email: userProfile.email,
            birthDate: userProfile.birthDate,
            birthPlace: userProfile.birthPlace
          },
          plantData: {
            plantName: plantData.plantName,
            environment: plantData.environment,
            symptoms: plantData.symptoms
          }
        }
      );

      if (!mainMessageSent) {
        console.error('❌ Error sending main consultation message');
        return false;
      }

      // Invia l'immagine come messaggio separato se disponibile
      if (plantData.imageUrl) {
        console.log('📸 Sending plant image as separate message...');
        
        const imageCaptionMessage = '📸 Foto della pianta in consulenza:';
        await MessageService.sendMessage(
          conversationId,
          user.id,
          imageCaptionMessage,
          {
            type: 'image_caption',
            autoSent: true,
            isPlantImage: true,
            timestamp: new Date().toISOString()
          }
        );
        
        // Invio dell'immagine vera e propria
        await MessageService.sendImageMessage(conversationId, user.id, plantData.imageUrl);
      }

      console.log('✅ Complete consultation data (user + plant) sent successfully');
      return true;

    } catch (error) {
      console.error('❌ Error sending complete consultation data:', error);
      return false;
    }
  }

  static async isConsultationDataSent(conversationId: string): Promise<boolean> {
    return MessageService.checkConsultationDataSent(conversationId);
  }
}
