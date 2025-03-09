import { BlockchainNodeManager, BlockchainConfig } from '@fusion-ai/blockchain';
import { Redis } from 'ioredis';
import winston from 'winston';

export class BlockchainService {
  private nodeManager: BlockchainNodeManager;
  private redis: Redis;
  private logger: winston.Logger;
  private wsClients: Map<string, Set<WebSocket>>;

  constructor() {
    this.nodeManager = new BlockchainNodeManager();
    this.wsClients = new Map();
    
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    });

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'blockchain-service.log' })
      ]
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.nodeManager.on('nodeCreated', ({ nodeId, config }) => {
      this.broadcastToSubscribers(nodeId, {
        type: 'nodeStatus',
        status: 'created',
        nodeId,
        config
      });
    });

    this.nodeManager.on('networkStatus', (status) => {
      this.broadcastToSubscribers(status.nodeId, {
        type: 'networkStatus',
        ...status
      });
    });
  }

  async initializeNode(
    nodeId: string,
    config: BlockchainConfig
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.nodeManager.createNode(nodeId, config);
      await this.nodeManager.monitorNetwork(nodeId);
      
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to initialize blockchain node', {
        nodeId,
        error: (error as Error).message
      });
      
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async getNodeStatus(nodeId: string): Promise<{
    status: 'active' | 'error' | 'disconnected';
    metrics?: any;
  }> {
    try {
      const node = await this.nodeManager.getNode(nodeId);
      const blockNumber = await node.getBlockNumber();
      
      return {
        status: 'active',
        metrics: {
          blockNumber,
          lastUpdate: Date.now()
        }
      };
    } catch (error) {
      return { status: 'error' };
    }
  }

  async deployContract(
    nodeId: string,
    contractData: {
      abi: any[];
      bytecode: string;
      args: any[];
    }
  ): Promise<{ success: boolean; address?: string; error?: string }> {
    try {
      const { address } = await this.nodeManager.deployContract(
        nodeId,
        contractData.abi,
        contractData.bytecode,
        ...contractData.args
      );

      return { success: true, address };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  subscribeToNodeUpdates(nodeId: string, ws: WebSocket): void {
    if (!this.wsClients.has(nodeId)) {
      this.wsClients.set(nodeId, new Set());
    }
    this.wsClients.get(nodeId)?.add(ws);

    ws.on('close', () => {
      this.wsClients.get(nodeId)?.delete(ws);
      if (this.wsClients.get(nodeId)?.size === 0) {
        this.wsClients.delete(nodeId);
      }
    });
  }

  private broadcastToSubscribers(nodeId: string, message: any): void {
    const subscribers = this.wsClients.get(nodeId);
    if (subscribers) {
      const messageStr = JSON.stringify(message);
      subscribers.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        }
      });
    }
  }

  async cleanup(): Promise<void> {
    await this.nodeManager.cleanup();
    await this.redis.quit();
    
    // Close all WebSocket connections
    this.wsClients.forEach(subscribers => {
      subscribers.forEach(ws => ws.close());
    });
    this.wsClients.clear();
  }
}