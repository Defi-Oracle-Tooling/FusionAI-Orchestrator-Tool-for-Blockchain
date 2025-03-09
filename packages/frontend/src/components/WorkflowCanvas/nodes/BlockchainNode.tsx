import React, { memo, useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface BlockchainNodeData {
  id: string;
  label: string;
  description: string;
  networkType: 'ethereum' | 'hyperledger' | 'polygon';
  chainId: number;
  status?: 'initializing' | 'active' | 'error';
  metrics?: {
    blockNumber: number;
    lastUpdate: number;
    peers?: number;
  };
}

const BlockchainNode = ({ data, isConnectable }: NodeProps<BlockchainNodeData>) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastBlockTime, setLastBlockTime] = useState<string>('');

  useEffect(() => {
    if (data.metrics?.lastUpdate) {
      const timeAgo = Math.floor((Date.now() - data.metrics.lastUpdate) / 1000);
      setLastBlockTime(timeAgo < 60 ? `${timeAgo}s ago` : `${Math.floor(timeAgo / 60)}m ago`);
    }
  }, [data.metrics?.lastUpdate]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-400';
      case 'initializing': return 'bg-yellow-400';
      case 'error': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const getNetworkIcon = (networkType: string) => {
    switch (networkType) {
      case 'ethereum':
        return (
          <svg className="w-5 h-5 text-blue-300" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 1.75l-6.25 10.5L12 16l6.25-3.75L12 1.75M5.75 13.5L12 22.25l6.25-8.75L12 17.25l-6.25-3.75z"/>
          </svg>
        );
      case 'hyperledger':
        return (
          <svg className="w-5 h-5 text-green-300" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.8L19.2 8 12 11.2 4.8 8 12 4.8zM4 16.2V9.8l7 3.5v6.4l-7-3.5zm16 0l-7 3.5v-6.4l7-3.5v6.4z"/>
          </svg>
        );
      case 'polygon':
        return (
          <svg className="w-5 h-5 text-purple-300" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.8l6 3.2-6 3.2-6-3.2 6-3.2zM5 16.1v-6.2l6 3.2v6.2l-6-3.2zm14 0l-6 3.2v-6.2l6-3.2v6.2z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative group">
      <div className={`px-4 py-3 shadow-md rounded-md border ${
        data.status === 'error' ? 'bg-red-900 border-red-700' :
        'bg-gradient-to-r from-blue-800 to-blue-900 border-blue-700'
      } text-white min-w-[220px]`}>
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          className="w-2 h-2 bg-blue-400"
        />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className="mr-2">
              {getNetworkIcon(data.networkType)}
            </div>
            <div>
              <div className="font-bold flex items-center">
                <span>{data.label}</span>
                <div className={`ml-2 w-2 h-2 rounded-full ${getStatusColor(data.status)}`} />
              </div>
              <div className="text-xs text-blue-200">{data.description}</div>
            </div>
          </div>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-blue-700 rounded"
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
              <div className="flex justify-between text-xs">
                <span className="text-blue-300">Chain ID:</span>
                <span>{data.chainId}</span>
              </div>
              {data.metrics && (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-300">Latest Block:</span>
                    <span>#{data.metrics.blockNumber}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-300">Last Update:</span>
                    <span>{lastBlockTime}</span>
                  </div>
                  {data.metrics.peers !== undefined && (
                    <div className="flex justify-between text-xs">
                      <span className="text-blue-300">Connected Peers:</span>
                      <span>{data.metrics.peers}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="mt-3 flex space-x-2">
              <button className="text-xs px-2 py-1 bg-blue-700 hover:bg-blue-600 rounded">
                View Explorer
              </button>
              <button className="text-xs px-2 py-1 bg-blue-700 hover:bg-blue-600 rounded">
                Deploy Contract
              </button>
            </div>
          </>
        )}

        <Handle
          type="source"
          position={Position.Right}
          id="out"
          isConnectable={isConnectable}
          className="w-2 h-2 bg-blue-400"
        />
      </div>
      
      {/* Hover tooltip */}
      <div className="absolute hidden group-hover:block bottom-full left-0 mb-2 bg-gray-900 text-xs text-white p-2 rounded shadow-lg">
        <div>ID: {data.id}</div>
        <div>Network: {data.networkType}</div>
        <div>Status: {data.status || 'disconnected'}</div>
      </div>
    </div>
  );
};

export default memo(BlockchainNode);