import { Redis } from 'ioredis';
import winston from 'winston';
import { EventEmitter } from 'events';
import { Registry, Gauge, Counter, Histogram } from 'prom-client';
import { BlockchainMetrics } from '@fusion-ai/blockchain';
import { AgentMetrics } from '@fusion-ai/ai-agents';

interface MetricData {
  timestamp: number;
  value: number;
  labels: Record<string, string>;
}

interface AlertRule {
  id: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq';
  threshold: number;
  duration: number; // Duration in seconds
  severity: 'info' | 'warning' | 'critical';
}

export class MonitoringService extends EventEmitter {
  private redis: Redis;
  private logger: winston.Logger;
  private alertRules: Map<string, AlertRule>;
  private metricsRetention: number = 86400; // 24 hours in seconds
  private registry: Registry;
  
  // Blockchain metrics
  private gasPrice: Gauge<string>;
  private blockTime: Gauge<string>;
  private transactionCount: Counter<string>;
  private peerCount: Gauge<string>;
  
  // AI Agent metrics
  private agentExecutionTime: Histogram<string>;
  private agentErrors: Counter<string>;
  private agentConfidenceScore: Gauge<string>;
  
  // Workflow metrics
  private workflowExecutionTime: Histogram<string>;
  private workflowErrors: Counter<string>;
  private activeWorkflows: Gauge<string>;

  constructor() {
    super();
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    });

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'monitoring.log' })
      ]
    });

    this.alertRules = new Map();
    this.registry = new Registry();
    
    // Initialize blockchain metrics
    this.gasPrice = new Gauge({
      name: 'ethereum_gas_price',
      help: 'Current gas price in wei',
      registers: [this.registry]
    });
    
    this.blockTime = new Gauge({
      name: 'blockchain_block_time_seconds',
      help: 'Time between blocks in seconds',
      labelNames: ['network'],
      registers: [this.registry]
    });
    
    this.transactionCount = new Counter({
      name: 'blockchain_transactions_total',
      help: 'Total number of transactions',
      labelNames: ['network', 'status'],
      registers: [this.registry]
    });
    
    this.peerCount = new Gauge({
      name: 'blockchain_peer_count',
      help: 'Number of connected peers',
      labelNames: ['network'],
      registers: [this.registry]
    });
    
    // Initialize AI agent metrics
    this.agentExecutionTime = new Histogram({
      name: 'ai_agent_execution_duration_seconds',
      help: 'AI agent execution duration in seconds',
      labelNames: ['agent_id', 'capability'],
      registers: [this.registry]
    });
    
    this.agentErrors = new Counter({
      name: 'ai_agent_execution_errors_total',
      help: 'Total number of AI agent execution errors',
      labelNames: ['agent_id', 'error_type'],
      registers: [this.registry]
    });
    
    this.agentConfidenceScore = new Gauge({
      name: 'ai_agent_confidence_score',
      help: 'AI agent confidence score for decisions',
      labelNames: ['agent_id', 'capability'],
      registers: [this.registry]
    });
    
    // Initialize workflow metrics
    this.workflowExecutionTime = new Histogram({
      name: 'workflow_execution_duration_seconds',
      help: 'Workflow execution duration in seconds',
      labelNames: ['workflow_id'],
      registers: [this.registry]
    });
    
    this.workflowErrors = new Counter({
      name: 'workflow_execution_failures_total',
      help: 'Total number of workflow execution failures',
      labelNames: ['workflow_id', 'error_type'],
      registers: [this.registry]
    });
    
    this.activeWorkflows = new Gauge({
      name: 'workflow_active_count',
      help: 'Number of currently active workflows',
      registers: [this.registry]
    });
  }

  async recordMetric(
    name: string,
    value: number,
    labels: Record<string, string> = {}
  ): Promise<void> {
    const timestamp = Date.now();
    const metric: MetricData = { timestamp, value, labels };
    
    // Store metric in Redis time series
    const key = this.getMetricKey(name, labels);
    await this.redis.zadd(key, timestamp, JSON.stringify(metric));
    
    // Cleanup old metrics
    const cutoff = timestamp - (this.metricsRetention * 1000);
    await this.redis.zremrangebyscore(key, '-inf', cutoff);
    
    // Check alert rules
    await this.checkAlertRules(name, value, labels);
  }

  async getMetrics(
    name: string,
    labels: Record<string, string> = {},
    timeRange: { start: number; end: number }
  ): Promise<MetricData[]> {
    const key = this.getMetricKey(name, labels);
    const metrics = await this.redis.zrangebyscore(
      key,
      timeRange.start,
      timeRange.end
    );
    
    return metrics.map(m => JSON.parse(m));
  }

  async addAlertRule(rule: AlertRule): Promise<void> {
    this.alertRules.set(rule.id, rule);
    await this.redis.hset('alert:rules', rule.id, JSON.stringify(rule));
  }

  async removeAlertRule(ruleId: string): Promise<void> {
    this.alertRules.delete(ruleId);
    await this.redis.hdel('alert:rules', ruleId);
  }

  private async checkAlertRules(
    metricName: string,
    value: number,
    labels: Record<string, string>
  ): Promise<void> {
    for (const rule of this.alertRules.values()) {
      if (rule.metric === metricName) {
        const isTriggered = this.evaluateRule(rule, value);
        
        if (isTriggered) {
          const alert = {
            ruleId: rule.id,
            metric: metricName,
            value,
            labels,
            timestamp: Date.now(),
            severity: rule.severity
          };

          this.emit('alert', alert);
          await this.redis.publish('monitoring:alerts', JSON.stringify(alert));
          
          this.logger.warn('Alert triggered', { alert });
        }
      }
    }
  }

  private evaluateRule(rule: AlertRule, value: number): boolean {
    switch (rule.condition) {
      case 'gt':
        return value > rule.threshold;
      case 'lt':
        return value < rule.threshold;
      case 'eq':
        return value === rule.threshold;
      default:
        return false;
    }
  }

  private getMetricKey(name: string, labels: Record<string, string>): string {
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `metrics:${name}${labelStr ? `:${labelStr}` : ''}`;
  }

  async getActiveAlerts(): Promise<any[]> {
    const alerts = await this.redis.zrange('monitoring:active_alerts', 0, -1);
    return alerts.map(alert => JSON.parse(alert));
  }

  async cleanup(): Promise<void> {
    await this.redis.quit();
  }

  async recordAgentConfidence(agentType: string, confidence: number): Promise<void> {
    await this.recordMetric('agent_confidence', confidence, { agent_type: agentType });
  }

  async recordAgentResponseTime(agentType: string, responseTime: number): Promise<void> {
    await this.recordMetric('ai_agent_response_time_ms', responseTime, { agent_type: agentType });
  }

  async recordAgentError(agentType: string): Promise<void> {
    await this.recordMetric('ai_agent_errors_total', 1, { agent_type: agentType });
  }

  async recordWorkflowExecution(workflowType: string, executionTime: number): Promise<void> {
    await this.recordMetric('workflow_execution_time_seconds', executionTime, { workflow_type: workflowType });
  }

  async recordWorkflowSuccess(workflowType: string, success: boolean): Promise<void> {
    // Record as 1 for success, 0 for failure to calculate success rate
    await this.recordMetric('workflow_success_rate', success ? 1 : 0, { workflow_type: workflowType });
  }

  async recordWorkflowCompletion(workflowId: string, percentage: number): Promise<void> {
    await this.recordMetric('workflow_completion_percentage', percentage, { workflow_id: workflowId });
  }

  async recordWorkflowTimeRemaining(workflowId: string, seconds: number): Promise<void> {
    await this.recordMetric('workflow_time_remaining_seconds', seconds, { workflow_id: workflowId });
  }

  async getWorkflowCompletion(workflowId: string, timeRange: { start: number; end: number }): Promise<MetricData[]> {
    return this.getMetrics('workflow_completion_percentage', { workflow_id: workflowId }, timeRange);
  }

  async getWorkflowTimeRemaining(workflowId: string, timeRange: { start: number; end: number }): Promise<MetricData[]> {
    return this.getMetrics('workflow_time_remaining_seconds', { workflow_id: workflowId }, timeRange);
  }

  updateBlockchainMetrics(metrics: BlockchainMetrics) {
    this.gasPrice.set(metrics.gasPrice);
    this.blockTime.set({ network: metrics.network }, metrics.blockTime);
    this.peerCount.set({ network: metrics.network }, metrics.peerCount);
    
    if (metrics.transactionStatus) {
      this.transactionCount.inc({
        network: metrics.network,
        status: metrics.transactionStatus
      });
    }
  }

  updateAgentMetrics(metrics: AgentMetrics) {
    this.agentExecutionTime.observe(
      { agent_id: metrics.agentId, capability: metrics.capability },
      metrics.executionTime
    );
    
    if (metrics.error) {
      this.agentErrors.inc({
        agent_id: metrics.agentId,
        error_type: metrics.error.type
      });
    }
    
    if (metrics.confidenceScore) {
      this.agentConfidenceScore.set(
        { agent_id: metrics.agentId, capability: metrics.capability },
        metrics.confidenceScore
      );
    }
  }

  startWorkflowExecution(workflowId: string) {
    this.activeWorkflows.inc();
    return Date.now();
  }

  endWorkflowExecution(workflowId: string, startTime: number, error?: Error) {
    const duration = (Date.now() - startTime) / 1000;
    this.workflowExecutionTime.observe({ workflow_id: workflowId }, duration);
    this.activeWorkflows.dec();
    
    if (error) {
      this.workflowErrors.inc({
        workflow_id: workflowId,
        error_type: error.name
      });
    }
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}