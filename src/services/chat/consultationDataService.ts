
import { supabase } from '@/integrations/supabase/client';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { toast } from 'sonner';
import { ConsultationDataBuilder } from './consultationDataBuilder';
import { MessageService } from './messageService';

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

      // Costruisci il messaggio principale
      const mainMessage = ConsultationDataBuilder.buildMainMessage(
        plantData,
        userProfile,
        fromAIDiagnosis
      );

      console.log('📝 Sending main consultation message...');
      
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

      console.log('✅ Main consultation message sent');

      // Invia l'immagine come messaggio separato se disponibile
      if (plantData.imageUrl) {
        console.log('📸 Sending plant image as separate message...');
        await MessageService.sendImageMessage(conversationId, user.id, plantData.imageUrl);
      }

      console.log('✅ Consultation data sent successfully');
      return true;

    } catch (error) {
      console.error('❌ Error sending consultation data:', error);
      return false;
    }
  }

  /**
   * Verifica se i dati di consultazione sono già stati inviati
   */
  static async isConsultationDataSent(conversationId: string): Promise<boolean> {
    return MessageService.checkConsultationDataSent(conversationId);
  }
}
