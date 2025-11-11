'use client';
import { useState, useRef, useEffect } from 'react';
import type React from 'react';

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
  Link2,
  Edit,
  X,
  Check,
  Shuffle,
  Edit3,
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
  DynamicVariableOverride,
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
  copyToClipboard,
  mapDynamicToStatic,
  regenerateDynamicVariable,
  getVariablesByPrefix,
  getUsedDynamicVariablesFromRequests,
  detectAutocompletePrefix,
  calculateAutocompletePosition,
  type AutocompleteState,
} from '@/lib/request-utils';
import { ResponseExplorer } from './ResponseExplorer';
import BreadCum from '../BreadCum/Breadcum';
import { useDataManagementStore } from '@/store/dataManagementStore';

interface RequestChainEditorProps {
  chain?: RequestChain;
  onBack: () => void;
  onSave: (chain: RequestChain) => void;
  requestChainId?: string;
}

// Removed duplicate type definitions for Variable and DynamicVariableOverride
// They are now imported from '@/lib/request-utils'

export function RequestChainEditor({
  chain,
  onBack,
  onSave,
  requestChainId,
}: RequestChainEditorProps) {
  const { toast } = useToast();
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const { currentWorkspace } = useWorkspace();

  const { variables: storeVariables, dynamicVariables } =
    useDataManagementStore();

  const [dynamicOverrides, setDynamicOverrides] = useState<
    DynamicVariableOverride[]
  >([]);
  const [showDynamicEditor, setShowDynamicEditor] = useState(false);

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
        bodyType: req.bodyType || (req.bodyRawContent ? 'raw' : 'none'),
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
      if (chain?.environmentId && environments.length > 0) {
        // Edit mode: set from the chain’s environment
        const chainEnvironment = environments.find(
          (env) => env.id === chain.environmentId
        );
        if (chainEnvironment) {
          setSelectedEnvironment(chain.environmentId);
          setEnvironmentBaseUrl(chainEnvironment.baseUrl || '');
        }
      } else if (!chain) {
        // Create mode: use the currently active environment
        setSelectedEnvironment(activeEnvironment.id);
        setEnvironmentBaseUrl(activeEnvironment.baseUrl || '');
      }
    }
  }, [activeEnvironment, chain, environments]);

  const handleEnvironmentChange = (environmentId: string) => {
    setSelectedEnvironment(environmentId);
    const selectedEnv = environments.find((env) => env.id === environmentId);
    // if (selectedEnv) {
    //   setActiveEnvironment(selectedEnv);
    //   setEnvironmentBaseUrl(selectedEnv.baseUrl || '');
    // }
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

  const [autocompleteState, setAutocompleteState] = useState<AutocompleteState>(
    {
      show: false,
      position: { top: 0, left: 0 },
      suggestions: [],
      prefix: null,
      inputRef: null,
      cursorPosition: 0,
    }
  );

  const dynamicStructured = mapDynamicToStatic(
    dynamicVariables,
    dynamicOverrides
  );

  const getUsedDynamicVariables = () => {
    return getUsedDynamicVariablesFromRequests(
      formData.chainRequests || [],
      dynamicStructured
    );
  };

  const usedDynamicVariables = getUsedDynamicVariables();

  const updateDynamicOverride = (name: string, value: string | number) => {
    setDynamicOverrides((prev) => {
      const existing = prev.find((o) => o.name === name);
      if (existing) {
        return prev.map((o) => (o.name === name ? { ...o, value } : o));
      } else {
        return [...prev, { name, value }];
      }
    });
  };

  const regenerateDynamicVariableLocal = (variableName: string) => {
    const dynamicVar = dynamicVariables.find((v) => v.name === variableName);
    if (!dynamicVar) return;

    const newValue = regenerateDynamicVariable(dynamicVar);

    setDynamicOverrides((prev) => [
      ...prev.filter((o) => o.name !== variableName),
      { name: variableName, value: newValue },
    ]);
  };

  // Dynamic Variables Panel Component
  const DynamicVariablesPanel = () => {
    if (usedDynamicVariables.length === 0) return null;

    return (
      <div className='mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center gap-2'>
            <Shuffle className='w-4 h-4 text-purple-600' />
            <h4 className='text-sm font-medium text-purple-900'>
              Dynamic Variables ({usedDynamicVariables.length})
            </h4>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowDynamicEditor(!showDynamicEditor)}
            className='text-purple-700 border-purple-300 hover:bg-purple-100'
          >
            <Edit3 className='w-3 h-3 mr-1' />
            {showDynamicEditor ? 'Hide Editor' : 'Edit Values'}
          </Button>
        </div>

        {showDynamicEditor ? (
          <div className='space-y-3'>
            {usedDynamicVariables.map((variable) => {
              const originalName = variable.name.replace('', '');
              const currentOverride = dynamicOverrides.find(
                (o) => o.name === originalName
              );

              return (
                <div key={variable.id} className='flex items-center gap-3'>
                  <div className='flex items-center gap-2 flex-1'>
                    <span className='text-xs font-mono text-purple-700 min-w-0'>{`{{${variable.name}}}`}</span>
                    <Input
                      value={String(currentOverride?.value || variable.value)}
                      onChange={(e) =>
                        updateDynamicOverride(originalName, e.target.value)
                      }
                      className='h-8 text-sm'
                      placeholder='Enter value'
                    />
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => regenerateDynamicVariableLocal(originalName)}
                    className='h-8 w-8 p-0 text-purple-600 hover:bg-purple-100'
                    title='Regenerate random value'
                  >
                    <Shuffle className='w-3 h-3' />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className='flex flex-wrap gap-2'>
            {usedDynamicVariables.map((variable) => {
              const originalName = variable.name.replace('', '');
              return (
                <div
                  key={variable.id}
                  className='flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded border border-purple-200'
                >
                  <span className='text-xs font-mono'>
                    {`{{${variable.name}}}`} = {String(variable.value)}
                  </span>
                  <button
                    onClick={() => regenerateDynamicVariableLocal(originalName)}
                    className='ml-1 p-0.5 hover:bg-purple-200 rounded transition-colors'
                    title='Regenerate value'
                  >
                    <Shuffle className='w-3 h-3' />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const replaceVariables = (text: string, vars: Variable[]): string => {
    if (!text) return text;
    let result = text;
    vars.forEach((variable) => {
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      result = result.replace(
        regex,
        variable.value ?? variable.initialValue ?? ''
      );
    });
    return result;
  };

  const processRequestWithVariables = (
    request: APIRequest,
    variables: Variable[]
  ): APIRequest => {
    return {
      ...request,
      url: replaceVariables(request.url, variables),
      body: replaceVariables(request.body || '', variables),
      headers:
        request.headers?.map((header) => ({
          ...header,
          key: replaceVariables(header.key, variables),
          value: replaceVariables(header.value, variables),
        })) || [],
      params:
        request.params?.map((param) => ({
          ...param,
          key: replaceVariables(param.key, variables),
          value: replaceVariables(param.value, variables),
        })) || [],
      authToken: replaceVariables(request.authToken || '', variables),
      authUsername: replaceVariables(request.authUsername || '', variables),
      authPassword: replaceVariables(request.authPassword || '', variables),
      authApiKey: replaceVariables(request.authApiKey || '', variables),
      authApiValue: replaceVariables(request.authApiValue || '', variables),
    };
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

  const getAllVariablesForRequestAtRuntime = (
    requestIndex: number,
    currentExecutionExtractedVars: Record<string, any>
  ): Variable[] => {
    const environmentVars = getExtractVariablesByEnvironment(
      activeEnvironment?.id
    );

    const previouslyExtractedVars: Variable[] = [];
    Object.entries(currentExecutionExtractedVars).forEach(([name, value]) => {
      if (!previouslyExtractedVars.some((v) => v.name === name)) {
        previouslyExtractedVars.push({
          id: `extracted_${name}`,
          name,
          value: String(value),
          initialValue: String(value),
          type:
            typeof value === 'number'
              ? 'number'
              : typeof value === 'boolean'
              ? 'boolean'
              : 'string',
        });
      }
    });

    return [
      ...globalVariables,
      ...storeVariables,
      ...dynamicStructured,
      ...(formData.variables || []),
      ...environmentVars.filter(
        (ev) =>
          !previouslyExtractedVars.some((pv) => pv.name === ev.name) &&
          !globalVariables.some((gv) => gv.name === ev.name) &&
          !storeVariables.some((sv) => sv.name === ev.name) &&
          !dynamicStructured.some((dv) => dv.name === ev.name) &&
          !(formData.variables || []).some((fv) => fv.name === ev.name)
      ),
      ...previouslyExtractedVars,
    ];
  };

  const getAllVariablesForRequest = (requestIndex: number): Variable[] => {
    const environmentVars = getExtractVariablesByEnvironment(
      activeEnvironment?.id
    );

    const previouslyExtractedVars: Variable[] = [];
    for (let i = 0; i < requestIndex; i++) {
      const reqId = formData.chainRequests?.[i]?.id;
      if (reqId && extractedVariablesByRequest[reqId]) {
        Object.entries(extractedVariablesByRequest[reqId]).forEach(
          ([name, value]) => {
            if (!previouslyExtractedVars.some((v) => v.name === name)) {
              previouslyExtractedVars.push({
                id: `extracted_${name}`,
                name,
                value: String(value),
                initialValue: String(value),
                type:
                  typeof value === 'number'
                    ? 'number'
                    : typeof value === 'boolean'
                    ? 'boolean'
                    : 'string',
              });
            }
          }
        );
      }
    }

    const globalExtractedVars: Variable[] = Object.entries(
      extractedVariables
    ).map(([name, value]) => ({
      id: `global_${name}`,
      name,
      value: String(value),
      initialValue: String(value),
      type:
        typeof value === 'number'
          ? 'number'
          : typeof value === 'boolean'
          ? 'boolean'
          : 'string',
    }));

    return [
      ...globalVariables,
      ...storeVariables,
      ...dynamicStructured,
      ...(formData.variables || []),
      ...environmentVars.filter(
        (ev) =>
          !previouslyExtractedVars.some((pv) => pv.name === ev.name) &&
          !globalExtractedVars.some((gv) => gv.name === ev.name) &&
          !storeVariables.some((sv) => sv.name === ev.name) &&
          !dynamicStructured.some((dv) => dv.name === ev.name)
      ),
      ...previouslyExtractedVars,
      ...globalExtractedVars.filter(
        (gv) => !previouslyExtractedVars.some((pv) => pv.name === gv.name)
      ),
    ];
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

    const startTime = Date.now();

    const processedRequest = processRequestWithVariables(request, variables);
    {
      const token = (
        processedRequest.authToken ||
        processedRequest.authorization?.token ||
        ''
      ).trim();
      if (token) {
        (processedRequest as any).authorizationType = 'bearer';

        const headers = Array.isArray(processedRequest.headers)
          ? [...processedRequest.headers]
          : [];
        const authIdx = headers.findIndex(
          (h) => h?.key?.toLowerCase() === 'authorization'
        );
        const value = `Bearer ${token}`;
        if (authIdx >= 0) {
          headers[authIdx] = {
            ...headers[authIdx],
            value,
            enabled: true,
          };
        } else {
          headers.push({
            id: `temp_${Date.now()}`,
            key: 'Authorization',
            value,
            enabled: true,
          });
        }
        (processedRequest as any).headers = headers;
      }
    }

    const payload = buildRequestPayload(processedRequest, variables);
    const previewUrl = getPreviewUrl(request, variables);
    payload.request.url = previewUrl;

    try {
      console.log('payload111:', payload);

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
          method: processedRequest.method,
          url: previewUrl,
          headers: Object.fromEntries(
            processedRequest.headers.map((h) => [h.key, h.value])
          ),
          body: processedRequest.body ?? '',
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

      try {
        const raw = localStorage.getItem('lastExecutionByRequest');
        const map = raw ? JSON.parse(raw) : {};
        map[request.id] = log;
        localStorage.setItem('lastExecutionByRequest', JSON.stringify(map));
      } catch (e) {
        console.error('Failed to persist lastExecutionByRequest:', e);
      }

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
          method: processedRequest.method,
          url: previewUrl,
          headers: {},
          body: processedRequest.body,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      try {
        const raw = localStorage.getItem('lastExecutionByRequest');
        const map = raw ? JSON.parse(raw) : {};
        map[request.id] = errorLog;
        localStorage.setItem(
          'lastExecutionByRequest',
          JSON.stringify(errorLog)
        );
      } catch (e) {
        console.error('Failed to persist lastExecutionByRequest (error):', e);
      }

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

    const baseVariables = [
      ...globalVariables,
      ...storeVariables,
      ...dynamicStructured,
      ...(formData.variables || []),
      ...getExtractVariablesByEnvironment(activeEnvironment?.id).filter(
        (ev) =>
          !globalVariables.some((gv) => gv.name === ev.name) &&
          !storeVariables.some((sv) => sv.name === ev.name) &&
          !dynamicStructured.some((dv) => dv.name === ev.name) &&
          !(formData.variables || []).some((fv) => fv.name === ev.name)
      ),
    ];

    const allExtractedVarsInCurrentExecution: Record<string, any> = {};
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
          const existingLog = allLogs.find(
            (log) => log.requestId === request.id
          );
          let log: ExecutionLog;

          if (existingLog) {
            log = existingLog;
          } else {
            const currentAvailableVariables =
              getAllVariablesForRequestAtRuntime(
                i,
                allExtractedVarsInCurrentExecution
              );

            log = await executeSingleRequest(
              request,
              currentAvailableVariables,
              i
            );
            allLogs.push(log);
          }

          setExecutionLogs((prev) => {
            const filtered = prev.filter(
              (existingLog) => existingLog.requestId !== log.requestId
            );
            return [...filtered, log];
          });

          // Update extracted variables immediately after each request
          if (log.extractedVariables) {
            variablesByRequest[log.requestId] = { ...log.extractedVariables };
            setExtractedVariablesByRequest((prev) => ({
              ...prev,
              [log.requestId]: { ...log.extractedVariables },
            }));

            // Update the accumulated extracted variables for the current execution
            Object.assign(
              allExtractedVarsInCurrentExecution,
              log.extractedVariables
            );
            updateExtractedVariables(allExtractedVarsInCurrentExecution);
          }

          if (i < formData.chainRequests.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch (error) {
          const errorLog = error as ExecutionLog;
          const existingErrorIndex = allLogs.findIndex(
            (log) => log.requestId === errorLog.requestId
          );

          if (existingErrorIndex >= 0) {
            allLogs[existingErrorIndex] = errorLog;
          } else {
            allLogs.push(errorLog);
          }

          setExecutionLogs((prev) => {
            const filtered = prev.filter(
              (existingLog) => existingLog.requestId !== errorLog.requestId
            );
            return [...filtered, errorLog];
          });

          toast({
            title: `Request ${i + 1} Failed`,
            description: errorLog.error || 'Unknown error occurred',
            variant: 'destructive',
          });

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

      setExecutionLogs(allLogs);
      setExtractedVariables(allExtractedVarsInCurrentExecution);

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

  const handleRequestExecution = (
    requestId: string,
    executionLog: ExecutionLog
  ) => {
    setExecutionLogs((prev) => {
      const filtered = prev.filter((log) => log.requestId !== requestId);
      return [...filtered, executionLog];
    });

    if (executionLog.extractedVariables) {
      setExtractedVariablesByRequest((prev) => ({
        ...prev,
        [requestId]: { ...executionLog.extractedVariables },
      }));

      setExtractedVariables((prevGlobal) => ({
        ...prevGlobal,
        ...executionLog.extractedVariables,
      }));
    }
  };

  const handleExtractVariableForRequest = (
    requestId: string,
    extraction: DataExtraction
  ) => {
    const request = formData.chainRequests.find((r) => r.id === requestId);
    if (!request) return;

    const variableName = extraction.variableName || extraction.name;

    if (!variableName) {
      toast({
        title: 'Error',
        description: 'Variable name is required',
        variant: 'destructive',
      });
      return;
    }

    const isDuplicate = (request.extractVariables || []).some(
      (existing) => (existing.variableName || existing.name) === variableName
    );

    if (isDuplicate) {
      toast({
        title: 'Error',
        description: `Variable "${variableName}" already exists`,
        variant: 'destructive',
      });
      return;
    }

    const normalizedExtraction = {
      ...extraction,
      variableName,
      name: variableName,
    };

    const updatedExtractions = [
      ...(request.extractVariables || []),
      normalizedExtraction,
    ];
    const updatedRequests = formData.chainRequests.map((r) =>
      r.id === requestId ? { ...r, extractVariables: updatedExtractions } : r
    );

    setFormData({ ...formData, chainRequests: updatedRequests });

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

      setExtractedVariables((prevGlobal) => ({
        ...prevGlobal,
        ...extracted,
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
      (e) => (e.variableName || e.name) !== variableName
    );
    const updatedRequests = formData.chainRequests.map((r) =>
      r.id === requestId ? { ...r, extractVariables: updatedExtractions } : r
    );

    setFormData({ ...formData, chainRequests: updatedRequests });

    setExtractedVariablesByRequest((prev) => {
      const updated = { ...prev };
      if (updated[requestId]) {
        delete updated[requestId][variableName];
      }
      return updated;
    });

    setExtractedVariables((prev) => {
      const updated = { ...prev };
      delete updated[variableName];
      return updated;
    });
  };

  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [tempName, setTempName] = useState<string>('');

  const handleCopyForRequest = async (requestId: string, value: string) => {
    try {
      const formattedValue = `${value}`;
      await copyToClipboard(formattedValue);
      setCopiedStates((prev) => ({ ...prev, [requestId]: true }));
      toast({
        title: 'Copied to Clipboard',
        description: `Variable {{${formattedValue}}} copied to clipboard`,
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
      bodyType: 'raw',
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
      const transformedRequests: APIRequest[] = importedRequests.map((req) => {
        const hasBody = req.bodyRawContent && req.bodyRawContent.trim() !== '';
        const bodyType: APIRequest['bodyType'] = hasBody
          ? (req.bodyType as APIRequest['bodyType']) || 'raw'
          : 'none';

        const headers = Array.isArray(req.headers)
          ? req.headers.map((header: any) => ({
              id: header.id || `temp_${Date.now()}_${Math.random()}`,
              key: header.key || '',
              value: header.value || '',
              enabled: header.enabled !== false,
            }))
          : [];

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

      setFormData({
        ...formData,
        chainRequests: [
          ...(formData.chainRequests || []),
          ...transformedRequests,
        ],
      });

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

  const getVariablesByPrefixLocal = (
    prefix: 'D_' | 'S_',
    requestIndex: number
  ): Variable[] => {
    const allVars = getAllVariablesForRequest(requestIndex);
    return getVariablesByPrefix(allVars, prefix);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    requestIndex: number,
    originalHandler?: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => void
  ) => {
    const input = e.target;
    const value = input.value;
    const cursorPosition = input.selectionStart || 0;

    if (originalHandler) {
      originalHandler(e);
    }

    const prefix = detectAutocompletePrefix(value, cursorPosition);

    if (prefix) {
      const suggestions = getVariablesByPrefixLocal(prefix, requestIndex);

      if (suggestions.length > 0) {
        const position = calculateAutocompletePosition(input);

        setAutocompleteState({
          show: true,
          position,
          suggestions,
          prefix,
          inputRef: input,
          cursorPosition,
        });
      }
    } else {
      setAutocompleteState((prev) => ({ ...prev, show: false }));
    }
  };

  const handleVariableSelect = (variable: Variable) => {
    if (!autocompleteState.inputRef || !autocompleteState.prefix) return;

    const input = autocompleteState.inputRef;
    const currentValue = input.value;
    const cursorPos = autocompleteState.cursorPosition;

    // Replace D_ or S_ with the selected variable name
    const beforePrefix = currentValue.substring(0, cursorPos - 2);
    const afterCursor = currentValue.substring(cursorPos);
    const newValue = beforePrefix + variable.name + afterCursor;

    // Find which field this input belongs to and update the corresponding state
    const inputName =
      input.getAttribute('name') || input.getAttribute('data-field');
    const requestIndex = Number.parseInt(
      input.getAttribute('data-request-index') || '-1'
    ); // Use -1 to indicate not found

    // Ensure requestIndex is valid before proceeding
    if (requestIndex === -1) {
      // Fallback: directly update input value and dispatch event if requestIndex is not found
      input.value = newValue;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // Use a local copy of requests to avoid direct mutation of formData.chainRequests
      const requests = [...(formData.chainRequests || [])];

      if (inputName === 'url') {
        requests[requestIndex] = { ...requests[requestIndex], url: newValue };
        setFormData({ ...formData, chainRequests: requests });
      } else if (inputName === 'body') {
        requests[requestIndex] = { ...requests[requestIndex], body: newValue };
        setFormData({ ...formData, chainRequests: requests });
      } else if (inputName?.startsWith('header-key-')) {
        const headerIndex = Number.parseInt(inputName.split('-')[2]);
        if (!isNaN(headerIndex) && requests[requestIndex].headers) {
          const newHeaders = [...requests[requestIndex].headers];
          newHeaders[headerIndex] = {
            ...newHeaders[headerIndex],
            key: newValue,
          };
          requests[requestIndex] = {
            ...requests[requestIndex],
            headers: newHeaders,
          };
          setFormData({ ...formData, chainRequests: requests });
        }
      } else if (inputName?.startsWith('header-value-')) {
        const headerIndex = Number.parseInt(inputName.split('-')[2]);
        if (!isNaN(headerIndex) && requests[requestIndex].headers) {
          const newHeaders = [...requests[requestIndex].headers];
          newHeaders[headerIndex] = {
            ...newHeaders[headerIndex],
            value: newValue,
          };
          requests[requestIndex] = {
            ...requests[requestIndex],
            headers: newHeaders,
          };
          setFormData({ ...formData, chainRequests: requests });
        }
      } else if (inputName?.startsWith('param-key-')) {
        const paramIndex = Number.parseInt(inputName.split('-')[2]);
        if (!isNaN(paramIndex) && requests[requestIndex].params) {
          const newParams = [...requests[requestIndex].params];
          newParams[paramIndex] = { ...newParams[paramIndex], key: newValue };
          requests[requestIndex] = {
            ...requests[requestIndex],
            params: newParams,
          };
          setFormData({ ...formData, chainRequests: requests });
        }
      } else if (inputName?.startsWith('param-value-')) {
        const paramIndex = Number.parseInt(inputName.split('-')[2]);
        if (!isNaN(paramIndex) && requests[requestIndex].params) {
          const newParams = [...requests[requestIndex].params];
          newParams[paramIndex] = { ...newParams[paramIndex], value: newValue };
          requests[requestIndex] = {
            ...requests[requestIndex],
            params: newParams,
          };
          setFormData({ ...formData, chainRequests: requests });
        }
      } else if (inputName === 'auth-username') {
        requests[requestIndex] = {
          ...requests[requestIndex],
          authUsername: newValue, // Assuming authUsername is a direct property
        };
        setFormData({ ...formData, chainRequests: requests });
      } else if (inputName === 'auth-password') {
        requests[requestIndex] = {
          ...requests[requestIndex],
          authPassword: newValue, // Assuming authPassword is a direct property
        };
        setFormData({ ...formData, chainRequests: requests });
      } else if (inputName === 'auth-token') {
        requests[requestIndex] = {
          ...requests[requestIndex],
          authToken: newValue, // Assuming authToken is a direct property
        };
        setFormData({ ...formData, chainRequests: requests });
      } else {
        // Fallback: directly update input value and dispatch event if no specific handler found
        input.value = newValue;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    // Set cursor position after the inserted variable name
    const newCursorPos = beforePrefix.length + variable.name.length;
    setTimeout(() => {
      input.setSelectionRange(newCursorPos, newCursorPos);
      input.focus();
    }, 0);

    setAutocompleteState((prev) => ({ ...prev, show: false }));
  };

  const VariableAutocomplete = () => {
    if (!autocompleteState.show) return null;

    return (
      <div
        className='fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto'
        style={{
          top: autocompleteState.position.top,
          left: autocompleteState.position.left,
        }}
      >
        <div className='p-2 text-xs text-gray-500 border-b'>
          {autocompleteState.prefix === 'D_'
            ? 'Dynamic Variables'
            : 'Static Variables'}
        </div>
        {autocompleteState.suggestions.map((variable) => (
          <button
            key={variable.id}
            className='w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center justify-between'
            onClick={() => handleVariableSelect(variable)}
          >
            <span className='font-mono text-sm'>{variable.name}</span>
            <span className='text-xs text-gray-400 ml-2'>
              {String(variable.value || variable.initialValue || '').substring(
                0,
                20
              )}
              {String(variable.value || variable.initialValue || '').length > 20
                ? '...'
                : ''}
            </span>
          </button>
        ))}
      </div>
    );
  };

  if (editingRequestId) {
    const request = formData.chainRequests?.find(
      (r) => r.id === editingRequestId
    );

    if (request) {
      const requestIndex =
        formData.chainRequests?.findIndex((r) => r.id === editingRequestId) ??
        0;

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
              hideResponseExplorer={false}
              onRequestExecution={(executionLog) =>
                handleRequestExecution(editingRequestId, executionLog)
              }
              extractedVariables={extractedVariables}
              chainVariables={formData.variables || []}
            />
          </div>
        </div>
      );
    }
  }

  return (
    <div className='h-full flex flex-col'>
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

      <VariableAutocomplete />

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
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic Variables Panel */}
              <DynamicVariablesPanel />
            </CardContent>
          </Card>

          {/* 2. Requests and Extracted Variables Box */}
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
                          {formData.chainRequests.map(
                            (request, requestIndex) => {
                              const executionLog = getExecutionLogForRequest(
                                executionLogs,
                                request.id
                              );

                              return (
                                <Card
                                  key={request.id}
                                  className={`hover:shadow-sm transition-shadow ${
                                    currentRequestIndex === requestIndex
                                      ? 'ring-2 ring-primary'
                                      : ''
                                  }`}
                                >
                                  <CardContent className='p-2'>
                                    <div className='flex items-center'>
                                      <div className='flex items-center space-x-3'>
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div
                                                className='cursor-move'
                                                draggable
                                                onDragStart={() =>
                                                  handleDragStart(requestIndex)
                                                }
                                                onDragEnter={() =>
                                                  handleDragEnter(requestIndex)
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
                                            currentRequestIndex === requestIndex
                                              ? 'bg-primary text-primary-foreground animate-pulse'
                                              : 'bg-blue-100 text-blue-600'
                                          } rounded-full flex items-center justify-center text-sm font-medium`}
                                        >
                                          {currentRequestIndex ===
                                          requestIndex ? (
                                            <Loader2 className='w-4 h-4 animate-spin' />
                                          ) : (
                                            requestIndex + 1
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
                                                    requestIndex,
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
                                                <Edit className='w-4 h-4' />
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
                                                    executionLog.response
                                                      .status < 300
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
                                          chainDescription={
                                            formData.description
                                          }
                                          chainEnabled={formData.enabled}
                                          environmentBaseUrl={
                                            environmentBaseUrl
                                          }
                                          chainId={chain?.id || ''}
                                          hideResponseExplorer={true}
                                          onRequestExecution={(executionLog) =>
                                            handleRequestExecution(
                                              request.id,
                                              executionLog
                                            )
                                          }
                                          extractedVariables={
                                            extractedVariables
                                          }
                                          chainVariables={
                                            formData.variables || []
                                          }
                                        />

                                        {/* Response Section - Only show here, not in RequestEditor */}
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
                                                          : executionLog
                                                              .response.status <
                                                            400
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
                                                  Extract Variables from
                                                  Response
                                                </h3>
                                                <ResponseExplorer
                                                  response={
                                                    executionLog.response
                                                  }
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
                            }
                          )}
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
