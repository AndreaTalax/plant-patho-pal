
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
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('expert_id', MARCO_NIGRO_ID)
        .single();

      if (existingConversation) {
        conversationId = existingConversation.id;
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

      console.log('💬 Using conversation:', conversationId);

      // Create comprehensive message content
      const messageContent = `🌿 **Automatic Plant Diagnosis Request**

**User:** ${userProfile?.first_name || 'User'} ${userProfile?.last_name || ''}
**Plant Type:** ${diagnosisData.plantType}
**Scientific Name:** ${diagnosisData.plantVariety || 'Not identified'}

**Analysis Results:**
- **Health Status:** ${diagnosisData.isHealthy ? 'Healthy' : 'Potential Issues Detected'}
- **AI Confidence:** ${Math.round(diagnosisData.confidence * 100)}%
- **Symptoms:** ${diagnosisData.symptoms}

**AI Analysis Summary:**
${JSON.stringify(diagnosisData.analysisResult, null, 2)}

**API Sources Used:**
- Plant.id API for species identification
- Hugging Face AI for disease detection
- EPPO Database for regulatory information

Please review the analysis and provide your professional assessment. The user is awaiting your expert opinion.

*This message was sent automatically following AI plant analysis.*`;

      console.log('📝 Message content:', messageContent);

      // Insert the message using the correct field name 'text'
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          recipient_id: MARCO_NIGRO_ID,
          text: messageContent, // Changed from 'content' to 'text'
          metadata: {
            type: 'automatic_diagnosis',
            confidence: diagnosisData.confidence,
            isHealthy: diagnosisData.isHealthy,
            plantType: diagnosisData.plantType
          }
        });

      if (messageError) {
        console.error('Detailed message insert error:', messageError);
        throw new Error(`Failed to send message to expert: ${messageError.message}`);
      }

      // Send image as separate message if available
      if (diagnosisData.imageUrl) {
        const { error: imageMessageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: userId,
            recipient_id: MARCO_NIGRO_ID,
            text: diagnosisData.imageUrl, // Changed from 'content' to 'text'
            metadata: {
              type: 'image',
              isPlantImage: true
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
