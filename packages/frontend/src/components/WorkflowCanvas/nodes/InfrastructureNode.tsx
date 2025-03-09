import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface InfrastructureNodeData {
  label: string;
  description: string;
  region?: string;
  tier?: string;
  instanceCount?: number;
}

const InfrastructureNode = ({ data, isConnectable }: NodeProps<InfrastructureNodeData>) => {
  return (
    <div className="px-4 py-3 shadow-md rounded-md bg-gradient-to-r from-green-800 to-green-900 border border-green-700 text-white min-w-[180px]">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-green-400"
      />
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-green-400"
      />
      <div className="flex items-center">
        <div className="mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-300">
            <path fillRule="evenodd" d="M2.25 6a3 3 0 013-3h13.5a3 3 0 013 3v12a3 3 0 01-3 3H5.25a3 3 0 01-3-3V6zm3.97.97a.75.75 0 011.06 0l2.25 2.25a.75.75 0 010 1.06l-2.25 2.25a.75.75 0 01-1.06-1.06l1.72-1.72-1.72-1.72a.75.75 0 010-1.06zm4.28 4.28a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <div className="font-bold">{data.label}</div>
          <div className="text-xs text-green-200">{data.description}</div>
        </div>
      </div>
      
      <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1">
        {data.region && (
          <div className="text-xs flex">
            <span className="text-green-300 mr-1">Region:</span>
            <span className="font-mono">{data.region}</span>
          </div>
        )}
        
        {data.tier && (
          <div className="text-xs flex">
            <span className="text-green-300 mr-1">Tier:</span>
            <span className="font-mono">{data.tier}</span>
          </div>
        )}
        
        {data.instanceCount !== undefined && (
          <div className="text-xs flex col-span-2">
            <span className="text-green-300 mr-1">Instances:</span>
            <div className="flex space-x-1">
              {[...Array(data.instanceCount)].map((_, i) => (
                <div 
                  key={i}
                  className="w-2 h-2 rounded-full bg-green-400"
                ></div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-green-400"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-green-400"
      />
    </div>
  );
};

export default memo(InfrastructureNode);