'use client';
import { useEffect, useState, useRef } from 'react';
import React from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Plus,
  Trash2,
  Code,
  Globe,
  Key,
  TestTube,
  Settings,
  GitBranch,
  ChevronDown,
  ChevronRight,
  TriangleAlert,
  Play,
  Copy,
  AlertTriangle,
  Shield,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Shuffle,
  Edit3,
} from 'lucide-react';
import type {
  APIRequest,
  DataExtraction,
  ExecutionLog,
  TestScript,
  Variable,
} from '@/shared/types/requestChain.model';
import { ResponseExplorer } from './ResponseExplorer';
import { useToast } from '@/hooks/use-toast';
import { parseCookies } from '@/lib/cookieUtils';
import {
  buildRequestPayload,
  executeRequest,
} from '@/services/executeRequest.service';
import { useDataManagementStore } from '@/store/dataManagementStore';
import { useDataManagement } from '@/hooks/useDataManagement';
import {
  getExtractVariablesByEnvironment,
  extractDataFromResponse,
  copyToClipboard,
} from '@/lib/request-utils';

interface RequestEditorProps {
  request: APIRequest;
  onUpdate: (updates: Partial<APIRequest>) => void;
  onSave?: () => void;
  compact?: boolean;
  chainName?: string;
  chainDescription?: string;
  chainEnabled?: boolean;
  environmentBaseUrl?: string;
  requestChainId?: string;
  chainId?: string;
  hideResponseExplorer?: boolean;
  onRequestExecution?: (executionLog: ExecutionLog) => void;
  extractedVariables?: Record<string, any>;
  chainVariables?: Variable[];
}

interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

interface DynamicVariableOverride {
  name: string;
  value: string | number;
}

export function RequestEditor({
  request,
  onUpdate,
  onSave,
  compact = false,
  chainName,
  chainDescription,
  chainEnabled,
  environmentBaseUrl,
  requestChainId,
  chainId,
  hideResponseExplorer = false,
  onRequestExecution,
  extractedVariables: parentExtractedVariables = {},
  chainVariables = [],
}: RequestEditorProps) {
  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'params' | 'headers' | 'body' | 'auth' | 'tests' | 'settings'
  >('params');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionLog | null>(
    null
  );

  const { variables: storeVariables, dynamicVariables } =
    useDataManagementStore();

  const [dynamicOverrides, setDynamicOverrides] = useState<
    DynamicVariableOverride[]
  >([]);
  const [showDynamicEditor, setShowDynamicEditor] = useState(false);

  const [autocompleteState, setAutocompleteState] = useState<{
    show: boolean;
    position: { top: number; left: number };
    suggestions: Variable[];
    prefix: 'D_' | 'S_' | null;
    inputRef: HTMLInputElement | HTMLTextAreaElement | null;
    cursorPosition: number;
  }>({
    show: false,
    position: { top: 0, left: 0 },
    suggestions: [],
    prefix: null,
    inputRef: null,
    cursorPosition: 0,
  });

  // State for individual fields to manage updates
  const [url, setUrl] = useState(request.url || '');
  const [body, setBody] = useState(request.body || '');
  const [headers, setHeaders] = useState<KeyValuePair[]>(request.headers || []);
  const [params, setParams] = useState<KeyValuePair[]>(request.params || []);
  const [auth, setAuth] = useState({
    username: request.authUsername || '',
    password: request.authPassword || '',
    token: request.authToken || '',
  });

  function mapDynamicToStatic(
    dynamicVariables: any[],
    overrides: DynamicVariableOverride[] = []
  ) {
    const randInt = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    const randString = (len: number) =>
      Array.from({ length: len }, () =>
        Math.random().toString(36).charAt(2)
      ).join('');

    const fakeName = () =>
      ['Alice Johnson', 'Bob Smith', 'Charlie Brown'][
        Math.floor(Math.random() * 3)
      ];

    return dynamicVariables.map((d) => {
      const override = overrides.find((o) => o.name === d.name);
      if (override) {
        return {
          id: d.id,
          environmentId: null,
          name: `${d.name}`,
          description: '',
          type: 'dynamic',
          initialValue: '',
          currentValue: override.value,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          deletedAt: d.deletedAt,
          value: override.value,
          scope: 'environment',
          isGlobal: false,
          isSecret: false,
          isDynamic: true, // Flag to identify dynamic variables
        };
      }

      let generated: string | number;

      switch (d.generatorId) {
        case 'randomString':
          generated = randString(d.parameters?.length || 8);
          break;
        case 'randomInteger':
          generated = randInt(d.parameters?.min || 0, d.parameters?.max || 100);
          break;
        case 'name':
          generated = fakeName();
          break;
        default:
          generated = '';
      }

      return {
        id: d.id,
        environmentId: null,
        name: `${d.name}`,
        description: '',
        type: 'dynamic',
        initialValue: '',
        currentValue: generated,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        deletedAt: d.deletedAt,
        value: generated,
        scope: 'environment',
        isGlobal: false,
        isSecret: false,
        isDynamic: true,
      };
    });
  }

  const dynamicStructured = mapDynamicToStatic(
    dynamicVariables,
    dynamicOverrides
  );

  console.log('Dynamic Variables:', dynamicStructured);
  console.log('Store variables:', storeVariables);

  // Function to find used dynamic variables in the request
  const getUsedDynamicVariables = () => {
    const allTextFields = [
      request.url || '',
      request.body || '',
      request.authToken || '',
      request.authUsername || '',
      request.authPassword || '',
      request.authApiKey || '',
      request.authApiValue || '',
      request.authorization?.token || '',
      request.authorization?.username || '',
      request.authorization?.password || '',
      request.authorization?.key || '',
      request.authorization?.value || '',
      ...(request.headers || []).map((h) => `${h.key} ${h.value}`),
      ...(request.params || []).map((p) => `${p.key} ${p.value}`),
    ];

    const allText = allTextFields.join(' ');
    const variableMatches = allText.match(/\{\{(\w+)\}\}/g) || [];
    const usedVariableNames = [
      ...new Set(
        variableMatches.map((match) => match.replace(/\{\{(\w+)\}\}/, '$1'))
      ),
    ];

    return dynamicStructured.filter((variable) =>
      usedVariableNames.includes(variable.name)
    );
  };

  const usedDynamicVariables = getUsedDynamicVariables();

  const [showResponse, setShowResponse] = useState(false);
  const [extractedVariables, setExtractedVariables] = useState<
    Record<string, any>
  >(parentExtractedVariables);
  const { activeEnvironment } = useDataManagement();

  const [previewUrl, setPreviewUrl] = useState('');
  const [previousExtractions, setPreviousExtractions] = useState<
    DataExtraction[]
  >([]);
  const [responseTab, setResponseTab] = useState<
    'body' | 'cookies' | 'headers' | 'test-results'
  >('body');
  const { toast } = useToast();

  const [processedRequest, setProcessedRequest] = useState<APIRequest>(request);

  const updateExtractedVariables = (newVars: Record<string, any>) => {
    setExtractedVariables(newVars);
    localStorage.setItem('extractedVariables', JSON.stringify(newVars));
  };

  const hasManuallyEditedNameRef = useRef(false);

  useEffect(() => {
    setExtractedVariables(parentExtractedVariables);
  }, [parentExtractedVariables]);

  const getAllAvailableVariables = (): Variable[] => {
    const extractedVars = getExtractVariablesByEnvironment(
      activeEnvironment?.id
    );

    const parentVars: Variable[] = Object.entries(parentExtractedVariables).map(
      ([name, value]) => ({
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
      })
    );

    const allVariables = [
      ...storeVariables,
      ...dynamicStructured,
      ...extractedVars.filter(
        (ev) => !parentVars.some((pv) => pv.name === ev.name)
      ),
      ...parentVars,
      ...chainVariables.filter(
        (cv) =>
          !parentVars.some((pv) => pv.name === cv.name) &&
          !extractedVars.some((ev) => ev.name === cv.name)
      ),
    ];

    return allVariables;
  };

  const getVariablesByPrefix = (prefix: 'D_' | 'S_'): Variable[] => {
    const allVars = getAllAvailableVariables();
    return allVars.filter((variable) => variable.name.startsWith(prefix));
  };

  useEffect(() => {
    const allVariables = getAllAvailableVariables();
    setPreviewUrl(getPreviewUrl(allVariables));
  }, [
    storeVariables,
    dynamicVariables,
    dynamicOverrides,
    activeEnvironment,
    request.url,
    parentExtractedVariables,
    chainVariables,
  ]);

  React.useEffect(() => {
    if (hideResponseExplorer) return;

    try {
      const raw = localStorage.getItem('lastExecutionByRequest');
      if (!raw) return;
      const map: Record<string, any> = JSON.parse(raw);
      const saved = map?.[request.id];

      const isRecent =
        saved?.endTime &&
        Date.now() - new Date(saved.endTime).getTime() < 3600000;

      if ((saved?.response || saved?.error) && isRecent) {
        setExecutionResult(saved);
        setShowResponse(true);

        if (
          saved.extractedVariables &&
          typeof saved.extractedVariables === 'object'
        ) {
          setExtractedVariables((prev) => ({
            ...prev,
            ...saved.extractedVariables,
          }));

          localStorage.setItem(
            'extractedVariables',
            JSON.stringify({
              ...JSON.parse(localStorage.getItem('extractedVariables') || '{}'),
              ...saved.extractedVariables,
            })
          );
        }
      } else if (saved && !isRecent) {
        delete map[request.id];
        localStorage.setItem('lastExecutionByRequest', JSON.stringify(map));
      }
    } catch (e) {
      console.error('Failed to restore lastExecutionByRequest:', e);
    }
  }, [request.id, hideResponseExplorer]);

  const replaceVariables = (text: string, variables: Variable[]): string => {
    if (!text) return text;
    let result = text;
    variables.forEach((variable) => {
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
      authorization: request.authorization
        ? {
            ...request.authorization,
            token: replaceVariables(
              request.authorization.token || '',
              variables
            ),
            username: replaceVariables(
              request.authorization.username || '',
              variables
            ),
            password: replaceVariables(
              request.authorization.password || '',
              variables
            ),
            key: replaceVariables(request.authorization.key || '', variables),
            value: replaceVariables(
              request.authorization.value || '',
              variables
            ),
          }
        : request.authorization,
    };
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    updateState: (value: string) => void
  ) => {
    const input = e.target;
    const value = input.value;
    const cursorPosition = input.selectionStart || 0;

    updateState(value); // Update the specific state for the input

    // Check for D_ or S_ at cursor position
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastTwoChars = textBeforeCursor.slice(-2);

    if (lastTwoChars === 'D_' || lastTwoChars === 'S_') {
      const suggestions = getVariablesByPrefix(lastTwoChars as 'D_' | 'S_');

      if (suggestions.length > 0) {
        // Calculate position for dropdown
        const rect = input.getBoundingClientRect();
        const position = {
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
        };

        setAutocompleteState({
          show: true,
          position,
          suggestions,
          prefix: lastTwoChars as 'D_' | 'S_',
          inputRef: input,
          cursorPosition,
        });
      } else {
        setAutocompleteState((prev) => ({ ...prev, show: false }));
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

    if (inputName === 'url') {
      setUrl(newValue);
    } else if (inputName === 'body') {
      setBody(newValue);
    } else if (inputName?.startsWith('header-key-')) {
      const index = Number.parseInt(inputName.split('-')[2]);
      const newHeaders = [...headers];
      newHeaders[index] = { ...newHeaders[index], key: newValue };
      setHeaders(newHeaders);
    } else if (inputName?.startsWith('header-value-')) {
      const index = Number.parseInt(inputName.split('-')[2]);
      const newHeaders = [...headers];
      newHeaders[index] = { ...newHeaders[index], value: newValue };
      setHeaders(newHeaders);
    } else if (inputName?.startsWith('param-key-')) {
      const index = Number.parseInt(inputName.split('-')[2]);
      const newParams = [...params];
      newParams[index] = { ...newParams[index], key: newValue };
      setParams(newParams);
    } else if (inputName?.startsWith('param-value-')) {
      const index = Number.parseInt(inputName.split('-')[2]);
      const newParams = [...params];
      newParams[index] = { ...newParams[index], value: newValue };
      setParams(newParams);
    } else if (inputName === 'auth-username') {
      setAuth((prev) => ({ ...prev, username: newValue }));
    } else if (inputName === 'auth-password') {
      setAuth((prev) => ({ ...prev, password: newValue }));
    } else if (inputName === 'auth-token') {
      setAuth((prev) => ({ ...prev, token: newValue }));
    } else {
      // Fallback: directly update input value and dispatch event
      input.value = newValue;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Set cursor position after the inserted variable name
    const newCursorPos = beforePrefix.length + variable.name.length;
    setTimeout(() => {
      input.setSelectionRange(newCursorPos, newCursorPos);
      input.focus();
    }, 0);

    setAutocompleteState((prev) => ({ ...prev, show: false }));
  };

  // Function to handle autocomplete suggestions based on key up event
  const handleAutocomplete = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const input = e.target as HTMLInputElement | HTMLTextAreaElement;
    const value = input.value;
    const cursorPosition = input.selectionStart || 0;

    // Check for D_ or S_ at cursor position
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastTwoChars = textBeforeCursor.slice(-2);

    if (lastTwoChars === 'D_' || lastTwoChars === 'S_') {
      const suggestions = getVariablesByPrefix(lastTwoChars as 'D_' | 'S_');

      if (suggestions.length > 0) {
        // Calculate position for dropdown
        const rect = input.getBoundingClientRect();
        const position = {
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
        };

        setAutocompleteState({
          show: true,
          position,
          suggestions,
          prefix: lastTwoChars as 'D_' | 'S_',
          inputRef: input,
          cursorPosition,
        });
      } else {
        setAutocompleteState((prev) => ({ ...prev, show: false }));
      }
    } else {
      setAutocompleteState((prev) => ({ ...prev, show: false }));
    }
  };

  React.useEffect(() => {
    const allVariables = getAllAvailableVariables();
    const processed = processRequestWithVariables(request, allVariables);
    setProcessedRequest(processed);
    setPreviewUrl(getPreviewUrl(allVariables));
  }, [
    storeVariables,
    dynamicVariables,
    dynamicOverrides,
    activeEnvironment,
    request,
    parentExtractedVariables,
    chainVariables,
    url, // Include state variables that affect processed request
    body,
    headers,
    params,
    auth,
  ]);

  const getPreviewUrl = (variables: Variable[]) => {
    const replacedUrl = replaceVariables(url, variables); // Use state variable
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

  const regenerateDynamicVariable = (variableName: string) => {
    const dynamicVar = dynamicVariables.find((v) => v.name === variableName);
    if (!dynamicVar) return;

    const randInt = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    const randString = (len: number) =>
      Array.from({ length: len }, () =>
        Math.random().toString(36).charAt(2)
      ).join('');

    const fakeName = () =>
      ['Alice Johnson', 'Bob Smith', 'Charlie Brown'][
        Math.floor(Math.random() * 3)
      ];

    let newValue: string | number;
    switch (dynamicVar.generatorId) {
      case 'randomString':
        newValue = randString(dynamicVar.parameters?.length || 8);
        break;
      case 'randomInteger':
        newValue = randInt(
          dynamicVar.parameters?.min || 0,
          dynamicVar.parameters?.max || 100
        );
        break;
      case 'name':
        newValue = fakeName();
        break;
      default:
        newValue = '';
    }

    updateDynamicOverride(variableName, newValue);
  };

  const renderEnhancedPreviewUrl = () => {
    const allVariables = getAllAvailableVariables();
    const previewUrl = getPreviewUrl(allVariables);

    const dynamicVarMatches = previewUrl.match(/\{\{\w+\}\}/g) || [];
    const dynamicVarsInUrl = dynamicVarMatches.map((match) =>
      match.replace(/\{\{(\w+)\}\}/, '$1')
    );

    if (dynamicVarsInUrl.length === 0) {
      return (
        <span className='text-blue-600 dark:text-blue-400 font-mono break-all'>
          {previewUrl}
        </span>
      );
    }

    let parts = [previewUrl];
    dynamicVarsInUrl.forEach((varName) => {
      const currentVar = dynamicStructured.find((v) => v.name === `${varName}`);
      if (currentVar) {
        parts = parts.flatMap((part) => {
          if (typeof part === 'string') {
            return part
              .split(String(currentVar.value))
              .flatMap((textPart, index, array) => {
                if (index === array.length - 1) return [textPart];
                return [
                  textPart,
                  <span
                    key={`${varName}-${index}`}
                    className='inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded border border-purple-200 font-mono text-sm'
                    title={`Dynamic variable: ${varName} (click to edit)`}
                  >
                    <Shuffle className='w-3 h-3' />
                    {String(currentVar.value)}
                    <button
                      onClick={() => regenerateDynamicVariable(varName)}
                      className='ml-1 p-0.5 hover:bg-purple-200 rounded transition-colors'
                      title='Regenerate value'
                    >
                      <Shuffle className='w-3 h-3' />
                    </button>
                  </span>,
                ];
              });
          }
          return [part];
        });
      }
    });

    return <div className='flex flex-wrap items-center gap-0'>{parts}</div>;
  };

  const handleExecute = async () => {
    const allVariables = getAllAvailableVariables();
    const safeRequest = {
      ...request,
      extractVariables: request.extractVariables ?? [],
      headers: request.headers ?? [],
      params: request.params ?? [],
      url: url, // Use state variable for URL
      body: body, // Use state variable for body
      authToken: auth.token, // Use state variable for auth token
      authUsername: auth.username, // Use state variable for auth username
      authPassword: auth.password, // Use state variable for auth password
      headers: headers, // Use state variable for headers
      params: params, // Use state variable for params
    };
    if (!safeRequest.url) {
      toast({
        title: 'Error',
        description: 'Request URL is required',
        variant: 'destructive',
      });
      return;
    }
    setIsExecuting(true);
    try {
      const startTime = Date.now();
      const payload = buildRequestPayload(safeRequest, allVariables);
      const previewUrl = getPreviewUrl(allVariables);
      payload.request.url = previewUrl;
      const backendData = await executeRequest(payload);
      const result = backendData?.data?.responses?.[0];
      if (!result) throw new Error('No response from executor');
      const extractedData = extractDataFromResponse(
        {
          body: result.body,
          headers: result.headers,
          cookies: parseCookies(result.headers?.['set-cookie'] ?? ''),
        },
        safeRequest.extractVariables
      );
      const endTime = Date.now();
      const log: ExecutionLog = {
        id: Date.now().toString(),
        chainId: 'current-chain',
        requestId: safeRequest.id,
        status:
          result.statusCode >= 200 && result.statusCode < 300
            ? 'success'
            : 'error',
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration: result.metrics.responseTime,
        request: {
          method: safeRequest.method,
          url: previewUrl,
          headers: Object.fromEntries(
            safeRequest.headers.map((h) => [h.key, h.value])
          ),
          body: safeRequest.body ?? '',
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

      if (!hideResponseExplorer) {
        setExecutionResult(log);
      }

      if (onRequestExecution) {
        onRequestExecution(log);
      }

      try {
        const raw = localStorage.getItem('lastExecutionByRequest');
        const map = raw ? JSON.JSON.parse(raw) : {};
        map[request.id] = log;
        localStorage.setItem('lastExecutionByRequest', JSON.stringify(map));
      } catch (e) {
        console.error('Failed to persist lastExecutionByRequest:', e);
      }
      toast({
        title: 'Execution Complete',
        description: `Request completed with status ${result.statusCode}`,
        variant: log.status === 'success' ? 'default' : 'destructive',
      });
    } catch (error) {
      const endTime = Date.now();
      const errorLog: ExecutionLog = {
        id: Date.now().toString(),
        chainId: 'current-chain',
        requestId: request.id,
        status: 'error',
        startTime: new Date().toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration: 0,
        request: {
          method: request.method,
          url: getPreviewUrl(getAllAvailableVariables()),
          headers: {},
          body: request.body,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      if (!hideResponseExplorer) {
        setExecutionResult(errorLog);
      }

      if (onRequestExecution) {
        onRequestExecution(errorLog);
      }

      try {
        const raw = localStorage.getItem('lastExecutionByRequest');
        const map = raw ? JSON.parse(raw) : {};
        map[request.id] = errorLog;
        localStorage.setItem('lastExecutionByRequest', JSON.stringify(map));
      } catch (e) {
        console.error('Failed to persist lastExecutionByRequest (error):', e);
      }
      toast({
        title: 'Execution Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const addKeyValuePair = (type: 'params' | 'headers') => {
    const newPair: KeyValuePair = {
      id: `temp_${Date.now().toString()}`,
      key: '',
      value: '',
      enabled: true,
      description: '',
    };
    if (type === 'params') {
      setParams((prev) => [...prev, newPair]);
    } else {
      setHeaders((prev) => [...prev, newPair]);
    }
  };

  const updateKeyValuePair = (
    type: 'params' | 'headers',
    id: string,
    updates: Partial<KeyValuePair>
  ) => {
    if (type === 'params') {
      setParams((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    } else {
      setHeaders((prev) =>
        prev.map((h) => (h.id === id ? { ...h, ...updates } : h))
      );
    }
  };

  const removeKeyValuePair = (type: 'params' | 'headers', id: string) => {
    if (type === 'params') {
      setParams((prev) => prev.filter((p) => p.id !== id));
    } else {
      setHeaders((prev) => prev.filter((h) => h.id !== id));
    }
  };

  const tabs = [
    { id: 'params', label: 'Params', icon: FileText },
    { id: 'headers', label: 'Headers', icon: Code },
    { id: 'body', label: 'Body', icon: FileText },
    { id: 'auth', label: 'Auth', icon: Shield },
    { id: 'tests', label: 'Tests', icon: TestTube },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

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

  const addParam = () => {
    setParams((prev) => [
      ...prev,
      {
        key: '',
        value: '',
        enabled: true,
        id: `temp_${Date.now().toString()}`,
      },
    ]);
  };

  const updateParam = (
    index: number,
    updates: Partial<{ key: string; value: string; enabled: boolean }>
  ) => {
    setParams((prev) =>
      prev.map((param, i) => (i === index ? { ...param, ...updates } : param))
    );
  };

  const removeParam = (index: number) => {
    setParams((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExtractVariable = (extraction: DataExtraction) => {
    const normalizeString = (value?: string) => (value || '').trim();
    const normalizeBool = (value?: boolean) => !!value;
    const currentExtractions = request.extractVariables || [];

    const variableName = extraction.variableName || extraction.name;

    if (!variableName) {
      toast({
        title: 'Error',
        description: 'Variable name is required',
        variant: 'destructive',
      });
      return;
    }

    const isDuplicate = currentExtractions.some(
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

    const existingChains = JSON.parse(
      localStorage.getItem('extractionLogs') || '[]'
    );
    let maxOrder = 0;
    for (const chain of existingChains) {
      for (const req of chain.chainRequests || []) {
        if (typeof req.order === 'number' && req.order > maxOrder) {
          maxOrder = req.order;
        }
      }
    }
    const nextOrder = maxOrder + 1;
    const extractionWithOrder = {
      ...normalizedExtraction,
      order: nextOrder,
    };
    const updatedExtractions = [...currentExtractions, normalizedExtraction];
    const updatePayload: Partial<APIRequest> & { requestChainId?: string } = {
      extractVariables: updatedExtractions,
    };
    if (requestChainId) {
      updatePayload.requestChainId = requestChainId;
    }
    const newRequest = {
      url: request.url,
      method: request.method,
      requestName: request.name,
      bodyType: request.bodyType,
      bodyRawContent: request.body,
      authorizationType: request.authorizationType,
      authorization: {
        token: request.authToken,
        username: request.authUsername,
        password: request.authPassword,
        apiKey: request.authApiKey,
        apiValue: request.authApiValue,
        apiLocation: request.authApiLocation,
      },
      headers: request.headers,
      params: request.params,
      variables: request.variables || {},
      extractVariables: updatedExtractions,
      name: request.name,
      description: request.description,
      order: nextOrder,
    };
    const chainIndex = existingChains.findIndex(
      (chain: any) =>
        normalizeString(chain.name) === normalizeString(chainName) &&
        normalizeString(chain.description) ===
          normalizeString(chainDescription) &&
        normalizeBool(chain.isImportant) === normalizeBool(chainEnabled) &&
        chain.environmentId === activeEnvironment?.id
    );
    if (chainIndex !== -1) {
      const alreadyExists = existingChains[chainIndex].chainRequests.some(
        (req: any) => req.url === request.url && req.method === request.method
      );
      if (!alreadyExists) {
        existingChains[chainIndex].chainRequests.push(newRequest);
      }
    } else {
      const newChain = {
        name: normalizeString(chainName),
        description: normalizeString(chainDescription),
        isImportant: normalizeBool(chainEnabled),
        environmentId: activeEnvironment?.id || null,
        chainRequests: [newRequest],
      };
      existingChains.push(newChain);
    }
    localStorage.setItem('extractionLogs', JSON.stringify(existingChains));
    setPreviousExtractions(updatedExtractions);
    onUpdate(updatePayload);
    if (executionResult?.response) {
      const extracted = extractDataFromResponse(
        executionResult.response,
        updatedExtractions
      );
      setExtractedVariables((prev) => {
        const merged = { ...prev, ...extracted };
        updateExtractedVariables(merged);
        try {
          const raw = localStorage.getItem('lastExecutionByRequest');
          const map = raw ? JSON.parse(raw) : {};
          const existing = map[request.id] || {};
          map[request.id] = {
            ...existing,
            extractedVariables: {
              ...(existing.extractedVariables || {}),
              ...extracted,
            },
          };
          localStorage.setItem('lastExecutionByRequest', JSON.stringify(map));
        } catch (e) {
          console.error(
            'Failed to persist variables into lastExecutionByRequest:',
            e
          );
        }
        return merged;
      });
    }
  };

  const handleRemoveExtraction = (variableName: string) => {
    const updatedExtractions = (request.extractVariables || []).filter(
      (e) => (e.variableName || e.name) !== variableName
    );
    onUpdate({ extractVariables: updatedExtractions });
    const newExtracted = { ...extractedVariables };
    delete newExtracted[variableName];
    setExtractedVariables(newExtracted);
  };

  const [copied, setCopied] = useState(false);
  const handleCopy = async (value: string) => {
    try {
      const formattedValue = `{{${value}}}`;
      await navigator.clipboard.writeText(formattedValue);
      setCopied(true);
      toast({
        title: 'Copied to Clipboard',
        description: `Copied: ${formattedValue}`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const addHeader = () => {
    setHeaders((prev) => [
      ...prev,
      {
        key: '',
        value: '',
        enabled: true,
        id: `temp_${Date.now().toString()}`,
      },
    ]);
  };

  const updateHeader = (
    index: number,
    updates: Partial<{ key: string; value: string; enabled: boolean }>
  ) => {
    setHeaders((prev) =>
      prev.map((header, i) =>
        i === index ? { ...header, ...updates } : header
      )
    );
  };

  const removeHeader = (index: number) => {
    setHeaders((prev) => prev.filter((_, i) => i !== index));
  };

  const addTest = (type: 'status' | 'responseTime' | 'jsonContent') => {
    let newTest: TestScript;
    const base = {
      id: `temp_${Date.now().toString()}`,
      type,
      enabled: true,
    };
    if (type === 'status') {
      newTest = {
        ...base,
        operator: 'equal',
        expectedValue: '200',
        description: 'Status code should be equal to 200 (OK)',
      };
    } else if (type === 'responseTime') {
      newTest = {
        ...base,
        operator: 'lessThan',
        expectedValue: '200',
        description: 'Response time should be less than 200 ms',
      };
    } else {
      newTest = {
        ...base,
        jsonPath: '$.property',
        operator: 'contain',
        expectedValue: 'expected value',
        description:
          'JSON value at path $.property should contain expected value',
      };
    }
    onUpdate({
      testScripts: [...(request.testScripts || []), newTest],
    });
  };

  const updateTest = (testId: string, updates: Partial<TestScript>) => {
    const updatedTests = (request.testScripts || []).map((test) =>
      test.id === testId ? { ...test, ...updates } : test
    );
    onUpdate({ testScripts: updatedTests });
  };

  const removeTest = (testId: string) => {
    onUpdate({
      testScripts: (request.testScripts || []).filter(
        (test) => test.id !== testId
      ),
    });
  };

  const KeyValueTable = ({
    type,
    items,
    addButtonText,
    emptyStateText,
  }: {
    type: 'params' | 'headers';
    items: KeyValuePair[];
    addButtonText: string;
    emptyStateText: string;
  }) => (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>
          {type === 'params' ? 'Params' : 'Headers'}
        </h3>
        <Button
          variant='link'
          size='sm'
          onClick={() => addKeyValuePair(type)}
          className='gap-2 text-primary'
        >
          <Plus className='w-4 h-4' />
          {addButtonText}
        </Button>
      </div>
      {items.length > 0 ? (
        <div className='space-y-2'>
          <div className='grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground border-b pb-2'>
            <div className='col-span-1'></div>
            <div className='col-span-4'>Key</div>
            <div className='col-span-4'>Value</div>
            <div className='col-span-2'>Description</div>
            <div className='col-span-1'></div>
          </div>
          {items.map((item) => (
            <div key={item.id} className='grid grid-cols-12 gap-2 items-center'>
              <div className='col-span-1 flex justify-center'>
                <Checkbox
                  checked={item.enabled}
                  onCheckedChange={(checked) =>
                    updateKeyValuePair(type, item.id, { enabled: !!checked })
                  }
                />
              </div>
              <div className='col-span-4'>
                <Input
                  value={item.key}
                  onChange={(e) =>
                    updateKeyValuePair(type, item.id, { key: e.target.value })
                  }
                  placeholder='Key'
                  className='h-8'
                />
              </div>
              <div className='col-span-4'>
                <Input
                  value={item.value}
                  onChange={(e) =>
                    updateKeyValuePair(type, item.id, { value: e.target.value })
                  }
                  placeholder='Value'
                  className='h-8'
                />
              </div>
              <div className='col-span-2'>
                <Input
                  value={item.description || ''}
                  onChange={(e) =>
                    updateKeyValuePair(type, item.id, {
                      description: e.target.value,
                    })
                  }
                  placeholder='Description'
                  className='h-8'
                />
              </div>
              <div className='col-span-1 flex justify-center'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => removeKeyValuePair(type, item.id)}
                  className='h-8 w-8 p-0 text-red-600 hover:text-red-700'
                >
                  <Trash2 className='w-3 h-3' />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center py-12'>
          <div className='w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4'>
            <Code className='w-8 h-8 text-muted-foreground' />
          </div>
          <p className='text-muted-foreground'>{emptyStateText}</p>
        </div>
      )}
    </div>
  );

  const showVariablePreview = () => {
    const allVariables = getAllAvailableVariables();
    return (
      processedRequest.authToken !== request.authToken ||
      processedRequest.authorization?.token !== request.authorization?.token ||
      processedRequest.body !== request.body ||
      processedRequest.url !== request.url ||
      JSON.stringify(processedRequest.headers) !==
        JSON.stringify(request.headers) ||
      JSON.stringify(processedRequest.params) !== JSON.stringify(request.params)
    );
  };

  const DynamicVariablesPanel = () => {
    // Only show if there are used dynamic variables
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
                    onClick={() => regenerateDynamicVariable(originalName)}
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
                    onClick={() => regenerateDynamicVariable(originalName)}
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

  if (compact) {
    return (
      <div className='space-y-4'>
        <VariableAutocomplete />

        {/* Request URL */}
        <div className='flex items-center space-x-2'>
          <Select
            value={request.method}
            onValueChange={(value) => onUpdate({ method: value as any })}
          >
            <SelectTrigger className='w-24'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='GET'>GET</SelectItem>
              <SelectItem value='POST'>POST</SelectItem>
              <SelectItem value='PUT'>PUT</SelectItem>
              <SelectItem value='DELETE'>DELETE</SelectItem>
              <SelectItem value='PATCH'>PATCH</SelectItem>
              <SelectItem value='HEAD'>HEAD</SelectItem>
              <SelectItem value='OPTIONS'>OPTIONS</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={url}
            onChange={(e) => handleInputChange(e, setUrl)}
            onKeyUp={(e) => handleAutocomplete(e)}
            placeholder='Enter request URL'
            className='flex-1'
            name='url'
          />
          <Button
            onClick={handleExecute}
            disabled={isExecuting}
            className='hover-scale bg-[#136fb0] text-white'
          >
            <Play className='w-4 h-4' />
            {isExecuting ? 'Running...' : 'Run'}
          </Button>
        </div>

        {/* Enhanced URL Preview */}
        <div className='flex items-start space-x-2 mt-2 text-sm'>
          <span className='text-gray-600 dark:text-gray-400 font-medium'>
            Final URL Preview:
          </span>
          <div className='flex-1'>{renderEnhancedPreviewUrl()}</div>
        </div>

        {/* Dynamic Variables Panel - Now only shows used variables */}
        <DynamicVariablesPanel />

        {/* Show available variables for debugging */}
        {Object.keys(parentExtractedVariables).length > 0 && (
          <div className='mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm'>
            <strong>Available Variables:</strong>{' '}
            {Object.keys(parentExtractedVariables)
              .map((name) => `{{${name}}}`)
              .join(', ')}
          </div>
        )}

        {/* Tabs */}
        <div className='border-b border-gray-200'>
          <nav className='flex space-x-8 px-6'>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-[#136fb0]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className='w-4 h-4' />
                  <span>{tab.label}</span>
                  {tab.id === 'tests' &&
                    request.testScripts &&
                    request.testScripts.length > 0 && (
                      <span className='ml-1 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full'>
                        {request.testScripts.length}
                      </span>
                    )}
                </button>
              );
            })}
          </nav>
        </div>
        {/* Tab Content */}
        <div className='p-6'>
          {activeTab === 'params' && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-medium text-gray-900'>
                  Query Parameters
                </h3>
                <button
                  onClick={addParam}
                  className='flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                >
                  <Plus className='w-4 h-4' color='#136fb0' />
                  <span className='text-[#136fb0]'>Add Parameter</span>
                </button>
              </div>

              {/* Parameters List (no empty state) */}
              <div className='space-y-2'>
                {params.map((param, index) => (
                  <div key={param.id} className='flex items-center space-x-2'>
                    <input
                      type='text'
                      name={`param-key-${index}`}
                      value={param.key}
                      onChange={(e) =>
                        handleInputChange(e, (value) => {
                          const newParams = [...params];
                          newParams[index] = {
                            ...newParams[index],
                            key: value,
                          };
                          setParams(newParams);
                        })
                      }
                      onKeyUp={(e) => handleAutocomplete(e)}
                      className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
                      placeholder='Key'
                    />
                    <input
                      type='text'
                      name={`param-value-${index}`}
                      value={param.value}
                      onChange={(e) =>
                        handleInputChange(e, (value) => {
                          const newParams = [...params];
                          newParams[index] = {
                            ...newParams[index],
                            value: value,
                          };
                          setParams(newParams);
                        })
                      }
                      onKeyUp={(e) => handleAutocomplete(e)}
                      className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
                      placeholder='Value (use {{variableName}} or {{dynamicVar}} for variables)'
                    />
                    {/* Show processed value if different */}
                    {processedRequest.params?.[index]?.value !== param.value &&
                      processedRequest.params?.[index]?.value && (
                        <div className='flex-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs font-mono'>
                          → {processedRequest.params[index]?.value}
                        </div>
                      )}
                    <button
                      onClick={() =>
                        updateParam(index, { enabled: !param.enabled })
                      }
                      className={`p-2 rounded-lg transition-colors ${
                        param.enabled
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {/* toggle visibility icon here */}
                    </button>
                    <button
                      onClick={() => removeParam(index)}
                      className='p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                    >
                      <Trash2 className='w-4 h-4' />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'headers' && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-medium text-gray-900'>Headers</h3>
                <button
                  onClick={addHeader}
                  className='flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                >
                  <Plus className='w-4 h-4' />
                  <span>Add Header</span>
                </button>
              </div>

              {/* Headers List (no empty state) */}
              <div className='space-y-2'>
                {headers.map((header, index) => (
                  <div key={header.id} className='flex items-center space-x-2'>
                    <input
                      type='text'
                      name={`header-key-${index}`}
                      value={header.key}
                      onChange={(e) =>
                        handleInputChange(e, (value) => {
                          const newHeaders = [...headers];
                          newHeaders[index] = {
                            ...newHeaders[index],
                            key: value,
                          };
                          setHeaders(newHeaders);
                        })
                      }
                      onKeyUp={(e) => handleAutocomplete(e)}
                      className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
                      placeholder='Key'
                    />
                    <input
                      type='text'
                      name={`header-value-${index}`}
                      value={header.value}
                      onChange={(e) =>
                        handleInputChange(e, (value) => {
                          const newHeaders = [...headers];
                          newHeaders[index] = {
                            ...newHeaders[index],
                            value: value,
                          };
                          setHeaders(newHeaders);
                        })
                      }
                      onKeyUp={(e) => handleAutocomplete(e)}
                      className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
                      placeholder='Value (use {{variableName}} or {{dynamicVar}} for variables)'
                    />
                    {/* Show processed value if different */}
                    {processedRequest.headers?.[index]?.value !==
                      header.value &&
                      processedRequest.headers?.[index]?.value && (
                        <div className='flex-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs font-mono'>
                          → {processedRequest.headers[index]?.value}
                        </div>
                      )}
                    <button
                      onClick={() =>
                        updateHeader(index, { enabled: !header.enabled })
                      }
                      className={`p-2 rounded-lg transition-colors ${
                        header.enabled
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {/* toggle visibility icon */}
                    </button>
                    <button
                      onClick={() => removeHeader(index)}
                      className='p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                    >
                      <Trash2 className='w-4 h-4' />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'body' && (
            <div className='space-y-4'>
              <h3 className='text-lg font-medium text-gray-900'>
                Request Body
              </h3>
              <div className='flex items-center space-x-4'>
                <label className='flex items-center space-x-2'>
                  <input
                    type='radio'
                    name='bodyType'
                    value='none'
                    checked={request.bodyType === 'none'}
                    onChange={(e) =>
                      onUpdate({
                        bodyType: e.target.value as APIRequest['bodyType'],
                      })
                    }
                    className='text-blue-600'
                  />
                  <span className='text-sm'>None</span>
                </label>
                <label className='flex items-center space-x-2'>
                  <input
                    type='radio'
                    name='bodyType'
                    value='form-data'
                    checked={request.bodyType === 'form-data'}
                    onChange={(e) =>
                      onUpdate({
                        bodyType: e.target.value as APIRequest['bodyType'],
                      })
                    }
                    className='text-blue-600'
                  />
                  <span className='text-sm'>Form Data</span>
                </label>
                <label className='flex items-center space-x-2'>
                  <input
                    type='radio'
                    name='bodyType'
                    value='x-www-form-urlencoded'
                    checked={request.bodyType === 'x-www-form-urlencoded'}
                    onChange={(e) =>
                      onUpdate({
                        bodyType: e.target.value as APIRequest['bodyType'],
                      })
                    }
                    className='text-blue-600'
                  />
                  <span className='text-sm'>x-www-form-urlencoded</span>
                </label>
                <label className='flex items-center space-x-2'>
                  <input
                    type='radio'
                    name='bodyType'
                    value='raw'
                    checked={request.bodyType === 'raw'}
                    onChange={(e) =>
                      onUpdate({
                        bodyType: e.target.value as APIRequest['bodyType'],
                      })
                    }
                    className='text-blue-600'
                  />
                  <span className='text-sm'>Raw</span>
                </label>
              </div>
              {request.bodyType === 'raw' && (
                <div className='space-y-2'>
                  <div className='flex items-center justify-end'>
                    <select
                      value={request.rawBodyType || 'text'}
                      onChange={(e) =>
                        onUpdate({
                          rawBodyType: e.target.value as
                            | 'text'
                            | 'json'
                            | 'xml'
                            | 'html',
                        })
                      }
                      className='px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    >
                      <option value='text'>Text</option>
                      <option value='json'>JSON</option>
                      <option value='xml'>XML</option>
                      <option value='html'>HTML</option>
                    </select>
                  </div>
                  <textarea
                    name='body'
                    value={body}
                    onChange={(e) => handleInputChange(e, setBody)}
                    onKeyUp={(e) => handleAutocomplete(e)}
                    rows={8}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm'
                    placeholder='Enter request body... Use {{variableName}} or {{dynamicVar}} for variables'
                  />
                  {/* Show processed value if different */}
                  {/* {processedRequest.body !== request.body &&
                    processedRequest.body && (
                      <div className='mt-2 p-2 bg-blue-50 border border-blue-200 rounded'>
                        <div className='text-xs font-medium text-blue-900 mb-1'>
                          Processed Body:
                        </div>
                        <pre className='text-xs font-mono text-blue-800 max-h-32 overflow-y-auto'>
                          {processedRequest.body}
                        </pre>
                      </div>
                    )} */}
                </div>
              )}
              {request.bodyType !== 'none' && request.bodyType !== 'raw' && (
                <div className='text-center py-8 text-gray-500'>
                  <FileText className='w-12 h-12 text-gray-300 mx-auto mb-3' />
                  <p>Form data editor coming soon...</p>
                </div>
              )}
            </div>
          )}
          {activeTab === 'auth' && (
            <div className='space-y-4'>
              <h3 className='text-lg font-medium text-gray-900'>
                Authentication
              </h3>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Auth Type
                  </label>
                  <select
                    value={request.authorizationType || 'none'}
                    onChange={(e) =>
                      onUpdate({
                        authorizationType: e.target
                          .value as APIRequest['authorizationType'],
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  >
                    <option value='none'>No Auth</option>
                    <option value='bearer'>Bearer Token</option>
                    <option value='basic'>Basic Auth</option>
                    <option value='apikey'>API Key</option>
                    <option value='oauth2'>OAuth 2.0</option>
                  </select>
                </div>
                {request.authorizationType === 'bearer' && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Bearer Token
                    </label>
                    <input
                      type='text'
                      name='auth-token'
                      value={auth.token}
                      onChange={(e) =>
                        handleInputChange(e, (value) =>
                          setAuth((prev) => ({ ...prev, token: value }))
                        )
                      }
                      onKeyUp={(e) => handleAutocomplete(e)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      placeholder='Enter bearer token or use {{tokenVariable}} or {{dynamicToken}}'
                    />
                    {/* Show processed value if different */}
                    {(processedRequest.authorization?.token ||
                      processedRequest.authToken) !==
                      (request.authorization?.token || request.authToken) && (
                      <div className='mt-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs font-mono'>
                        Processed:{' '}
                        {processedRequest.authorization?.token ||
                          processedRequest.authToken}
                      </div>
                    )}
                  </div>
                )}
                {request.authorizationType === 'basic' && (
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Username
                      </label>
                      <input
                        type='text'
                        name='auth-username'
                        value={auth.username}
                        onChange={(e) =>
                          handleInputChange(e, (value) =>
                            setAuth((prev) => ({ ...prev, username: value }))
                          )
                        }
                        onKeyUp={(e) => handleAutocomplete(e)}
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        placeholder='Username or {{usernameVar}} or {{dynamicUsername}}'
                      />
                      {/* Show processed value if different */}
                      {processedRequest.authUsername !== request.authUsername &&
                        processedRequest.authUsername && (
                          <div className='mt-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs font-mono'>
                            Processed: {processedRequest.authUsername}
                          </div>
                        )}
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Password
                      </label>
                      <input
                        type='password'
                        name='auth-password'
                        value={auth.password}
                        onChange={(e) =>
                          handleInputChange(e, (value) =>
                            setAuth((prev) => ({ ...prev, password: value }))
                          )
                        }
                        onKeyUp={(e) => handleAutocomplete(e)}
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        placeholder='Password or {{passwordVar}} or {dynamicPassword}}'
                      />
                      {/* Show processed value if different */}
                      {processedRequest.authPassword !== request.authPassword &&
                        processedRequest.authPassword && (
                          <div className='mt-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs font-mono'>
                            Processed: {processedRequest.authPassword}
                          </div>
                        )}
                    </div>
                  </div>
                )}
                {request.authorizationType === 'apikey' && (
                  <div className='space-y-4'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Key
                        </label>
                        <input
                          type='text'
                          value={request.authApiKey || ''}
                          // Updated onChange to use handleInputChange
                          onChange={(e) => {
                            handleInputChange(e, (e) =>
                              onUpdate({ authApiKey: e.target.value })
                            );
                          }}
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          placeholder='API Key name or {{keyVar}} or {{dynamicKey}}'
                        />
                        {/* Show processed value if different */}
                        {processedRequest.authApiKey !== request.authApiKey &&
                          processedRequest.authApiKey && (
                            <div className='mt-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs font-mono'>
                              Processed: {processedRequest.authApiKey}
                            </div>
                          )}
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Value
                        </label>
                        <input
                          type='text'
                          value={request.authApiValue || ''}
                          // Updated onChange to use handleInputChange
                          onChange={(e) => {
                            handleInputChange(e, (e) =>
                              onUpdate({ authApiValue: e.target.value })
                            );
                          }}
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          placeholder='API Key value or {{valueVar}} or {{dynamicValue}}'
                        />
                        {/* Show processed value if different */}
                        {processedRequest.authApiValue !==
                          request.authApiValue &&
                          processedRequest.authApiValue && (
                            <div className='mt-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs font-mono'>
                              Processed: {processedRequest.authApiValue}
                            </div>
                          )}
                      </div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Add to
                      </label>
                      <select
                        value={request.authApiLocation || 'header'}
                        onChange={(e) =>
                          onUpdate({
                            authApiLocation: e.target.value as
                              | 'header'
                              | 'query',
                          })
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      >
                        <option value='header'>Header</option>
                        <option value='query'>Query Params</option>
                      </select>
                    </div>
                  </div>
                )}
                {request.authorizationType === 'oauth2' && (
                  <div className='text-center py-8 text-gray-500'>
                    <Shield className='w-12 h-12 text-gray-300 mx-auto mb-3' />
                    <p>OAuth 2.0 configuration coming soon...</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'tests' && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-medium text-gray-900'>
                  Test Scripts
                </h3>
                <div className='flex space-x-2'>
                  <button
                    onClick={() => addTest('responseTime')}
                    className='flex items-center space-x-2 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
                  >
                    <Clock className='w-4 h-4' />
                    <span>Response Time</span>
                  </button>
                  <button
                    onClick={() => addTest('status')}
                    className='flex items-center space-x-2 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
                  >
                    <CheckCircle className='w-4 h-4' />
                    <span>Status Code</span>
                  </button>
                  <button
                    onClick={() => addTest('jsonContent')}
                    className='flex items-center space-x-2 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
                  >
                    <Code className='w-4 h-4' />
                    <span>JSON Content</span>
                  </button>
                </div>
              </div>
              {request.testScripts && request.testScripts.length > 0 ? (
                <div className='space-y-3'>
                  {request.testScripts.map((test) => (
                    <div
                      key={test.id}
                      className='border border-gray-200 rounded-lg p-4'
                    >
                      <div className='flex items-center justify-between mb-3'>
                        <h4 className='font-medium text-gray-900'>
                          {test.type === 'status' && 'Status Code Test'}
                          {test.type === 'responseTime' && 'Response Time Test'}
                          {test.type === 'jsonContent' && 'JSON Content Test'}
                        </h4>
                        <div className='flex items-center space-x-2'>
                          <button
                            onClick={() =>
                              updateTest(test.id, { enabled: !test.enabled })
                            }
                            className={`p-1 rounded transition-colors ${
                              test.enabled
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-gray-400 hover:bg-gray-50'
                            }`}
                          >
                            {/* {test.enabled ? (
                              <Eye className='w-4 h-4' />
                            ) : (
                              <EyeOff className='w-4 h-4' />
                            )} */}
                          </button>
                          <button
                            onClick={() => removeTest(test.id)}
                            className='p-1 text-red-600 hover:bg-red-50 rounded transition-colors'
                          >
                            <Trash2 className='w-4 h-4' />
                          </button>
                        </div>
                      </div>
                      <div className='grid grid-cols-1 md:grid-cols-3 gap-3 text-sm'>
                        {test.type === 'status' && (
                          <>
                            <div>
                              <span className='text-gray-600'>
                                Status code should be
                              </span>
                            </div>
                            <select
                              value={test.operator}
                              onChange={(e) =>
                                updateTest(test.id, {
                                  operator: e.target.value,
                                })
                              }
                              className='px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                            >
                              <option value='equal'>equal</option>
                              <option value='notEqual'>not equal</option>
                              <option value='greaterThan'>greater than</option>
                              <option value='lessThan'>less than</option>
                            </select>
                            <select
                              value={test.expectedValue}
                              onChange={(e) =>
                                updateTest(test.id, {
                                  expectedValue: e.target.value,
                                })
                              }
                              className='px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                            >
                              <option value='200'>200 (OK)</option>
                              <option value='201'>201 (Created)</option>
                              <option value='204'>204 (No Content)</option>
                              <option value='400'>400 (Bad Request)</option>
                              <option value='401'>401 (Unauthorized)</option>
                              <option value='404'>404 (Not Found)</option>
                              <option value='500'>500 (Server Error)</option>
                            </select>
                          </>
                        )}
                        {test.type === 'responseTime' && (
                          <>
                            <div>
                              <span className='text-gray-600'>
                                Response time should be
                              </span>
                            </div>
                            <select
                              value={test.operator}
                              onChange={(e) =>
                                updateTest(test.id, {
                                  operator: e.target.value,
                                })
                              }
                              className='px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                            >
                              <option value='lessThan'>less than</option>
                              <option value='greaterThan'>greater than</option>
                              <option value='equal'>equal to</option>
                            </select>
                            <div className='flex items-center space-x-1'>
                              <input
                                type='number'
                                value={test.expectedValue}
                                onChange={(e) =>
                                  updateTest(test.id, {
                                    expectedValue: e.target.value,
                                  })
                                }
                                className='flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                placeholder='200'
                              />
                              <span className='text-gray-500'>ms</span>
                            </div>
                          </>
                        )}
                        {test.type === 'jsonContent' && (
                          <>
                            <div className='flex items-center space-x-2'>
                              <span className='text-gray-600'>
                                JSON value at path
                              </span>
                              <input
                                type='text'
                                value={test.jsonPath || ''}
                                onChange={(e) =>
                                  updateTest(test.id, {
                                    jsonPath: e.target.value,
                                  })
                                }
                                className='flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono'
                                placeholder='$.property'
                              />
                            </div>
                            <select
                              value={test.operator}
                              onChange={(e) =>
                                updateTest(test.id, {
                                  operator: e.target.value,
                                })
                              }
                              className='px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                            >
                              <option value='contain'>contain</option>
                              <option value='equal'>equal</option>
                              <option value='notEqual'>not equal</option>
                              <option value='exist'>exist</option>
                              <option value='notExist'>not exist</option>
                            </select>
                            <input
                              type='text'
                              value={test.expectedValue}
                              onChange={(e) =>
                                updateTest(test.id, {
                                  expectedValue: e.target.value,
                                })
                              }
                              className='px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                              placeholder='expected value'
                            />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-8 text-gray-500'>
                  <TestTube className='w-12 h-12 text-gray-300 mx-auto mb-3' />
                  <p className='mb-4'>
                    No tests added. Click one of the buttons above to add a
                    test.
                  </p>
                </div>
              )}
            </div>
          )}
          {activeTab === 'settings' && (
            <div className='space-y-6'>
              <h3 className='text-lg font-medium text-gray-900'>
                Request Settings
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Timeout (ms)
                  </label>
                  <input
                    type='number'
                    value={request.timeout}
                    onChange={(e) =>
                      onUpdate({
                        timeout: Number.parseInt(e.target.value) || 5000,
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    min='1000'
                    max='60000'
                  />
                </div>

                {/* Retries (disabled + upcoming) */}
                <div className='opacity-60'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Retries
                  </label>
                  <input
                    type='number'
                    value={request.retries}
                    disabled
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed'
                  />
                  <p className='text-xs text-gray-500 italic mt-1'>Upcoming</p>
                </div>
              </div>

              <div className='p-4 border border-orange-200 bg-orange-50 rounded-lg'>
                <div className='flex items-center space-x-2 mb-3'>
                  <AlertTriangle className='w-5 h-5 text-orange-600' />
                  <h4 className='font-medium text-orange-900'>
                    Error Handling
                  </h4>
                </div>
                <div className='space-y-2'>
                  <label className='flex items-center space-x-2'>
                    <input
                      type='radio'
                      name='errorHandling'
                      value='stop'
                      checked={request.errorHandling === 'stop'}
                      onChange={(e) =>
                        onUpdate({
                          errorHandling: e.target.value as
                            | 'stop'
                            | 'continue'
                            | 'retry',
                        })
                      }
                      className='text-orange-600'
                    />
                    <span className='text-sm text-orange-800'>
                      Stop chain on failure
                    </span>
                  </label>
                  <label className='flex items-center space-x-2 opacity-60'>
                    <input
                      type='radio'
                      name='errorHandling'
                      value='continue'
                      checked={
                        request.errorHandling === 'continue' ||
                        !request.errorHandling
                      }
                      onChange={(e) =>
                        onUpdate({
                          errorHandling: e.target.value as
                            | 'stop'
                            | 'continue'
                            | 'retry',
                        })
                      }
                      className='text-orange-600'
                    />
                    <span className='text-sm text-orange-800'>
                      Continue to next step
                      <span className='text-xs italic text-gray-500'>
                        (Upcoming)
                      </span>
                    </span>
                  </label>

                  {/* Retry disabled + upcoming */}
                  <label className='flex items-center space-x-2 opacity-60'>
                    <input
                      type='radio'
                      name='errorHandling'
                      value='retry'
                      checked={request.errorHandling === 'retry'}
                      disabled
                      className='text-orange-600'
                    />
                    <span className='text-sm text-orange-800'>
                      Retry with backoff{' '}
                      <span className='text-xs italic text-gray-500'>
                        (Upcoming)
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Show variable substitution preview for debugging */}
        {showVariablePreview() && (
          <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
            <h4 className='text-sm font-medium text-blue-900 mb-2'>
              Variable Substitution Preview:
            </h4>
            <div className='space-y-2 text-xs'>
              {(processedRequest.authToken !== request.authToken ||
                processedRequest.authorization?.token !==
                  request.authorization?.token) && (
                <div>
                  <span className='font-medium'>Auth Token:</span>
                  <div className='font-mono bg-white p-1 rounded border max-w-full overflow-hidden text-ellipsis whitespace-nowrap'>
                    <span className='text-gray-500'>
                      {request.authorization?.token || request.authToken}
                    </span>{' '}
                    →
                    <span className='text-blue-600 ml-1'>
                      {processedRequest.authorization?.token ||
                        processedRequest.authToken}
                    </span>
                  </div>
                </div>
              )}
              {processedRequest.url !== request.url && (
                <div>
                  <span className='font-medium'>URL:</span>
                  <div className='font-mono bg-white p-1 rounded border'>
                    <span className='text-gray-500'>{request.url}</span> →
                    <span className='text-blue-600 ml-1'>
                      {processedRequest.url}
                    </span>
                  </div>
                </div>
              )}
              {processedRequest.body !== request.body &&
                processedRequest.body && (
                  <div>
                    <span className='font-medium'>Body:</span>
                    <div className='font-mono bg-white p-1 rounded border max-h-20 overflow-y-auto'>
                      <pre className='text-blue-600'>
                        {processedRequest.body}
                      </pre>
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Response Section - Only show if not hidden by parent */}
        {!hideResponseExplorer && executionResult && (
          <div className='border-t border-gray-200'>
            <div className='flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200'>
              <div className='flex items-center space-x-4'>
                {executionResult.status === 'success' ? (
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
                {executionResult.response && (
                  <>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        executionResult.response.status < 300
                          ? 'bg-green-100 text-green-800'
                          : executionResult.response.status < 400
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {executionResult.response.status}{' '}
                      {executionResult.response.status === 200
                        ? 'OK'
                        : executionResult.response.status === 201
                        ? 'Created'
                        : executionResult.response.status === 404
                        ? 'Not Found'
                        : executionResult.response.status === 500
                        ? 'Server Error'
                        : ''}
                    </span>
                    <span className='text-sm text-gray-600'>
                      {executionResult.duration}ms
                    </span>
                    <span className='text-sm text-gray-600'>
                      {(executionResult.response.size / 1024).toFixed(2)} KB
                    </span>
                  </>
                )}
              </div>
              <div className='flex items-center space-x-2'>
                <button
                  onClick={() => setShowResponse(!showResponse)}
                  className='flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded transition-colors'
                >
                  {showResponse ? (
                    <ChevronDown className='w-4 h-4' />
                  ) : (
                    <ChevronRight className='w-4 h-4' />
                  )}
                  <span>{showResponse ? 'Hide' : 'Show'}</span>
                </button>
              </div>
            </div>
            {showResponse && executionResult.response && (
              <>
                <div className='border-b border-gray-200'>
                  <nav className='flex space-x-8 px-6'>
                    {[
                      { id: 'body', label: 'Body', count: null },
                      {
                        id: 'cookies',
                        label: 'Cookies',
                        count: executionResult.response.cookies
                          ? Object.keys(executionResult.response.cookies).length
                          : 0,
                      },
                      {
                        id: 'headers',
                        label: 'Headers',
                        count: Object.keys(executionResult.response.headers)
                          .length,
                      },
                      {
                        id: 'test-results',
                        label: 'Test Results',
                        count: null,
                      },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() =>
                          setResponseTab(tab.id as typeof responseTab)
                        }
                        className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                          responseTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span>{tab.label}</span>
                        {tab.count !== null && tab.count > 0 && (
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
                        onClick={() => setIsJsonOpen((prev) => !prev)}
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
                              copyToClipboard(executionResult.response!.body);
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
                                executionResult.response.body,
                                executionResult.response.headers['content-type']
                              )}
                            </code>
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                  {responseTab === 'cookies' && (
                    <div className='space-y-3'>
                      {executionResult.response.cookies &&
                      Object.keys(executionResult.response.cookies).length >
                        0 ? (
                        Object.entries(executionResult.response.cookies).map(
                          ([name, value]) => (
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
                                onClick={() => copyToClipboard(value)}
                                className='p-1 text-gray-400 hover:text-gray-600 rounded'
                              >
                                <Copy className='w-4 h-4' />
                              </button>
                            </div>
                          )
                        )
                      ) : (
                        <p className='text-gray-500 text-center py-8'>
                          No cookies in response
                        </p>
                      )}
                    </div>
                  )}
                  {responseTab === 'headers' && (
                    <div className='space-y-3'>
                      {Object.entries(executionResult.response.headers).map(
                        ([name, value]) => (
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
                              onClick={() => copyToClipboard(value)}
                              className='p-1 text-gray-400 hover:text-gray-600 rounded'
                            >
                              <Copy className='w-4 h-4' />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}
                  {responseTab === 'test-results' && (
                    <div className='text-center py-8 text-gray-500'>
                      <TestTube className='w-12 h-12 text-gray-300 mx-auto mb-3' />
                      <p>Test results will appear here after running tests</p>
                    </div>
                  )}
                </div>
              </>
            )}
            {showResponse && !executionResult.response && (
              <div className='p-6'>
                <div className='text-red-600'>
                  <h4 className='font-medium mb-2'>Error</h4>
                  <p className='text-sm'>{executionResult.error}</p>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Variable Extraction Section - Only show if not hidden by parent */}
        {!hideResponseExplorer &&
          executionResult &&
          executionResult.response && (
            <div className='border-t border-gray-200 p-6'>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>
                Extract Variables from Response
              </h3>
              <ResponseExplorer
                response={executionResult.response}
                onExtractVariable={handleExtractVariable}
                extractedVariables={extractedVariables}
                existingExtractions={request.extractVariables}
                onRemoveExtraction={handleRemoveExtraction}
                handleCopy={handleCopy}
                copied={copied}
                chainId={chainId || requestChainId || ''}
              />
            </div>
          )}
      </div>
    );
  }
  return (
    <div className='flex flex-col h-full'>
      <VariableAutocomplete />

      {/* Request Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Code className='w-5 h-5' />
            Request Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Request Name</Label>
              <Input
                value={request.name}
                onChange={(e) => {
                  hasManuallyEditedNameRef.current = true;
                  onUpdate({ name: e.target.value });
                }}
                placeholder='Enter request name'
              />
            </div>
            <div className='space-y-2'>
              <Label>Method</Label>
              <Select
                value={request.method}
                onValueChange={(value) =>
                  onUpdate({ method: value as APIRequest['method'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='GET'>GET</SelectItem>
                  <SelectItem value='POST'>POST</SelectItem>
                  <SelectItem value='PUT'>PUT</SelectItem>
                  <SelectItem value='DELETE'>DELETE</SelectItem>
                  <SelectItem value='PATCH'>PATCH</SelectItem>
                  <SelectItem value='HEAD'>HEAD</SelectItem>
                  <SelectItem value='OPTIONS'>OPTIONS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className='space-y-2'>
            <Label>URL</Label>
            <Input
              name='url'
              value={url}
              onChange={(e) => handleInputChange(e, setUrl)}
              onKeyUp={(e) => handleAutocomplete(e)}
              placeholder='https://api.example.com/endpoint'
            />
          </div>
          {/* Enhanced URL Preview */}
          <div className='flex items-start space-x-2 mt-2 text-sm'>
            <span className='text-gray-600 dark:text-gray-400 font-medium'>
              Final URL Preview:
            </span>
            <div className='flex-1'>{renderEnhancedPreviewUrl()}</div>
          </div>

          {/* Dynamic Variables Panel - Now only shows used variables */}
          <DynamicVariablesPanel />

          {/* Show available variables for debugging */}
          {Object.keys(parentExtractedVariables).length > 0 && (
            <div className='mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm'>
              <strong>Available Variables:</strong>{' '}
              {Object.keys(parentExtractedVariables)
                .map((name) => `{{${name}}}`)
                .join(', ')}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Main Tabs */}
      {/* Show processed values for debugging */}
      {showVariablePreview() && (
        <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
          <h4 className='text-sm font-medium text-blue-900 mb-2'>
            Variable Substitution Preview:
          </h4>
          <div className='space-y-2 text-xs'>
            {(processedRequest.authToken !== request.authToken ||
              processedRequest.authorization?.token !==
                request.authorization?.token) && (
              <div>
                <span className='font-medium'>Auth Token:</span>
                <div className='font-mono bg-white p-1 rounded border'>
                  <span className='text-gray-500'>
                    {request.authorization?.token || request.authToken}
                  </span>{' '}
                  →
                  <span className='text-blue-600 ml-1'>
                    {processedRequest.authorization?.token ||
                      processedRequest.authToken}
                  </span>
                </div>
              </div>
            )}
            {processedRequest.url !== request.url && (
              <div>
                <span className='font-medium'>URL:</span>
                <div className='font-mono bg-white p-1 rounded border'>
                  <span className='text-gray-500'>{request.url}</span> →
                  <span className='text-blue-600 ml-1'>
                    {processedRequest.url}
                  </span>
                </div>
              </div>
            )}
            {processedRequest.body !== request.body &&
              processedRequest.body && (
                <div>
                  <span className='font-medium'>Body:</span>
                  <div className='font-mono bg-white p-1 rounded border max-h-20 overflow-y-auto'>
                    <pre className='text-blue-600'>{processedRequest.body}</pre>
                  </div>
                </div>
              )}
          </div>
        </div>
      )}
      <Tabs defaultValue='params' className='w-full'>
        <TabsList className='grid w-full grid-cols-7'>
          <TabsTrigger value='params' className='gap-2'>
            <Globe className='w-4 h-4' />
            Params
          </TabsTrigger>
          <TabsTrigger value='headers' className='gap-2'>
            <Code className='w-4 h-4' />
            Headers
          </TabsTrigger>
          <TabsTrigger value='body' className='gap-2'>
            <Code className='w-4 h-4' />
            Body
          </TabsTrigger>
          <TabsTrigger value='auth' className='gap-2'>
            <Key className='w-4 h-4' />
            Auth
          </TabsTrigger>
          <TabsTrigger value='tests' className='gap-2'>
            <TestTube className='w-4 h-4' />
            Tests
          </TabsTrigger>
          <TabsTrigger value='settings' className='gap-2'>
            <Settings className='w-4 h-4' />
            Settings
          </TabsTrigger>
          <TabsTrigger value='conditional' className='gap-2'>
            <GitBranch className='w-4 h-4' />
            Conditional
          </TabsTrigger>
        </TabsList>
        <TabsContent value='params' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Query Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Ensure temp IDs are used for display but not persisted */}
              <KeyValueTable
                type='params'
                items={params.map((param) => ({
                  ...param,
                  id: param.id ?? `temp_${crypto.randomUUID()}`,
                }))}
                addButtonText='Add Param'
                emptyStateText="No params added. Click 'Add Param' to get started."
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value='headers' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Headers</CardTitle>
            </CardHeader>
            <CardContent>
              <KeyValueTable
                type='headers'
                items={headers.map((h) => ({
                  ...h,
                  id: h.id ?? `temp_${crypto.randomUUID()}`,
                }))}
                addButtonText='Add Header'
                emptyStateText="No headers added. Click 'Add Header' to get started."
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value='body' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Request Body</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center space-x-4'>
                <Label>Body Type:</Label>
                <Select
                  value={request.bodyType || 'none'}
                  onValueChange={(value) =>
                    onUpdate({ bodyType: value as any })
                  }
                >
                  <SelectTrigger className='w-40'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='none'>None</SelectItem>
                    <SelectItem value='json'>JSON</SelectItem>
                    <SelectItem value='form'>Form Data</SelectItem>
                    <SelectItem value='raw'>Raw</SelectItem>
                    <SelectItem value='binary'>Binary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {request.bodyType !== 'none' && (
                <div className='space-y-2'>
                  <Label>Body Content</Label>
                  <Textarea
                    name='body'
                    value={body}
                    onChange={(e) => handleInputChange(e, setBody)}
                    onKeyUp={(e) => handleAutocomplete(e)}
                    placeholder={
                      request.bodyType === 'json'
                        ? '{\n  "key": "value",\n  "array": [1, 2, 3]\n}'
                        : 'Enter request body'
                    }
                    rows={10}
                    className='font-mono'
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value='auth' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center space-x-4'>
                <Label>Auth Type:</Label>
                <Select
                  value={request.authorizationType || 'none'}
                  onValueChange={(value) =>
                    onUpdate({ authorizationType: value as any })
                  }
                >
                  <SelectTrigger className='w-40'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='none'>No Auth</SelectItem>
                    <SelectItem value='bearer'>Bearer Token</SelectItem>
                    <SelectItem value='basic'>Basic Auth</SelectItem>
                    <SelectItem value='apikey'>API Key</SelectItem>
                    <SelectItem value='oauth1'>OAuth 1.0</SelectItem>
                    <SelectItem value='oauth2'>OAuth 2.0</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {request.authorizationType === 'bearer' && (
                <div className='space-y-2'>
                  <Label>Bearer Token</Label>
                  <Input
                    name='auth-token'
                    value={auth.token}
                    onChange={(e) =>
                      handleInputChange(e, (value) =>
                        setAuth((prev) => ({ ...prev, token: value }))
                      )
                    }
                    onKeyUp={(e) => handleAutocomplete(e)}
                    placeholder='Enter bearer token'
                  />
                </div>
              )}
              {request.authorizationType === 'basic' && (
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Username</Label>
                    <Input
                      name='auth-username'
                      value={auth.username}
                      onChange={(e) =>
                        handleInputChange(e, (value) =>
                          setAuth((prev) => ({ ...prev, username: value }))
                        )
                      }
                      onKeyUp={(e) => handleAutocomplete(e)}
                      placeholder='Username'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Password</Label>
                    <Input
                      name='auth-password'
                      type='password'
                      value={auth.password}
                      onChange={(e) =>
                        handleInputChange(e, (value) =>
                          setAuth((prev) => ({ ...prev, password: value }))
                        )
                      }
                      onKeyUp={(e) => handleAutocomplete(e)}
                      placeholder='Password'
                    />
                  </div>
                </div>
              )}
              {request.authorizationType === 'apikey' && (
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>API Key Name</Label>
                    <Input
                      value={request.authApiKey || ''}
                      onChange={(e) => onUpdate({ authApiKey: e.target.value })}
                      placeholder='X-API-Key'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>API Key Value</Label>
                    <Input
                      value={request.authApiValue || ''}
                      onChange={(e) =>
                        onUpdate({ authApiValue: e.target.value })
                      }
                      placeholder='Your API Key'
                    />
                  </div>
                  <div className='col-span-2 space-y-2'>
                    <Label>Add to</Label>
                    <Select
                      value={request.authApiLocation || 'header'}
                      onValueChange={(value) =>
                        onUpdate({ authApiLocation: value as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='header'>Header</SelectItem>
                        <SelectItem value='query'>Query Params</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value='tests' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Test Scripts</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label>Pre-request Script</Label>
                <Textarea
                  placeholder='// This script will be executed before the request'
                  rows={6}
                  className='font-mono'
                />
              </div>
              <div className='space-y-2'>
                <Label>Test Script</Label>
                <Textarea
                  placeholder='// Write your test assertions here'
                  rows={8}
                  className='font-mono'
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value='settings' className='space-y-6'>
          <div>
            <h3 className='text-lg font-semibold mb-4'>Request Settings</h3>
            <div className='grid grid-cols-2 gap-6 mb-6'>
              <div className='space-y-2'>
                <Label htmlFor='timeout'>Timeout (ms)</Label>
                <Input
                  id='timeout'
                  type='number'
                  value={request.timeout}
                  onChange={(e) =>
                    onUpdate({ timeout: Number.parseInt(e.target.value) })
                  }
                  placeholder='5000'
                />
              </div>

              {/* Retries disabled + upcoming */}
              <div className='space-y-2 opacity-60'>
                <Label htmlFor='retries'>Retries</Label>
                <Input
                  id='retries'
                  type='number'
                  value={request.retries}
                  disabled
                />
                <p className='text-xs text-gray-500 italic'>Upcoming</p>
              </div>
            </div>

            <div className='space-y-4 p-4 border border-orange-200 bg-orange-50 rounded-lg'>
              <div className='flex items-center gap-2 text-orange-600'>
                <TriangleAlert className='w-4 h-4' />
                <Label className='text-orange-700 font-medium'>
                  Error Handling
                </Label>
              </div>
              <RadioGroup
                value={request.errorHandling || 'continue'}
                onValueChange={(value) =>
                  onUpdate({ errorHandling: value as any })
                }
                className='space-y-3'
              >
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='stop' id='stop' />
                  <Label htmlFor='stop' className='text-orange-700'>
                    Stop chain on failure
                  </Label>
                </div>

                {/* Continue disabled + upcoming */}
                <div className='flex items-center space-x-2 opacity-60'>
                  <RadioGroupItem value='continue' id='continue' disabled />
                  <Label htmlFor='continue' className='text-orange-700'>
                    Continue to next step{' '}
                    <span className='text-xs italic text-gray-500'>
                      (Upcoming)
                    </span>
                  </Label>
                </div>

                {/* Retry disabled + upcoming */}
                <div className='flex items-center space-x-2 opacity-60'>
                  <RadioGroupItem value='retry' id='retry' disabled />
                  <Label htmlFor='retry' className='text-orange-700'>
                    Retry with backoff{' '}
                    <span className='text-xs italic text-gray-500'>
                      (Upcoming)
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className='flex items-center space-x-2'>
              <Switch
                checked={request.enabled}
                onCheckedChange={(checked) => onUpdate({ enabled: checked })}
              />
              <Label>Enable this request</Label>
            </div>
          </div>
        </TabsContent>
        <TabsContent value='conditional' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Conditional Logic</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label>Run this request only if:</Label>
                <Textarea
                  placeholder='// JavaScript condition that returns true/false// Example: response.status === 200 && response.data.success'
                  rows={4}
                  className='font-mono'
                />
              </div>
              <div className='space-y-2'>
                <Label>Variable Conditions</Label>
                <div className='text-sm text-muted-foreground'>
                  Set conditions based on extracted variables from previous
                  requests
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {onSave && (
        <div className='flex justify-end'>
          <Button onClick={onSave} className='gap-2'>
            <Settings className='w-4 h-4' />
            {chainId ? 'Update Service' : 'Save Request'}
          </Button>
        </div>
      )}
    </div>
  );
}
