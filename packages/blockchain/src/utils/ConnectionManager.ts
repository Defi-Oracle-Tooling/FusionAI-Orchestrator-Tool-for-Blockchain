/**
 * Connection manager for blockchain adapters
 * 
 * This utility provides connection management capabilities for blockchain adapters,
 * handling connection pooling, reconnection, and health checks.
 */

import winston from 'winston';
import { EventEmitter } from 'events';

export interface ConnectionConfig {
  maxConnections: number;
  reconnectIntervalMs: number;
  healthCheckIntervalMs: number;
  connectionTimeoutMs: number;
}

export interface Connection<T> {
  id: string;
  instance: T;
  isHealthy: boolean;
  lastUsed: number;
  createdAt: number;
}

export class ConnectionManager<T> extends EventEmitter {
  private connections: Map<string, Connection<T>> = new Map();
  private config: ConnectionConfig;
  private logger: winston.Logger;
  private connectionFactory: () => Promise<T>;
  private healthCheckFn: (connection: T) => Promise<boolean>;
  private cleanupFn: (connection: T) => Promise<void>;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  
  constructor(
    connectionFactory: () => Promise<T>,
    healthCheckFn: (connection: T) => Promise<boolean>,
    cleanupFn: (connection: T) => Promise<void>,
    config?: Partial<ConnectionConfig>
  ) {
    super();
    
    this.connectionFactory = connectionFactory;
    this.healthCheckFn = healthCheckFn;
    this.cleanupFn = cleanupFn;
    
    this.config = {
      maxConnections: 5,
      reconnectIntervalMs: 5000,
      healthCheckIntervalMs: 30000,
      connectionTimeoutMs: 10000,
      ...config
    };
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'connection-manager' },
      transports: [
        new winston.transports.File({ filename: 'connection.log' })
      ]
    });
    
    // Start health check timer
    this.startHealthCheck();
  }
  
  /**
   * Initializes connections
   * 
   * @param count Number of connections to initialize
   */
  async initialize(count: number = 1): Promise<void> {
    const initCount = Math.min(count, this.config.maxConnections);
    
    this.logger.info('Initializing connections', { count: initCount });
    
    const promises: Promise<string>[] = [];
    
    for (let i = 0; i < initCount; i++) {
      promises.push(this.createConnection());
    }
    
    await Promise.all(promises);
  }
  
  /**
   * Creates a new connection
   * 
   * @returns Connection ID
   */
  private async createConnection(): Promise<string> {
    try {
      // Check if we've reached the maximum number of connections
      if (this.connections.size >= this.config.maxConnections) {
        this.logger.warn('Maximum connections reached', { 
          max: this.config.maxConnections 
        });
        return '';
      }
      
      // Create connection with timeout
      const connectionPromise = this.connectionFactory();
      const timeoutPromise = new Promise<T>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, this.config.connectionTimeoutMs);
      });
      
      const instance = await Promise.race([connectionPromise, timeoutPromise]);
      
      // Generate connection ID
      const id = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Store connection
      this.connections.set(id, {
        id,
        instance,
        isHealthy: true,
        lastUsed: Date.now(),
        createdAt: Date.now()
      });
      
      this.logger.info('Connection created', { id });
      this.emit('connection:created', id);
      
      return id;
    } catch (error) {
      this.logger.error('Failed to create connection', { 
        error: (error as Error).message 
      });
      
      // Schedule reconnect
      this.scheduleReconnect();
      
      return '';
    }
  }
  
  /**
   * Gets a connection
   * 
   * @returns Connection instance
   */
  async getConnection(): Promise<T> {
    // Find a healthy connection
    let healthyConnection: Connection<T> | undefined;
    
    for (const connection of this.connections.values()) {
      if (connection.isHealthy) {
        healthyConnection = connection;
        break;
      }
    }
    
    // Create a new connection if no healthy connection found
    if (!healthyConnection) {
      const id = await this.createConnection();
      
      if (id) {
        healthyConnection = this.connections.get(id);
      }
    }
    
    if (healthyConnection) {
      // Update last used timestamp
      healthyConnection.lastUsed = Date.now();
      return healthyConnection.instance;
    }
    
    throw new Error('No healthy connection available');
  }
  
  /**
   * Schedules a reconnect attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }
    
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      
      // Count unhealthy connections
      let unhealthyCount = 0;
      
      for (const connection of this.connections.values()) {
        if (!connection.isHealthy) {
          unhealthyCount++;
        }
      }
      
      // Create new connections to replace unhealthy ones
      if (unhealthyCount > 0) {
        this.logger.info('Attempting to reconnect', { 
          unhealthyCount 
        });
        
        for (let i = 0; i < unhealthyCount; i++) {
          await this.createConnection();
        }
      }
    }, this.config.reconnectIntervalMs);
  }
  
  /**
   * Starts the health check timer
   */
  private startHealthCheck(): void {
    if (this.healthCheckTimer) {
      return;
    }
    
    this.healthCheckTimer = setInterval(async () => {
      await this.checkHealth();
    }, this.config.healthCheckIntervalMs);
  }
  
  /**
   * Checks the health of all connections
   */
  private async checkHealth(): Promise<void> {
    this.logger.debug('Checking connection health');
    
    for (const [id, connection] of this.connections.entries()) {
      try {
        const isHealthy = await this.healthCheckFn(connection.instance);
        
        if (connection.isHealthy !== isHealthy) {
          connection.isHealthy = isHealthy;
          
          if (isHealthy) {
            this.logger.info('Connection restored', { id });
            this.emit('connection:restored', id);
          } else {
            this.logger.warn('Connection unhealthy', { id });
            this.emit('connection:unhealthy', id);
          }
        }
      } catch (error) {
        connection.isHealthy = false;
        
        this.logger.error('Health check failed', { 
          id,
          error: (error as Error).message 
        });
        
        this.emit('connection:unhealthy', id);
      }
    }
    
    // Schedule reconnect if needed
    let hasUnhealthyConnections = false;
    
    for (const connection of this.connections.values()) {
      if (!connection.isHealthy) {
        hasUnhealthyConnections = true;
        break;
      }
    }
    
    if (hasUnhealthyConnections) {
      this.scheduleReconnect();
    }
  }
  
  /**
   * Releases a connection
   * 
   * @param id Connection ID
   */
  async releaseConnection(id: string): Promise<void> {
    const connection = this.connections.get(id);
    
    if (connection) {
      try {
        await this.cleanupFn(connection.instance);
        this.connections.delete(id);
        
        this.logger.info('Connection released', { id });
        this.emit('connection:released', id);
      } catch (error) {
        this.logger.error('Failed to release connection', { 
          id,
          error: (error as Error).message 
        });
      }
    }
  }
  
  /**
   * Gets connection statistics
   * 
   * @returns Connection statistics
   */
  getStats(): {
    totalConnections: number;
    healthyConnections: number;
    unhealthyConnections: number;
    avgConnectionAge: number;
  } {
    let healthyCount = 0;
    let totalAge = 0;
    const now = Date.now();
    
    for (const connection of this.connections.values()) {
      if (connection.isHealthy) {
        healthyCount++;
      }
      
      totalAge += now - connection.createdAt;
    }
    
    const totalConnections = this.connections.size;
    const avgConnectionAge = totalConnections > 0 ? totalAge / totalConnections : 0;
    
    return {
      totalConnections,
      healthyConnections: healthyCount,
      unhealthyConnections: totalConnections - healthyCount,
      avgConnectionAge
    };
  }
  
  /**
   * Cleans up resources used by the connection manager
   */
  async cleanup(): Promise<void> {
    // Clear timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    
    // Release all connections
    const promises: Promise<void>[] = [];
    
    for (const id of this.connections.keys()) {
      promises.push(this.releaseConnection(id));
    }
    
    await Promise.all(promises);
    
    this.logger.info('Connection manager cleaned up');
  }
}
