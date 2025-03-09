import { useEffect, useRef, useState } from 'react';

interface NodeMetrics {
  blockNumber: number;
  lastUpdate: number;
  peers?: number;
}

interface NodeStatus {
  status: 'active' | 'error' | 'disconnected';
  metrics?: NodeMetrics;
}

export const useBlockchainNodeWebSocket = (nodeId: string) => {
  const [status, setStatus] = useState<NodeStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000'}/ws/blockchain/nodes/${nodeId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      // Request initial status
      ws.send(JSON.stringify({ type: 'getStatus' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'status':
          case 'networkStatus':
            setStatus({
              status: data.status,
              metrics: data.metrics
            });
            setError(null);
            break;
          case 'error':
            setError(data.error);
            break;
          default:
            console.warn('Unknown message type:', data.type);
        }
      } catch (err) {
        setError('Failed to parse node status update');
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

    // Poll for status updates every 15 seconds
    const intervalId = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'getStatus' }));
      }
    }, 15000);

    return () => {
      clearInterval(intervalId);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [nodeId]);

  const refreshStatus = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'getStatus' }));
    }
  };

  return { status, error, refreshStatus };
};