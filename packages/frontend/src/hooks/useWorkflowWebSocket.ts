import { useEffect, useRef, useState } from 'react';

interface WorkflowStatus {
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  results: any[];
}

export const useWorkflowWebSocket = (workflowId: string) => {
  const [status, setStatus] = useState<WorkflowStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000'}/ws/workflows/${workflowId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'error') {
          setError(data.error);
        } else {
          setStatus(data);
          setError(null);
        }
      } catch (err) {
        setError('Failed to parse workflow status update');
      }
    };

    ws.onerror = (event) => {
      setError('WebSocket connection error');
      console.error('WebSocket error:', event);
    };

    ws.onclose = () => {
      setError('WebSocket connection closed');
    };

    wsRef.current = ws;

    return () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [workflowId]);

  return { status, error };
};