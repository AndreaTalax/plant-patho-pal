
import { supabase } from '@/integrations/supabase/client';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { toast } from 'sonner';

interface PlantData {
  symptoms?: string;
  wateringFrequency?: string;
  sunExposure?: string;
  additionalNotes?: string;
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
- Esposizione solare: ${this.getSunExposureText(plantData.sunExposure)}
${plantData.additionalNotes ? `- Note aggiuntive: ${plantData.additionalNotes}` : ''}`;

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
        const imageMessage = `📸 Immagine della pianta: ${plantData.imageUrl}`;
        
        await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            recipient_id: MARCO_NIGRO_ID,
            content: imageMessage,
            text: imageMessage,
            metadata: {
              type: 'consultation_image',
              imageUrl: plantData.imageUrl,
              autoSent: true
            }
          });
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
      'daily': 'Giornaliera',
      'weekly': 'Settimanale',
      'biweekly': 'Bi-settimanale',
      'monthly': 'Mensile',
      'rarely': 'Raramente'
    };
    return wateringMap[frequency || ''] || 'Non specificata';
  }

  private static getSunExposureText(exposure?: string): string {
    const exposureMap: { [key: string]: string } = {
      'full_sun': 'Sole pieno',
      'partial_sun': 'Sole parziale',
      'shade': 'Ombra',
      'indirect': 'Luce indiretta'
    };
    return exposureMap[exposure || ''] || 'Non specificata';
  }
}
