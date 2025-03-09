import { useState, useEffect } from 'react';

interface WorkflowStatus {
  status: 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  activeSteps: number;
  completedSteps: number;
  timeRemaining: number;
  lastUpdate: string;
}

export const useWorkflowWebSocket = (workflowId?: string) => {
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!workflowId) return;

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 1000; // Start with 1 second delay

    const connect = () => {
      const ws = new WebSocket(`ws://${window.location.host}/api/workflows/${workflowId}/ws`);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'status') {
            setWorkflowStatus(data);
            setError(null);
            reconnectAttempts = 0; // Reset reconnect attempts on successful message
          }
        } catch (err) {
          setError(err as Error);
        }
      };

      ws.onclose = (event) => {
        if (!event.wasClean && reconnectAttempts < maxReconnectAttempts) {
          // Exponential backoff for reconnection
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          setTimeout(() => {
            reconnectAttempts++;
            connect();
          }, delay);
        }
      };

      ws.onerror = (event) => {
        setError(new Error('WebSocket connection error'));
      };

      // Request initial status
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'getStatus' }));
      };

      return ws;
    };

    const ws = connect();

    return () => {
      ws.close();
    };
  }, [workflowId]);

  const retryConnection = () => {
    setError(null);
  };

  return { workflowStatus, error, retryConnection };
};