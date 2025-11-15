import { useEffect, useCallback } from 'react';
import { conversationCache, CacheKeys, invalidateConversationCache } from '@/services/cache/conversationCache';
import { logger } from '@/utils/logger';

/**
 * Hook for managing conversation cache in React components
 */
export const useConversationCache = () => {
  // Clear cache on component unmount if needed
  const clearCache = useCallback(() => {
    conversationCache.clear();
  }, []);

  // Invalidate specific conversation
  const invalidateConversation = useCallback((conversationId: string) => {
    invalidateConversationCache(conversationId);
  }, []);

  // Invalidate user conversations
  const invalidateUserConversations = useCallback((userId: string) => {
    invalidateConversationCache(undefined, userId);
  }, []);

  // Get cache stats
  const getCacheStats = useCallback(() => {
    return conversationCache.getStats();
  }, []);

  // Preload conversations (warms up cache)
  const preloadConversations = useCallback(async (userId: string) => {
    try {
      logger.log('🔥 Preloading conversations for cache warming...');
      const { CachedConversationService } = await import('@/services/chat/cachedConversationService');
      await CachedConversationService.loadConversations(userId);
      logger.log('✅ Conversations preloaded');
    } catch (error) {
      logger.error('❌ Failed to preload conversations:', error);
    }
  }, []);

  // Log cache stats on mount (development only)
  useEffect(() => {
    if (import.meta.env.DEV) {
      const stats = conversationCache.getStats();
      logger.log('📊 Cache stats on mount:', stats);
    }
  }, []);

  return {
    clearCache,
    invalidateConversation,
    invalidateUserConversations,
    getCacheStats,
    preloadConversations
  };
};

/**
 * Hook for automatic cache invalidation on specific events
 */
export const useAutoCacheInvalidation = (conversationId?: string, userId?: string) => {
  useEffect(() => {
    // This hook can be extended to listen to custom events
    // and invalidate cache automatically
    
    const handleVisibilityChange = () => {
      if (!document.hidden && conversationId) {
        // Optionally invalidate cache when tab becomes visible
        // to ensure fresh data
        logger.log('🔄 Tab visible, cache might be stale');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [conversationId, userId]);
};
