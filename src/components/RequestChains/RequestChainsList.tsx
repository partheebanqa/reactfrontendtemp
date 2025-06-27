import React, { useState } from 'react';
import { 
  Plus, 
  Search,
  Workflow,
  Play,
  Pause,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  Copy,
  Download
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RequestChain } from '../../shared/types/chainRequestTypes';
import { useNavigate } from 'react-router-dom';

export function RequestChainsList() {
  const { state, dispatch } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const navigate = useNavigate();

  const onCreateChain = () => {
    navigate('/request-chain/create');
  };

  const filteredChains = state.requestChains.filter(chain => {
    const matchesSearch = chain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chain.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && chain.enabled) ||
                         (statusFilter === 'inactive' && !chain.enabled);
    
    return matchesSearch && matchesStatus;
  });

  const handleToggleChain = (chainId: string) => {
    const chain = state.requestChains.find(c => c.id === chainId);
    if (chain) {
      dispatch({
        type: 'UPDATE_REQUEST_CHAIN',
        payload: { ...chain, enabled: !chain.enabled }
      });
    }
  };

  const handleDeleteChain = (chainId: string) => {
    if (confirm('Are you sure you want to delete this request chain? This action cannot be undone.')) {
      dispatch({ type: 'DELETE_REQUEST_CHAIN', payload: chainId });
    }
  };

  const getStatusIcon = (chain: RequestChain) => {
    if (!chain.enabled) {
      return <Pause className="w-4 h-4 text-gray-400" />;
    }
    
    if (chain.successRate >= 90) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (chain.successRate >= 70) {
      return <Clock className="w-4 h-4 text-yellow-500" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Request Chains</h1>
          <p className="text-gray-600">Manage your API automation workflows</p>
        </div>
        <button
          onClick={onCreateChain}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Chain</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search request chains..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Chains</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Chains Grid */}
      {filteredChains.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredChains.map((chain) => (
            <div key={chain.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              {/* Card Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(chain)}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{chain.name}</h3>
                      <p className="text-sm text-gray-500">{chain.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleToggleChain(chain.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        chain.enabled 
                          ? 'text-green-600 hover:bg-green-50' 
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                      title={chain.enabled ? 'Disable chain' : 'Enable chain'}
                    >
                      {chain.enabled ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </button>
                    <button
                      // onClick={() => onEditChain(chain)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      title="Edit chain"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteChain(chain.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete chain"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6 space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{chain.requests.length}</p>
                    <p className="text-xs text-gray-500">Requests</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{chain.executionCount}</p>
                    <p className="text-xs text-gray-500">Executions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{chain.successRate}%</p>
                    <p className="text-xs text-gray-500">Success</p>
                  </div>
                </div>

                {/* Last Execution */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Last Execution</p>
                    <p className="text-xs text-gray-500">
                      {chain.lastExecuted 
                        ? new Date(chain.lastExecuted).toLocaleString()
                        : 'Never executed'
                      }
                    </p>
                  </div>
                  <Clock className="w-4 h-4 text-gray-400" />
                </div>

                {/* Schedule Status */}
                {chain.schedule.enabled && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Scheduled</p>
                      <p className="text-xs text-blue-600">
                        {chain.schedule.type === 'once' ? 'One-time' : 'Recurring'}
                      </p>
                    </div>
                    <Settings className="w-4 h-4 text-blue-500" />
                  </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button className="flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Copy className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Clone</span>
                  </button>
                  <button className="flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Download className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Export</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Workflow className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No request chains found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.' 
              : 'Create your first request chain to automate your API workflows.'
            }
          </p>
          <button
            onClick={onCreateChain}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Request Chain</span>
          </button>
        </div>
      )}
    </div>
  );
}