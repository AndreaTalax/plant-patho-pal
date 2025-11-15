import { logger } from '@/utils/logger';
import { DatabaseConversation } from '@/services/chat/types';

/**
 * Advanced conversation cache with TTL and smart invalidation
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface ConversationCacheData {
  conversations: DatabaseConversation[];
  profilesMap: Map<string, any>;
}

class ConversationCacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly STORAGE_KEY = 'drplant_conversation_cache';
  private readonly MAX_CACHE_SIZE = 50; // Maximum cached items

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Get cached data if still valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      logger.log(`📦 Cache miss: ${key}`);
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    
    if (isExpired) {
      logger.log(`⏰ Cache expired: ${key}`);
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }

    logger.log(`✅ Cache hit: ${key}`);
    return entry.data as T;
  }

  /**
   * Set cache data with optional custom TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Prevent cache bloat
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    });

    logger.log(`💾 Cached: ${key} (TTL: ${(ttl || this.DEFAULT_TTL) / 1000}s)`);
    this.saveToStorage();
  }

  /**
   * Invalidate specific cache key
   */
  invalidate(key: string): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      logger.log(`🗑️ Invalidated cache: ${key}`);
      this.saveToStorage();
    }
  }

  /**
   * Invalidate all cache keys matching a pattern
   */
  invalidatePattern(pattern: RegExp): void {
    let invalidatedCount = 0;
    
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }

    if (invalidatedCount > 0) {
      logger.log(`🗑️ Invalidated ${invalidatedCount} cache entries matching pattern`);
      this.saveToStorage();
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    logger.log('🧹 Cache cleared');
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries,
      size: JSON.stringify(Array.from(this.cache.entries())).length
    };
  }

  /**
   * Evict oldest cache entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.log(`🗑️ Evicted oldest cache entry: ${oldestKey}`);
    }
  }

  /**
   * Save cache to localStorage (only non-sensitive data)
   */
  private saveToStorage(): void {
    try {
      const cacheData = Array.from(this.cache.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      logger.error('Failed to save cache to storage:', error);
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const cacheData = JSON.parse(stored);
        this.cache = new Map(cacheData);
        logger.log(`📂 Loaded ${this.cache.size} items from cache storage`);
      }
    } catch (error) {
      logger.error('Failed to load cache from storage:', error);
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}

// Singleton instance
export const conversationCache = new ConversationCacheManager();

/**
 * Cache key builders
 */
export const CacheKeys = {
  conversations: (userId: string) => `conversations:${userId}`,
  conversation: (conversationId: string) => `conversation:${conversationId}`,
  messages: (conversationId: string) => `messages:${conversationId}`,
  userProfile: (userId: string) => `profile:${userId}`,
  expertConversations: (expertId: string) => `expert-conversations:${expertId}`
};

/**
 * Hook for cache invalidation on realtime updates
 */
export const invalidateConversationCache = (conversationId?: string, userId?: string) => {
  if (conversationId) {
    conversationCache.invalidate(CacheKeys.conversation(conversationId));
    conversationCache.invalidate(CacheKeys.messages(conversationId));
  }
  
  if (userId) {
    conversationCache.invalidate(CacheKeys.conversations(userId));
    conversationCache.invalidatePattern(/^expert-conversations:/);
  }
};

/**
 * Invalidate cache when new messages arrive
 */
export const invalidateOnNewMessage = (conversationId: string) => {
  conversationCache.invalidate(CacheKeys.messages(conversationId));
  conversationCache.invalidate(CacheKeys.conversation(conversationId));
  conversationCache.invalidatePattern(/^conversations:/);
  conversationCache.invalidatePattern(/^expert-conversations:/);
};
