import { MonitoringService } from '@fusion-ai/monitoring';
import { AgentMetrics } from '../types/Metrics';
import { logger } from '@fusion-ai/backend/src/services/LoggingService';

export class AgentMonitoring {
  private monitoringService: MonitoringService;
  private agentId: string;
  private executionStartTime: number | null = null;

  constructor(agentId: string, monitoringService: MonitoringService) {
    this.agentId = agentId;
    this.monitoringService = monitoringService;
  }

  startExecution(capability: string): void {
    this.executionStartTime = Date.now();
    logger.debug('Agent execution started', {
      agentId: this.agentId,
      capability
    });
  }

  endExecution(capability: string, result: {
    success: boolean;
    error?: Error;
    confidenceScore?: number;
  }): void {
    if (!this.executionStartTime) {
      logger.warn('End execution called without start', {
        agentId: this.agentId,
        capability
      });
      return;
    }

    const executionTime = (Date.now() - this.executionStartTime) / 1000; // Convert to seconds
    
    const metrics: AgentMetrics = {
      agentId: this.agentId,
      capability,
      executionTime,
      error: result.error ? {
        type: result.error.name,
        message: result.error.message
      } : undefined,
      confidenceScore: result.confidenceScore
    };

    this.monitoringService.updateAgentMetrics(metrics);
    
    if (!result.success) {
      logger.error('Agent execution failed', result.error, {
        agentId: this.agentId,
        capability,
        executionTime
      });
    } else {
      logger.info('Agent execution completed', {
        agentId: this.agentId,
        capability,
        executionTime,
        confidenceScore: result.confidenceScore
      });
    }

    this.executionStartTime = null;
  }

  recordMemoryUsage(): void {
    const memoryUsage = process.memoryUsage();
    this.monitoringService.recordMetric('agent_memory_usage_mb', 
      memoryUsage.heapUsed / 1024 / 1024,
      { agentId: this.agentId }
    );
  }

  recordConfidenceScore(capability: string, score: number): void {
    this.monitoringService.recordMetric('agent_confidence_score',
      score,
      { agentId: this.agentId, capability }
    );
  }

  recordError(capability: string, error: Error): void {
    this.monitoringService.recordMetric('agent_errors_total',
      1,
      { 
        agentId: this.agentId, 
        capability,
        errorType: error.name
      }
    );
  }

  async getAgentHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      // Get recent metrics
      const timeRange = {
        start: Date.now() - 3600000, // Last hour
        end: Date.now()
      };

      const [errors, executions] = await Promise.all([
        this.monitoringService.getMetrics('agent_errors_total', 
          { agentId: this.agentId }, 
          timeRange
        ),
        this.monitoringService.getMetrics('ai_agent_execution_duration_seconds',
          { agentId: this.agentId },
          timeRange
        )
      ]);

      const health = {
        errorCount: errors.length,
        averageExecutionTime: this.calculateAverage(executions.map(e => e.value)),
        totalExecutions: executions.length,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 // MB
      };

      // Determine health status
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (health.errorCount > 5 || health.averageExecutionTime > 30) {
        status = 'degraded';
      }
      if (health.errorCount > 10 || health.averageExecutionTime > 60) {
        status = 'unhealthy';
      }

      return { status, details: health };
    } catch (error) {
      logger.error('Error getting agent health', error as Error, {
        agentId: this.agentId
            labels
          );
        }
      }
    } catch (error) {
      console.error('Failed to record training metrics:', error);
      await this.monitoring.recordMetric(
        'monitoring_error_count',
        1,
        {
          ...labels,
          error_type: (error as Error).name,
          error_message: (error as Error).message
        }
      );
    }
  }

  async recordAgentResourceUsage(
    agent: Agent,
    metrics: {
      cpuUsage?: number;
      memoryUsage?: number;
      apiCalls?: number;
    }
  ): Promise<void> {
    const labels = {
      [LabelNames.AGENT_ID]: agent.id,
      [LabelNames.AGENT_TYPE]: agent.name
    };

    try {
      if (metrics.cpuUsage !== undefined) {
        await this.monitoring.recordMetric(
          MetricNames.CPU_USAGE,
          metrics.cpuUsage,
          labels
        );
      }

      if (metrics.memoryUsage !== undefined) {
        await this.monitoring.recordMetric(
          MetricNames.MEMORY_USAGE,
          metrics.memoryUsage,
          labels
        );
      }

      if (metrics.apiCalls !== undefined) {
        await this.monitoring.recordMetric(
          'agent_api_calls',
          metrics.apiCalls,
          labels
        );
      }
    } catch (error) {
      console.error('Failed to record resource usage metrics:', error);
      await this.monitoring.recordMetric(
        'monitoring_error_count',
        1,
        {
          ...labels,
          error_type: (error as Error).name,
          error_message: (error as Error).message
        }
      );
    }
  }
}