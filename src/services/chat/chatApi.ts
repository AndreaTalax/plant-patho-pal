
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MessageData, ConversationData } from './types';

export class ChatApi {
  // Get all conversations for a user
  static async getConversations(userId: string): Promise<ConversationData[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user_id.eq.${userId},expert_id.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getConversations:', error);
      toast.error('Errore nel caricamento delle conversazioni');
      return [];
    }
  }

  // Get messages for a specific conversation
  static async getMessages(conversationId: string): Promise<MessageData[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      // Transform the data to match MessageData interface
      const transformedData: MessageData[] = (data || []).map(msg => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        recipient_id: msg.recipient_id,
        text: msg.text,
        sent_at: msg.sent_at,
        read: msg.read,
        products: Array.isArray(msg.products) ? msg.products : (msg.products ? [msg.products] : undefined),
        metadata: msg.metadata
      }));

      return transformedData;
    } catch (error) {
      console.error('Error in getMessages:', error);
      toast.error('Errore nel caricamento dei messaggi');
      return [];
    }
  }

  // Send a new message
  static async sendMessage(
    conversationId: string,
    senderId: string,
    recipientId: string,
    text: string,
    products?: any[]
  ): Promise<boolean> {
    try {
      console.log('📤 Sending message:', { conversationId, senderId, recipientId, text });

      // Verify user authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== senderId) {
        console.error('❌ Authentication failed or user mismatch');
        toast.error('Errore di autenticazione');
        return false;
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          recipient_id: recipientId,
          text: text,
          products: products || null,
          read: false
        });

      if (error) {
        console.error('Error sending message:', error);
        
        if (error.message.includes('row-level security')) {
          toast.error('Permesso negato', {
            description: 'Assicurati di essere autenticato'
          });
        } else {
          toast.error('Errore nell\'invio del messaggio');
        }
        return false;
      }

      console.log('✅ Message sent successfully');
      return true;

    } catch (error) {
      console.error('Error in sendMessage:', error);
      toast.error('Errore nell\'invio del messaggio');
      return false;
    }
  }

  // Mark messages as read
  static async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .eq('recipient_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
    }
  }
}
