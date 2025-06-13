
import { supabase } from '@/integrations/supabase/client';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { toast } from 'sonner';

interface PlantData {
  symptoms?: string;
  wateringFrequency?: string;
  sunExposure?: string;
  imageUrl?: string;
  aiDiagnosis?: any;
}

interface UserProfile {
  firstName?: string;
  lastName?: string;
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
      console.log('Sending initial consultation data...');

      // Prepara il messaggio con i dati dell'utente
      let userDataContent = `Ecco i miei dati per la consulenza:

👤 **Profilo:**
- Nome: ${userProfile.firstName || ''} ${userProfile.lastName || ''}
- Data di nascita: ${userProfile.birthDate || 'Non specificata'}
- Luogo di nascita: ${userProfile.birthPlace || 'Non specificato'}

🌱 **Dati della pianta:**
- Sintomi: ${plantData.symptoms || 'Non specificati'}
- Frequenza irrigazione: ${this.getWateringText(plantData.wateringFrequency)}
- Esposizione solare: ${this.getSunExposureText(plantData.sunExposure)}`;

      // Aggiungi i risultati della diagnosi AI se disponibili
      if (fromAIDiagnosis && plantData.aiDiagnosis) {
        userDataContent += `

🤖 **Diagnosi AI precedente:**
- Pianta identificata: ${plantData.aiDiagnosis.consensus?.mostLikelyPlant?.plantName || 'Non identificata'}
- Confidenza: ${plantData.aiDiagnosis.consensus?.overallConfidence || 0}%
- Malattie rilevate: ${plantData.aiDiagnosis.diseaseDetection?.map((d: any) => d.disease).join(', ') || 'Nessuna'}

Vorrei un secondo parere da un esperto per confermare o correggere questa diagnosi.`;
      }

      // Ottieni l'ID utente corrente
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return false;
      }

      // Invia il messaggio con i dati
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          recipient_id: MARCO_NIGRO_ID,
          content: userDataContent,
          text: userDataContent,
          metadata: {
            type: 'consultation_data',
            autoSent: true,
            fromAIDiagnosis
          }
        });

      if (messageError) {
        console.error('Error sending consultation data message:', messageError);
        return false;
      }

      // Invia l'immagine come messaggio separato se disponibile
      if (plantData.imageUrl) {
        console.log('📸 Sending plant image:', plantData.imageUrl);
        
        const imageMessage = `📸 **Immagine della pianta**

![Immagine della pianta](${plantData.imageUrl})

*Immagine inviata automaticamente dal sistema di diagnosi.*`;
        
        const { error: imageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            recipient_id: MARCO_NIGRO_ID,
            content: imageMessage,
            text: imageMessage,
            image_url: plantData.imageUrl,
            metadata: {
              type: 'consultation_image',
              imageUrl: plantData.imageUrl,
              autoSent: true
            }
          });

        if (imageError) {
          console.error('Error sending plant image:', imageError);
          // Non bloccare il processo se l'immagine non viene inviata
        } else {
          console.log('✅ Plant image sent successfully');
        }
      }

      console.log('Initial consultation data sent successfully');
      return true;

    } catch (error) {
      console.error('Error sending initial consultation data:', error);
      return false;
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
        (msg.metadata.type === 'consultation_data' || msg.metadata.autoSent === true)
      );

      return hasConsultationData;
    } catch (error) {
      console.error('Error checking consultation data status:', error);
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
    return wateringMap[frequency || ''] || 'Non specificata';
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
    return exposureMap[exposure || ''] || 'Non specificata';
  }
}
