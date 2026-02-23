'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { TooltipContent } from '@/components/ui/tooltip';
import {
  analyzeRequestChain,
  type AnalyzedRequest,
} from '@/lib/postman-analysis';

import type React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import {
  ArrowLeft,
  Code,
  Database,
  Loader2,
  PlayCircle,
  Info,
  Link2,
  Shuffle,
  Edit3,
  AlertTriangle,
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
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { VariablesTable } from './VariablesTable';
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
  getVariablesByPrefix,
  getUsedDynamicVariablesFromRequests,
  detectAutocompletePrefix,
  calculateAutocompletePosition,
  generateDynamicValueById,
  hasResponseChanged,
  getUsedVariablesForChain,
  syncParamsFromUrl,
} from '@/lib/request-utils';
import { ResponseExplorer } from './ResponseExplorer';
import BreadCum from '../BreadCum/Breadcum';
import { useDataManagementStore } from '@/store/dataManagementStore';
import { generateAssertions } from '@/utils/assertionGenerator';
import { useDataManagement } from '@/hooks/useDataManagement';
import { RequestAnalyzer } from './RequestAnalyzer';
import { AddRequestMenu } from './AddRequestMenu';
import { SortableRequestItem } from './DragAndDrop';
import {
  AutocompleteState,
  DynamicVariableOverride,
} from '@/shared/types/request';
import TagInput from '../TestSuitNew/Tags';

interface RequestChainEditorProps {
  chain?: RequestChain;
  onBack: () => void;
  onSave: (chain: RequestChain) => void;
  requestChainId?: string;
}

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

  const [tags, setTags] = useState<string[]>([]);

  const { variables: storeVariables, dynamicVariables } =
    useDataManagementStore();

  const { environments, activeEnvironment, setActiveEnvironment } =
    useDataManagement();

  const [dynamicOverrides, setDynamicOverrides] = useState<
    DynamicVariableOverride[]
  >([]);

  const [assertionsByRequest, setAssertionsByRequest] = useState<
    Record<string, any[]>
  >(() => {
    const initial: Record<string, any[]> = {};

    (chain?.chainRequests || []).forEach((req) => {
      if (Array.isArray(req.assertions) && req.assertions.length > 0) {
        initial[req.id] = req.assertions;
      }
    });

    return initial;
  });



  const [selectedEnvironment, setSelectedEnvironment] = useState<string>(
    chain?.environmentId || activeEnvironment?.id || '',
  );
  const [environmentBaseUrl, setEnvironmentBaseUrl] = useState<string>(
    chain?.environment?.baseUrl || activeEnvironment?.baseUrl || '',
  );
  const [analysisResults, setAnalysisResults] = useState<AnalyzedRequest[]>([]);

  useEffect(() => {
    if (!selectedEnvironment && activeEnvironment) {
      if (chain?.environmentId && environments.length > 0) {
        const chainEnvironment = environments.find(
          (env) => env.id === chain.environmentId,
        );
        if (chainEnvironment) {
          setSelectedEnvironment(chain.environmentId);
          setEnvironmentBaseUrl(chainEnvironment.baseUrl || '');
        }
      } else {
        setSelectedEnvironment(activeEnvironment.id);
        setEnvironmentBaseUrl(activeEnvironment.baseUrl || '');
      }
    }
    setTags(chain?.tags || []);
  }, [
    activeEnvironment,
    chain?.environmentId,
    environments,
    selectedEnvironment,
  ]);

  useEffect(() => {
    if (selectedEnvironment) {
      const selectedEnv = environments.find(
        (env) => env.id === selectedEnvironment,
      );
      if (selectedEnv) {
        setEnvironmentBaseUrl(selectedEnv.baseUrl || '');
      }
    }
  }, [selectedEnvironment, environments]);

  useEffect(() => {
    if (dynamicVariables.length > 0) {
      setDynamicOverrides((prevOverrides) => {
        const updatedOverrides = [...prevOverrides];
        dynamicVariables.forEach((d) => {
          const hasOverride = updatedOverrides.some((o) => o.name === d.name);
          if (!hasOverride) {
            const generated = generateDynamicValueById(
              d.generatorId,
              d.parameters,
            );
            updatedOverrides.push({
              name: d.name,
              value: String(generated),
            });
          }
        });

        return updatedOverrides.filter((override) =>
          dynamicVariables.some((d) => d.name === override.name),
        );
      });
    } else {
      setDynamicOverrides([]);
    }
  }, [dynamicVariables]);

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
        assertions: req.assertions || [],
        isSelected: true,
      }),
    ),
    variables: chain?.variables || [],
    environment: chain?.environment || 'dev',
    // environmentId: chain?.environmentId || 'dev',
    tags: chain?.tags || [],
  });

  useEffect(() => {
    try {
      const loadedAssertions: Record<string, any[]> = {};

      formData.chainRequests?.forEach((request) => {
        if (
          request.assertions &&
          Array.isArray(request.assertions) &&
          request.assertions.length > 0
        ) {
          loadedAssertions[request.id] = request.assertions;
        }
      });

      const raw = localStorage.getItem('lastExecutionByRequest');
      if (raw) {
        const map: Record<string, any> = JSON.parse(raw);
        const currentRequestIds = new Set(
          formData.chainRequests?.map((r) => r.id) || [],
        );


        Object.entries(map).forEach(([requestId, log]: [string, any]) => {
          if (
            currentRequestIds.has(requestId) &&
            log.assertions &&
            Array.isArray(log.assertions) &&
            log.assertions.length > 0 &&
            !loadedAssertions[requestId]
          ) {
            loadedAssertions[requestId] = log.assertions;
          }
        });
      }

      if (Object.keys(loadedAssertions).length > 0) {
        setAssertionsByRequest(loadedAssertions);
      }

    } catch (e) {
      console.error('Failed to load persisted assertions:', e);
    }
  }, [formData.chainRequests]);

  useEffect(() => {
    const currentRequestIds = new Set(
      formData.chainRequests?.map((r) => r.id) || [],
    );

    setAssertionsByRequest((prev) => {
      const filtered = Object.fromEntries(
        Object.entries(prev).filter(([requestId]) =>
          currentRequestIds.has(requestId),
        ),
      );


      return filtered;
    });
  }, [formData.chainRequests]);

  useEffect(() => {
    const currentRequestIds = new Set(
      formData.chainRequests?.map((r) => r.id) || [],
    );

    setAssertionsByRequest((prev) => {
      const filtered = Object.fromEntries(
        Object.entries(prev).filter(([requestId]) =>
          currentRequestIds.has(requestId),
        ),
      );


      return filtered;
    });
  }, [formData.chainRequests]);

  useEffect(() => {
    if (Object.keys(assertionsByRequest).length > 0) {
      Object.entries(assertionsByRequest).forEach(([requestId, assertions]) => {
        persistAssertionsToStorage(requestId, assertions);
      });
    }
  }, [assertionsByRequest]);

  useEffect(() => {
    const syncAssertionsFromStorage = () => {
      try {
        const raw = localStorage.getItem('lastExecutionByRequest');
        if (!raw) return;

        const map: Record<string, any> = JSON.parse(raw);
        const currentRequestIds = new Set(
          formData.chainRequests?.map((r) => r.id) || [],
        );

        let hasChanges = false;
        const updatedRequests = formData.chainRequests?.map((request) => {
          if (
            currentRequestIds.has(request.id) &&
            map[request.id]?.assertions
          ) {
            const storageAssertions = map[request.id].assertions;
            const currentAssertions = request.assertions || [];

            if (
              JSON.stringify(storageAssertions) !==
              JSON.stringify(currentAssertions)
            ) {
              hasChanges = true;

              setAssertionsByRequest((prev) => ({
                ...prev,
                [request.id]: storageAssertions,
              }));

              return {
                ...request,
                assertions: storageAssertions,
              };
            }
          }
          return request;
        });

        if (hasChanges && updatedRequests) {
          setFormData((prev) => ({
            ...prev,
            chainRequests: updatedRequests,
          }));
        }
      } catch (e) {
        console.error('Failed to sync assertions from localStorage:', e);
      }
    };

    syncAssertionsFromStorage();

    window.addEventListener('storage', syncAssertionsFromStorage);

    const intervalId = setInterval(syncAssertionsFromStorage, 500);

    return () => {
      window.removeEventListener('storage', syncAssertionsFromStorage);
      clearInterval(intervalId);
    };
  }, [formData.chainRequests]);

  const handleEnvironmentChange = (environmentId: string) => {
    setSelectedEnvironment(environmentId);
    const selectedEnv = environments.find((env) => env.id === environmentId);
    if (selectedEnv) {
      setEnvironmentBaseUrl(selectedEnv.baseUrl || '');
    }
    setActiveEnvironment?.(
      environments.find((env) => env.id === environmentId) || null,
    );
  };
  const isSaveDisabled =
    !formData.name?.trim() || (formData.chainRequests?.length ?? 0) === 0;
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(
    new Set(),
  );
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);

  const [extractedVariables, setExtractedVariables] = useState<
    Record<string, any>
  >([]);

  const extractedVariablesArray = Object.entries(extractedVariables).map(
    ([name, value]) => ({
      name,
      value,
    }),
  );

  const [extractedVariablesByRequest, setExtractedVariablesByRequest] =
    useState<Record<string, Record<string, any>>>({});

  const [isExecuting, setIsExecuting] = useState(false);
  const [currentRequestIndex, setCurrentRequestIndex] = useState(-1);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('requests');
  const [isSaving, setIsSaving] = useState(false);
  const runAllButtonRef = useRef<HTMLButtonElement>(null);
  const [showRunAllHint, setShowRunAllHint] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const requestsTopRef = useRef<HTMLDivElement>(null);

  const [autocompleteState, setAutocompleteState] = useState<AutocompleteState>(
    {
      show: false,
      position: { top: 0, left: 0 },
      suggestions: [],
      prefix: null,
      inputRef: null,
      cursorPosition: 0,
    },
  );

  const dynamicStructured = useMemo(
    () => mapDynamicToStatic(dynamicVariables, dynamicOverrides),
    [dynamicVariables, dynamicOverrides],
  );

  const usedDynamicVariables = useMemo(() => {
    return getUsedDynamicVariablesFromRequests(
      formData.chainRequests || [],
      dynamicStructured,
    );
  }, [formData.chainRequests, dynamicStructured]);

  const updateDynamicOverride = (name: string, value: string) => {
    setDynamicOverrides((prev) => {
      const existing = prev.find((o) => o.name === name);
      if (existing) {
        return prev.map((o) => (o.name === name ? { name, value } : { ...o }));
      } else {
        return [...prev, { name, value }];
      }
    });
  };

  const regenerateDynamicVariableLocal = (name: string) => {
    const dynamicVar = dynamicVariables.find((d) => d.name === name);
    if (!dynamicVar) return;
    const newValue = `${generateDynamicValueById(
      dynamicVar.generatorId,
      dynamicVar.parameters,
    )}`;
    updateDynamicOverride(name, newValue);
  };

  const regenerateAllDynamicVariables = () => {
    const newOverrides: DynamicVariableOverride[] = [];
    dynamicVariables.forEach((dynamicVar) => {
      const newValue = `${generateDynamicValueById(
        dynamicVar.generatorId,
        dynamicVar.parameters,
      )}`;
      newOverrides.push({
        name: dynamicVar.name,
        value: newValue,
      });
    });
    setDynamicOverrides(newOverrides);
  };

  const scrollToRunAllButton = () => {
    if (runAllButtonRef.current) {
      runAllButtonRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      runAllButtonRef.current.classList.add(
        'ring-2',
        'ring-primary',
        'ring-offset-2',
      );
      setTimeout(() => {
        runAllButtonRef.current?.classList.remove(
          'ring-2',
          'ring-primary',
          'ring-offset-2',
        );
      }, 2000);
    }
  };

  const handleApplyToAllRequests = (variableName: string) => {
    if (!formData.chainRequests) return;

    setIsAnalyzerOpen(false);

    const sourceRequestIndex = formData.chainRequests.findIndex((req) => {
      const reqId = req.id;
      return extractedVariablesByRequest[reqId]?.[variableName] !== undefined;
    });

    if (sourceRequestIndex === -1) {
      toast({
        title: 'Error',
        description: 'Unable to determine the source request',
        variant: 'destructive',
      });
      return;
    }

    const sourceRequest = formData.chainRequests[sourceRequestIndex];

    const getDomain = (url: string): string | null => {
      try {
        if (url.startsWith('/')) {
          return environmentBaseUrl
            ? new URL(environmentBaseUrl).hostname
            : null;
        }
        const urlObj = new URL(url);
        return urlObj.hostname;
      } catch {
        return null;
      }
    };

    const sourceDomain = getDomain(sourceRequest.url);

    let appliedCount = 0;
    let overwrittenCount = 0;
    let unauthorizedCount = 0;

    const updatedRequests = formData.chainRequests.map((request, index) => {
      if (index <= sourceRequestIndex) return request;

      const requestDomain = getDomain(request.url);
      const hasSameDomain = sourceDomain && requestDomain === sourceDomain;

      const executionLog = executionLogs.find(
        (log) => log.requestId === request.id,
      );
      const has401Status = executionLog?.response?.status === 401;

      if (hasSameDomain || has401Status) {
        appliedCount++;

        const hasExistingAuth =
          request.authorizationType !== 'none' ||
          (request.authToken && request.authToken.trim() !== '') ||
          (request.authorization?.token &&
            request.authorization.token.trim() !== '');

        if (hasExistingAuth) {
          overwrittenCount++;
        }

        if (has401Status) {
          unauthorizedCount++;
        }

        return {
          ...request,
          authToken: `{{${variableName}}}`,
          authorizationType: 'bearer' as const,
          authorization: {
            token: `{{${variableName}}}`,
          },
          authUsername: '',
          authPassword: '',
          authApiKey: '',
          authApiValue: '',
          authApiLocation: 'header',
        };
      }

      return request;
    });

    if (appliedCount === 0) {
      toast({
        title: 'No Requests Updated',
        description: `No subsequent requests found with matching domain "${sourceDomain}" or 401 status`,
        variant: 'destructive',
      });
      return;
    }

    setFormData({ ...formData, chainRequests: [...updatedRequests] });

    const descriptionParts = [
      `Variable {{${variableName}}} applied as Bearer Token to ${appliedCount} request(s)`,
    ];

    if (unauthorizedCount > 0) {
      descriptionParts.push(
        `${unauthorizedCount} with 401 Unauthorized status`,
      );
    }

    if (overwrittenCount > 0) {
      descriptionParts.push(`${overwrittenCount} overwritten`);
    }

    toast({
      title: 'Applied to Subsequent Requests',
      description: descriptionParts.join(', '),
    });
  };

  const handleApplyToRequest = (requestId: string, variableName: string) => {
    if (!formData.chainRequests) return;

    const targetRequestIndex = formData.chainRequests.findIndex(
      (req) => req.id === requestId,
    );

    if (targetRequestIndex === -1) {
      toast({
        title: 'Error',
        description: 'Unable to find the target request',
        variant: 'destructive',
      });
      return;
    }

    const targetRequest = formData.chainRequests[targetRequestIndex];

    let extractedValue: string | undefined;
    for (const [reqId, vars] of Object.entries(extractedVariablesByRequest)) {
      if (vars[variableName]) {
        extractedValue = String(vars[variableName]);
        break;
      }
    }

    if (!extractedValue) {
      toast({
        title: 'Error',
        description: 'Could not find the extracted variable value',
        variant: 'destructive',
      });
      return;
    }

    const variablePattern = `{{${variableName}}}`;
    let applicationsCount = 0;
    const applications: string[] = [];

    const updatedRequests = formData.chainRequests.map((request, index) => {
      if (index !== targetRequestIndex) return request;

      const updated = { ...request };

      if (updated.url.includes(extractedValue)) {
        updated.url = updated.url.replace(
          new RegExp(extractedValue, 'g'),
          variablePattern,
        );
        applicationsCount++;
        applications.push('URL');
      }

      if (updated.params) {
        updated.params = updated.params.map((param) => {
          if (param.value.includes(extractedValue)) {
            applicationsCount++;
            applications.push(`param: ${param.key}`);
            return {
              ...param,
              value: param.value.replace(
                new RegExp(extractedValue, 'g'),
                variablePattern,
              ),
            };
          }
          return param;
        });
      }

      if (updated.headers) {
        updated.headers = updated.headers.map((header) => {
          if (header.value.includes(extractedValue)) {
            applicationsCount++;
            applications.push(`header: ${header.key}`);
            return {
              ...header,
              value: header.value.replace(
                new RegExp(extractedValue, 'g'),
                variablePattern,
              ),
            };
          }
          return header;
        });
      }

      if (updated.body && updated.body.includes(extractedValue)) {
        updated.body = updated.body.replace(
          new RegExp(extractedValue, 'g'),
          variablePattern,
        );
        applicationsCount++;
        applications.push('body');
      }

      if (updated.authToken && updated.authToken.includes(extractedValue)) {
        updated.authToken = updated.authToken.replace(
          new RegExp(extractedValue, 'g'),
          variablePattern,
        );
        applicationsCount++;
        applications.push('auth token');
      }

      if (
        updated.authorization?.token &&
        updated.authorization.token.includes(extractedValue)
      ) {
        updated.authorization = {
          ...updated.authorization,
          token: updated.authorization.token.replace(
            new RegExp(extractedValue, 'g'),
            variablePattern,
          ),
        };
        if (!applications.includes('auth token')) {
          applicationsCount++;
          applications.push('auth token');
        }
      }

      return updated;
    });

    if (applicationsCount === 0) {
      toast({
        title: 'No Changes Made',
        description: `The value "${extractedValue.substring(
          0,
          20,
        )}..." was not found in request #${targetRequestIndex + 1}`,
        variant: 'destructive',
      });
      return;
    }

    setFormData({ ...formData, chainRequests: [...updatedRequests] });

    toast({
      title: 'Variable Applied',
      description: `{{${variableName}}} applied to ${applicationsCount} location(s) in request #${targetRequestIndex + 1
        }: ${applications.join(', ')}`,
    });
  };

  const replaceVariables = (text: string, vars: Variable[]): string => {
    if (!text) return text;
    let result = text;
    vars.forEach((variable) => {
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      result = result.replace(
        regex,
        variable.value ?? variable.initialValue ?? '',
      );
    });
    return result;
  };

  const processRequestWithVariables = (
    request: APIRequest,
    variables: Variable[],
  ): APIRequest => {
    let processedBody = request.body || '';

    if (
      request.variable &&
      Array.isArray(request.variable) &&
      request.variable.length > 0
    ) {
      try {
        const parsedBody = JSON.parse(processedBody);

        request.variable.forEach((varItem: any) => {
          const variable = variables.find((v) => v.name === varItem.name);
          if (variable && varItem.path) {
            parsedBody[varItem.path] =
              variable.value || variable.initialValue || '';
          }
        });

        processedBody = JSON.stringify(parsedBody);
      } catch (e) {
        console.warn(
          '[v0] Failed to parse body for selectedVariable substitution, using string replacement:',
          e,
        );
        processedBody = replaceVariables(processedBody, variables);
      }
    } else {
      processedBody = replaceVariables(processedBody, variables);
    }

    return {
      ...request,
      url: replaceVariables(request.url, variables),
      body: processedBody,
      bodyRawContent: processedBody,
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
      authorization: request.authorization
        ? {
          ...request.authorization,
          token: replaceVariables(
            request.authorization.token || '',
            variables,
          ),
        }
        : request.authorization,
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
    currentExecutionExtractedVars: Record<string, any>,
  ): Variable[] => {
    const environmentVars = getExtractVariablesByEnvironment(
      activeEnvironment?.id,
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
          !(formData.variables || []).some((fv) => fv.name === ev.name),
      ),
      ...previouslyExtractedVars,
    ];
  };

  const getAllVariablesForRequest = (requestIndex: number): Variable[] => {
    const environmentVars = getExtractVariablesByEnvironment(
      activeEnvironment?.id,
    );

    const previouslyExtractedVars: Variable[] = [];
    for (let i = 0; i < requestIndex; i++) {
      const reqId = formData.chainRequests?.[i]?.id;
      const reqName = formData.chainRequests?.[i]?.name || `Request ${i + 1}`;

      if (reqId && extractedVariablesByRequest[reqId]) {
        Object.entries(extractedVariablesByRequest[reqId]).forEach(
          ([name, value]) => {
            if (!previouslyExtractedVars.some((v) => v.name === name)) {
              previouslyExtractedVars.push({
                id: `extracted_${name}_from_req_${i}`,
                name,
                value: String(value),
                initialValue: String(value),
                type:
                  typeof value === 'number'
                    ? 'number'
                    : typeof value === 'boolean'
                      ? 'boolean'
                      : 'string',
                description: `From: ${reqName}`,
              });
            }
          },
        );
      }
    }

    const globalExtractedVars: Variable[] = Object.entries(
      extractedVariables,
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
          !dynamicStructured.some((dv) => dv.name === ev.name),
      ),
      ...previouslyExtractedVars,
      ...globalExtractedVars.filter(
        (gv) => !previouslyExtractedVars.some((pv) => pv.name === gv.name),
      ),
    ];
  };

  const usedChainVariables = useMemo(() => {
    return getUsedVariablesForChain(
      formData.chainRequests || [],
      storeVariables,
      dynamicStructured,
      extractedVariablesByRequest,
    );
  }, [
    formData.chainRequests,
    storeVariables,
    dynamicStructured,
    extractedVariablesByRequest,
  ]);

  const executeSingleRequest = async (
    request: APIRequest,
    variables: Variable[],
    requestIndex: number,
    requestAssertions: any[] = [],
  ): Promise<ExecutionLog> => {
    if (!request.url) {
      throw new Error('Request URL is required');
    }

    const preparedRequest = {
      ...request,
      headers: request.headers ?? [],
      params: request.params ?? [],
    };

    const rawToken = (
      preparedRequest.authToken ||
      preparedRequest.authorization?.token ||
      ''
    ).trim();

    if (rawToken) {
      preparedRequest.authorizationType = 'bearer';
      preparedRequest.authorization = {
        ...preparedRequest.authorization,
        token: rawToken,
      };
      preparedRequest.authToken = rawToken;
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
          (h) => h?.key?.toLowerCase() === 'authorization',
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

    if (processedRequest.bodyType === 'form-data' && processedRequest.body) {
      try {
        const parsedBody = JSON.parse(processedRequest.body);
        if (Array.isArray(parsedBody)) {
          (processedRequest as any).bodyFormData = parsedBody.map(
            (field: any) => ({
              key: field.key,
              value: field.value,
              enabled: field.enabled !== false,
              type: field.type || 'text',
            }),
          );
        }
      } catch (e) {
        console.error('Failed to parse form-data from body:', e);
      }
    }

    const payload = buildRequestPayload(processedRequest, variables);
    const previewUrl = getPreviewUrl(processedRequest, variables);
    payload.request.url = previewUrl;

    const currentAssertions =
      assertionsByRequest[request.id] || requestAssertions || [];

    const processedAssertions = currentAssertions
      .filter((a) => a.enabled)
      .map((assertion) => {
        const processed = { ...assertion };

        const hasVariablePlaceholder =
          processed.expectedValue &&
          typeof processed.expectedValue === 'string' &&
          /\{\{.*?\}\}/.test(processed.expectedValue);

        if (hasVariablePlaceholder) {
          if (processed.actualValue) {
            processed.expectedValue = processed.actualValue;
          } else {
            processed.expectedValue = replaceVariables(
              processed.expectedValue,
              variables,
            );
          }
        }

        return processed;
      });

    payload.assertions = processedAssertions;

    try {
      const backendData = await executeRequest(payload);
      const assertionResult = backendData?.data?.assertionResults || [];
      const result = backendData?.data?.responses?.[0];

      if (!result) throw new Error('No response from executor');

      let previousExecutionLog = null;
      try {
        const raw = localStorage.getItem('lastExecutionByRequest');
        if (raw) {
          const map = JSON.parse(raw);
          previousExecutionLog = map[request.id];
        }
      } catch (e) {
        console.error('Failed to read previous execution:', e);
      }

      const existingAssertions =
        assertionsByRequest[request.id] || requestAssertions || [];

      const formattedAssertionFormat = {
        status: result?.statusCode ?? null,
        statusText: '',
        headers: result?.headers ?? {},
        data: (() => {
          try {
            return JSON.parse(result?.body || '{}');
          } catch {
            return {};
          }
        })(),
        responseTime: result?.metrics?.responseTime ?? 0,
        size: result?.metrics?.bytesReceived ?? 0,
      };

      const newAssertions = await generateAssertions(
        formattedAssertionFormat,
        usedChainVariables.staticVars,
        usedChainVariables.dynamicVars,
        extractedVariablesArray,
      );

      const assertionsMatch = (assertion1: any, assertion2: any): boolean => {
        return (
          assertion1.description === assertion2.description &&
          assertion1.category === assertion2.category &&
          assertion1.type === assertion2.type &&
          assertion1.operator === assertion2.operator
        );
      };

      const mergedAssertions = newAssertions.map((newAssertion) => {
        const matchingExisting = existingAssertions.find((existing) =>
          assertionsMatch(existing, newAssertion),
        );

        if (matchingExisting) {
          return {
            ...newAssertion,
            enabled: matchingExisting.enabled ?? true,
          };
        } else {
          return {
            ...newAssertion,
            enabled: false,
          };
        }
      });

      const customAssertions = existingAssertions.filter(
        (assertion) =>
          assertion.isCustom === true &&
          !mergedAssertions.some((merged) =>
            assertionsMatch(merged, assertion),
          ),
      );

      const finalAssertions = [...mergedAssertions, ...customAssertions];

      setAssertionsByRequest((prev) => ({
        ...prev,
        [request.id]: finalAssertions,
      }));
      const extractedData = extractDataFromResponse(
        {
          body: result.body,
          headers: result.headers,
          cookies: parseCookies(result.headers?.['set-cookie'] ?? ''),
        },
        request.extractVariables || [],
      );

      const endTime = Date.now();
      const actualRequestHeaders = Object.fromEntries(
        processedRequest.headers.map((h) => [h.key, h.value]),
      );
      const actualRequestUrl = previewUrl;
      const actualRequestBody = processedRequest.body ?? '';
      const actualRequestMethod = processedRequest.method;

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
          method: actualRequestMethod,
          url: actualRequestUrl,
          headers: actualRequestHeaders,
          body: actualRequestBody,
        },
        response: {
          status: result.statusCode,
          headers: result.headers,
          body: result.body,
          size: result.metrics.bytesReceived,
          cookies: parseCookies(result.headers?.['set-cookie'] ?? ''),
          assertions: assertionResult,
          requestCurl: result.requestCurl,
        },
        extractedVariables: extractedData,
      };

      try {
        const raw = localStorage.getItem('lastExecutionByRequest');
        const map = raw ? JSON.parse(raw) : {};
        map[request.id] = {
          ...log,
          assertions: finalAssertions,
        };
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
          JSON.stringify(errorLog),
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

    const selectedRequests = formData.chainRequests.filter(
      (r) => r.isSelected !== false,
    );

    if (selectedRequests.length === 0) {
      toast({
        title: 'No Requests Selected',
        description: 'Select at least one request to run',
        variant: 'destructive',
      });
      return;
    }

    setActiveTab('requests');

    setTimeout(() => {
      scrollToRequestsTop();
    }, 100);

    setExpandedRequests(new Set());
    regenerateAllDynamicVariables();

    setIsExecuting(true);
    setCurrentRequestIndex(0);
    setExecutionLogs([]);
    setExtractedVariables({});
    setExtractedVariablesByRequest({});

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
          !(formData.variables || []).some((fv) => fv.name === ev.name),
      ),
    ];

    const allExtractedVarsInCurrentExecution: Record<string, any> = {};
    const variablesByRequest: Record<string, Record<string, any>> = {};

    try {
      toast({
        title: 'Starting Execution',
        description: `Running ${selectedRequests.length} selected requests sequentially...`,
      });

      for (let i = 0; i < selectedRequests.length; i++) {
        const rawRequest = selectedRequests[i];
        const request = syncParamsFromUrl(rawRequest);

        const originalIndex = formData.chainRequests.findIndex(
          (r) => r.id === request.id,
        );
        setCurrentRequestIndex(originalIndex);

        try {
          let requestAssertions: any[] = [];

          if (
            assertionsByRequest[request.id] &&
            Array.isArray(assertionsByRequest[request.id]) &&
            assertionsByRequest[request.id].length > 0
          ) {
            requestAssertions = assertionsByRequest[request.id];
          } else if (
            request.assertions &&
            Array.isArray(request.assertions) &&
            request.assertions.length > 0
          ) {
            requestAssertions = request.assertions;
          } else {
            try {
              const raw = localStorage.getItem('lastExecutionByRequest');
              if (raw) {
                const map = JSON.parse(raw);
                if (
                  map[request.id]?.assertions &&
                  Array.isArray(map[request.id].assertions) &&
                  map[request.id].assertions.length > 0
                ) {
                  requestAssertions = map[request.id].assertions;
                }
              }
            } catch (e) {
              console.error('Failed to read assertions from localStorage:', e);
            }
          }

          const existingLog = allLogs.find(
            (log) => log.requestId === request.id,
          );
          let log: ExecutionLog;

          if (existingLog) {
            log = existingLog;
          } else {
            const currentAvailableVariables =
              getAllVariablesForRequestAtRuntime(
                originalIndex,
                allExtractedVarsInCurrentExecution,
              );

            log = await executeSingleRequest(
              request,
              currentAvailableVariables,
              originalIndex,
              requestAssertions,
            );

            allLogs.push(log);
          }

          if (log.extractedVariables) {
            variablesByRequest[log.requestId] = { ...log.extractedVariables };
            setExtractedVariablesByRequest((prev) => ({
              ...prev,
              [log.requestId]: { ...log.extractedVariables },
            }));

            Object.assign(
              allExtractedVarsInCurrentExecution,
              log.extractedVariables,
            );
            updateExtractedVariables(allExtractedVarsInCurrentExecution);
          }

          setExecutionLogs([...allLogs]);

          if (i < selectedRequests.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch (error) {
          const errorLog = error as ExecutionLog;
          const existingErrorIndex = allLogs.findIndex(
            (log) => log.requestId === errorLog.requestId,
          );

          if (existingErrorIndex >= 0) {
            allLogs[existingErrorIndex] = errorLog;
          } else {
            allLogs.push(errorLog);
          }

          setExecutionLogs([...allLogs]);

          toast({
            title: `Request ${originalIndex + 1} Failed`,
            description: errorLog.error || 'Unknown error occurred',
            variant: 'destructive',
          });

          if (request.errorHandling === 'stop') {
            toast({
              title: 'Execution Stopped',
              description: `Chain execution stopped due to error in request ${originalIndex + 1
                }`,
              variant: 'destructive',
            });
            break;
          } else if (request.errorHandling === 'retry' && request.retries > 0) {
            toast({
              title: 'Retrying Request',
              description: `Retrying request ${originalIndex + 1}...`,
            });
          }
        }
      }

      setExecutionLogs(allLogs);
      setExtractedVariables(allExtractedVarsInCurrentExecution);

      const logsMap: Record<string, any> = {};
      allLogs.forEach((log) => {
        logsMap[log.requestId] = log;
      });
      const results = analyzeRequestChain(formData.chainRequests, logsMap);
      setAnalysisResults(results);

      const successCount = allLogs.filter(
        (log) => log.status === 'success',
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
    executionLog: ExecutionLog,
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
    extraction: DataExtraction,
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
      (existing) => (existing.variableName || existing.name) === variableName,
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
      r.id === requestId ? { ...r, extractVariables: updatedExtractions } : r,
    );

    setFormData({ ...formData, chainRequests: updatedRequests });

    const log = executionLogs.find((l) => l.requestId === requestId);
    if (log?.response) {
      const extracted = extractDataFromResponse(
        log.response,
        updatedExtractions,
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
    variableName: string,
  ) => {
    const request = formData.chainRequests.find((r) => r.id === requestId);
    if (!request) return;

    const updatedExtractions = (request.extractVariables || []).filter(
      (e) => (e.variableName || e.name) !== variableName,
    );
    const updatedRequests = formData.chainRequests.map((r) =>
      r.id === requestId ? { ...r, extractVariables: updatedExtractions } : r,
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
  const [isAnalyzerOpen, setIsAnalyzerOpen] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFormData((prev) => {
        const requests = prev.chainRequests || [];
        const oldIndex = requests.findIndex((req) => req.id === active.id);
        const newIndex = requests.findIndex((req) => req.id === over.id);

        const reorderedRequests = arrayMove(requests, oldIndex, newIndex).map(
          (request, index) => ({
            ...request,
            order: index + 1,
          }),
        );

        return {
          ...prev,
          chainRequests: reorderedRequests,
        };
      });
    }
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
          req.id === requestId ? { ...req, ...updates } : req,
        ) || [],
    });
  };
  // console.log("SENDING TAGS:", tags);

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
        isSelected: true,
      };
      setFormData({
        ...formData,
        chainRequests: [...(formData.chainRequests || []), duplicated],
      });
    }
  };

  const getRequestPosition = (requestId: string): number => {
    return (
      (formData.chainRequests?.findIndex((r) => r.id === requestId) ?? -1) + 1
    );
  };

  const addNewRequest = () => {
    const tempId = `temp_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    const newRequest: APIRequest = {
      id: tempId,
      name: 'New Request',
      method: 'GET',
      url: '',
      headers: [
        {
          key: 'Content-Type',
          value: 'application/json',
          enabled: true,
        },
      ],
      params: [],
      bodyType: 'raw',
      timeout: 5000,
      retries: 0,
      errorHandling: 'stop',
      extractVariables: [],
      testScripts: [],
      enabled: true,
      authorizationType: 'none',
      isSelected: true,
    };
    setFormData({
      ...formData,
      chainRequests: [...(formData.chainRequests || []), newRequest],
    });
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
        chain?.chainRequests?.map((r) => r.id) || [],
      );

      const allStoredAssertions: Record<string, any[]> = {};
      try {
        const raw = localStorage.getItem('lastExecutionByRequest');
        if (raw) {
          const map = JSON.parse(raw);
          Object.keys(map).forEach((requestId) => {
            if (
              map[requestId]?.assertions &&
              Array.isArray(map[requestId].assertions)
            ) {
              allStoredAssertions[requestId] = map[requestId].assertions;
            }
          });
        }
      } catch (e) {
        console.error('Failed to read stored assertions:', e);
      }

      const chainDataForBackend = {
        ...formData,
        chainRequests: formData.chainRequests?.map((request, index) => {
          const token = request.authToken?.trim() || '';
          const authorization: any = {};
          let authorizationType = request.authorizationType || 'none';

          if (token) {
            authorization.token = token;
            authorizationType = 'bearer';
          } else {
            authorizationType = 'none';
          }

          const isExistingRequest =
            request.id && originalRequestIds.has(request.id);

          let requestAssertions: any[] = [];

          if (
            assertionsByRequest[request.id] &&
            assertionsByRequest[request.id].length > 0
          ) {
            requestAssertions = assertionsByRequest[request.id];
          } else if (
            allStoredAssertions[request.id] &&
            allStoredAssertions[request.id].length > 0
          ) {
            requestAssertions = allStoredAssertions[request.id];
          }

          const allAssertions = requestAssertions
            .filter((a) => a.enabled !== false)
            .map((assertion) => ({
              ...assertion,
              enabled: true,
            }));

          if (isExistingRequest) {
            return {
              ...request,
              order: index + 1,
              authorizationType,
              authorization,
              assertions: allAssertions,
              tags: tags ?? [],
              headers:
                request.headers?.map((h) =>
                  h.id && !h.id.startsWith('temp_')
                    ? h
                    : { ...h, id: undefined },
                ) || [],
              params:
                request.params?.map((p) =>
                  p.id && !p.id.startsWith('temp_')
                    ? p
                    : { ...p, id: undefined },
                ) || [],
            };
          } else {
            return {
              ...request,
              id: undefined,
              order: index + 1,
              authorizationType,
              authorization,
              assertions: allAssertions,
              headers:
                request.headers?.map((h) => ({ ...h, id: undefined })) || [],
              params:
                request.params?.map((p) => ({ ...p, id: undefined })) || [],
            };
          }
        }),
      };

      const transformedRequests = chainDataForBackend.chainRequests.map(
        transformRequestForSave,
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
        tags: tags ?? ["untagged", "new"],
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
            ? 'Your request chain has been saved successfully with assertions.'
            : 'Your request chain has been updated successfully with assertions.',
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
      GET: 'text-green-600',
      POST: 'text-orange-600',
      PUT: 'text-blue-600',
      DELETE: 'text-red-600',
      PATCH: 'text-purple-600',
      HEAD: 'text-gray-600',
      OPTIONS: 'text-gray-600',
    };
    return colors[method as keyof typeof colors] || 'text-gray-600';
  };

  const handleImportRequests = async (importedRequests: ExtendedRequest[]) => {
    try {
      const transformedRequests: APIRequest[] = importedRequests.map((req) => {
        let bodyType: APIRequest['bodyType'] = 'none';
        let bodyContent = '';

        if (req.bodyType === 'form-data' && Array.isArray(req.bodyFormData)) {
          bodyType = 'form-data';
          bodyContent = JSON.stringify(
            req.bodyFormData.map((field: any) => ({
              id: field.id || `temp_${Date.now()}_${Math.random()}`,
              key: field.key || '',
              value: field.value || '',
              type: field.type || 'text',
              enabled: field.enabled !== false,
            })),
          );
        } else if (req.bodyRawContent && req.bodyRawContent.trim() !== '') {
          bodyType = (req.bodyType as APIRequest['bodyType']) || 'raw';
          bodyContent = req.bodyRawContent;
        }

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

        if (req.authorization?.token && req.authorization.token.trim() !== '') {
          authorizationType = 'bearer';
          authToken = req.authorization.token.trim();
        } else if (req.authorizationType && req.authorizationType !== 'none') {
          authorizationType = req.authorizationType;

          if (req.authorizationType === 'bearer' && req.authorization?.token) {
            authToken = req.authorization.token.trim();
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
          body: bodyContent,
          authorizationType,
          authorization: {
            token: authToken,
          },
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
          isSelected: true,
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
      i === index ? { ...r, name: finalName || r.url || r.name } : r,
    );
    setFormData({ ...formData, chainRequests: updated });
  }

  const getVariablesByPrefixLocal = (
    prefix: 'D_' | 'S_',
    requestIndex: number,
  ): Variable[] => {
    const allVars = getAllVariablesForRequest(requestIndex);
    return getVariablesByPrefix(allVars, prefix);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    requestIndex: number,
    originalHandler?: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => void,
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

    const beforePrefix = currentValue.substring(0, cursorPos - 2);
    const afterCursor = currentValue.substring(cursorPos);
    const newValue = beforePrefix + variable.name + afterCursor;

    const inputName =
      input.getAttribute('name') || input.getAttribute('data-field');
    const requestIndex = Number.parseInt(
      input.getAttribute('data-request-index') || '-1',
    );

    if (requestIndex === -1) {
      input.value = newValue;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
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
          authUsername: newValue,
        };
        setFormData({ ...formData, chainRequests: requests });
      } else if (inputName === 'auth-password') {
        requests[requestIndex] = {
          ...requests[requestIndex],
          authPassword: newValue,
        };
        setFormData({ ...formData, chainRequests: requests });
      } else if (inputName === 'auth-token') {
        requests[requestIndex] = {
          ...requests[requestIndex],
          authorization: {
            ...requests[requestIndex].authorization,
            token: newValue,
          },
        };
        setFormData({ ...formData, chainRequests: requests });
      } else {
        input.value = newValue;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

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
        className='fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto scrollbar-thin'
        style={{
          top: autocompleteState.position.top,
          left: autocompleteState.position.left,
        }}
      >
        <div className='p-2 text-xs text-gray-500 border-b'>
          {autocompleteState.prefix === 'D_'
            ? 'Dynamic Variables'
            : autocompleteState.prefix === 'S_'
              ? 'Static Variables'
              : 'Variables'}
        </div>
        {autocompleteState.suggestions.map((variable) => (
          <button
            key={variable.id}
            className='w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0'
            onClick={() => handleVariableSelect(variable)}
          >
            <div className='flex items-center justify-between'>
              <span className='font-mono text-sm font-medium'>
                {variable.name}
              </span>
              {variable.description && (
                <span className='text-xs  px-2 py-0.5 rounded'>
                  {variable.description}
                </span>
              )}
            </div>
            <div className='text-xs text-gray-500 mt-1 truncate'>
              {String(variable.value || variable.initialValue || '').substring(
                0,
                40,
              )}
              {String(variable.value || variable.initialValue || '').length > 40
                ? '...'
                : ''}
            </div>
          </button>
        ))}
      </div>
    );
  };

  if (editingRequestId) {
    const request = formData.chainRequests?.find(
      (r) => r.id === editingRequestId,
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
          <div className='flex-1 overflow-auto scrollbar-thin p-6'>
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
              dynamicVariableOverrides={dynamicOverrides}
              onRegenerateDynamicVariable={regenerateDynamicVariableLocal}
              requestAssertions={assertionsByRequest[request.id] || []}
              onAssertionsUpdate={(assertions) => {
                setAssertionsByRequest((prev) => ({
                  ...prev,
                  [request.id]: assertions,
                }));
                persistAssertionsToStorage(request.id, assertions);
              }}
              requestIndex={requestIndex}
              formData={formData}
              extractedVariablesByRequest={extractedVariablesByRequest}
            />
          </div>
        </div>
      );
    }
  }

  const persistAssertionsToStorage = (requestId: string, assertions: any[]) => {
    try {
      const raw = localStorage.getItem('lastExecutionByRequest');
      const map = raw ? JSON.parse(raw) : {};

      if (!map[requestId]) {
        map[requestId] = {};
      }

      map[requestId].assertions = assertions;
      localStorage.setItem('lastExecutionByRequest', JSON.stringify(map));
    } catch (e) {
      console.error('Failed to persist assertions:', e);
    }
  };

  useEffect(() => {
    const hasRequests = (formData.chainRequests?.length ?? 0) > 0;
    const hasExecutionLogs = executionLogs.length > 0;

    let timer: NodeJS.Timeout | null = null;

    if (hasRequests && !hasExecutionLogs && !isExecuting) {
      timer = setTimeout(() => {
        setShowRunAllHint(true);
      }, 1000);
    } else {
      setShowRunAllHint(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [formData.chainRequests, executionLogs, isExecuting]);

  useEffect(() => {
    if (
      formData.chainRequests &&
      formData.chainRequests.length > 0 &&
      !isExecuting &&
      executionLogs.length > 0
    ) {
      const logsMap: Record<string, any> = {};
      executionLogs.forEach((log) => {
        logsMap[log.requestId] = log;
      });

      const results = analyzeRequestChain(formData.chainRequests, logsMap);
      setAnalysisResults(results);
    }
  }, [formData.chainRequests, executionLogs, isExecuting]);

  const scrollToRequestsTop = () => {
    if (requestsTopRef.current) {
      requestsTopRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

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

      <div
        className='flex-1 border border-gray-200 rounded-lg bg-background mt-3 overflow-auto scrollbar-thin'
        ref={scrollContainerRef}
      >
        <div className='p-6 space-y-6'>
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
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className=' space-y-2'>
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
                <div className=' space-y-2'>
                  <TagInput tags={tags} setTags={setTags} />
                </div>
              </div>


              {/* <DynamicVariablesPanel /> */}
            </CardContent>
          </Card>

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
                  <div className='bg-card rounded-xl border border-border overflow-visible'>
                    <div
                      ref={requestsTopRef}
                      className='p-4 sm:p-6 border-b border-border'
                    >
                      {formData.chainRequests &&
                        formData.chainRequests.length > 0 ? (
                        <>
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                          >
                            <SortableContext
                              items={(formData.chainRequests || []).map(
                                (r) => r.id,
                              )}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className='space-y-3'>
                                {formData.chainRequests.map(
                                  (request, requestIndex) => {
                                    const executionLog =
                                      getExecutionLogForRequest(
                                        executionLogs,
                                        request.id,
                                      );

                                    return (
                                      <SortableRequestItem
                                        key={request.id}
                                        request={request}
                                        requestIndex={requestIndex}
                                        isExecuting={isExecuting}
                                        currentRequestIndex={
                                          currentRequestIndex
                                        }
                                        expandedRequests={expandedRequests}
                                        editingNameId={editingNameId}
                                        tempName={tempName}
                                        executionLog={executionLog}
                                        getMethodColor={getMethodColor}
                                        onToggleExpand={toggleRequestExpanded}
                                        onToggleSelect={() => {
                                          setFormData({
                                            ...formData,
                                            chainRequests:
                                              formData.chainRequests?.map(
                                                (r) =>
                                                  r.id === request.id
                                                    ? {
                                                      ...r,
                                                      isSelected:
                                                        !r.isSelected,
                                                    }
                                                    : r,
                                              ) || [],
                                          });
                                        }}
                                        onStartEditName={(id, name) => {
                                          setEditingNameId(id);
                                          setTempName(name);
                                        }}
                                        onCommitName={commitRequestName}
                                        onCancelEditName={() => {
                                          setEditingNameId(null);
                                          setTempName('');
                                        }}
                                        onDuplicate={duplicateRequest}
                                        onRemove={removeRequest}
                                        setTempName={setTempName}
                                      >
                                        {expandedRequests.has(request.id) && (
                                          <div className='mt-4 pt-4 border-t space-y-4'>
                                            {/* All your existing expanded content goes here */}
                                            <RequestEditor
                                              request={request}
                                              onUpdate={(updates) =>
                                                updateRequest(
                                                  request.id,
                                                  updates,
                                                )
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
                                              hideResponseExplorer={false}
                                              onRequestExecution={(
                                                executionLog,
                                              ) =>
                                                handleRequestExecution(
                                                  request.id,
                                                  executionLog,
                                                )
                                              }
                                              extractedVariables={(() => {
                                                const varsUpToThisPoint: Record<
                                                  string,
                                                  any
                                                > = {};
                                                for (
                                                  let i = 0;
                                                  i < requestIndex;
                                                  i++
                                                ) {
                                                  const prevReqId =
                                                    formData.chainRequests?.[i]
                                                      ?.id;
                                                  if (
                                                    prevReqId &&
                                                    extractedVariablesByRequest[
                                                    prevReqId
                                                    ]
                                                  ) {
                                                    Object.assign(
                                                      varsUpToThisPoint,
                                                      extractedVariablesByRequest[
                                                      prevReqId
                                                      ],
                                                    );
                                                  }
                                                }
                                                return varsUpToThisPoint;
                                              })()}
                                              chainVariables={
                                                formData.variables || []
                                              }
                                              dynamicVariableOverrides={
                                                dynamicOverrides
                                              }
                                              onRegenerateDynamicVariable={
                                                regenerateDynamicVariableLocal
                                              }
                                              requestAssertions={(() => {
                                                const assertions =
                                                  assertionsByRequest[
                                                  request.id
                                                  ] || [];
                                                return assertions;
                                              })()}
                                              onAssertionsUpdate={(
                                                assertions,
                                              ) => {
                                                setAssertionsByRequest(
                                                  (prev) => ({
                                                    ...prev,
                                                    [request.id]: assertions,
                                                  }),
                                                );
                                                persistAssertionsToStorage(
                                                  request.id,
                                                  assertions,
                                                );
                                              }}
                                              requestIndex={requestIndex}
                                              formData={formData}
                                              extractedVariablesByRequest={
                                                extractedVariablesByRequest
                                              }
                                            />

                                            {executionLog && (
                                              <div>
                                                {(executionLog.response !=
                                                  null ||
                                                  executionLog.error) && (
                                                    <div className='border-t border-gray-200 p-2'>
                                                      <ResponseExplorer
                                                        response={{
                                                          ...executionLog.response,
                                                          requestId:
                                                            executionLog.requestId,
                                                        }}
                                                        onExtractVariable={(
                                                          extraction,
                                                        ) =>
                                                          handleExtractVariableForRequest(
                                                            executionLog.requestId,
                                                            extraction,
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
                                                              executionLog.requestId,
                                                          )?.extractVariables ||
                                                          []
                                                        }
                                                        onRemoveExtraction={(
                                                          variableName,
                                                        ) =>
                                                          handleRemoveExtractionForRequest(
                                                            executionLog.requestId,
                                                            variableName,
                                                          )
                                                        }
                                                        handleCopy={(value) =>
                                                          handleCopyForRequest(
                                                            executionLog.requestId,
                                                            value,
                                                          )
                                                        }
                                                        chainId={chain?.id ?? ''}
                                                        copied={
                                                          copiedStates[
                                                          executionLog.requestId
                                                          ] || false
                                                        }
                                                        actualRequestUrl={
                                                          executionLog.request.url
                                                        }
                                                        actualRequestHeaders={
                                                          executionLog.request
                                                            .headers
                                                        }
                                                        actualRequestBody={
                                                          executionLog.request
                                                            .body
                                                        }
                                                        actualRequestMethod={
                                                          executionLog.request
                                                            .method
                                                        }
                                                        executionStatus={
                                                          executionLog.status
                                                        }
                                                        errorMessage={
                                                          executionLog.error
                                                        }
                                                        executionLog={
                                                          executionLog
                                                        }
                                                        onApplyToAllRequests={
                                                          handleApplyToAllRequests
                                                        }
                                                        allAssertions={
                                                          assertionsByRequest[
                                                          executionLog.requestId
                                                          ] || []
                                                        }
                                                        onAssertionsUpdate={(
                                                          assertions,
                                                        ) => {
                                                          setAssertionsByRequest(
                                                            (prev) => ({
                                                              ...prev,
                                                              [executionLog.requestId]:
                                                                assertions,
                                                            }),
                                                          );
                                                          persistAssertionsToStorage(
                                                            executionLog.requestId,
                                                            assertions,
                                                          );
                                                        }}
                                                        variables={
                                                          usedChainVariables.staticVars
                                                        }
                                                        dynamicVariables={
                                                          usedChainVariables.dynamicVars
                                                        }
                                                        requestIndex={
                                                          requestIndex
                                                        }
                                                        extractedVariablesByRequest={
                                                          extractedVariablesByRequest
                                                        }
                                                        chainRequests={
                                                          formData.chainRequests ||
                                                          []
                                                        }
                                                        requestExtractedVariables={(() => {
                                                          const varsUpToThisPoint: Record<
                                                            string,
                                                            any
                                                          > = {};
                                                          for (
                                                            let i = 0;
                                                            i <= requestIndex;
                                                            i++
                                                          ) {
                                                            const reqId =
                                                              formData
                                                                .chainRequests?.[
                                                                i
                                                              ]?.id;
                                                            if (
                                                              reqId &&
                                                              extractedVariablesByRequest[
                                                              reqId
                                                              ]
                                                            ) {
                                                              Object.assign(
                                                                varsUpToThisPoint,
                                                                extractedVariablesByRequest[
                                                                reqId
                                                                ],
                                                              );
                                                            }
                                                          }
                                                          return varsUpToThisPoint;
                                                        })()}
                                                        allDynamicVariables={
                                                          dynamicOverrides
                                                        }
                                                        allStaticVariables={
                                                          storeVariables
                                                        }
                                                        allExtractedVariables={
                                                          extractedVariablesArray
                                                        }
                                                      />
                                                    </div>
                                                  )}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </SortableRequestItem>
                                    );
                                  },
                                )}
                              </div>
                            </SortableContext>
                          </DndContext>

                          <div className='flex items-center justify-between mt-6'>
                            <div className='flex items-center gap-3'>
                              <button
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    chainRequests:
                                      formData.chainRequests?.map((req) => ({
                                        ...req,
                                        isSelected: false,
                                      })) || [],
                                  });
                                }}
                                className='text-sm text-muted-foreground hover:text-foreground transition-colors'
                              >
                                Deselect All
                              </button>

                              <button
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    chainRequests:
                                      formData.chainRequests?.map((req) => ({
                                        ...req,
                                        isSelected: true,
                                      })) || [],
                                  });
                                }}
                                className='text-sm text-muted-foreground hover:text-foreground transition-colors'
                              >
                                Select All
                              </button>

                              <span className='text-sm text-muted-foreground'>
                                (
                                {
                                  formData.chainRequests?.filter(
                                    (r) => r.isSelected !== false,
                                  ).length
                                }{' '}
                                / {formData.chainRequests?.length} selected )
                              </span>
                            </div>

                            <div className='flex items-center gap-3'>
                              <Button
                                ref={runAllButtonRef}
                                variant='outline'
                                onClick={handleRunAll}
                                disabled={
                                  isExecuting ||
                                  !formData.chainRequests?.length ||
                                  formData.chainRequests?.filter(
                                    (r) => r.isSelected !== false,
                                  ).length === 0
                                }
                                className='gap-2 bg-transparent'
                              >
                                {isExecuting ? (
                                  <Loader2 className='w-4 h-4 animate-spin' />
                                ) : (
                                  <PlayCircle className='w-4 h-4' />
                                )}
                                {isExecuting
                                  ? 'Running...'
                                  : `Run Selected (${formData.chainRequests?.filter(
                                    (r) => r.isSelected !== false,
                                  ).length || 0
                                  })`}
                              </Button>

                              {executionLogs.length > 0 &&
                                executionLogs.length ===
                                formData.chainRequests?.filter(
                                  (r) => r.isSelected !== false,
                                ).length &&
                                !isExecuting && (
                                  <Button
                                    variant='outline'
                                    onClick={() => setIsAnalyzerOpen(true)}
                                    className='gap-2 bg-transparent'
                                  >
                                    <AlertTriangle className='w-4 h-4' />
                                    Chain Analyzer
                                  </Button>
                                )}

                              <AddRequestMenu
                                onAddRequest={addNewRequest}
                                onImport={() => setIsImportModalOpen(true)}
                                disabled={isExecuting}
                              />
                            </div>
                          </div>
                        </>
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
                          <AddRequestMenu
                            onAddRequest={addNewRequest}
                            onImport={() => setIsImportModalOpen(true)}
                            disabled={isExecuting}
                          />
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

              <RequestAnalyzer
                chainName={formData.name || 'Unnamed Chain'}
                requests={formData.chainRequests || []}
                executionLogs={executionLogs}
                analysisResults={analysisResults}
                extractedVariablesByRequest={extractedVariablesByRequest}
                isExecuting={isExecuting}
                onRunAll={handleRunAll}
                onCopyVariable={(requestId, variableName) => {
                  handleCopyForRequest(requestId, variableName);
                }}
                onExtractVariable={(requestId, path, suggestedName) => {
                  const extraction: DataExtraction = {
                    variableName: `E_${suggestedName}`,
                    name: `E_${suggestedName}`,
                    source: 'response_body',
                    path: path,
                  };

                  handleExtractVariableForRequest(requestId, extraction);

                  const newExpanded = new Set(expandedRequests);
                  newExpanded.add(requestId);
                  setExpandedRequests(newExpanded);

                  toast({
                    title: 'Variable Extraction Added',
                    description: `Variable "E_${suggestedName}" will be extracted from ${path}. Run the request again to see the extracted value.`,
                  });
                }}
                onApplyToAllRequests={handleApplyToAllRequests}
                onApplyToRequest={handleApplyToRequest}
                open={isAnalyzerOpen}
                onOpenChange={setIsAnalyzerOpen}
              />
            </CardContent>
          </Card>

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
                isRunAllExecuting={isExecuting}
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
          (v) => v.name === key,
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
