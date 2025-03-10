/**
 * Performance monitoring utility for blockchain adapters
 * 
 * This utility provides performance monitoring capabilities for blockchain adapters,
 * tracking response times, success rates, and resource usage.
 */

import { Redis } from 'ioredis';
import winston from 'winston';

export interface PerformanceMetrics {
  operationName: string;
  durationMs: number;
  success: boolean;
  timestamp: number;
  networkType: string;
  resourceUsage?: {
    memoryUsageMB?: number;
    cpuUsagePercent?: number;
  };
  metadata?: Record<string, any>;
}

export class PerformanceMonitor {
  private redis: Redis;
  private logger: winston.Logger;
  private metricsPrefix: string;
  
  constructor(networkType: string) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    });
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'performance-monitor' },
      transports: [
        new winston.transports.File({ filename: 'performance.log' })
      ]
    });
    
    this.metricsPrefix = `blockchain:${networkType}:metrics`;
  }
  
  /**
   * Records performance metrics for a blockchain operation
   * 
   * @param metrics Performance metrics to record
   */
  async recordMetrics(metrics: PerformanceMetrics): Promise<void> {
    try {
      // Store metrics in Redis with TTL of 7 days
      const metricsKey = `${this.metricsPrefix}:${metrics.operationName}:${Date.now()}`;
      await this.redis.setex(metricsKey, 60 * 60 * 24 * 7, JSON.stringify(metrics));
      
      // Update aggregated metrics
      await this.updateAggregatedMetrics(metrics);
      
      // Log metrics
      this.logger.info('Performance metrics recorded', { metrics });
    } catch (error) {
      this.logger.error('Failed to record performance metrics', { 
        error: (error as Error).message,
        metrics 
      });
    }
  }
  
  /**
   * Updates aggregated metrics for the operation
   * 
   * @param metrics Performance metrics to aggregate
   */
  private async updateAggregatedMetrics(metrics: PerformanceMetrics): Promise<void> {
    const aggregateKey = `${this.metricsPrefix}:${metrics.operationName}:aggregate`;
    
    try {
      // Get existing aggregate metrics
      const existingData = await this.redis.get(aggregateKey);
      let aggregate: {
        count: number;
        successCount: number;
        totalDurationMs: number;
        avgDurationMs: number;
        minDurationMs: number;
        maxDurationMs: number;
        lastUpdated: number;
      };
      
      if (existingData) {
        aggregate = JSON.parse(existingData);
        
        // Update aggregate metrics
        aggregate.count += 1;
        aggregate.successCount += metrics.success ? 1 : 0;
        aggregate.totalDurationMs += metrics.durationMs;
        aggregate.avgDurationMs = aggregate.totalDurationMs / aggregate.count;
        aggregate.minDurationMs = Math.min(aggregate.minDurationMs, metrics.durationMs);
        aggregate.maxDurationMs = Math.max(aggregate.maxDurationMs, metrics.durationMs);
        aggregate.lastUpdated = Date.now();
      } else {
        // Initialize aggregate metrics
        aggregate = {
          count: 1,
          successCount: metrics.success ? 1 : 0,
          totalDurationMs: metrics.durationMs,
          avgDurationMs: metrics.durationMs,
          minDurationMs: metrics.durationMs,
          maxDurationMs: metrics.durationMs,
          lastUpdated: Date.now()
        };
      }
      
      // Store updated aggregate metrics
      await this.redis.set(aggregateKey, JSON.stringify(aggregate));
    } catch (error) {
      this.logger.error('Failed to update aggregated metrics', { 
        error: (error as Error).message,
        metrics 
      });
    }
  }
  
  /**
   * Gets aggregated metrics for an operation
   * 
   * @param operationName Name of the operation
   * @returns Aggregated metrics for the operation
   */
  async getAggregatedMetrics(operationName: string): Promise<any> {
    const aggregateKey = `${this.metricsPrefix}:${operationName}:aggregate`;
    
    try {
      const data = await this.redis.get(aggregateKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error('Failed to get aggregated metrics', { 
        error: (error as Error).message,
        operationName 
      });
      return null;
    }
  }
  
  /**
   * Gets recent metrics for an operation
   * 
   * @param operationName Name of the operation
   * @param limit Maximum number of metrics to return
   * @returns Recent metrics for the operation
   */
  async getRecentMetrics(operationName: string, limit: number = 10): Promise<PerformanceMetrics[]> {
    try {
      const pattern = `${this.metricsPrefix}:${operationName}:*`;
      const keys = await this.redis.keys(pattern);
      
      // Sort keys by timestamp (descending)
      keys.sort((a, b) => {
        const timestampA = parseInt(a.split(':').pop() || '0');
        const timestampB = parseInt(b.split(':').pop() || '0');
        return timestampB - timestampA;
      });
      
      // Get metrics for the most recent keys
      const recentKeys = keys.slice(0, limit);
      const metrics: PerformanceMetrics[] = [];
      
      for (const key of recentKeys) {
        const data = await this.redis.get(key);
        if (data) {
          metrics.push(JSON.parse(data));
        }
      }
      
      return metrics;
    } catch (error) {
      this.logger.error('Failed to get recent metrics', { 
        error: (error as Error).message,
        operationName 
      });
      return [];
    }
  }
  
  /**
   * Measures the execution time of a function and records performance metrics
   * 
   * @param operationName Name of the operation
   * @param networkType Type of blockchain network
   * @param fn Function to measure
   * @param metadata Additional metadata to record
   * @returns Result of the function
   */
  async measure<T>(
    operationName: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    let success = false;
    
    try {
      const result = await fn();
      success = true;
      return result;
    } finally {
      const endTime = Date.now();
      const durationMs = endTime - startTime;
      
      // Record performance metrics
      await this.recordMetrics({
        operationName,
        durationMs,
        success,
        timestamp: endTime,
        networkType: this.metricsPrefix.split(':')[1],
        metadata
      });
    }
  }
  
  /**
   * Cleans up resources used by the performance monitor
   */
  async cleanup(): Promise<void> {
    await this.redis.quit();
  }
}
