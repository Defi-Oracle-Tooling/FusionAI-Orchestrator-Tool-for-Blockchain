import { useState, useEffect } from 'react';

interface NodeStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: Record<string, any>;
}

export const useBlockchainNodeWebSocket = (nodeId?: string) => {
  const [nodeStatus, setNodeStatus] = useState<NodeStatus | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!nodeId) return;

    const ws = new WebSocket(`ws://${window.location.host}/api/blockchain/${nodeId}/ws`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'status') {
          setNodeStatus(data);
          setError(null);
        }
      } catch (err) {
        setError(err as Error);
      }
    };

    ws.onerror = (event) => {
      setError(new Error('WebSocket connection error'));
    };

    // Request initial status
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'getStatus' }));
    };

    return () => {
      ws.close();
    };
  }, [nodeId]);

  return { nodeStatus, error };
};