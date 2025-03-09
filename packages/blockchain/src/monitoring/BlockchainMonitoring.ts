import { ethers } from 'ethers';
import { MonitoringService } from '@fusion-ai/monitoring';
import { BlockchainMetrics } from '../types/Metrics';
import { logger } from '@fusion-ai/backend/src/services/LoggingService';

export class BlockchainMonitoring {
  private provider: ethers.providers.Provider;
  private monitoringService: MonitoringService;
  private networkId: string;
  private metricsInterval: NodeJS.Timeout | null = null;

  constructor(
    provider: ethers.providers.Provider,
    networkId: string,
    monitoringService: MonitoringService
  ) {
    this.provider = provider;
    this.networkId = networkId;
    this.monitoringService = monitoringService;
  }

  async startMonitoring(interval: number = 15000): Promise<void> {
    try {
      // Initial metrics collection
      await this.collectMetrics();

      // Set up periodic collection
      this.metricsInterval = setInterval(async () => {
        try {
          await this.collectMetrics();
        } catch (error) {
          logger.error('Error collecting blockchain metrics', error as Error, {
            networkId: this.networkId
          });
        }
      }, interval);

      logger.info('Started blockchain monitoring', { networkId: this.networkId });
    } catch (error) {
      logger.error('Failed to start blockchain monitoring', error as Error, {
        networkId: this.networkId
      });
      throw error;
    }
  }

  stopMonitoring(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
      logger.info('Stopped blockchain monitoring', { networkId: this.networkId });
    }
  }

  private async collectMetrics(): Promise<void> {
    const metrics: BlockchainMetrics = {
      network: this.networkId,
      gasPrice: (await this.provider.getGasPrice()).toNumber(),
      blockTime: await this.calculateBlockTime(),
      peerCount: await this.getPeerCount(),
      transactionStatus: await this.getTransactionStatus()
    };

    this.monitoringService.updateBlockchainMetrics(metrics);
  }

  private async calculateBlockTime(): Promise<number> {
    try {
      const latestBlock = await this.provider.getBlock('latest');
      const previousBlock = await this.provider.getBlock(latestBlock.number - 1);
      
      return latestBlock.timestamp - previousBlock.timestamp;
    } catch (error) {
      logger.error('Error calculating block time', error as Error, {
        networkId: this.networkId
      });
      return 0;
    }
  }

  private async getPeerCount(): Promise<number> {
    try {
      if ('send' in this.provider) {
        const peerCount = await (this.provider as any).send('net_peerCount', []);
        return parseInt(peerCount, 16);
      }
      return 0;
    } catch (error) {
      logger.error('Error getting peer count', error as Error, {
        networkId: this.networkId
      });
      return 0;
    }
  }

  private async getTransactionStatus(): Promise<string> {
    try {
      const block = await this.provider.getBlock('latest');
      const txCount = block.transactions.length;
      
      if (txCount > 100) return 'high';
      if (txCount > 50) return 'medium';
      return 'low';
    } catch (error) {
      logger.error('Error getting transaction status', error as Error, {
        networkId: this.networkId
      });
      return 'unknown';
    }
  }

  async getNetworkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      const [blockNumber, gasPrice, syncStatus] = await Promise.all([
        this.provider.getBlockNumber(),
        this.provider.getGasPrice(),
        this.getSyncStatus()
      ]);

      const health = {
        blockNumber,
        gasPrice: gasPrice.toString(),
        isSyncing: syncStatus.isSyncing,
        peerCount: await this.getPeerCount(),
        lastBlockTime: await this.calculateBlockTime()
      };

      // Determine overall health status
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (health.peerCount === 0 || health.isSyncing) {
        status = 'degraded';
      }
      if (health.lastBlockTime > 60) { // Block time > 60 seconds
        status = 'unhealthy';
      }

      return { status, details: health };
    } catch (error) {
      logger.error('Error getting network health', error as Error, {
        networkId: this.networkId
      });
      return {
        status: 'unhealthy',
        details: {
          error: (error as Error).message
        }
      };
    }
  }

  private async getSyncStatus(): Promise<{ isSyncing: boolean; status?: any }> {
    try {
      if ('send' in this.provider) {
        const syncStatus = await (this.provider as any).send('eth_syncing', []);
        return {
          isSyncing: syncStatus !== false,
          status: syncStatus
        };
      }
      return { isSyncing: false };
    } catch (error) {
      logger.error('Error getting sync status', error as Error, {
        networkId: this.networkId
      });
      return { isSyncing: false };
    }
  }
}