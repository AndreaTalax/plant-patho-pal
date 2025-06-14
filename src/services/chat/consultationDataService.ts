
import { supabase } from '@/integrations/supabase/client';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { toast } from 'sonner';

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
      console.log('📤 Sending consultation data...');

      // Ottieni l'ID utente corrente
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ User not authenticated');
        return false;
      }

      // Messaggio principale con i dati (senza immagine per evitare payload troppo grande)
      let mainMessage = `🌿 **Nuova Richiesta di Consulenza**

👤 **Dati Utente:**
- Nome: ${userProfile.firstName || ''} ${userProfile.lastName || ''}
- Email: ${userProfile.email || 'Non specificata'}

🌱 **Informazioni della Pianta:**
- Nome/Tipo: ${plantData.plantName || 'Pianta non identificata'}
- Ambiente: ${plantData.environment || 'Non specificato'}
- Sintomi: ${plantData.symptoms || 'Nessun sintomo specificato'}
- Frequenza irrigazione: ${this.getWateringText(plantData.wateringFrequency)}
- Esposizione solare: ${this.getSunExposureText(plantData.sunExposure)}`;

      if (fromAIDiagnosis && plantData.aiDiagnosis) {
        mainMessage += `

🤖 **Diagnosi AI Precedente:**
- Pianta identificata: ${plantData.aiDiagnosis.consensus?.mostLikelyPlant?.plantName || 'Non identificata'}
- Confidenza: ${plantData.aiDiagnosis.consensus?.overallConfidence || 0}%
- Stato: ${plantData.aiDiagnosis.diseaseDetection?.length > 0 ? 'Problemi rilevati' : 'Apparentemente sana'}`;
      }

      mainMessage += `

*Dati inviati automaticamente dal sistema Dr.Plant*`;

      // Invia il messaggio principale
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          recipient_id: MARCO_NIGRO_ID,
          content: mainMessage,
          text: mainMessage,
          metadata: {
            type: 'consultation_data',
            autoSent: true,
            fromAIDiagnosis,
            consultationType: fromAIDiagnosis ? 'ai_diagnosis_review' : 'direct_consultation'
          }
        });

      if (messageError) {
        console.error('❌ Error sending main message:', messageError);
        return false;
      }

      // Invia l'immagine come messaggio separato se disponibile
      if (plantData.imageUrl) {
        await this.sendImageMessage(conversationId, user.id, plantData.imageUrl);
      }

      console.log('✅ Consultation data sent successfully');
      return true;

    } catch (error) {
      console.error('❌ Error sending consultation data:', error);
      return false;
    }
  }

  /**
   * Invia l'immagine come messaggio separato
   */
  private static async sendImageMessage(
    conversationId: string,
    senderId: string,
    imageUrl: string
  ): Promise<void> {
    try {
      console.log('📸 Sending plant image as separate message...');

      const imageMessage = `📸 **Immagine della Pianta**`;
      
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          recipient_id: MARCO_NIGRO_ID,
          content: imageMessage,
          text: imageMessage,
          image_url: imageUrl,
          metadata: {
            type: 'plant_image',
            autoSent: true,
            isPlantImage: true
          }
        });

      if (error) {
        console.error('❌ Error sending image message:', error);
        throw error;
      }

      console.log('✅ Plant image sent successfully');
    } catch (error) {
      console.error('❌ Failed to send image:', error);
      // Non bloccare il processo principale se l'immagine non viene inviata
    }
  }

  /**
   * Verifica se i dati di consultazione sono già stati inviati
   */
  static async isConsultationDataSent(conversationId: string): Promise<boolean> {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('metadata')
        .eq('conversation_id', conversationId)
        .not('metadata', 'is', null);

      if (error || !messages) {
        return false;
      }

      // Controlla se esiste già un messaggio con dati di consultazione
      const hasConsultationData = messages.some((msg: any) => 
        msg.metadata && 
        (msg.metadata.type === 'consultation_data' || 
         msg.metadata.autoSent === true)
      );

      return hasConsultationData;
    } catch (error) {
      console.error('❌ Error checking consultation data status:', error);
      return false;
    }
  }

  private static getWateringText(frequency?: string): string {
    const wateringMap: { [key: string]: string } = {
      'quotidiana': 'Quotidiana',
      'ogni-2-giorni': 'Ogni 2 giorni',
      '2-volte-settimana': '2 volte a settimana',
      'settimanale': 'Settimanale',
      'ogni-2-settimane': 'Ogni 2 settimane',
      'mensile': 'Mensile',
      'quando-necessario': 'Quando il terreno è secco'
    };
    return wateringMap[frequency || ''] || frequency || 'Non specificata';
  }

  private static getSunExposureText(exposure?: string): string {
    const exposureMap: { [key: string]: string } = {
      'sole-diretto': 'Sole diretto',
      'sole-parziale': 'Sole parziale',
      'ombra-parziale': 'Ombra parziale',
      'ombra-completa': 'Ombra completa',
      'luce-indiretta': 'Luce indiretta',
      'luce-artificiale': 'Luce artificiale'
    };
    return exposureMap[exposure || ''] || exposure || 'Non specificata';
  }
}
