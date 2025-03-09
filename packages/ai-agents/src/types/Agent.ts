import { AgentConfig } from './Config';
import { AgentCapability } from './Capability';

export interface AgentContext {
  workflowId: string;
  timestamp: number;
  metadata: Record<string, any>;
}

export interface AgentResult<T = any> {
  success: boolean;
  confidence: number;
  result: T;
  explanation?: string;
  error?: Error;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  config: AgentConfig;
  
  initialize(): Promise<void>;
  execute(context: AgentContext): Promise<AgentResult>;
  train(data: any): Promise<void>;
  validate(input: any): Promise<boolean>;
  getMetrics(): Promise<Record<string, number>>;
}