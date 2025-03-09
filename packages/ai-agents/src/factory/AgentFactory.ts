import { Agent } from '../types/Agent';
import { AgentConfig } from '../types/Config';
import { ComplianceAgent } from '../agents/ComplianceAgent';
import { EventEmitter } from 'events';

export class AgentFactory extends EventEmitter {
  private static instance: AgentFactory;
  private agents: Map<string, Agent>;

  private constructor() {
    super();
    this.agents = new Map();
  }

  static getInstance(): AgentFactory {
    if (!AgentFactory.instance) {
      AgentFactory.instance = new AgentFactory();
    }
    return AgentFactory.instance;
  }

  async createAgent(type: string, config: AgentConfig): Promise<Agent> {
    let agent: Agent;

    switch (type.toLowerCase()) {
      case 'compliance':
        agent = new ComplianceAgent(config);
        break;
      // Add other agent types here as they are implemented
      default:
        throw new Error(`Unknown agent type: ${type}`);
    }

    await agent.initialize();
    this.agents.set(agent.id, agent);
    this.emit('agentCreated', agent);
    return agent;
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  async removeAgent(id: string): Promise<boolean> {
    const agent = this.agents.get(id);
    if (agent) {
      this.agents.delete(id);
      this.emit('agentRemoved', agent);
      return true;
    }
    return false;
  }

  getAgentsByCapability(capability: string): Agent[] {
    return this.getAllAgents().filter(agent => 
      agent.capabilities.some(cap => cap.type === capability && cap.enabled)
    );
  }
}