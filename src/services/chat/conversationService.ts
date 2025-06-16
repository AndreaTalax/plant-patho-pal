
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

      // Check if conversation already exists
      const { data: existingConversations, error: searchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('expert_id', MARCO_NIGRO_ID);

      if (searchError) {
        console.error('Error searching conversations:', searchError);
        toast.error('Errore nella ricerca delle conversazioni');
        return null;
      }

      if (existingConversations && existingConversations.length > 0) {
        console.log('✅ Found existing conversation:', existingConversations[0].id);
        return existingConversations[0].id;
      }

      // Create new conversation
      console.log('🆕 Creating new conversation for user:', userId);
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          expert_id: MARCO_NIGRO_ID,
          title: title || 'Consulenza esperto',
          status: 'active',
          last_message_text: null,
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        toast.error('Errore nella creazione della conversazione');
        return null;
      }

      console.log('✅ New conversation created:', data.id);
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
      console.log('🔍 Finding or creating conversation for user:', userId);
      
      // Check if conversation already exists
      const { data: existingConversations, error: searchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('expert_id', MARCO_NIGRO_ID);

      if (searchError) {
        console.error('Error searching conversations:', searchError);
        return null;
      }

      if (existingConversations && existingConversations.length > 0) {
        console.log('✅ Found existing conversation:', existingConversations[0]);
        return existingConversations[0];
      }

      // Create new conversation
      console.log('🆕 Creating new conversation...');
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          expert_id: MARCO_NIGRO_ID,
          title: 'Consulenza esperto',
          status: 'active',
          last_message_text: null,
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        return null;
      }

      console.log('✅ New conversation created:', data);
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
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
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
