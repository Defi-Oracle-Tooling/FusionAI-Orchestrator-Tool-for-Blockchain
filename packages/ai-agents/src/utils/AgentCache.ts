/**
 * Cache utility for AI agents
 * 
 * This utility provides caching capabilities for AI agent responses,
 * reducing the number of LLM API calls and improving performance.
 */

import { Redis } from 'ioredis';
import winston from 'winston';
import crypto from 'crypto';

export interface AgentCacheConfig {
  ttl: number; // Time to live in seconds
  namespace: string;
  maxSize?: number; // Maximum number of items in cache
}

export class AgentCache {
  private redis: Redis;
  private logger: winston.Logger;
  private config: AgentCacheConfig;
  
  constructor(config: Partial<AgentCacheConfig> = {}) {
    // Apply defaults for missing properties
    this.config = {
      ttl: 3600, // Default TTL: 1 hour
      namespace: 'ai-agent:cache',
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
      defaultMeta: { service: 'agent-cache' },
      transports: [
        new winston.transports.File({ filename: 'agent-cache.log' })
      ]
    });
  }
  
  /**
   * Generates a cache key for the given prompt and parameters
   * 
   * @param agentType Type of AI agent
   * @param prompt Prompt text
   * @param params Additional parameters
   * @returns Cache key
   */
  private generateKey(agentType: string, prompt: string, params: any = {}): string {
    // Create a hash of the prompt and parameters to use as the cache key
    const data = JSON.stringify({ prompt, params });
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    
    return `${this.config.namespace}:${agentType}:${hash}`;
  }
  
  /**
   * Gets a cached response
   * 
   * @param agentType Type of AI agent
   * @param prompt Prompt text
   * @param params Additional parameters
   * @returns Cached response or null if not found
   */
  async get<T>(agentType: string, prompt: string, params: any = {}): Promise<T | null> {
    const key = this.generateKey(agentType, prompt, params);
    
    try {
      const data = await this.redis.get(key);
      
      if (data) {
        this.logger.debug('Cache hit', { agentType, key });
        await this.recordHit();
        return JSON.parse(data);
      }
      
      this.logger.debug('Cache miss', { agentType, key });
      await this.recordMiss();
      return null;
    } catch (error) {
      this.logger.error('Failed to get from cache', { 
        error: (error as Error).message,
        agentType,
        key
      });
      return null;
    }
  }
  
  /**
   * Sets a cached response
   * 
   * @param agentType Type of AI agent
   * @param prompt Prompt text
   * @param response Response to cache
   * @param params Additional parameters
   * @param ttl Optional TTL override (in seconds)
   */
  async set<T>(
    agentType: string, 
    prompt: string, 
    response: T, 
    params: any = {}, 
    ttl?: number
  ): Promise<void> {
    const key = this.generateKey(agentType, prompt, params);
    const effectiveTtl = ttl || this.config.ttl;
    
    try {
      // Store response in cache with TTL
      await this.redis.setex(key, effectiveTtl, JSON.stringify(response));
      
      // Add key to the list of cached keys for this namespace
      await this.redis.sadd(`${this.config.namespace}:keys`, key);
      
      // Check if we need to enforce max size
      if (this.config.maxSize) {
        await this.enforceMaxSize();
      }
      
      this.logger.debug('Cache set', { agentType, key, ttl: effectiveTtl });
    } catch (error) {
      this.logger.error('Failed to set in cache', { 
        error: (error as Error).message,
        agentType,
        key
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
   * Invalidates a cached response
   * 
   * @param agentType Type of AI agent
   * @param prompt Prompt text
   * @param params Additional parameters
   */
  async invalidate(agentType: string, prompt: string, params: any = {}): Promise<void> {
    const key = this.generateKey(agentType, prompt, params);
    
    try {
      await this.redis.del(key);
      await this.redis.srem(`${this.config.namespace}:keys`, key);
      
      this.logger.debug('Cache invalidated', { agentType, key });
    } catch (error) {
      this.logger.error('Failed to invalidate cache', { 
        error: (error as Error).message,
        agentType,
        key
      });
    }
  }
  
  /**
   * Invalidates all cached responses for an agent type
   * 
   * @param agentType Type of AI agent
   */
  async invalidateAgentType(agentType: string): Promise<void> {
    try {
      const pattern = `${this.config.namespace}:${agentType}:*`;
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
        await this.redis.srem(`${this.config.namespace}:keys`, ...keys);
      }
      
      this.logger.debug('Agent type cache invalidated', { 
        agentType,
        count: keys.length 
      });
    } catch (error) {
      this.logger.error('Failed to invalidate agent type cache', { 
        error: (error as Error).message,
        agentType
      });
    }
  }
  
  /**
   * Invalidates all cached responses
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
    byAgentType: Record<string, number>;
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
      
      // Count by agent type
      const byAgentType: Record<string, number> = {};
      
      for (const key of keys) {
        const parts = key.split(':');
        if (parts.length >= 3) {
          const agentType = parts[1];
          byAgentType[agentType] = (byAgentType[agentType] || 0) + 1;
        }
      }
      
      return {
        size: keys.length,
        hitRate,
        missRate,
        avgTtl,
        byAgentType
      };
    } catch (error) {
      this.logger.error('Failed to get cache stats', { 
        error: (error as Error).message 
      });
      
      return {
        size: 0,
        hitRate: 0,
        missRate: 0,
        avgTtl: 0,
        byAgentType: {}
      };
    }
  }
  
  /**
   * Records a cache hit
   */
  private async recordHit(): Promise<void> {
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
  private async recordMiss(): Promise<void> {
    try {
      await this.redis.incr(`${this.config.namespace}:misses`);
    } catch (error) {
      this.logger.error('Failed to record cache miss', { 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Wraps an agent function with caching
   * 
   * @param agentType Type of AI agent
   * @param fn Function to wrap
   * @param ttl Optional TTL override (in seconds)
   * @returns Wrapped function
   */
  wrap<T>(
    agentType: string,
    fn: (prompt: string, params?: any) => Promise<T>,
    ttl?: number
  ): (prompt: string, params?: any) => Promise<T> {
    return async (prompt: string, params: any = {}): Promise<T> => {
      // Try to get from cache
      const cached = await this.get<T>(agentType, prompt, params);
      
      if (cached !== null) {
        return cached;
      }
      
      // Execute function
      const result = await fn(prompt, params);
      
      // Cache result
      await this.set(agentType, prompt, result, params, ttl);
      
      return result;
    };
  }
  
  /**
   * Cleans up resources used by the agent cache
   */
  async cleanup(): Promise<void> {
    await this.redis.quit();
  }
}
