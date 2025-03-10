// Using require instead of import to avoid ESM/CommonJS issues
const polkadotApi = require('@polkadot/api');
const { ApiPromise, WsProvider, Keyring } = polkadotApi;

import { Redis } from 'ioredis';
import winston from 'winston';

// Define types locally to avoid import issues
type KeyringPair = {
  address: string;
  publicKey: Uint8Array;
  sign(message: Uint8Array): Uint8Array;
};

export interface PolkadotConfig {
  networkType: 'polkadot';
  wsUrl: string;
  credentials?: {
    seed?: string;
    mnemonic?: string;
  };
}

export class PolkadotNode {
  private api: any | null = null;
  private keyring: any;
  private account?: KeyringPair;
  private redis: Redis;
  private logger: winston.Logger;
  private config: PolkadotConfig;

  constructor(config: PolkadotConfig) {
    this.config = config;
    this.keyring = new Keyring({ type: 'sr25519' });
    
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    });

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'polkadot.log' })
      ]
    });
  }

  async initialize(): Promise<void> {
    const provider = new WsProvider(this.config.wsUrl);
    this.api = await ApiPromise.create({ provider });
    
    if (this.config.credentials) {
      this.initializeAccount(this.config.credentials);
    }
    
    this.logger.info('Polkadot API initialized', {
      chain: await this.api.rpc.system.chain(),
      nodeName: await this.api.rpc.system.name(),
      nodeVersion: await this.api.rpc.system.version()
    });
  }

  private initializeAccount(credentials: PolkadotConfig['credentials']) {
    if (credentials?.seed) {
      this.account = this.keyring.addFromUri(credentials.seed);
    } else if (credentials?.mnemonic) {
      this.account = this.keyring.addFromMnemonic(credentials.mnemonic);
    }
  }

  async getBlockNumber(): Promise<number> {
    if (!this.api) {
      throw new Error('API not initialized. Call initialize() first.');
    }
    const header = await this.api.rpc.chain.getHeader();
    return header.number.toNumber();
  }

  async getBalance(address: string): Promise<string> {
    if (!this.api) {
      throw new Error('API not initialized. Call initialize() first.');
    }
    const { data: balance } = await this.api.query.system.account(address);
    return balance.free.toString();
  }

  async transfer(recipient: string, amount: number): Promise<string> {
    if (!this.api) {
      throw new Error('API not initialized. Call initialize() first.');
    }
    
    if (!this.account) {
      throw new Error('Account not initialized. Cannot send transaction.');
    }
    
    const transfer = this.api.tx.balances.transfer(recipient, amount);
    const hash = await transfer.signAndSend(this.account);
    
    // Cache transaction info
    await this.redis.hset(
      `polkadot:transactions`,
      hash.toString(),
      JSON.stringify({
        hash: hash.toString(),
        timestamp: Date.now(),
        sender: this.account.address,
        recipient,
        amount
      })
    );
    
    return hash.toString();
  }

  async subscribeToBalanceChanges(
    address: string,
    callback: (balance: any) => void
  ): Promise<() => void> {
    if (!this.api) {
      throw new Error('API not initialized. Call initialize() first.');
    }
    
    const unsubscribe = await this.api.query.system.account(address, ({ data }: any) => {
      this.logger.info('Balance update received', {
        address,
        free: data.free.toString(),
        reserved: data.reserved.toString()
      });
      callback(data);
    });
    
    return unsubscribe;
  }

  async subscribeToNewBlocks(callback: (blockNumber: number) => void): Promise<() => void> {
    if (!this.api) {
      throw new Error('API not initialized. Call initialize() first.');
    }
    
    
    const unsubscribe = await this.api.rpc.chain.subscribeNewHeads((header: any) => {
      const blockNumber = header.number.toNumber();
      this.logger.info('New block received', { blockNumber });
      callback(blockNumber);
    });
    
    return unsubscribe;
  }

  async cleanup(): Promise<void> {
    if (this.api) {
      await this.api.disconnect();
    }
    await this.redis.quit();
  }
}
