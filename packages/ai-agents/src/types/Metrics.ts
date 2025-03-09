export interface AgentMetrics {
  agentId: string;
  capability: string;
  executionTime: number;
  error?: {
    type: string;
    message: string;
  };
  confidenceScore?: number;
}

export interface AgentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: {
    errorCount: number;
    averageExecutionTime: number;
    totalExecutions: number;
    memoryUsage: number;
    error?: string;
  };
}

export interface AgentExecutionMetrics {
  requestId: string;
  startTime: number;
  endTime?: number;
  capability: string;
  status: 'running' | 'completed' | 'failed';
  resourceUtilization?: {
    cpuUsage: number;
    memoryUsage: number;
  };
}