import React, { useCallback, useState, useRef } from 'react';
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
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import BlockchainNode from './nodes/BlockchainNode';
import AIAgentNode from './nodes/AIAgentNode';
import InfrastructureNode from './nodes/InfrastructureNode';
import { MonitoringPanel } from './MonitoringPanel';
import NodePalette from './NodePalette';
import NodeConfigPanel from './NodeConfigPanel';
import ParallaxContainer from '../parallax/ParallaxContainer';
import ParallaxLayer from '../parallax/ParallaxLayer';

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
      networkType: 'hyperledger',
      status: 'active',
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
      capabilities: [
        { metadata: { name: 'KYC Validation' }, enabled: true },
        { metadata: { name: 'Fraud Detection' }, enabled: true },
        { metadata: { name: 'Regulatory Reporting' }, enabled: true }
      ],
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

const EnhancedWorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ 
  onSave,
  readOnly = false,
  workflowId
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();
  
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
  
  // Handle drag over for node creation
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  // Handle drop for node creation
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      
      if (!reactFlowWrapper.current || !reactFlowInstance) return;
      
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/nodeType');
      const nodeData = JSON.parse(event.dataTransfer.getData('application/nodeData') || '{}');
      
      // Check if the dropped element is valid
      if (!type) return;
      
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      
      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: nodeData,
      };
      
      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance, setNodes]
  );
  
  // Handle node drag start from palette
  const onPaletteDragStart = (event: React.DragEvent, nodeType: string, nodeData: any) => {
    event.dataTransfer.setData('application/nodeType', nodeType);
    event.dataTransfer.setData('application/nodeData', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };
  
  // Handle node update from config panel
  const onNodeUpdate = useCallback(
    (nodeId: string, data: any) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  // Helper function to safely convert values to string
  const safeToString = (value: unknown): string => {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <div className="workflow-editor-container h-screen flex">
      <ParallaxContainer className="flex-grow h-full">
        <ParallaxLayer depth={2} className="parallax-layer-back">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black opacity-50"></div>
        </ParallaxLayer>
        
        <ParallaxLayer depth={1} className="parallax-layer-mid">
          <div className="absolute inset-0 opacity-10" style={{ 
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>
        </ParallaxLayer>
        
        <ParallaxLayer depth={0} className="parallax-layer-front">
          <div 
            className="h-full w-full" 
            ref={reactFlowWrapper}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              onDragOver={onDragOver}
              onDrop={onDrop}
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
          </div>
        </ParallaxLayer>
      </ParallaxContainer>
      
      {/* Node palette */}
      <div className="w-64 h-full bg-gray-900 overflow-auto">
        <NodePalette onDragStart={onPaletteDragStart} />
      </div>
      
      {/* Node configuration panel */}
      {selectedNode && (
        <div className="w-80 h-full bg-gray-900 overflow-auto">
          <NodeConfigPanel 
            selectedNode={selectedNode} 
            onNodeUpdate={onNodeUpdate} 
          />
        </div>
      )}
    </div>
  );
};

export default EnhancedWorkflowCanvas;
