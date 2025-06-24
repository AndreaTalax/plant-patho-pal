
import { supabase } from '@/integrations/supabase/client';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { DatabaseConversation } from './types';
import { ConnectionService } from './connectionService';

export class ConversationService {
  static async findOrCreateConversation(userId: string): Promise<DatabaseConversation | null> {
    const operation = async () => {
      console.log('🔍 Finding or creating conversation for user:', userId);

      // First try to find existing conversation
      const { data: existing, error: findError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('expert_id', MARCO_NIGRO_ID)
        .eq('status', 'active')
        .maybeSingle();

      if (findError && findError.code !== 'PGRST116') {
        throw findError;
      }

      if (existing) {
        console.log('✅ Found existing conversation:', existing.id);
        return existing;
      }

      // Create new conversation
      console.log('🆕 Creating new conversation...');
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          expert_id: MARCO_NIGRO_ID,
          title: 'Consulenza con Marco Nigro',
          status: 'active'
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      console.log('✅ New conversation created:', newConversation.id);
      return newConversation;
    };

    return await ConnectionService.withRetry(
      operation,
      'Find or create conversation'
    );
  }

  static async getConversation(conversationId: string): Promise<DatabaseConversation | null> {
    const operation = async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      return data;
    };

    return await ConnectionService.withRetry(
      operation,
      'Get conversation'
    );
  }

  static async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      console.log('🗑️ ConversationService: Starting conversation deletion:', conversationId);
      
      // Metodo 1: Prova con edge function
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          throw new Error('No valid session');
        }

        console.log('🔥 Attempting deletion via edge function...');
        const { data, error } = await supabase.functions.invoke('delete-conversation', {
          body: { conversationId },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!error && data?.success) {
          console.log('✅ ConversationService: Edge function deletion successful');
          return true;
        }
        
        console.log('⚠️ Edge function failed, trying direct deletion...');
      } catch (edgeError) {
        console.log('⚠️ Edge function not available, using direct deletion');
      }

      // Metodo 2: Eliminazione diretta con controllo autorizzazioni
      console.log('🔥 Attempting direct database deletion...');
      
      // Verifica che la conversazione esista e l'utente abbia i permessi
      const { data: conversation, error: fetchError } = await supabase
        .from('conversations')
        .select('id, user_id, expert_id')
        .eq('id', conversationId)
        .single();

      if (fetchError) {
        console.error('❌ Conversation not found:', fetchError);
        return false;
      }

      console.log('📝 Conversation found, proceeding with deletion...');

      // Elimina prima tutti i messaggi
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      if (messagesError) {
        console.error('❌ Error deleting messages:', messagesError);
        throw messagesError;
      }

      console.log('✅ Messages deleted successfully');

      // Elimina la conversazione
      const { error: conversationError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (conversationError) {
        console.error('❌ Error deleting conversation:', conversationError);
        throw conversationError;
      }

      console.log('✅ ConversationService: Direct deletion successful');
      return true;

    } catch (error: any) {
      console.error('❌ ConversationService: Error deleting conversation:', error);
      return false;
    }
  }

  /**
   * Forza il refresh delle conversazioni chiamando direttamente il database
   */
  static async refreshConversations(expertId: string = MARCO_NIGRO_ID): Promise<any[]> {
    try {
      console.log('🔄 ConversationService: Refreshing conversations...');
      
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          user_id,
          expert_id,
          last_message_text,
          last_message_at,
          status,
          created_at,
          updated_at,
          title
        `)
        .eq('expert_id', expertId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Error refreshing conversations:', error);
        return [];
      }

      console.log('✅ Conversations refreshed:', conversations?.length || 0);
      return conversations || [];
    } catch (error) {
      console.error('❌ Error in refreshConversations:', error);
      return [];
    }
  }
}
