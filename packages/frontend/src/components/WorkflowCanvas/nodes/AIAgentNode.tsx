import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { AgentCapability, AgentResult } from '@fusion-ai/ai-agents';

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

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'running': return 'bg-yellow-400';
      case 'completed': return 'bg-green-400';
      case 'error': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="relative group">
      <div className={`px-4 py-3 shadow-md rounded-md border ${
        data.status === 'error' ? 'bg-red-900 border-red-700' :
        'bg-gradient-to-r from-purple-800 to-purple-900 border-purple-700'
      } text-white min-w-[200px]`}>
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          className="w-2 h-2 bg-purple-400"
        />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className="mr-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(data.status)}`} />
            </div>
            <div>
              <div className="font-bold">{data.label}</div>
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
                    <span>{Math.round(data.result.confidence * 100)}%</span>
                  </div>
                  {data.result.explanation && (
                    <div className="mt-1 text-purple-300">
                      {data.result.explanation}
                    </div>
                  )}
                </div>
              </div>
            )}
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
      <div className="absolute hidden group-hover:block bottom-full left-0 mb-2 bg-gray-900 text-xs text-white p-2 rounded shadow-lg"></div>
        <div>ID: {data.id}</div>
        <div>Status: {data.status || 'idle'}</div>
        {data.result?.confidence && (
          <div>Confidence: {Math.round(data.result.confidence * 100)}%</div>
        )}
      </div>
    </div>
  );
};

export default memo(AIAgentNode);