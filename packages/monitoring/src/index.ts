import { MonitoringService } from './services/MonitoringService';

export * from './services/MonitoringService';

// Export commonly used types
export interface MetricData {
  timestamp: number;
  value: number;
  labels: Record<string, string>;
}

export interface AlertRule {
  id: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq';
  threshold: number;
  duration: number;
  severity: 'info' | 'warning' | 'critical';
}

// Define standard metrics
export const MetricNames = {
  // Blockchain metrics
  BLOCK_TIME: 'block_time',
  GAS_PRICE: 'gas_price',
  TRANSACTION_COUNT: 'transaction_count',
  PEERS_COUNT: 'peers_count',
  
  // AI Agent metrics
  AGENT_EXECUTION_TIME: 'agent_execution_time',
  AGENT_CONFIDENCE: 'agent_confidence',
  AGENT_ERROR_RATE: 'agent_error_rate',
  
  // System metrics
  CPU_USAGE: 'cpu_usage',
  MEMORY_USAGE: 'memory_usage',
  API_LATENCY: 'api_latency',

  // Workflow progress metrics
  COMPLETION_PERCENTAGE: 'completion_percentage',
  TIME_REMAINING: 'time_remaining_seconds'
} as const;

// Define standard label names
export const LabelNames = {
  NODE_ID: 'node_id',
  NETWORK: 'network',
  AGENT_ID: 'agent_id',
  AGENT_TYPE: 'agent_type',
  ENDPOINT: 'endpoint'
} as const;

const monitoringService = new MonitoringService();

// Setup default alert rules
async function setupDefaultAlertRules() {
  await monitoringService.addAlertRule({
    id: 'high-latency',
    metric: 'ai_agent_response_time_ms',
    condition: 'gt',
    threshold: 5000, // 5 seconds
    duration: 60,
    severity: 'warning'
  });

  await monitoringService.addAlertRule({
    id: 'low-confidence',
    metric: 'agent_confidence',
    condition: 'lt',
    threshold: 0.7,
    duration: 300,
    severity: 'warning'
  });

  await monitoringService.addAlertRule({
    id: 'workflow-failures',
    metric: 'workflow_success_rate',
    condition: 'lt',
    threshold: 0.95,
    duration: 300,
    severity: 'critical'
  });

  await monitoringService.addAlertRule({
    id: 'high-resource-usage',
    metric: 'cpu_usage',
    condition: 'gt',
    threshold: 90,
    duration: 300,
    severity: 'critical'
  });
}

setupDefaultAlertRules().catch(console.error);

export { monitoringService };