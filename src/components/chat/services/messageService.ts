
import { supabase } from '@/integrations/supabase/client';
import { DatabaseMessage } from '../types';

export class ChatMessageService {
  static async loadMessages(conversationId: string): Promise<DatabaseMessage[]> {
    try {
      console.log('📚 Loading messages for conversation:', conversationId);
      
      // Timeout ridotto e query ottimizzata
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 secondi

      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('sent_at', { ascending: true })
          .limit(100) // Limita risultati
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        if (error) {
          console.error('❌ Error loading messages:', error);
          throw error;
        }

        console.log('✅ Messages loaded successfully:', data?.length || 0);
        return data || [];
      } catch (abortError) {
        clearTimeout(timeoutId);
        if (abortError.name === 'AbortError') {
          console.error('❌ Request timeout loading messages');
          throw new Error('Request timeout');
        }
        throw abortError;
      }
    } catch (error) {
      if (error.message === 'Request timeout') {
        console.error('❌ Request timeout loading messages');
        throw new Error('Request timeout');
      }
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
    products?: any
  ): Promise<boolean> {
    try {
      console.log('📤 Sending message via Supabase function:', {
        conversationId,
        senderId,
        recipientId,
        textLength: text?.length || 0,
        hasImage: !!imageUrl,
        hasProducts: !!products
      });

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('❌ No valid session found:', sessionError);
        throw new Error('User not authenticated');
      }

      // Timeout ridotto
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondi

      try {
        const { data, error } = await supabase.functions.invoke('send-message', {
          body: {
            conversationId,
            recipientId,
            text,
            imageUrl,
            products
          }
        });

        clearTimeout(timeoutId);

        if (error) {
          console.error('❌ Error from send-message function:', error);
          throw error;
        }

        console.log('✅ Message sent successfully:', data);
        return true;
      } catch (abortError) {
        clearTimeout(timeoutId);
        if (abortError.name === 'AbortError') {
          console.error('❌ Request timeout sending message');
          throw new Error('Request timeout');
        }
        throw abortError;
      }
    } catch (error) {
      if (error.message === 'Request timeout') {
        console.error('❌ Request timeout sending message');
        throw new Error('Request timeout');
      }
      console.error('❌ Error in sendMessage:', error);
      throw error;
    }
  }
}
