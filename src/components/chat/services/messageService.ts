
import { supabase } from '@/integrations/supabase/client';
import { DatabaseMessage } from '../types';

export class ChatMessageService {
  static async loadMessages(conversationId: string): Promise<DatabaseMessage[]> {
    try {
      console.log('📚 Loading messages for conversation:', conversationId);
      
      if (!conversationId) {
        return [];
      }

      // Caricamento diretto dal database senza edge function
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
    products?: any
  ): Promise<boolean> {
    try {
      console.log('📤 Sending message:', {
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

      // Prova prima con la edge function
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

        if (error) {
          throw new Error('Edge function error');
        }

        console.log('✅ Message sent via edge function:', data);
        return true;
      } catch (edgeFunctionError) {
        console.log('⚠️ Edge function not available, using direct insert');
        
        // Fallback: inserimento diretto
        const { error: insertError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            recipient_id: recipientId,
            content: text,
            text: text,
            image_url: imageUrl,
            sent_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('❌ Error in direct insert:', insertError);
          throw insertError;
        }

        console.log('✅ Message sent via direct insert');
        return true;
      }
    } catch (error) {
      console.error('❌ Error in sendMessage:', error);
      throw error;
    }
  }
}
