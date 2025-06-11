
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';

export class ConversationService {
  /**
  * Creates a new conversation with an expert or returns an existing conversation ID.
  */
  static async createConversationWithExpert(userId: string, title?: string): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== userId) {
        console.error('❌ Authentication failed');
        toast.error('Errore di autenticazione');
        return null;
      }

      // Check if conversation already exists - using array query instead of single
      const { data: existingConversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('expert_id', MARCO_NIGRO_ID);

      if (existingConversations && existingConversations.length > 0) {
        return existingConversations[0].id;
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
   */
  static async findOrCreateConversation(userId: string) {
    try {
      // Check if conversation already exists - using array query
      const { data: existingConversations } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('expert_id', MARCO_NIGRO_ID);

      if (existingConversations && existingConversations.length > 0) {
        return existingConversations[0];
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
