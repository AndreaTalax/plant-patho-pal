
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DatabaseConversation, DatabaseMessage } from './types';

export class ChatApi {
  /**
   * Loads conversations for a specific user, sorted by the latest message timestamp.
   * @example
   * loadConversations('12345')
   * [ { id: 1, user_id: '12345', last_message_at: ... }, ... ]
   * @param {string} userId - ID of the user for whom conversations are to be fetched.
   * @returns {Promise<DatabaseConversation[]>} A promise that resolves to an array of conversations belonging to the user.
   * @description
   *   - Utilizes Supabase's query to fetch conversations where the user is either the user or the expert.
   *   - Sorts the conversations by the timestamp of the last message in descending order.
   *   - Returns an empty array if any error occurs during the fetch operation.
   */
  static async loadConversations(userId: string): Promise<DatabaseConversation[]> {
    try {
      console.log('Loading conversations for user:', userId);
      
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *
        `)
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
   * @example
   * loadMessages('12345')
   * Returns an array of message objects sorted by sent_at in ascending order.
   * @param {string} conversationId - The ID of the conversation whose messages are to be loaded.
   * @returns {Promise<DatabaseMessage[]>} An array of messages from the database associated with the given conversation ID.
   * @description
   *   - Utilizes the Supabase client to query the 'messages' table.
   *   - Ensures messages are returned in chronological order by sent date.
   *   - Returns an empty array in the event of an error fetching the data.
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
   * @example
   * sendMessage('conversation123', 'sender456', 'recipient789', 'Hello world')
   * Promise<DatabaseMessage | null>
   * @param {string} conversationId - The unique identifier of the conversation.
   * @param {string} senderId - The unique identifier of the sender.
   * @param {string} recipientId - The unique identifier of the recipient.
   * @param {string} text - The text content of the message.
   * @param {any} [products] - Optional products associated with the message.
   * @returns {Promise<DatabaseMessage | null>} Returns the DatabaseMessage object if successfully sent, null otherwise.
   * @description
   *   - Inserts the message into the 'messages' table of the database.
   *   - Updates the 'conversations' table with the latest message timestamp and text.
   *   - Logs the message data and errors to the console.
   *   - Displays error toast notification if sending fails.
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
      
      const messageData = {
        conversation_id: conversationId,
        sender_id: senderId,
        recipient_id: recipientId,
        text,
        products: products || null
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Errore nell\'invio del messaggio');
        return null;
      }

      // Update conversation last message
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_text: text
        })
        .eq('id', conversationId);

      console.log('Message sent successfully');
      return data;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      toast.error('Errore nell\'invio del messaggio');
      return null;
    }
  }

  /**
   * Finds an existing conversation or creates a new one between a user and an expert.
   * @example
   * findOrCreateConversation('user_123', 'expert_456')
   * 'conversation_789'
   * @param {string} userId - The ID of the user.
   * @param {string} expertId - The ID of the expert.
   * @returns {Promise<string | null>} The ID of the existing or newly created conversation, or null if an error occurs.
   * @description
   *   - Logs the process of finding or creating a conversation to the console.
   *   - Uses Supabase to query or insert data into the 'conversations' table.
   *   - Provides user feedback through toasts in case of errors during the creation of a conversation.
   */
  static async findOrCreateConversation(userId: string, expertId: string): Promise<string | null> {
    try {
      console.log('Finding or creating conversation:', { userId, expertId });
      
      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('expert_id', expertId)
        .single();

      if (existingConversation) {
        console.log('Found existing conversation:', existingConversation.id);
        return existingConversation.id;
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
  * @example
  * updateConversationStatus('12345', 'closed')
  * true
  * @param {string} conversationId - The unique identifier of the conversation to be updated.
  * @param {string} status - The new status value to set for the conversation.
  * @returns {Promise<boolean>} Returns true if the update is successful, otherwise returns false.
  * @description
  *   - Uses Supabase client to update the status of a conversation.
  *   - Logs the process details including errors for debugging purposes.
  *   - Handles exceptions and operational errors separately to ensure consistent return values.
  */
  static async updateConversationStatus(conversationId: string, status: string): Promise<boolean> {
    try {
      console.log('Updating conversation status:', { conversationId, status });
      
      const { error } = await supabase
        .from('conversations')
        .update({ status })
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
