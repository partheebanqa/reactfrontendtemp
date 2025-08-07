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
  CheckCircle,
  XCircle,
  ChevronRight,
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
  ExecutionLog,
} from '@/shared/types/requestChain.model';
import { RequestExecutor } from './RequestExecutor';
import { ImportModal } from '@/components/TestSuit/ImportModal';
import { ExtendedRequest } from '@/models/collection.model';
import { RequestEditor } from '@/components/RequestChains/RequestEditor';
import { getMultipleRequestDetails } from '@/services/requestChain.service';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { VariablesTable } from './VariablesTable';
import { useDataManagement } from '@/hooks/useDataManagement';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useDataManagementStore } from '@/store/dataManagementStore';
import { parseCookies } from '@/lib/cookieUtils';
import {
  buildRequestPayload,
  executeRequest,
} from '@/services/executeRequest.service';
import { ResponseExplorer } from './ResponseExplorer';

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
  const { currentWorkspace } = useWorkspace();
  const { variables: storeVariables } = useDataManagementStore();

  const [formData, setFormData] = useState<Partial<RequestChain>>({
    name: chain?.name || '',
    description: chain?.description || '',
    workspaceId: currentWorkspace?.id || '',
    enabled: chain?.enabled ?? true,
    requests: chain?.requests || [],
    variables: chain?.variables || [],
    environment: chain?.environment || 'dev',
  });

  const { environments, activeEnvironment, setActiveEnvironment } =
    useDataManagement();
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('');

  useEffect(() => {
    if (activeEnvironment) {
      setSelectedEnvironment(activeEnvironment.id);
    }
  }, [activeEnvironment]);

  const handleEnvironmentChange = (environmentId: string) => {
    setSelectedEnvironment(environmentId);
    const selectedEnv = environments.find((env) => env.id === environmentId);
    if (selectedEnv) {
      setActiveEnvironment(selectedEnv);
    }
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

  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [extractedVariables, setExtractedVariables] = useState<
    Record<string, any>
  >({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentRequestIndex, setCurrentRequestIndex] = useState(-1);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [pendingImportIds, setPendingImportIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('requests');

  // State for response tabs in each request
  const [responseTabStates, setResponseTabStates] = useState<
    Record<string, string>
  >({});
  const [jsonOpenStates, setJsonOpenStates] = useState<Record<string, boolean>>(
    {}
  );

  // Use React Query to fetch request details
  const {
    data: requestDetails,
    isLoading: isLoadingDetails,
    error: detailsError,
    refetch: refetchDetails,
  } = useQuery({
    queryKey: ['requestDetails', pendingImportIds],
    queryFn: () => getMultipleRequestDetails(pendingImportIds),
    enabled: pendingImportIds.length > 0,
    retry: 2,
    retryDelay: 1000,
  });

  // Helper function to replace variables in text
  const replaceVariables = (text: string, vars: Variable[]): string => {
    let result = text;
    vars.forEach((variable) => {
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      result = result.replace(regex, variable.value);
    });
    return result;
  };

  // Helper function to get preview URL
  const getPreviewUrl = (request: APIRequest, variables: Variable[]) => {
    const replacedUrl = replaceVariables(request.url, variables);
    const baseUrl = storeVariables
      .find((v) => v.name === 'baseUrl')
      ?.initialValue?.trim();
    if (!baseUrl) return replacedUrl;
    try {
      const parsedOriginal = new URL(replacedUrl);
      const parsedBase = new URL(baseUrl);
      return `${parsedBase.origin}${parsedOriginal.pathname}${parsedOriginal.search}${parsedOriginal.hash}`;
    } catch {
      // If replacedUrl is relative
      return `${baseUrl.replace(/\/$/, '')}/${replacedUrl.replace(/^\//, '')}`;
    }
  };

  // Helper function to extract data from response
  const getValueByPath = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object') {
        if (key.includes('[') && key.includes(']')) {
          const arrayKey = key.substring(0, key.indexOf('['));
          const index = parseInt(
            key.substring(key.indexOf('[') + 1, key.indexOf(']'))
          );
          return current[arrayKey] && current[arrayKey][index];
        }
        return current[key];
      }
      return undefined;
    }, obj);
  };

  const extractDataFromResponse = (
    response: any,
    extractions: APIRequest['dataExtractions']
  ): Record<string, any> => {
    const extracted: Record<string, any> = {};
    extractions.forEach((extraction) => {
      try {
        let value;
        if (extraction.source === 'response_body') {
          const jsonData =
            typeof response.body === 'string'
              ? JSON.parse(response.body)
              : response.body;
          value = getValueByPath(jsonData, extraction.path);
        } else if (extraction.source === 'response_header') {
          value = response.headers[extraction.path.toLowerCase()];
        } else if (extraction.source === 'response_cookie') {
          value = response.cookies?.[extraction.path];
        }

        if (value !== undefined) {
          if (extraction.transform) {
            try {
              const transformFunction = new Function(
                'value',
                `return ${extraction.transform}`
              );
              value = transformFunction(value);
            } catch (transformError) {
              console.error(
                `Transform error for ${extraction.variableName}:`,
                transformError
              );
            }
          }
          extracted[extraction.variableName] = value;
        }
      } catch (error) {
        console.error(`Failed to extract ${extraction.variableName}:`, error);
      }
    });
    return extracted;
  };

  // Execute a single request
  const executeSingleRequest = async (
    request: APIRequest,
    variables: Variable[],
    requestIndex: number
  ): Promise<ExecutionLog> => {
    if (!request.url) {
      throw new Error('Request URL is required');
    }

    const startTime = Date.now();
    const payload = buildRequestPayload(request, variables);
    const previewUrl = getPreviewUrl(request, variables);
    payload.request.url = previewUrl;

    try {
      const backendData = await executeRequest(payload);
      const result = backendData?.data?.responses?.[0];

      if (!result) throw new Error('No response from executor');

      const extractedData = extractDataFromResponse(
        {
          body: result.body,
          headers: result.headers,
          cookies: parseCookies(result.headers?.['set-cookie'] ?? ''),
        },
        request.dataExtractions || []
      );

      const endTime = Date.now();
      const log: ExecutionLog = {
        id: Date.now().toString(),
        chainId: 'current-chain',
        requestId: request.id,
        status:
          result.statusCode >= 200 && result.statusCode < 300
            ? 'success'
            : 'error',
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration: result.metrics.responseTime,
        request: {
          method: request.method,
          url: previewUrl,
          headers: Object.fromEntries(
            request.headers.map((h) => [h.key, h.value])
          ),
          body: request.body ?? '',
        },
        response: {
          status: result.statusCode,
          headers: result.headers,
          body: result.body,
          size: result.metrics.bytesReceived,
          cookies: parseCookies(result.headers?.['set-cookie'] ?? ''),
        },
        extractedVariables: extractedData,
      };

      return log;
    } catch (error) {
      const endTime = Date.now();
      const errorLog: ExecutionLog = {
        id: Date.now().toString(),
        chainId: 'current-chain',
        requestId: request.id,
        status: 'error',
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration: endTime - startTime,
        request: {
          method: request.method,
          url: previewUrl,
          headers: {},
          body: request.body,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      throw errorLog;
    }
  };

  // Run all requests sequentially - UPDATED LOGIC
  const handleRunAll = async () => {
    if (!formData.requests || formData.requests.length === 0) {
      toast({
        title: 'No Requests',
        description: 'Add some requests to the chain before running',
        variant: 'destructive',
      });
      return;
    }

    setIsExecuting(true);
    setCurrentRequestIndex(0);
    setExecutionLogs([]);
    setExtractedVariables({});

    // Switch to the execute tab
    setActiveTab('requests');

    const allLogs: ExecutionLog[] = [];
    let currentVariables = [...globalVariables, ...(formData.variables || [])];
    let allExtractedVars: Record<string, any> = {};

    try {
      toast({
        title: 'Starting Execution',
        description: `Running ${formData.requests.length} requests sequentially...`,
      });

      for (let i = 0; i < formData.requests.length; i++) {
        const request = formData.requests[i];
        setCurrentRequestIndex(i);

        try {
          toast({
            title: `Executing Request ${i + 1}`,
            description: `Running: ${
              request.name || request.method + ' ' + request.url
            }`,
          });

          const log = await executeSingleRequest(request, currentVariables, i);
          allLogs.push(log);

          // Update extracted variables for next requests
          if (log.extractedVariables) {
            Object.assign(allExtractedVars, log.extractedVariables);
            // Convert extracted variables to Variable format and add to current variables
            Object.entries(log.extractedVariables).forEach(([key, value]) => {
              const existingVarIndex = currentVariables.findIndex(
                (v) => v.name === key
              );
              const newVar: Variable = {
                id:
                  existingVarIndex >= 0
                    ? currentVariables[existingVarIndex].id
                    : Date.now().toString() + key,
                name: key,
                value: String(value),
                type:
                  typeof value === 'number'
                    ? 'number'
                    : typeof value === 'boolean'
                    ? 'boolean'
                    : 'string',
              };

              if (existingVarIndex >= 0) {
                currentVariables[existingVarIndex] = newVar;
              } else {
                currentVariables.push(newVar);
              }
            });
          }

          toast({
            title: `Request ${i + 1} Completed`,
            description: `Status: ${log.response?.status || 'Error'} - ${
              log.status
            }`,
            variant: log.status === 'success' ? 'default' : 'destructive',
          });

          // Add a small delay between requests
          if (i < formData.requests.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch (error) {
          const errorLog = error as ExecutionLog;
          allLogs.push(errorLog);

          toast({
            title: `Request ${i + 1} Failed`,
            description: errorLog.error || 'Unknown error occurred',
            variant: 'destructive',
          });

          // Check error handling strategy
          if (request.errorHandling === 'stop') {
            toast({
              title: 'Execution Stopped',
              description: `Chain execution stopped due to error in request ${
                i + 1
              }`,
              variant: 'destructive',
            });
            break;
          } else if (request.errorHandling === 'retry' && request.retries > 0) {
            // Implement retry logic here if needed
            toast({
              title: 'Retrying Request',
              description: `Retrying request ${i + 1}...`,
            });
            // You can implement retry logic here
          }
          // If errorHandling is 'continue', just continue to next request
        }
      }

      // Update state with all results
      setExecutionLogs(allLogs);
      setExtractedVariables(allExtractedVars);

      const successCount = allLogs.filter(
        (log) => log.status === 'success'
      ).length;
      const totalCount = allLogs.length;

      toast({
        title: 'Execution Complete',
        description: `Completed ${successCount}/${totalCount} requests successfully`,
        variant: successCount === totalCount ? 'default' : 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Execution Failed',
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
      setCurrentRequestIndex(-1);
    }
  };

  // Helper function to get execution log for a request
  const getExecutionLogForRequest = (
    requestId: string
  ): ExecutionLog | null => {
    return executionLogs.find((log) => log.requestId === requestId) || null;
  };

  // Helper function to format response body
  const formatResponseBody = (body: string, contentType?: string) => {
    try {
      if (
        contentType?.includes('application/json') ||
        body.trim().startsWith('{')
      ) {
        return JSON.stringify(JSON.parse(body), null, 2);
      }
    } catch {
      // Return as-is if not valid JSON
    }
    return body;
  };

  // Helper function to copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied to Clipboard',
        description: 'The value has been copied successfully.',
      });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Helper function to set response tab for a specific request
  const setResponseTab = (requestId: string, tab: string) => {
    setResponseTabStates((prev) => ({
      ...prev,
      [requestId]: tab,
    }));
  };

  // Helper function to get response tab for a specific request
  const getResponseTab = (requestId: string) => {
    return responseTabStates[requestId] || 'body';
  };

  // Helper function to toggle JSON open state for a specific request
  const toggleJsonOpen = (requestId: string) => {
    setJsonOpenStates((prev) => ({
      ...prev,
      [requestId]: !prev[requestId],
    }));
  };

  // Helper function to get JSON open state for a specific request
  const getJsonOpenState = (requestId: string) => {
    return jsonOpenStates[requestId] || false;
  };

  // Helper function to handle variable extraction for chain requests
  const handleExtractVariableForRequest = (
    requestId: string,
    extraction: any
  ) => {
    const currentExtractions =
      formData.requests?.find((r) => r.id === requestId)?.dataExtractions || [];
    const updatedExtractions = [...currentExtractions, extraction];

    updateRequest(requestId, { dataExtractions: updatedExtractions });

    // Find the execution log for this request and extract variables
    const executionLog = getExecutionLogForRequest(requestId);
    if (executionLog?.response) {
      const extracted = extractDataFromResponse(
        executionLog.response,
        updatedExtractions
      );
      setExtractedVariables((prev) => ({ ...prev, ...extracted }));
    }
  };

  const handleRemoveExtractionForRequest = (
    requestId: string,
    variableName: string
  ) => {
    const updatedExtractions =
      formData.requests
        ?.find((r) => r.id === requestId)
        ?.dataExtractions?.filter((e) => e.variableName !== variableName) || [];

    updateRequest(requestId, { dataExtractions: updatedExtractions });

    // Remove the extracted variable from state
    const newExtracted = { ...extractedVariables };
    delete newExtracted[variableName];
    setExtractedVariables(newExtracted);
  };

  // Rest of your existing functions (drag handlers, toggles, etc.)
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
      localStorage.getItem('extractionLogs') || '[]'
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

    localStorage.setItem('extractionLogs', JSON.stringify(updatedChains));
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

  const handleImportRequests = async (importedRequests: ExtendedRequest[]) => {
    try {
      toast({
        title: 'Importing Requests',
        description: `Importing ${importedRequests.length} requests...`,
      });

      const transformedRequests: APIRequest[] = importedRequests.map((req) => ({
        id: req.id,
        name: req.name || 'Imported Request',
        method: (req.method || 'GET').toUpperCase() as APIRequest['method'],
        url: req.url || req.endpoint || '',
        headers: [],
        params: [],
        bodyType: 'none',
        body: '',
        authType: 'none',
        timeout: 5000,
        retries: 0,
        errorHandling: 'stop' as const,
        dataExtractions: [],
        testScripts: [],
        enabled: true,
      }));

      setFormData((prev) => ({
        ...prev,
        requests: [...(prev.requests || []), ...transformedRequests],
      }));

      setExpandedRequests(
        (prev) => new Set([...prev, ...transformedRequests.map((r) => r.id)])
      );

      toast({
        title: 'Import Successful',
        description: `Successfully imported ${transformedRequests.length} requests.`,
      });

      setIsImportModalOpen(false);
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to import requests. Please try again.',
        variant: 'destructive',
      });
    }
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
              <div className='space-y-2'>
                <label
                  htmlFor='environment-select'
                  className='block text-sm font-medium'
                >
                  Environment <span className='text-destructive'>*</span>
                </label>
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
            <TabsList className='grid w-full grid-cols-4'>
              <TabsTrigger value='requests' className='gap-2'>
                <Code className='w-4 h-4' />
                Requests ({formData.requests?.length || 0})
              </TabsTrigger>
              <TabsTrigger value='variables' className='gap-2'>
                <Globe className='w-4 h-4' />
                Global Variables ({globalVariables.length})
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
                  <Button
                    variant='outline'
                    onClick={handleRunAll}
                    disabled={isExecuting || !formData.requests?.length}
                    className='gap-2'
                  >
                    {isExecuting ? (
                      <Loader2 className='w-4 h-4 animate-spin' />
                    ) : (
                      <PlayCircle className='w-4 h-4' />
                    )}
                    {isExecuting ? 'Running...' : 'Run All'}
                  </Button>
                  <Button onClick={addNewRequest}>
                    <Plus className='w-4 h-4' />
                    Add Request
                  </Button>
                </div>
              </div>

              {formData.requests && formData.requests.length > 0 ? (
                <div className='space-y-3'>
                  {formData.requests.map((request, index) => {
                    const executionLog = getExecutionLogForRequest(request.id);
                    const responseTab = getResponseTab(request.id);
                    const isJsonOpen = getJsonOpenState(request.id);

                    return (
                      <Card
                        key={request.id}
                        className={`hover:shadow-sm transition-shadow ${
                          currentRequestIndex === index
                            ? 'ring-2 ring-primary'
                            : ''
                        }`}
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
                              <div
                                className={`w-8 h-8 ${
                                  currentRequestIndex === index
                                    ? 'bg-primary text-primary-foreground animate-pulse'
                                    : 'bg-blue-100 text-blue-600'
                                } rounded-full flex items-center justify-center text-sm font-medium`}
                              >
                                {currentRequestIndex === index ? (
                                  <Loader2 className='w-4 h-4 animate-spin' />
                                ) : (
                                  index + 1
                                )}
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
                                {request.params &&
                                  request.params.length > 0 && (
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
                                {executionLog && (
                                  <div className='flex items-center space-x-1'>
                                    {executionLog.status === 'success' ? (
                                      <CheckCircle className='w-4 h-4 text-green-500' />
                                    ) : (
                                      <XCircle className='w-4 h-4 text-red-500' />
                                    )}
                                    {executionLog.response && (
                                      <Badge
                                        variant={
                                          executionLog.response.status < 300
                                            ? 'default'
                                            : 'destructive'
                                        }
                                        className='text-xs'
                                      >
                                        {executionLog.response.status}
                                      </Badge>
                                    )}
                                  </div>
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
                                      onClick={() =>
                                        duplicateRequest(request.id)
                                      }
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
                                  <TooltipContent>
                                    Delete Request
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TooltipProvider>
                          </div>

                          {expandedRequests.has(request.id) && (
                            <div className='mt-4 pt-4 border-t space-y-4'>
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

                              {/* Response Section - NEW */}
                              {executionLog && (
                                <div className='border-t border-gray-200 pt-4'>
                                  <div className='flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 rounded-t-lg'>
                                    <div className='flex items-center space-x-4'>
                                      {executionLog.status === 'success' ? (
                                        <div className='flex items-center space-x-2'>
                                          <CheckCircle className='w-5 h-5 text-green-500' />
                                          <span className='text-sm font-medium text-green-700'>
                                            Response
                                          </span>
                                        </div>
                                      ) : (
                                        <div className='flex items-center space-x-2'>
                                          <XCircle className='w-5 h-5 text-red-500' />
                                          <span className='text-sm font-medium text-red-700'>
                                            Response
                                          </span>
                                        </div>
                                      )}
                                      {executionLog.response && (
                                        <>
                                          <span
                                            className={`px-2 py-1 text-xs font-medium rounded ${
                                              executionLog.response.status < 300
                                                ? 'bg-green-100 text-green-800'
                                                : executionLog.response.status <
                                                  400
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}
                                          >
                                            {executionLog.response.status}{' '}
                                            {executionLog.response.status ===
                                            200
                                              ? 'OK'
                                              : executionLog.response.status ===
                                                201
                                              ? 'Created'
                                              : executionLog.response.status ===
                                                404
                                              ? 'Not Found'
                                              : executionLog.response.status ===
                                                500
                                              ? 'Server Error'
                                              : ''}
                                          </span>
                                          <span className='text-sm text-gray-600'>
                                            {executionLog.duration}ms
                                          </span>
                                          <span className='text-sm text-gray-600'>
                                            {(
                                              executionLog.response.size / 1024
                                            ).toFixed(2)}{' '}
                                            KB
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {executionLog.response && (
                                    <>
                                      <div className='border-b border-gray-200'>
                                        <nav className='flex space-x-8 px-6'>
                                          {[
                                            {
                                              id: 'body',
                                              label: 'Body',
                                              count: null,
                                            },
                                            {
                                              id: 'cookies',
                                              label: 'Cookies',
                                              count: executionLog.response
                                                .cookies
                                                ? Object.keys(
                                                    executionLog.response
                                                      .cookies
                                                  ).length
                                                : 0,
                                            },
                                            {
                                              id: 'headers',
                                              label: 'Headers',
                                              count: Object.keys(
                                                executionLog.response.headers
                                              ).length,
                                            },
                                            {
                                              id: 'extracted',
                                              label: 'Extracted Variables',
                                              count:
                                                executionLog.extractedVariables
                                                  ? Object.keys(
                                                      executionLog.extractedVariables
                                                    ).length
                                                  : 0,
                                            },
                                          ].map((tab) => (
                                            <button
                                              key={tab.id}
                                              onClick={() =>
                                                setResponseTab(
                                                  request.id,
                                                  tab.id
                                                )
                                              }
                                              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                                                responseTab === tab.id
                                                  ? 'border-blue-500 text-blue-600'
                                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                              }`}
                                            >
                                              <span>{tab.label}</span>
                                              {tab.count !== null &&
                                                tab.count > 0 && (
                                                  <span className='ml-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full'>
                                                    {tab.count}
                                                  </span>
                                                )}
                                            </button>
                                          ))}
                                        </nav>
                                      </div>

                                      <div className='p-6'>
                                        {responseTab === 'body' && (
                                          <div className='space-y-4'>
                                            <div
                                              className='flex items-center justify-between cursor-pointer'
                                              onClick={() =>
                                                toggleJsonOpen(request.id)
                                              }
                                            >
                                              <div className='flex items-center space-x-2'>
                                                {isJsonOpen ? (
                                                  <ChevronDown className='w-4 h-4 text-gray-400' />
                                                ) : (
                                                  <ChevronRight className='w-4 h-4 text-gray-400' />
                                                )}
                                                <span className='text-sm font-medium text-gray-700'>
                                                  JSON
                                                </span>
                                              </div>
                                              <div className='flex items-center space-x-2'>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    copyToClipboard(
                                                      executionLog.response!
                                                        .body
                                                    );
                                                  }}
                                                  className='flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors'
                                                >
                                                  <Copy className='w-3 h-3' />
                                                  <span>Copy</span>
                                                </button>
                                              </div>
                                            </div>
                                            {isJsonOpen && (
                                              <div className='relative'>
                                                <pre className='bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm font-mono overflow-x-auto max-h-96 leading-relaxed'>
                                                  <code className='text-gray-800'>
                                                    {formatResponseBody(
                                                      executionLog.response
                                                        .body,
                                                      executionLog.response
                                                        .headers['content-type']
                                                    )}
                                                  </code>
                                                </pre>
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {responseTab === 'cookies' && (
                                          <div className='space-y-3'>
                                            {executionLog.response.cookies &&
                                            Object.keys(
                                              executionLog.response.cookies
                                            ).length > 0 ? (
                                              Object.entries(
                                                executionLog.response.cookies
                                              ).map(([name, value]) => (
                                                <div
                                                  key={name}
                                                  className='flex items-center justify-between p-3 bg-gray-50 rounded-lg border'
                                                >
                                                  <div>
                                                    <span className='font-medium text-gray-900'>
                                                      {name}
                                                    </span>
                                                    <p className='text-sm text-gray-600 font-mono'>
                                                      {value}
                                                    </p>
                                                  </div>
                                                  <button
                                                    onClick={() =>
                                                      copyToClipboard(value)
                                                    }
                                                    className='p-1 text-gray-400 hover:text-gray-600 rounded'
                                                  >
                                                    <Copy className='w-4 h-4' />
                                                  </button>
                                                </div>
                                              ))
                                            ) : (
                                              <p className='text-gray-500 text-center py-8'>
                                                No cookies in response
                                              </p>
                                            )}
                                          </div>
                                        )}

                                        {responseTab === 'headers' && (
                                          <div className='space-y-3'>
                                            {Object.entries(
                                              executionLog.response.headers
                                            ).map(([name, value]) => (
                                              <div
                                                key={name}
                                                className='flex items-center justify-between p-3 bg-gray-50 rounded-lg border'
                                              >
                                                <div>
                                                  <span className='font-medium text-gray-900'>
                                                    {name}
                                                  </span>
                                                  <p className='text-sm text-gray-600 font-mono'>
                                                    {value}
                                                  </p>
                                                </div>
                                                <button
                                                  onClick={() =>
                                                    copyToClipboard(value)
                                                  }
                                                  className='p-1 text-gray-400 hover:text-gray-600 rounded'
                                                >
                                                  <Copy className='w-4 h-4' />
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {responseTab === 'extracted' && (
                                          <div className='space-y-3'>
                                            {executionLog.extractedVariables &&
                                            Object.keys(
                                              executionLog.extractedVariables
                                            ).length > 0 ? (
                                              Object.entries(
                                                executionLog.extractedVariables
                                              ).map(([name, value]) => (
                                                <div
                                                  key={name}
                                                  className='flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200'
                                                >
                                                  <div>
                                                    <span className='font-medium text-green-900'>
                                                      {name}
                                                    </span>
                                                    <p className='text-sm text-green-700 font-mono'>
                                                      {typeof value === 'object'
                                                        ? JSON.stringify(
                                                            value,
                                                            null,
                                                            2
                                                          )
                                                        : String(value)}
                                                    </p>
                                                  </div>
                                                  <button
                                                    onClick={() =>
                                                      copyToClipboard(
                                                        typeof value ===
                                                          'object'
                                                          ? JSON.stringify(
                                                              value
                                                            )
                                                          : String(value)
                                                      )
                                                    }
                                                    className='p-1 text-green-400 hover:text-green-600 rounded'
                                                  >
                                                    <Copy className='w-4 h-4' />
                                                  </button>
                                                </div>
                                              ))
                                            ) : (
                                              <p className='text-gray-500 text-center py-8'>
                                                No variables extracted from this
                                                response
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      {/* Extract Variables from Response Section */}
                                      <div className='border-t border-gray-200 p-6'>
                                        <h3 className='text-lg font-medium text-gray-900 mb-4'>
                                          Extract Variables from Response
                                        </h3>
                                        <ResponseExplorer
                                          response={executionLog.response}
                                          onExtractVariable={(extraction) => {
                                            const currentExtractions =
                                              request.dataExtractions || [];
                                            const updatedExtractions = [
                                              ...currentExtractions,
                                              extraction,
                                            ];
                                            updateRequest(request.id, {
                                              dataExtractions:
                                                updatedExtractions,
                                            });

                                            // Extract the variable immediately from the current response
                                            const extracted =
                                              extractDataFromResponse(
                                                executionLog.response,
                                                updatedExtractions
                                              );
                                            setExtractedVariables((prev) => ({
                                              ...prev,
                                              ...extracted,
                                            }));
                                          }}
                                          extractedVariables={
                                            executionLog.extractedVariables ||
                                            {}
                                          }
                                          existingExtractions={
                                            request.dataExtractions || []
                                          }
                                          onRemoveExtraction={(
                                            variableName
                                          ) => {
                                            const updatedExtractions =
                                              request.dataExtractions?.filter(
                                                (e) =>
                                                  e.variableName !==
                                                  variableName
                                              ) || [];
                                            updateRequest(request.id, {
                                              dataExtractions:
                                                updatedExtractions,
                                            });
                                          }}
                                          handleCopy={copyToClipboard}
                                          copied={false}
                                        />
                                      </div>
                                    </>
                                  )}

                                  {!executionLog.response && (
                                    <div className='p-6'>
                                      <div className='text-red-600'>
                                        <h4 className='font-medium mb-2'>
                                          Error
                                        </h4>
                                        <p className='text-sm'>
                                          {executionLog.error}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
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
                chainName={formData?.name}
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
