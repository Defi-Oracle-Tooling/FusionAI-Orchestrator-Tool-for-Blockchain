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
  | 'RISK_ASSESSMENT';

export interface AgentCapability {
  type: AgentCapabilityType;
  metadata: CapabilityMetadata;
  confidence: number;
  enabled: boolean;
}