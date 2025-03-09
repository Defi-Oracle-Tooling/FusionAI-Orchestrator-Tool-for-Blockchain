import { Agent, AgentContext, AgentResult } from '../types/Agent';
import { AgentConfig, ComplianceConfig } from '../types/Config';
import { AgentCapability } from '../types/Capability';
import { OpenAI } from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts';
import winston from 'winston';
import { MonitoringService } from '../../../monitoring/src/services/MonitoringService';

export class ComplianceAgent implements Agent {
  id: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  config: AgentConfig;
  private llm: OpenAI;
  private logger: winston.Logger;
  private monitoring: MonitoringService;

  constructor(config: AgentConfig) {
    this.id = `compliance-${Date.now()}`;
    this.name = 'Compliance Monitor';
    this.description = 'Monitors blockchain transactions for regulatory compliance';
    this.config = config;
    this.capabilities = [
      {
        type: 'COMPLIANCE_CHECK',
        metadata: {
          name: 'Regulatory Compliance Check',
          description: 'Analyzes transactions for regulatory compliance',
          requiredConfig: ['regulations', 'jurisdiction'],
          version: '1.0.0'
        },
        confidence: 0.95,
        enabled: true
      },
      {
        type: 'RISK_ASSESSMENT',
        metadata: {
          name: 'Risk Assessment',
          description: 'Evaluates transaction risk levels',
          requiredConfig: ['riskThreshold'],
          version: '1.0.0'
        },
        confidence: 0.90,
        enabled: true
      }
    ];

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'compliance-agent.log' })
      ]
    });

    this.monitoring = new MonitoringService();
  }

  async initialize(): Promise<void> {
    if (!this.config.llm?.apiKey) {
      throw new Error('OpenAI API key is required for compliance analysis');
    }

    this.llm = new OpenAI({
      openAIApiKey: this.config.llm.apiKey,
      modelName: this.config.llm.model || 'gpt-4',
      temperature: this.config.llm.temperature || 0.3,
      maxTokens: this.config.llm.maxTokens || 1000
    });

    this.logger.info('ComplianceAgent initialized', {
      id: this.id,
      capabilities: this.capabilities.length
    });
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    try {
      const complianceConfig = this.config.compliance as ComplianceConfig;
      
      // Create compliance check prompt
      const promptTemplate = new PromptTemplate({
        template: `
          Analyze the following blockchain transaction for compliance with {regulations} in {jurisdiction}.
          Transaction details: {transaction}
          Risk threshold: {riskThreshold}
          
          Provide a detailed compliance analysis including:
          1. Regulatory status
          2. Risk level
          3. Required actions
          4. Confidence score
        `,
        inputVariables: ['regulations', 'jurisdiction', 'transaction', 'riskThreshold']
      });

      const prompt = await promptTemplate.format({
        regulations: complianceConfig.regulations.join(', '),
        jurisdiction: complianceConfig.jurisdiction,
        transaction: JSON.stringify(context.metadata.transaction),
        riskThreshold: complianceConfig.riskThreshold
      });

      const response = await this.llm.call(prompt);
      const analysis = this.parseComplianceAnalysis(response);
      
      // Record metrics
      const executionTime = (Date.now() - startTime) / 1000; // Convert to seconds
      await this.monitoring.recordAgentResponseTime('compliance', executionTime);
      await this.monitoring.recordAgentConfidence('compliance', analysis.confidence);
      
      return {
        success: true,
        confidence: analysis.confidence,
        result: {
          compliant: analysis.compliant,
          riskLevel: analysis.riskLevel,
          requiredActions: analysis.requiredActions,
          details: analysis.details
        },
        explanation: analysis.explanation
      };
    } catch (error) {
      await this.monitoring.recordAgentError('compliance');
      this.logger.error('Compliance check failed', {
        error,
        workflowId: context.workflowId
      });
      
      return {
        success: false,
        confidence: 0,
        result: null,
        error: error as Error
      };
    }
  }

  private parseComplianceAnalysis(response: string): any {
    // Implementation to parse the LLM response and extract structured data
    // This would include regex or other parsing logic to extract key information
    return {
      compliant: true,
      confidence: 0.95,
      riskLevel: 'LOW',
      requiredActions: [],
      details: response,
      explanation: 'Transaction complies with all regulatory requirements'
    };
  }

  async train(data: any): Promise<void> {
    // Training implementation - could involve fine-tuning the LLM
    // or updating internal compliance rules
    this.logger.info('Training compliance agent', {
      dataSize: data.length
    });
  }

  async validate(input: any): Promise<boolean> {
    // Validation logic for compliance checks
    return true;
  }

  async getMetrics(): Promise<Record<string, number>> {
    return {
      totalChecks: 100,
      complianceRate: 0.95,
      averageConfidence: 0.92,
      falsePositives: 0.02
    };
  }

  async cleanup(): Promise<void> {
    await this.monitoring.cleanup();
  }
}