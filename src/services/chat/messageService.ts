
import { supabase } from '@/integrations/supabase/client';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';

export class MessageService {
  static async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    metadata: any = {}
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          recipient_id: MARCO_NIGRO_ID,
          content: content,
          text: content,
          metadata: {
            timestamp: new Date().toISOString(),
            ...metadata
          }
        });

      if (error) {
        console.error('❌ Error sending message:', error);
        return false;
      }

      console.log('✅ Message sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      return false;
    }
  }

  static async sendImageMessage(
    conversationId: string,
    senderId: string,
    imageUrl: string
  ): Promise<boolean> {
    try {
      console.log('📸 Preparing to send image message with URL:', imageUrl);

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
            isPlantImage: true,
            timestamp: new Date().toISOString()
          }
        });

      if (error) {
        console.error('❌ Error sending image message:', error);
        return false;
      }

      console.log('✅ Plant image message sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to send image message:', error);
      return false;
    }
  }

  static async checkConsultationDataSent(conversationId: string): Promise<boolean> {
    try {
      console.log('🔍 Checking if consultation data already sent for conversation:', conversationId);
      
      const { data: messages, error } = await supabase
        .from('messages')
        .select('metadata, content')
        .eq('conversation_id', conversationId)
        .not('metadata', 'is', null);

      if (error) {
        console.error('❌ Error checking consultation data:', error);
        return false;
      }

      if (!messages || messages.length === 0) {
        console.log('📭 No messages with metadata found');
        return false;
      }

      const hasConsultationData = messages.some((msg: any) => 
        msg.metadata && 
        (msg.metadata.type === 'consultation_data' || 
         msg.metadata.autoSent === true)
      );

      console.log('🔍 Consultation data already sent:', hasConsultationData);
      return hasConsultationData;
    } catch (error) {
      console.error('❌ Error checking consultation data status:', error);
      return false;
    }
  }
}
