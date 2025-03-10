import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';

const AnalyticsDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState({ 
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 
    end: new Date() 
  });
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  
  // Mock data for demonstration
  const transactionData = {
    volumeOverTime: [
      { timestamp: '2025-03-03', volume: 120 },
      { timestamp: '2025-03-04', volume: 150 },
      { timestamp: '2025-03-05', volume: 180 },
      { timestamp: '2025-03-06', volume: 210 },
      { timestamp: '2025-03-07', volume: 190 },
      { timestamp: '2025-03-08', volume: 220 },
      { timestamp: '2025-03-09', volume: 250 },
    ],
    networkDistribution: [
      { network: 'Ethereum', count: 450 },
      { network: 'Polygon', count: 320 },
      { network: 'Binance', count: 280 },
      { network: 'Solana', count: 150 },
      { network: 'Avalanche', count: 120 },
      { network: 'Polkadot', count: 100 },
    ]
  };
  
  const agentPerformance = [
    { agent: 'Agent 1', tasksCompleted: 45 },
    { agent: 'Agent 2', tasksCompleted: 38 },
    { agent: 'Agent 3', tasksCompleted: 52 },
    { agent: 'Agent 4', tasksCompleted: 29 },
    { agent: 'Agent 5', tasksCompleted: 41 },
  ];
  
  const networkHealth = [
    { timestamp: '2025-03-03', responseTime: 120 },
    { timestamp: '2025-03-04', responseTime: 115 },
    { timestamp: '2025-03-05', responseTime: 125 },
    { timestamp: '2025-03-06', responseTime: 110 },
    { timestamp: '2025-03-07', responseTime: 105 },
    { timestamp: '2025-03-08', responseTime: 100 },
    { timestamp: '2025-03-09', responseTime: 95 },
  ];
  
  const systemMetrics = [
    { timestamp: '2025-03-03', cpuUsage: 45 },
    { timestamp: '2025-03-04', cpuUsage: 50 },
    { timestamp: '2025-03-05', cpuUsage: 55 },
    { timestamp: '2025-03-06', cpuUsage: 60 },
    { timestamp: '2025-03-07', cpuUsage: 58 },
    { timestamp: '2025-03-08', cpuUsage: 52 },
    { timestamp: '2025-03-09', cpuUsage: 48 },
  ];
  
  const handleExport = (format: 'csv' | 'json' | 'pdf') => {
    // Implementation for exporting data
    console.log(`Exporting data in ${format} format`);
  };
  
  return (
    <DashboardLayout title="Analytics Dashboard">
      <div className="grid grid-cols-1 gap-6">
        {/* Filter Controls */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <div className="flex space-x-2">
                  <input 
                    type="date" 
                    className="border rounded-md px-3 py-2 text-sm"
                    value={dateRange.start.toISOString().split('T')[0]}
                    onChange={(e) => setDateRange({ ...dateRange, start: new Date(e.target.value) })}
                  />
                  <input 
                    type="date" 
                    className="border rounded-md px-3 py-2 text-sm"
                    value={dateRange.end.toISOString().split('T')[0]}
                    onChange={(e) => setDateRange({ ...dateRange, end: new Date(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Networks</label>
                <select 
                  className="border rounded-md px-3 py-2 text-sm w-full"
                  multiple
                  value={selectedNetworks}
                  onChange={(e) => setSelectedNetworks(Array.from(e.target.selectedOptions, option => option.value))}
                >
                  <option value="ethereum">Ethereum</option>
                  <option value="polygon">Polygon</option>
                  <option value="binance">Binance Smart Chain</option>
                  <option value="solana">Solana</option>
                  <option value="avalanche">Avalanche</option>
                  <option value="polkadot">Polkadot</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agents</label>
                <select 
                  className="border rounded-md px-3 py-2 text-sm w-full"
                  multiple
                  value={selectedAgents}
                  onChange={(e) => setSelectedAgents(Array.from(e.target.selectedOptions, option => option.value))}
                >
                  <option value="agent1">Agent 1</option>
                  <option value="agent2">Agent 2</option>
                  <option value="agent3">Agent 3</option>
                  <option value="agent4">Agent 4</option>
                  <option value="agent5">Agent 5</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Export</label>
              <div className="flex space-x-2">
                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
                  onClick={() => handleExport('csv')}
                >
                  CSV
                </button>
                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
                  onClick={() => handleExport('json')}
                >
                  JSON
                </button>
                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
                  onClick={() => handleExport('pdf')}
                >
                  PDF
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Transaction Volume Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Transaction Volume</h2>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            {/* Replace with actual chart component */}
            <div className="text-gray-500">
              Line Chart: Transaction Volume Over Time
            </div>
          </div>
        </div>
        
        {/* Network Distribution Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Network Distribution</h2>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            {/* Replace with actual chart component */}
            <div className="text-gray-500">
              Pie Chart: Transaction Distribution by Network
            </div>
          </div>
        </div>
        
        {/* Agent Performance Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Agent Performance</h2>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            {/* Replace with actual chart component */}
            <div className="text-gray-500">
              Bar Chart: Tasks Completed by Agent
            </div>
          </div>
        </div>
        
        {/* Network Health Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Network Health</h2>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            {/* Replace with actual chart component */}
            <div className="text-gray-500">
              Line Chart: Response Time by Network
            </div>
          </div>
        </div>
        
        {/* System Resources Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">System Resources</h2>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            {/* Replace with actual chart component */}
            <div className="text-gray-500">
              Line Chart: CPU Usage Over Time
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsDashboard;
