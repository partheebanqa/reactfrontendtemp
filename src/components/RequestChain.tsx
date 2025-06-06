import React, { useState, useEffect, useRef } from 'react';
import { Plus, Play, Trash2, Plus as PlusIcon, Table, ChevronUp, ChevronDown, CheckCircle2, XCircle, Key, ChevronRight, GripVertical, FolderTree, X } from 'lucide-react';
import { ChainRequest, ChainResponse, VariableState, AuthExtractionState, DataVariable, Collection, CollectionRequest } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getAllPaths, getValueFromPath } from '../utils/jsonPaths';
import { processVariables } from '../utils/variableProcessor';
import RequestChainTabs from './RequestChainTabs';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Link } from 'react-router-dom';

interface RequestChainProps {
  onExecuteChain: (requests: ChainRequest[]) => Promise<void>;
  responses: ChainResponse[];
  collections?: Collection[];
  onRequestSelect?: (request: CollectionRequest) => void;
}

const RequestChain: React.FC<RequestChainProps> = ({
  onExecuteChain,
  responses,
  collections = [],
  onRequestSelect
}) => {
  const [requests, setRequests] = useState<ChainRequest[]>([]);
  const [variables, setVariables] = useState<Record<string, VariableState>>({});
  const [authExtractions, setAuthExtractions] = useState<Record<string, AuthExtractionState>>({});
  const [availablePaths, setAvailablePaths] = useState<Record<string, string[]>>({});
  const [showVariableTable, setShowVariableTable] = useState(false);
  const [showCollectionSelector, setShowCollectionSelector] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<'api' | 'name' | 'request' | 'xpath' | 'value' | 'status'>('api');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedRequests, setExpandedRequests] = useState<Record<string, boolean>>({});
  const [expandedResponses, setExpandedResponses] = useState<Record<string, boolean>>({});
  const [activeRequestTabs, setActiveRequestTabs] = useState<Record<string, 'params' | 'auth' | 'headers' | 'body'>>({});
  const pathSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const paths: Record<string, string[]> = {};
    responses.forEach(response => {
      if (response.data) {
        paths[response.requestId] = getAllPaths(response.data);
      }
    });
    setAvailablePaths(paths);

    const updatedVariables = { ...variables };
    Object.entries(variables).forEach(([varId, variable]) => {
      const response = responses.find(res => res.requestId === variable.requestId);
      if (response?.data) {
        const value = getValueFromPath(response.data, variable.path);
        updatedVariables[varId] = {
          ...variable,
          isValid: value !== undefined
        };
      }
    });
    setVariables(updatedVariables);
  }, [responses]);

  const addRequest = () => {
    const newRequest: ChainRequest = {
      id: uuidv4(),
      name: `Request ${requests.length + 1}`,
      method: 'GET',
      url: '',
      headers: {},
      params: {},
      body: '',
      variables: {},
      dependsOn: []
    };
    setRequests([...requests, newRequest]);
    setExpandedRequests(prev => ({ ...prev, [newRequest.id]: true }));
    setActiveRequestTabs(prev => ({ ...prev, [newRequest.id]: 'params' }));
  };

  const updateRequest = (id: string, updates: Partial<ChainRequest>) => {
    setRequests(requests.map(req => 
      req.id === id ? { ...req, ...updates } : req
    ));
  };

  const removeRequest = (id: string) => {
    setRequests(requests.filter(req => req.id !== id));
    const updatedVariables = { ...variables };
    Object.entries(updatedVariables).forEach(([key, value]) => {
      if (value.requestId === id) {
        delete updatedVariables[key];
      }
    });
    setVariables(updatedVariables);
    
    // Clean up related state
    const newExpandedRequests = { ...expandedRequests };
    delete newExpandedRequests[id];
    setExpandedRequests(newExpandedRequests);

    const newExpandedResponses = { ...expandedResponses };
    delete newExpandedResponses[id];
    setExpandedResponses(newExpandedResponses);

    const newActiveRequestTabs = { ...activeRequestTabs };
    delete newActiveRequestTabs[id];
    setActiveRequestTabs(newActiveRequestTabs);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(requests);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update dependsOn references
    const updatedItems = items.map((item, index) => {
      if (index > 0) {
        // Get all previous request IDs up to the current index
        const availableDependencies = items.slice(0, index).map(r => r.id);
        // Filter out any dependsOn that are no longer valid
        const validDependsOn = (item.dependsOn || []).filter(id => 
          availableDependencies.includes(id)
        );
        return { ...item, dependsOn: validDependsOn };
      }
      return { ...item, dependsOn: [] };
    });

    setRequests(updatedItems);
  };

  const addVariable = (requestId: string) => {
    const defaultName = `var${Object.keys(variables).length + 1}`;
    const varId = uuidv4();
    console.log({
        ...variables,
        [varId]: {
          requestId,
          path: '',
          isSelecting: true,
          name: defaultName,
          isValid: undefined
        }
      })
    setVariables({
      ...variables,
      [varId]: {
        requestId,
        path: '',
        isSelecting: true,
        name: defaultName,
        isValid: undefined
      }
    });
  };

  const updateVariable = (varId: string, updates: Partial<VariableState>) => {
    setVariables({
      ...variables,
      [varId]: {
        ...variables[varId],
        ...updates,
        isSelecting: false
      }
    });
  };

  const removeVariable = (varId: string) => {
    const updatedVariables = { ...variables };
    delete updatedVariables[varId];
    setVariables(updatedVariables);
  };

  const togglePathSelector = (varId: string) => {
    setVariables({
      ...variables,
      [varId]: {
        ...variables[varId],
        isSelecting: !variables[varId].isSelecting
      }
    });
  };

  const executeChain = () => {
    const resetVariables = Object.entries(variables).reduce((acc, [varId, variable]) => ({
      ...acc,
      [varId]: {
        ...variable,
        isValid: undefined
      }
    }), {});
    setVariables(resetVariables);

    // Get data repo variables from local storage
    const storedDataRepoVars = localStorage.getItem('dataRepoVariables');
    const dataRepoVariables: DataVariable[] = storedDataRepoVars ? JSON.parse(storedDataRepoVars) : [];

    const requestsWithVariables = requests.map(request => {
      const requestAuthExtraction = Object.values(authExtractions)
        .find(auth => auth.requestId === request.id);

      // Process URL and body with both chain and data repo variables
      const processedUrl = processVariables(request.url, variables, dataRepoVariables);
      const processedBody = request.body ? 
        processVariables(request.body, variables, dataRepoVariables) : 
        undefined;

      return {
        ...request,
        url: processedUrl,
        body: processedBody,
        variables: Object.entries(variables)
          .filter(([_, value]) => value.requestId === request.id)
          .reduce((acc, [_, value]) => ({
            ...acc,
            [value.name]: value.path
          }), {}),
        extractAuth: requestAuthExtraction ? {
          tokenPath: requestAuthExtraction.tokenPath,
          headerName: requestAuthExtraction.headerName
        } : undefined
      };
    });

    onExecuteChain(requestsWithVariables);
  };

  const handleRequestSelect = (request: CollectionRequest) => {
    const chainRequest: ChainRequest = {
      id: uuidv4(),
      name: request.name,
      method: request.request.method,
      url: request.request.url,
      headers: request.request.headers,
      params: request.request.params,
      body: request.request.body,
      variables: {},
      dependsOn: []
    };

    setRequests([...requests, chainRequest]);
    setShowCollectionSelector(false);
  };

  const toggleCollection = (collectionId: string) => {
    setExpandedCollections(prev => {
      const next = new Set(prev);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const toggleRequestExpansion = (requestId: string) => {
    setExpandedRequests(prev => ({
      ...prev,
      [requestId]: !prev[requestId]
    }));
  };

  const toggleResponseExpansion = (requestId: string) => {
    setExpandedResponses(prev => ({
      ...prev,
      [requestId]: !prev[requestId]
    }));
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-500';
    if (status >= 400) return 'text-red-500';
    return 'text-gray-500';
  };

  const renderCollectionSelector = () => {
    if (!showCollectionSelector) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Import from Collections</h2>
            <button
              onClick={() => setShowCollectionSelector(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {collections.map(collection => (
              <div key={collection.id} className="mb-4">
                <div className="flex items-center group">
                  <button
                    onClick={() => toggleCollection(collection.id)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <FolderTree size={16} />
                  </button>
                  <button
                    className="flex-1 px-2 py-1 text-sm text-left hover:bg-gray-100 rounded font-medium"
                    onClick={() => toggleCollection(collection.id)}
                  >
                    {collection.name}
                  </button>
                </div>

                {expandedCollections.has(collection.id) && (
                  <div className="ml-6 mt-2 space-y-2">
                    {collection.requests.map(request => (
                      <button
                        key={request.id}
                        onClick={() => handleRequestSelect(request)}
                        className="w-full px-2 py-1 text-sm text-left hover:bg-gray-100 rounded flex items-center gap-2"
                      >
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          {request.request.method}
                        </span>
                        <span>{request.name}</span>
                      </button>
                    ))}

                    {collection.folders.map(folder => (
                      <div key={folder.id}>
                        <div className="flex items-center group">
                          <button
                            onClick={() => toggleFolder(folder.id)}
                            className="p-1 text-gray-500 hover:text-gray-700"
                          >
                            <FolderTree size={16} />
                          </button>
                          <button
                            className="flex-1 px-2 py-1 text-sm text-left hover:bg-gray-100 rounded"
                            onClick={() => toggleFolder(folder.id)}
                          >
                            {folder.name}
                          </button>
                        </div>

                        {expandedFolders.has(folder.id) && (
                          <div className="ml-6 mt-2 space-y-2">
                            {folder.requests.map(request => (
                              <button
                                key={request.id}
                                onClick={() => handleRequestSelect(request)}
                                className="w-full px-2 py-1 text-sm text-left hover:bg-gray-100 rounded flex items-center gap-2"
                              >
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                  {request.request.method}
                                </span>
                                <span>{request.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow mb-4">
        <div className="flex items-center justify-between pt-3 pl-2 pr-2">
            {/* Left Side Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => setShowCollectionSelector(true)}
                className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 flex items-center gap-1"
              >
                <FolderTree size={16} />
                Import from Collections
              </button>
              <button
                onClick={addRequest}
                className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 flex items-center gap-1"
              >
                <Plus size={16} />
                Add Request
              </button>
            </div>

            {/* Right Side Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => setShowVariableTable(!showVariableTable)}
                className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-1 ${
                  showVariableTable
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                <Table size={16} />
                Variables Table
              </button>
              <button
                onClick={executeChain}
                disabled={requests.length === 0}
                className="px-3 py-1.5 text-sm bg-green-50 text-green-600 rounded-md hover:bg-green-100 flex items-center gap-1 disabled:opacity-50"
              >
                <Play size={16} />
                Execute Chain
              </button>
            </div>
          </div>
        {showVariableTable && (
          <div className="p-4 border-b border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variable Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Path
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(variables).map(([varId, variable], index) => {
                    const request = requests.find(r => r.id === variable.requestId);
                    const response = responses.find(r => r.requestId === variable.requestId);
                    const value = response?.data ? getValueFromPath(response.data, variable.path) : undefined;

                    return (
                      <tr key={varId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${variable.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {variable.path}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {value !== undefined ? JSON.stringify(value) : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {variable.isValid !== undefined && (
                            variable.isValid ? (
                              <CheckCircle2 className="text-green-500" size={18} />
                            ) : (
                              <XCircle className="text-red-500" size={18} />
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="requests">
            {(provided) => (
              <div 
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="p-4"
              >
                {requests.map((request, index) => {
                  const response = responses.find(res => res.requestId === request.id);
                  
                  return (
                    <Draggable 
                      key={request.id} 
                      draggableId={request.id} 
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`mb-6 last:mb-0 border border-gray-200 rounded-lg ${
                            snapshot.isDragging ? 'shadow-lg' : ''
                          }`}
                        >
                          <div className="border-b border-gray-200">
                            <div className="flex items-center">
                              <div
                                {...provided.dragHandleProps}
                                className="px-4 py-4 cursor-grab hover:bg-gray-50 text-gray-400"
                              >
                                <GripVertical size={16} />
                              </div>
                              <button
                                onClick={() => toggleRequestExpansion(request.id)}
                                className="flex-1 flex items-center justify-between p-4 hover:bg-gray-50"
                              >
                                <div className="flex items-center gap-4">
                                  <ChevronRight
                                    size={16}
                                    className={`transform transition-transform ${
                                      expandedRequests[request.id] ? 'rotate-90' : ''
                                    }`}
                                  />
                                  <input
                                    type="text"
                                    value={request.name}
                                    onChange={(e) => updateRequest(request.id, { name: e.target.value })}
                                    className="text-sm font-medium px-2 py-1 border border-gray-200 rounded"
                                    placeholder="Request Name"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                      {request.method}
                                    </span>
                                    <span className="text-sm text-gray-600">{request.url}</span>
                                  </div>
                                </div>
                                {response && (
                                  <div className="flex items-center gap-2">
                                    <div className={`flex items-center gap-1 ${getStatusColor(response.status)}`}>
                                      {response.status >= 200 && response.status < 300 ? (
                                        <CheckCircle2 size={16} />
                                      ) : (
                                        <XCircle size={16} />
                                      )}
                                      <span className="text-sm font-medium">{response.status}</span>
                                    </div>
                                    {response.responseTime && (
                                      <span className="text-sm text-gray-500">
                                        {response.responseTime.toFixed(2)}s
                                      </span>
                                    )}
                                  </div>
                                )}
                              </button>
                              <button
                                onClick={() => removeRequest(request.id)}
                                className="px-4 text-red-500 hover:text-red-600"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            {expandedRequests[request.id] && (
                              <div className="p-4 border-t border-gray-200">
                                <div className="flex gap-4 mb-4">
                                  <select
                                    value={request.method}
                                    onChange={(e) => updateRequest(request.id, { method: e.target.value })}
                                    className="text-sm bg-blue-50 text-blue-600 px-2 py-1 rounded"
                                  >
                                    {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(method => (
                                      <option key={method} value={method}>{method}</option>
                                    ))}
                                  </select>
                                  <div className="flex-1">
                                    <input
                                      type="text"
                                      value={request.url}
                                      onChange={(e) => updateRequest(request.id, { url: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-200 rounded"
                                      placeholder="Enter URL"
                                    />
                                  </div>
                                </div>

                                <RequestChainTabs
                                  request={request}
                                  onUpdate={(updates) => updateRequest(request.id, updates)}
                                  activeTab={activeRequestTabs[request.id] || 'params'}
                                  onTabChange={(tab) => setActiveRequestTabs(prev => ({ ...prev, [request.id]: tab }))}
                                  variables={variables}
                                />

                                <div className="mt-4 border-t border-gray-200 pt-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-medium text-gray-700">Extract Variables</h3>
                                    <button
                                      onClick={() => addVariable(request.id)}
                                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                      disabled={!responses.find(res => res.requestId === request.id)?.data}
                                    >
                                      <PlusIcon size={14} />
                                      Add Variable
                                    </button>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    {Object.entries(variables)
                                      .filter(([_, value]) => value.requestId === request.id)
                                      .map(([varId, value]) => (
                                        <div key={varId} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                                          <input
                                            type="text"
                                            value={value.name}
                                            onChange={(e) => updateVariable(varId, { name: e.target.value })}
                                            className="text-sm px-2 py-1 border border-gray-200 rounded w-32"
                                            placeholder="Name"
                                          />
                                          <code className="text-sm bg-gray-100 px-2 py-1 rounded w-32 truncate">
                                            ${value.name}
                                          </code>
                                          <div className="flex-1 relative" ref={pathSelectorRef}>
                                            <input
                                              type="text"
                                              value={value.path}
                                              onChange={(e) => updateVariable(varId, { path: e.target.value })}
                                              onClick={() => togglePathSelector(varId)}
                                              className="w-full text-sm px-2 py-1 border border-gray-200 rounded cursor-pointer"
                                              placeholder="Click to select path"
                                              readOnly
                                            />
                                            {value.isSelecting && availablePaths[request.id] && (
                                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                                {availablePaths[request.id].map((path) => (
                                                  <button
                                                    key={path}
                                                    onClick={() => updateVariable(varId, { path })}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                                                  >
                                                    <span>{path}</span>
                                                    <span className="text-gray-500">
                                                      {getValueFromPath(response?.data, path)} 
                                                    </span>
                                                  </button>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                          <div className="w-32 text-sm text-gray-500 truncate">
                                            {getValueFromPath(response?.data, value.path)}
                                          </div>
                                          {value.isValid !== undefined && (
                                            <div className="w-6">
                                              {value.isValid ? (
                                                <CheckCircle2 className="text-green-500" size={18} />
                                              ) : (
                                                <XCircle className="text-red-500" size={18} />
                                              )}
                                            </div>
                                          )}
                                          <button
                                            onClick={() => removeVariable(varId)}
                                            className="text-red-500 hover:text-red-600"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {response && (
                            <div>
                              <button
                                onClick={() => toggleResponseExpansion(request.id)}
                                className="flex items-center gap-2 w-full p-4 hover:bg-gray-50"
                              >
                                <ChevronRight
                                  size={16}
                                  className={`transform transition-transform ${
                                    expandedResponses[request.id] ? 'rotate-90' : ''
                                  }`}
                                />
                                <span className="font-medium">Response</span>
                                <div className={`flex items-center gap-1 ${getStatusColor(response.status)}`}>
                                  {response.status >= 200 && response.status < 300 ? (
                                    <CheckCircle2 size={16} />
                                  ) : (
                                    <XCircle size={16} />
                                  )}
                                  <span className="text-sm font-medium">{response.status}</span>
                                </div>
                              </button>
                              {expandedResponses[request.id] && (
                                <div className="p-4 border-t border-gray-200">
                                  <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded text-sm overflow-auto max-h-96">
                                    {JSON.stringify(response.data, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {renderCollectionSelector()}
      </div>
    </div>
  );
};

export default RequestChain;