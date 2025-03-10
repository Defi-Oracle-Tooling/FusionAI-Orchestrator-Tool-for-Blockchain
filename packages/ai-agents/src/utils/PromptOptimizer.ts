/**
 * Prompt optimizer for AI agents
 * 
 * This utility provides prompt optimization capabilities for AI agents,
 * improving response quality and reducing token usage.
 */

import winston from 'winston';

export interface PromptTemplate {
  id: string;
  template: string;
  description: string;
  parameters: string[];
  maxTokens: number;
  examples?: Array<{
    parameters: Record<string, string>;
    response: string;
  }>;
}

export interface OptimizationConfig {
  enableTokenCounting: boolean;
  enablePromptCompression: boolean;
  enableContextPruning: boolean;
  maxPromptTokens: number;
  compressionLevel: 'low' | 'medium' | 'high';
}

export class PromptOptimizer {
  private templates: Map<string, PromptTemplate> = new Map();
  private logger: winston.Logger;
  private config: OptimizationConfig;
  
  constructor(config?: Partial<OptimizationConfig>) {
    this.config = {
      enableTokenCounting: true,
      enablePromptCompression: true,
      enableContextPruning: true,
      maxPromptTokens: 4000,
      compressionLevel: 'medium',
      ...config
    };
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'prompt-optimizer' },
      transports: [
        new winston.transports.File({ filename: 'prompt-optimizer.log' })
      ]
    });
  }
  
  /**
   * Registers a prompt template
   * 
   * @param template Prompt template to register
   */
  registerTemplate(template: PromptTemplate): void {
    this.templates.set(template.id, template);
    this.logger.debug('Template registered', { templateId: template.id });
  }
  
  /**
   * Gets a registered prompt template
   * 
   * @param templateId Template ID
   * @returns Prompt template
   */
  getTemplate(templateId: string): PromptTemplate | undefined {
    return this.templates.get(templateId);
  }
  
  /**
   * Fills a prompt template with parameters
   * 
   * @param templateId Template ID
   * @param parameters Parameters to fill the template with
   * @returns Filled prompt
   */
  fillTemplate(templateId: string, parameters: Record<string, string>): string {
    const template = this.templates.get(templateId);
    
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    let prompt = template.template;
    
    // Replace parameters in template
    for (const [key, value] of Object.entries(parameters)) {
      const placeholder = `{{${key}}}`;
      prompt = prompt.replace(new RegExp(placeholder, 'g'), value);
    }
    
    return prompt;
  }
  
  /**
   * Optimizes a prompt
   * 
   * @param prompt Prompt to optimize
   * @param context Additional context
   * @returns Optimized prompt
   */
  optimizePrompt(prompt: string, context: Record<string, any> = {}): string {
    let optimizedPrompt = prompt;
    
    // Apply optimizations based on configuration
    if (this.config.enablePromptCompression) {
      optimizedPrompt = this.compressPrompt(optimizedPrompt);
    }
    
    if (this.config.enableContextPruning && context) {
      optimizedPrompt = this.pruneContext(optimizedPrompt, context);
    }
    
    if (this.config.enableTokenCounting) {
      optimizedPrompt = this.enforceTokenLimit(optimizedPrompt);
    }
    
    return optimizedPrompt;
  }
  
  /**
   * Compresses a prompt by removing unnecessary whitespace and redundant instructions
   * 
   * @param prompt Prompt to compress
   * @returns Compressed prompt
   */
  private compressPrompt(prompt: string): string {
    let compressed = prompt;
    
    // Basic compression: remove extra whitespace
    compressed = compressed.replace(/\s+/g, ' ').trim();
    
    // Advanced compression based on level
    if (this.config.compressionLevel === 'medium' || this.config.compressionLevel === 'high') {
      // Remove redundant phrases
      compressed = compressed.replace(/please /gi, '');
      compressed = compressed.replace(/I would like you to /gi, '');
      compressed = compressed.replace(/I want you to /gi, '');
    }
    
    if (this.config.compressionLevel === 'high') {
      // More aggressive compression
      compressed = compressed.replace(/\. /g, '. ');
      compressed = compressed.replace(/\, /g, ', ');
    }
    
    return compressed;
  }
  
  /**
   * Prunes context from a prompt to reduce token usage
   * 
   * @param prompt Prompt to prune
   * @param context Context to prune
   * @returns Pruned prompt
   */
  private pruneContext(prompt: string, context: Record<string, any>): string {
    // Implement context pruning logic
    // This is a simplified implementation
    
    let pruned = prompt;
    
    // Remove low-relevance context
    if (context.lowRelevance) {
      for (const item of context.lowRelevance) {
        pruned = pruned.replace(new RegExp(item, 'g'), '');
      }
    }
    
    return pruned;
  }
  
  /**
   * Enforces token limit on a prompt
   * 
   * @param prompt Prompt to enforce token limit on
   * @returns Prompt with token limit enforced
   */
  private enforceTokenLimit(prompt: string): string {
    // Simplified token counting (actual implementation would use a proper tokenizer)
    const estimatedTokens = Math.ceil(prompt.length / 4);
    
    if (estimatedTokens <= this.config.maxPromptTokens) {
      return prompt;
    }
    
    // Truncate prompt to fit within token limit
    // This is a simplified implementation
    const ratio = this.config.maxPromptTokens / estimatedTokens;
    const truncatedLength = Math.floor(prompt.length * ratio);
    
    return prompt.substring(0, truncatedLength) + 
      `\n[Note: Context truncated to fit within ${this.config.maxPromptTokens} tokens]`;
  }
  
  /**
   * Analyzes prompt effectiveness based on response
   * 
   * @param templateId Template ID
   * @param parameters Parameters used
   * @param response Response received
   * @param metadata Additional metadata
   */
  analyzeEffectiveness(
    templateId: string,
    parameters: Record<string, string>,
    response: string,
    metadata: Record<string, any> = {}
  ): void {
    // Implement effectiveness analysis logic
    // This would typically involve storing metrics about prompt performance
    
    this.logger.info('Prompt effectiveness analysis', {
      templateId,
      parameters: Object.keys(parameters),
      responseLength: response.length,
      metadata
    });
    
    // In a real implementation, this would store metrics for later analysis
  }
  
  /**
   * Gets all registered templates
   * 
   * @returns All registered templates
   */
  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }
}
