import { Redis } from 'ioredis';
import { AgentFactory, AgentCapability } from '@fusion-ai/ai-agents';

interface WorkflowDefinition {
  id: string;
  name: string;
  steps: WorkflowStep[];
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowStep {
  agentId: string;
  capability: string;
  requirements: string[];
  timeout: number;
}

export class WorkflowService {
  private redis: Redis;
  private agentFactory: AgentFactory;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    });
    this.agentFactory = AgentFactory.getInstance();
  }

  async getAvailableAgentCapabilities(): Promise<Record<string, AgentCapability[]>> {
    const agents = this.agentFactory.getAllAgents();
    return agents.reduce((acc, agent) => {
      acc[agent.id] = agent.capabilities;
      return acc;
    }, {} as Record<string, AgentCapability[]>);
  }

  async saveWorkflowDefinition(workflow: WorkflowDefinition): Promise<void> {
    const key = `workflow:definition:${workflow.id}`;
    await this.redis.set(key, JSON.stringify(workflow));
  }

  async getWorkflowDefinition(workflowId: string): Promise<WorkflowDefinition | null> {
    const key = `workflow:definition:${workflowId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async listWorkflows(page: number = 1, limit: number = 10): Promise<{
    workflows: WorkflowDefinition[];
    total: number;
    page: number;
    pages: number;
  }> {
    const pattern = 'workflow:definition:*';
    const keys = await this.redis.keys(pattern);
    const total = keys.length;
    const pages = Math.ceil(total / limit);
    
    const start = (page - 1) * limit;
    const end = start + limit;
    const pageKeys = keys.slice(start, end);
    
    const workflows = await Promise.all(
      pageKeys.map(async (key) => {
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
      })
    );

    return {
      workflows: workflows.filter(Boolean),
      total,
      page,
      pages
    };
  }

  async deleteWorkflow(workflowId: string): Promise<boolean> {
    const key = `workflow:definition:${workflowId}`;
    const deleted = await this.redis.del(key);
    return deleted > 0;
  }

  async validateWorkflowSteps(steps: WorkflowStep[]): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    
    for (const step of steps) {
      const agent = this.agentFactory.getAgent(step.agentId);
      if (!agent) {
        errors.push(`Agent not found: ${step.agentId}`);
        continue;
      }

      const hasCapability = agent.capabilities.some(
        cap => cap.type === step.capability && cap.enabled
      );
      
      if (!hasCapability) {
        errors.push(
          `Agent ${step.agentId} does not support capability: ${step.capability}`
        );
      }

      const capability = agent.capabilities.find(cap => cap.type === step.capability);
      if (capability) {
        const missingRequirements = capability.metadata.requiredConfig.filter(
          req => !step.requirements.includes(req)
        );
        
        if (missingRequirements.length > 0) {
          errors.push(
            `Missing requirements for ${step.capability}: ${missingRequirements.join(', ')}`
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async cleanup(): Promise<void> {
    await this.redis.quit();
  }
}