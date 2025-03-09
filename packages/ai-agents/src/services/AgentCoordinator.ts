import { Agent, AgentContext, AgentResult } from '../types/Agent';
import { AgentFactory } from '../factory/AgentFactory';
import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import winston from 'winston';
import { MonitoringService } from '../../../monitoring/src/services/MonitoringService';

interface WorkflowStep {
  agentId: string;
  capability: string;
  requirements: string[];
  timeout: number;
}

interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  results: Map<string, AgentResult>;
}

export class AgentCoordinator extends EventEmitter {
  private factory: AgentFactory;
  private workflows: Map<string, Workflow>;
  private redis: Redis;
  private logger: winston.Logger;
  private monitoring: MonitoringService;

  constructor() {
    super();
    this.factory = AgentFactory.getInstance();
    this.workflows = new Map();
    
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    });

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'coordinator.log' })
      ]
    });

    this.monitoring = new MonitoringService();

    // Listen for agent lifecycle events
    this.factory.on('agentCreated', (agent: Agent) => {
      this.logger.info('New agent registered', { agentId: agent.id });
    });
  }

  async createWorkflow(name: string, steps: WorkflowStep[]): Promise<string> {
    const workflowId = `workflow-${Date.now()}`;
    const workflow: Workflow = {
      id: workflowId,
      name,
      steps,
      status: 'pending',
      results: new Map()
    };

    this.workflows.set(workflowId, workflow);
    await this.redis.set(`workflow:${workflowId}`, JSON.stringify(workflow));
    
    return workflowId;
  }

  async executeWorkflow(workflowId: string, context: Omit<AgentContext, 'workflowId'>): Promise<Map<string, AgentResult>> {
    const startTime = Date.now();
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    workflow.status = 'running';
    this.emit('workflowStarted', { workflowId, timestamp: Date.now() });

    try {
      for (const step of workflow.steps) {
        const stepStartTime = Date.now();
        const agent = this.factory.getAgent(step.agentId);
        if (!agent) {
          throw new Error(`Agent not found: ${step.agentId}`);
        }

        // Verify agent has required capability
        if (!agent.capabilities.some(cap => cap.type === step.capability && cap.enabled)) {
          throw new Error(`Agent ${step.agentId} missing required capability: ${step.capability}`);
        }

        // Execute agent with timeout and monitoring
        const result = await Promise.race([
          agent.execute({ ...context, workflowId }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Agent execution timeout')), step.timeout)
          )
        ]) as AgentResult;

        // Record step metrics
        const stepDuration = (Date.now() - stepStartTime) / 1000;
        await this.monitoring.recordWorkflowExecution(step.capability, stepDuration);
        await this.monitoring.recordWorkflowSuccess(step.capability, result.success);

        workflow.results.set(step.agentId, result);
        
        // If agent execution failed, stop workflow
        if (!result.success) {
          workflow.status = 'failed';
          this.emit('workflowFailed', { 
            workflowId, 
            error: result.error,
            step: step.agentId 
          });
          const totalDuration = (Date.now() - startTime) / 1000;
          await this.monitoring.recordWorkflowExecution(workflow.name, totalDuration);
          await this.monitoring.recordWorkflowSuccess(workflow.name, false);
          return workflow.results;
        }

        // Cache results in Redis
        await this.redis.hset(
          `workflow:${workflowId}:results`,
          step.agentId,
          JSON.stringify(result)
        );
      }

      workflow.status = 'completed';
      const totalDuration = (Date.now() - startTime) / 1000;
      await this.monitoring.recordWorkflowExecution(workflow.name, totalDuration);
      await this.monitoring.recordWorkflowSuccess(workflow.name, true);
      
      this.emit('workflowCompleted', { 
        workflowId, 
        timestamp: Date.now() 
      });

      return workflow.results;
    } catch (error) {
      workflow.status = 'failed';
      const totalDuration = (Date.now() - startTime) / 1000;
      await this.monitoring.recordWorkflowExecution(workflow.name, totalDuration);
      await this.monitoring.recordWorkflowSuccess(workflow.name, false);
      
      this.emit('workflowFailed', { 
        workflowId, 
        error: error as Error 
      });
      throw error;
    }
  }

  async getWorkflowStatus(workflowId: string): Promise<{
    status: string;
    progress: number;
    results: AgentResult[];
  }> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const progress = workflow.status === 'completed' 
      ? 100
      : workflow.status === 'pending'
      ? 0
      : (workflow.results.size / workflow.steps.length) * 100;

    return {
      status: workflow.status,
      progress,
      results: Array.from(workflow.results.values())
    };
  }

  async stopWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (workflow && workflow.status === 'running') {
      workflow.status = 'failed';
      this.emit('workflowStopped', { workflowId, timestamp: Date.now() });
    }
  }

  async cleanup(): Promise<void> {
    await this.redis.quit();
    await this.monitoring.cleanup();
    this.removeAllListeners();
  }
}