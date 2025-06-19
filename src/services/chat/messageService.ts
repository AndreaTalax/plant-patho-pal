
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
      console.log('📤 MessageService: Sending message via edge function');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ No active session');
        return false;
      }

      // Use the send-message edge function to bypass RLS
      const { data, error } = await supabase.functions.invoke('send-message', {
        body: {
          conversationId,
          recipientId: MARCO_NIGRO_ID,
          text: content,
          imageUrl: null,
          products: null
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error || !data?.success) {
        console.error('❌ Error sending message via edge function:', error);
        return false;
      }

      console.log('✅ Message sent successfully via edge function');
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
      console.log('📸 MessageService: Sending image message via edge function');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ No active session');
        return false;
      }

      const imageMessage = `📸 **Immagine della Pianta**`;
      
      // Use the send-message edge function to bypass RLS
      const { data, error } = await supabase.functions.invoke('send-message', {
        body: {
          conversationId,
          recipientId: MARCO_NIGRO_ID,
          text: imageMessage,
          imageUrl: imageUrl,
          products: null
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error || !data?.success) {
        console.error('❌ Error sending image message via edge function:', error);
        return false;
      }

      console.log('✅ Plant image message sent successfully via edge function');
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
