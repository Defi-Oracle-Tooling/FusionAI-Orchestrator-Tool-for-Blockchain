import { PredictiveAnalyticsAgent } from '../agents/PredictiveAnalyticsAgent';
import { AgentContext } from '../types/Agent';
import { AgentConfig } from '../types/Config';
import { jest } from '@jest/globals';

// Mock OpenAI
jest.mock('langchain/llms/openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => {
      return {
        call: jest.fn().mockResolvedValue(`
          Price Prediction Analysis:
          
          Based on the historical data and current market conditions, here's my price prediction:
          
          1. Short-term (24h) price prediction: $2,150 with confidence level: 85%
          2. Medium-term (7d) price prediction: $2,300 with confidence level: 75%
          3. Long-term (30d) price prediction: $2,600 with confidence level: 65%
          
          Key factors influencing this prediction:
          - Recent uptrend in trading volume
          - Positive market sentiment
          - Technical indicators showing bullish patterns
          - Upcoming protocol upgrade
          
          Risk assessment: Medium
          
          Recommendation: Consider accumulating at current levels with proper risk management.
        `)
      };
    })
  };
});

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      quit: jest.fn().mockResolvedValue('OK')
    };
  });
});

// Mock Winston logger
jest.mock('winston', () => {
  return {
    createLogger: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    }),
    format: {
      json: jest.fn()
    },
    transports: {
      File: jest.fn()
    }
  };
});

// Mock MonitoringService
jest.mock('../../../monitoring/src/services/MonitoringService', () => {
  return {
    MonitoringService: jest.fn().mockImplementation(() => {
      return {
        recordAgentResponseTime: jest.fn().mockResolvedValue(undefined),
        recordAgentConfidence: jest.fn().mockResolvedValue(undefined),
        recordAgentError: jest.fn().mockResolvedValue(undefined),
        cleanup: jest.fn().mockResolvedValue(undefined)
      };
    })
  };
});

describe('PredictiveAnalyticsAgent', () => {
  let agent: PredictiveAnalyticsAgent;
  let mockConfig: AgentConfig;
  
  beforeEach(() => {
    mockConfig = {
      type: 'predictive-analytics',
      enabled: true,
      timeout: 30000,
      retryAttempts: 3,
      llm: {
        apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
        model: 'gpt-4',
        temperature: 0.2,
        maxTokens: 1500,
        topP: 1,
        enabled: true,
        timeout: 30000,
        retryAttempts: 3
      },
      predictiveAnalytics: {
        timeframe: '7d',
        confidenceThreshold: 0.7,
        dataPoints: 100,
        historicalDataWindow: '90d',
        modelType: 'regression',
        enabled: true,
        timeout: 30000,
        retryAttempts: 3
      }
    };
    
    agent = new PredictiveAnalyticsAgent(mockConfig);
  });
  
  test('should initialize correctly', async () => {
    await agent.initialize();
    expect(agent.id).toBeDefined();
    expect(agent.name).toBe('Predictive Analytics');
    expect(agent.capabilities.length).toBeGreaterThan(0);
  });
  
  test('should execute price prediction capability', async () => {
    await agent.initialize();
    
    const context: AgentContext = {
      workflowId: 'test-workflow',
      metadata: {
        capabilityType: 'PRICE_PREDICTION',
        asset: 'ETH',
        timeframe: '7d',
        historicalData: [
          { timestamp: Date.now() - 86400000 * 7, price: 2000 },
          { timestamp: Date.now() - 86400000 * 6, price: 2050 },
          { timestamp: Date.now() - 86400000 * 5, price: 2100 },
          { timestamp: Date.now() - 86400000 * 4, price: 2080 },
          { timestamp: Date.now() - 86400000 * 3, price: 2120 },
          { timestamp: Date.now() - 86400000 * 2, price: 2150 },
          { timestamp: Date.now() - 86400000, price: 2130 }
        ]
      }
    };
    
    const result = await agent.execute(context);
    
    expect(result.success).toBe(true);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.result).toBeDefined();
    expect(result.error).toBeUndefined();
  });
  
  test('should execute volume prediction capability', async () => {
    await agent.initialize();
    
    const context: AgentContext = {
      workflowId: 'test-workflow',
      metadata: {
        capabilityType: 'VOLUME_PREDICTION',
        asset: 'ETH',
        timeframe: '7d',
        historicalData: [
          { timestamp: Date.now() - 86400000 * 7, volume: 10000 },
          { timestamp: Date.now() - 86400000 * 6, volume: 12000 },
          { timestamp: Date.now() - 86400000 * 5, volume: 11000 },
          { timestamp: Date.now() - 86400000 * 4, volume: 13000 },
          { timestamp: Date.now() - 86400000 * 3, volume: 14000 },
          { timestamp: Date.now() - 86400000 * 2, volume: 12500 },
          { timestamp: Date.now() - 86400000, volume: 13500 }
        ]
      }
    };
    
    const result = await agent.execute(context);
    
    expect(result.success).toBe(true);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.result).toBeDefined();
    expect(result.error).toBeUndefined();
  });
  
  test('should execute trend analysis capability', async () => {
    await agent.initialize();
    
    const context: AgentContext = {
      workflowId: 'test-workflow',
      metadata: {
        capabilityType: 'TREND_ANALYSIS',
        asset: 'ETH',
        timeframe: '30d',
        historicalData: [
          { timestamp: Date.now() - 86400000 * 30, price: 1800 },
          { timestamp: Date.now() - 86400000 * 25, price: 1850 },
          { timestamp: Date.now() - 86400000 * 20, price: 1900 },
          { timestamp: Date.now() - 86400000 * 15, price: 1950 },
          { timestamp: Date.now() - 86400000 * 10, price: 2000 },
          { timestamp: Date.now() - 86400000 * 5, price: 2100 },
          { timestamp: Date.now(), price: 2130 }
        ]
      }
    };
    
    const result = await agent.execute(context);
    
    expect(result.success).toBe(true);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.result).toBeDefined();
    expect(result.error).toBeUndefined();
  });
  
  test('should handle errors gracefully', async () => {
    await agent.initialize();
    
    // Create an invalid context to trigger an error
    const context: AgentContext = {
      workflowId: 'test-workflow',
      metadata: {
        capabilityType: 'INVALID_CAPABILITY',
        asset: 'ETH'
      }
    };
    
    const result = await agent.execute(context);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
  
  test('should validate input correctly', async () => {
    await agent.initialize();
    
    const validInput = {
      asset: 'ETH',
      timeframe: '7d',
      historicalData: [
        { timestamp: Date.now() - 86400000, price: 2130 }
      ]
    };
    
    const invalidInput = {
      asset: 'ETH'
      // Missing required fields
    };
    
    const validResult = await agent.validate(validInput);
    const invalidResult = await agent.validate(invalidInput);
    
    expect(validResult).toBe(true);
    expect(invalidResult).toBe(false);
  });
  
  test('should return metrics', async () => {
    await agent.initialize();
    
    const metrics = await agent.getMetrics();
    
    expect(metrics).toBeDefined();
    expect(typeof metrics.totalPredictions).toBe('number');
    expect(typeof metrics.averageConfidence).toBe('number');
  });
  
  test('should clean up resources', async () => {
    await agent.initialize();
    await agent.cleanup();
    // No assertions needed, just checking it doesn't throw
  });
});
