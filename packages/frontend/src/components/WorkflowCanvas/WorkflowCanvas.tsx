import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  Edge,
  Node,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import BlockchainNode from './nodes/BlockchainNode';
import AIAgentNode from './nodes/AIAgentNode';
import InfrastructureNode from './nodes/InfrastructureNode';
import { MonitoringPanel } from './MonitoringPanel';

// Define custom node types for our blockchain-specific components
const nodeTypes: NodeTypes = {
  blockchainNode: BlockchainNode,
  aiAgentNode: AIAgentNode,
  infrastructureNode: InfrastructureNode,
};

// Initial nodes for demonstration
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'blockchainNode',
    position: { x: 250, y: 150 },
    data: { 
      label: 'Hyperledger Besu',
      description: 'Enterprise Ethereum client',
      chainId: 138,
      consensus: 'IBFT2',
      blockTime: '2s',
    },
  },
  {
    id: '2',
    type: 'aiAgentNode',
    position: { x: 500, y: 150 },
    data: { 
      label: 'Compliance Agent',
      description: 'Monitors transactions for regulatory compliance',
      confidence: 0.95,
      capabilities: ['KYC Validation', 'Fraud Detection', 'Regulatory Reporting'],
    },
  },
  {
    id: '3',
    type: 'infrastructureNode',
    position: { x: 370, y: 300 },
    data: { 
      label: 'Azure Kubernetes',
      description: 'Managed Kubernetes service',
      region: 'East US',
      tier: 'Standard',
      instanceCount: 3,
    },
  },
];

// Initial edges connecting the nodes
const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3' },
  { id: 'e2-3', source: '2', target: '3', animated: true },
];

interface WorkflowCanvasProps {
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  readOnly?: boolean;
  workflowId: string;
}

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ 
  onSave,
  readOnly = false,
  workflowId
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Handle connecting two nodes with an edge
  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, animated: true }, eds)),
    [setEdges]
  );

  // Handle node selection
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
    },
    []
  );

  // Handle saving the workflow
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(nodes, edges);
    }
  }, [nodes, edges, onSave]);

  return (
    <div className="h-screen">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap zoomable pannable />
        <MonitoringPanel workflowId={workflowId} />
        
        {!readOnly && (
          <Panel position="top-right">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Save Workflow
            </button>
          </Panel>
        )}
      </ReactFlow>
      
      {/* Node details panel */}
      {selectedNode && (
        <div className="absolute right-0 top-0 h-full w-80 bg-gray-900 text-white p-6 overflow-auto">
          <h3 className="text-xl font-bold mb-4">{selectedNode.data.label}</h3>
          <p className="text-gray-300 mb-4">{selectedNode.data.description}</p>
          
          <div className="space-y-4">
            {Object.entries(selectedNode.data)
              .filter(([key]) => !['label', 'description'].includes(key))
              .map(([key, value]) => (
                <div key={key}>
                  <h4 className="text-sm text-gray-400">{key}</h4>
                  <p className="text-white">
                    {Array.isArray(value) 
                      ? value.join(', ') 
                      : value.toString()}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowCanvas;