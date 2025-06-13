
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DatabaseConversation, DatabaseMessage } from './types';

export class ChatApi {
  /**
   * Loads conversations for a specific user, sorted by the latest message timestamp.
   */
  static async loadConversations(userId: string): Promise<DatabaseConversation[]> {
    try {
      console.log('Loading conversations for user:', userId);
      
      const { data, error } = await supabase
        .from('conversations')
        .select(`*`)
        .or(`user_id.eq.${userId},expert_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', error);
        toast.error('Errore nel caricamento delle conversazioni');
        return [];
      }

      console.log('Loaded conversations:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error in loadConversations:', error);
      toast.error('Errore nel caricamento delle conversazioni');
      return [];
    }
  }

  /**
   * Asynchronously loads messages for a given conversation by ID.
   */
  static async loadMessages(conversationId: string): Promise<DatabaseMessage[]> {
    try {
      console.log('Loading messages for conversation:', conversationId);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        toast.error('Errore nel caricamento dei messaggi');
        return [];
      }

      console.log('Loaded messages:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error in loadMessages:', error);
      toast.error('Errore nel caricamento dei messaggi');
      return [];
    }
  }

  /**
   * Sends a message to the specified conversation.
   */
  static async sendMessage(
    conversationId: string,
    senderId: string,
    recipientId: string,
    text: string,
    products?: any
  ): Promise<DatabaseMessage | null> {
    try {
      console.log('Sending message:', { conversationId, senderId, recipientId, text });
      
      // Ensure the text is not empty
      if (!text || text.trim() === '') {
        console.error('❌ Cannot send empty message');
        toast.error('Il messaggio non può essere vuoto');
        return null;
      }

      const messageData = {
        conversation_id: conversationId,
        sender_id: senderId,
        recipient_id: recipientId,
        content: text.trim(), // Required field
        text: text.trim(), // Also populate text field for consistency
        products: products || null
      };

      console.log('Inserting message data:', messageData);

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        toast.error(`Errore nell'invio del messaggio: ${error.message}`);
        return null;
      }

      console.log('Message sent successfully:', data);
      
      // The trigger will automatically update the conversation, but let's also manually ensure it's updated
      try {
        await supabase
          .from('conversations')
          .update({
            last_message_at: new Date().toISOString(),
            last_message_text: text.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', conversationId);
      } catch (updateError) {
        console.warn('Manual conversation update failed, but trigger should handle it:', updateError);
      }

      return data;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      toast.error('Errore nell\'invio del messaggio');
      return null;
    }
  }

  /**
   * Finds an existing conversation or creates a new one between a user and an expert.
   */
  static async findOrCreateConversation(userId: string, expertId: string): Promise<string | null> {
    try {
      console.log('Finding or creating conversation:', { userId, expertId });
      
      // Check if conversation already exists
      const { data: existingConversations, error: searchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('expert_id', expertId);

      if (searchError) {
        console.error('Error searching for existing conversation:', searchError);
        toast.error('Errore nella ricerca della conversazione');
        return null;
      }

      if (existingConversations && existingConversations.length > 0) {
        console.log('Found existing conversation:', existingConversations[0].id);
        return existingConversations[0].id;
      }

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          expert_id: expertId,
          title: 'Consulenza esperto',
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        toast.error('Errore nella creazione della conversazione');
        return null;
      }

      console.log('Created new conversation:', data.id);
      return data.id;
    } catch (error) {
      console.error('Error in findOrCreateConversation:', error);
      toast.error('Errore nella gestione della conversazione');
      return null;
    }
  }

  /**
  * Updates the status of a conversation in the database.
  */
  static async updateConversationStatus(conversationId: string, status: string): Promise<boolean> {
    try {
      console.log('Updating conversation status:', { conversationId, status });
      
      const { error } = await supabase
        .from('conversations')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) {
        console.error('Error updating conversation status:', error);
        return false;
      }

      console.log('Conversation status updated successfully');
      return true;
    } catch (error) {
      console.error('Error in updateConversationStatus:', error);
      return false;
    }
  }
}
