'use client';
import { useEffect, useState, useRef, useMemo } from 'react';
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
  Settings,
  TriangleAlert,
  Play,
  Copy,
  AlertTriangle,
  FileText,
  Shuffle,
  HelpCircle,
  CheckCircle,
} from 'lucide-react';
import type {
  APIRequest,
  DataExtraction,
  ExecutionLog,
  TestScript,
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
  mapDynamicToStatic,
  getVariablesByPrefix,
  detectAutocompletePrefix,
  calculateAutocompletePosition,
  type DynamicVariableOverride,
  type AutocompleteState,
  parseUrlParams,
  buildUrlWithParams,
  generateDynamicValueById,
  hasResponseChanged,
} from '@/lib/request-utils';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/mode/javascript/javascript';
import './../RequestBuilder/RequestEditor/whiteorange.css';
import { generateAssertions } from '@/utils/assertionGenerator';
import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from '../ui/tooltip';
import { VariableHelpDialog } from './HelpTextDialougs/variablesUseDialogues';
import RequestBody from '@/components/Shared/RequestTabs/RequestBody';
import type { KeyValuePairWithFile } from '../ui/KeyValueEditorWithFileUpload';
import { PrePostRequest } from '../Shared/RequestTabs/PrePostRequest';

type FormField = {
  id: string;
  key: string;
  value: string;
  type: 'text' | 'file';
  fileName?: string;
};

type KeyValueField = {
  id: string;
  key: string;
  value: string;
};

interface Variable {
  id: string;
  name: string;
  value: string;
  initialValue?: string;
  type: 'string' | 'number' | 'boolean';
  description?: string;
  environmentId?: string;
  currentValue?: string;
}

interface RequestEditorProps {
  request: Partial<APIRequest>;
  onUpdate: (updates: Partial<APIRequest>) => void;
  onSave?: () => void;
  compact?: boolean;
  showBody?: boolean;
  chainName?: string;
  chainDescription?: string;
  chainEnabled?: boolean;
  environmentBaseUrl?: string;
  requestChainId?: string | undefined;
  chainId?: string;
  hideResponseExplorer?: boolean;
  onRequestExecution?: (executionLog: ExecutionLog) => void;
  extractedVariables?: Record<string, any>;
  chainVariables?: any[];
  dynamicVariableOverrides?: DynamicVariableOverride[];
  onRegenerateDynamicVariable?: (variableName: string) => void;
  requestAssertions?: any[];
  onAssertionsUpdate?: (assertions: any[]) => void;
}

interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

interface SelectedVariable {
  name: string;
  path?: string;
}

export function RequestEditor({
  request: initialRequest,
  onUpdate,
  onSave,
  compact = false,
  showBody = true,
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
  dynamicVariableOverrides,
  onRegenerateDynamicVariable,
  requestAssertions,
  onAssertionsUpdate,
}: RequestEditorProps) {
  const isSyncingRef = useRef(false);
  const isInitialMount = useRef(true);
  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<
    | 'params'
    | 'headers'
    | 'pre-request'
    | 'post-response'
    | 'body'
    | 'auth'
    | 'settings'
  >('params');

  const [assertions, setAssertions] = useState<any[]>([]);

  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionLog | null>(
    null
  );

  const [showVariablesPopup, setShowVariablesPopup] = useState(false);
  const variablesPopupRef = useRef<HTMLDivElement>(null);

  const [searchText, setSearchText] = useState('');

  const { variables: storeVariables, dynamicVariables } =
    useDataManagementStore();

  const [dynamicOverrides, setDynamicOverrides] = useState<
    DynamicVariableOverride[]
  >([]);

  useEffect(() => {
    if (dynamicVariableOverrides && dynamicVariableOverrides.length > 0) {
      setDynamicOverrides(dynamicVariableOverrides);
    } else if (dynamicVariables.length > 0 && dynamicOverrides.length === 0) {
      const initialOverrides: DynamicVariableOverride[] = dynamicVariables.map(
        (d) => {
          const generated = generateDynamicValueById(
            d.generatorId,
            d.parameters
          );
          return {
            name: d.name,
            value: String(generated),
          };
        }
      );
      setDynamicOverrides(initialOverrides);
    }
  }, [
    dynamicVariables.length,
    dynamicOverrides.length,
    dynamicVariableOverrides,
  ]);

  const [showDynamicEditor, setShowDynamicEditor] = useState(false);

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

  const [url, setUrl] = useState(initialRequest.url || '');
  const [body, setBody] = useState(initialRequest.body || '');

  console.log('body123:', body);

  const [selectedVariable, setSelectedVariable] = useState<SelectedVariable[]>(
    []
  );
  console.log('selectedVariable:', selectedVariable);

  const [headers, setHeaders] = useState<KeyValuePair[]>(
    initialRequest.headers || []
  );
  const [params, setParams] = useState<KeyValuePair[]>(
    initialRequest.params || []
  );
  const [auth, setAuth] = useState({
    username: initialRequest.authUsername || '',
    password: initialRequest.authPassword || '',
    token:
      initialRequest.authToken || initialRequest.authorization?.token || '',
  });

  const [bodyType, setBodyType] = useState<any>(
    initialRequest.bodyType || 'none'
  );
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [urlEncodedFields, setUrlEncodedFields] = useState<KeyValueField[]>([]);

  useEffect(() => {
    if (!isSyncingRef.current) {
      onUpdate({ url });
    }
  }, [url]);

  useEffect(() => {
    if (!isSyncingRef.current) {
      onUpdate({ body });
    }
  }, [body]);

  useEffect(() => {
    if (!isSyncingRef.current) {
      onUpdate({ headers });
    }
  }, [headers]);

  useEffect(() => {
    if (!isSyncingRef.current) {
      onUpdate({ params });
    }
  }, [params]);

  useEffect(() => {
    onUpdate({
      authUsername: auth.username,
      authPassword: auth.password,
      authToken: auth.token,
    });
  }, [auth]);

  useEffect(() => {
    setUrl(initialRequest.url || '');
    setBody(initialRequest.body || '');

    const requestHeaders = initialRequest.headers || [];
    const hasContentType = requestHeaders.some(
      (h) => h.key.toLowerCase() === 'content-type'
    );

    if (!hasContentType) {
      setHeaders([
        ...requestHeaders,
        { key: 'Content-Type', value: 'application/json', enabled: true },
      ]);
    } else {
      setHeaders(requestHeaders);
    }

    setParams(initialRequest.params || []);
    setAuth({
      username: initialRequest.authUsername || '',
      password: initialRequest.authPassword || '',
      token:
        initialRequest.authToken || initialRequest.authorization?.token || '',
    });

    const requestBodyType = initialRequest.bodyType || 'none';
    setBodyType(requestBodyType);

    if (requestBodyType === 'form-data') {
      if (
        initialRequest.bodyFormData &&
        Array.isArray(initialRequest.bodyFormData)
      ) {
        setFormFields(
          initialRequest.bodyFormData.map((field) => ({
            id: field.id || `temp_${Date.now()}_${Math.random()}`,
            key: field.key || '',
            value: field.value || '',
            type: field.type || 'text',
            fileName: field.fileName,
            enabled: field.enabled !== false,
          }))
        );
      } else if (initialRequest.body) {
        try {
          const parsed = JSON.parse(initialRequest.body);
          if (Array.isArray(parsed)) {
            setFormFields(
              parsed.map((field) => ({
                ...field,
                id: field.id || `temp_${Date.now()}_${Math.random()}`,
              }))
            );
          } else {
            setFormFields([]);
          }
        } catch (e) {
          console.error(
            'Failed to parse form fields from initial request body:',
            e
          );
          setFormFields([]);
        }
      } else {
        setFormFields([]);
      }
    } else if (requestBodyType === 'urlencoded') {
      if (
        initialRequest.bodyFormData &&
        Array.isArray(initialRequest.bodyFormData)
      ) {
        setUrlEncodedFields(
          initialRequest.bodyFormData.map((field) => ({
            id: field.id || `temp_${Date.now()}_${Math.random()}`,
            key: field.key || '',
            value: field.value || '',
          }))
        );
      } else if (initialRequest.body) {
        try {
          const parsed = JSON.parse(initialRequest.body);
          if (Array.isArray(parsed)) {
            setUrlEncodedFields(
              parsed.map((field) => ({
                ...field,
                id: field.id || `temp_${Date.now()}_${Math.random()}`,
              }))
            );
          } else {
            setUrlEncodedFields([]);
          }
        } catch (e) {
          console.error(
            'Failed to parse URL-encoded fields from initial request body:',
            e
          );
          setUrlEncodedFields([]);
        }
      } else {
        setUrlEncodedFields([]);
      }
    } else if (requestBodyType === 'raw' && initialRequest.body) {
      setBody(initialRequest.body);
    } else {
      setBody('');
    }
  }, [initialRequest.id]);

  useEffect(() => {
    if (isSyncingRef.current || !url.includes('?')) return;

    isSyncingRef.current = true;
    const parsedParams = parseUrlParams(url);
    if (parsedParams.length > 0) {
      setParams(parsedParams);
    }
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 0);
  }, [url]);

  const dynamicStructured = useMemo(
    () => mapDynamicToStatic(dynamicVariables, dynamicOverrides),
    [dynamicVariables, dynamicOverrides]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        variablesPopupRef.current &&
        !variablesPopupRef.current.contains(event.target as Node)
      ) {
        setShowVariablesPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isSyncingRef.current || isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    isSyncingRef.current = true;
    const newUrl = buildUrlWithParams(url, params);
    if (newUrl !== url) {
      setUrl(newUrl);
    }
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 100);
  }, [params]);

  const handleAssertionsUpdate = (newAssertions: any[]) => {
    console.log('RequestEditor handleAssertionsUpdate:', {
      requestId: initialRequest.id,
      assertionsCount: newAssertions.length,
      assertions: newAssertions.slice(0, 3),
    });

    setAssertions(newAssertions);

    if (initialRequest.id) {
      try {
        const raw = localStorage.getItem('lastExecutionByRequest');
        const map = raw ? JSON.parse(raw) : {};

        if (!map[initialRequest.id]) {
          map[initialRequest.id] = {};
        }

        map[initialRequest.id].assertions = newAssertions;
        localStorage.setItem('lastExecutionByRequest', JSON.stringify(map));

        console.log('Persisted assertions to localStorage:', {
          requestId: initialRequest.id,
          count: newAssertions.length,
        });
      } catch (e) {
        console.error('Failed to persist assertions:', e);
      }
    }

    if (onAssertionsUpdate) {
      console.log('Calling parent onAssertionsUpdate callback');
      onAssertionsUpdate(newAssertions);
    } else {
      console.warn('No onAssertionsUpdate callback provided');
    }
  };

  useEffect(() => {
    if (assertions.length > 0 && initialRequest.id) {
      try {
        const raw = localStorage.getItem('lastExecutionByRequest');
        const map = raw ? JSON.parse(raw) : {};

        if (!map[initialRequest.id]) {
          map[initialRequest.id] = {};
        }

        map[initialRequest.id].assertions = assertions;
        localStorage.setItem('lastExecutionByRequest', JSON.stringify(map));

        console.log('Auto-persisted assertions to localStorage:', {
          requestId: initialRequest.id,
          count: assertions.length,
          enabled: assertions.filter((a) => a.enabled).length,
        });
      } catch (e) {
        console.error('Failed to auto-persist assertions:', e);
      }
    }
  }, [assertions, initialRequest.id]);

  const usedDynamicVariables = useMemo(() => {
    const allTextFields = [
      initialRequest.url || '',
      initialRequest.body || '',
      initialRequest.authToken || '',
      initialRequest.authUsername || '',
      initialRequest.authPassword || '',
      initialRequest.authApiKey || '',
      initialRequest.authApiValue || '',
      initialRequest.authorization?.token || '',
      initialRequest.authorization?.username || '',
      initialRequest.authorization?.password || '',
      initialRequest.authorization?.key || '',
      initialRequest.authorization?.value || '',
      ...(initialRequest.headers || []).map((h) => `${h.key} ${h.value}`),
      ...(initialRequest.params || []).map((p) => `${p.key} ${p.value}`),
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
  }, [
    initialRequest.url,
    initialRequest.body,
    initialRequest.headers,
    initialRequest.params,
    initialRequest.authToken,
    initialRequest.authUsername,
    initialRequest.authPassword,
    initialRequest.authApiKey,
    initialRequest.authApiValue,
    initialRequest.authorization,
    dynamicStructured,
  ]);

  const [showResponse, setShowResponse] = useState(false);
  const [extractedVariables, setExtractedVariables] = useState<
    Record<string, any>
  >(parentExtractedVariables);
  const { activeEnvironment } = useDataManagement();

  console.log('extractedVariables123:', extractedVariables);

  const [previewUrl, setPreviewUrl] = useState('');
  const [previousExtractions, setPreviousExtractions] = useState<
    DataExtraction[]
  >([]);
  const [responseTab, setResponseTab] = useState<
    'body' | 'cookies' | 'headers' | 'test-results'
  >('body');
  const { toast } = useToast();

  const [processedRequest, setProcessedRequest] =
    useState<APIRequest>(initialRequest);

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
        currentValue: String(value),
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

  const getVariablesByPrefixLocal = (prefix: 'D_' | 'S_'): Variable[] => {
    const allVars = getAllAvailableVariables();
    return getVariablesByPrefix(allVars, prefix);
  };

  useEffect(() => {
    const allVariables = getAllAvailableVariables();
    setPreviewUrl(getPreviewUrl(allVariables));
  }, [
    storeVariables,
    dynamicVariables,
    dynamicOverrides,
    activeEnvironment,
    initialRequest.url,
    parentExtractedVariables,
    chainVariables,
  ]);

  React.useEffect(() => {
    if (hideResponseExplorer) return;

    try {
      const raw = localStorage.getItem('lastExecutionByRequest');
      if (!raw) return;
      const map: Record<string, any> = JSON.parse(raw);
      const saved = map?.[initialRequest.id];

      const isRecent =
        saved?.endTime &&
        Date.now() - new Date(saved.endTime).getTime() < 3600000;

      if ((saved?.response || saved?.error) && isRecent) {
        setExecutionResult(saved);
        setShowResponse(true);

        if (saved.assertions && Array.isArray(saved.assertions)) {
          setAssertions(saved.assertions);
          if (onAssertionsUpdate) {
            onAssertionsUpdate(saved.assertions);
          }
        }

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
        delete map[initialRequest.id];
        localStorage.setItem('lastExecutionByRequest', JSON.stringify(map));
      }
    } catch (e) {
      console.error('Failed to restore lastExecutionByRequest:', e);
    }
  }, [initialRequest.id, hideResponseExplorer]);

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
    request: Partial<APIRequest>,
    variables: Variable[]
  ): Partial<APIRequest> => {
    console.log(
      '[v0] processRequestWithVariables - selectedVariable:',
      selectedVariable
    );
    console.log('[v0] processRequestWithVariables - variables:', variables);

    let processedBody = request.body || '';
    let processedBodyRawContent = request.bodyRawContent || '';

    // If we have selected variables with paths, substitute them in the JSON body
    if (
      selectedVariable &&
      selectedVariable.length > 0 &&
      (processedBody || processedBodyRawContent)
    ) {
      const bodyContent = processedBodyRawContent || processedBody;
      try {
        const parsedBody = JSON.parse(bodyContent);
        selectedVariable.forEach((varItem) => {
          const variable = variables.find((v) => v.name === varItem.name);
          if (variable && varItem.path) {
            // Set the value at the specified path
            parsedBody[varItem.path] = variable.value || variable.initialValue;
          }
        });
        processedBody = JSON.stringify(parsedBody, null, 2);
        processedBodyRawContent = JSON.stringify(parsedBody, null, 2);
      } catch {
        // If JSON parsing fails, fall back to regex replacement
        selectedVariable.forEach((varItem) => {
          const variable = variables.find((v) => v.name === varItem.name);
          if (variable) {
            const regex = new RegExp(`{{${variable.name}}}`, 'g');
            processedBody = processedBody.replace(
              regex,
              variable.value || variable.initialValue || ''
            );
            processedBodyRawContent = processedBodyRawContent.replace(
              regex,
              variable.value || variable.initialValue || ''
            );
          }
        });
      }
    } else {
      // Standard variable replacement with {{variableName}} syntax
      processedBody = replaceVariables(processedBody, variables);
      processedBodyRawContent = replaceVariables(
        processedBodyRawContent,
        variables
      );
    }

    return {
      ...request,
      url: replaceVariables(request.url, variables),
      body: processedBody,
      bodyRawContent: processedBodyRawContent,
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

    updateState(value);

    const prefix = detectAutocompletePrefix(value, cursorPosition);

    if (prefix) {
      const suggestions = getVariablesByPrefixLocal(prefix);

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

    const beforePrefix = currentValue.substring(0, cursorPos - 2);
    const afterCursor = currentValue.substring(cursorPos);
    const newValue = beforePrefix + variable.name + afterCursor;

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
      input.value = newValue;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const newCursorPos = beforePrefix.length + variable.name.length;
    setTimeout(() => {
      input.setSelectionRange(newCursorPos, newCursorPos);
      input.focus();
    }, 0);

    setAutocompleteState((prev) => ({ ...prev, show: false }));
  };

  const handleJsonVariableSelect = (variables: SelectedVariable[]) => {
    console.log('[v0] handleJsonVariableSelect called with:', variables);
    console.log('[v0] Current selectedVariable state:', selectedVariable);
    setSelectedVariable(variables);
    console.log('[v0] Updated selectedVariable to:', variables);
    if (initialRequest.id) {
      onUpdate({ variable: variables });
    }
  };

  const handleAutocomplete = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const input = e.target as HTMLInputElement | HTMLTextAreaElement;
    const value = input.value;
    const cursorPosition = input.selectionStart || 0;

    const prefix = detectAutocompletePrefix(value, cursorPosition);

    if (prefix) {
      const suggestions = getVariablesByPrefixLocal(prefix);

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
      } else {
        setAutocompleteState((prev) => ({ ...prev, show: false }));
      }
    } else {
      setAutocompleteState((prev) => ({ ...prev, show: false }));
    }
  };

  React.useEffect(() => {
    const allVariables = getAllAvailableVariables();
    const processed = processRequestWithVariables(initialRequest, allVariables);
    setProcessedRequest(processed);
    setPreviewUrl(getPreviewUrl(allVariables));
  }, [
    storeVariables,
    dynamicVariables,
    dynamicOverrides,
    activeEnvironment,
    initialRequest,
    parentExtractedVariables,
    chainVariables,
    url,
    body,
    headers,
    params,
    auth,
  ]);

  const getPreviewUrl = (variables: Variable[]) => {
    const replacedUrl = replaceVariables(url, variables);
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
    if (!onRegenerateDynamicVariable) {
      setDynamicOverrides((prev) => {
        const existing = prev.find((o) => o.name === name);
        if (existing) {
          return prev.map((o) =>
            o.name === name ? { name, value: String(value) } : { ...o }
          );
        } else {
          return [...prev, { name, value: String(value) }];
        }
      });
    }
  };

  const regenerateDynamicVariable = (variableName: string) => {
    if (onRegenerateDynamicVariable) {
      onRegenerateDynamicVariable(variableName);
    } else {
      const dynamicVar = dynamicVariables.find((v) => v.name === variableName);

      if (!dynamicVar) return;

      const newValue = String(
        generateDynamicValueById(dynamicVar.generatorId, dynamicVar.parameters)
      );
      updateDynamicOverride(variableName, newValue);
    }
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
    const safeRequest: any = {
      ...initialRequest,
      extractVariables: initialRequest.extractVariables ?? [],
      headers: initialRequest.headers ?? [],
      params: initialRequest.params ?? [],
      url: url,
      body: body,
      authToken: auth.token,
      authUsername: auth.username,
      authPassword: auth.password,
      authorization: initialRequest.authorization,
      bodyType: bodyType,
    };

    if (bodyType === 'form-data') {
      const formDataArray = formFields.map((field) => ({
        key: field.key,
        value: field.value,
        enabled: field.enabled !== false,
        type: field.type,
      }));
      safeRequest.bodyFormData = formDataArray;
      safeRequest.body = '';
      safeRequest.bodyRawContent = '';
    } else if (bodyType === 'urlencoded') {
      const urlEncodedArray = urlEncodedFields.map((field) => ({
        key: field.key,
        value: field.value,
        enabled: true,
      }));
      safeRequest.body = JSON.stringify(urlEncodedFields);
      safeRequest.bodyFormData = urlEncodedArray;
      safeRequest.bodyRawContent = '';
    } else if (bodyType === 'raw' || bodyType === 'json') {
      safeRequest.body = body;
      safeRequest.bodyFormData = null;
      safeRequest.bodyRawContent = body;
    } else {
      safeRequest.bodyFormData = null;
      safeRequest.bodyRawContent = '';
    }

    {
      const token = (
        safeRequest.authToken ||
        safeRequest.authorization?.token ||
        ''
      ).trim();
      if (token) {
        (safeRequest as any).authorizationType = 'bearer';
        (safeRequest as any).authorization = {
          ...(safeRequest.authorization || {}),
          token,
        };

        const headers = Array.isArray(safeRequest.headers)
          ? [...safeRequest.headers]
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
        (safeRequest as any).headers = headers;
      } else {
        (safeRequest as any).authorizationType = 'none';
        (safeRequest as any).authorization = {};
      }
    }

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
      (safeRequest as any).headers = (safeRequest.headers ?? []).filter(
        (h) => h.key?.trim() && h.value?.trim()
      );

      const processedRequest = processRequestWithVariables(
        safeRequest,
        allVariables
      );

      const payload = buildRequestPayload(processedRequest, allVariables);

      const previewUrl = getPreviewUrl(allVariables);
      payload.request.url = previewUrl;
      payload.assertions = assertions.filter((a) => a.enabled);

      const backendData = await executeRequest(payload);

      const assertionResult = backendData?.data?.assertionResults || [];
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

      const actualRequestHeaders = Object.fromEntries(
        processedRequest.headers.map((h) => [h.key, h.value])
      );
      const actualRequestUrl = previewUrl;
      const actualRequestBody = processedRequest.body ?? '';
      const actualRequestMethod = processedRequest.method;

      // Get previous execution log to compare responses
      let previousExecutionLog = null;
      try {
        const raw = localStorage.getItem('lastExecutionByRequest');
        if (raw) {
          const map = JSON.parse(raw);
          previousExecutionLog = map[initialRequest.id];
        }
      } catch (e) {
        console.error('Failed to read previous execution:', e);
      }

      // Check if response has changed or no assertions exist
      const responseChanged = hasResponseChanged(
        result,
        previousExecutionLog?.response
      );

      let finalAssertions = assertions;

      // Regenerate assertions if:
      // 1. No assertions exist, OR
      // 2. Response has changed significantly
      if (assertions.length === 0 || responseChanged) {
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
          formattedAssertionFormat
        );

        // If response changed and we have existing assertions, merge them intelligently
        if (responseChanged && assertions.length > 0) {
          console.log('⚠️ Response changed - regenerating assertions');

          // Keep custom user-modified assertions (those with custom descriptions)
          const customAssertions = assertions.filter(
            (assertion) => assertion.isCustom === true
          );

          // Merge custom assertions with new auto-generated ones
          finalAssertions = [...newAssertions, ...customAssertions];
        } else {
          finalAssertions = newAssertions;
        }

        setAssertions(finalAssertions);
        handleAssertionsUpdate(finalAssertions);

        console.log(
          responseChanged
            ? '🔄 Response changed - updated assertions'
            : '✨ Generated new assertions',
          {
            requestId: initialRequest.id,
            previousStatus: previousExecutionLog?.response?.status,
            currentStatus: result?.statusCode,
            assertionsCount: finalAssertions.length,
          }
        );
      }

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
        },
        extractedVariables: extractedData,
      };

      if (hideResponseExplorer) {
        setExecutionResult(log);
      }

      if (onRequestExecution) {
        onRequestExecution(log);
      }

      try {
        const raw = localStorage.getItem('lastExecutionByRequest');
        const map = raw ? JSON.parse(raw) : {};
        map[initialRequest.id] = {
          ...log,
          assertions: finalAssertions,
        };
        localStorage.setItem('lastExecutionByRequest', JSON.stringify(map));
      } catch (e) {
        console.error('Failed to persist lastExecutionByRequest:', e);
      }

      toast({
        title: 'Execution Complete',
        description: `Request completed with status ${result.statusCode}${
          responseChanged ? ' (Assertions updated due to response change)' : ''
        }`,
        variant: log.status === 'success' ? 'default' : 'destructive',
      });
    } catch (error) {
      const endTime = Date.now();

      const processedRequest = processRequestWithVariables(
        safeRequest,
        allVariables
      );

      const previewUrl = getPreviewUrl(allVariables);
      const actualRequestHeaders = Object.fromEntries(
        processedRequest.headers.map((h) => [h.key, h.value])
      );
      const actualRequestBody = processedRequest.body ?? '';

      const errorLog: ExecutionLog = {
        id: Date.now().toString(),
        chainId: 'current-chain',
        requestId: initialRequest.id,
        status: 'error',
        startTime: new Date().toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration: 0,
        request: {
          method: initialRequest.method,
          url: previewUrl,
          headers: actualRequestHeaders,
          body: actualRequestBody,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      if (hideResponseExplorer) {
        setExecutionResult(errorLog);
      }

      if (onRequestExecution) {
        onRequestExecution(errorLog);
      }

      try {
        const raw = localStorage.getItem('lastExecutionByRequest');
        const map = raw ? JSON.parse(raw) : {};
        map[initialRequest.id] = errorLog;
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

  const getBodyCount = () => {
    if (bodyType === 'none') return 0;
    if ((bodyType === 'raw' || bodyType === 'json') && body.trim() !== '')
      return 1;
    if (bodyType === 'form-data' && formFields.length > 0)
      return formFields.length;
    if (bodyType === 'urlencoded' && urlEncodedFields.length > 0)
      return urlEncodedFields.length;
    return 0;
  };

  const getAuthCount = () => {
    return auth.token.trim() !== '' ? 1 : 0;
  };

  const tabs = [
    {
      id: 'params',
      label: 'Params',
      count: params.filter((p) => p.enabled && p.key.trim() && p.value.trim())
        .length,
    },
    {
      id: 'headers',
      label: 'Headers',
      count: headers.filter((h) => h.enabled && h.key.trim() && h.value.trim())
        .length,
    },
    {
      id: 'body',
      label: 'Body',
      count: getBodyCount(),
    },
    {
      id: 'auth',
      label: 'Auth',
      count: getAuthCount(),
    },
    { id: 'pre-request', label: 'Pre-request', count: 0 },
    { id: 'post-response', label: 'Post-response', count: 0 },
    { id: 'settings', label: 'Settings' },
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
      console.error('Failed to format response body as JSON');
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

  const handleBodyTypeChange = (type: any) => {
    setBodyType(type);
    onUpdate({ bodyType: type });
  };

  const handleBodyContentChange = (content: string) => {
    setBody(content);
  };

  const handleBeautify = () => {
    try {
      const parsed = JSON.parse(body);
      const beautified = JSON.stringify(parsed, null, 2);
      setBody(beautified);
      onUpdate({ body: beautified });
    } catch (e) {
      console.error('Invalid JSON for beautification');
    }
  };

  const addFormField = () => {
    setFormFields([
      ...formFields,
      {
        id: `temp_${Date.now()}_${Math.random()}`,
        key: '',
        value: '',
        enabled: true,
        type: 'text',
      },
    ]);
    const updatedFields = [
      ...formFields,
      {
        id: `temp_${Date.now()}_${Math.random()}`,
        key: '',
        value: '',
        enabled: true,
        type: 'text',
      },
    ];
    onUpdate({
      bodyFormData: updatedFields,
      body: JSON.stringify(updatedFields),
    });
  };

  const handleAddFormField = () => {
    const newField: FormField = {
      id: `temp_${Date.now()}_${Math.random()}`,
      key: '',
      value: '',
      type: 'text',
    };
    const updatedFields = [...formFields, newField];
    setFormFields(updatedFields);

    onUpdate({
      bodyFormData: updatedFields,
      body: JSON.stringify(updatedFields),
    });
  };

  const addUrlEncodedField = () => {
    setUrlEncodedFields([
      ...urlEncodedFields,
      { id: Math.random().toString(), key: '', value: '' },
    ]);
  };

  const updateFormField = (
    index: number,
    field: keyof KeyValuePairWithFile,
    value: string | boolean | File | undefined
  ) => {
    const newFormFields = [...formFields];
    newFormFields[index] = { ...newFormFields[index], [field]: value };
    setFormFields(newFormFields);
    onUpdate({
      bodyFormData: newFormFields,
      body: JSON.stringify(newFormFields),
    });
  };

  const updateUrlEncodedField = (
    index: number,
    field: keyof KeyValueField,
    value: string
  ) => {
    const newUrlEncodedFields = [...urlEncodedFields];
    newUrlEncodedFields[index] = {
      ...newUrlEncodedFields[index],
      [field]: value,
    };
    setUrlEncodedFields(newUrlEncodedFields);
  };

  const removeUrlEncodedField = (index: number) => {
    setUrlEncodedFields(urlEncodedFields.filter((_, i) => i !== index));
  };

  const handleUpdateFormField = (id: string, field: Partial<FormField>) => {
    const updatedFields = formFields.map((f) =>
      f.id === id ? { ...f, ...field } : f
    );
    setFormFields(updatedFields);

    onUpdate({
      bodyFormData: updatedFields,
      body: JSON.stringify(updatedFields),
    });
  };

  const removeFormField = (index: number) => {
    const updatedFields = formFields.filter((_, i) => i !== index);
    setFormFields(updatedFields);
    onUpdate({
      bodyFormData: updatedFields,
      body: JSON.stringify(updatedFields),
    });
  };

  const handleRemoveFormField = (id: string) => {
    const updatedFields = formFields.filter((f) => f.id !== id);
    setFormFields(updatedFields);

    onUpdate({
      bodyFormData: updatedFields,
      body: JSON.stringify(updatedFields),
    });
  };

  const handleAddUrlEncodedField = () => {
    const newField: KeyValueField = {
      id: Math.random().toString(),
      key: '',
      value: '',
    };
    setUrlEncodedFields([...urlEncodedFields, newField]);
  };

  const handleUpdateUrlEncodedField = (
    id: string,
    field: Partial<KeyValueField>
  ) => {
    setUrlEncodedFields(
      urlEncodedFields.map((f) => (f.id === id ? { ...f, ...field } : f))
    );
  };

  const handleRemoveUrlEncodedField = (id: string) => {
    setUrlEncodedFields(urlEncodedFields.filter((f) => f.id !== id));
  };

  const handleExtractVariable = (extraction: DataExtraction) => {
    const normalizeString = (value?: string) => (value || '').trim();
    const normalizeBool = (value?: boolean) => !!value;
    const currentExtractions = initialRequest.extractVariables || [];

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
      url: initialRequest.url,
      method: initialRequest.method,
      requestName: initialRequest.name,
      bodyType: initialRequest.bodyType,
      bodyRawContent: initialRequest.body,
      authorizationType: initialRequest.authorizationType,
      authorization: {
        token: initialRequest.authToken,
        username: initialRequest.authUsername,
        password: initialRequest.authPassword,
        apiKey: initialRequest.authApiKey,
        apiValue: initialRequest.authApiValue,
        apiLocation: initialRequest.authApiLocation,
      },
      headers: initialRequest.headers,
      params: initialRequest.params,
      variables: initialRequest.variables || {},
      extractVariables: updatedExtractions,
      name: initialRequest.name,
      description: initialRequest.description,
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
        (req: any) =>
          req.url === initialRequest.url && req.method === initialRequest.method
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
          const existing = map[initialRequest.id] || {};
          map[initialRequest.id] = {
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
    const updatedExtractions = (initialRequest.extractVariables || []).filter(
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
      testScripts: [...(initialRequest.testScripts || []), newTest],
    });
  };

  const updateTest = (testId: string, updates: Partial<TestScript>) => {
    const updatedTests = (initialRequest.testScripts || []).map((test) =>
      test.id === testId ? { ...test, ...updates } : test
    );
    onUpdate({ testScripts: updatedTests });
  };

  const removeTest = (testId: string) => {
    onUpdate({
      testScripts: (initialRequest.testScripts || []).filter(
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
      processedRequest.authToken !== initialRequest.authToken ||
      processedRequest.authorization?.token !==
        initialRequest.authorization?.token ||
      processedRequest.body !== initialRequest.body ||
      processedRequest.url !== initialRequest.url ||
      JSON.stringify(processedRequest.headers) !==
        JSON.stringify(initialRequest.headers) ||
      JSON.stringify(processedRequest.params) !==
        JSON.stringify(initialRequest.params)
    );
  };

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
          <button
            onClick={() => setShowDynamicEditor((prev) => !prev)}
            className='text-sm text-purple-600 hover:underline'
          >
            {showDynamicEditor ? 'Hide Editor' : 'Edit Values'}
          </button>
        </div>

        {showDynamicEditor ? (
          <div className='space-y-3'>
            {usedDynamicVariables.map((variable) => {
              const currentOverride = dynamicOverrides.find(
                (o) => o.name === variable.name
              );
              const displayValue =
                currentOverride?.value ?? variable.value ?? '';
              return (
                <div key={variable.id} className='flex items-center gap-3'>
                  <div className='flex items-center gap-2 flex-1'>
                    <span className='text-xs font-mono text-purple-700 min-w-0'>{`{{${variable.name}}}`}</span>
                    <Input
                      value={String(displayValue)}
                      onChange={(e) => {
                        e.stopPropagation();
                        const newValue = e.target.value;
                        updateDynamicOverride(variable.name, newValue);
                      }}
                      className='h-8 text-sm'
                      placeholder='Enter value'
                      data-dynamic-variable={variable.name}
                    />
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => regenerateDynamicVariable(variable.name)}
                    className='h-8 w-8 p-0 text-purple-600 hover:bg-purple-100'
                    title='Regenerate value'
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
              const currentOverride = dynamicOverrides.find(
                (o) => o.name === variable.name
              );
              const displayValue =
                currentOverride?.value ?? variable.value ?? '';

              return (
                <div
                  key={variable.id}
                  className='flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded border border-purple-200'
                >
                  <span className='text-xs font-mono'>
                    {`{{${variable.name}}}`} = {String(displayValue)}
                  </span>
                  <button
                    onClick={() => regenerateDynamicVariable(variable.name)}
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
        className='fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto scrollbar-thin'
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

  useEffect(() => {
    if (isSyncingRef.current || !url.includes('?')) return;

    isSyncingRef.current = true;
    const parsedParams = parseUrlParams(url);
    if (parsedParams.length > 0) {
      setParams(parsedParams);
    }
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 100);
  }, [url]);
  useEffect(() => {
    if (isSyncingRef.current || isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    isSyncingRef.current = true;
    const newUrl = buildUrlWithParams(url, params);
    if (newUrl !== url) {
      setUrl(newUrl);
    }
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 100);
  }, [params]);

  useEffect(() => {
    if (requestAssertions && requestAssertions.length > 0) {
      console.log('calling request assertions:', requestAssertions);
      setAssertions(requestAssertions);
    }
  }, [requestAssertions]);

  const handleConfirmSubstitutions = () => {
    const allVariables = getAllAvailableVariables();
    const substitutedUrl = replaceVariables(url, allVariables);
    const substitutedBody = replaceVariables(body, allVariables);
    const substitutedHeaders = headers.map((h) => ({
      ...h,
      key: replaceVariables(h.key, allVariables),
      value: replaceVariables(h.value, allVariables),
    }));
    const substitutedParams = params.map((p) => ({
      ...p,
      key: replaceVariables(p.key, allVariables),
      value: replaceVariables(p.value, allVariables),
    }));

    setUrl(substitutedUrl);
    setBody(substitutedBody);
    setHeaders(substitutedHeaders);
    setParams(substitutedParams);
    toast({
      title: 'Variables Substituted',
      description:
        'All dynamic variables have been replaced with their current values.',
    });
  };

  const compactView = (
    <div className='space-y-4'>
      <VariableAutocomplete />

      <div className='flex items-center space-x-2'>
        <Select
          value={initialRequest.method}
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

      <div className='flex items-start space-x-2 mt-2 text-sm'>
        <span className='text-gray-600 dark:text-gray-400 font-medium'>
          Final URL Preview:
        </span>
        <div className='flex-1'>{renderEnhancedPreviewUrl()}</div>
      </div>

      <DynamicVariablesPanel />
      {Object.keys(parentExtractedVariables).length > 0 && (
        <div className='mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm'>
          <strong>Available Variables:</strong>{' '}
          {Object.keys(parentExtractedVariables)
            .map((name) => `{{${name}}}`)
            .join(', ')}
        </div>
      )}

      <div className='border-b border-gray-200'>
        <div className='flex items-center justify-between px-6 relative'>
          <nav className='flex space-x-6'>
            {tabs.map((tab) => {
              const count = tab.count ?? 0;
              const showBlueDot =
                ['auth', 'body'].includes(tab.id) && count > 0;
              const showCountBadge =
                !['auth', 'body', 'settings'].includes(tab.id) && count > 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`pt-4 pb-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-[#136fb0]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className='whitespace-nowrap'>{tab.label}</span>

                  {/* Blue dot for auth and body tabs when count > 0 */}
                  {showBlueDot && (
                    <span
                      className='inline-block w-1.5 h-1.5 rounded-full bg-[#136fb0]'
                      aria-label={`${count} item${count !== 1 ? 's' : ''}`}
                    />
                  )}

                  {/* Count badge for other tabs */}
                  {showCountBadge && (
                    <span className='ml-1 bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 text-xs'>
                      {count}
                    </span>
                  )}

                  {/* Legacy test scripts indicator */}
                  {tab.id === 'tests' &&
                    initialRequest.testScripts &&
                    initialRequest.testScripts.length > 0 && (
                      <span className='ml-1 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full'>
                        {initialRequest.testScripts.length}
                      </span>
                    )}
                </button>
              );
            })}
          </nav>

          <div className='relative'>
            {showVariablesPopup && (
              <div
                ref={variablesPopupRef}
                className='absolute right-0 top-10 bg-white shadow-lg rounded-lg z-50 w-80 border border-gray-200'
              >
                <div className='p-2 border-b'>
                  <input
                    type='text'
                    className='w-full px-3 py-1.5 rounded-md border border-gray-300
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
                    placeholder='Search variables...'
                    autoComplete='off'
                    autoCorrect='off'
                    spellCheck={false}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>

                <div className='max-h-60 overflow-y-auto scrollbar-thin'>
                  {getAllAvailableVariables()
                    .filter(
                      (item) =>
                        (item.name.startsWith('D_') ||
                          item.name.startsWith('S_')) &&
                        item.name
                          .toLowerCase()
                          .includes(searchText.toLowerCase())
                    )
                    .map((item) => (
                      <div
                        key={item.id}
                        className='w-full flex justify-between items-center px-3 py-2
                              text-sm border-b border-gray-100 hover:bg-blue-50 transition-colors'
                        onClick={() => setShowVariablesPopup(false)}
                      >
                        <span className='text-gray-800 font-mono'>
                          {item.name}
                        </span>

                        <div className='flex items-center space-x-2'>
                          <span className='text-gray-500 truncate max-w-[120px]'>
                            {item?.currentValue}
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(`{{${item.name}}}`);
                              setShowVariablesPopup(false);
                            }}
                            className='p-1 hover:text-blue-600 transition-colors'
                            title='Copy variable'
                          >
                            <Copy className='w-4 h-4' />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
            <div className='flex items-center gap-2'>
              <Button onClick={() => setShowVariablesPopup((prev) => !prev)}>
                Variables
              </Button>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle
                      size={16}
                      strokeWidth={1.5}
                      onClick={() => setHelpOpen(true)}
                      className='cursor-pointer'
                    />
                  </TooltipTrigger>
                  <TooltipContent>How to use variables</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      <VariableHelpDialog open={helpOpen} onOpenChange={setHelpOpen} />

      <div className='p-2'>
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

                  <button
                    onClick={() =>
                      updateParam(index, { enabled: !param.enabled })
                    }
                    className={`p-2 rounded-lg transition-colors ${
                      param.enabled
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                  ></button>
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
                  {processedRequest.headers?.[index]?.value !== header.value &&
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
                  ></button>
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

        {activeTab === 'body' && showBody && (
          <RequestBody
            bodyType={bodyType}
            bodyContent={body}
            formFields={formFields}
            urlEncodedFields={urlEncodedFields}
            variables={storeVariables || []}
            initialVariable={selectedVariable}
            showSubstituteButton={false}
            onBodyTypeChange={handleBodyTypeChange}
            onBodyContentChange={handleBodyContentChange}
            onBeautify={handleBeautify}
            onVariableSelect={handleJsonVariableSelect}
            onConfirmSubstitution={handleConfirmSubstitutions}
            onAddFormField={addFormField}
            onUpdateFormField={updateFormField}
            onRemoveFormField={removeFormField}
            onAddUrlEncodedField={addUrlEncodedField}
            onUpdateUrlEncodedField={updateUrlEncodedField}
            onRemoveUrlEncodedField={removeUrlEncodedField}
          />
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
                  value='bearer'
                  onChange={() => {}}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  disabled
                >
                  <option value='bearer'>Bearer Token</option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Bearer Token
                </label>
                <input
                  type='text'
                  name='auth-token'
                  autoComplete='off'
                  autoCorrect='off'
                  autoCapitalize='off'
                  spellCheck={false}
                  value={auth.token}
                  onChange={(e) =>
                    setAuth((prev) => ({ ...prev, token: e.target.value }))
                  }
                  onBlur={(e) =>
                    setAuth((prev) => ({
                      ...prev,
                      token: e.target.value.trim(),
                    }))
                  }
                  onKeyUp={(e) => handleAutocomplete(e)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='Enter bearer token or use {{tokenVariable}}'
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pre-request' && (
          <div className='space-y-4'>
            <PrePostRequest
              type='pre-request'
              assertions={assertions}
              setAssertions={setAssertions}
              responseData={executionResult?.response}
              showAssertions={true}
              selectedVariables={selectedVariable}
            />
          </div>
        )}

        {activeTab === 'post-response' && (
          <div className='space-y-4'>
            <PrePostRequest
              type='post-response'
              assertions={assertions}
              setAssertions={setAssertions}
              responseData={executionResult?.response}
              showAssertions={true}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold mb-4'>Request Settings</h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Timeout (ms)
                </label>
                <input
                  type='number'
                  value={initialRequest.timeout}
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

              <div className='opacity-60'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Retries
                </label>
                <input
                  type='number'
                  value={initialRequest.retries}
                  disabled
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed'
                />
                <p className='text-xs text-gray-500 italic mt-1'>Upcoming</p>
              </div>
            </div>

            <div className='p-4 border border-orange-200 bg-orange-50 rounded-lg'>
              <div className='flex items-center space-x-2 mb-3'>
                <AlertTriangle className='w-5 h-5 text-orange-600' />
                <h4 className='font-medium text-orange-900'>Error Handling</h4>
              </div>
              <div className='space-y-2'>
                <label className='flex items-center space-x-2'>
                  <input
                    type='radio'
                    name='errorHandling'
                    value='stop'
                    checked={initialRequest.errorHandling === 'stop'}
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
                      initialRequest.errorHandling === 'continue' ||
                      !initialRequest.errorHandling
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

                <label className='flex items-center space-x-2 opacity-60'>
                  <input
                    type='radio'
                    name='errorHandling'
                    value='retry'
                    checked={initialRequest.errorHandling === 'retry'}
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

      {showVariablePreview() && (
        <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
          <h4 className='text-sm font-medium text-blue-900 mb-2'>
            Variable Substitution Preview:
          </h4>
          <div className='space-y-2 text-xs'>
            {(processedRequest.authToken !== initialRequest.authToken ||
              processedRequest.authorization?.token !==
                initialRequest.authorization?.token) && (
              <div>
                <span className='font-medium'>Auth Token:</span>
                <div className='font-mono bg-white p-1 rounded border max-w-full overflow-hidden text-ellipsis whitespace-nowrap'>
                  <span className='text-gray-500'>
                    {initialRequest.authorization?.token ||
                      initialRequest.authToken}
                  </span>{' '}
                  →
                  <span className='text-blue-600 ml-1'>
                    {processedRequest.authorization?.token ||
                      processedRequest.authToken}
                  </span>
                </div>
              </div>
            )}
            {processedRequest.url !== initialRequest.url && (
              <div>
                <span className='font-medium'>URL:</span>
                <div className='font-mono bg-white p-1 rounded border'>
                  <span className='text-gray-500'>{initialRequest.url}</span> →
                  <span className='text-blue-600 ml-1'>
                    {processedRequest.url}
                  </span>
                </div>
              </div>
            )}
            {processedRequest.body !== initialRequest.body &&
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

      {hideResponseExplorer &&
        executionResult &&
        (executionResult.response || executionResult.error) && (
          <div className='border-t border-gray-200 p-2'>
            <ResponseExplorer
              response={executionResult.response}
              onExtractVariable={handleExtractVariable}
              extractedVariables={extractedVariables}
              existingExtractions={initialRequest.extractVariables}
              onRemoveExtraction={handleRemoveExtraction}
              handleCopy={handleCopy}
              copied={copied}
              chainId={chainId || requestChainId || ''}
              actualRequestUrl={executionResult.request.url}
              actualRequestHeaders={executionResult.request.headers}
              actualRequestBody={executionResult.request.body}
              actualRequestMethod={executionResult.request.method}
              executionStatus={executionResult.status}
              errorMessage={executionResult.error}
            />
          </div>
        )}
    </div>
  );

  if (compact) {
    return compactView;
  }

  return (
    <div className='flex flex-col h-full'>
      <VariableAutocomplete />

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
                value={initialRequest.name}
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
                value={initialRequest.method}
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
          <div className='flex items-start space-x-2 mt-2 text-sm'>
            <span className='text-gray-600 dark:text-gray-400 font-medium'>
              Final URL Preview:
            </span>
            <div className='flex-1'>{renderEnhancedPreviewUrl()}</div>
          </div>

          <DynamicVariablesPanel />

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

      {showVariablePreview() && (
        <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
          <h4 className='text-sm font-medium text-blue-900 mb-2'>
            Variable Substitution Preview:
          </h4>
          <div className='space-y-2 text-xs'>
            {(processedRequest.authToken !== initialRequest.authToken ||
              processedRequest.authorization?.token !==
                initialRequest.authorization?.token) && (
              <div>
                <span className='font-medium'>Auth Token:</span>
                <div className='font-mono bg-white p-1 rounded border'>
                  <span className='text-gray-500'>
                    {initialRequest.authorization?.token ||
                      initialRequest.authToken}
                  </span>{' '}
                  →
                  <span className='text-blue-600 ml-1'>
                    {processedRequest.authorization?.token ||
                      processedRequest.authToken}
                  </span>
                </div>
              </div>
            )}
            {processedRequest.url !== initialRequest.url && (
              <div>
                <span className='font-medium'>URL:</span>
                <div className='font-mono bg-white p-1 rounded border'>
                  <span className='text-gray-500'>{initialRequest.url}</span> →
                  <span className='text-blue-600 ml-1'>
                    {processedRequest.url}
                  </span>
                </div>
              </div>
            )}
            {processedRequest.body !== initialRequest.body &&
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

          <TabsTrigger value='pre-request' className='gap-2'>
            <Code className='w-4 h-4' />
            Pre-request
          </TabsTrigger>

          <TabsTrigger value='post-response' className='gap-2'>
            <Code className='w-4 h-4' />
            Post-response
          </TabsTrigger>
          <TabsTrigger value='settings' className='gap-2'>
            <Settings className='w-4 h-4' />
            Settings
          </TabsTrigger>
        </TabsList>
        <TabsContent value='params' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Query Parameters</CardTitle>
            </CardHeader>
            <CardContent>
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
                <Select value={bodyType} onValueChange={handleBodyTypeChange}>
                  <SelectTrigger className='w-40'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='none'>None</SelectItem>
                    <SelectItem value='json'>JSON</SelectItem>
                    <SelectItem value='form-data'>Form Data</SelectItem>
                    <SelectItem value='urlencoded'>
                      x-www-form-urlencoded
                    </SelectItem>
                    <SelectItem value='raw'>Raw</SelectItem>
                    <SelectItem value='binary'>Binary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {bodyType !== 'none' && bodyType !== 'binary' && (
                <div className='space-y-2'>
                  <Label>Body Content</Label>
                  <Textarea
                    name='body'
                    value={body}
                    onChange={(e) => handleInputChange(e, setBody)}
                    onKeyUp={(e) => handleAutocomplete(e)}
                    placeholder={
                      bodyType === 'json'
                        ? '{\n  "key": "value",\n  "array": [1, 2, 3]\n}'
                        : 'Enter request body'
                    }
                    rows={10}
                    className='font-mono'
                  />
                  {bodyType === 'json' && (
                    <Button
                      onClick={handleBeautify}
                      variant='outline'
                      className='mt-2 bg-transparent'
                    >
                      Beautify JSON
                    </Button>
                  )}
                </div>
              )}
              {bodyType === 'form-data' && (
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-lg font-medium text-gray-900'>
                      Form Fields
                    </h3>
                    <Button
                      variant='link'
                      size='sm'
                      onClick={handleAddFormField}
                      className='gap-2 text-primary'
                    >
                      <Plus className='w-4 h-4' />
                      Add Field
                    </Button>
                  </div>
                  {formFields.length > 0 ? (
                    <div className='space-y-2'>
                      {formFields.map((field) => (
                        <div
                          key={field.id}
                          className='grid grid-cols-12 gap-2 items-center'
                        >
                          <div className='col-span-4'>
                            <Input
                              value={field.key}
                              onChange={(e) =>
                                handleUpdateFormField(field.id, {
                                  key: e.target.value,
                                })
                              }
                              placeholder='Key'
                            />
                          </div>
                          <div className='col-span-5'>
                            {field.type === 'text' ? (
                              <Input
                                value={field.value}
                                onChange={(e) =>
                                  handleUpdateFormField(field.id, {
                                    value: e.target.value,
                                  })
                                }
                                placeholder='Value'
                              />
                            ) : (
                              <div className='flex items-center space-x-2'>
                                <Input
                                  type='file'
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleUpdateFormField(field.id, {
                                        value: file.name,
                                        fileName: file.name,
                                      });
                                    }
                                  }}
                                  placeholder='Choose File'
                                />
                                {field.fileName && (
                                  <span className='text-xs text-gray-500'>
                                    {field.fileName}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className='col-span-2'>
                            <Select
                              value={field.type}
                              onValueChange={(type) =>
                                handleUpdateFormField(field.id, {
                                  type: type as any,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='text'>Text</SelectItem>
                                <SelectItem value='file'>File</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className='col-span-1 flex justify-center'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleRemoveFormField(field.id)}
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
                        <FileText className='w-8 h-8 text-muted-foreground' />
                      </div>
                      <p className='text-muted-foreground'>
                        No form fields added. Click 'Add Field' to get started.
                      </p>
                    </div>
                  )}
                </div>
              )}
              {bodyType === 'urlencoded' && (
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-lg font-medium text-gray-900'>
                      URL Encoded Fields
                    </h3>
                    <Button
                      variant='link'
                      size='sm'
                      onClick={handleAddUrlEncodedField}
                      className='gap-2 text-primary'
                    >
                      <Plus className='w-4 h-4' />
                      Add Field
                    </Button>
                  </div>
                  {urlEncodedFields.length > 0 ? (
                    <div className='space-y-2'>
                      {urlEncodedFields.map((field) => (
                        <div
                          key={field.id}
                          className='grid grid-cols-12 gap-2 items-center'
                        >
                          <div className='col-span-5'>
                            <Input
                              value={field.key}
                              onChange={(e) =>
                                handleUpdateUrlEncodedField(field.id, {
                                  key: e.target.value,
                                })
                              }
                              placeholder='Key'
                            />
                          </div>
                          <div className='col-span-6'>
                            <Input
                              value={field.value}
                              onChange={(e) =>
                                handleUpdateUrlEncodedField(field.id, {
                                  value: e.target.value,
                                })
                              }
                              placeholder='Value'
                            />
                          </div>
                          <div className='col-span-1 flex justify-center'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() =>
                                handleRemoveUrlEncodedField(field.id)
                              }
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
                        <FileText className='w-8 h-8 text-muted-foreground' />
                      </div>
                      <p className='text-muted-foreground'>
                        No URL-encoded fields added. Click 'Add Field' to get
                        started.
                      </p>
                    </div>
                  )}
                </div>
              )}
              {bodyType === 'binary' && (
                <div className='text-center py-8 text-gray-500'>
                  <FileText className='w-12 h-12 text-gray-300 mx-auto mb-3' />
                  <p>Binary file upload coming soon...</p>
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
                <Select value='bearer' onValueChange={() => {}} disabled>
                  <SelectTrigger className='w-40'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='bearer'>Bearer Token</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                  type='password'
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value='pre-request' className='space-y-6'>
          <PrePostRequest
            type='pre-request'
            assertions={assertions}
            setAssertions={setAssertions}
            responseData={executionResult?.response}
            showAssertions={true}
            selectedVariables={selectedVariable}
          />
        </TabsContent>

        <TabsContent value='post-response' className='space-y-6'>
          <PrePostRequest
            type='post-response'
            assertions={assertions}
            setAssertions={setAssertions}
            responseData={executionResult?.response}
            showAssertions={true}
          />
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
                  value={initialRequest.timeout}
                  onChange={(e) =>
                    onUpdate({ timeout: Number.parseInt(e.target.value) })
                  }
                  placeholder='5000'
                />
              </div>

              <div className='space-y-2 opacity-60'>
                <Label htmlFor='retries'>Retries</Label>
                <Input
                  id='retries'
                  type='number'
                  value={initialRequest.retries}
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
                value={initialRequest.errorHandling || 'continue'}
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

                <div className='flex items-center space-x-2 opacity-60'>
                  <RadioGroupItem value='continue' id='continue' disabled />
                  <Label htmlFor='continue' className='text-orange-700'>
                    Continue to next step{' '}
                    <span className='text-xs italic text-gray-500'>
                      (Upcoming)
                    </span>
                  </Label>
                </div>

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
                checked={initialRequest.enabled}
                onCheckedChange={(checked) => onUpdate({ enabled: checked })}
              />
              <Label>Enable this request</Label>
            </div>
          </div>
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
