
import { supabase } from '@/integrations/supabase/client';
import { DatabaseMessage } from '../types';
import { canMakeRequest } from '../utils/rateLimiter';

export class ChatMessageService {
  static async loadMessages(conversationId: string): Promise<DatabaseMessage[]> {
    try {
      // Rate limit message loading
      if (!canMakeRequest(`load-messages-${conversationId}`, 2000)) {
        throw new Error('Rate limited - too many requests');
      }

      console.log('📚 Loading messages for conversation:', conversationId);
      
      // Add request timeout using Promise.race
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 8000);
      });
      
      const queryPromise = supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true });

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error) {
        console.error('❌ Error loading messages:', error);
        throw error;
      }

      console.log('✅ Messages loaded successfully:', data?.length || 0);
      return data || [];
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
      // Rate limit message sending
      if (!canMakeRequest(`send-message-${conversationId}`, 1000)) {
        throw new Error('Rate limited - sending too fast');
      }

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

      // Add request timeout using Promise.race
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
      });

      const functionPromise = supabase.functions.invoke('send-message', {
        body: {
          conversationId,
          recipientId,
          text,
          imageUrl,
          products
        }
      });

      const { data, error } = await Promise.race([functionPromise, timeoutPromise]);

      if (error) {
        console.error('❌ Error from send-message function:', error);
        throw error;
      }

      console.log('✅ Message sent successfully:', data);
      return true;
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
