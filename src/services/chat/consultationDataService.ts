
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
      console.log('📤 Sending comprehensive initial consultation data...');
      console.log('🌱 Plant data:', plantData);
      console.log('👤 User data:', userProfile);

      // Prepara il messaggio completo con tutti i dati dell'utente e della pianta
      let userDataContent = `🌿 **Nuova Richiesta di Consulenza Automatica**

👤 **Dati Utente:**
- Nome: ${userProfile.firstName || ''} ${userProfile.lastName || ''}
- Email: ${userProfile.email || 'Non specificata'}
- Data di nascita: ${userProfile.birthDate || 'Non specificata'}
- Luogo di nascita: ${userProfile.birthPlace || 'Non specificato'}

🌱 **Informazioni della Pianta:**
- Nome/Tipo: ${plantData.plantName || 'Pianta non identificata'}
- Ambiente: ${plantData.environment || 'Non specificato'}
- Sintomi: ${plantData.symptoms || 'Nessun sintomo specificato'}
- Frequenza irrigazione: ${this.getWateringText(plantData.wateringFrequency)}
- Esposizione solare: ${this.getSunExposureText(plantData.sunExposure)}`;

      // Aggiungi informazioni sul metodo di diagnosi
      if (fromAIDiagnosis && plantData.aiDiagnosis) {
        userDataContent += `

🤖 **Diagnosi AI Precedente:**
- Pianta identificata: ${plantData.aiDiagnosis.consensus?.mostLikelyPlant?.plantName || 'Non identificata'}
- Confidenza: ${plantData.aiDiagnosis.consensus?.overallConfidence || 0}%
- Stato di salute: ${plantData.aiDiagnosis.diseaseDetection?.length > 0 ? 'Problemi rilevati' : 'Apparentemente sana'}
- Malattie rilevate: ${plantData.aiDiagnosis.diseaseDetection?.map((d: any) => d.disease).join(', ') || 'Nessuna'}

**Richiesta:** Vorrei un secondo parere professionale per confermare o correggere questa diagnosi AI.`;
      } else if (plantData.sendToExpert && !plantData.useAI) {
        userDataContent += `

🩺 **Richiesta Diretta di Consulenza Esperta:**
L'utente ha scelto di consultare direttamente il fitopatologo senza utilizzare la diagnosi AI.`;
      }

      userDataContent += `

*Questo messaggio è stato inviato automaticamente dal sistema di diagnosi Dr.Plant.*`;

      // Ottieni l'ID utente corrente
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ User not authenticated');
        return false;
      }

      // Invia il messaggio con tutti i dati
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          recipient_id: MARCO_NIGRO_ID,
          content: userDataContent,
          text: userDataContent,
          metadata: {
            type: 'comprehensive_consultation_data',
            autoSent: true,
            fromAIDiagnosis,
            hasPlantImage: !!plantData.imageUrl,
            consultationType: fromAIDiagnosis ? 'ai_diagnosis_review' : 'direct_consultation'
          }
        });

      if (messageError) {
        console.error('❌ Error sending consultation data message:', messageError);
        return false;
      }

      // Invia l'immagine come messaggio separato se disponibile
      if (plantData.imageUrl) {
        console.log('📸 Sending plant image:', plantData.imageUrl);
        
        const imageMessage = `📸 **Immagine della Pianta**

![Immagine della pianta](${plantData.imageUrl})

*Immagine inviata automaticamente insieme ai dati della consultazione.*`;
        
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
              autoSent: true,
              isPlantImage: true
            }
          });

        if (imageError) {
          console.error('❌ Error sending plant image:', imageError);
          // Non bloccare il processo se l'immagine non viene inviata
        } else {
          console.log('✅ Plant image sent successfully');
        }
      }

      // Se c'è una diagnosi AI, invia anche i dettagli tecnici
      if (fromAIDiagnosis && plantData.aiDiagnosis) {
        const technicalData = `🔬 **Dettagli Tecnici dell'Analisi AI**

**Risultati completi:**
\`\`\`json
${JSON.stringify(plantData.aiDiagnosis, null, 2)}
\`\`\`

*Questi dati tecnici possono essere utili per la tua valutazione professionale.*`;

        const { error: techError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            recipient_id: MARCO_NIGRO_ID,
            content: technicalData,
            text: technicalData,
            metadata: {
              type: 'technical_ai_data',
              autoSent: true,
              aiDiagnosis: plantData.aiDiagnosis
            }
          });

        if (techError) {
          console.error('❌ Error sending technical data:', techError);
          // Non bloccare per i dati tecnici
        }
      }

      console.log('✅ Comprehensive consultation data sent successfully');
      return true;

    } catch (error) {
      console.error('❌ Error sending comprehensive consultation data:', error);
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
        (msg.metadata.type === 'consultation_data' || 
         msg.metadata.type === 'comprehensive_consultation_data' ||
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
