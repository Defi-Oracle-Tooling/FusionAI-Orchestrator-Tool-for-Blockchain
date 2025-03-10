import React from 'react';
import { Node } from 'reactflow';
import AnimatedCard from '../animations/AnimatedCard';

interface NodeConfigPanelProps {
  selectedNode: Node | null;
  onNodeUpdate: (nodeId: string, data: any) => void;
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ 
  selectedNode, 
  onNodeUpdate 
}) => {
  if (!selectedNode) return null;
  
  const handleChange = (key: string, value: any) => {
    const updatedData = { ...selectedNode.data, [key]: value };
    onNodeUpdate(selectedNode.id, updatedData);
  };
  
  const renderConfigFields = () => {
    switch (selectedNode.type) {
      case 'blockchainNode':
        return (
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Network Type
              </label>
              <select
                className="w-full bg-gray-700 text-white rounded p-2"
                value={selectedNode.data.networkType}
                onChange={(e) => handleChange('networkType', e.target.value)}
              >
                <option value="ethereum">Ethereum</option>
                <option value="hyperledger">Hyperledger</option>
                <option value="polygon">Polygon</option>
                <option value="solana">Solana</option>
                <option value="avalanche">Avalanche</option>
                <option value="polkadot">Polkadot</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Chain ID
              </label>
              <input
                type="number"
                className="w-full bg-gray-700 text-white rounded p-2"
                value={selectedNode.data.chainId}
                onChange={(e) => handleChange('chainId', parseInt(e.target.value))}
              />
            </div>
          </>
        );
      case 'aiAgentNode':
        return (
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Capabilities
              </label>
              <div className="space-y-2">
                {selectedNode.data.capabilities?.map((capability: any, index: number) => (
                  <div key={index} className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={capability.enabled}
                      onChange={(e) => {
                        const updatedCapabilities = [...selectedNode.data.capabilities];
                        updatedCapabilities[index] = {
                          ...capability,
                          enabled: e.target.checked,
                        };
                        handleChange('capabilities', updatedCapabilities);
                      }}
                    />
                    <span className="text-white text-sm">{capability.metadata.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        );
      case 'infrastructureNode':
        return (
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Region
              </label>
              <input
                type="text"
                className="w-full bg-gray-700 text-white rounded p-2"
                value={selectedNode.data.region}
                onChange={(e) => handleChange('region', e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Instance Count
              </label>
              <input
                type="number"
                className="w-full bg-gray-700 text-white rounded p-2"
                value={selectedNode.data.instanceCount}
                onChange={(e) => handleChange('instanceCount', parseInt(e.target.value))}
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };
  
  return (
    <AnimatedCard className="node-config-panel bg-gray-800 p-4 w-80 overflow-auto">
      <h3 className="text-white text-lg font-medium mb-4">
        Configure {selectedNode.data.label}
      </h3>
      
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Label
        </label>
        <input
          type="text"
          className="w-full bg-gray-700 text-white rounded p-2"
          value={selectedNode.data.label}
          onChange={(e) => handleChange('label', e.target.value)}
        />
      </div>
      
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Description
        </label>
        <textarea
          className="w-full bg-gray-700 text-white rounded p-2"
          value={selectedNode.data.description}
          onChange={(e) => handleChange('description', e.target.value)}
        />
      </div>
      
      {renderConfigFields()}
    </AnimatedCard>
  );
};

export default NodeConfigPanel;
