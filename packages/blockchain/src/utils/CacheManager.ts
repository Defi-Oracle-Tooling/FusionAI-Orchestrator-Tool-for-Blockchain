/**
 * Cache manager for blockchain adapters
 * 
 * This utility provides caching capabilities for blockchain adapters,
 * reducing the number of network requests and improving performance.
 */

import { Redis } from 'ioredis';
import winston from 'winston';

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  namespace: string;
  maxSize?: number; // Maximum number of items in cache
}

export class CacheManager {
  private redis: Redis;
  private logger: winston.Logger;
  private config: CacheConfig;
  
  constructor(config: CacheConfig) {
    // Apply defaults for missing properties
    this.config = {
      maxSize: 1000,
      ...config
    };
    
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    });
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'cache-manager' },
      transports: [
        new winston.transports.File({ filename: 'cache.log' })
      ]
    });
  }
  
  /**
   * Generates a cache key for the given parameters
   * 
   * @param method Method name
   * @param params Parameters to the method
   * @returns Cache key
   */
  private generateKey(method: string, params: any[]): string {
    const serializedParams = JSON.stringify(params);
    return `${this.config.namespace}:${method}:${serializedParams}`;
  }
  
  /**
   * Gets a value from the cache
   * 
   * @param method Method name
   * @param params Parameters to the method
   * @returns Cached value or null if not found
   */
  async get<T>(method: string, params: any[]): Promise<T | null> {
    const key = this.generateKey(method, params);
    
    try {
      const data = await this.redis.get(key);
      
      if (data) {
        this.logger.debug('Cache hit', { method, params });
        return JSON.parse(data);
      }
      
      this.logger.debug('Cache miss', { method, params });
      return null;
    } catch (error) {
      this.logger.error('Failed to get from cache', { 
        error: (error as Error).message,
        method,
        params 
      });
      return null;
    }
  }
  
  /**
   * Sets a value in the cache
   * 
   * @param method Method name
   * @param params Parameters to the method
   * @param value Value to cache
   * @param ttl Optional TTL override (in seconds)
   */
  async set<T>(method: string, params: any[], value: T, ttl?: number): Promise<void> {
    const key = this.generateKey(method, params);
    const effectiveTtl = ttl || this.config.ttl;
    
    try {
      // Store value in cache with TTL
      await this.redis.setex(key, effectiveTtl, JSON.stringify(value));
      
      // Add key to the list of cached keys for this namespace
      await this.redis.sadd(`${this.config.namespace}:keys`, key);
      
      // Check if we need to enforce max size
      if (this.config.maxSize) {
        await this.enforceMaxSize();
      }
      
      this.logger.debug('Cache set', { method, params, ttl: effectiveTtl });
    } catch (error) {
      this.logger.error('Failed to set in cache', { 
        error: (error as Error).message,
        method,
        params 
      });
    }
  }
  
  /**
   * Enforces the maximum cache size by removing oldest entries
   */
  private async enforceMaxSize(): Promise<void> {
    try {
      // Get all keys in this namespace
      const keys = await this.redis.smembers(`${this.config.namespace}:keys`);
      
      if (keys.length > this.config.maxSize!) {
        // Sort keys by TTL (ascending)
        const keysWithTtl = await Promise.all(
          keys.map(async (key) => {
            const ttl = await this.redis.ttl(key);
            return { key, ttl };
          })
        );
        
        // Sort by TTL (ascending)
        keysWithTtl.sort((a, b) => a.ttl - b.ttl);
        
        // Remove oldest keys
        const keysToRemove = keysWithTtl
          .slice(0, keys.length - this.config.maxSize!)
          .map((item) => item.key);
        
        if (keysToRemove.length > 0) {
          await this.redis.del(...keysToRemove);
          await this.redis.srem(`${this.config.namespace}:keys`, ...keysToRemove);
          
          this.logger.info('Removed oldest cache entries', { 
            count: keysToRemove.length 
          });
        }
      }
    } catch (error) {
      this.logger.error('Failed to enforce max cache size', { 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Invalidates a cached value
   * 
   * @param method Method name
   * @param params Parameters to the method
   */
  async invalidate(method: string, params: any[]): Promise<void> {
    const key = this.generateKey(method, params);
    
    try {
      await this.redis.del(key);
      await this.redis.srem(`${this.config.namespace}:keys`, key);
      
      this.logger.debug('Cache invalidated', { method, params });
    } catch (error) {
      this.logger.error('Failed to invalidate cache', { 
        error: (error as Error).message,
        method,
        params 
      });
    }
  }
  
  /**
   * Invalidates all cached values for a method
   * 
   * @param method Method name
   */
  async invalidateMethod(method: string): Promise<void> {
    try {
      const pattern = `${this.config.namespace}:${method}:*`;
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
        await this.redis.srem(`${this.config.namespace}:keys`, ...keys);
      }
      
      this.logger.debug('Method cache invalidated', { 
        method,
        count: keys.length 
      });
    } catch (error) {
      this.logger.error('Failed to invalidate method cache', { 
        error: (error as Error).message,
        method 
      });
    }
  }
  
  /**
   * Invalidates all cached values
   */
  async invalidateAll(): Promise<void> {
    try {
      const keys = await this.redis.smembers(`${this.config.namespace}:keys`);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
        await this.redis.del(`${this.config.namespace}:keys`);
      }
      
      this.logger.debug('All cache invalidated', { count: keys.length });
    } catch (error) {
      this.logger.error('Failed to invalidate all cache', { 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Gets cache statistics
   * 
   * @returns Cache statistics
   */
  async getStats(): Promise<{
    size: number;
    hitRate: number;
    missRate: number;
    avgTtl: number;
  }> {
    try {
      // Get all keys in this namespace
      const keys = await this.redis.smembers(`${this.config.namespace}:keys`);
      
      // Get hit/miss counts
      const hitCount = parseInt(await this.redis.get(`${this.config.namespace}:hits`) || '0');
      const missCount = parseInt(await this.redis.get(`${this.config.namespace}:misses`) || '0');
      const totalCount = hitCount + missCount;
      
      // Calculate hit/miss rates
      const hitRate = totalCount > 0 ? hitCount / totalCount : 0;
      const missRate = totalCount > 0 ? missCount / totalCount : 0;
      
      // Calculate average TTL
      let totalTtl = 0;
      let validKeyCount = 0;
      
      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl > 0) {
          totalTtl += ttl;
          validKeyCount++;
        }
      }
      
      const avgTtl = validKeyCount > 0 ? totalTtl / validKeyCount : 0;
      
      return {
        size: keys.length,
        hitRate,
        missRate,
        avgTtl
      };
    } catch (error) {
      this.logger.error('Failed to get cache stats', { 
        error: (error as Error).message 
      });
      
      return {
        size: 0,
        hitRate: 0,
        missRate: 0,
        avgTtl: 0
      };
    }
  }
  
  /**
   * Records a cache hit
   */
  async recordHit(): Promise<void> {
    try {
      await this.redis.incr(`${this.config.namespace}:hits`);
    } catch (error) {
      this.logger.error('Failed to record cache hit', { 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Records a cache miss
   */
  async recordMiss(): Promise<void> {
    try {
      await this.redis.incr(`${this.config.namespace}:misses`);
    } catch (error) {
      this.logger.error('Failed to record cache miss', { 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Wraps a function with caching
   * 
   * @param method Method name
   * @param fn Function to wrap
   * @param ttl Optional TTL override (in seconds)
   * @returns Wrapped function
   */
  wrap<T>(
    method: string,
    fn: (...args: any[]) => Promise<T>,
    ttl?: number
  ): (...args: any[]) => Promise<T> {
    return async (...args: any[]): Promise<T> => {
      // Try to get from cache
      const cached = await this.get<T>(method, args);
      
      if (cached !== null) {
        await this.recordHit();
        return cached;
      }
      
      await this.recordMiss();
      
      // Execute function
      const result = await fn(...args);
      
      // Cache result
      await this.set(method, args, result, ttl);
      
      return result;
    };
  }
  
  /**
   * Cleans up resources used by the cache manager
   */
  async cleanup(): Promise<void> {
    await this.redis.quit();
  }
}
