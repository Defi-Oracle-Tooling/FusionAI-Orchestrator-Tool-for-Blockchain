import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useWorkflowWebSocket } from '../hooks/useWorkflowWebSocket';
import { useBlockchainNodeWebSocket } from '../hooks/useBlockchainNodeWebSocket';
import DashboardLayout from '../layouts/DashboardLayout';

// Load WorkflowCanvas dynamically with SSR disabled, as ReactFlow requires browser DOM
const WorkflowCanvas = dynamic(() => import('../components/WorkflowCanvas/WorkflowCanvas'), {
  ssr: false,
  loading: () => <div className="h-screen flex items-center justify-center bg-gray-900 text-white">Loading workflow editor...</div>
});

export default function Workspace() {
  const { t } = useTranslation('common');
  const [isSaved, setIsSaved] = useState(false);
  const router = useRouter();
  const { workflowId } = router.query;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { workflowStatus } = useWorkflowWebSocket(workflowId as string);
  const [activeNodes, setActiveNodes] = useState<string[]>([]);

  // Subscribe to blockchain node updates for each active node
  const nodeStates = activeNodes.map(nodeId => 
    useBlockchainNodeWebSocket(nodeId)
  );

  useEffect(() => {
    if (!workflowId) {
      setError('No workflow ID provided');
      return;
    }

    const fetchWorkflowData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/workflows/${workflowId}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch workflow data');
        }

        const data = await response.json();
        
        // Extract blockchain node IDs from the workflow data
        const nodeIds = data.nodes
          .filter((node: any) => node.type === 'blockchain')
          .map((node: any) => node.id);
        
        setActiveNodes(nodeIds);
        setIsLoading(false);
      } catch (err) {
        setError((err as Error).message);
        setIsLoading(false);
      }
    };

    fetchWorkflowData();
  }, [workflowId]);

  const handleSaveWorkflow = async (nodes: any[], edges: any[]) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/workflows/${workflowId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ nodes, edges }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save workflow');
      }
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error('Error saving workflow:', err);
      // TODO: Add proper error handling UI
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Workspace">
        <div className="flex h-full items-center justify-center">
          <div className="text-xl text-gray-600">Loading workspace...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Workspace">
        <div className="flex h-full items-center justify-center">
          <div className="text-xl text-red-600">{error}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Workspace - ${workflowId}`}>
      <div className="h-full flex flex-col">
        <div className="bg-white dark:bg-gray-800 shadow-sm p-4 mb-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Workflow Editor</h2>
              <p className="text-sm text-gray-500">ID: {workflowId}</p>
            </div>
            
            {workflowStatus && (
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  Status: <span className="font-semibold">{workflowStatus.status}</span>
                </div>
                {workflowStatus.progress !== undefined && (
                  <div className="text-sm">
                    Progress: <span className="font-semibold">{workflowStatus.progress}%</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex space-x-2">
              {isSaved && (
                <span className="text-green-600 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved
                </span>
              )}
              <button 
                onClick={() => {/* TODO: Implement settings */}}
                className="btn btn-outline text-sm"
              >
                Settings
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 relative bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
          {workflowId && (
            <WorkflowCanvas
              workflowId={workflowId as string}
              onSave={handleSaveWorkflow}
            />
          )}
        </div>

        {/* Status bar */}
        <div className="bg-white dark:bg-gray-800 shadow-sm p-3 mt-4 rounded-lg text-sm">
          <div className="flex items-center space-x-6">
            <div>
              Active Nodes: {activeNodes.length}
            </div>
            {nodeStates.map((state, index) => (
              state.nodeStatus && (
                <div key={activeNodes[index]} className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    state.nodeStatus.status === 'healthy' ? 'bg-green-400' :
                    state.nodeStatus.status === 'unhealthy' ? 'bg-red-400' :
                    'bg-yellow-400'
                  }`} />
                  <span>{activeNodes[index]}: {state.nodeStatus.status}</span>
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
