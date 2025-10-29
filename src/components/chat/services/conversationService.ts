
import { supabase } from '@/integrations/supabase/client';
import { DatabaseConversation } from '../types';
import { canMakeRequest } from '../utils/rateLimiter';

export class ChatConversationService {
  static async loadConversations(expertId: string): Promise<DatabaseConversation[]> {
    try {
      // Rate limit conversation loading
      if (!canMakeRequest(`load-conversations-${expertId}`, 3000)) {
        throw new Error('Rate limited - too many requests');
      }

      console.log('📚 Loading conversations for expert:', expertId);
      
      // Add request timeout using Promise.race
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
      });
      
      // Get conversations
      const queryPromise = supabase
        .from('conversations')
        .select('*')
        .eq('expert_id', expertId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      const { data: conversationsData, error: conversationsError } = await Promise.race([queryPromise, timeoutPromise]);

      if (conversationsError) {
        console.error('❌ Error loading conversations:', conversationsError);
        throw conversationsError;
      }

      console.log('✅ Conversations loaded successfully:', conversationsData?.length || 0);

      // Load user profiles with rate limiting
      const conversationsWithProfiles = await Promise.all(
        (conversationsData || []).map(async (conversation) => {
          // Rate limit profile loading
          if (!canMakeRequest(`load-profile-${conversation.user_id}`, 5000)) {
            return {
              ...conversation,
              user: undefined,
              user_profile: null
            };
          }

          try {
            const profileTimeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('Profile timeout')), 5000);
            });

            const profileQueryPromise = supabase
              .from('profiles')
              .select('id, username, first_name, last_name, is_online, last_seen_at')
              .eq('id', conversation.user_id)
              .single();

            const { data: userProfile, error: profileError } = await Promise.race([profileQueryPromise, profileTimeoutPromise]);

            if (profileError) {
              console.error('⚠️ Error loading user profile:', profileError);
              return {
                ...conversation,
                user: undefined,
                user_profile: null
              };
            }

            return {
              ...conversation,
              user: userProfile,
              user_profile: userProfile
            };
          } catch (error) {
            console.error('⚠️ Error in profile loading:', error);
            return {
              ...conversation,
              user: undefined,
              user_profile: null
            };
          }
        })
      );

      return conversationsWithProfiles;
    } catch (error) {
      if (error.message === 'Request timeout') {
        console.error('❌ Request timeout loading conversations');
        throw new Error('Request timeout');
      }
      console.error('❌ Error in loadConversations:', error);
      throw error;
    }
  }

  static async findOrCreateConversation(
    userId: string, 
    expertId?: string,
    conversationType: string = 'standard'
  ): Promise<DatabaseConversation | null> {
    try {
      const targetExpertId = expertId || (await import('@/integrations/supabase/client')).EXPERT_ID;
      
      // Rate limit conversation operations
      if (!canMakeRequest(`find-create-conversation-${userId}`, 3000)) {
        throw new Error('Rate limited - too many requests');
      }

      console.log('🔍 Finding or creating conversation:', { userId, expertId: targetExpertId, conversationType });

      // Add request timeout using Promise.race
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 8000);
      });

      // First, try to find existing conversation with the same type
      const findQueryPromise = supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('expert_id', targetExpertId)
        .eq('conversation_type', conversationType)
        .eq('status', 'active')
        .single();

      const { data: existing, error: findError } = await Promise.race([findQueryPromise, timeoutPromise]);

      if (findError && findError.code !== 'PGRST116') {
        console.error('❌ Error finding conversation:', findError);
        throw findError;
      }

      if (existing) {
        console.log('✅ Found existing conversation:', existing.id);
        return existing;
      }

      // Create new conversation with timeout
      const createTimeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 8000);
      });

      const createQueryPromise = supabase
        .from('conversations')
        .insert({
          user_id: userId,
          expert_id: targetExpertId,
          title: conversationType === 'professional_quote' 
            ? 'Preventivo Professionale' 
            : 'Consulenza esperto',
          status: 'active',
          conversation_type: conversationType
        })
        .select()
        .single();

      const { data: newConversation, error: createError } = await Promise.race([createQueryPromise, createTimeoutPromise]);

      if (createError) {
        console.error('❌ Error creating conversation:', createError);
        throw createError;
      }

      console.log('✅ Created new conversation:', newConversation.id);
      return newConversation;
    } catch (error) {
      if (error.message === 'Request timeout') {
        console.error('❌ Request timeout in findOrCreateConversation');
        throw new Error('Request timeout');
      }
      console.error('❌ Error in findOrCreateConversation:', error);
      return null;
    }
  }

  static async updateConversationStatus(conversationId: string, status: string): Promise<boolean> {
    try {
      // Rate limit status updates
      if (!canMakeRequest(`update-status-${conversationId}`, 2000)) {
        console.log('⏳ Rate limiting status update');
        return false;
      }

      console.log('🔄 Updating conversation status:', { conversationId, status });

      // Add request timeout using Promise.race
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 5000);
      });

      const updateQueryPromise = supabase
        .from('conversations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      const { error } = await Promise.race([updateQueryPromise, timeoutPromise]);

      if (error) {
        console.error('❌ Error updating conversation status:', error);
        return false;
      }

      console.log('✅ Conversation status updated successfully');
      return true;
    } catch (error) {
      if (error.message === 'Request timeout') {
        console.error('❌ Request timeout updating conversation status');
      } else {
        console.error('❌ Error in updateConversationStatus:', error);
      }
      return false;
    }
  }
}
