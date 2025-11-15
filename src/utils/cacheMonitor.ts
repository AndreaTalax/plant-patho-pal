import { conversationCache } from '@/services/cache/conversationCache';
import { logger } from '@/utils/logger';

/**
 * Cache monitoring and debugging utilities
 */

export class CacheMonitor {
  private static instance: CacheMonitor;
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): CacheMonitor {
    if (!CacheMonitor.instance) {
      CacheMonitor.instance = new CacheMonitor();
    }
    return CacheMonitor.instance;
  }

  /**
   * Start monitoring cache with periodic stats logging
   */
  startMonitoring(intervalMs: number = 60000): void {
    if (this.monitoringInterval) {
      logger.warn('⚠️ Cache monitoring already active');
      return;
    }

    logger.log('🔍 Starting cache monitoring...');
    
    this.monitoringInterval = setInterval(() => {
      const stats = conversationCache.getStats();
      logger.log('📊 Cache Stats:', {
        ...stats,
        hitRate: this.calculateHitRate(),
        memoryUsage: `${(stats.size / 1024).toFixed(2)} KB`
      });
    }, intervalMs);
  }

  /**
   * Stop cache monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.log('🛑 Cache monitoring stopped');
    }
  }

  /**
   * Get current cache statistics
   */
  getStats() {
    const stats = conversationCache.getStats();
    return {
      ...stats,
      hitRate: this.calculateHitRate(),
      memoryUsage: `${(stats.size / 1024).toFixed(2)} KB`,
      efficiency: `${((stats.valid / Math.max(stats.total, 1)) * 100).toFixed(1)}%`
    };
  }

  /**
   * Calculate cache hit rate (simplified, would need more tracking in production)
   */
  private calculateHitRate(): string {
    // This is a simplified version. In production, you'd track hits/misses
    const stats = conversationCache.getStats();
    return `${((stats.valid / Math.max(stats.total, 1)) * 100).toFixed(1)}%`;
  }

  /**
   * Log detailed cache analysis
   */
  logAnalysis(): void {
    const stats = this.getStats();
    
    logger.log('═══════════════════════════════════');
    logger.log('📊 CACHE ANALYSIS REPORT');
    logger.log('═══════════════════════════════════');
    logger.log('Total Entries:', stats.total);
    logger.log('Valid Entries:', stats.valid);
    logger.log('Expired Entries:', stats.expired);
    logger.log('Memory Usage:', stats.memoryUsage);
    logger.log('Cache Efficiency:', stats.efficiency);
    logger.log('Est. Hit Rate:', stats.hitRate);
    logger.log('═══════════════════════════════════');
  }

  /**
   * Test cache performance
   */
  async testPerformance(): Promise<void> {
    logger.log('🧪 Running cache performance test...');
    
    const iterations = 100;
    const testKey = 'performance-test';
    const testData = { test: 'data', timestamp: Date.now() };

    // Test write performance
    const writeStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      conversationCache.set(`${testKey}-${i}`, testData);
    }
    const writeTime = performance.now() - writeStart;

    // Test read performance
    const readStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      conversationCache.get(`${testKey}-${i}`);
    }
    const readTime = performance.now() - readStart;

    // Cleanup
    for (let i = 0; i < iterations; i++) {
      conversationCache.invalidate(`${testKey}-${i}`);
    }

    logger.log('📊 Performance Test Results:');
    logger.log(`Write: ${writeTime.toFixed(2)}ms for ${iterations} ops (${(writeTime/iterations).toFixed(3)}ms avg)`);
    logger.log(`Read: ${readTime.toFixed(2)}ms for ${iterations} ops (${(readTime/iterations).toFixed(3)}ms avg)`);
  }
}

// Global cache monitor instance
export const cacheMonitor = CacheMonitor.getInstance();

// Development helpers
if (import.meta.env.DEV) {
  // Expose to window for debugging
  (window as any).cacheMonitor = cacheMonitor;
  (window as any).conversationCache = conversationCache;
  
  logger.log('💡 Cache debugging available via window.cacheMonitor and window.conversationCache');
}
