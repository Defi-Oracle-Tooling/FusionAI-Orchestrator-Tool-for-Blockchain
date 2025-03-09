export interface BlockchainMetrics {
  network: string;
  gasPrice: number;
  blockTime: number;
  peerCount: number;
  transactionStatus: 'low' | 'medium' | 'high' | 'unknown';
}

export interface NetworkHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: {
    blockNumber?: number;
    gasPrice?: string;
    isSyncing?: boolean;
    peerCount?: number;
    lastBlockTime?: number;
    error?: string;
  };
}

export interface TransactionMetrics {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  gasUsed?: number;
  effectiveGasPrice?: number;
  timestamp: number;
}