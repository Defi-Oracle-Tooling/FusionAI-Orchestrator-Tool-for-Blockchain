import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';

const AdminDashboard: React.FC = () => {
  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* System Overview Card */}
        <div className="bg-white shadow rounded-lg p-6 col-span-full">
          <h2 className="text-xl font-semibold mb-4">System Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-blue-800">Active Nodes</h3>
              <p className="text-3xl font-bold mt-2">24</p>
              <p className="text-sm text-blue-600 mt-1">+3 from yesterday</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-green-800">AI Agents</h3>
              <p className="text-3xl font-bold mt-2">12</p>
              <p className="text-sm text-green-600 mt-1">All operational</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-purple-800">Active Workflows</h3>
              <p className="text-3xl font-bold mt-2">8</p>
              <p className="text-sm text-purple-600 mt-1">2 pending approval</p>
            </div>
          </div>
        </div>

        {/* User Management Card */}
        <div className="bg-white shadow rounded-lg p-6 col-span-1 md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">User Management</h2>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
              Add User
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">JD</div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">John Doe</div>
                        <div className="text-sm text-gray-500">john@example.com</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Administrator</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                    <button className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">JS</div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">Jane Smith</div>
                        <div className="text-sm text-gray-500">jane@example.com</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Employee</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                    <button className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Network Configuration Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Network Configuration</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Ethereum Mainnet</h3>
                <p className="text-sm text-gray-500">Chain ID: 1</p>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Polygon</h3>
                <p className="text-sm text-gray-500">Chain ID: 137</p>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Binance Smart Chain</h3>
                <p className="text-sm text-gray-500">Chain ID: 56</p>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                Maintenance
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Solana</h3>
                <p className="text-sm text-gray-500">Mainnet</p>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                Inactive
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Avalanche</h3>
                <p className="text-sm text-gray-500">C-Chain</p>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                Inactive
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Polkadot</h3>
                <p className="text-sm text-gray-500">Relay Chain</p>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                Inactive
              </span>
            </div>
            <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
              Add Network
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
