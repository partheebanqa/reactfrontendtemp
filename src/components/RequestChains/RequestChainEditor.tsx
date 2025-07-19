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
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RequestChain,
  APIRequest,
  Variable,
} from '@/shared/types/requestChain.model';
import { ImportModal } from '@/components/TestSuit/ImportModal';
import { ExtendedRequest } from '@/models/collection.model';
import { RequestEditor } from '@/components/RequestChains/RequestEditor';

interface RequestChainEditorProps {
  chain?: RequestChain;
  onBack: () => void;
  onSave: (chain: RequestChain) => void;
}

export function RequestChainEditor({
  chain,
  onBack,
  onSave,
}: RequestChainEditorProps) {
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
      timezone: 'UTC',
    },
  });

  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(
    new Set()
  );
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [globalVariables, setGlobalVariables] = useState<Variable[]>([
    {
      id: '1',
      name: 'baseUrl',
      value: 'https://api.example.com',
      type: 'string',
    },
    { id: '2', name: 'apiKey', value: 'your-api-key', type: 'string' },
    { id: '3', name: 'timeout', value: '5000', type: 'number' },
  ]);

  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const [extractedVariables, setExtractedVariables] = useState<
    Record<string, any>
  >({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentRequestIndex, setCurrentRequestIndex] = useState(-1);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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
      authType: 'none',
    };

    setFormData({
      ...formData,
      requests: [...(formData.requests || []), newRequest],
    });
    setExpandedRequests(new Set([...expandedRequests, newRequest.id]));
  };

  const removeRequest = (requestId: string) => {
    setFormData({
      ...formData,
      requests: formData.requests?.filter((req) => req.id !== requestId) || [],
    });
    const newExpanded = new Set(expandedRequests);
    newExpanded.delete(requestId);
    setExpandedRequests(newExpanded);
  };

  const updateRequest = (requestId: string, updates: Partial<APIRequest>) => {
    setFormData({
      ...formData,
      requests:
        formData.requests?.map((req) =>
          req.id === requestId ? { ...req, ...updates } : req
        ) || [],
    });
  };

  const duplicateRequest = (requestId: string) => {
    const request = formData.requests?.find((r) => r.id === requestId);
    if (request) {
      const duplicated = {
        ...request,
        id: Date.now().toString(),
        name: `${request.name} (Copy)`,
      };
      setFormData({
        ...formData,
        requests: [...(formData.requests || []), duplicated],
      });
    }
  };

  const moveRequest = (requestId: string, direction: 'up' | 'down') => {
    const requests = [...(formData.requests || [])];
    const index = requests.findIndex((r) => r.id === requestId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= requests.length) return;

    [requests[index], requests[newIndex]] = [
      requests[newIndex],
      requests[index],
    ];
    setFormData({ ...formData, requests });
  };

  const handleSave = () => {
    if (!formData.name) {
      alert('Please enter a chain name');
      return;
    }

    const chainData: RequestChain = {
      id: chain?.id || Date.now().toString(),
      workspaceId: '1',
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
      successRate: chain?.successRate || 0,
    };

    onSave(chainData);
  };

  const getMethodColor = (method: string) => {
    const colors = {
      GET: 'bg-green-100 text-green-800',
      POST: 'bg-blue-100 text-blue-800',
      PUT: 'bg-orange-100 text-orange-800',
      DELETE: 'bg-red-100 text-red-800',
      PATCH: 'bg-purple-100 text-purple-800',
      HEAD: 'bg-gray-100 text-gray-800',
      OPTIONS: 'bg-yellow-100 text-yellow-800',
    };
    return colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const addGlobalVariable = () => {
    const newVar: Variable = {
      id: Date.now().toString(),
      name: '',
      value: '',
      type: 'string',
    };
    setGlobalVariables([...globalVariables, newVar]);
  };

  const updateGlobalVariable = (id: string, updates: Partial<Variable>) => {
    setGlobalVariables(
      globalVariables.map((v) => (v.id === id ? { ...v, ...updates } : v))
    );
  };

  const removeGlobalVariable = (id: string) => {
    setGlobalVariables(globalVariables.filter((v) => v.id !== id));
  };

  const handleImportRequests = (importedRequests: ExtendedRequest[]) => {
    const transformedRequests: APIRequest[] = importedRequests.map((req) => ({
      id: req.id,
      name: req.name,
      method: req.method as
        | 'GET'
        | 'POST'
        | 'PUT'
        | 'DELETE'
        | 'PATCH'
        | 'HEAD'
        | 'OPTIONS',
      url: req.endpoint || req.url || '',
      headers: [],
      params: [],
      bodyType: 'none' as const,
      timeout: 5000,
      retries: 0,
      errorHandling: 'stop' as const,
      dataExtractions: [],
      testScripts: [],
      enabled: true,
      authType: 'none' as const,
    }));

    setFormData({
      ...formData,
      requests: [...(formData.requests || []), ...transformedRequests],
    });

    // Expand newly imported requests
    const newExpanded = new Set([
      ...expandedRequests,
      ...transformedRequests.map((r) => r.id),
    ]);
    setExpandedRequests(newExpanded);

    setIsImportModalOpen(false);
  };

  // Mock RequestExecutor component since it doesn't exist
  const RequestExecutor = ({
    requests,
    variables,
    onExecutionComplete,
    onVariableUpdate,
    onExecutionStateChange,
  }: any) => (
    <div className='p-4 border rounded'>
      <p>Request Executor</p>
      <p className='text-sm text-muted-foreground'>
        Mock component - implement as needed
      </p>
    </div>
  );

  // Mock VariablesTable component since it doesn't exist
  const VariablesTable = ({
    requests,
    executionLogs,
    extractedVariables,
    isExecuting,
    currentRequestIndex,
  }: any) => (
    <div className='p-4 border rounded'>
      <p>Variables Table</p>
      <p className='text-sm text-muted-foreground'>
        Mock component - implement as needed
      </p>
    </div>
  );

  // If editing a specific request, show the request editor
  if (editingRequestId) {
    const request = formData.requests?.find((r) => r.id === editingRequestId);
    if (request) {
      return (
        <div className='h-full flex flex-col'>
          <div className='flex-shrink-0 border-b bg-background px-6 py-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-4'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setEditingRequestId(null)}
                >
                  <ArrowLeft className='w-4 h-4' />
                </Button>
                <div>
                  <h1 className='text-xl font-semibold'>Edit Request</h1>
                  <p className='text-sm text-muted-foreground'>
                    Configure your API request
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className='flex-1 overflow-auto p-6'>
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
    <div className='h-full flex flex-col'>
      {/* Header */}
      <div className='flex-shrink-0 border-b bg-background px-6 py-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <Button variant='ghost' size='sm' onClick={onBack}>
              <ArrowLeft className='w-4 h-4' />
            </Button>
            <div>
              <h1 className='text-xl font-semibold'>
                {chain ? 'Edit Request Chain' : 'Create Request Chain'}
              </h1>
              <p className='text-sm text-muted-foreground'>
                Configure your API automation workflow
              </p>
            </div>
          </div>
          <div className='flex items-center space-x-3'>
            <Button onClick={handleSave} className='gap-2'>
              <Save className='w-4 h-4' />
              Save Chain
            </Button>
          </div>
        </div>
      </div>

      <div className='flex-1 overflow-auto'>
        <div className='p-6 space-y-6'>
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='chainName'>Chain Name *</Label>
                  <Input
                    id='chainName'
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder='Enter chain name'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='status'>Status</Label>
                  <Select
                    value={formData.enabled ? 'enabled' : 'disabled'}
                    onValueChange={(value) =>
                      setFormData({ ...formData, enabled: value === 'enabled' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='enabled'>Enabled</SelectItem>
                      <SelectItem value='disabled'>Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='description'>Description</Label>
                <Textarea
                  id='description'
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder='Describe what this chain does'
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue='requests' className='w-full'>
            <TabsList className='grid w-full grid-cols-4'>
              <TabsTrigger value='requests' className='gap-2'>
                <Code className='w-4 h-4' />
                Requests ({formData.requests?.length || 0})
              </TabsTrigger>
              <TabsTrigger value='variables' className='gap-2'>
                <Globe className='w-4 h-4' />
                Variables ({globalVariables.length})
              </TabsTrigger>
              <TabsTrigger value='variables-table' className='gap-2'>
                <Database className='w-4 h-4' />
                Variables Table
              </TabsTrigger>
              <TabsTrigger value='execute' className='gap-2'>
                <Play className='w-4 h-4' />
                Execute & Test
              </TabsTrigger>
            </TabsList>

            <TabsContent value='requests' className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-medium'>Request Chain</h3>
                <div className='flex items-center space-x-2'>
                  <Button
                    variant='outline'
                    onClick={() => setIsImportModalOpen(true)}
                    className='gap-2'
                  >
                    <Download className='w-4 h-4' />
                    Import Request
                  </Button>
                  <Button onClick={addNewRequest} className='gap-2'>
                    <Plus className='w-4 h-4' />
                    Add Request
                  </Button>
                </div>
              </div>

              {formData.requests && formData.requests.length > 0 ? (
                <div className='space-y-3'>
                  {formData.requests.map((request, index) => (
                    <Card
                      key={request.id}
                      className='hover:shadow-sm transition-shadow'
                    >
                      <CardContent className='p-4'>
                        <div className='flex items-center'>
                          <div className='flex items-center space-x-3'>
                            <div
                              className='cursor-move'
                              draggable
                              onDragStart={() => handleDragStart(index)}
                              onDragEnter={() => handleDragEnter(index)}
                              onDragEnd={handleDragEnd}
                            >
                              <GripVertical className='w-5 h-5 text-muted-foreground' />
                            </div>

                            <div className='w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium'>
                              {index + 1}
                            </div>
                          </div>

                          <div className='flex-1 flex items-center space-x-4 ml-3'>
                            <Badge className={getMethodColor(request.method)}>
                              {request.method}
                            </Badge>
                            <div className='flex-1'>
                              <p className='font-medium'>{request.name}</p>
                              <p className='text-sm text-muted-foreground'>
                                {request.url || 'No URL specified'}
                              </p>
                            </div>
                            <div className='flex items-center space-x-2'>
                              {request.enabled ? (
                                <Eye className='w-4 h-4 text-green-500' />
                              ) : (
                                <EyeOff className='w-4 h-4 text-muted-foreground' />
                              )}
                            </div>
                          </div>

                          <div className='flex items-center space-x-2 ml-4'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => toggleRequestExpanded(request.id)}
                            >
                              {expandedRequests.has(request.id) ? (
                                <ChevronUp className='w-4 h-4' />
                              ) : (
                                <ChevronDown className='w-4 h-4' />
                              )}
                            </Button>

                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => setEditingRequestId(request.id)}
                            >
                              <Edit className='w-4 h-4' />
                            </Button>

                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => duplicateRequest(request.id)}
                            >
                              <Copy className='w-4 h-4' />
                            </Button>

                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => removeRequest(request.id)}
                              className='text-red-600 hover:text-red-700'
                            >
                              <Trash2 className='w-4 h-4' />
                            </Button>
                          </div>
                        </div>

                        {expandedRequests.has(request.id) && (
                          <div className='mt-4 pt-4 border-t'>
                            <RequestEditor
                              request={request}
                              globalVariables={globalVariables}
                              onUpdate={(updates) =>
                                updateRequest(request.id, updates)
                              }
                              compact={true}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className='text-center py-8'>
                  <Code className='w-12 h-12 text-muted-foreground mx-auto mb-3' />
                  <p className='text-muted-foreground mb-4'>
                    No requests in this chain
                  </p>
                  <div className='flex items-center justify-center space-x-3'>
                    <Button
                      variant='outline'
                      onClick={() => setIsImportModalOpen(true)}
                      className='gap-2'
                    >
                      <Download className='w-4 h-4' />
                      Import from Collection
                    </Button>
                    <Button onClick={addNewRequest} className='gap-2'>
                      <Plus className='w-4 h-4' />
                      Add Request
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value='variables' className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='text-lg font-medium'>Global Variables</h3>
                  <p className='text-sm text-muted-foreground'>
                    Variables shared across all requests in this chain
                  </p>
                </div>
                <Button onClick={addGlobalVariable} className='gap-2'>
                  <Plus className='w-4 h-4' />
                  Add Variable
                </Button>
              </div>

              {globalVariables.length > 0 ? (
                <div className='space-y-3'>
                  {globalVariables.map((variable) => (
                    <Card key={variable.id}>
                      <CardContent className='p-4'>
                        <div className='flex items-center space-x-3'>
                          <div className='flex-1'>
                            <Input
                              value={variable.name}
                              onChange={(e) =>
                                updateGlobalVariable(variable.id, {
                                  name: e.target.value,
                                })
                              }
                              placeholder='Variable name'
                            />
                          </div>
                          <div className='flex-1'>
                            <Input
                              value={variable.value}
                              onChange={(e) =>
                                updateGlobalVariable(variable.id, {
                                  value: e.target.value,
                                })
                              }
                              placeholder='Variable value'
                            />
                          </div>
                          <Select
                            value={variable.type}
                            onValueChange={(value: Variable['type']) =>
                              updateGlobalVariable(variable.id, { type: value })
                            }
                          >
                            <SelectTrigger className='w-32'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='string'>String</SelectItem>
                              <SelectItem value='number'>Number</SelectItem>
                              <SelectItem value='boolean'>Boolean</SelectItem>
                              <SelectItem value='json'>JSON</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => removeGlobalVariable(variable.id)}
                            className='text-red-600'
                          >
                            <Trash2 className='w-4 h-4' />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className='text-center py-8'>
                  <Globe className='w-12 h-12 text-muted-foreground mx-auto mb-3' />
                  <p className='text-muted-foreground mb-4'>
                    No global variables defined
                  </p>
                  <Button onClick={addGlobalVariable} className='gap-2'>
                    <Plus className='w-4 h-4' />
                    Add First Variable
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value='variables-table'>
              <VariablesTable
                requests={formData.requests || []}
                executionLogs={executionLogs}
                extractedVariables={extractedVariables}
                isExecuting={isExecuting}
                currentRequestIndex={currentRequestIndex}
              />
            </TabsContent>

            <TabsContent value='execute'>
              <RequestExecutor
                requests={formData.requests || []}
                variables={[...globalVariables, ...(formData.variables || [])]}
                onExecutionComplete={(logs, extractedVars) => {
                  setExecutionLogs(logs);
                  const newExtractedVars: Record<string, any> = {};
                  logs.forEach((log) => {
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
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportRequests}
        importedRequestIds={formData.requests?.map((r) => r.id) || []}
      />
    </div>
  );
}
