
import { supabase } from '@/integrations/supabase/client';
import { DatabaseMessage } from '../types';

export class ChatMessageService {
  static async loadMessages(conversationId: string): Promise<DatabaseMessage[]> {
    try {
      console.log('📚 Loading messages for conversation:', conversationId);
      
      if (!conversationId) {
        return [];
      }

      // Caricamento diretto dal database - metodo semplice e affidabile
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('❌ Error loading messages:', error);
        throw error;
      }

      console.log('✅ Messages loaded successfully:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Error in loadMessages:', error);
      throw error;
    }
  }

  static async sendMessage(
    conversationId: string,
    senderId: string,
    recipientId: string,
    text: string,
    imageUrl?: string,
    products?: Array<{ id: string; name: string; description?: string; price?: number }>
  ): Promise<boolean> {
    try {
      console.log('📤 Sending message via edge function:', {
        conversationId,
        senderId,
        recipientId,
        textLength: text?.length || 0,
        hasImage: !!imageUrl,
        hasProducts: !!products
      });

      // Use edge function for message sending with notifications
      const { data, error } = await supabase.functions.invoke('send-message', {
        body: {
          conversationId,
          senderId,
          recipientId,
          text,
          imageUrl,
          products
        }
      });

      if (error) {
        console.error('❌ Error calling send-message function:', error);
        throw error;
      }

      console.log('✅ Message sent successfully via edge function');
      return true;
    } catch (error) {
      console.error('❌ Error in sendMessage:', error);
      throw error;
    }
  }
}
