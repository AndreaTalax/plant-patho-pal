import { supabase } from '@/integrations/supabase/client';
import { DatabaseConversation } from './types';
import { conversationCache, CacheKeys } from '@/services/cache/conversationCache';
import { logger } from '@/utils/logger';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';

/**
 * Cached Conversation Service
 * Reduces database calls with intelligent caching
 */
export class CachedConversationService {
  /**
   * Load conversations with caching
   */
  static async loadConversations(expertId: string): Promise<DatabaseConversation[]> {
    const cacheKey = CacheKeys.expertConversations(expertId);
    
    // Try cache first
    const cached = conversationCache.get<DatabaseConversation[]>(cacheKey);
    if (cached) {
      logger.log('✅ Returning cached conversations');
      return cached;
    }

    try {
      logger.log('🔄 Loading conversations from database...');
      
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('expert_id', expertId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      if (error) {
        logger.error('❌ Error loading conversations:', error);
        throw error;
      }

      // Load user profiles in batch
      const userIds = [...new Set(conversationsData?.map(c => c.user_id) || [])];
      const profiles = await this.loadProfilesBatch(userIds);

      // Merge profiles with conversations
      const conversationsWithProfiles = (conversationsData || []).map(conv => ({
        ...conv,
        user: profiles.get(conv.user_id),
        user_profile: profiles.get(conv.user_id)
      }));

      // Cache the result (5 minutes TTL)
      conversationCache.set(cacheKey, conversationsWithProfiles, 5 * 60 * 1000);

      logger.log(`✅ Loaded and cached ${conversationsWithProfiles.length} conversations`);
      return conversationsWithProfiles;
    } catch (error) {
      logger.error('❌ Error in loadConversations:', error);
      throw error;
    }
  }

  /**
   * Load user profiles in batch to reduce queries
   */
  private static async loadProfilesBatch(userIds: string[]): Promise<Map<string, any>> {
    const profilesMap = new Map<string, any>();

    if (userIds.length === 0) return profilesMap;

    try {
      // Check cache for each profile
      const uncachedIds: string[] = [];
      
      for (const userId of userIds) {
        const cacheKey = CacheKeys.userProfile(userId);
        const cached = conversationCache.get<any>(cacheKey);
        
        if (cached) {
          profilesMap.set(userId, cached);
        } else {
          uncachedIds.push(userId);
        }
      }

      // Load uncached profiles in single query
      if (uncachedIds.length > 0) {
        logger.log(`🔄 Loading ${uncachedIds.length} profiles from database...`);
        
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, username, first_name, last_name, is_online, last_seen_at, avatar_url')
          .in('id', uncachedIds);

        if (error) {
          logger.error('❌ Error loading profiles:', error);
        } else if (profiles) {
          // Cache each profile individually (10 minutes TTL)
          profiles.forEach(profile => {
            profilesMap.set(profile.id, profile);
            conversationCache.set(
              CacheKeys.userProfile(profile.id),
              profile,
              10 * 60 * 1000
            );
          });
        }
      }

      logger.log(`✅ Loaded ${profilesMap.size} profiles (${userIds.length - uncachedIds.length} from cache)`);
      return profilesMap;
    } catch (error) {
      logger.error('❌ Error loading profiles batch:', error);
      return profilesMap;
    }
  }

  /**
   * Find or create conversation with caching
   */
  static async findOrCreateConversation(
    userId: string,
    expertId: string = MARCO_NIGRO_ID
  ): Promise<DatabaseConversation | null> {
    const cacheKey = CacheKeys.conversations(userId);

    try {
      logger.log('🔍 Finding or creating conversation...');

      // Check for existing conversation
      const { data: existing, error: findError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('expert_id', expertId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (findError) {
        logger.error('❌ Error finding conversation:', findError);
      }

      if (existing) {
        logger.log('✅ Found existing conversation:', existing.id);
        
        // Reactivate if finished
        if (existing.status === 'finished') {
          logger.log('🔄 Reactivating finished conversation...');
          const { data: reactivated, error: updateError } = await supabase
            .from('conversations')
            .update({ 
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
            .select()
            .single();
            
          if (!updateError && reactivated) {
            // Invalidate caches
            conversationCache.invalidate(cacheKey);
            conversationCache.invalidate(CacheKeys.conversation(existing.id));
            return reactivated;
          }
        }
        
        // Cache the conversation
        conversationCache.set(CacheKeys.conversation(existing.id), existing, 5 * 60 * 1000);
        return existing;
      }

      // Create new conversation
      logger.log('🆕 Creating new conversation...');
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          expert_id: expertId,
          title: 'Consulenza con Marco Nigro',
          status: 'active'
        })
        .select()
        .single();

      if (createError) {
        logger.error('❌ Error creating conversation:', createError);
        return null;
      }

      logger.log('✅ Created new conversation:', newConversation.id);
      
      // Invalidate related caches
      conversationCache.invalidate(cacheKey);
      conversationCache.invalidatePattern(/^expert-conversations:/);
      
      return newConversation;
    } catch (error) {
      logger.error('❌ Error in findOrCreateConversation:', error);
      return null;
    }
  }

  /**
   * Get single conversation with caching
   */
  static async getConversation(conversationId: string): Promise<DatabaseConversation | null> {
    const cacheKey = CacheKeys.conversation(conversationId);
    
    // Try cache first
    const cached = conversationCache.get<DatabaseConversation>(cacheKey);
    if (cached) {
      logger.log('✅ Returning cached conversation');
      return cached;
    }

    try {
      logger.log('🔄 Loading conversation from database...');
      
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .maybeSingle();

      if (error) {
        logger.error('❌ Error loading conversation:', error);
        return null;
      }

      if (data) {
        // Cache for 5 minutes
        conversationCache.set(cacheKey, data, 5 * 60 * 1000);
      }

      return data;
    } catch (error) {
      logger.error('❌ Error in getConversation:', error);
      return null;
    }
  }

  /**
   * Update conversation status
   */
  static async updateConversationStatus(
    conversationId: string,
    status: string
  ): Promise<boolean> {
    try {
      logger.log(`🔄 Updating conversation ${conversationId} to status: ${status}`);

      const { error } = await supabase
        .from('conversations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (error) {
        logger.error('❌ Error updating conversation status:', error);
        return false;
      }

      // Invalidate caches
      conversationCache.invalidate(CacheKeys.conversation(conversationId));
      conversationCache.invalidatePattern(/^conversations:/);
      conversationCache.invalidatePattern(/^expert-conversations:/);

      logger.log('✅ Conversation status updated');
      return true;
    } catch (error) {
      logger.error('❌ Error in updateConversationStatus:', error);
      return false;
    }
  }

  /**
   * Clear all conversation caches
   */
  static clearCache(): void {
    conversationCache.clear();
    logger.log('🧹 All conversation caches cleared');
  }
}
