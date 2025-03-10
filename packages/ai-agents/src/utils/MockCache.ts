/**
 * Mock cache implementation for AI agents
 * 
 * This utility provides a simple in-memory cache for AI agent responses
 * when Redis is not available.
 */

import crypto from 'crypto';

export interface CacheEntry<T> {
  value: T;
  expiry: number;
}

export class MockCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private namespace: string;
  private defaultTtl: number;
  
  constructor(namespace: string = 'ai-agent:cache', defaultTtl: number = 3600) {
    this.namespace = namespace;
    this.defaultTtl = defaultTtl;
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
    
    return `${this.namespace}:${agentType}:${hash}`;
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
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if entry has expired
    if (entry.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
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
    const effectiveTtl = ttl || this.defaultTtl;
    
    this.cache.set(key, {
      value: response,
      expiry: Date.now() + (effectiveTtl * 1000)
    });
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
    this.cache.delete(key);
  }
  
  /**
   * Invalidates all cached responses for an agent type
   * 
   * @param agentType Type of AI agent
   */
  async invalidateAgentType(agentType: string): Promise<void> {
    const prefix = `${this.namespace}:${agentType}:`;
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Invalidates all cached responses
   */
  async invalidateAll(): Promise<void> {
    this.cache.clear();
  }
  
  /**
   * Gets cache statistics
   * 
   * @returns Cache statistics
   */
  async getStats(): Promise<{
    size: number;
    byAgentType: Record<string, number>;
  }> {
    const byAgentType: Record<string, number> = {};
    
    for (const key of this.cache.keys()) {
      const parts = key.split(':');
      if (parts.length >= 3) {
        const agentType = parts[1];
        byAgentType[agentType] = (byAgentType[agentType] || 0) + 1;
      }
    }
    
    return {
      size: this.cache.size,
      byAgentType
    };
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
}
