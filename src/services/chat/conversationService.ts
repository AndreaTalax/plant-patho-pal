
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
}
