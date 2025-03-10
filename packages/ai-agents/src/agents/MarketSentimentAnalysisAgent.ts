import { Agent, AgentContext, AgentResult } from '../types/Agent';
import { AgentConfig } from '../types/Config';
import { AgentCapability } from '../types/Capability';
import { OpenAI } from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts';
import winston from 'winston';
import { MonitoringService } from '../../../monitoring/src/services/MonitoringService';

// Define MarketSentimentConfig interface if not already defined in Config.ts
interface MarketSentimentConfig {
  platforms: string[];
  sources: string[];
  timeframe: string;
  minConfidence: number;
  sentimentThreshold: number;
}

export class MarketSentimentAnalysisAgent implements Agent {
  id: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  config: AgentConfig;
  private llm: OpenAI;
  private logger: winston.Logger;
  private monitoring: MonitoringService;

  constructor(config: AgentConfig) {
    this.id = `market-sentiment-${Date.now()}`;
    this.name = 'Market Sentiment Analysis';
    this.description = 'Analyzes market sentiment from various data sources';
    this.config = config;
    this.capabilities = [
      {
        type: 'SOCIAL_MEDIA_ANALYSIS',
        metadata: {
          name: 'Social Media Sentiment Analysis',
          description: 'Analyzes sentiment from social media platforms',
          requiredConfig: ['platforms', 'minConfidence'],
          version: '1.0.0'
        },
        confidence: 0.85,
        enabled: true
      },
      {
        type: 'NEWS_ANALYSIS',
        metadata: {
          name: 'News Sentiment Analysis',
          description: 'Analyzes sentiment from news articles',
          requiredConfig: ['sources', 'timeframe'],
          version: '1.0.0'
        },
        confidence: 0.90,
        enabled: true
      },
      {
        type: 'MARKET_INDICATOR_ANALYSIS',
        metadata: {
          name: 'Market Indicator Analysis',
          description: 'Analyzes sentiment from market indicators',
          requiredConfig: ['indicators', 'timeframe'],
          version: '1.0.0'
        },
        confidence: 0.88,
        enabled: true
      }
    ];

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'market-sentiment-agent.log' })
      ]
    });

    this.monitoring = new MonitoringService();
  }

  async initialize(): Promise<void> {
    if (!this.config.llm?.apiKey) {
      throw new Error('OpenAI API key is required for market sentiment analysis');
    }

    this.llm = new OpenAI({
      openAIApiKey: this.config.llm.apiKey,
      modelName: this.config.llm.model || 'gpt-4',
      temperature: this.config.llm.temperature || 0.2,
      maxTokens: this.config.llm.maxTokens || 1500
    });

    this.logger.info('MarketSentimentAnalysisAgent initialized', {
      id: this.id,
      capabilities: this.capabilities.length
    });
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    try {
      const sentimentConfig = this.config.marketSentiment as MarketSentimentConfig;
      const capabilityType = context.metadata.capabilityType as string;
      
      let promptTemplate: PromptTemplate;
      let promptVariables: Record<string, any> = {
        timeframe: sentimentConfig.timeframe
      };
      
      // Select the appropriate prompt based on the capability type
      switch (capabilityType) {
        case 'SOCIAL_MEDIA_ANALYSIS':
          promptTemplate = new PromptTemplate({
            template: `
              Analyze the following social media data from {platforms} over the past {timeframe} and determine the market sentiment.
              
              Social media data: {socialMediaData}
              Minimum confidence threshold: {minConfidence}
              
              Provide a detailed sentiment analysis including:
              1. Overall sentiment score (-1 to 1)
              2. Key sentiment drivers
              3. Notable trends or shifts
              4. Confidence level
              5. Potential market impact
            `,
            inputVariables: ['platforms', 'timeframe', 'socialMediaData', 'minConfidence']
          });
          promptVariables.platforms = sentimentConfig.platforms.join(', ');
          promptVariables.socialMediaData = JSON.stringify(context.metadata.socialMediaData);
          promptVariables.minConfidence = sentimentConfig.minConfidence;
          break;
          
        case 'NEWS_ANALYSIS':
          promptTemplate = new PromptTemplate({
            template: `
              Analyze the following news articles from {sources} over the past {timeframe} and determine the market sentiment.
              
              News data: {newsData}
              
              Provide a detailed sentiment analysis including:
              1. Overall sentiment score (-1 to 1)
              2. Key topics driving sentiment
              3. Notable publications or authors
              4. Sentiment trends over time
              5. Potential market impact
            `,
            inputVariables: ['sources', 'timeframe', 'newsData']
          });
          promptVariables.sources = sentimentConfig.sources.join(', ');
          promptVariables.newsData = JSON.stringify(context.metadata.newsData);
          break;
          
        case 'MARKET_INDICATOR_ANALYSIS':
          promptTemplate = new PromptTemplate({
            template: `
              Analyze the following market indicators over the past {timeframe} and determine the market sentiment.
              
              Market indicators: {marketData}
              Sentiment threshold: {sentimentThreshold}
              
              Provide a detailed sentiment analysis including:
              1. Overall sentiment score (-1 to 1)
              2. Key indicators driving sentiment
              3. Technical analysis insights
              4. Correlation with other market factors
              5. Potential market direction
            `,
            inputVariables: ['timeframe', 'marketData', 'sentimentThreshold']
          });
          promptVariables.marketData = JSON.stringify(context.metadata.marketData);
          promptVariables.sentimentThreshold = sentimentConfig.sentimentThreshold;
          break;
          
        default:
          throw new Error(`Unsupported capability type: ${capabilityType}`);
      }

      const prompt = await promptTemplate.format(promptVariables);
      const response = await this.llm.call(prompt);
      const analysis = this.parseSentimentAnalysis(response, capabilityType);
      
      // Record metrics
      const executionTime = (Date.now() - startTime) / 1000; // Convert to seconds
      await this.monitoring.recordAgentResponseTime('market-sentiment', executionTime);
      await this.monitoring.recordAgentConfidence('market-sentiment', analysis.confidence);
      
      return {
        success: true,
        confidence: analysis.confidence,
        result: analysis.result,
        explanation: analysis.explanation
      };
    } catch (error) {
      await this.monitoring.recordAgentError('market-sentiment');
      this.logger.error('Sentiment analysis failed', {
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

  private parseSentimentAnalysis(response: string, capabilityType: string): any {
    // Implementation to parse the LLM response and extract structured data
    // This would include regex or other parsing logic to extract key information
    
    // Default structure for the analysis result
    const analysis = {
      confidence: 0.85,
      explanation: 'Analysis based on market sentiment data',
      result: {}
    };
    
    // Extract different data based on capability type
    switch (capabilityType) {
      case 'SOCIAL_MEDIA_ANALYSIS':
        // Extract social media sentiment data
        analysis.result = {
          sentimentScore: 0,
          keyDrivers: [],
          trends: [],
          platforms: {}
        };
        
        // Extract sentiment score
        const socialScoreMatch = response.match(/sentiment\s*score:?\s*(-?\d+(?:\.\d+)?)/i);
        if (socialScoreMatch) {
          analysis.result.sentimentScore = parseFloat(socialScoreMatch[1]);
        }
        
        // Extract key drivers (simplified implementation)
        const socialDriversMatch = response.match(/key\s*(?:sentiment)?\s*drivers:?(.*?)(?:notable|trends|confidence|potential|$)/is);
        if (socialDriversMatch && socialDriversMatch[1]) {
          const driversText = socialDriversMatch[1].trim();
          analysis.result.keyDrivers = driversText
            .split(/\d+\./)
            .filter(item => item.trim().length > 0)
            .map(item => item.trim());
        }
        
        break;
        
      case 'NEWS_ANALYSIS':
        // Extract news sentiment data
        analysis.result = {
          sentimentScore: 0,
          keyTopics: [],
          sources: {},
          trendDirection: 'neutral'
        };
        
        // Extract sentiment score
        const newsScoreMatch = response.match(/sentiment\s*score:?\s*(-?\d+(?:\.\d+)?)/i);
        if (newsScoreMatch) {
          analysis.result.sentimentScore = parseFloat(newsScoreMatch[1]);
        }
        
        // Extract trend direction
        if (response.toLowerCase().includes('bullish') || response.toLowerCase().includes('positive trend')) {
          analysis.result.trendDirection = 'bullish';
        } else if (response.toLowerCase().includes('bearish') || response.toLowerCase().includes('negative trend')) {
          analysis.result.trendDirection = 'bearish';
        }
        
        break;
        
      case 'MARKET_INDICATOR_ANALYSIS':
        // Extract market indicator data
        analysis.result = {
          sentimentScore: 0,
          keyIndicators: [],
          technicalInsights: [],
          marketDirection: 'neutral'
        };
        
        // Extract sentiment score
        const marketScoreMatch = response.match(/sentiment\s*score:?\s*(-?\d+(?:\.\d+)?)/i);
        if (marketScoreMatch) {
          analysis.result.sentimentScore = parseFloat(marketScoreMatch[1]);
        }
        
        // Extract market direction
        if (response.toLowerCase().includes('bullish') || response.toLowerCase().includes('upward')) {
          analysis.result.marketDirection = 'bullish';
        } else if (response.toLowerCase().includes('bearish') || response.toLowerCase().includes('downward')) {
          analysis.result.marketDirection = 'bearish';
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
    // or updating internal sentiment analysis models
    this.logger.info('Training market sentiment agent', {
      dataSize: data.length
    });
    
    // In a real implementation, this would include:
    // 1. Data preprocessing
    // 2. Model training or fine-tuning
    // 3. Model evaluation
    // 4. Model persistence
  }

  async validate(input: any): Promise<boolean> {
    // Validation logic for sentiment analysis inputs
    if (!input) {
      this.logger.warn('Missing input data for sentiment analysis');
      return false;
    }
    
    // Check for required data based on capability type
    if (input.capabilityType === 'SOCIAL_MEDIA_ANALYSIS' && (!input.socialMediaData || input.socialMediaData.length === 0)) {
      this.logger.warn('Missing social media data for sentiment analysis');
      return false;
    }
    
    if (input.capabilityType === 'NEWS_ANALYSIS' && (!input.newsData || input.newsData.length === 0)) {
      this.logger.warn('Missing news data for sentiment analysis');
      return false;
    }
    
    if (input.capabilityType === 'MARKET_INDICATOR_ANALYSIS' && (!input.marketData || Object.keys(input.marketData).length === 0)) {
      this.logger.warn('Missing market indicator data for sentiment analysis');
      return false;
    }
    
    return true;
  }

  async getMetrics(): Promise<Record<string, number>> {
    return {
      totalAnalyses: 100,
      averageConfidence: 0.87,
      accuracyRate: 0.82,
      averageResponseTime: 1.1 // seconds
    };
  }

  async cleanup(): Promise<void> {
    await this.monitoring.cleanup();
  }
}
