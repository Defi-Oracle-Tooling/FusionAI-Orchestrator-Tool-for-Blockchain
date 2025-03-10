import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js';
import { Redis } from 'ioredis';
import winston from 'winston';

export interface SolanaConfig {
  networkType: 'solana';
  rpcUrl: string;
  wsUrl?: string;
  apiKey?: string;
  credentials?: {
    privateKey?: string;
    secretKey?: Uint8Array;
  };
}

export class SolanaNode {
  private connection: Connection;
  private keypair?: Keypair;
  private redis: Redis;
  private logger: winston.Logger;
  private config: SolanaConfig;

  constructor(config: SolanaConfig) {
    this.config = config;
    this.connection = new Connection(config.rpcUrl);
    
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    });

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'solana.log' })
      ]
    });

    if (config.credentials) {
      this.initializeKeypair(config.credentials);
    }
  }

  private initializeKeypair(credentials: SolanaConfig['credentials']) {
    if (credentials?.secretKey) {
      this.keypair = Keypair.fromSecretKey(credentials.secretKey);
    } else if (credentials?.privateKey) {
      // Convert private key string to Uint8Array
      const privateKeyBytes = Buffer.from(credentials.privateKey, 'hex');
      this.keypair = Keypair.fromSecretKey(privateKeyBytes);
    }
  }

  async getBalance(address: string): Promise<number> {
    try {
      const publicKey = new PublicKey(address);
      return this.connection.getBalance(publicKey);
    } catch (error) {
      this.logger.error('Error getting balance', { address, error });
      throw new Error(`Failed to get balance for address ${address}: ${error}`);
    }
  }

  async getBlockHeight(): Promise<number> {
    try {
      return this.connection.getSlot();
    } catch (error) {
      this.logger.error('Error getting block height', { error });
      throw new Error(`Failed to get block height: ${error}`);
    }
  }

  async getTransaction(signature: string): Promise<any> {
    try {
      // Check cache first
      const cachedTx = await this.redis.hget(`solana:transactions`, signature);
      if (cachedTx) {
        return JSON.parse(cachedTx);
      }
      
      // If not in cache, fetch from network
      const transaction = await this.connection.getTransaction(signature);
      
      // Cache the result
      if (transaction) {
        await this.redis.hset(
          `solana:transactions`,
          signature,
          JSON.stringify(transaction)
        );
      }
      
      return transaction;
    } catch (error) {
      this.logger.error('Error getting transaction', { signature, error });
      throw new Error(`Failed to get transaction ${signature}: ${error}`);
    }
  }

  async sendTransaction(transaction: Transaction): Promise<string> {
    try {
      if (!this.keypair) {
        throw new Error('Keypair not initialized. Cannot send transaction.');
      }
      
      transaction.feePayer = this.keypair.publicKey;
      transaction.recentBlockhash = (
        await this.connection.getRecentBlockhash()
      ).blockhash;
      
      transaction.sign(this.keypair);
      
      const signature = await this.connection.sendRawTransaction(
        transaction.serialize()
      );
      
      await this.connection.confirmTransaction(signature);
      
      // Cache transaction info
      await this.redis.hset(
        `solana:transactions`,
        signature,
        JSON.stringify({
          signature,
          timestamp: Date.now(),
          sender: this.keypair.publicKey.toString()
        })
      );
      
      this.logger.info('Transaction sent successfully', { signature });
      return signature;
    } catch (error) {
      this.logger.error('Error sending transaction', { error });
      throw new Error(`Failed to send transaction: ${error}`);
    }
  }

  async subscribeToAccount(
    address: string,
    callback: (accountInfo: any) => void
  ): Promise<number> {
    try {
      const publicKey = new PublicKey(address);
      return this.connection.onAccountChange(publicKey, (accountInfo) => {
        this.logger.info('Account update received', {
          address,
          dataSize: accountInfo.data.length
        });
        callback(accountInfo);
      });
    } catch (error) {
      this.logger.error('Error subscribing to account', { address, error });
      throw new Error(`Failed to subscribe to account ${address}: ${error}`);
    }
  }

  async unsubscribe(subscriptionId: number): Promise<void> {
    try {
      await this.connection.removeAccountChangeListener(subscriptionId);
      this.logger.info('Unsubscribed from account', { subscriptionId });
    } catch (error) {
      this.logger.error('Error unsubscribing from account', { subscriptionId, error });
      throw new Error(`Failed to unsubscribe from account: ${error}`);
    }
  }

  async cleanup(): Promise<void> {
    try {
      await this.redis.quit();
      this.logger.info('Resources cleaned up successfully');
    } catch (error) {
      this.logger.error('Error during cleanup', { error });
      throw new Error(`Failed to clean up resources: ${error}`);
    }
  }
}
