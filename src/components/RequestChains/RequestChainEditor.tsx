import React, { useState, useRef } from 'react';
import { 
  ArrowLeft,
  Plus,
  GripVertical,
  Trash2,
  Edit,
  Play,
  Save,
  Settings,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Code,
  Globe,
  Key,
  Upload,
  Download,
  ChevronUp,
  Copy,
  MoreVertical,
  Database
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RequestChain, APIRequest, Variable } from '../../shared/types/chainRequestTypes';
// import { CollectionImportModal } from '../Collections/CollectionImportModal';
import { RequestExecutor } from './RequestExecutor';
import { VariableExtractor } from './VariableExtractor';
import { RequestEditor } from './RequestEditor';
import { VariablesTable } from './VariablesTable';

interface RequestChainEditorProps {
  chain?: RequestChain;
  onBack: () => void;
  onSave: (chain: RequestChain) => void;
}

export function RequestChainEditor({ chain, onBack, onSave }: RequestChainEditorProps) {
  const { state } = useApp();
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const [formData, setFormData] = useState<Partial<RequestChain>>({
    name: chain?.name || '',
    description: chain?.description || '',
    enabled: chain?.enabled ?? true,
    requests: chain?.requests || [],
    variables: chain?.variables || [],
    schedule: chain?.schedule || {
      enabled: false,
      type: 'once',
      startDate: new Date().toISOString().split('T')[0],
      timezone: 'UTC'
    }
  });

  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'requests' | 'variables' | 'extracted-variables' | 'schedule' | 'execute'>('requests');
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [globalVariables, setGlobalVariables] = useState<Variable[]>([
    { id: '1', name: 'baseUrl', value: 'https://api.example.com', type: 'string' },
    { id: '2', name: 'apiKey', value: 'your-api-key', type: 'string' },
    { id: '3', name: 'timeout', value: '5000', type: 'number' }
  ]);

  // Execution state for Variables Table
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const [extractedVariables, setExtractedVariables] = useState<Record<string, any>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentRequestIndex, setCurrentRequestIndex] = useState(-1);

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const requests = [...(formData.requests || [])];
      const draggedItem = requests[dragItem.current];
      requests.splice(dragItem.current, 1);
      requests.splice(dragOverItem.current, 0, draggedItem);
      
      setFormData({ ...formData, requests });
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const toggleRequestExpanded = (requestId: string) => {
    const newExpanded = new Set(expandedRequests);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedRequests(newExpanded);
  };

  const addNewRequest = () => {
    const newRequest: APIRequest = {
      id: Date.now().toString(),
      name: 'New Request',
      method: 'GET',
      url: '',
      headers: [],
      params: [],
      bodyType: 'none',
      timeout: 5000,
      retries: 0,
      errorHandling: 'stop',
      dataExtractions: [],
      testScripts: [],
      enabled: true,
      authType: 'none'
    };
    
    setFormData({
      ...formData,
      requests: [...(formData.requests || []), newRequest]
    });
    setExpandedRequests(new Set([...expandedRequests, newRequest.id]));
  };

  const removeRequest = (requestId: string) => {
    setFormData({
      ...formData,
      requests: formData.requests?.filter(req => req.id !== requestId) || []
    });
    const newExpanded = new Set(expandedRequests);
    newExpanded.delete(requestId);
    setExpandedRequests(newExpanded);
  };

  const updateRequest = (requestId: string, updates: Partial<APIRequest>) => {
    setFormData({
      ...formData,
      requests: formData.requests?.map(req => 
        req.id === requestId ? { ...req, ...updates } : req
      ) || []
    });
  };

  const duplicateRequest = (requestId: string) => {
    const request = formData.requests?.find(r => r.id === requestId);
    if (request) {
      const duplicated = {
        ...request,
        id: Date.now().toString(),
        name: `${request.name} (Copy)`
      };
      setFormData({
        ...formData,
        requests: [...(formData.requests || []), duplicated]
      });
    }
  };

  const moveRequest = (requestId: string, direction: 'up' | 'down') => {
    const requests = [...(formData.requests || [])];
    const index = requests.findIndex(r => r.id === requestId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= requests.length) return;

    [requests[index], requests[newIndex]] = [requests[newIndex], requests[index]];
    setFormData({ ...formData, requests });
  };

  const handleImportRequests = (importedRequests: APIRequest[]) => {
    setFormData({
      ...formData,
      requests: [...(formData.requests || []), ...importedRequests]
    });
    setShowImportModal(false);
  };

  const handleSave = () => {
    if (!formData.name) {
      alert('Please enter a chain name');
      return;
    }

    const chainData: RequestChain = {
      id: chain?.id || Date.now().toString(),
      workspaceId: state.currentWorkspace?.id || '1',
      name: formData.name,
      description: formData.description,
      requests: formData.requests || [],
      variables: formData.variables || [],
      schedule: formData.schedule!,
      enabled: formData.enabled || false,
      createdAt: chain?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastExecuted: chain?.lastExecuted,
      executionCount: chain?.executionCount || 0,
      successRate: chain?.successRate || 0
    };

    onSave(chainData);
  };

  const getMethodColor = (method: string) => {
    const colors = {
      GET: 'text-green-600 bg-green-50 border-green-200',
      POST: 'text-blue-600 bg-blue-50 border-blue-200',
      PUT: 'text-orange-600 bg-orange-50 border-orange-200',
      DELETE: 'text-red-600 bg-red-50 border-red-200',
      PATCH: 'text-purple-600 bg-purple-50 border-purple-200',
      HEAD: 'text-gray-600 bg-gray-50 border-gray-200',
      OPTIONS: 'text-yellow-600 bg-yellow-50 border-yellow-200'
    };
    return colors[method as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const addGlobalVariable = () => {
    const newVar: Variable = {
      id: Date.now().toString(),
      name: '',
      value: '',
      type: 'string'
    };
    setGlobalVariables([...globalVariables, newVar]);
  };

  const updateGlobalVariable = (id: string, updates: Partial<Variable>) => {
    setGlobalVariables(globalVariables.map(v => 
      v.id === id ? { ...v, ...updates } : v
    ));
  };

  const removeGlobalVariable = (id: string) => {
    setGlobalVariables(globalVariables.filter(v => v.id !== id));
  };

  // If editing a specific request, show the request editor
  if (editingRequestId) {
    const request = formData.requests?.find(r => r.id === editingRequestId);
    if (request) {
      return (
        <div className="h-full flex flex-col">
          <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setEditingRequestId(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Edit Request</h1>
                  <p className="text-sm text-gray-500">Configure your API request</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <RequestEditor
              request={request}
              globalVariables={globalVariables}
              onUpdate={(updates) => updateRequest(editingRequestId, updates)}
              onSave={() => setEditingRequestId(null)}
            />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {chain ? 'Edit Request Chain' : 'Create Request Chain'}
              </h1>
              <p className="text-sm text-gray-500">
                Configure your API automation workflow
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Chain</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chain Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter chain name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.enabled ? 'enabled' : 'disabled'}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.value === 'enabled' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe what this chain does"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'requests', label: 'Requests', count: formData.requests?.length || 0 },
                    { id: 'variables', label: 'Global Variables', count: globalVariables.length },
                    { id: 'extracted-variables', label: 'Variables Table', icon: Database },
                    { id: 'schedule', label: 'Schedule' },
                    { id: 'execute', label: 'Execute & Test' }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {Icon && <Icon className="w-4 h-4" />}
                        <span>{tab.label}</span>
                        {tab.count !== undefined && (
                          <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'requests' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">Request Chain</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowImportModal(true)}
                          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Import</span>
                        </button>
                        <button
                          onClick={addNewRequest}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Request</span>
                        </button>
                      </div>
                    </div>

                    {formData.requests && formData.requests.length > 0 ? (
                      <div className="space-y-3">
                        {formData.requests.map((request, index) => (
                          <div
                            key={request.id}
                            className="border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-center p-4">
                              <div className="flex items-center space-x-3">
                                <GripVertical 
                                  className="w-5 h-5 text-gray-400 cursor-move" 
                                  draggable
                                  onDragStart={() => handleDragStart(index)}
                                  onDragEnter={() => handleDragEnter(index)}
                                  onDragEnd={handleDragEnd}
                                />
                                
                                {/* Request Number */}
                                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                                  {index + 1}
                                </div>
                              </div>
                              
                              <div className="flex-1 flex items-center space-x-4 ml-3">
                                <span className={`px-2 py-1 text-xs font-medium rounded border ${getMethodColor(request.method)}`}>
                                  {request.method}
                                </span>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{request.name}</p>
                                  <p className="text-sm text-gray-500">{request.url || 'No URL specified'}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {request.enabled ? (
                                    <Eye className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <EyeOff className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 ml-4">
                                <button
                                  onClick={() => toggleRequestExpanded(request.id)}
                                  className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                  {expandedRequests.has(request.id) ? (
                                    <ChevronUp className="w-4 h-4 text-gray-500" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                  )}
                                </button>
                                
                                <div className="relative group">
                                  <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                    <MoreVertical className="w-4 h-4 text-gray-500" />
                                  </button>
                                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                    <button
                                      onClick={() => setEditingRequestId(request.id)}
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                                    >
                                      <Edit className="w-4 h-4" />
                                      <span>Edit Request</span>
                                    </button>
                                    <button
                                      onClick={() => duplicateRequest(request.id)}
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                                    >
                                      <Copy className="w-4 h-4" />
                                      <span>Duplicate</span>
                                    </button>
                                    <button
                                      onClick={() => moveRequest(request.id, 'up')}
                                      disabled={index === 0}
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50 flex items-center space-x-2"
                                    >
                                      <ChevronUp className="w-4 h-4" />
                                      <span>Move Up</span>
                                    </button>
                                    <button
                                      onClick={() => moveRequest(request.id, 'down')}
                                      disabled={index === formData.requests!.length - 1}
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50 flex items-center space-x-2"
                                    >
                                      <ChevronDown className="w-4 h-4" />
                                      <span>Move Down</span>
                                    </button>
                                    <div className="border-t border-gray-200">
                                      <button
                                        onClick={() => removeRequest(request.id)}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center space-x-2"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Request Details */}
                            {expandedRequests.has(request.id) && (
                              <div className="border-t border-gray-200 p-4 bg-gray-50">
                                <RequestEditor
                                  request={request}
                                  globalVariables={globalVariables}
                                  onUpdate={(updates) => updateRequest(request.id, updates)}
                                  compact={true}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Code className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">No requests in this chain</p>
                        <div className="flex justify-center space-x-3">
                          <button
                            onClick={() => setShowImportModal(true)}
                            className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Import from Collection</span>
                          </button>
                          <button
                            onClick={addNewRequest}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add First Request</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'variables' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Global Variables</h3>
                        <p className="text-sm text-gray-500">Variables shared across all requests in this chain</p>
                      </div>
                      <button
                        onClick={addGlobalVariable}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Variable</span>
                      </button>
                    </div>

                    {globalVariables.length > 0 ? (
                      <div className="space-y-3">
                        {globalVariables.map((variable) => (
                          <div key={variable.id} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                            <input
                              type="text"
                              value={variable.name}
                              onChange={(e) => updateGlobalVariable(variable.id, { name: e.target.value })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="Variable name"
                            />
                            <input
                              type="text"
                              value={variable.value}
                              onChange={(e) => updateGlobalVariable(variable.id, { value: e.target.value })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="Variable value"
                            />
                            <select
                              value={variable.type}
                              onChange={(e) => updateGlobalVariable(variable.id, { type: e.target.value as Variable['type'] })}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            >
                              <option value="string">String</option>
                              <option value="number">Number</option>
                              <option value="boolean">Boolean</option>
                              <option value="json">JSON</option>
                            </select>
                            <button
                              onClick={() => removeGlobalVariable(variable.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">No global variables defined</p>
                        <button
                          onClick={addGlobalVariable}
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add First Variable</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'extracted-variables' && (
                  <VariablesTable
                    requests={formData.requests || []}
                    executionLogs={executionLogs}
                    extractedVariables={extractedVariables}
                    isExecuting={isExecuting}
                    currentRequestIndex={currentRequestIndex}
                  />
                )}

                {activeTab === 'schedule' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Schedule Configuration</h3>
                    <div className="text-center py-8">
                      <Settings className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Scheduling configuration coming soon</p>
                    </div>
                  </div>
                )}

                {activeTab === 'execute' && (
                  <RequestExecutor
                    requests={formData.requests || []}
                    variables={[...globalVariables, ...(formData.variables || [])]}
                    onExecutionComplete={(logs, extractedVars) => {
                      console.log('Execution completed:', logs, extractedVars);
                      setExecutionLogs(logs);
                      // Update extracted variables for Variables Table
                      const newExtractedVars: Record<string, any> = {};
                      logs.forEach(log => {
                        if (log.extractedVariables) {
                          Object.assign(newExtractedVars, log.extractedVariables);
                        }
                      });
                      setExtractedVariables(newExtractedVars);
                    }}
                    onVariableUpdate={(variables) => {
                      setFormData({ ...formData, variables });
                    }}
                    onExecutionStateChange={(executing, requestIndex) => {
                      setIsExecuting(executing);
                      setCurrentRequestIndex(requestIndex);
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collection Import Modal */}
      {/* <CollectionImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportRequests}
      /> */}
    </div>
  );
}