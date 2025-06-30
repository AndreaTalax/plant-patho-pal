
import { supabase } from '@/integrations/supabase/client';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { DatabaseConversation } from './types';

export class ConversationService {
  static async findOrCreateConversation(userId: string): Promise<DatabaseConversation | null> {
    try {
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
    } catch (error: any) {
      console.error('❌ Error in findOrCreateConversation:', error);
      return null;
    }
  }

  static async getConversation(conversationId: string): Promise<DatabaseConversation | null> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('❌ Error getting conversation:', error);
      return null;
    }
  }

  static async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      console.log('🗑️ ConversationService: Starting conversation deletion:', conversationId);
      
      // Direct deletion method only
      console.log('🔥 Attempting direct database deletion...');
      
      // First delete all messages
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      if (messagesError) {
        console.error('❌ Error deleting messages:', messagesError);
        throw messagesError;
      }

      console.log('✅ Messages deleted successfully');

      // Then delete the conversation
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
