import { FastifyRequest, FastifyReply } from 'fastify';
import { BlockchainService } from '../services/BlockchainService';
import { BlockchainConfig } from '@fusion-ai/blockchain';
import { logger } from '../services/LoggingService';

export class BlockchainController {
  private blockchainService: BlockchainService;

  constructor() {
    this.blockchainService = new BlockchainService();
  }

  async initializeNode(request: FastifyRequest<{
    Body: {
      nodeId: string;
      config: BlockchainConfig;
    };
  }>, reply: FastifyReply) {
    try {
      const { nodeId, config } = request.body;
      const result = await this.blockchainService.initializeNode(nodeId, config);
      
      if (result.success) {
        return reply.status(201).send({
          success: true,
          message: 'Blockchain node initialized successfully'
        });
      } else {
        return reply.status(400).send({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: (error as Error).message
      });
    }
  }

  async getNodeStatus(request: FastifyRequest<{
    Params: { nodeId: string };
  }>, reply: FastifyReply) {
    try {
      const { nodeId } = request.params;
      const status = await this.blockchainService.getNodeStatus(nodeId);
      
      return reply.send({
        success: true,
        ...status
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: (error as Error).message
      });
    }
  }

  async getNetworkStatus(request: FastifyRequest<{
    Params: { network: string };
  }>, reply: FastifyReply) {
    try {
      const { network } = request.params;
      logger.info('Fetching network status', { network });
      
      const status = await this.blockchainService.getNetworkStatus(network);
      return reply.send({
        success: true,
        status
      });
    } catch (error) {
      logger.error('Failed to get network status', error as Error, { network: request.params.network });
      return reply.status(500).send({
        success: false,
        error: (error as Error).message
      });
    }
  }

  async deployContract(request: FastifyRequest<{
    Body: {
      network: string;
      contractName: string;
      abi: any[];
      bytecode: string;
      constructorArgs?: any[];
    };
  }>, reply: FastifyReply) {
    try {
      const { network, contractName, abi, bytecode, constructorArgs } = request.body;
      logger.info('Deploying contract', { network, contractName });

      const result = await this.blockchainService.deployContract(
        network,
        contractName,
        abi,
        bytecode,
        constructorArgs
      );

      logger.info('Contract deployed successfully', { 
        network, 
        contractName, 
        address: result.contractAddress 
      });

      return reply.status(201).send({
        success: true,
        ...result
      });
    } catch (error) {
      logger.error('Failed to deploy contract', error as Error, { 
        network: request.body.network,
        contractName: request.body.contractName 
      });
      return reply.status(500).send({
        success: false,
        error: (error as Error).message
      });
    }
  }

  async executeTransaction(request: FastifyRequest<{
    Body: {
      network: string;
      contractAddress: string;
      method: string;
      params: any[];
      value?: string;
    };
  }>, reply: FastifyReply) {
    try {
      const { network, contractAddress, method, params, value } = request.body;
      logger.info('Executing transaction', { 
        network, 
        contractAddress, 
        method 
      });

      const result = await this.blockchainService.executeTransaction(
        network,
        contractAddress,
        method,
        params,
        value
      );

      logger.info('Transaction executed successfully', { 
        network, 
        contractAddress, 
        txHash: result.transactionHash 
      });

      return reply.send({
        success: true,
        ...result
      });
    } catch (error) {
      logger.error('Failed to execute transaction', error as Error, {
        network: request.body.network,
        contractAddress: request.body.contractAddress,
        method: request.body.method
      });
      return reply.status(500).send({
        success: false,
        error: (error as Error).message
      });
    }
  }

  async getTransactionStatus(request: FastifyRequest<{
    Params: { network: string; txHash: string };
  }>, reply: FastifyReply) {
    try {
      const { network, txHash } = request.params;
      logger.debug('Fetching transaction status', { network, txHash });

      const status = await this.blockchainService.getTransactionStatus(network, txHash);
      return reply.send({
        success: true,
        status
      });
    } catch (error) {
      logger.error('Failed to get transaction status', error as Error, {
        network: request.params.network,
        txHash: request.params.txHash
      });
      return reply.status(500).send({
        success: false,
        error: (error as Error).message
      });
    }
  }

  async getGasEstimate(request: FastifyRequest<{
    Body: {
      network: string;
      contractAddress: string;
      method: string;
      params: any[];
    };
  }>, reply: FastifyReply) {
    try {
      const { network, contractAddress, method, params } = request.body;
      logger.debug('Estimating gas', { 
        network, 
        contractAddress, 
        method 
      });

      const estimate = await this.blockchainService.estimateGas(
        network,
        contractAddress,
        method,
        params
      );

      return reply.send({
        success: true,
        estimate
      });
    } catch (error) {
      logger.error('Failed to estimate gas', error as Error, {
        network: request.body.network,
        contractAddress: request.body.contractAddress,
        method: request.body.method
      });
      return reply.status(500).send({
        success: false,
        error: (error as Error).message
      });
    }
  }

  handleWebSocket(connection: any, req: FastifyRequest) {
    const { nodeId } = req.params as { nodeId: string };
    
    // Subscribe to node updates
    this.blockchainService.subscribeToNodeUpdates(nodeId, connection.socket);
    
    connection.socket.on('message', async (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different WebSocket message types
        switch (data.type) {
          case 'getStatus':
            const status = await this.blockchainService.getNodeStatus(nodeId);
            connection.socket.send(JSON.stringify({
              type: 'status',
              ...status
            }));
            break;
            
          default:
            connection.socket.send(JSON.stringify({
              type: 'error',
              error: 'Unknown message type'
            }));
        }
      } catch (error) {
        connection.socket.send(JSON.stringify({
          type: 'error',
          error: (error as Error).message
        }));
      }
    });
  }
}