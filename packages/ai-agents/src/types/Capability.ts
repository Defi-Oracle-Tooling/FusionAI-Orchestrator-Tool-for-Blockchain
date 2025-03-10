export interface CapabilityMetadata {
  name: string;
  description: string;
  requiredConfig: string[];
  version: string;
}

export type AgentCapabilityType = 
  | 'CONTRACT_ANALYSIS'
  | 'TRANSACTION_MONITORING'
  | 'COMPLIANCE_CHECK'
  | 'ANOMALY_DETECTION'
  | 'OPTIMIZATION'
  | 'PREDICTION'
  | 'RISK_ASSESSMENT'
  | 'PRICE_PREDICTION'
  | 'VOLUME_PREDICTION'
  | 'TREND_ANALYSIS'
  | 'PATTERN_DETECTION'
  | 'VOLUME_ANOMALY'
  | 'SUSPICIOUS_ADDRESS'
  | 'SOCIAL_MEDIA_ANALYSIS'
  | 'NEWS_ANALYSIS'
  | 'MARKET_INDICATOR_ANALYSIS';

export interface AgentCapability {
  type: AgentCapabilityType;
  metadata: CapabilityMetadata;
  confidence: number;
  enabled: boolean;
}
