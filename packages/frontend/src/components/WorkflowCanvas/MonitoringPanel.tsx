import React, { useState, useEffect } from 'react';
import { Panel } from 'reactflow';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Metric {
  name: string;
  value: number;
  timestamp: number;
  labels: Record<string, string>;
}

interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: number;
}

interface MonitoringPanelProps {
  workflowId: string;
}

export const MonitoringPanel: React.FC<MonitoringPanelProps> = ({ workflowId }) => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [historicalData, setHistoricalData] = useState<Record<string, Metric[]>>({});

  useEffect(() => {
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000'}/ws/monitoring/${workflowId}`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'metric') {
        const metric = data.metric;
        setMetrics(prev => [...prev, metric].slice(-100));
        
        // Update historical data for charts
        setHistoricalData(prev => ({
          ...prev,
          [metric.name]: [
            ...(prev[metric.name] || []),
            metric
          ].slice(-50) // Keep last 50 points for charts
        }));
      } else if (data.type === 'alert') {
        setAlerts(prev => [...prev, data.alert].slice(-50));
      }
    };

    return () => ws.close();
  }, [workflowId]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const renderMetricChart = (metricName: string, color: string = '#3b82f6') => {
    const data = historicalData[metricName] || [];
    return (
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
              style={{ fontSize: '10px' }}
            />
            <YAxis style={{ fontSize: '10px' }} />
            <Tooltip
              labelFormatter={(ts) => new Date(Number(ts)).toLocaleTimeString()}
              contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <Panel position="top-right" className="bg-gray-900 text-white rounded-lg shadow-lg w-96">
      <div className="p-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full"
        >
          <span className="font-bold">Monitoring</span>
          <svg
            className={`w-5 h-5 transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isExpanded && (
          <div className="mt-2 space-y-4">
            {/* Active Alerts */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Active Alerts</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {alerts.map((alert, index) => (
                  <div
                    key={`${alert.id}-${index}`}
                    className={`text-xs p-2 rounded ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex justify-between">
                      <span>{alert.message}</span>
                      <span className="text-gray-300">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Agent Metrics */}
            <div>
              <h3 className="text-sm font-semibold mb-2">AI Agent Performance</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Agent Response Time</div>
                  {renderMetricChart('agent_response_time', '#3b82f6')}
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Agent Confidence</div>
                  {renderMetricChart('agent_confidence', '#10b981')}
                </div>
              </div>
            </div>

            {/* Workflow Metrics */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Workflow Performance</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Workflow Execution Time</div>
                  {renderMetricChart('workflow_execution_time', '#8b5cf6')}
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Success Rate</div>
                  {renderMetricChart('workflow_success_rate', '#f59e0b')}
                </div>
              </div>
            </div>

            {/* Resource Usage */}
            <div>
              <h3 className="text-sm font-semibold mb-2">System Resources</h3>
              <div className="grid grid-cols-2 gap-2">
                {['cpu_usage', 'memory_usage', 'network_io', 'disk_io']
                  .map((metric) => {
                    const currentValue = metrics
                      .find(m => m.name === metric)?.value || 0;
                    
                    return (
                      <div
                        key={metric}
                        className="bg-gray-800 p-2 rounded"
                      >
                        <div className="text-xs text-gray-400">
                          {metric.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </div>
                        <div className="text-sm font-mono">
                          {currentValue.toFixed(2)}%
                        </div>
                        <div className="mt-1 h-1 bg-gray-700 rounded">
                          <div
                            className="h-full bg-blue-500 rounded"
                            style={{ width: `${currentValue}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
};