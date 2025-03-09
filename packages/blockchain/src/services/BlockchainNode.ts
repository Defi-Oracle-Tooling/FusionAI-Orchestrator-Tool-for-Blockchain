import { ethers } from 'ethers';
import { Redis } from 'ioredis';
import winston from 'winston';

export interface BlockchainConfig {
  chainId: number;
  networkType: 'ethereum' | 'hyperledger' | 'polygon';
  rpcUrl: string;
  wsUrl?: string;
  apiKey?: string;
  credentials?: {
    privateKey?: string;
    mnemonic?: string;
  };
}

export class BlockchainNode {
  private provider: ethers.Provider;
  private signer?: ethers.Signer;
  private redis: Redis;
  private logger: winston.Logger;
  private config: BlockchainConfig;

  constructor(config: BlockchainConfig) {
    this.config = config;
    this.provider = this.createProvider(config);
    
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    });

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'blockchain.log' })
      ]
    });

    if (config.credentials) {
      this.initializeSigner(config.credentials);
    }
  }

  private createProvider(config: BlockchainConfig): ethers.Provider {
    if (config.wsUrl) {
      return new ethers.WebSocketProvider(config.wsUrl);
    }
    return new ethers.JsonRpcProvider(config.rpcUrl);
  }

  private initializeSigner(credentials: BlockchainConfig['credentials']) {
    if (credentials.privateKey) {
      this.signer = new ethers.Wallet(credentials.privateKey, this.provider);
    } else if (credentials.mnemonic) {
      this.signer = ethers.Wallet.fromPhrase(credentials.mnemonic).connect(this.provider);
    }
  }

  async getBlockNumber(): Promise<number> {
    return this.provider.getBlockNumber();
  }

  async getBalance(address: string): Promise<bigint> {
    return this.provider.getBalance(address);
  }

  async deployContract(abi: any[], bytecode: string, ...args: any[]): Promise<ethers.Contract> {
    if (!this.signer) {
      throw new Error('Signer not initialized. Cannot deploy contract.');
    }

    const factory = new ethers.ContractFactory(abi, bytecode, this.signer);
    const contract = await factory.deploy(...args);
    await contract.waitForDeployment();

    // Cache contract deployment info
    const address = await contract.getAddress();
    await this.redis.hset(
      `blockchain:contracts:${this.config.chainId}`,
      address,
      JSON.stringify({
        abi,
        address,
        deployedAt: Date.now(),
        deployedBy: await this.signer.getAddress()
      })
    );

    return contract;
  }

  async getContract(address: string, abi: any[]): Promise<ethers.Contract> {
    if (this.signer) {
      return new ethers.Contract(address, abi, this.signer);
    }
    return new ethers.Contract(address, abi, this.provider);
  }

  async subscribeToEvents(
    contract: ethers.Contract,
    eventName: string,
    callback: (event: any) => void
  ): Promise<void> {
    contract.on(eventName, (...args) => {
      const event = args[args.length - 1];
      this.logger.info('Contract event received', {
        eventName,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
      });
      callback(event);
    });
  }

  async estimateGas(transaction: ethers.TransactionRequest): Promise<bigint> {
    return this.provider.estimateGas(transaction);
  }

  async getTransactionReceipt(txHash: string): Promise<ethers.TransactionReceipt | null> {
    return this.provider.getTransactionReceipt(txHash);
  }

  async waitForTransaction(
    txHash: string,
    confirmations: number = 1
  ): Promise<ethers.TransactionReceipt> {
    return this.provider.waitForTransaction(txHash, confirmations);
  }

  async cleanup(): Promise<void> {
    if (this.provider instanceof ethers.WebSocketProvider) {
      this.provider.destroy();
    }
    await this.redis.quit();
  }
}