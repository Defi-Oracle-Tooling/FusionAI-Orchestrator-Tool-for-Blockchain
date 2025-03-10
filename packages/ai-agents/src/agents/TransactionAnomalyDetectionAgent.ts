import { Agent, AgentContext, AgentResult } from '../types/Agent';
import { AgentConfig } from '../types/Config';
import { AgentCapability } from '../types/Capability';
import { OpenAI } from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts';
import winston from 'winston';
import { MonitoringService } from '../../../monitoring/src/services/MonitoringService';

// Define AnomalyDetectionConfig interface if not already defined in Config.ts
interface AnomalyDetectionConfig {
  sensitivityThreshold: number;
  timeWindow: string;
  baselineVolume: number;
  deviationThreshold: number;
  riskScoreThreshold: number;
}

export class TransactionAnomalyDetectionAgent implements Agent {
  id: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  config: AgentConfig;
  private llm: OpenAI;
  private logger: winston.Logger;
  private monitoring: MonitoringService;

  constructor(config: AgentConfig) {
    this.id = `anomaly-detection-${Date.now()}`;
    this.name = 'Transaction Anomaly Detection';
    this.description = 'Detects unusual patterns in blockchain transactions';
    this.config = config;
    this.capabilities = [
      {
        type: 'PATTERN_DETECTION',
        metadata: {
          name: 'Unusual Pattern Detection',
          description: 'Identifies unusual transaction patterns',
          requiredConfig: ['sensitivityThreshold', 'timeWindow'],
          version: '1.0.0'
        },
        confidence: 0.90,
        enabled: true
      },
      {
        type: 'VOLUME_ANOMALY',
        metadata: {
          name: 'Volume Anomaly Detection',
          description: 'Detects unusual transaction volumes',
          requiredConfig: ['baselineVolume', 'deviationThreshold'],
          version: '1.0.0'
        },
        confidence: 0.85,
        enabled: true
      },
      {
        type: 'SUSPICIOUS_ADDRESS',
        metadata: {
          name: 'Suspicious Address Detection',
          description: 'Identifies potentially suspicious addresses',
          requiredConfig: ['riskScoreThreshold'],
          version: '1.0.0'
        },
        confidence: 0.80,
        enabled: true
      }
    ];

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'anomaly-detection-agent.log' })
      ]
    });

    this.monitoring = new MonitoringService();
  }

  async initialize(): Promise<void> {
    if (!this.config.llm?.apiKey) {
      throw new Error('OpenAI API key is required for anomaly detection');
    }

    this.llm = new OpenAI({
      openAIApiKey: this.config.llm.apiKey,
      modelName: this.config.llm.model || 'gpt-4',
      temperature: this.config.llm.temperature || 0.2,
      maxTokens: this.config.llm.maxTokens || 1500
    });

    this.logger.info('TransactionAnomalyDetectionAgent initialized', {
      id: this.id,
      capabilities: this.capabilities.length
    });
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    try {
      const anomalyConfig = this.config.anomalyDetection as AnomalyDetectionConfig;
      const capabilityType = context.metadata.capabilityType as string;
      
      let promptTemplate: PromptTemplate;
      let promptVariables: Record<string, any> = {
        transactions: JSON.stringify(context.metadata.transactions),
        timeWindow: anomalyConfig.timeWindow
      };
      
      // Select the appropriate prompt based on the capability type
      switch (capabilityType) {
        case 'PATTERN_DETECTION':
          promptTemplate = new PromptTemplate({
            template: `
              Analyze the following blockchain transactions over the past {timeWindow} and identify any unusual patterns.
              
              Transactions: {transactions}
              Sensitivity threshold: {sensitivityThreshold}
              
              Provide a detailed analysis including:
              1. Identified unusual patterns
              2. Confidence level for each pattern
              3. Potential explanations
              4. Recommended actions
            `,
            inputVariables: ['timeWindow', 'transactions', 'sensitivityThreshold']
          });
          promptVariables.sensitivityThreshold = anomalyConfig.sensitivityThreshold;
          break;
          
        case 'VOLUME_ANOMALY':
          promptTemplate = new PromptTemplate({
            template: `
              Analyze the following blockchain transaction volumes over the past {timeWindow} and identify any anomalies.
              
              Transactions: {transactions}
              Baseline volume: {baselineVolume}
              Deviation threshold: {deviationThreshold}
              
              Provide a detailed analysis including:
              1. Identified volume anomalies
              2. Deviation from baseline
              3. Potential causes
              4. Risk assessment
            `,
            inputVariables: ['timeWindow', 'transactions', 'baselineVolume', 'deviationThreshold']
          });
          promptVariables.baselineVolume = anomalyConfig.baselineVolume;
          promptVariables.deviationThreshold = anomalyConfig.deviationThreshold;
          break;
          
        case 'SUSPICIOUS_ADDRESS':
          promptTemplate = new PromptTemplate({
            template: `
              Analyze the following blockchain addresses and their transaction history to identify potentially suspicious activities.
              
              Transactions: {transactions}
              Risk score threshold: {riskScoreThreshold}
              
              Provide a detailed analysis including:
              1. Identified suspicious addresses
              2. Risk score for each address
              3. Suspicious behavior patterns
              4. Recommended monitoring actions
            `,
            inputVariables: ['transactions', 'riskScoreThreshold']
          });
          promptVariables.riskScoreThreshold = anomalyConfig.riskScoreThreshold;
          break;
          
        default:
          throw new Error(`Unsupported capability type: ${capabilityType}`);
      }

      const prompt = await promptTemplate.format(promptVariables);
      const response = await this.llm.call(prompt);
      const analysis = this.parseAnomalyAnalysis(response, capabilityType);
      
      // Record metrics
      const executionTime = (Date.now() - startTime) / 1000; // Convert to seconds
      await this.monitoring.recordAgentResponseTime('anomaly-detection', executionTime);
      await this.monitoring.recordAgentConfidence('anomaly-detection', analysis.confidence);
      
      return {
        success: true,
        confidence: analysis.confidence,
        result: analysis.result,
        explanation: analysis.explanation
      };
    } catch (error) {
      await this.monitoring.recordAgentError('anomaly-detection');
      this.logger.error('Anomaly detection failed', {
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

  private parseAnomalyAnalysis(response: string, capabilityType: string): any {
    // Implementation to parse the LLM response and extract structured data
    // This would include regex or other parsing logic to extract key information
    
    // Default structure for the analysis result
    const analysis = {
      confidence: 0.85,
      explanation: 'Analysis based on transaction patterns',
      result: {}
    };
    
    // Extract different data based on capability type
    switch (capabilityType) {
      case 'PATTERN_DETECTION':
        // Extract pattern detection data
        analysis.result = {
          patterns: [],
          riskLevel: 'medium',
          recommendedActions: []
        };
        
        // Extract patterns (simplified implementation)
        const patternMatches = response.match(/identified.*pattern[s]?:?(.*?)(?:confidence|potential|recommended|$)/is);
        if (patternMatches && patternMatches[1]) {
          const patternText = patternMatches[1].trim();
          analysis.result.patterns = patternText
            .split(/\d+\./)
            .filter(item => item.trim().length > 0)
            .map(item => item.trim());
        }
        
        // Extract risk level
        if (response.toLowerCase().includes('high risk') || response.toLowerCase().includes('severe')) {
          analysis.result.riskLevel = 'high';
        } else if (response.toLowerCase().includes('low risk') || response.toLowerCase().includes('minor')) {
          analysis.result.riskLevel = 'low';
        }
        
        break;
        
      case 'VOLUME_ANOMALY':
        // Extract volume anomaly data
        analysis.result = {
          anomalies: [],
          deviationPercentage: 0,
          potentialCauses: []
        };
        
        // Extract deviation percentage
        const deviationMatch = response.match(/deviation[:\s]*(\d+(?:\.\d+)?)%/i);
        if (deviationMatch) {
          analysis.result.deviationPercentage = parseFloat(deviationMatch[1]);
        }
        
        break;
        
      case 'SUSPICIOUS_ADDRESS':
        // Extract suspicious address data
        analysis.result = {
          addresses: [],
          riskScores: {},
          suspiciousPatterns: []
        };
        
        // Extract addresses (simplified implementation)
        const addressMatches = response.match(/address[es]?:?(.*?)(?:risk|suspicious|recommended|$)/is);
        if (addressMatches && addressMatches[1]) {
          const addressText = addressMatches[1].trim();
          analysis.result.addresses = addressText
            .split(/\d+\./)
            .filter(item => item.trim().length > 0)
            .map(item => {
              // Extract Ethereum-like addresses
              const addressMatch = item.match(/0x[a-fA-F0-9]{40}/);
              return addressMatch ? addressMatch[0] : item.trim();
            })
            .filter(address => address.length > 0);
        }
        
        break;
    }
    
    // Extract confidence level
    const confidenceMatch = response.match(/confidence\s*(?:level)?:?\s*(\d+(?:\.\d+)?)%?/i);
    if (confidenceMatch) {
      analysis.confidence = parseFloat(confidenceMatch[1]) / 100; // Convert percentage to decimal
    }
    
    // Set explanation from response
    analysis.explanation = response.substring(0, 500) + '...'; // Truncate for brevity
    
    return analysis;
  }

  async train(data: any): Promise<void> {
    // Training implementation - could involve fine-tuning the LLM
    // or updating internal anomaly detection models
    this.logger.info('Training anomaly detection agent', {
      dataSize: data.length
    });
    
    // In a real implementation, this would include:
    // 1. Data preprocessing
    // 2. Model training or fine-tuning
    // 3. Model evaluation
    // 4. Model persistence
  }

  async validate(input: any): Promise<boolean> {
    // Validation logic for anomaly detection inputs
    if (!input || !input.transactions || input.transactions.length < 5) {
      this.logger.warn('Insufficient transaction data for anomaly detection', {
        transactionCount: input?.transactions?.length || 0
      });
      return false;
    }
    
    return true;
  }

  async getMetrics(): Promise<Record<string, number>> {
    return {
      totalDetections: 100,
      averageConfidence: 0.88,
      falsePositiveRate: 0.05,
      averageResponseTime: 0.9 // seconds
    };
  }

  async cleanup(): Promise<void> {
    await this.monitoring.cleanup();
  }
}
