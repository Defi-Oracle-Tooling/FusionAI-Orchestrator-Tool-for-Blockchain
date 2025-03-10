import React, { useState } from 'react';
import { Node } from 'reactflow';

interface NodeConfigPanelProps {
  selectedNode: Node;
  onNodeUpdate: (nodeId: string, data: any) => void;
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ 
  selectedNode, 
  onNodeUpdate 
}) => {
  const [nodeData, setNodeData] = useState(selectedNode.data);
  
  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Handle different input types
    let parsedValue = value;
    if (type === 'number') {
      parsedValue = parseFloat(value);
    } else if (type === 'checkbox') {
      parsedValue = (e.target as HTMLInputElement).checked;
    }
    
    setNodeData({
      ...nodeData,
      [name]: parsedValue,
    });
  };
  
  // Handle capability toggle
  const handleCapabilityToggle = (index: number) => {
    if (!nodeData.capabilities) return;
    
    const updatedCapabilities = [...nodeData.capabilities];
    updatedCapabilities[index] = {
      ...updatedCapabilities[index],
      enabled: !updatedCapabilities[index].enabled,
    };
    
    setNodeData({
      ...nodeData,
      capabilities: updatedCapabilities,
    });
  };
  
  // Apply changes to the node
  const handleApplyChanges = () => {
    onNodeUpdate(selectedNode.id, nodeData);
  };
  
  // Render different config panels based on node type
  const renderConfigFields = () => {
    switch (selectedNode.type) {
      case 'blockchainNode':
        return renderBlockchainNodeConfig();
      case 'aiAgentNode':
        return renderAIAgentNodeConfig();
      case 'infrastructureNode':
        return renderInfrastructureNodeConfig();
      default:
        return <div className="text-gray-400">No configuration available for this node type.</div>;
    }
  };
  
  // Render blockchain node configuration
  const renderBlockchainNodeConfig = () => {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Node Label
          </label>
          <input
            type="text"
            name="label"
            value={nodeData.label || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={nodeData.description || ''}
            onChange={handleInputChange}
            rows={2}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Network Type
          </label>
          <select
            name="networkType"
            value={nodeData.networkType || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
          >
            <option value="ethereum">Ethereum</option>
            <option value="polygon">Polygon</option>
            <option value="hyperledger">Hyperledger</option>
            <option value="solana">Solana</option>
            <option value="avalanche">Avalanche</option>
            <option value="polkadot">Polkadot</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Chain ID
          </label>
          <input
            type="number"
            name="chainId"
            value={nodeData.chainId || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Consensus
          </label>
          <input
            type="text"
            name="consensus"
            value={nodeData.consensus || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Block Time
          </label>
          <input
            type="text"
            name="blockTime"
            value={nodeData.blockTime || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Status
          </label>
          <select
            name="status"
            value={nodeData.status || 'active'}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="syncing">Syncing</option>
            <option value="error">Error</option>
          </select>
        </div>
        
        <div>
          <button
            onClick={handleApplyChanges}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Apply Changes
          </button>
        </div>
      </div>
    );
  };
  
  // Render AI agent node configuration
  const renderAIAgentNodeConfig = () => {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Agent Label
          </label>
          <input
            type="text"
            name="label"
            value={nodeData.label || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={nodeData.description || ''}
            onChange={handleInputChange}
            rows={2}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Status
          </label>
          <select
            name="status"
            value={nodeData.status || 'idle'}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
          >
            <option value="idle">Idle</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="error">Error</option>
          </select>
        </div>
        
        {nodeData.capabilities && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Capabilities
            </label>
            <div className="space-y-2">
              {nodeData.capabilities.map((capability: any, index: number) => (
                <div key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={capability.enabled}
                    onChange={() => handleCapabilityToggle(index)}
                    className="mr-2 h-4 w-4 rounded border-gray-700 bg-gray-800 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-300">
                    {capability.metadata.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {nodeData.result && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Confidence
            </label>
            <input
              type="number"
              name="result.confidence"
              value={nodeData.result.confidence || 0}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setNodeData({
                  ...nodeData,
                  result: {
                    ...nodeData.result,
                    confidence: Math.min(1, Math.max(0, value)),
                  },
                });
              }}
              min="0"
              max="1"
              step="0.01"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
            />
          </div>
        )}
        
        <div>
          <button
            onClick={handleApplyChanges}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            Apply Changes
          </button>
        </div>
      </div>
    );
  };
  
  // Render infrastructure node configuration
  const renderInfrastructureNodeConfig = () => {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Infrastructure Label
          </label>
          <input
            type="text"
            name="label"
            value={nodeData.label || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={nodeData.description || ''}
            onChange={handleInputChange}
            rows={2}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Region
          </label>
          <input
            type="text"
            name="region"
            value={nodeData.region || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Tier
          </label>
          <select
            name="tier"
            value={nodeData.tier || 'Standard'}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
          >
            <option value="Basic">Basic</option>
            <option value="Standard">Standard</option>
            <option value="Premium">Premium</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Instance Count
          </label>
          <input
            type="number"
            name="instanceCount"
            value={nodeData.instanceCount || 1}
            onChange={handleInputChange}
            min="1"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
          />
        </div>
        
        <div>
          <button
            onClick={handleApplyChanges}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Apply Changes
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4 text-white">Node Configuration</h3>
      {renderConfigFields()}
    </div>
  );
};

export default NodeConfigPanel;
