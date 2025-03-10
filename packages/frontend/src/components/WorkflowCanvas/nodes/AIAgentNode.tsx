import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import NetworkStatusIndicator from '../../../components/animations/NetworkStatusIndicator';
import AnimatedProgressBar from '../../../components/animations/AnimatedProgressBar';
import AnimatedCounter from '../../../components/animations/AnimatedCounter';
import DataFlowAnimation from '../../../components/animations/DataFlowAnimation';
import AnimatedCard from '../../../components/animations/AnimatedCard';

interface AgentCapability {
  metadata: {
    name: string;
  };
  enabled: boolean;
}

interface AgentResult {
  success: boolean;
  confidence: number;
  explanation?: string;
}

interface AIAgentNodeData {
  id: string;
  label: string;
  description: string;
  capabilities: AgentCapability[];
  status?: 'idle' | 'running' | 'completed' | 'error';
  result?: AgentResult;
}

const AIAgentNode = ({ data, isConnectable }: NodeProps<AIAgentNodeData>) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Map agent status to NetworkStatusIndicator status
  const getNodeStatus = (status?: string): 'healthy' | 'degraded' | 'unhealthy' => {
    switch (status) {
      case 'completed': return 'healthy';
      case 'running': return 'degraded';
      case 'error': return 'unhealthy';
      default: return 'degraded';
    }
  };

  return (
    <AnimatedCard
      hoverEffect="lift"
      clickEffect="press"
      className="relative group"
      borderColor={data.status === 'error' ? 'rgba(220, 38, 38, 0.5)' : 'rgba(139, 92, 246, 0.5)'}
      glowColor={data.status === 'error' ? 'rgba(220, 38, 38, 0.3)' : 'rgba(139, 92, 246, 0.3)'}
    >
      <div className={`px-4 py-3 rounded-md ${
        data.status === 'error' ? 'bg-red-900 border-red-700' :
        'bg-gradient-to-r from-purple-800 to-purple-900 border-purple-700'
      } text-white min-w-[220px]`}>
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          className="w-2 h-2 bg-purple-400"
        />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className="mr-2">
              <svg className="w-5 h-5 text-purple-300" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 3c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m-1 20v-6h2v6h-2m8-11c0-3.87-3.13-7-7-7s-7 3.13-7 7c0 3.47 2.52 6.33 5.83 6.89v-2.04c-2.25-.51-3.93-2.53-3.93-4.85 0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.32-1.68 4.34-3.93 4.85v2.04C18.48 18.33 21 15.47 21 12z" />
              </svg>
            </div>
            <div>
              <div className="font-bold flex items-center">
                <span>{data.label}</span>
                <div className="ml-2">
                  <NetworkStatusIndicator 
                    status={getNodeStatus(data.status)} 
                    size="sm" 
                    showLabel={false}
                  />
                </div>
              </div>
              <div className="text-xs text-purple-200">{data.description}</div>
            </div>
          </div>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-purple-700 rounded"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              {isExpanded ? (
                <path d="M11.47 7.72a.75.75 0 011.06 0l7.5 7.5a.75.75 0 11-1.06 1.06L12 9.31l-6.97 6.97a.75.75 0 01-1.06-1.06l7.5-7.5z" />
              ) : (
                <path d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z" />
              )}
            </svg>
          </button>
        </div>

        {isExpanded && (
          <>
            <div className="mt-3 space-y-2">
              <div className="text-xs text-purple-300">Capabilities:</div>
              <div className="flex flex-wrap gap-1">
                {data.capabilities.map((capability, index) => (
                  <div 
                    key={index}
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      capability.enabled ? 'bg-purple-700' : 'bg-gray-700'
                    }`}
                  >
                    {capability.metadata.name}
                  </div>
                ))}
              </div>
            </div>

            {data.result && (
              <div className="mt-3 space-y-2">
                <div className="text-xs text-purple-300">Last Result:</div>
                <div className="text-xs bg-purple-950 p-2 rounded">
                  <div className="flex justify-between">
                    <span>Success:</span>
                    <span>{data.result.success ? '✓' : '✗'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Confidence:</span>
                    <AnimatedProgressBar 
                      value={data.result.confidence * 100} 
                      maxValue={100}
                      height={4}
                      color="secondary"
                      showValue={true}
                      valueFormat="percentage"
                    />
                  </div>
                  {data.result.explanation && (
                    <div className="mt-1 text-purple-300">
                      {data.result.explanation}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* AI Processing Visualization */}
            <div className="mt-3 h-16 w-full">
              <DataFlowAnimation 
                width={200}
                height={60}
                color="#c4b5fd" 
                speed={data.status === 'running' ? 'fast' : 'slow'}
                density="high"
                direction="right-to-left"
              />
            </div>
          </>
        )}

        <Handle
          type="source"
          position={Position.Right}
          id="out"
          isConnectable={isConnectable}
          className="w-2 h-2 bg-purple-400"
        />
      </div>
      
      {/* Hover tooltip */}
      <div className="absolute hidden group-hover:block bottom-full left-0 mb-2 bg-gray-900 text-xs text-white p-2 rounded shadow-lg z-10">
        <div>ID: {data.id}</div>
        <div>Status: {data.status || 'idle'}</div>
        {data.result?.confidence && (
          <div>Confidence: {Math.round(data.result.confidence * 100)}%</div>
        )}
      </div>
    </AnimatedCard>
  );
};

export default memo(AIAgentNode);
