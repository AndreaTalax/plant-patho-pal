
import { supabase } from '@/integrations/supabase/client';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
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
  static async sendDiagnosisToExpert(
    userId: string,
    diagnosisData: DiagnosisData
  ): Promise<boolean> {
    try {
      console.log('📨 Sending diagnosis automatically to expert...');

      // Get user profile for personalized message
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', userId)
        .single();

      // Find or create conversation with expert
      let { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('expert_id', MARCO_NIGRO_ID)
        .single();

      if (convError || !conversation) {
        const { data: newConversation, error: newConvError } = await supabase
          .from('conversations')
          .insert({
            user_id: userId,
            expert_id: MARCO_NIGRO_ID,
            status: 'active',
            title: `Plant Diagnosis - ${diagnosisData.plantType}`
          })
          .select()
          .single();

        if (newConvError) {
          throw new Error('Failed to create conversation with expert');
        }
        conversation = newConversation;
      }

      // Create comprehensive message content
      const userName = userProfile 
        ? `${userProfile.first_name} ${userProfile.last_name}` 
        : 'User';

      const messageContent = this.createExpertMessage(userName, diagnosisData);

      // Send the main message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: userId,
          recipient_id: MARCO_NIGRO_ID,
          text: messageContent,
          sent_at: new Date().toISOString(),
          read: false
        });

      if (messageError) {
        console.error('Message insert error:', messageError);
        throw new Error('Failed to send message to expert');
      }

      // Send image as separate message if available
      if (diagnosisData.imageUrl) {
        await supabase
          .from('messages')
          .insert({
            conversation_id: conversation.id,
            sender_id: userId,
            recipient_id: MARCO_NIGRO_ID,
            text: `Plant image: ${diagnosisData.imageUrl}`,
            sent_at: new Date().toISOString(),
            read: false
          });
      }

      // Notify expert via edge function
      try {
        await supabase.functions.invoke('send-specialist-notification', {
          body: {
            conversation_id: conversation.id,
            sender_id: userId,
            recipient_id: MARCO_NIGRO_ID,
            message_text: messageContent,
            expert_email: 'marco.nigro@drplant.it',
            user_name: userName,
            image_url: diagnosisData.imageUrl,
            plant_details: {
              plantType: diagnosisData.plantType,
              symptoms: diagnosisData.symptoms,
              confidence: diagnosisData.confidence,
              isHealthy: diagnosisData.isHealthy
            },
            user_details: userProfile
          }
        });
      } catch (notificationError) {
        console.warn('Expert notification failed:', notificationError);
        // Don't fail the whole process if notification fails
      }

      console.log('✅ Diagnosis sent to expert successfully');
      toast.success('Diagnosis automatically sent to phytopathologist expert!');
      return true;

    } catch (error) {
      console.error('❌ Failed to send diagnosis to expert:', error);
      toast.error('Failed to send diagnosis to expert');
      return false;
    }
  }

  private static createExpertMessage(userName: string, data: DiagnosisData): string {
    return `🌿 **Automatic Plant Diagnosis Request**

**User:** ${userName}
**Plant Type:** ${data.plantType}
${data.plantVariety ? `**Scientific Name:** ${data.plantVariety}` : ''}

**Analysis Results:**
- **Health Status:** ${data.isHealthy ? 'Healthy' : 'Potential Issues Detected'}
- **AI Confidence:** ${Math.round(data.confidence * 100)}%
- **Symptoms:** ${data.symptoms}

**AI Analysis Summary:**
${data.analysisResult ? JSON.stringify(data.analysisResult, null, 2) : 'No detailed analysis available'}

**API Sources Used:**
- Plant.id API for species identification
- Hugging Face AI for disease detection
- EPPO Database for regulatory information

Please review the analysis and provide your professional assessment. The user is awaiting your expert opinion.

*This message was sent automatically following AI plant analysis.*`;
  }
}
