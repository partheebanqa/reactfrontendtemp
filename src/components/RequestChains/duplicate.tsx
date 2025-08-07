import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  GripVertical,
  Trash2,
  Edit,
  Play,
  Save,
  Eye,
  EyeOff,
  ChevronDown,
  Code,
  Globe,
  Download,
  ChevronUp,
  Copy,
  Database,
  Loader2,
  PlayCircle,
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
import { useToast } from '@/hooks/use-toast';
import {
  RequestChain,
  APIRequest,
  Variable,
  Environment,
} from '@/types/request';
import { RequestExecutor } from './RequestExecutor';
import { RequestEditor } from './RequestEditor';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { VariablesTable } from './VariablesTable';

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
  const { toast } = useToast();
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Mock workspace and environments - replace with actual hooks
  const currentWorkspace = { id: 'workspace-1' };
  const environments: Environment[] = [
    {
      id: 'env-1',
      name: 'Development',
      baseUrl: 'https://api-dev.example.com',
      variables: [
        {
          id: 'v1',
          name: 'baseUrl',
          value: 'https://api-dev.example.com',
          type: 'string',
        },
        { id: 'v2', name: 'apiKey', value: 'dev-key-123', type: 'string' },
      ],
    },
    {
      id: 'env-2',
      name: 'Production',
      baseUrl: 'https://api.example.com',
      variables: [
        {
          id: 'v3',
          name: 'baseUrl',
          value: 'https://api.example.com',
          type: 'string',
        },
        { id: 'v4', name: 'apiKey', value: 'prod-key-456', type: 'string' },
      ],
    },
  ];
  const activeEnvironment = environments[0];

  const [formData, setFormData] = useState<Partial<RequestChain>>({
    name: chain?.name || '',
    description: chain?.description || '',
    workspaceId: currentWorkspace?.id || '',
    enabled: chain?.enabled ?? true,
    requests: chain?.requests || [],
    variables: chain?.variables || [],
    environmentId: chain?.environmentId || environments[0]?.id,
  });

  const [selectedEnvironment, setSelectedEnvironment] = useState<string>(
    chain?.environmentId || environments[0]?.id || ''
  );

  useEffect(() => {
    if (activeEnvironment) {
      setSelectedEnvironment(activeEnvironment.id);
    }
  }, [activeEnvironment]);

  const handleEnvironmentChange = (environmentId: string) => {
    setSelectedEnvironment(environmentId);
    setFormData({ ...formData, environmentId });
  };

  const isSaveDisabled =
    !formData.name?.trim() || (formData.requests?.length ?? 0) === 0;

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
  const [activeTab, setActiveTab] = useState('requests');

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

  const saveChain = async (): Promise<RequestChain | null> => {
    if (!formData.name) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a chain name',
        variant: 'destructive',
      });
      return null;
    }

    const existingChains: RequestChain[] = JSON.parse(
      localStorage.getItem('requestChains') || '[]'
    );

    const chainData: RequestChain = {
      id: chain?.id || Date.now().toString(),
      workspaceId: formData.workspaceId || '',
      name: formData.name,
      description: formData.description,
      environmentId: selectedEnvironment,
      requests: formData.requests || [],
      variables: formData.variables || [],
      enabled: formData.enabled || false,
      createdAt: chain?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastExecuted: chain?.lastExecuted,
      executionCount: chain?.executionCount || 0,
      successRate: chain?.successRate || 0,
    };

    const updatedChains = [...existingChains];
    const existingIndex = updatedChains.findIndex((c) => c.id === chainData.id);

    if (existingIndex !== -1) {
      updatedChains[existingIndex] = chainData;
    } else {
      updatedChains.push(chainData);
    }

    localStorage.setItem('requestChains', JSON.stringify(updatedChains));
    onSave(chainData);
    return chainData;
  };

  const handleSave = async () => {
    const saved = await saveChain();
    if (saved) {
      toast({
        title: 'Chain Saved',
        description: 'Your request chain has been saved successfully.',
      });
    }
    return saved;
  };

  const getMethodColor = (method: string) => {
    const methodLower = method.toLowerCase();
    return `method-${methodLower}`;
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

  const handleRunAll = async () => {
    if (!formData.requests || formData.requests.length === 0) {
      toast({
        title: 'No Requests',
        description: 'Add some requests to the chain before running',
        variant: 'destructive',
      });
      return;
    }

    // Save the chain first
    const savedChain = await saveChain();
    if (!savedChain) {
      return;
    }

    // Switch to the execute tab and trigger execution
    setActiveTab('execute');

    toast({
      title: 'Starting Execution',
      description: 'Running all requests in the chain...',
    });
  };

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
              chainName={formData.name}
              chainDescription={formData.description}
              chainEnabled={formData.enabled}
            />
          </div>
        </div>
      );
    }
  }

  return (
    <div className='h-full flex flex-col bg-background'>
      {/* Header */}
      <div className='flex-shrink-0 border-b bg-card px-6 py-4 card-elevated'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <Button
              variant='ghost'
              size='sm'
              onClick={onBack}
              className='transition-fast'
            >
              <ArrowLeft className='w-4 h-4' />
            </Button>
            <div>
              <h1 className='text-xl font-semibold text-foreground'>
                {chain ? 'Edit Request Chain' : 'Create Request Chain'}
              </h1>
              <p className='text-sm text-muted-foreground'>
                Configure your API automation workflow
              </p>
            </div>
          </div>
          <div className='flex items-center space-x-3'>
            <Button
              onClick={handleSave}
              disabled={isSaveDisabled}
              className='gap-2 gradient-primary transition-smooth'
            >
              <Save className='w-4 h-4' />
              Save Chain
            </Button>
          </div>
        </div>
      </div>

      <div className='flex-1 overflow-auto'>
        <div className='p-6 space-y-6'>
          {/* Basic Information */}
          <Card className='transition-smooth hover:shadow-md'>
            <CardHeader>
              <CardTitle className='text-foreground'>
                Basic Information
              </CardTitle>
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
                    className='transition-fast'
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
                  className='transition-fast'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='environment-select'>
                  Environment <span className='text-destructive'>*</span>
                </Label>
                <Select
                  value={selectedEnvironment}
                  onValueChange={handleEnvironmentChange}
                >
                  <SelectTrigger id='environment-select'>
                    <SelectValue placeholder='Select environment' />
                  </SelectTrigger>
                  <SelectContent>
                    {environments.map((env) => (
                      <SelectItem key={env.id} value={env.id}>
                        <div className='flex flex-col text-left'>
                          <span className='font-medium text-sm'>
                            {env.name}
                          </span>
                          <span className='text-xs text-muted-foreground break-all'>
                            {env.baseUrl}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className='w-full'
          >
            <TabsList className='grid w-full grid-cols-4 bg-muted'>
              <TabsTrigger value='requests' className='gap-2 transition-fast'>
                <Code className='w-4 h-4' />
                Requests ({formData.requests?.length || 0})
              </TabsTrigger>
              <TabsTrigger value='variables' className='gap-2 transition-fast'>
                <Globe className='w-4 h-4' />
                Global Variables ({globalVariables.length})
              </TabsTrigger>
              <TabsTrigger
                value='variables-table'
                className='gap-2 transition-fast'
              >
                <Database className='w-4 h-4' />
                Variables Table
              </TabsTrigger>
              <TabsTrigger value='execute' className='gap-2 transition-fast'>
                <Play className='w-4 h-4' />
                Execute & Test
              </TabsTrigger>
            </TabsList>

            <TabsContent value='requests' className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-medium text-foreground'>
                  Request Chain
                </h3>
                <div className='flex items-center space-x-2'>
                  <Button
                    variant='outline'
                    onClick={handleRunAll}
                    disabled={isExecuting || !formData.requests?.length}
                    className='gap-2 transition-smooth'
                  >
                    {isExecuting ? (
                      <Loader2 className='w-4 h-4 animate-spin' />
                    ) : (
                      <PlayCircle className='w-4 h-4' />
                    )}
                    {isExecuting ? 'Running...' : 'Run All'}
                  </Button>
                  <Button onClick={addNewRequest} className='transition-smooth'>
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
                      className={`transition-smooth hover:shadow-md ${
                        currentRequestIndex === index
                          ? 'execution-glow ring-2 ring-primary'
                          : ''
                      }`}
                    >
                      <CardContent className='p-4'>
                        <div className='flex items-center'>
                          <div className='flex items-center space-x-3'>
                            <div
                              className='cursor-move opacity-60 hover:opacity-100 transition-fast'
                              draggable
                              onDragStart={() => handleDragStart(index)}
                              onDragEnter={() => handleDragEnter(index)}
                              onDragEnd={handleDragEnd}
                            >
                              <GripVertical className='w-5 h-5 text-muted-foreground' />
                            </div>
                            <div
                              className={`w-8 h-8 ${
                                currentRequestIndex === index
                                  ? 'gradient-execution text-primary-foreground animate-pulse'
                                  : 'bg-blue-100 text-blue-600'
                              } rounded-full flex items-center justify-center text-sm font-medium transition-smooth`}
                            >
                              {currentRequestIndex === index ? (
                                <Loader2 className='w-4 h-4 animate-spin' />
                              ) : (
                                index + 1
                              )}
                            </div>
                          </div>

                          <div className='flex-1 flex items-center space-x-4 ml-3'>
                            <Badge
                              className={`method-badge ${getMethodColor(
                                request.method
                              )}`}
                            >
                              {request.method}
                            </Badge>
                            <div className='flex-1'>
                              <p className='font-medium text-foreground'>
                                {request.name}
                              </p>
                              <p className='text-sm text-muted-foreground'>
                                {request.url || 'No URL specified'}
                              </p>
                              {request.headers &&
                                request.headers.length > 0 && (
                                  <p className='text-xs text-blue-600'>
                                    {request.headers.length} headers
                                  </p>
                                )}
                              {request.params && request.params.length > 0 && (
                                <p className='text-xs text-green-600'>
                                  {request.params.length} params
                                </p>
                              )}
                            </div>
                            <div className='flex items-center space-x-2'>
                              {request.enabled ? (
                                <Eye className='w-4 h-4 text-green-500' />
                              ) : (
                                <EyeOff className='w-4 h-4 text-muted-foreground' />
                              )}
                            </div>
                          </div>

                          <TooltipProvider>
                            <div className='flex items-center space-x-2 ml-4'>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() =>
                                      toggleRequestExpanded(request.id)
                                    }
                                    className='transition-fast'
                                  >
                                    {expandedRequests.has(request.id) ? (
                                      <ChevronUp className='w-4 h-4' />
                                    ) : (
                                      <ChevronDown className='w-4 h-4' />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {expandedRequests.has(request.id)
                                    ? 'Collapse'
                                    : 'Expand'}{' '}
                                  Request
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() =>
                                      setEditingRequestId(request.id)
                                    }
                                    className='transition-fast'
                                  >
                                    <Edit className='w-4 h-4' />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit Request</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => duplicateRequest(request.id)}
                                    className='transition-fast'
                                  >
                                    <Copy className='w-4 h-4' />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Duplicate Request
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => removeRequest(request.id)}
                                    className='text-red-600 hover:text-red-700 transition-fast'
                                  >
                                    <Trash2 className='w-4 h-4' />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete Request</TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        </div>

                        {expandedRequests.has(request.id) && (
                          <div className='mt-4 pt-4 border-t transition-smooth'>
                            <RequestEditor
                              request={request}
                              globalVariables={globalVariables}
                              onUpdate={(updates) =>
                                updateRequest(request.id, updates)
                              }
                              compact={true}
                              chainName={formData.name}
                              chainDescription={formData.description}
                              chainEnabled={formData.enabled}
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
                      onClick={addNewRequest}
                      className='transition-smooth'
                    >
                      <Plus className='w-4 h-4 mr-2' />
                      Add First Request
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value='variables' className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='text-lg font-medium text-foreground'>
                    Global Variables
                  </h3>
                  <p className='text-sm text-muted-foreground'>
                    Variables shared across all requests in this chain
                  </p>
                </div>
                <Button
                  onClick={addGlobalVariable}
                  className='gap-2 transition-smooth'
                >
                  <Plus className='w-4 h-4' />
                  Add Variable
                </Button>
              </div>

              {globalVariables.length > 0 ? (
                <div className='space-y-3'>
                  {globalVariables.map((variable) => (
                    <Card
                      key={variable.id}
                      className='transition-smooth hover:shadow-sm'
                    >
                      <CardContent className='p-4'>
                        <div className='flex items-center space-x-3'>
                          <div className='flex-1'>
                            <Input
                              value={variable.name}
                              onChange={(e) =>
                                updateGlobalVariable(variable.id ?? '', {
                                  name: e.target.value,
                                })
                              }
                              placeholder='Variable name'
                              className='transition-fast'
                            />
                          </div>
                          <div className='flex-1'>
                            <Input
                              value={variable.value}
                              onChange={(e) =>
                                updateGlobalVariable(variable.id ?? '', {
                                  value: e.target.value,
                                })
                              }
                              placeholder='Variable value'
                              className='transition-fast'
                            />
                          </div>
                          <Select
                            value={variable.type}
                            onValueChange={(value: Variable['type']) =>
                              updateGlobalVariable(variable.id ?? '', {
                                type: value,
                              })
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
                            onClick={() =>
                              removeGlobalVariable(variable.id || '')
                            }
                            className='text-red-600 transition-fast'
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
                  <Button
                    onClick={addGlobalVariable}
                    className='gap-2 transition-smooth'
                  >
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
                  // Update extracted variables for Variables Table
                  const newExtractedVars: Record<string, any> = {};
                  logs.forEach((log: any) => {
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
                onPreExecute={saveChain}
                chainName={formData?.name}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
