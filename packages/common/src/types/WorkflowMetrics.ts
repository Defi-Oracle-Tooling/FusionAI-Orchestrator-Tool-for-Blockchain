export interface WorkflowMetrics {
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  startTime: number;
  endTime?: number;
  steps: WorkflowStepMetrics[];
  resourceUsage: ResourceMetrics;
}

export interface WorkflowStepMetrics {
  stepId: string;
  type: 'blockchain' | 'ai-agent' | 'infrastructure';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export interface ResourceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  networkIO: {
    bytesIn: number;
    bytesOut: number;
  };
}

export interface WorkflowHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: {
    activeSteps: number;
    completedSteps: number;
    failedSteps: number;
    averageStepDuration: number;
    estimatedTimeRemaining: number;
    error?: string;
  };
}

export interface WorkflowAlert {
  workflowId: string;
  type: 'performance' | 'error' | 'resource';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: number;
  metadata: Record<string, any>;
}