/**
 * Batch processor for blockchain operations
 * 
 * This utility provides batching capabilities for blockchain operations,
 * reducing the number of network requests and improving performance.
 */

import winston from 'winston';

export interface BatchConfig {
  maxBatchSize: number;
  maxWaitTimeMs: number;
  retryAttempts: number;
  retryDelayMs: number;
}

export class BatchProcessor<T, R> {
  private queue: Array<{
    item: T;
    resolve: (result: R) => void;
    reject: (error: Error) => void;
  }> = [];
  private timer: NodeJS.Timeout | null = null;
  private config: BatchConfig;
  private logger: winston.Logger;
  private processingFunction: (items: T[]) => Promise<R[]>;
  
  constructor(
    processingFunction: (items: T[]) => Promise<R[]>,
    config?: Partial<BatchConfig>
  ) {
    this.processingFunction = processingFunction;
    this.config = {
      maxBatchSize: 100,
      maxWaitTimeMs: 50,
      retryAttempts: 3,
      retryDelayMs: 1000,
      ...config
    };
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'batch-processor' },
      transports: [
        new winston.transports.File({ filename: 'batch.log' })
      ]
    });
  }
  
  /**
   * Adds an item to the batch queue
   * 
   * @param item Item to add to the queue
   * @returns Promise that resolves with the result for this item
   */
  async add(item: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      // Add item to queue
      this.queue.push({ item, resolve, reject });
      
      // Process batch if queue is full
      if (this.queue.length >= this.config.maxBatchSize) {
        this.processBatch();
      } else if (!this.timer) {
        // Start timer if not already running
        this.timer = setTimeout(() => this.processBatch(), this.config.maxWaitTimeMs);
      }
    });
  }
  
  /**
   * Processes the current batch of items
   */
  private async processBatch(): Promise<void> {
    // Clear timer if running
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    // Get items from queue
    const batch = this.queue.splice(0, this.config.maxBatchSize);
    
    if (batch.length === 0) {
      return;
    }
    
    const items = batch.map((item) => item.item);
    
    this.logger.debug('Processing batch', { batchSize: batch.length });
    
    // Process batch with retries
    let attempt = 0;
    let results: R[] | null = null;
    
    while (attempt < this.config.retryAttempts) {
      try {
        results = await this.processingFunction(items);
        break;
      } catch (error) {
        attempt++;
        
        this.logger.error('Batch processing failed', { 
          error: (error as Error).message,
          attempt,
          maxAttempts: this.config.retryAttempts
        });
        
        if (attempt >= this.config.retryAttempts) {
          // Reject all promises in batch
          batch.forEach((item) => {
            item.reject(error as Error);
          });
          return;
        }
        
        // Wait before retrying
        await new Promise((resolve) => 
          setTimeout(resolve, this.config.retryDelayMs * attempt)
        );
      }
    }
    
    if (results) {
      // Resolve promises with results
      batch.forEach((item, index) => {
        item.resolve(results![index]);
      });
    }
  }
  
  /**
   * Flushes the current batch queue
   */
  async flush(): Promise<void> {
    if (this.queue.length > 0) {
      await this.processBatch();
    }
  }
}
