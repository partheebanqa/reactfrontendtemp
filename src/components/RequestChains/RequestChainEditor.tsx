// RequestChainEditor.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  GripVertical,
  Trash2,
  ChevronDown,
  Code,
  Download,
  ChevronUp,
  Copy,
  Database,
  Loader2,
  PlayCircle,
  CheckCircle,
  XCircle,
  Info,
  Layers,
  Link2,
  Pencil,
  X,
  Check,
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
import type {
  RequestChain,
  APIRequest,
  Variable,
  ExecutionLog,
  DataExtraction,
} from '@/shared/types/requestChain.model';
import { ImportModal } from '@/components/TestSuit/ImportModal';
import type { ExtendedRequest } from '@/models/collection.model';
import { RequestEditor } from '@/components/RequestChains/RequestEditor';
import { RequestExecutor } from './RequestExecutor';
import {
  saveRequestChain,
  updateRequestChain,
} from '@/services/requestChain.service';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { VariablesTable } from './VariablesTable';
import { useDataManagement } from '@/hooks/useDataManagement';
import { useWorkspace } from '@/hooks/useWorkspace';
import { parseCookies } from '@/lib/cookieUtils';
import {
  buildRequestPayload,
  executeRequest,
} from '@/services/executeRequest.service';
import {
  getExtractVariablesByEnvironment,
  extractDataFromResponse,
  transformRequestForSave,
  getExecutionLogForRequest,
} from '@/lib/request-utils';
import { ResponseExplorer } from './ResponseExplorer';
import BreadCum from '../BreadCum/Breadcum';

interface RequestChainEditorProps {
  chain?: RequestChain;
  onBack: () => void;
  onSave: (chain: RequestChain) => void;
  requestChainId?: string;
  onToggleChain: (chainId: string) => void;
}

export function RequestChainEditor({
  chain,
  onBack,
  onSave,
  requestChainId,
  onToggleChain,
}: RequestChainEditorProps) {
  const { toast } = useToast();
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const { currentWorkspace } = useWorkspace();
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
  const [formData, setFormData] = useState<Partial<RequestChain>>({
    name: chain?.name || '',
    description: chain?.description || '',
    workspaceId: currentWorkspace?.id || '',
    enabled: chain?.enabled ?? true,
    chainRequests: (chain?.chainRequests || (chain as any)?.requests || []).map(
      (req: any) => ({
        ...req,
        body: req.body || req.bodyRawContent || '',
        bodyType: req.bodyType || (req.bodyRawContent ? 'raw' : 'none'), // Set bodyType based on content
      })
    ),
    variables: chain?.variables || [],
    environment: chain?.environment || 'dev',
  });
  const { environments, activeEnvironment, setActiveEnvironment } =
    useDataManagement();
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('');
  const [environmentBaseUrl, setEnvironmentBaseUrl] = useState<string>('');

  useEffect(() => {
    if (activeEnvironment) {
      setSelectedEnvironment(activeEnvironment.id);
      setEnvironmentBaseUrl(activeEnvironment.baseUrl || '');
    }
  }, [activeEnvironment]);

  const handleEnvironmentChange = (environmentId: string) => {
    setSelectedEnvironment(environmentId);
    const selectedEnv = environments.find((env) => env.id === environmentId);
    if (selectedEnv) {
      setActiveEnvironment(selectedEnv);
      setEnvironmentBaseUrl(selectedEnv.baseUrl || '');
    }
  };

  const isSaveDisabled =
    !formData.name?.trim() || (formData.chainRequests?.length ?? 0) === 0;
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(
    new Set()
  );
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [extractedVariables, setExtractedVariables] = useState<
    Record<string, any>
  >({});
  const [extractedVariablesByRequest, setExtractedVariablesByRequest] =
    useState<Record<string, Record<string, any>>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentRequestIndex, setCurrentRequestIndex] = useState(-1);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('requests');
  const [isSaving, setIsSaving] = useState(false);

  const replaceVariables = (text: string, vars: Variable[]): string => {
    let result = text;
    vars.forEach((variable) => {
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      result = result.replace(regex, variable?.value ?? '');
    });
    return result;
  };

  const getPreviewUrl = (request: APIRequest, variables: Variable[]) => {
    const replacedUrl = replaceVariables(request.url, variables);
    const baseUrl = environmentBaseUrl?.trim();
    if (!baseUrl) return replacedUrl;
    try {
      const parsedOriginal = new URL(replacedUrl);
      const parsedBase = new URL(baseUrl);
      return `${parsedBase.origin}${parsedOriginal.pathname}${parsedOriginal.search}${parsedOriginal.hash}`;
    } catch {
      return `${baseUrl.replace(/\/$/, '')}/${replacedUrl.replace(/^\//, '')}`;
    }
  };

  const executeSingleRequest = async (
    request: APIRequest,
    variables: Variable[],
    requestIndex: number
  ): Promise<ExecutionLog> => {
    if (!request.url) {
      throw new Error('Request URL is required');
    }
    request = {
      ...request,
      headers: request.headers ?? [],
      params: request.params ?? [],
    };

    const extractedVars = getExtractVariablesByEnvironment(
      activeEnvironment?.id
    );
    const mergedVariables = [
      ...variables.filter(
        (sv) => !extractedVars.some((ev) => ev.name === sv.name)
      ),
      ...extractedVars,
    ];
    const startTime = Date.now();
    const payload = buildRequestPayload(request, mergedVariables);
    const previewUrl = getPreviewUrl(request, mergedVariables);
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
        request.extractVariables || []
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
          headers: {}, // fallback in error case
          body: request.body,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      throw errorLog;
    }
  };

  const handleRunAll = async () => {
    if (!formData.chainRequests || formData.chainRequests.length === 0) {
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
    setExtractedVariablesByRequest({});
    setActiveTab('requests');

    const allLogs: ExecutionLog[] = [];
    const currentVariables = [
      ...globalVariables,
      ...(formData.variables || []),
    ];
    const allExtractedVars: Record<string, any> = {};
    const variablesByRequest: Record<string, Record<string, any>> = {};

    try {
      toast({
        title: 'Starting Execution',
        description: `Running ${formData.chainRequests.length} requests sequentially...`,
      });

      for (let i = 0; i < formData.chainRequests.length; i++) {
        const request = formData.chainRequests[i];
        setCurrentRequestIndex(i);

        try {
          const log = await executeSingleRequest(request, currentVariables, i);
          allLogs.push(log);

          // Update executionLogs immediately after each request completes
          setExecutionLogs((prev) => [...prev, log]);

          if (log.extractedVariables) {
            variablesByRequest[log.requestId] = { ...log.extractedVariables };
            setExtractedVariablesByRequest((prev) => ({
              ...prev,
              [log.requestId]: { ...log.extractedVariables },
            }));

            Object.assign(allExtractedVars, log.extractedVariables);
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
            updateExtractedVariables(allExtractedVars);
          }

          if (i < formData.chainRequests.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch (error) {
          const errorLog = error as ExecutionLog;
          allLogs.push(errorLog);

          setExecutionLogs((prev) => [...prev, errorLog]);

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
            toast({
              title: 'Retrying Request',
              description: `Retrying request ${i + 1}...`,
            });
          }
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

  const handleExtractVariableForRequest = (
    requestId: string,
    extraction: DataExtraction
  ) => {
    const request = formData.chainRequests.find((r) => r.id === requestId);
    if (!request) return;

    const updatedExtractions = [
      ...(request.extractVariables || []),
      extraction,
    ];
    const updatedRequests = formData.chainRequests.map((r) =>
      r.id === requestId ? { ...r, extractVariables: updatedExtractions } : r
    );

    setFormData({ ...formData, chainRequests: updatedRequests });

    // Update the extracted variables for this request
    const log = executionLogs.find((l) => l.requestId === requestId);
    if (log?.response) {
      const extracted = extractDataFromResponse(
        log.response,
        updatedExtractions
      );
      setExtractedVariablesByRequest((prev) => ({
        ...prev,
        [requestId]: { ...prev[requestId], ...extracted },
      }));
    }
  };

  const handleRemoveExtractionForRequest = (
    requestId: string,
    variableName: string
  ) => {
    const request = formData.chainRequests.find((r) => r.id === requestId);
    if (!request) return;

    const updatedExtractions = (request.extractVariables || []).filter(
      (e) => e.variableName !== variableName
    );
    const updatedRequests = formData.chainRequests.map((r) =>
      r.id === requestId ? { ...r, extractVariables: updatedExtractions } : r
    );

    setFormData({ ...formData, chainRequests: updatedRequests });

    // Remove from extracted variables for this request
    setExtractedVariablesByRequest((prev) => {
      const updated = { ...prev };
      if (updated[requestId]) {
        delete updated[requestId][variableName];
      }
      return updated;
    });
  };

  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [tempName, setTempName] = useState<string>('');

  const handleCopyForRequest = async (requestId: string, value: string) => {
    try {
      const formattedValue = `{{${value}}}`;
      await navigator.clipboard.writeText(formattedValue);
      setCopiedStates((prev) => ({ ...prev, [requestId]: true }));
      toast({
        title: 'Copied to Clipboard',
        description: `Variable ${formattedValue} copied to clipboard`,
      });
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [requestId]: false }));
      }, 2000);
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  // Drag handlers
  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const requests = [...(formData.chainRequests || [])];
      const draggedItem = requests[dragItem.current];
      requests.splice(dragItem.current, 1);
      requests.splice(dragOverItem.current, 0, draggedItem);

      const reorderedRequests = requests.map((request, index) => ({
        ...request,
        order: index + 1,
      }));

      setFormData({ ...formData, chainRequests: reorderedRequests });
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
      chainRequests:
        formData.chainRequests?.filter((req) => req.id !== requestId) || [],
    });
    const newExpanded = new Set(expandedRequests);
    newExpanded.delete(requestId);
    setExpandedRequests(newExpanded);
  };

  const updateRequest = (requestId: string, updates: Partial<APIRequest>) => {
    setFormData({
      ...formData,
      chainRequests:
        formData.chainRequests?.map((req) =>
          req.id === requestId ? { ...req, ...updates } : req
        ) || [],
    });
  };

  const duplicateRequest = (requestId: string) => {
    const request = formData.chainRequests?.find((r) => r.id === requestId);
    if (request) {
      const duplicated = {
        ...request,
        id: undefined,
        name: `${request.name} (Copy)`,
        headers: request.headers?.map((h) => ({ ...h, id: undefined })) || [],
        params: request.params?.map((p) => ({ ...p, id: undefined })) || [],
        extractVariables:
          request.extractVariables?.map((v) => ({ ...v })) || [],
        testScripts:
          request.testScripts?.map((t) => ({
            ...t,
            id: `temp_${Date.now()}_${Math.random()}`,
          })) || [],
      };
      setFormData({
        ...formData,
        chainRequests: [...(formData.chainRequests || []), duplicated],
      });
    }
  };

  const addNewRequest = () => {
    const newRequest: APIRequest = {
      name: 'New Request',
      method: 'GET',
      url: '',
      headers: [],
      params: [],
      bodyType: 'none',
      timeout: 5000,
      retries: 0,
      errorHandling: 'stop',
      extractVariables: [],
      testScripts: [],
      enabled: true,
      authorizationType: 'none',
    };
    setFormData({
      ...formData,
      chainRequests: [...(formData.chainRequests || []), newRequest],
    });
    const tempId = Date.now().toString();
    setExpandedRequests(new Set([...expandedRequests, tempId]));
  };

  const saveChainToAPI = async (): Promise<RequestChain | null> => {
    if (!formData.name?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Chain name is required',
        variant: 'destructive',
      });
      return null;
    }

    try {
      setIsSaving(true);
      const originalRequestIds = new Set(
        chain?.chainRequests?.map((r) => r.id) || []
      );

      const chainDataForBackend = {
        ...formData,
        chainRequests: formData.chainRequests?.map((request, index) => {
          const isExistingRequest =
            request.id && originalRequestIds.has(request.id);
          if (isExistingRequest) {
            return {
              ...request,
              order: index + 1,
              headers:
                request.headers?.map((h) =>
                  h.id && !h.id.startsWith('temp_')
                    ? h
                    : { ...h, id: undefined }
                ) || [],
              params:
                request.params?.map((p) =>
                  p.id && !p.id.startsWith('temp_')
                    ? p
                    : { ...p, id: undefined }
                ) || [],
            };
          } else {
            return {
              ...request,
              id: undefined,
              order: index + 1,
              headers:
                request.headers?.map((h) => ({ ...h, id: undefined })) || [],
              params:
                request.params?.map((p) => ({ ...p, id: undefined })) || [],
            };
          }
        }),
      };

      const transformedRequests = chainDataForBackend.chainRequests.map(
        transformRequestForSave
      );

      const chainData: RequestChain = {
        id: requestChainId || chain?.id || '',
        workspaceId: formData.workspaceId || currentWorkspace?.id || '',
        name: formData.name,
        description: formData.description || '',
        environmentId: selectedEnvironment,
        chainRequests: transformedRequests,
        variables: formData.variables || [],
        enabled: formData.enabled ?? true,
        createdAt: chain?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastExecuted: chain?.lastExecuted,
        executionCount: chain?.executionCount || 0,
        successRate: chain?.successRate || 0,
      };

      const savedChain =
        chainData.id === ''
          ? await saveRequestChain(chainData)
          : await updateRequestChain(chainData, chainData.id);

      setFormData((prev) => ({ ...prev, id: savedChain.id }));

      toast({
        title: chainData.id === '' ? 'Chain Saved' : 'Chain Updated',
        description:
          chainData.id === ''
            ? 'Your request chain has been saved successfully.'
            : 'Your request chain has been updated successfully.',
      });

      return savedChain;
    } catch (error) {
      console.error('Failed to save chain:', error);
      toast({
        title: chain?.id ? 'Update Failed' : 'Save Failed',
        description:
          error instanceof Error
            ? error.message
            : `Failed to ${chain?.id ? 'update' : 'save'} request chain`,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    const saved = await saveChainToAPI();
    if (saved) {
      onSave(saved);
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

  const handleImportRequests = async (importedRequests: ExtendedRequest[]) => {
    try {
      // toast({
      //   title: 'Importing Requests',
      //   description: `Importing ${importedRequests.length} requests...`,
      // });

      const transformedRequests: APIRequest[] = importedRequests.map((req) => {
        // Handle body data
        const hasBody = req.bodyRawContent && req.bodyRawContent.trim() !== '';
        const bodyType: APIRequest['bodyType'] = hasBody
          ? (req.bodyType as APIRequest['bodyType']) || 'raw'
          : 'none';

        // Handle headers
        const headers = Array.isArray(req.headers)
          ? req.headers.map((header: any) => ({
              id: header.id || `temp_${Date.now()}_${Math.random()}`,
              key: header.key || '',
              value: header.value || '',
              enabled: header.enabled !== false,
            }))
          : [];

        // Handle authorization
        let authorizationType: APIRequest['authorizationType'] = 'none';
        let authToken = '';
        let authUsername = '';
        let authPassword = '';
        let authApiKey = '';
        let authApiValue = '';
        let authApiLocation = 'header';

        if (req.authorizationType && req.authorizationType !== 'none') {
          authorizationType = req.authorizationType;

          if (req.authorizationType === 'bearer' && req.authorization?.token) {
            authToken = req.authorization.token;
          } else if (req.authorizationType === 'basic' && req.authorization) {
            authUsername = req.authorization.username || '';
            authPassword = req.authorization.password || '';
          } else if (req.authorizationType === 'apikey' && req.authorization) {
            authApiKey = req.authorization.key || '';
            authApiValue = req.authorization.value || '';
            authApiLocation = req.authorization.addTo || 'header';
          }
        }

        // Handle query parameters
        const params = Array.isArray(req.params)
          ? req.params.map((param: any) => ({
              id: param.id || `temp_${Date.now()}_${Math.random()}`,
              key: param.key || '',
              value: param.value || '',
              enabled: param.enabled !== false,
            }))
          : [];

        return {
          id: req.id,
          name: req.name || 'Imported Request',
          method: (req.method || 'GET').toUpperCase() as APIRequest['method'],
          url: req.url || req.endpoint || '',
          headers,
          params,
          bodyType,
          body: hasBody ? req.bodyRawContent : '',
          authorizationType,
          authToken,
          authUsername,
          authPassword,
          authApiKey,
          authApiValue,
          authApiLocation,
          timeout: req.timeout || 5000,
          retries: req.retries || 0,
          errorHandling:
            (req.errorHandling as APIRequest['errorHandling']) || 'stop',
          extractVariables: req.extractVariables || [],
          testScripts: req.testScripts || [],
        };
      });

      const newExpandedRequests = new Set(expandedRequests);
      // Don't add imported request IDs to expandedRequests, keeping them collapsed by default

      setFormData({
        ...formData,
        chainRequests: [
          ...(formData.chainRequests || []),
          ...transformedRequests,
        ],
      });

      // Keep expandedRequests unchanged so new requests remain collapsed
      setExpandedRequests(newExpandedRequests);

      toast({
        title: 'Import Successful',
        description: `Successfully imported ${importedRequests.length} requests`,
      });
    } catch (error) {
      console.error('Error importing requests:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to import requests. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const currentRequestChainId = requestChainId || chain?.id || '';

  function commitRequestName(index: number, nameValue: string) {
    const finalName = nameValue.trim();
    const updated = (formData.chainRequests || []).map((r, i) =>
      i === index ? { ...r, name: finalName || r.url || r.name } : r
    );
    setFormData({ ...formData, chainRequests: updated });
  }

  if (editingRequestId) {
    const request = formData.chainRequests?.find(
      (r) => r.id === editingRequestId
    );

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
              onUpdate={(updates) => updateRequest(editingRequestId, updates)}
              onSave={() => setEditingRequestId(null)}
              chainName={formData.name}
              chainDescription={formData.description}
              chainEnabled={formData.enabled}
              environmentBaseUrl={environmentBaseUrl}
              requestChainId={currentRequestChainId}
              chainId={chain?.id}
            />
          </div>
        </div>
      );
    }
  }

  return (
    <div className='h-full flex flex-col'>
      {/* Header */}
      {/* <div className='flex-shrink-0 border-b bg-background px-6 py-4'>
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
        </div>
      </div> */}

      <BreadCum
        title={chain ? 'Edit Request Chain' : 'Create Request Chain'}
        subtitle={'Configure your API automation workflow'}
        buttonTitle=' Create Test suite'
        showCreateButton={false}
        showQuickGuide={false}
        onClickQuickGuide={() => console.log('Exporting...')}
        icon={Link2}
        iconBgClass='bg-[#f9e3fc]'
        iconColor='#660275'
        iconSize={36}
      />

      <div className='flex-1 border border-gray-200 rounded-lg bg-background mt-3'>
        <div className='p-6 space-y-6'>
          {/* 1. Basic Information Box */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='chainName'>
                    Chain Name <span className='text-destructive'>*</span>
                  </Label>
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
                  <Label htmlFor='status'>Important</Label>
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
                <Label htmlFor='description'>Description (optional)</Label>
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
                            {env.name} -{' '}
                            <span className='text-xs text-muted-foreground break-all'>
                              {env.baseUrl}
                            </span>
                          </span>
                          {/* <span className='text-xs text-muted-foreground break-all'>
                            {env.baseUrl}
                          </span> */}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 2. Requests and Extracted Variables Boxs */}
          <Card>
            <CardHeader>
              <CardTitle>Requests and Extracted Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className='w-full'
              >
                <TabsList className='grid w-full grid-cols-2'>
                  <TabsTrigger value='requests' className='gap-2'>
                    <Code className='w-4 h-4' />
                    Requests ({formData.chainRequests?.length || 0})
                  </TabsTrigger>

                  <TabsTrigger
                    value='variables-table'
                    className='gap-2 flex items-center'
                  >
                    <Database className='w-4 h-4' />
                    Extracted Variables
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className='w-4 h-4 cursor-pointer text-muted-foreground' />
                        </TooltipTrigger>
                        <TooltipContent>
                          View all variables extracted for the request chain.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value='requests' className='space-y-4'>
                  <div className='bg-card rounded-xl border border-border overflow-hidden'>
                    <div className='p-4 sm:p-6 border-b border-border'>
                      <div className='flex items-center justify-between mb-4'>
                        <h3 className='text-lg font-medium'>Request Chain</h3>
                        <div className='flex items-center gap-2'>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant='outline'
                                  onClick={handleRunAll}
                                  disabled={
                                    isExecuting ||
                                    !formData.chainRequests?.length
                                  }
                                  className='gap-2 bg-transparent'
                                >
                                  {isExecuting ? (
                                    <Loader2 className='w-4 h-4 animate-spin' />
                                  ) : (
                                    <PlayCircle className='w-4 h-4' />
                                  )}
                                  {isExecuting ? 'Running...' : 'Run All'}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Run all requests before execution</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <Button
                            variant='outline'
                            onClick={() => setIsImportModalOpen(true)}
                            className='gap-2'
                          >
                            <Download className='w-4 h-4' />
                            Import
                          </Button>
                          <Button onClick={addNewRequest} className='gap-2'>
                            <Plus className='w-4 h-4' />
                            Add Request
                          </Button>
                        </div>
                      </div>

                      {formData.chainRequests &&
                      formData.chainRequests.length > 0 ? (
                        <div className='space-y-3'>
                          {formData.chainRequests.map((request, index) => {
                            const executionLog = getExecutionLogForRequest(
                              executionLogs,
                              request.id
                            );

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
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div
                                              className='cursor-move'
                                              draggable
                                              onDragStart={() =>
                                                handleDragStart(index)
                                              }
                                              onDragEnter={() =>
                                                handleDragEnter(index)
                                              }
                                              onDragEnd={handleDragEnd}
                                            >
                                              <GripVertical className='w-5 h-5 text-muted-foreground' />
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Drag to change the order</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
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
                                      <Badge
                                        className={getMethodColor(
                                          request.method
                                        )}
                                      >
                                        {request.method}
                                      </Badge>
                                      <div className='flex-1'>
                                        {editingNameId === request.id ? (
                                          <div className='flex items-center gap-2'>
                                            <Input
                                              value={tempName}
                                              onChange={(e) =>
                                                setTempName(e.target.value)
                                              }
                                              className='h-8 max-w-[280px]'
                                              placeholder='Request name'
                                              autoFocus
                                            />
                                            <Button
                                              variant='ghost'
                                              size='icon'
                                              aria-label='Save name'
                                              onClick={() => {
                                                commitRequestName(
                                                  index,
                                                  tempName
                                                );
                                                setEditingNameId(null);
                                                setTempName('');
                                              }}
                                              className='text-green-600 hover:text-green-700'
                                              title='Save'
                                            >
                                              <Check className='w-4 h-4' />
                                            </Button>
                                            <Button
                                              variant='ghost'
                                              size='icon'
                                              aria-label='Cancel'
                                              onClick={() => {
                                                setEditingNameId(null);
                                                setTempName('');
                                              }}
                                              className='text-red-600 hover:text-red-700'
                                              title='Cancel'
                                            >
                                              <X className='w-4 h-4' />
                                            </Button>
                                          </div>
                                        ) : (
                                          <div className='flex items-center gap-2'>
                                            <p className='font-medium'>
                                              {request.name ||
                                                request.url ||
                                                'New Request'}
                                            </p>
                                            <Button
                                              variant='ghost'
                                              size='icon'
                                              aria-label='Edit name'
                                              onClick={() => {
                                                setEditingNameId(request.id);
                                                setTempName(
                                                  request.name ||
                                                    request.url ||
                                                    ''
                                                );
                                              }}
                                              title='Edit name'
                                            >
                                              <Pencil className='w-4 h-4' />
                                            </Button>
                                          </div>
                                        )}
                                        <p className='text-sm text-muted-foreground'>
                                          {/* {request.url || 'No URL specified'} */}
                                        </p>
                                      </div>
                                      <div className='flex items-center space-x-2'>
                                        {executionLog && (
                                          <div className='flex items-center space-x-1'>
                                            {executionLog.status ===
                                            'success' ? (
                                              <CheckCircle className='w-4 h-4 text-green-500' />
                                            ) : (
                                              <XCircle className='w-4 h-4 text-red-500' />
                                            )}
                                            {executionLog.response && (
                                              <Badge
                                                variant={
                                                  executionLog.response.status <
                                                  300
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
                                              onClick={() =>
                                                removeRequest(request.id)
                                              }
                                              className='text-red-600 hover:text-red-700'
                                            >
                                              <Trash2 className='w-4 h-4' />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            Delete Request
                                          </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant='ghost'
                                              size='sm'
                                              onClick={() =>
                                                toggleRequestExpanded(
                                                  request.id
                                                )
                                              }
                                            >
                                              {expandedRequests.has(
                                                request.id
                                              ) ? (
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
                                      </div>
                                    </TooltipProvider>
                                  </div>

                                  {expandedRequests.has(request.id) && (
                                    <div className='mt-4 pt-4 border-t space-y-4'>
                                      <RequestEditor
                                        request={request}
                                        onUpdate={(updates) =>
                                          updateRequest(request.id, updates)
                                        }
                                        compact={true}
                                        chainName={formData.name}
                                        chainDescription={formData.description}
                                        chainEnabled={formData.enabled}
                                        environmentBaseUrl={environmentBaseUrl}
                                        chainId={chain?.id || ''}
                                      />

                                      {/* Response Section */}
                                      {executionLog && (
                                        <div className='border-t border-gray-200 pt-4'>
                                          <div className='flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 rounded-t-lg'>
                                            <div className='flex items-center space-x-4'>
                                              {executionLog.status ===
                                              'success' ? (
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
                                                      executionLog.response
                                                        .status < 300
                                                        ? 'bg-green-100 text-green-800'
                                                        : executionLog.response
                                                            .status < 400
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}
                                                  >
                                                    {
                                                      executionLog.response
                                                        .status
                                                    }{' '}
                                                    {executionLog.response
                                                      .status === 200
                                                      ? 'OK'
                                                      : executionLog.response
                                                          .status === 201
                                                      ? 'Created'
                                                      : executionLog.response
                                                          .status === 404
                                                      ? 'Not Found'
                                                      : executionLog.response
                                                          .status === 500
                                                      ? 'Server Error'
                                                      : ''}
                                                  </span>
                                                  <span className='text-sm text-gray-600'>
                                                    {executionLog.duration}ms
                                                  </span>
                                                  <span className='text-sm text-gray-600'>
                                                    {(
                                                      executionLog.response
                                                        .size / 1024
                                                    ).toFixed(2)}{' '}
                                                    KB
                                                  </span>
                                                </>
                                              )}
                                            </div>
                                          </div>

                                          {executionLog.response && (
                                            <div className='border-t border-gray-200 p-6'>
                                              <h3 className='text-lg font-medium text-gray-900 mb-4'>
                                                Extract Variables from Response
                                              </h3>
                                              <ResponseExplorer
                                                response={executionLog.response}
                                                onExtractVariable={(
                                                  extraction
                                                ) =>
                                                  handleExtractVariableForRequest(
                                                    executionLog.requestId,
                                                    extraction
                                                  )
                                                }
                                                extractedVariables={
                                                  extractedVariablesByRequest[
                                                    executionLog.requestId
                                                  ] || {}
                                                }
                                                existingExtractions={
                                                  formData.chainRequests.find(
                                                    (r) =>
                                                      r.id ===
                                                      executionLog.requestId
                                                  )?.extractVariables || []
                                                }
                                                onRemoveExtraction={(
                                                  variableName
                                                ) =>
                                                  handleRemoveExtractionForRequest(
                                                    executionLog.requestId,
                                                    variableName
                                                  )
                                                }
                                                handleCopy={(value) =>
                                                  handleCopyForRequest(
                                                    executionLog.requestId,
                                                    value
                                                  )
                                                }
                                                chainId={chain?.id ?? ''}
                                                copied={
                                                  copiedStates[
                                                    executionLog.requestId
                                                  ] || false
                                                }
                                                // chainId={chain?.id ?? ''}
                                              />
                                            </div>
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
                        <div className='text-center py-12'>
                          <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                            <Code className='w-8 h-8 text-gray-400' />
                          </div>
                          <h3 className='text-lg font-medium text-gray-900 mb-2'>
                            No requests in this chain
                          </h3>
                          <p className='text-sm text-gray-500 mb-6'>
                            Get started by adding your first request or
                            importing from a collection
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
                              Add First Request
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value='variables-table'>
                  <VariablesTable
                    requests={formData.chainRequests || []}
                    executionLogs={executionLogs}
                    extractedVariables={extractedVariables}
                    isExecuting={isExecuting}
                    currentRequestIndex={currentRequestIndex}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* 3. Save & Execute Chain Box */}
          <Card>
            <CardHeader>
              <CardTitle>
                {chain?.id ? 'Update & Execute Chain' : 'Save & Execute Chain'}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <RequestExecutor
                requests={formData.chainRequests || []}
                variables={(formData.variables || []).map((v) => ({
                  ...v,
                  id: v.id ?? crypto.randomUUID(),
                  value: v.value ?? '',
                  source: v.source ?? 'manual',
                }))}
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
                onPreExecute={saveChainToAPI}
                chainName={formData?.name}
                chainId={chain?.id}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportRequests}
        importedRequestIds={formData.chainRequests?.map((r) => r.id) || []}
      />
    </div>
  );

  function updateExtractedVariables(allExtractedVars: Record<string, any>) {
    setExtractedVariables(allExtractedVars);
    setGlobalVariables((prevGlobalVariables) => {
      const updatedGlobalVariables = [...prevGlobalVariables];
      Object.entries(allExtractedVars).forEach(([key, value]) => {
        const existingVarIndex = updatedGlobalVariables.findIndex(
          (v) => v.name === key
        );
        const newVar: Variable = {
          id:
            existingVarIndex >= 0
              ? updatedGlobalVariables[existingVarIndex].id
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
          updatedGlobalVariables[existingVarIndex] = newVar;
        } else {
          updatedGlobalVariables.push(newVar);
        }
      });
      return updatedGlobalVariables;
    });
  }
}
