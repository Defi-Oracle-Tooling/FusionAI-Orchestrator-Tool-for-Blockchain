import { BlockchainNode, BlockchainConfig } from './BlockchainNode';
import { Redis } from 'ioredis';
import winston from 'winston';
import { EventEmitter } from 'events';

export class BlockchainNodeManager extends EventEmitter {
  private nodes: Map<string, BlockchainNode>;
  private redis: Redis;
  private logger: winston.Logger;

  constructor() {
    super();
    this.nodes = new Map();
    
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    });

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'blockchain-manager.log' })
      ]
    });
  }

  async createNode(nodeId: string, config: BlockchainConfig): Promise<BlockchainNode> {
    if (this.nodes.has(nodeId)) {
      throw new Error(`Node with ID ${nodeId} already exists`);
    }

    try {
      const node = new BlockchainNode(config);
      this.nodes.set(nodeId, node);

      // Cache node configuration
      await this.redis.hset(
        'blockchain:nodes',
        nodeId,
        JSON.stringify({
          config,
          createdAt: Date.now(),
          status: 'active'
        })
      );

      this.emit('nodeCreated', { nodeId, config });
      return node;
    } catch (error) {
      this.logger.error('Failed to create blockchain node', {
        nodeId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  async getNode(nodeId: string): Promise<BlockchainNode> {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node with ID ${nodeId} not found`);
    }
    return node;
  }

  async listNodes(): Promise<Array<{ id: string; config: BlockchainConfig }>> {
    const nodes = await this.redis.hgetall('blockchain:nodes');
    return Object.entries(nodes).map(([id, data]) => ({
      id,
      ...JSON.parse(data)
    }));
  }

  async removeNode(nodeId: string): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (node) {
      await node.cleanup();
      this.nodes.delete(nodeId);
      await this.redis.hdel('blockchain:nodes', nodeId);
      this.emit('nodeRemoved', { nodeId });
    }
  }

  async deployContract(
    nodeId: string,
    abi: any[],
    bytecode: string,
    ...args: any[]
  ): Promise<{ address: string; contract: any }> {
    const node = await this.getNode(nodeId);
    const contract = await node.deployContract(abi, bytecode, ...args);
    const address = await contract.getAddress();

    this.logger.info('Contract deployed', {
      nodeId,
      address,
      args
    });

    return { address, contract };
  }

  async monitorNetwork(nodeId: string): Promise<void> {
    const node = await this.getNode(nodeId);
    const initialBlock = await node.getBlockNumber();

    setInterval(async () => {
      try {
        const currentBlock = await node.getBlockNumber();
        this.emit('networkStatus', {
          nodeId,
          blockNumber: currentBlock,
          timestamp: Date.now()
        });
      } catch (error) {
        this.logger.error('Network monitoring failed', {
          nodeId,
          error: (error as Error).message
        });
      }
    }, 15000); // Check every 15 seconds
  }

  async cleanup(): Promise<void> {
    for (const [nodeId, node] of this.nodes) {
      await node.cleanup();
      this.emit('nodeRemoved', { nodeId });
    }
    this.nodes.clear();
    await this.redis.quit();
  }
}