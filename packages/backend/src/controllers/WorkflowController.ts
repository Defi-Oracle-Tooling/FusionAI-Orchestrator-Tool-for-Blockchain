import { FastifyRequest, FastifyReply } from 'fastify';
import { AgentCoordinator } from '@fusion-ai/ai-agents';
import { WorkflowService } from '../services/WorkflowService';
import { logger } from '../services/LoggingService';

export class WorkflowController {
  private coordinator: AgentCoordinator;
  private workflowService: WorkflowService;

  constructor() {
    this.coordinator = new AgentCoordinator();
    this.workflowService = new WorkflowService();
  }

  async createWorkflow(request: FastifyRequest<{
    Body: {
      name: string;
      steps: Array<{
        agentId: string;
        capability: string;
        requirements: string[];
        timeout: number;
      }>;
    };
  }>, reply: FastifyReply) {
    try {
      const { name, steps } = request.body;
      logger.info('Creating new workflow', { name, stepsCount: steps.length });
      
      const workflowId = await this.coordinator.createWorkflow(name, steps);
      
      logger.info('Workflow created successfully', { workflowId });
      return reply.status(201).send({
        success: true,
        workflowId,
        message: 'Workflow created successfully'
      });
    } catch (error) {
      logger.error('Failed to create workflow', error as Error, { name: request.body.name });
      return reply.status(500).send({
        success: false,
        error: (error as Error).message
      });
    }
  }

  async listWorkflows(request: FastifyRequest, reply: FastifyReply) {
    try {
      logger.info('Fetching all workflows');
      const workflows = await this.workflowService.listWorkflows();
      
      return reply.send({
        success: true,
        workflows
      });
    } catch (error) {
      logger.error('Failed to list workflows', error as Error);
      return reply.status(500).send({
        success: false,
        error: (error as Error).message
      });
    }
  }

  async executeWorkflow(request: FastifyRequest<{
    Params: { workflowId: string };
    Body: { context: Record<string, any> };
  }>, reply: FastifyReply) {
    try {
      const { workflowId } = request.params;
      const { context } = request.body;

      logger.info('Executing workflow', { workflowId, context });
      const results = await this.coordinator.executeWorkflow(workflowId, context);
      
      logger.info('Workflow executed successfully', { workflowId });
      return reply.send({
        success: true,
        results: Array.from(results.entries())
      });
    } catch (error) {
      logger.error('Failed to execute workflow', error as Error, { workflowId: request.params.workflowId });
      return reply.status(500).send({
        success: false,
        error: (error as Error).message
      });
    }
  }

  async getWorkflowStatus(request: FastifyRequest<{
    Params: { workflowId: string };
  }>, reply: FastifyReply) {
    try {
      const { workflowId } = request.params;
      logger.debug('Fetching workflow status', { workflowId });
      
      const status = await this.coordinator.getWorkflowStatus(workflowId);
      
      return reply.send({
        success: true,
        ...status
      });
    } catch (error) {
      logger.error('Failed to get workflow status', error as Error, { workflowId: request.params.workflowId });
      return reply.status(500).send({
        success: false,
        error: (error as Error).message
      });
    }
  }

  async stopWorkflow(request: FastifyRequest<{
    Params: { workflowId: string };
  }>, reply: FastifyReply) {
    try {
      const { workflowId } = request.params;
      logger.info('Stopping workflow', { workflowId });
      
      await this.coordinator.stopWorkflow(workflowId);
      
      logger.info('Workflow stopped successfully', { workflowId });
      return reply.send({
        success: true,
        message: 'Workflow stopped successfully'
      });
    } catch (error) {
      logger.error('Failed to stop workflow', error as Error, { workflowId: request.params.workflowId });
      return reply.status(500).send({
        success: false,
        error: (error as Error).message
      });
    }
  }

  async deleteWorkflow(request: FastifyRequest<{
    Params: { workflowId: string };
  }>, reply: FastifyReply) {
    try {
      const { workflowId } = request.params;
      logger.info('Deleting workflow', { workflowId });
      
      await this.workflowService.deleteWorkflow(workflowId);
      
      logger.info('Workflow deleted successfully', { workflowId });
      return reply.send({
        success: true,
        message: 'Workflow deleted successfully'
      });
    } catch (error) {
      logger.error('Failed to delete workflow', error as Error, { workflowId: request.params.workflowId });
      return reply.status(500).send({
        success: false,
        error: (error as Error).message
      });
    }
  }
}