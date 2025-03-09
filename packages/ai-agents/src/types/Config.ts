export interface BaseConfig {
  enabled: boolean;
  timeout: number;
  retryAttempts: number;
  apiKey?: string;
  endpointUrl?: string;
}

export interface LLMConfig extends BaseConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

export interface BlockchainAnalyticsConfig extends BaseConfig {
  chainId: number;
  rpcEndpoint: string;
  wsEndpoint?: string;
  scanApiKey?: string;
}

export interface ComplianceConfig extends BaseConfig {
  regulations: string[];
  jurisdiction: string;
  riskThreshold: number;
}

export type AgentConfig = BaseConfig & {
  type: 'llm' | 'blockchain' | 'compliance';
  llm?: LLMConfig;
  blockchain?: BlockchainAnalyticsConfig;
  compliance?: ComplianceConfig;
};