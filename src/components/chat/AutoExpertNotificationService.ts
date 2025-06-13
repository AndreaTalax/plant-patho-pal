
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DiagnosisData {
  plantType: string;
  plantVariety?: string;
  symptoms: string;
  imageUrl: string;
  analysisResult: any;
  confidence: number;
  isHealthy: boolean;
}

export class AutoExpertNotificationService {
  /**
   * Sends an automatic plant diagnosis to an expert.
   */
  static async sendDiagnosisToExpert(userId: string, diagnosisData: DiagnosisData): Promise<boolean> {
    try {
      console.log('📨 Sending diagnosis automatically to expert...');
      console.log('👤 User ID:', userId);
      console.log('🌿 Diagnosis data:', diagnosisData);

      // Get current user to include their info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ User not authenticated');
        toast.error('Errore di autenticazione');
        return false;
      }

      // Get user profile for better context
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', userId)
        .single();

      console.log('👤 User profile:', userProfile);

      // Check if conversation exists with the expert
      let conversationId: string;
      const { data: existingConversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('expert_id', MARCO_NIGRO_ID);

      if (existingConversations && existingConversations.length > 0) {
        conversationId = existingConversations[0].id;
        console.log('💬 Using existing conversation:', conversationId);
      } else {
        console.log('🆕 Creating new conversation with expert');
        const { data: newConversation, error: conversationError } = await supabase
          .from('conversations')
          .insert({
            user_id: userId,
            expert_id: MARCO_NIGRO_ID,
            status: 'active',
            title: `Consulenza per ${diagnosisData.plantType}`
          })
          .select()
          .single();

        if (conversationError) {
          console.error('❌ Error creating conversation:', conversationError);
          toast.error('Errore nella creazione della conversazione');
          return false;
        }

        conversationId = newConversation.id;
      }

      // Create comprehensive message content
      const messageContent = `🌿 **Richiesta di Diagnosi Automatica**

**Utente:** ${userProfile?.first_name || 'User'} ${userProfile?.last_name || ''}
**Tipo di Pianta:** ${diagnosisData.plantType}
**Nome Scientifico:** ${diagnosisData.plantVariety || 'Non identificato'}

**Risultati Analisi:**
- **Stato di Salute:** ${diagnosisData.isHealthy ? 'Sana' : 'Possibili Problemi Rilevati'}
- **Confidenza AI:** ${Math.round(diagnosisData.confidence * 100)}%
- **Sintomi:** ${diagnosisData.symptoms}

**Riassunto Analisi AI:**
${diagnosisData.analysisResult ? JSON.stringify(diagnosisData.analysisResult, null, 2) : 'Analisi non disponibile'}

**Fonti API Utilizzate:**
- Plant.id API per identificazione specie
- Hugging Face AI per rilevamento malattie
- Database EPPO per informazioni normative

Per favore, rivedi l'analisi e fornisci la tua valutazione professionale. L'utente attende il tuo parere esperto.

*Questo messaggio è stato inviato automaticamente dopo l'analisi AI della pianta.*`;

      console.log('📝 Message content:', messageContent);

      // Insert the message using the correct field name based on the database schema
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          recipient_id: MARCO_NIGRO_ID,
          text: messageContent, // Using 'text' field which should match the database schema
          metadata: {
            type: 'automatic_diagnosis',
            confidence: diagnosisData.confidence,
            isHealthy: diagnosisData.isHealthy,
            plantType: diagnosisData.plantType
          }
        });

      if (messageError) {
        console.error('❌ Error sending message:', messageError);
        toast.error(`Errore nell'invio del messaggio: ${messageError.message}`);
        return false;
      }

      // Send image as separate message if available
      if (diagnosisData.imageUrl) {
        const { error: imageMessageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: userId,
            recipient_id: MARCO_NIGRO_ID,
            text: `📸 Immagine della pianta: ${diagnosisData.imageUrl}`,
            metadata: {
              type: 'image',
              isPlantImage: true,
              imageUrl: diagnosisData.imageUrl
            }
          });

        if (imageMessageError) {
          console.error('❌ Error sending image message:', imageMessageError);
          // Don't fail the whole process for image message
        }
      }

      console.log('✅ Successfully sent diagnosis to expert');
      toast.success('Diagnosi inviata automaticamente all\'esperto!', {
        description: 'Riceverai una risposta professionale a breve'
      });

      return true;

    } catch (error) {
      console.error('❌ Failed to send diagnosis to expert:', error);
      toast.error('Impossibile contattare l\'esperto', {
        description: 'Prova a inviare manualmente dalla chat'
      });
      return false;
    }
  }
}
