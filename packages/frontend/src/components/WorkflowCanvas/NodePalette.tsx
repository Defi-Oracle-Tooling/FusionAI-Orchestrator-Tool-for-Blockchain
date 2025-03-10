import React from 'react';
import AnimatedCard from '../animations/AnimatedCard';

interface NodeTypeDefinition {
  type: string;
  label: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: string, nodeData: any) => void;
}

const nodeTypes: NodeTypeDefinition[] = [
  {
    type: 'blockchainNode',
    label: 'Blockchain Node',
    description: 'Add a blockchain network node',
    color: 'blue',
    icon: (
      <svg className="w-5 h-5 text-blue-300" viewBox="0 0 24 24">
        <path fill="currentColor" d="M12 1.75l-6.25 10.5L12 16l6.25-3.75L12 1.75M5.75 13.5L12 22.25l6.25-8.75L12 17.25l-6.25-3.75z"/>
      </svg>
    ),
  },
  {
    type: 'aiAgentNode',
    label: 'AI Agent',
    description: 'Add an AI agent for processing',
    color: 'purple',
    icon: (
      <svg className="w-5 h-5 text-purple-300" viewBox="0 0 24 24">
        <path fill="currentColor" d="M12 3c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m-1 20v-6h2v6h-2m8-11c0-3.87-3.13-7-7-7s-7 3.13-7 7c0 3.47 2.52 6.33 5.83 6.89v-2.04c-2.25-.51-3.93-2.53-3.93-4.85 0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.32-1.68 4.34-3.93 4.85v2.04C18.48 18.33 21 15.47 21 12z" />
      </svg>
    ),
  },
  {
    type: 'infrastructureNode',
    label: 'Infrastructure',
    description: 'Add infrastructure component',
    color: 'green',
    icon: (
      <svg className="w-5 h-5 text-green-300" viewBox="0 0 24 24">
        <path fill="currentColor" d="M21 13v10h-6v-6H9v6H3V13H0L12 1l12 12h-3z" />
      </svg>
    ),
  },
];

const NodePalette: React.FC<NodePaletteProps> = ({ onDragStart }) => {
  const getDefaultDataForNodeType = (type: string) => {
    switch (type) {
      case 'blockchainNode':
        return {
          label: 'Ethereum Node',
          description: 'Ethereum blockchain node',
          networkType: 'ethereum',
          chainId: 1,
        };
      case 'aiAgentNode':
        return {
          label: 'Compliance Agent',
          description: 'Monitors transactions for compliance',
          capabilities: [{ metadata: { name: 'KYC Validation' }, enabled: true }],
        };
      case 'infrastructureNode':
        return {
          label: 'Azure Kubernetes',
          description: 'Managed Kubernetes service',
          region: 'East US',
          tier: 'Standard',
          instanceCount: 3,
        };
      default:
        return {};
    }
  };

  return (
    <div className="node-palette bg-gray-800 p-4 rounded-lg">
      <h3 className="text-white text-lg font-medium mb-3">Node Types</h3>
      <div className="grid grid-cols-1 gap-3">
        {nodeTypes.map((nodeType) => (
          <AnimatedCard
            key={nodeType.type}
            hoverEffect="lift"
            clickEffect="press"
            className={`cursor-grab bg-${nodeType.color}-900 bg-opacity-50`}
          >
            <div
              draggable
              onDragStart={(e) => onDragStart(e, nodeType.type, getDefaultDataForNodeType(nodeType.type))}
              className="p-3"
            >
              <div className="flex items-center">
                <div className="mr-2">{nodeType.icon}</div>
                <div>
                  <h4 className="text-white font-medium">{nodeType.label}</h4>
                  <p className="text-gray-300 text-xs">{nodeType.description}</p>
                </div>
              </div>
            </div>
          </AnimatedCard>
        ))}
      </div>
    </div>
  );
};

export default NodePalette;
