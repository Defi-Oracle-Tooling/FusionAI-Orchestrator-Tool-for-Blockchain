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

export interface PredictiveAnalyticsConfig extends BaseConfig {
  timeframe: string;
  confidenceThreshold: number;
  dataPoints: number;
  historicalDataWindow: string;
  modelType: string;
}

export interface AnomalyDetectionConfig extends BaseConfig {
  sensitivityThreshold: number;
  timeWindow: string;
  baselineVolume: number;
  deviationThreshold: number;
  riskScoreThreshold: number;
}

export interface MarketSentimentConfig extends BaseConfig {
  platforms: string[];
  sources: string[];
  timeframe: string;
  minConfidence: number;
  sentimentThreshold: number;
  indicators?: string[];
}

export type AgentConfig = BaseConfig & {
  type: 'llm' | 'blockchain' | 'compliance' | 'predictive-analytics' | 'anomaly-detection' | 'market-sentiment';
  llm?: LLMConfig;
  blockchain?: BlockchainAnalyticsConfig;
  compliance?: ComplianceConfig;
  predictiveAnalytics?: PredictiveAnalyticsConfig;
  anomalyDetection?: AnomalyDetectionConfig;
  marketSentiment?: MarketSentimentConfig;
};
