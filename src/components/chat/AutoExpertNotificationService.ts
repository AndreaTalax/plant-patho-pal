
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
      console.log('👤 User ID:', userId);
      console.log('🌿 Diagnosis data:', diagnosisData);

      // Get user profile for personalized message
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', userId)
        .single();

      console.log('👤 User profile:', userProfile);

      // Find or create conversation with expert
      let { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('expert_id', MARCO_NIGRO_ID)
        .single();

      if (convError || !conversation) {
        console.log('🆕 Creating new conversation with expert');
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
          console.error('Failed to create conversation:', newConvError);
          throw new Error('Failed to create conversation with expert');
        }
        conversation = newConversation;
      }

      console.log('💬 Using conversation:', conversation.id);

      // Create comprehensive message content
      const userName = userProfile 
        ? `${userProfile.first_name} ${userProfile.last_name}` 
        : 'User';

      const messageContent = this.createExpertMessage(userName, diagnosisData);

      console.log('📝 Message content:', messageContent);

// Send the main message with better error handling
const { data: messageData, error: messageError } = await supabase
  .from('messages')
  .insert({
    conversation_id: conversation.id,
    sender_id: userId,
    recipient_id: MARCO_NIGRO_ID,
    text: messageContent,
    sent_at: new Date().toISOString(),
    read: false
  })
  .select()
  .single();

if (messageError) {
  console.error('Detailed message insert error:', {
    error: messageError,
    code: messageError.code,
    message: messageError.message,
    details: messageError.details,
    hint: messageError.hint
  });
  throw new Error(`Failed to send message to expert: ${messageError.message}`);
}


      console.log('✅ Main message sent to expert');
// Add validation before inserting
if (!conversation?.id) {
  throw new Error('Invalid conversation ID');
}

if (!userId || !MARCO_NIGRO_ID) {
  throw new Error('Missing user or expert ID');
}

if (!messageContent || messageContent.trim().length === 0) {
  throw new Error('Message content is empty');
}

console.log('🔍 Validation passed:', {
  conversationId: conversation.id,
  senderId: userId,
  recipientId: MARCO_NIGRO_ID,
  messageLength: messageContent.length
});

      // Send image as separate message if available
      if (diagnosisData.imageUrl) {
        console.log('📸 Sending image message');
        await supabase
          .from('messages')
          .insert({
            conversation_id: conversation.id,
            sender_id: userId,
            recipient_id: MARCO_NIGRO_ID,
            text: `Plant image: ${diagnosisData.imageUrl}`, // Use 'text' field
            sent_at: new Date().toISOString(),
            read: false
          });
      }

      // Notify expert via edge function
      try {
        console.log('📧 Sending expert notification');
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
