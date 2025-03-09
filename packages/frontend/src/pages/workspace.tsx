import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useWorkflowWebSocket } from '../hooks/useWorkflowWebSocket';
import { useBlockchainNodeWebSocket } from '../hooks/useBlockchainNodeWebSocket';

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
  
  const workflowState = useWorkflowWebSocket(workflowId as string);
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
    } catch (err) {
      console.error('Error saving workflow:', err);
      // TODO: Add proper error handling UI
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl text-gray-600">Loading workspace...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Head>
        <title>{t('workspace.title', 'Workspace - FusionAI Orchestrator')}</title>
      </Head>
      
      <header className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">FusionAI Orchestrator</h1>
          <p className="text-sm text-gray-400">Workflow ID: {workflowId}</p>
        </div>
        
        {workflowState.status && (
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              Status: <span className="font-semibold">{workflowState.status.status}</span>
            </div>
            {workflowState.status.progress !== undefined && (
              <div className="text-sm">
                Progress: <span className="font-semibold">{workflowState.status.progress}%</span>
              </div>
            )}
          </div>
        )}

        <div className="flex space-x-4">
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Dashboard
          </button>
          <button 
            onClick={() => {/* TODO: Implement settings */}}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Settings
          </button>
        </div>
      </header>

      <main className="flex-1 relative">
        {workflowId && (
          <WorkflowCanvas
            workflowId={workflowId as string}
            onSave={handleSaveWorkflow}
          />
        )}
      </main>

      {/* Status bar */}
      <footer className="bg-gray-900 text-white px-6 py-2 text-sm">
        <div className="flex items-center space-x-6">
          <div>
            Active Nodes: {activeNodes.length}
          </div>
          {nodeStates.map((state, index) => (
            state.status && (
              <div key={activeNodes[index]} className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  state.status.status === 'active' ? 'bg-green-400' :
                  state.status.status === 'error' ? 'bg-red-400' :
                  'bg-yellow-400'
                }`} />
                <span>{activeNodes[index]}: {state.status.status}</span>
              </div>
            )
          ))}
        </div>
      </footer>
    </div>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}