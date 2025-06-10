
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';

export class ConversationService {
  /**
  * Creates a new conversation with an expert or returns an existing conversation ID.
  * @example
  * createConversationWithExpert('user-id', 'Consulta con esperto')
  * Returns 'conversation-id' if successful, otherwise returns null.
  * @param {string} userId - The ID of the user initiating the conversation.
  * @param {string} [title] - Optional title for the conversation.
  * @returns {Promise<string | null>} The ID of the created or existing conversation, or null on failure.
  * @description
  *   - Authenticates the user before creating a conversation.
  *   - Checks for existing conversation with the expert to avoid duplicates.
  *   - Returns the conversation ID if it already exists.
  */
  static async createConversationWithExpert(userId: string, title?: string): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== userId) {
        console.error('❌ Authentication failed');
        toast.error('Errore di autenticazione');
        return null;
      }

      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('expert_id', MARCO_NIGRO_ID)
        .single();

      if (existingConversation) {
        return existingConversation.id;
      }

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          expert_id: MARCO_NIGRO_ID,
          title: title || 'Consulenza esperto',
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        toast.error('Errore nella creazione della conversazione');
        return null;
      }

      return data.id;

    } catch (error) {
      console.error('Error in createConversationWithExpert:', error);
      toast.error('Errore nella creazione della conversazione');
      return null;
    }
  }

  /**
   * Finds or creates a conversation for a given user and expert.
   * @example
   * findOrCreateConversation('12345')
   * { id: 1, user_id: '12345', expert_id: 'EXPERT_ID', title: 'Consulenza esperto', status: 'active' }
   * @param {string} userId - The unique identifier of the user.
   * @returns {Object|null} The conversation data if successful, otherwise null.
   * @description
   *   - Utilizes Supabase to query and insert data into the 'conversations' table.
   *   - Returns an existing conversation if found, else creates a new one.
   *   - Logs errors without halting program execution.
   */
  static async findOrCreateConversation(userId: string) {
    try {
      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('expert_id', MARCO_NIGRO_ID)
        .single();

      if (existingConversation) {
        return existingConversation;
      }

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          expert_id: MARCO_NIGRO_ID,
          title: 'Consulenza esperto',
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in findOrCreateConversation:', error);
      return null;
    }
  }

  /**
  * Updates the status of a conversation in the database.
  * @example
  * updateConversationStatus('123', 'active')
  * true
  * @param {string} conversationId - The unique identifier for the conversation.
  * @param {string} status - The new status to set for the conversation.
  * @returns {boolean} Returns true if the conversation status was successfully updated, otherwise false if an error occurred.
  * @description
  *   - Utilizes the Supabase client to perform the update operation on the 'conversations' table.
  *   - Logs errors to the console if the update fails or if an exception is caught.
  */
  static async updateConversationStatus(conversationId: string, status: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status })
        .eq('id', conversationId);

      if (error) {
        console.error('Error updating conversation status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateConversationStatus:', error);
      return false;
    }
  }
}
