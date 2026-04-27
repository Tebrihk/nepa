import { getCacheManager as getRedisCacheManager } from '../RedisCacheManager';
import { getCacheStrategy } from './CacheStrategy';
import { getCacheInitializer } from './CacheInitializer';
import { getCacheMonitoringService } from './CacheMonitoringService';
import { getSessionCacheService } from './SessionCacheService';
import { getMicroserviceCacheService } from './MicroserviceCacheService';
import { getCacheWarmupService } from './CacheWarmupService';
import { logger } from '../logger';

// Re-export the initializeCacheSystem function from CacheInitializer
export { initializeCacheSystem } from './CacheInitializer';

// Re-export types for external use
export type { CacheInitializationResult } from './CacheInitializer';
export type { CacheConfig, CacheOptions, CacheStats } from '../RedisCacheManager';
export type { CacheHealthMetrics, CacheAlert, MonitoringConfig } from './CacheMonitoringService';

/**
 * Main Cache Manager - Central interface for all cache operations
 * Provides unified access to Redis, strategy, monitoring, and specialized cache services
 */
export class CacheManager {
  private redisManager = getRedisCacheManager();
  private cacheStrategy = getCacheStrategy();
  private monitoring = getCacheMonitoringService();
  private sessionCache = getSessionCacheService();
  private microservicesCache = getMicroserviceCacheService();
  private warmupService = getCacheWarmupService();

  /**
   * Basic cache operations
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const startTime = Date.now();
      const result = await this.redisManager.get<T>(key);
      const responseTime = Date.now() - startTime;
      
      // Record slow queries for monitoring
      this.monitoring.recordSlowQuery('direct_get', responseTime);
      
      return result;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, options?: { ttl?: number; tags?: string[] }): Promise<boolean> {
    try {
      const startTime = Date.now();
      const result = await this.redisManager.set(key, value, options);
      const responseTime = Date.now() - startTime;
      
      // Record slow queries for monitoring
      this.monitoring.recordSlowQuery('direct_set', responseTime);
      
      return result;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      return await this.redisManager.delete(key);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redisManager.get(key);
      return result !== null;
    } catch (error) {
      logger.error(`Cache exists check error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Pattern-based cache operations
   */
  async getPattern<T>(pattern: string, context?: Record<string, any>): Promise<T | null> {
    try {
      const startTime = Date.now();
      const result = await this.cacheStrategy.get(pattern, context);
      const responseTime = Date.now() - startTime;
      
      // Record slow queries for monitoring
      this.monitoring.recordSlowQuery(pattern, responseTime);
      
      return result as T;
    } catch (error) {
      logger.error(`Cache pattern get error for pattern ${pattern}:`, error);
      return null;
    }
  }

  async setPattern<T>(pattern: string, context: Record<string, any>, value: T, options?: { ttl?: number }): Promise<boolean> {
    try {
      const startTime = Date.now();
      const result = await this.cacheStrategy.set(pattern, context, value, options);
      const responseTime = Date.now() - startTime;
      
      // Record slow queries for monitoring
      this.monitoring.recordSlowQuery(pattern, responseTime);
      
      return result;
    } catch (error) {
      logger.error(`Cache pattern set error for pattern ${pattern}:`, error);
      return false;
    }
  }

  async invalidatePattern(pattern: string, context?: Record<string, any>): Promise<boolean> {
    try {
      return await this.cacheStrategy.invalidate(pattern, context);
    } catch (error) {
      logger.error(`Cache pattern invalidation error for pattern ${pattern}:`, error);
      return false;
    }
  }

  /**
   * Tag-based cache operations
   */
  async invalidateByTag(tag: string): Promise<number> {
    try {
      return await this.redisManager.invalidateByTag(tag);
    } catch (error) {
      logger.error(`Cache tag invalidation error for tag ${tag}:`, error);
      return 0;
    }
  }

  async invalidateByPattern(pattern: string): Promise<number> {
    try {
      return await this.redisManager.invalidatePattern(pattern);
    } catch (error) {
      logger.error(`Cache pattern invalidation error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Session cache operations
   */
  async cacheSession(sessionData: any): Promise<boolean> {
    try {
      return await this.sessionCache.cacheSession(sessionData);
    } catch (error) {
      logger.error('Session cache error:', error);
      return false;
    }
  }

  async getSession(sessionId: string): Promise<any> {
    try {
      return await this.sessionCache.getSession(sessionId);
    } catch (error) {
      logger.error(`Session get error for ID ${sessionId}:`, error);
      return null;
    }
  }

  async invalidateSession(sessionId: string, token: string): Promise<boolean> {
    try {
      return await this.sessionCache.invalidateSession(sessionId, token);
    } catch (error) {
      logger.error(`Session invalidation error for ID ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Microservices cache operations
   */
  async cacheRecentPayments(userId: string, payments: any[]): Promise<boolean> {
    try {
      return await this.microservicesCache.cacheRecentPayments(userId, payments);
    } catch (error) {
      logger.error(`Recent payments cache error for user ${userId}:`, error);
      return false;
    }
  }

  async getRecentPayments(userId: string): Promise<any[]> {
    try {
      return await this.microservicesCache.getRecentPayments(userId);
    } catch (error) {
      logger.error(`Recent payments get error for user ${userId}:`, error);
      return [];
    }
  }

  async invalidatePaymentCache(userId: string): Promise<boolean> {
    try {
      return await this.microservicesCache.invalidatePaymentCache(userId);
    } catch (error) {
      logger.error(`Payment cache invalidation error for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Cache warming operations
   */
  async warmCache(entries: Array<{ key: string; value: any; options?: { ttl?: number; tags?: string[] } }>): Promise<void> {
    try {
      await this.redisManager.warmCache(entries);
      logger.info(`Warmed ${entries.length} cache entries`);
    } catch (error) {
      logger.error('Cache warming error:', error);
    }
  }

  async runWarmup(): Promise<void> {
    try {
      await this.warmupService.runWarmup();
      logger.info('Cache warmup completed');
    } catch (error) {
      logger.error('Cache warmup error:', error);
    }
  }

  /**
   * Monitoring and health operations
   */
  async getHealthMetrics(): Promise<any> {
    try {
      return this.monitoring.getHealthMetrics();
    } catch (error) {
      logger.error('Health metrics error:', error);
      return null;
    }
  }

  async getPerformanceReport(): Promise<any> {
    try {
      return this.monitoring.getPerformanceReport();
    } catch (error) {
      logger.error('Performance report error:', error);
      return null;
    }
  }

  async getStats(): Promise<any> {
    try {
      return await this.redisManager.getStats();
    } catch (error) {
      logger.error('Cache stats error:', error);
      return null;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      return await this.redisManager.healthCheck();
    } catch (error) {
      logger.error('Cache health check error:', error);
      return false;
    }
  }

  /**
   * Cache management operations
   */
  async flush(): Promise<boolean> {
    try {
      return await this.redisManager.flush();
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  async broadcastInvalidation(keys?: string[], tags?: string[]): Promise<void> {
    try {
      await this.redisManager.broadcastInvalidation(keys, tags);
    } catch (error) {
      logger.error('Broadcast invalidation error:', error);
    }
  }

  /**
   * Connection management
   */
  async connect(): Promise<void> {
    try {
      await this.redisManager.connect();
      logger.info('Cache manager connected');
    } catch (error) {
      logger.error('Cache connection error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.redisManager.disconnect();
      logger.info('Cache manager disconnected');
    } catch (error) {
      logger.error('Cache disconnection error:', error);
      throw error;
    }
  }

  /**
   * Advanced cache operations
   */
  async getMultiple<T>(keys: string[]): Promise<Record<string, T | null>> {
    const results: Record<string, T | null> = {};
    
    try {
      await Promise.all(keys.map(async (key) => {
        results[key] = await this.get<T>(key);
      }));
    } catch (error) {
      logger.error('Multiple cache get error:', error);
    }
    
    return results;
  }

  async setMultiple<T>(entries: Record<string, T>, options?: { ttl?: number; tags?: string[] }): Promise<boolean> {
    try {
      const promises = Object.entries(entries).map(([key, value]) => 
        this.set(key, value, options)
      );
      
      const results = await Promise.all(promises);
      return results.every(result => result);
    } catch (error) {
      logger.error('Multiple cache set error:', error);
      return false;
    }
  }

  async deleteMultiple(keys: string[]): Promise<number> {
    let deletedCount = 0;
    
    try {
      const promises = keys.map(async (key) => {
        const result = await this.delete(key);
        if (result) deletedCount++;
        return result;
      });
      
      await Promise.all(promises);
    } catch (error) {
      logger.error('Multiple cache delete error:', error);
    }
    
    return deletedCount;
  }

  /**
   * Cache analytics and insights
   */
  getCacheInsights(): {
    totalKeys: number;
    hitRate: number;
    memoryUsage: number;
    activePatterns: string[];
    healthStatus: string;
    recommendations: string[];
  } {
    try {
      const metrics = this.monitoring.getHealthMetrics();
      const performanceReport = this.monitoring.getPerformanceReport();
      
      return {
        totalKeys: metrics.redis.keyCount,
        hitRate: metrics.redis.hitRate,
        memoryUsage: metrics.redis.memoryUsage,
        activePatterns: Object.keys(metrics.patterns),
        healthStatus: performanceReport.summary.overallHealth,
        recommendations: performanceReport.recommendations
      };
    } catch (error) {
      logger.error('Cache insights error:', error);
      return {
        totalKeys: 0,
        hitRate: 0,
        memoryUsage: 0,
        activePatterns: [],
        healthStatus: 'unknown',
        recommendations: []
      };
    }
  }
}

// Singleton instance
let cacheManagerInstance: CacheManager | null = null;

export function getCacheManagerInstance(): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager();
  }
  return cacheManagerInstance;
}

/**
 * Legacy compatibility - export the initializeCacheSystem function
 * This maintains compatibility with the existing app.ts import
 */
export async function initializeCacheSystem(): Promise<any> {
  const initializer = getCacheInitializer();
  return await initializer.initialize();
}

/**
 * Cache invalidation strategies
 */
export class CacheInvalidationStrategies {
  private cacheManager = getCacheManagerInstance();
  private redisManager = getRedisCacheManager();

  /**
   * Time-based invalidation
   */
  async invalidateByTime(pattern: string, maxAge: number): Promise<number> {
    try {
      const keys = await this.redisManager.invalidatePattern(pattern);
      const now = Date.now();
      const expiredKeys: string[] = [];

      // For now, we'll use a simplified approach - in production you'd track metadata
      return keys;
    } catch (error) {
      logger.error('Time-based invalidation error:', error);
      return 0;
    }
  }

  /**
   * Event-driven invalidation
   */
  async invalidateOnEvent(eventType: string, eventData: any): Promise<number> {
    try {
      const pattern = `event:${eventType}:*`;
      
      // Use pattern invalidation
      return await this.redisManager.invalidatePattern(pattern);
    } catch (error) {
      logger.error('Event-driven invalidation error:', error);
      return 0;
    }
  }

  /**
   * Cascade invalidation
   */
  async invalidateCascade(rootKey: string): Promise<number> {
    try {
      const dependencies = await this.cacheManager.get<string[]>(`${rootKey}:dependencies`);
      let invalidatedCount = 1; // Count the root key

      if (dependencies) {
        for (const dependency of dependencies) {
          const count = await this.invalidateCascade(dependency);
          invalidatedCount += count;
        }
      }

      await this.cacheManager.delete(rootKey);
      return invalidatedCount;
    } catch (error) {
      logger.error('Cascade invalidation error:', error);
      return 0;
    }
  }

  /**
   * Smart invalidation based on usage patterns
   */
  async smartInvalidation(): Promise<number> {
    try {
      const insights = this.cacheManager.getCacheInsights();
      let invalidatedCount = 0;

      // Invalidate low-hit-rate entries
      if (insights.hitRate < 0.5) {
        const patterns = insights.activePatterns.filter(pattern => {
          // Simplified logic - in production you'd get actual metrics
          return Math.random() < 0.3; // Random for demo
        });

        for (const pattern of patterns) {
          invalidatedCount += await this.cacheManager.invalidatePattern(pattern);
        }
      }

      // Invalidate old entries if memory is high
      if (insights.memoryUsage > 400 * 1024 * 1024) { // 400MB
        invalidatedCount += await this.invalidateByTime('*', 24 * 60 * 60 * 1000); // 24 hours
      }

      return invalidatedCount;
    } catch (error) {
      logger.error('Smart invalidation error:', error);
      return 0;
    }
  }
}

export default CacheManager;
