import React, { useState, useRef } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import {
  RequestChain,
  APIRequest,
  Variable,
  RequestDetailResponse,
} from '@/shared/types/requestChain.model';
import { RequestExecutor } from './RequestExecutor';
import { ImportModal } from '@/components/TestSuit/ImportModal';
import { ExtendedRequest } from '@/models/collection.model';
import { RequestEditor } from '@/components/RequestChains/RequestEditor';
import { requestService } from '@/services/requestChain.service';
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

interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

const transformRequestDetails = (
  requestData: RequestDetailResponse
): Partial<APIRequest> => {
  // Transform headers from API format to KeyValuePair format
  const transformHeaders = (headers: any): KeyValuePair[] => {
    if (!headers) return [];
    if (Array.isArray(headers)) {
      return headers.map((header, index) => ({
        id: `header_${index}_${Date.now()}`,
        key: header.key || header.name || '',
        value: header.value || '',
        enabled: header.enabled !== false,
        description: header.description || '',
      }));
    }
    // If headers is an object
    return Object.entries(headers).map(([key, value], index) => ({
      id: `header_${index}_${Date.now()}`,
      key,
      value: String(value),
      enabled: true,
      description: '',
    }));
  };

  // Transform params from API format to KeyValuePair format
  const transformParams = (params: any): KeyValuePair[] => {
    if (!params) return [];
    if (Array.isArray(params)) {
      return params.map((param, index) => ({
        id: `param_${index}_${Date.now()}`,
        key: param.key || param.name || '',
        value: param.value || '',
        enabled: param.enabled !== false,
        description: param.description || '',
      }));
    }
    // If params is an object
    return Object.entries(params).map(([key, value], index) => ({
      id: `param_${index}_${Date.now()}`,
      key,
      value: String(value),
      enabled: true,
      description: '',
    }));
  };

  // Determine body type from the request data
  const getBodyType = (data: any): APIRequest['bodyType'] => {
    if (!data.body && !data.bodyFormData) return 'none';
    if (data.bodyType) return data.bodyType;
    if (data.bodyFormData) return 'form-data';
    try {
      JSON.parse(data.body);
      return 'json';
    } catch {
      return 'raw';
    }
  };

  // Transform auth configuration
  const transformAuthConfig = (authData: any) => {
    if (!authData) return undefined;

    return {
      token: authData.token || authData.bearerToken || '',
      username: authData.username || '',
      password: authData.password || '',
      key: authData.key || authData.apiKey || '',
      value: authData.value || authData.apiValue || '',
      addTo: authData.addTo || (authData.in === 'query' ? 'query' : 'header'),
    };
  };

  return {
    name: requestData.name || 'Imported Request',
    method: (requestData.method || 'GET').toUpperCase() as APIRequest['method'],
    url: requestData.url || requestData.endpoint || '',
    headers: transformHeaders(requestData.headers),
    params: transformParams(requestData.params || requestData.queryParams),
    bodyType: getBodyType(requestData),
    body: requestData.body || requestData.rawBody || '',
    authType: requestData.authType || requestData.auth?.type || 'none',
    authConfig: transformAuthConfig(requestData.auth || requestData.authConfig),
    timeout: requestData.timeout || 5000,
    retries: requestData.retries || 0,
    errorHandling: requestData.errorHandling || 'stop',
    enabled: requestData.enabled !== false,
  };
};

export function RequestChainEditor({
  chain,
  onBack,
  onSave,
}: RequestChainEditorProps) {
  const { toast } = useToast();
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const [formData, setFormData] = useState<Partial<RequestChain>>({
    name: chain?.name || '',
    description: chain?.description || '',
    workspaceId: '8d9ea72f-7f74-4821-8909-e953066d9a8b',
    enabled: chain?.enabled ?? true,
    requests: chain?.requests || [],
    variables: chain?.variables || [],
    // schedule: chain?.schedule || {
    //   enabled: false,
    //   type: 'once',
    //   startDate: new Date().toISOString().split('T')[0],
    //   timezone: 'UTC',
    // },
  });

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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [pendingImportIds, setPendingImportIds] = useState<string[]>([]);

  // Use React Query to fetch request details
  const {
    data: requestDetails,
    isLoading: isLoadingDetails,
    error: detailsError,
    refetch: refetchDetails,
  } = useQuery({
    queryKey: ['requestDetails', pendingImportIds],
    queryFn: () => requestService.getMultipleRequestDetails(pendingImportIds),
    enabled: pendingImportIds.length > 0,
    retry: 2,
    retryDelay: 1000,
  });

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
      toast({
        title: 'Validation Error',
        description: 'Please enter a chain name',
        variant: 'destructive',
      });
      return;
    }

    const existingChains: RequestChain[] = JSON.parse(
      localStorage.getItem('extractionLogs') || '[]'
    );

    // Step 2: Create updated/merged chain object
    const chainData: RequestChain = {
      id: chain?.id || Date.now().toString(),
      workspaceId: formData.workspaceId || '',
      name: formData.name,
      description: formData.description,
      requests: formData.requests || [],
      variables: formData.variables || [],
      // schedule: formData.schedule!,
      enabled: formData.enabled || false,
      createdAt: chain?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastExecuted: chain?.lastExecuted,
      executionCount: chain?.executionCount || 0,
      successRate: chain?.successRate || 0,
    };

    // Step 3: Check if chain already exists and update or insert
    const updatedChains = [...existingChains];
    const existingIndex = updatedChains.findIndex((c) => c.id === chainData.id);

    if (existingIndex !== -1) {
      updatedChains[existingIndex] = chainData; // update
    } else {
      updatedChains.push(chainData); // add new
    }

    // Step 4: Save back to localStorage
    localStorage.setItem('extractionLogs', JSON.stringify(updatedChains));

    // Step 5: Trigger parent save

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

  const [requestChain, setRequestChain] = useState<ExtendedRequest[]>([]);

  const handleImportRequests = async (importedRequests: ExtendedRequest[]) => {
    try {
      toast({
        title: 'Importing Requests',
        description: `Fetching details for ${importedRequests.length} requests...`,
      });

      setRequestChain((prev) => [...prev, ...importedRequests]);

      // Set the pending import IDs to trigger the useQuery
      const requestIds = importedRequests.map((req) => req.id);
      setPendingImportIds(requestIds);

      // The useQuery will automatically fetch the details
      await refetchDetails();
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to import requests. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Effect to handle the completion of request details fetching
  React.useEffect(() => {
    if (requestDetails && pendingImportIds.length > 0) {
      try {
        const detailedRequests: APIRequest[] = [];

        // Process each fetched request detail
        requestDetails.forEach((detail) => {
          const transformedDetails = transformRequestDetails(detail);

          const completeRequest: APIRequest = {
            id: detail.id,
            name: transformedDetails.name || detail.name || 'Imported Request',
            method: transformedDetails.method || 'GET',
            url: transformedDetails.url || detail.endpoint || detail.url || '',
            headers: transformedDetails.headers || [],
            params: transformedDetails.params || [],
            bodyType: transformedDetails.bodyType || 'none',
            body: transformedDetails.body || '',
            authType: transformedDetails.authType || 'none',
            authConfig: transformedDetails.authConfig,
            timeout: transformedDetails.timeout || 5000,
            retries: transformedDetails.retries || 0,
            errorHandling: transformedDetails.errorHandling || 'stop',
            dataExtractions: [],
            testScripts: [],
            enabled: transformedDetails.enabled !== false,
          };

          detailedRequests.push(completeRequest);
        });

        // Handle any requests that failed to fetch (fallback to basic config)
        const fetchedIds = requestDetails.map((d) => d.id);
        const failedIds = pendingImportIds.filter(
          (id) => !fetchedIds.includes(id)
        );

        failedIds.forEach((failedId) => {
          const fallbackRequest: APIRequest = {
            id: failedId,
            name: 'Imported Request',
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

          detailedRequests.push(fallbackRequest);
        });

        if (failedIds.length > 0) {
          toast({
            title: 'Partial Import',
            description: `Could not fetch details for ${failedIds.length} request(s). Using basic configuration.`,
            variant: 'destructive',
          });
        }

        // Update form data with the detailed requests
        setFormData((prev) => ({
          ...prev,
          requests: [...(prev.requests || []), ...detailedRequests],
        }));

        // Expand newly imported requests
        setExpandedRequests(
          (prev) => new Set([...prev, ...detailedRequests.map((r) => r.id)])
        );

        toast({
          title: 'Import Successful',
          description: `Successfully imported ${detailedRequests.length} requests with complete details.`,
        });

        // Clean up
        setPendingImportIds([]);
        setIsImportModalOpen(false);
      } catch (error) {
        console.error('Error processing imported requests:', error);
        toast({
          title: 'Import Error',
          description: 'Error processing imported requests. Please try again.',
          variant: 'destructive',
        });
        setPendingImportIds([]);
      }
    }
  }, [requestDetails, pendingImportIds, toast]);

  // Handle query errors
  React.useEffect(() => {
    if (detailsError && pendingImportIds.length > 0) {
      toast({
        title: 'Import Failed',
        description: 'Failed to fetch request details. Please try again.',
        variant: 'destructive',
      });
      setPendingImportIds([]);
    }
  }, [detailsError, pendingImportIds, toast]);

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
            <Button
              onClick={handleSave}
              disabled={isSaveDisabled}
              className='gap-2'
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
              {/* <TabsTrigger value='variables' className='gap-2'>
                <Globe className='w-4 h-4' />
                Variables ({globalVariables.length})
              </TabsTrigger> */}
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
                    disabled={isLoadingDetails}
                    className='gap-2'
                  >
                    {isLoadingDetails ? (
                      <Loader2 className='w-4 h-4 animate-spin' />
                    ) : (
                      <Download className='w-4 h-4' />
                    )}
                    {isLoadingDetails ? 'Importing...' : 'Import Request'}
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
                                    className='text-red-600 hover:text-red-700'
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
                          <div className='mt-4 pt-4 border-t'>
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
                      variant='outline'
                      onClick={() => setIsImportModalOpen(true)}
                      disabled={isLoadingDetails}
                      className='gap-2'
                    >
                      {isLoadingDetails ? (
                        <Loader2 className='w-4 h-4 animate-spin' />
                      ) : (
                        <Download className='w-4 h-4' />
                      )}
                      {isLoadingDetails
                        ? 'Importing...'
                        : 'Import from Collection'}
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
                                updateGlobalVariable(variable.id ?? '', {
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
                                updateGlobalVariable(variable.id ?? '', {
                                  value: e.target.value,
                                })
                              }
                              placeholder='Variable value'
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
                  // Update extracted variables for Variables Table
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
