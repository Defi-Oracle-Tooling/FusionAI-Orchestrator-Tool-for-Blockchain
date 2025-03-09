export interface NetworkConfig {
  name: string;
  chainId: number;
  networkType: 'ethereum' | 'hyperledger' | 'polygon';
  rpcUrl: string;
  wsUrl?: string;
  explorerUrl?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const networks: Record<string, NetworkConfig> = {
  'ethereum-mainnet': {
    name: 'Ethereum Mainnet',
    chainId: 1,
    networkType: 'ethereum',
    rpcUrl: process.env.ETH_MAINNET_RPC_URL || 'https://mainnet.infura.io/v3/YOUR-PROJECT-ID',
    wsUrl: process.env.ETH_MAINNET_WS_URL,
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  'polygon-mainnet': {
    name: 'Polygon Mainnet',
    chainId: 137,
    networkType: 'polygon',
    rpcUrl: process.env.POLYGON_MAINNET_RPC_URL || 'https://polygon-rpc.com',
    wsUrl: process.env.POLYGON_MAINNET_WS_URL,
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    }
  },
  'eth-goerli': {
    name: 'Goerli Testnet',
    chainId: 5,
    networkType: 'ethereum',
    rpcUrl: process.env.ETH_GOERLI_RPC_URL || 'https://goerli.infura.io/v3/YOUR-PROJECT-ID',
    wsUrl: process.env.ETH_GOERLI_WS_URL,
    explorerUrl: 'https://goerli.etherscan.io',
    nativeCurrency: {
      name: 'Goerli ETH',
      symbol: 'ETH',
      decimals: 18
    }
  },
  'polygon-mumbai': {
    name: 'Mumbai Testnet',
    chainId: 80001,
    networkType: 'polygon',
    rpcUrl: process.env.POLYGON_MUMBAI_RPC_URL || 'https://rpc-mumbai.maticvigil.com',
    wsUrl: process.env.POLYGON_MUMBAI_WS_URL,
    explorerUrl: 'https://mumbai.polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    }
  },
  'hyperledger-besu': {
    name: 'Hyperledger Besu Private Network',
    chainId: 1337,
    networkType: 'hyperledger',
    rpcUrl: process.env.BESU_RPC_URL || 'http://localhost:8545',
    wsUrl: process.env.BESU_WS_URL || 'ws://localhost:8546',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  }
};

export function getNetworkConfig(networkId: string): NetworkConfig {
  const config = networks[networkId];
  if (!config) {
    throw new Error(`Network configuration not found for network ID: ${networkId}`);
  }
  return config;
}

export function validateNetworkConfig(config: NetworkConfig): void {
  if (!config.rpcUrl) {
    throw new Error(`RPC URL is required for network: ${config.name}`);
  }
  
  if (!config.chainId) {
    throw new Error(`Chain ID is required for network: ${config.name}`);
  }
}