'use client';

import React from 'react';
import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { Play, Save, FolderPlus, Info, Key, Loader2 } from 'lucide-react';
import { useRequest } from '@/hooks/useRequest';
import { useCollection } from '@/hooks/useCollection';
import { useWorkspace } from '@/hooks/useWorkspace';
import type {
  BodyType,
  FormattedResponse,
  Header,
  Param,
  PendingSubstitution,
  RequestMethod,
  SelectedVariable,
} from '@/shared/types/request';
// Lazy load heavy components
const SchemaPage = lazy(() => import('../SchemaPage'));
const ImportModal = lazy(() => import('./ImportModal'));
const PerformanceTab = lazy(() => import('./Tabs/PerformanceTab'));
const PrePostRequest = lazy(
  () => import('@/components/Shared/RequestTabs/PrePostRequest'),
);

import { useToast } from '@/hooks/useToast';
import TooltipContainer from '@/components/ui/tooltip-container';
import KeyValueEditor from '@/components/ui/KeyValueEditor';
import type { KeyValuePairWithFile } from '@/components/ui/KeyValueEditorWithFileUpload';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import Modal from '@/components/ui/Modal';
import { useDataManagement } from '@/hooks/useDataManagement';
import {
  executeRequest,
  buildRequestPayload,
} from '@/services/executeRequest.service';
import { updateRequest } from '@/services/collection.service';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { generateAssertions } from '@/utils/assertionGenerator';
import { secureStorage } from '@/utils/secure-storage';
import { storageManager } from '@/utils/storage-manager';
import { Input } from '@/components/ui/input';
import EditableTextWithoutIcon from '@/components/ui/EditableTextWithoutIcon';
import { generateDynamicValueById, getMethodColor } from '@/lib/request-utils';
import RequestTabs from './RequestTabs';
import ParamsTab from './Tabs/ParamsTab';
import HeadersTab from './Tabs/HeadersTab';
import AuthTab from './Tabs/AuthTab';
import SettingsTab from './Tabs/SettingsTab';
import { useDebounce } from '@/hooks/useDebounce';
import {
  collectionActions,
  useCollectionStore,
  collectionStore,
} from '@/store/collectionStore';
import { useSchema } from '@/hooks/useSchema';
import type { CollectionRequest } from '@/shared/types/collection';
import RequestBody from '@/components/Shared/RequestTabs/RequestBody';

import {
  PerformanceTestConfigApi,
  PerformanceTestConfigDTO,
  PerformanceTestUpdatePayload,
} from '@/models/performanceTest.model';
import {
  getPerformanceConfigsByRequestId,
  getPerformanceTestConfig,
  performanceTestCreate,
  updatePerformanceTestConfig,
} from '@/services/performance.service';
import { Assertion } from '@/components/Shared/Assertion/ApiAssertionInterface';
import { RequestSettings } from '@/lib/requestBreadCrumb';
import { ErrorBoundary } from './ErrorBoundary';
import {
  RequestEditorProvider,
  useRequestEditor,
} from './context/RequestEditorContext';
import { isModifierPressed, shortcuts } from '@/utils/keyboardShortcuts';

const TabLoader = () => (
  <div className='flex items-center justify-center p-8'>
    <Loader2 className='h-6 w-6 animate-spin text-gray-400' />
  </div>
);

interface RequestEditorProps {
  onUsedVariablesChange?: (variables: {
    staticVars: Array<{ name: string; value: string }>;
    dynamicVars: Array<{ name: string; value: string }>;
  }) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onRegisterSave?: (saveFn: () => Promise<void>) => void;
  onExtractVariable?: (extraction: {
    variableName: string;
    name: string;
    source: 'response_body' | 'response_header' | 'response_cookie';
    path: string;
    value: any;
    transform?: string;
  }) => void;
  extractedVariables?: Record<string, any>;
  existingExtractions?: Array<{ name: string; path: string; source?: string }>;
  onRemoveExtraction?: (name: string) => void;
}

const methodsWithBody = ['POST', 'PUT', 'PATCH', 'DELETE'];
const getDefaultHeaders = (method: RequestMethod): Header[] => {
  if (methodsWithBody.includes(method)) {
    return [{ key: 'Content-Type', value: 'application/json', enabled: true }];
  }
  return [];
};

const generateBoundary = (): string => {
  return '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 16);
};

const getContentTypeForBodyType = (
  bodyType:
    | 'none'
    | 'json'
    | 'form-data'
    | 'x-www-form-urlencoded'
    | 'raw'
    | 'binary',
): string => {
  if (bodyType === 'form-data') {
    return `multipart/form-data; boundary=${generateBoundary()}`;
  }
  if (bodyType === 'x-www-form-urlencoded') {
    return 'application/x-www-form-urlencoded';
  }
  if (bodyType === 'json') {
    return 'application/json';
  }
  if (bodyType === 'raw') {
    return 'text/plain';
  }
  return 'application/json';
};

const RequestEditorContent: React.FC<RequestEditorProps> = ({
  onUsedVariablesChange,
  activeTab: externalActiveTab,
  onTabChange,
  onRegisterSave,
  onExtractVariable,
  extractedVariables = {},
  existingExtractions = [],
  onRemoveExtraction,
}) => {
  const {
    isLoading,
    clearError,
    setLoading,
    setError,
    setResponseData,
    setAssertions,
    responseData,
    assertions,
    toggleAssertion,
  } = useRequest();
  const {
    activeCollection,
    activeRequest,
    setActiveRequest,
    setCollection,
    expandedCollections,
    setActiveCollection,
    setIsCreatingCollection,
    collections,
    isCreatingCollection,
    addCollectionMutation,
    addRequestMutation,
    renameRequestMutation,
    handleCreateRequest: onCreateRequest,
    fetchCollectionRequests,
    replaceRequest,
  } = useCollection();

  const {
    url,
    setUrl,
    method,
    setMethod,
    params,
    setParams,
    headers,
    setHeaders,
    bodyType,
    setBodyType,
    bodyContent,
    setBodyContent,
    formFields,
    setFormFields,
    urlEncodedFields,
    setUrlEncodedFields,
    authType,
    setAuthType,
    token,
    setToken,
    authData,
    setAuthData,
    settings,
    setSettings,
    selectedVariable,
    setSelectedVariable,
    pendingSubstitutions,
    setPendingSubstitutions,
    dynamicVarTrigger,
    setDynamicVarTrigger,
  } = useRequestEditor();

  const isExtractingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  console.log('activeRequest123:', activeRequest);

  const { unsavedChanges } = useCollectionStore();

  const { variables, dynamicVariables, environments, activeEnvironment } =
    useDataManagement();
  const { error: showError, success: showSuccess, toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const [showCurlImport, setShowCurlImport] = useState(false);
  const [activeTab, setActiveTab] = useState<
    | 'params'
    | 'headers'
    | 'body'
    | 'auth'
    | 'pre-request'
    | 'post-response'
    | 'settings'
    | 'performance'
    | 'schemas'
  >((externalActiveTab as any) ?? 'params');

  const { schemas, fetchSchemas, isLoading: isSchemasLoading } = useSchema();

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  //   const [url, setUrl] = useState('');

  const [urlAtOpen, setUrlAtOpen] = useState('');
  //   const [method, setMethod] = useState<RequestMethod>('GET');
  //   const [params, setParams] = useState<Param[]>([]);
  //   const [headers, setHeaders] = useState<Header[]>([]);

  //   const [bodyType, setBodyType] = useState<BodyType>('raw');
  //   const [bodyContent, setBodyContent] = useState('{}');
  //   const [formFields, setFormFields] = useState<KeyValuePairWithFile[]>([]);
  //   const [urlEncodedFields, setUrlEncodedFields] = useState<Param[]>([]);
  //   const [authType, setAuthType] = useState<
  //     'none' | 'basic' | 'bearer' | 'apiKey' | 'oauth1' | 'oauth2'
  //   >('bearer');

  //   const [token, setToken] = useState('');
  //   const [selectedVariable, setSelectedVariable] = useState<SelectedVariable[]>(
  //     [],
  //   );

  //   const [dynamicVarTrigger, setDynamicVarTrigger] = useState(0);

  //   const [pendingSubstitutions, setPendingSubstitutions] = useState<
  //     PendingSubstitution[]
  //   >([]);
  //   const [authData, setAuthData] = useState({
  //     username: '',
  //     password: '',
  //     token: '',
  //     key: '',
  //     value: '',
  //     addTo: 'header' as 'header' | 'query',
  //     oauth1: {
  //       consumerKey: '',
  //       consumerSecret: '',
  //       token: '',
  //       tokenSecret: '',
  //       signatureMethod: 'HMAC-SHA1',
  //       version: '1.0',
  //       realm: '',
  //       nonce: '',
  //       timestamp: '',
  //     },
  //     oauth2: {
  //       clientId: '',
  //       clientSecret: '',
  //       accessToken: '',
  //       tokenType: 'Bearer',
  //       refreshToken: '',
  //       scope: '',
  //       grantType: 'authorization_code' as
  //         | 'authorization_code'
  //         | 'client_credentials'
  //         | 'password'
  //         | 'refresh_token',
  //       redirectUri: '',
  //     },
  //   });

  console.log('authDataIneditor:', authData);

  const getAuthCount = () => {
    let count = 0;

    if (authData.username.trim() !== '') count++;
    if (authData.password.trim() !== '') count++;

    if (authData.token.trim() !== '') count++;
    if (authData.key.trim() !== '') count++;
    if (authData.value.trim() !== '') count++;

    if (authData.oauth1.consumerKey.trim() !== '') count++;
    if (authData.oauth1.consumerSecret.trim() !== '') count++;
    if (authData.oauth1.token.trim() !== '') count++;
    if (authData.oauth1.tokenSecret.trim() !== '') count++;

    if (authData.oauth2.clientId.trim() !== '') count++;
    if (authData.oauth2.clientSecret.trim() !== '') count++;
    if (authData.oauth2.accessToken.trim() !== '') count++;

    return count;
  };

  const getBodyCount = () => {
    return bodyContent.trim() !== '' ? 1 : 0;
  };

  //   const [settings, setSettings] = useState<RequestSettings>({
  //     options: {
  //       followRedirects: true,
  //       stopOnError: false,
  //       saveResponses: false,
  //     },
  //     timeout: 30000,
  //     validateSSL: true,
  //     proxy: {
  //       enabled: false,
  //       url: '',
  //     },
  //     performanceTest: {
  //       numRequests: 1,
  //       concurrency: 1,
  //       delay: 0,
  //       timeout: 1000,
  //     },
  //     rateLimit: {
  //       enabled: false,
  //       requestsPerPeriod: 10,
  //       periodInSeconds: 60,
  //       type: 'fixed',
  //     },
  //   });

  const formattedVariables = useMemo(() => {
    const formatted: Array<{ name: string; value: string }> = [];

    const isValidVar = (name: string) =>
      name.startsWith('S_') || name.startsWith('D_') || name.startsWith('E_');

    if (Array.isArray(variables)) {
      variables.forEach((variable: any) => {
        const name = variable.name || variable.key || '';
        const value = variable.value || variable.initialValue || '';
        if (name && name.startsWith('S_')) {
          formatted.push({ name, value });
        }
      });
    }

    if (Array.isArray(dynamicVariables)) {
      dynamicVariables.forEach((variable: any) => {
        const name = variable.name || '';
        if (name && name.startsWith('D_')) {
          const generatedValue = generateDynamicValueById(
            variable.generatorId || '',
            variable.parameters || {},
          );
          formatted.push({ name, value: String(generatedValue) });
        }
      });
    }

    if (extractedVariables && typeof extractedVariables === 'object') {
      Object.entries(extractedVariables).forEach(([name, value]) => {
        if (name.startsWith('E_')) {
          formatted.push({ name, value: String(value) });
        }
      });
    }

    return formatted;
  }, [variables, dynamicVariables, dynamicVarTrigger, extractedVariables]);

  const { staticVars, dynamicVars, extractedVars } = useMemo(() => {
    const static_vars: Array<{ name: string; value: string }> = [];
    const dynamic_vars: Array<{ name: string; value: string }> = [];
    const extracted_vars: Array<{ name: string; value: string }> = [];

    formattedVariables.forEach((variable) => {
      if (variable.name.startsWith('S_')) {
        static_vars.push(variable);
      } else if (variable.name.startsWith('D_')) {
        dynamic_vars.push(variable);
      } else if (variable.name.startsWith('E_')) {
        extracted_vars.push(variable);
      }
    });

    return {
      staticVars: static_vars,
      dynamicVars: dynamic_vars,
      extractedVars: extracted_vars,
    };
  }, [formattedVariables]);

  const requestSpecificExtractedVariables = useMemo(() => {
    if (!activeRequest?.id) return {};
    return collectionActions.getExtractedVariablesRequest(activeRequest.id);
  }, [activeRequest?.id, collectionStore?.state?.extractedVariablesRequest]);

  const extractVariableNames = (text: any) => {
    if (!text) return [];
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1]);
    }
    return [...new Set(matches)];
  };

  const getUsedVariables = () => {
    const usedVarNames = new Set();

    extractVariableNames(url).forEach((name) => usedVarNames.add(name));

    params.forEach((param) => {
      if (param.enabled) {
        extractVariableNames(param.key).forEach((name) =>
          usedVarNames.add(name),
        );
        extractVariableNames(param.value).forEach((name) =>
          usedVarNames.add(name),
        );
      }
    });

    headers.forEach((header) => {
      if (header.enabled) {
        extractVariableNames(header.key).forEach((name) =>
          usedVarNames.add(name),
        );
        extractVariableNames(header.value).forEach((name) =>
          usedVarNames.add(name),
        );
      }
    });

    extractVariableNames(bodyContent).forEach((name) => usedVarNames.add(name));

    extractVariableNames(authData.token).forEach((name) =>
      usedVarNames.add(name),
    );

    selectedVariable.forEach((varItem) => {
      if (varItem.name) {
        usedVarNames.add(varItem.name);
      }
    });

    return {
      staticVars: formattedVariables.filter(
        (v) => v.name.startsWith('S_') && usedVarNames.has(v.name),
      ),
      dynamicVars: formattedVariables.filter(
        (v) => v.name.startsWith('D_') && usedVarNames.has(v.name),
      ),
      extractedVars: formattedVariables.filter(
        (v) => v.name.startsWith('E_') && usedVarNames.has(v.name),
      ),
    };
  };

  const debouncedUrl = useDebounce(url, 500);
  const debouncedBodyContent = useDebounce(bodyContent, 500);
  const debouncedToken = useDebounce(authData.token, 500);

  const usedVariables = useMemo(
    () => getUsedVariables(),
    [
      debouncedUrl,
      params,
      headers,
      debouncedBodyContent,
      formattedVariables,
      selectedVariable,
      debouncedToken,
    ],
  );

  useEffect(() => {
    if (onUsedVariablesChange) {
      onUsedVariablesChange(usedVariables);
    }
  }, [usedVariables, onUsedVariablesChange]);

  // Cleanup: Cancel any pending requests when component unmounts or request changes
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [activeRequest?.id]);

  useEffect(() => {
    if (externalActiveTab) {
      setActiveTab(externalActiveTab as any);
    }
  }, [externalActiveTab]);

  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [folderOptions, setFolderOptions] = useState<
    Array<{ id: string; label: string }>
  >([]);

  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [loadedRequestId, setLoadedRequestId] = useState<string | undefined>();
  const [preRequestEnabled, setPreRequestEnabled] = useState(false);

  const collectionsRef = useRef(collections);
  useEffect(() => {
    collectionsRef.current = collections;
  }, [collections]);

  useEffect(() => {
    if (activeRequest?.id && activeCollection?.id) {
      const collection = collections.find((c) => c.id === activeCollection.id);

      const isPreRequest = collection?.preRequestId === activeRequest.id;

      const isEnabled = collectionActions.getRequestPreRequestEnabled(
        activeRequest.id,
        activeCollection.id,
      );

      if (collection?.preRequestId && isEnabled === false && !isPreRequest) {
        collectionActions.setRequestPreRequestEnabled(
          activeRequest.id,
          true,
          activeCollection.id,
        );
        setPreRequestEnabled(true);
      } else if (isPreRequest) {
        setPreRequestEnabled(true);
      } else {
        setPreRequestEnabled(isEnabled);
      }
    } else {
      setPreRequestEnabled(false);
    }
  }, [activeRequest?.id, activeCollection?.id, collections]);

  const activeCollectionFull =
    collections.find((c) => c.id === activeCollection?.id) ||
    activeCollection ||
    null;

  function buildFolderOptions(
    folders: any[] = [],
    depth = 0,
    acc: Array<{ id: string; label: string }> = [],
  ) {
    for (const f of folders) {
      const name = f?.name || f?.Name || 'Folder';
      const id = f?.id || f?.Id;
      const label = `${'— '.repeat(depth)}${name}`;
      if (id) acc.push({ id, label });
      if (Array.isArray(f?.folders) && f.folders.length) {
        buildFolderOptions(f.folders, depth + 1, acc);
      }
    }
    return acc;
  }

  useEffect(() => {
    if (showSaveModal) {
      setSelectedCollectionId(activeCollection?.id || '');
    }
  }, [showSaveModal, activeCollection?.id]);

  useEffect(() => {
    if (onRegisterSave) {
      onRegisterSave(async () => {
        if (activeRequest && !activeRequest.id?.startsWith('temp-')) {
          await handleUpdateContentRequest();
        }
      });
    }
  }, [activeRequest, onRegisterSave]);

  useEffect(() => {
    const loadFolders = async () => {
      if (!showSaveModal || !selectedCollectionId) return;
      try {
        await fetchCollectionRequests.mutateAsync(selectedCollectionId);
      } catch (e) {
      } finally {
        const latest = collectionsRef.current.find(
          (c) => c.id === selectedCollectionId,
        );
        const foldersTree = (latest as any)?.folders || [];
        const options = buildFolderOptions(foldersTree);
        setFolderOptions(options);
      }
    };
    loadFolders();
  }, [showSaveModal, selectedCollectionId]);

  useEffect(() => {
    setSelectedFolderId('');
    const foldersTree = (activeCollectionFull as any)?.folders || [];
    const options = buildFolderOptions(foldersTree);
    setFolderOptions(options);
  }, [activeCollection?.id]);

  const findFolderName = (folderId: string, folders: any[] = []): string => {
    for (const folder of folders) {
      if (folder.id === folderId) {
        return folder.name || folder.Name || 'Folder';
      }
      if (Array.isArray(folder.folders) && folder.folders.length > 0) {
        const found = findFolderName(folderId, folder.folders);
        if (found) return found;
      }
    }
    return '';
  };

  const updateRequestMutation = useMutation({
    mutationFn: ({
      requestId,
      requestData,
    }: {
      requestId: string;
      requestData: any;
    }) => updateRequest({ requestId, requestData }),
    onSuccess: async (data) => {
      if (activeCollection?.id) {
        await fetchCollectionRequests.mutateAsync(activeCollection.id);
      }
    },
  });

  const [performanceTestId, setPerformanceTestId] = useState<string>('');

  const performanceTestCreateMutation = useMutation({
    mutationFn: (payload: any) => performanceTestCreate(payload),
    onSuccess: (data: any) => {
      setPerformanceTestId(data?.Id || data?.id || '');
      toast({
        title: 'Created',
        description: 'Performance test created.',
        duration: 3000,
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Create failed',
        description: err?.message || 'Error',
        duration: 3000,
      });
    },
  });

  const performanceTestUpdateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: PerformanceTestUpdatePayload;
    }) => updatePerformanceTestConfig(id, payload),
    onSuccess: () => {
      toast({
        title: 'Updated',
        description: 'Performance config updated.',
        duration: 3000,
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Update failed',
        description: err?.message || 'Error',
        duration: 3000,
      });
    },
  });

  const buildPerformanceUpdatePayload = (): PerformanceTestUpdatePayload => ({
    name: `${activeRequest?.name || 'Request'} - Performance Test`,

    numRequests: Number(settings.performanceTest.numRequests) || 0,
    concurrency: Number(settings.performanceTest.concurrency) || 0,
    delay: Number(settings.performanceTest.delay) || 0,
    timeout: Number(settings.performanceTest.timeout) || 0,

    rateLimitEnabled: !!settings.rateLimit.enabled,
    rateLimitRequests: Number(settings.rateLimit.requestsPerPeriod) || 0,
    rateLimitPeriod: Number(settings.rateLimit.periodInSeconds) || 0,
    rateLimitType: settings.rateLimit.type || 'fixed',
  });

  const updatePerfConfigMutation = useMutation({
    mutationFn: (args: { id: string; payload: PerformanceTestUpdatePayload }) =>
      updatePerformanceTestConfig(args.id, args.payload),

    onSuccess: () => {
      toast({
        title: 'Updated',
        description: 'Performance config updated successfully.',
        duration: 3000,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error?.message || 'Unable to update config.',
        duration: 3000,
      });
    },
  });

  const handleCreatePerformanceTest = () => {
    if (performanceTestId) {
      const payload = buildPerformanceUpdatePayload();
      performanceTestUpdateMutation.mutate({ id: performanceTestId, payload });
      return;
    }

    const createPayload = {
      workspaceId: currentWorkspace?.id,
      requestId: activeRequest?.id,
      preRequestId: activeCollection?.preRequestId,
      name: `${activeRequest?.name || 'Request'} - Performance Test`,

      numRequests: settings.performanceTest.numRequests,
      concurrency: settings.performanceTest.concurrency,
      delay: settings.performanceTest.delay,
      timeout: settings.performanceTest.timeout,

      rateLimitEnabled: settings.rateLimit.enabled,
      rateLimitRequests: settings.rateLimit.requestsPerPeriod,
      rateLimitPeriod: settings.rateLimit.periodInSeconds,
      rateLimitType: settings.rateLimit.type,
    };

    performanceTestCreateMutation.mutate(createPayload);
  };

  const mapPerfConfigToSettings = (
    api: PerformanceTestConfigApi,
    prev: RequestSettings,
  ): RequestSettings => {
    return {
      ...prev,

      performanceTest: {
        numRequests: api.NumRequests ?? prev.performanceTest.numRequests,
        concurrency: api.Concurrency ?? prev.performanceTest.concurrency,
        delay: api.Delay ?? prev.performanceTest.delay,
        timeout: api.Timeout ?? prev.performanceTest.timeout,
      },

      rateLimit: {
        enabled: api.RateLimitEnabled ?? prev.rateLimit.enabled,
        requestsPerPeriod:
          api.RateLimitRequests ?? prev.rateLimit.requestsPerPeriod,
        periodInSeconds: api.RateLimitPeriod ?? prev.rateLimit.periodInSeconds,
        type: (api.RateLimitType ?? prev.rateLimit.type) as 'fixed' | 'sliding',
      },
    };
  };

  const mapPerfConfigToSettingsRequest = (
    cfg: PerformanceTestConfigDTO,
    prev: RequestSettings,
  ): RequestSettings => ({
    ...prev,
    performanceTest: {
      numRequests: cfg.numRequests ?? prev.performanceTest.numRequests,
      concurrency: cfg.concurrency ?? prev.performanceTest.concurrency,
      delay: cfg.delay ?? prev.performanceTest.delay,
      timeout: cfg.timeout ?? prev.performanceTest.timeout,
    },
    rateLimit: {
      enabled: cfg.rateLimitEnabled ?? prev.rateLimit.enabled,
      requestsPerPeriod:
        cfg.rateLimitRequests ?? prev.rateLimit.requestsPerPeriod,
      periodInSeconds: cfg.rateLimitPeriod ?? prev.rateLimit.periodInSeconds,
      type: (cfg.rateLimitType ?? prev.rateLimit.type) as any,
    },
  });

  const perfConfigsQuery = useQuery<PerformanceTestConfigDTO[]>({
    queryKey: ['performance-configs-by-request', activeRequest?.id],
    queryFn: () => getPerformanceConfigsByRequestId(activeRequest!.id!),
    enabled:
      !!activeRequest?.id && !String(activeRequest.id).startsWith('temp-'),
    refetchOnWindowFocus: false,
  });

  const perfConfigQuery = useQuery<PerformanceTestConfigApi>({
    queryKey: ['performance-test-config', performanceTestId],
    queryFn: () => getPerformanceTestConfig(performanceTestId),
    enabled: !!performanceTestId,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!perfConfigQuery.data) return;

    setSettings((prev) => mapPerfConfigToSettings(perfConfigQuery.data!, prev));

    toast({
      title: 'Performance Config Loaded',
      description: 'Performance fields were auto-filled from saved config.',
      duration: 2500,
    });
  }, [perfConfigQuery.data]);

  useEffect(() => {
    setPerformanceTestId('');

    const list = perfConfigsQuery.data;
    if (!Array.isArray(list) || list.length === 0) return;

    const cfg = [...list].sort((a, b) =>
      String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')),
    )[0];

    setPerformanceTestId(cfg.id);
    setSettings((prev) => mapPerfConfigToSettingsRequest(cfg, prev));
  }, [activeRequest?.id, perfConfigsQuery.data]);

  const syncCurrentRequestToStore = () => {
    if (activeRequest?.id && !isSaving) {
      collectionActions.updateOpenedRequest({
        ...activeRequest,
        url,
        method,
        params,
        headers,
        bodyType,
        bodyRawContent: bodyContent,
        bodyFormData:
          bodyType === 'form-data' ? activeRequest.bodyFormData : undefined,
        authorizationType: authType,
        authorization: authData,
      });
    }
  };

  const isNewRequest = (requestId?: string) => {
    return !requestId || requestId.startsWith('temp-');
  };

  useEffect(() => {
    if (isExtractingRef.current) return;
    if (isSaving) return;

    const enabledParams = params.filter((p) => p.enabled && p.key);

    if (!url) return;

    const baseUrl = url.split('?')[0];

    if (enabledParams.length > 0) {
      const queryString = enabledParams
        .map(
          (p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`,
        )
        .join('&');
      const newUrl = `${baseUrl}?${queryString}`;

      if (newUrl !== url) {
        isExtractingRef.current = true;
        setUrl(newUrl);
        setTimeout(() => {
          isExtractingRef.current = false;
        }, 200);
      }
    } else {
      if (url.includes('?')) {
        isExtractingRef.current = true;
        setUrl(baseUrl);
        setTimeout(() => {
          isExtractingRef.current = false;
        }, 200);
      }
    }
  }, [params, isSaving]);

  //   useEffect(() => {
  //     if (isSaving) return;

  //     if (activeRequest && activeRequest.id !== loadedRequestId) {
  //       setLoadedRequestId(activeRequest.id);

  //       setUrl(activeRequest.url || '');
  //       setMethod((activeRequest.method as RequestMethod) || 'GET');
  //       setParams(activeRequest.params || []);

  //       if (activeRequest.headers && Array.isArray(activeRequest.headers)) {
  //         try {
  //           const formattedHeaders = activeRequest.headers.map((h: any) => {
  //             return {
  //               key: h.key || h.name || '',
  //               value: h.value || '',
  //               enabled: h.enabled !== undefined ? !!h.enabled : true,
  //             };
  //           });

  //           const defaultHeaders = methodsWithBody.includes(
  //             activeRequest.method as RequestMethod,
  //           )
  //             ? [
  //                 {
  //                   key: 'Content-Type',
  //                   value: 'application/json',
  //                   enabled: true,
  //                 },
  //               ]
  //             : [];

  //           const filteredHeaders = formattedHeaders.filter(
  //             (h: Header) =>
  //               h.key !== 'Postman-Token' &&
  //               h.key !== 'User-Agent' &&
  //               !defaultHeaders.find((dh) => dh.key === h.key),
  //           );

  //           setHeaders([...defaultHeaders, ...filteredHeaders]);
  //         } catch (error) {
  //           console.error('Error formatting headers:', error);
  //           setHeaders(getDefaultHeaders(activeRequest.method as RequestMethod));
  //         }
  //       } else {
  //         setHeaders(getDefaultHeaders(activeRequest.method as RequestMethod));
  //       }

  //       const allowedBodyTypes = [
  //         'none',
  //         'json',
  //         'form-data',
  //         'x-www-form-urlencoded',
  //         'raw',
  //         'binary',
  //       ];
  //       const bodyTypeValue = activeRequest.bodyType || 'none';
  //       if (allowedBodyTypes.includes(bodyTypeValue)) {
  //         setBodyType(bodyTypeValue as BodyType);
  //       } else {
  //         setBodyType('raw');
  //       }
  //       setBodyContent(activeRequest.bodyRawContent || '');
  //       setPendingSubstitutions([]);

  //       try {
  //         if (bodyTypeValue === 'form-data' && activeRequest.bodyFormData) {
  //           if (Array.isArray(activeRequest.bodyFormData)) {
  //             const formDataFields = activeRequest.bodyFormData.map(
  //               (field: any) => ({
  //                 key: field.key || '',
  //                 value: field.value || '',
  //                 enabled: field.enabled !== undefined ? field.enabled : true,
  //                 type: (field.type || 'text') as 'text' | 'file',
  //                 ...(field.fileName ? { fileName: field.fileName } : {}),
  //               }),
  //             );
  //             setFormFields(formDataFields);
  //           } else if (typeof activeRequest.bodyFormData === 'object') {
  //             const formDataFields = Object.entries(
  //               activeRequest.bodyFormData,
  //             ).map(([key, value]) => ({
  //               key,
  //               value: value?.toString() || '',
  //               enabled: true,
  //               type: 'text' as const,
  //             }));
  //             setFormFields(formDataFields);
  //           } else {
  //             setFormFields([]);
  //           }
  //         } else {
  //           setFormFields([]);
  //         }
  //       } catch (error) {
  //         console.error('Error initializing form fields:', error);
  //         setFormFields([]);
  //       }

  //       try {
  //         if (
  //           bodyTypeValue === 'x-www-form-urlencoded' &&
  //           activeRequest.bodyRawContent
  //         ) {
  //           try {
  //             const urlParams = new URLSearchParams(activeRequest.bodyRawContent);
  //             const encodedFields: Param[] = [];
  //             urlParams.forEach((value, key) => {
  //               encodedFields.push({ key, value, enabled: true });
  //             });
  //             setUrlEncodedFields(encodedFields);
  //           } catch (e) {
  //             setUrlEncodedFields([]);
  //           }
  //         } else {
  //           setUrlEncodedFields([]);
  //         }
  //       } catch (error) {
  //         console.error('Error initializing URL encoded fields:', error);
  //         setUrlEncodedFields([]);
  //       }

  //       setToken(activeRequest.authorization?.token || '');
  //       const requestAuthType = activeRequest.authorizationType as
  //         | 'none'
  //         | 'basic'
  //         | 'bearer'
  //         | 'apiKey'
  //         | 'oauth1'
  //         | 'oauth2';

  //       if (activeRequest.authorization?.token && !requestAuthType) {
  //         setAuthType('bearer');
  //       } else {
  //         setAuthType(requestAuthType || 'bearer');
  //       }

  //       setAuthData({
  //         username: activeRequest.authorization?.username || '',
  //         password: activeRequest.authorization?.password || '',
  //         token: activeRequest.authorization?.token || '',
  //         key: activeRequest.authorization?.key || '',
  //         value: activeRequest.authorization?.value || '',
  //         addTo: activeRequest.authorization?.addTo || 'header',
  //         oauth1: {
  //           consumerKey: '',
  //           consumerSecret: '',
  //           token: '',
  //           tokenSecret: '',
  //           signatureMethod: 'HMAC-SHA1',
  //           version: '1.0',
  //           realm: '',
  //           nonce: '',
  //           timestamp: '',
  //         },
  //         oauth2: {
  //           clientId: '',
  //           clientSecret: '',
  //           accessToken: '',
  //           tokenType: 'Bearer',
  //           refreshToken: '',
  //           scope: '',
  //           grantType: 'authorization_code',
  //           redirectUri: '',
  //         },
  //       });

  //       if (
  //         activeRequest.assertions &&
  //         Array.isArray(activeRequest.assertions) &&
  //         activeRequest.assertions.length > 0
  //       ) {
  //         try {
  //           const existingAssertions = activeRequest.assertions.map(
  //             (assertion: any) => {
  //               return {
  //                 id: assertion.id || `temp-${Math.random()}`,
  //                 category: assertion.category || 'general',
  //                 type: assertion.type || 'custom',
  //                 description: assertion.description || 'Custom assertion',
  //                 field: assertion.field,
  //                 operator: assertion.operator || 'equals',
  //                 expectedValue: assertion.expectedValue,
  //                 enabled:
  //                   assertion.enabled !== undefined ? assertion.enabled : true,
  //                 impact: assertion.impact,
  //                 group: assertion.group || 'custom',
  //                 priority: assertion.priority,
  //               } as Assertion;
  //             },
  //           );

  //           setAssertions(existingAssertions);
  //         } catch (error) {
  //           console.error('Error loading existing assertions:', error);
  //           setAssertions([]);
  //         }
  //       } else {
  //         setAssertions([]);
  //       }

  //       if (activeRequest.folderId) {
  //         setSelectedFolderId(activeRequest.folderId);
  //       } else {
  //         setSelectedFolderId('');
  //       }

  //       if (
  //         activeRequest.variable &&
  //         Array.isArray(activeRequest.variable) &&
  //         activeRequest.variable.length > 0
  //       ) {
  //         const filteredVariables = activeRequest.variable.filter(
  //           (v: any) => v.path || v.name,
  //         );
  //         setSelectedVariable(filteredVariables);
  //       } else {
  //         setSelectedVariable([]);
  //       }
  //       // Restore previously extracted variables from localStorage on initial load
  //       if (
  //         activeRequest.extractVariables &&
  //         Array.isArray(activeRequest.extractVariables) &&
  //         activeRequest.extractVariables.length > 0 &&
  //         activeCollection?.id
  //       ) {
  //         activeRequest.extractVariables.forEach((extraction: any) => {
  //           const variableName = extraction.name;
  //           if (!variableName) return;

  //           const storageKey = `extracted_var_${activeCollection.id}_${variableName}`;
  //           const storedData = localStorage.getItem(storageKey);

  //           if (storedData) {
  //             try {
  //               const parsed = JSON.parse(storedData);
  //               if (parsed.value) {
  //                 collectionActions.setExtractedVariableRequest(
  //                   activeRequest.id,
  //                   variableName,
  //                   String(parsed.value),
  //                 );
  //               }
  //             } catch (e) {
  //               console.error('Error restoring extracted variable:', e);
  //             }
  //           }
  //         });
  //       }
  //     } else if (!isSaving && !activeRequest) {
  //       setLoadedRequestId(undefined);
  //       setAssertions([]);
  //       setAuthType('bearer');
  //       setSelectedVariable([]);
  //       setPendingSubstitutions([]);
  //       setResponseData(null);
  //     }
  //   }, [activeRequest, isSaving, activeCollection?.id]);

  useEffect(() => {
    if (activeRequest && !activeRequest.id?.startsWith('temp-')) {
      if (activeRequest?.id) {
        collectionActions.markUnsaved(activeRequest.id);
      }
    }
  }, [activeEnvironment]);

  useEffect(() => {
    if (activeRequest?.id) {
      const storedResponse = collectionActions.getRequestResponse(
        activeRequest.id,
      );
      if (storedResponse) {
        setResponseData(storedResponse);
      } else {
        setResponseData(null);
      }
    }
  }, [activeRequest?.id]);

  // useEffect(() => {
  //   if (activeRequest?.id && activeCollection?.id) {
  //     const collection = collections.find((c) => c.id === activeCollection.id);

  //     const isEnabled = collectionActions.getRequestPreRequestEnabled(
  //       activeRequest.id,
  //       activeCollection.id,
  //     );

  //     if (collection?.preRequestId && isEnabled === false) {
  //       collectionActions.setRequestPreRequestEnabled(
  //         activeRequest.id,
  //         true,
  //         activeCollection.id,
  //       );
  //       setPreRequestEnabled(true);
  //     } else {
  //       setPreRequestEnabled(isEnabled);
  //     }
  //   } else {
  //     setPreRequestEnabled(false);
  //   }
  // }, [activeRequest?.id, activeCollection?.id, collections]);
  const isCurrentRequestPreRequest = useMemo(() => {
    if (!activeRequest?.id || !activeCollection?.id) return false;
    const collection = collections.find((c) => c.id === activeCollection.id);
    return collection?.preRequestId === activeRequest.id;
  }, [activeRequest?.id, activeCollection?.id, collections]);

  useEffect(() => {
    if (isCurrentRequestPreRequest) {
      return;
    }

    if (preRequestEnabled && activeCollection?.id && activeRequest?.id) {
      const storageKey = `extracted_var_${activeCollection.id}_E_token`;

      // Try encrypted storage first
      const encryptedData = secureStorage.loadEncrypted(storageKey);
      const tokenValue =
        encryptedData?.value ??
        (() => {
          try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return parsed.value ?? null;
          } catch {
            return null;
          }
        })();

      if (tokenValue) {
        setAuthType('bearer');
        setAuthData((prev) => ({
          ...prev,
          token: tokenValue,
        }));

        collectionActions.updateOpenedRequest({
          ...activeRequest,
          authorizationType: 'bearer',
          authorization: {
            ...activeRequest.authorization,
            token: tokenValue,
          },
        });
      }
    }
  }, [
    preRequestEnabled,
    activeCollection?.id,
    activeRequest?.id,
    isCurrentRequestPreRequest,
  ]);

  const handlePreRequestToggle = (checked: boolean) => {
    if (isCurrentRequestPreRequest) {
      return;
    }

    setPreRequestEnabled(checked);

    if (activeRequest?.id && activeCollection?.id) {
      collectionActions.setRequestPreRequestEnabled(
        activeRequest.id,
        checked,
        activeCollection.id,
      );
    }

    if (checked && activeCollection?.id) {
      const storageKey = `extracted_var_${activeCollection.id}_E_token`;

      // Try encrypted storage first, then fall back to plain localStorage
      const encryptedData = secureStorage.loadEncrypted(storageKey);
      const tokenValue =
        encryptedData?.value ??
        (() => {
          try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return parsed.value ?? null;
          } catch {
            return null;
          }
        })();

      if (tokenValue) {
        setAuthType('bearer');
        setAuthData((prev) => ({
          ...prev,
          token: tokenValue,
        }));

        toast({
          title: 'Pre-request Token Loaded',
          description: 'Using encrypted token from authentication request',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Token Not Found',
          description: 'Please run the auth request first',
          variant: 'destructive',
        });
      }
    } else {
      setAuthData((prev) => ({
        ...prev,
        token: '',
      }));
    }
  };

  const hasPreRequestConfigured = useMemo(() => {
    if (!activeCollection) return false;

    const collection = collections.find((c) => c.id === activeCollection.id);
    return !!collection?.preRequestId;
  }, [activeCollection?.id, collections]);

  const formatBackendResponse = (result: any): FormattedResponse => {
    const importantHeaders = [
      'cache-control',
      'content-type',
      'expires',
      'pragma',
    ];
    const filteredHeaders: Record<string, string> = {};

    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        if (importantHeaders.includes(key.toLowerCase())) {
          filteredHeaders[key.toLowerCase()] = value as string;
        }
      });
    }

    let parsedBody: any = result.body;
    if (typeof result.body === 'string') {
      try {
        parsedBody = JSON.parse(result.body);
      } catch {}
    }

    return {
      status: result.status ?? result.statusCode,
      statusText: '',
      headers: filteredHeaders,
      data: parsedBody,
      responseTime: result.metrics?.responseTime ?? 0,
      size: result.metrics?.bytesReceived ?? 0,
    };
  };

  const handleCurlImport = (parsedRequest: any) => {
    try {
      const generateUniqueRequestId = (): string => {
        return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      };

      const newRequest: CollectionRequest = {
        id: generateUniqueRequestId(),
        name: 'New Request',
        method: 'GET',
        url: '',
        bodyType: 'raw',
        bodyFormData: null,
        authorizationType: 'none',
        authorization: {},
        variables: {},
        headers: [],
        params: [],
        order: 0,
      };

      if (parsedRequest.url) {
        newRequest.url = parsedRequest.url;
      }

      if (parsedRequest.method) {
        const supportedMethods: RequestMethod[] = [
          'GET',
          'POST',
          'PUT',
          'DELETE',
          'PATCH',
        ];
        const requestMethod =
          parsedRequest.method.toUpperCase() as RequestMethod;
        if (supportedMethods.includes(requestMethod)) {
          newRequest.method = requestMethod;
        }
      }

      if (parsedRequest.headers && Array.isArray(parsedRequest.headers)) {
        newRequest.headers = parsedRequest.headers.map((header: any) => ({
          key: header.key || '',
          value: header.value || '',
          enabled: header.enabled !== undefined ? header.enabled : true,
        }));
      }

      if (parsedRequest.params && Array.isArray(parsedRequest.params)) {
        newRequest.params = parsedRequest.params.map((param: any) => ({
          key: param.key || '',
          value: param.value || '',
          enabled: param.enabled !== undefined ? param.enabled : true,
        }));
      }

      if (parsedRequest.bodyType) {
        const allowedBodyTypes = [
          'none',
          'json',
          'form-data',
          'x-www-form-urlencoded',
          'raw',
          'binary',
        ];
        if (allowedBodyTypes.includes(parsedRequest.bodyType)) {
          newRequest.bodyType = parsedRequest.bodyType as BodyType;
        }
      }

      if (parsedRequest.body) {
        let bodyContentToSet = '';
        if (typeof parsedRequest.body === 'string') {
          bodyContentToSet = parsedRequest.body;
        } else if (typeof parsedRequest.body === 'object') {
          try {
            bodyContentToSet = JSON.stringify(parsedRequest.body, null, 2);
          } catch (e) {
            console.error('Error stringifying parsed body:', e);
          }
        }
        newRequest.bodyRawContent = bodyContentToSet;
      }

      if (parsedRequest.auth && parsedRequest.auth.type) {
        const authTypeValue = parsedRequest.auth.type.toLowerCase();

        switch (authTypeValue) {
          case 'bearer':
            newRequest.authorizationType = 'bearer';
            if (parsedRequest.auth.token) {
              newRequest.authorization = { token: parsedRequest.auth.token };
            }
            break;
          case 'basic':
            newRequest.authorizationType = 'basic';
            if (parsedRequest.auth.username && parsedRequest.auth.password) {
              newRequest.authorization = {
                username: parsedRequest.auth.username,
                password: parsedRequest.auth.password,
              };
            }
            break;
          case 'apikey':
            newRequest.authorizationType = 'apiKey';
            if (parsedRequest.auth.key && parsedRequest.auth.value) {
              newRequest.authorization = {
                key: parsedRequest.auth.key,
                value: parsedRequest.auth.value,
                addTo: parsedRequest.auth.addTo || 'header',
              };
            }
            break;
          default:
            newRequest.authorizationType = 'bearer';
            break;
        }
      }

      if (parsedRequest.bodyType === 'form-data' && parsedRequest.formData) {
        newRequest.bodyFormData = parsedRequest.formData;
      }

      if (activeCollection) {
        newRequest.collectionId = activeCollection.id;

        if (!expandedCollections.has(activeCollection.id)) {
          collectionActions.toggleExpandedCollection(activeCollection.id);
        }

        setCollection(
          collections.map((col) => {
            if (col.id !== activeCollection.id) return col;

            const nextOrder = ((col.requests || []).length || 0) + 1;
            newRequest.order = nextOrder;

            return {
              ...col,
              requests: [...(col.requests || []), newRequest],
            };
          }),
        );
      }

      collectionActions.openRequest(newRequest);
      collectionActions.setActiveRequest(newRequest);
      collectionActions.markUnsaved(newRequest.id);

      if (
        parsedRequest.auth &&
        parsedRequest.auth.type &&
        parsedRequest.auth.type !== 'none'
      ) {
        setActiveTab('auth');
      } else if (parsedRequest.body || parsedRequest.bodyType !== 'none') {
        setActiveTab('body');
      } else if (parsedRequest.headers && parsedRequest.headers.length > 0) {
        setActiveTab('headers');
      } else if (parsedRequest.params && parsedRequest.params.length > 0) {
        setActiveTab('params');
      }

      setShowCurlImport(false);

      toast({
        title: 'cURL Imported Successfully',
        description: 'A new request has been created from the cURL command',
      });
    } catch (error) {
      console.error('Error importing cURL:', error);
      toast({
        title: 'Import Error',
        description: 'Failed to import cURL command. Please check the format.',
      });
    }
  };

  const handleSendRequest = async () => {
    if (!activeRequest) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setDynamicVarTrigger((prev) => prev + 1);

    clearError();
    setLoading(true);
    const newUrl = buildFinalUrl();

    let substitutedBodyContent = bodyContent;
    try {
      let effectiveAuthType = authType;
      let effectiveToken = authData.token;

      // Load token from localStorage if pre-request is enabled
      if (preRequestEnabled && activeCollection?.id) {
        const possibleTokenKeys = [
          `extracted_var_${activeCollection.id}_E_token`,
          `extracted_var_${activeCollection.id}_E_accessToken`,
          `extracted_var_${activeCollection.id}_E_access_token`,
        ];

        for (const storageKey of possibleTokenKeys) {
          const encryptedData = secureStorage.loadEncrypted(storageKey);
          if (encryptedData?.value) {
            effectiveToken = encryptedData.value;
            effectiveAuthType = 'bearer';
            break;
          }

          const storedData = localStorage.getItem(storageKey);
          if (storedData) {
            try {
              const parsedData = JSON.parse(storedData);
              if (parsedData.value) {
                effectiveToken = parsedData.value;
                effectiveAuthType = 'bearer';
                break;
              }
            } catch (error) {
              console.error('Error parsing stored token:', error);
            }
          }
        }
        if (effectiveToken === authData.token) {
          console.warn('⚠️ Pre-request token not found in localStorage');
        }
      }

      if (
        effectiveToken &&
        effectiveToken.trim() !== '' &&
        (!effectiveAuthType || effectiveAuthType === 'none')
      ) {
        effectiveAuthType = 'bearer';
      }

      if (!effectiveToken || effectiveToken.trim() === '') {
        effectiveAuthType = 'none';
      }

      if (selectedVariable && selectedVariable.length > 0) {
        try {
          const parsedBody = JSON.parse(bodyContent);
          selectedVariable.forEach((varItem) => {
            const variable = formattedVariables.find(
              (v) => v.name === varItem.name,
            );
            if (variable && varItem.path) {
              parsedBody[varItem.path] = variable.value;
            }
          });
          substitutedBodyContent = JSON.stringify(parsedBody, null, 2);
        } catch {
          selectedVariable.forEach((varItem) => {
            const variable = formattedVariables.find(
              (v) => v.name === varItem.name,
            );
            if (variable) {
              const regex = new RegExp(`{{${variable.name}}}`, 'g');
              substitutedBodyContent = substitutedBodyContent.replace(
                regex,
                variable.value,
              );
            }
          });
        }
      }

      let resolvedToken = effectiveToken;
      formattedVariables.forEach((v) => {
        const regex = new RegExp(`\\{\\{${v.name}\\}\\}`, 'g');
        resolvedToken = resolvedToken.replace(regex, v.value);
      });

      const currentRequest = {
        id: activeRequest.id,
        name: activeRequest.name || 'Untitled Request',
        method,
        url: newUrl,
        order: activeRequest.order || 0,
        headers,
        params,
        body: substitutedBodyContent,
        bodyRawContent: substitutedBodyContent,
        bodyType: bodyType === 'json' ? 'raw' : bodyType,
        authorizationType: effectiveAuthType,
        authorization:
          effectiveAuthType === 'bearer'
            ? { token: resolvedToken }
            : effectiveAuthType === 'basic'
              ? {
                  username: authData.username,
                  password: authData.password,
                }
              : effectiveAuthType === 'apiKey'
                ? {
                    key: authData.key,
                    value: authData.value,
                    addTo: authData.addTo,
                  }
                : undefined,
        timeout: settings.timeout,
        retries: 0,
        extractVariables: [],
        enabled: true,
      };

      const enabledAssertions = Array.isArray(assertions)
        ? assertions
            .filter((assertion) => assertion.enabled)
            .map((a) => ({
              ...a,
              expectedValue:
                a.expectedValue !== undefined && a.expectedValue !== null
                  ? String(a.expectedValue)
                  : '',
            }))
        : [];

      const payload = buildRequestPayload(
        currentRequest,
        formattedVariables.map((v) => ({
          name: v.name,
          value: v.value,
          type: 'string',
          currentValue: v.value,
        })),
        currentWorkspace?.id,
      );

      const payloadWithAssertions = {
        ...payload,
        assertions: enabledAssertions,
      };

      const primarySchema = schemas?.find(
        (s) => s.requestId === activeRequest.id && s.isPrimary,
      );

      if (primarySchema) {
        payloadWithAssertions.schemaId = primarySchema.id;
      }

      const backendData = await executeRequest(
        payloadWithAssertions,
        abortControllerRef.current?.signal,
      );

      let backendBody;
      let statusCode;
      let responseHeaders;
      let requestCurl;
      let metrics;
      let assertionLogs;
      let schemaValidation;

      if (
        backendData?.data?.responses &&
        Array.isArray(backendData.data.responses)
      ) {
        const firstResponse = backendData.data.responses[0];

        backendBody = firstResponse.body;
        statusCode = firstResponse.status ?? firstResponse.statusCode;
        responseHeaders = firstResponse.headers;
        requestCurl = firstResponse.requestCurl;
        metrics = firstResponse.metrics;

        assertionLogs = backendData.data.assertionResults || [];
        schemaValidation = backendData.data.schemaValidation || null;
      } else {
        backendBody = backendData?.data?.body;
        statusCode = backendData?.data?.statusCode;
        responseHeaders = backendData?.data?.headers;
        requestCurl = backendData?.data?.requestCurl;
        metrics = backendData?.data?.metrics;
        assertionLogs = backendData?.data?.assertionLogs || [];
        schemaValidation = backendData?.data?.schemaValidation || null;
      }

      if (backendBody) {
        let parsedBody = backendBody;
        if (typeof backendBody === 'string') {
          try {
            parsedBody = JSON.parse(backendBody);
          } catch {}
        }

        const actualRequest = {
          method,
          url: newUrl,
          headers: headers
            .filter((h) => h.enabled)
            .reduce(
              (acc, h) => {
                if (h.key) acc[h.key] = h.value;
                return acc;
              },
              {} as Record<string, string>,
            ),
          body: substitutedBodyContent
            ? (() => {
                try {
                  return JSON.parse(substitutedBodyContent);
                } catch {
                  return substitutedBodyContent;
                }
              })()
            : null,
          authorizationType: effectiveAuthType,
          authorization:
            effectiveAuthType === 'bearer'
              ? { token: resolvedToken }
              : effectiveAuthType === 'basic'
                ? { username: authData.username, password: authData.password }
                : effectiveAuthType === 'apiKey'
                  ? {
                      key: authData.key,
                      value: authData.value,
                      addTo: authData.addTo,
                    }
                  : undefined,
        };

        const normalizedResponse = {
          requestId: activeRequest.id,
          status: statusCode ?? 200,
          statusCode: statusCode ?? 200,
          headers: responseHeaders ?? {},
          requestCurl: requestCurl ?? {},
          actualRequest,
          body: parsedBody,
          rawBody: backendBody,
          metrics: metrics ?? {},
          assertionLogs,
          schemaValidation,
        };

        setResponseData(normalizedResponse);

        if (
          existingExtractions &&
          existingExtractions.length > 0 &&
          activeCollection?.id
        ) {
          const body = normalizedResponse.body;

          existingExtractions.forEach((extraction) => {
            const isResponseBody =
              !extraction.source || extraction.source === 'response_body';

            if (isResponseBody && extraction.path) {
              try {
                const extractedValue = getValueByPath(body, extraction.path);

                if (extractedValue !== undefined && onExtractVariable) {
                  const variableName = extraction.name || 'E_token';

                  onExtractVariable({
                    variableName: variableName,
                    name: variableName,
                    source: 'response_body',
                    path: extraction.path,
                    value: String(extractedValue),
                  });

                  collectionActions.setExtractedVariable(
                    activeCollection.id,
                    variableName,
                    String(extractedValue),
                  );

                  const storageKey = `extracted_var_${activeCollection.id}_${variableName}`;

                  const isAuthToken =
                    variableName.toLowerCase().includes('token') ||
                    variableName.toLowerCase().includes('auth') ||
                    variableName.toLowerCase().includes('secret');

                  const payload = {
                    name: variableName,
                    value: String(extractedValue),
                    timestamp: Date.now(),
                    collectionId: activeCollection.id,
                    source: extraction.source,
                    path: extraction.path,
                  };

                  if (isAuthToken) {
                    secureStorage.saveEncrypted(storageKey, payload);
                  } else {
                    localStorage.setItem(storageKey, JSON.stringify(payload));
                  }

                  if (activeRequest?.id) {
                    collectionActions.setExtractedVariableRequest(
                      activeRequest.id,
                      variableName,
                      String(extractedValue),
                    );
                  }
                }
              } catch (error) {
                console.error('Error extracting variable:', error);
              }
            }
          });
        }
        if (activeRequest.id) {
          collectionActions.setRequestResponse(
            activeRequest.id,
            normalizedResponse,
          );
        }

        const formattedResponse = formatBackendResponse(normalizedResponse);
        const generatedAssertions = generateAssertions(formattedResponse);

        const assertionsMatch = (a: any, b: any) =>
          a.description === b.description &&
          a.category === b.category &&
          a.type === b.type &&
          a.operator === b.operator;

        const mergedAssertions = generatedAssertions.map((newA) => {
          const existing = assertions.find((ex) => assertionsMatch(ex, newA));
          if (existing) {
            return { ...newA, enabled: existing.enabled ?? true };
          }
          return { ...newA, enabled: false };
        });

        const preservedAssertions = assertions.filter((a) => {
          if (mergedAssertions.some((m) => assertionsMatch(m, a))) return false;

          const isDynamic = a.id && String(a.id).startsWith('dynamic-');
          const isManual = a.id && String(a.id).startsWith('manual-');
          const isCustomGroup = a.isCustom === true || a.group === 'custom';
          if (isDynamic) return true;
          if (isManual) return true;
          if (isCustomGroup) return true;

          return false;
        });

        setAssertions([...mergedAssertions, ...preservedAssertions]);
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('abort')) {
        toast({
          title: 'Request Cancelled',
          description: 'The request was cancelled',
        });
        return;
      }

      const backendErrorMessage =
        error?.response?.data?.errorDetails ||
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        'An unknown error occurred.';
      const statusCode =
        error?.response?.status || error?.response?.data?.statusCode || 500;
      const responseHeaders = error?.response?.headers || {};
      const backendBody = error?.response?.data || backendErrorMessage;

      const normalizedResponse = {
        requestId: activeRequest.id,
        status: statusCode,
        statusCode,
        headers: responseHeaders,
        requestCurl: error?.response?.data?.requestCurl || {},
        actualRequest: {
          method,
          url: newUrl,
          headers: headers
            .filter((h) => h.enabled)
            .reduce(
              (acc, h) => {
                if (h.key) acc[h.key] = h.value;
                return acc;
              },
              {} as Record<string, string>,
            ),
          body: substitutedBodyContent
            ? (() => {
                try {
                  return JSON.parse(substitutedBodyContent);
                } catch {
                  return substitutedBodyContent;
                }
              })()
            : null,
        },

        body: backendBody,
        rawBody: backendBody,
        metrics: {},
        assertionLogs: [],
        schemaValidation: null,
      };

      setResponseData(normalizedResponse);

      if (activeRequest.id) {
        collectionActions.setRequestResponse(
          activeRequest.id,
          normalizedResponse,
        );
      }
      toast({
        title: 'Error',
        description: backendErrorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async (newName: string) => {
    try {
      if (!activeRequest) return;
      if (!newName.trim()) return;

      const isTempRequest = activeRequest.id?.startsWith('temp-');

      if (isTempRequest) {
        collectionActions.renameRequest(
          newName.trim(),
          activeRequest?.id || '',
          currentWorkspace?.id || '',
        );
      } else {
        await handleUpdateRequest(newName.trim());
      }
    } catch (error) {
      console.error('Error renaming request:', error);
      showError(
        'Rename Failed',
        'An error occurred while renaming the request.',
      );
    }
  };

  const handleSaveRequest = () => {
    if (!activeRequest) return;
    if (!url.trim()) {
      showError(
        'URL Required',
        'Please enter a URL before saving the request.',
      );
      return;
    }

    // setIsSaving(true);
    setUrlAtOpen(url);
    setShowSaveModal(true);
  };

  // Memoized event handlers to prevent unnecessary re-renders
  const handleTabClick = React.useCallback(
    (tabId: string) => {
      setActiveTab(tabId as any);
      onTabChange?.(tabId);
      if (tabId === 'schemas') {
        fetchSchemas();
      }
    },
    [onTabChange, fetchSchemas],
  );

  const handleCreateCollectionClick = React.useCallback(() => {
    setIsCreatingCollection(true);
  }, []);

  const handleCollectionSelectChange = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedId = e.target.value;
      if (selectedId === 'new') {
        setIsCreatingCollection(true);
      } else {
        const selectedColl = collections.find((c) => c.id === selectedId);
        if (selectedColl) {
          setSelectedCollectionId(selectedId);
          setActiveCollection(selectedColl);
          setIsCreatingCollection(false);
          setFolderOptions(
            selectedColl.folders?.map((f) => ({
              id: f.id,
              label: f.name,
            })) || [],
          );
        }
      }
    },
    [collections, setActiveCollection],
  );

  const handleFolderSelectChange = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedFolderId(e.target.value);
    },
    [],
  );

  const handleNewCollectionNameChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewCollectionName(e.target.value);
    },
    [],
  );

  const handleMethodChange = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newMethod = e.target.value as RequestMethod;
      setMethod(newMethod);

      const hasContentTypeHeader = headers.some(
        (h) => h.key === 'Content-Type',
      );
      if (methodsWithBody.includes(newMethod) && !hasContentTypeHeader) {
        setHeaders([
          {
            key: 'Content-Type',
            value: 'application/json',
            enabled: true,
          },
          ...headers,
        ]);
        setBodyType('raw');
        setBodyContent('{}');
      } else if (!methodsWithBody.includes(newMethod) && hasContentTypeHeader) {
        setHeaders(headers.filter((h) => h.key !== 'Content-Type'));
        setBodyType('raw');
        setBodyContent('{}');
      }

      if (activeRequest?.id) {
        collectionActions.updateOpenedRequest({
          ...activeRequest,
          method: newMethod,
        });
        collectionActions.markUnsaved(activeRequest.id);
      }
    },
    [activeRequest, headers],
  );

  const handleUrlChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newUrl = e.target.value;

      isExtractingRef.current = true;

      setUrl(newUrl);

      if (activeRequest?.id) {
        collectionActions.markUnsaved(activeRequest.id);
        collectionActions.updateOpenedRequest({
          ...activeRequest,
          url: newUrl,
        });
      }

      setTimeout(() => {
        try {
          const urlObj = new URL(newUrl);
          const searchParams = urlObj.searchParams;

          const extractedParams: Param[] = [];
          searchParams.forEach((value, key) => {
            extractedParams.push({ key, value, enabled: true });
          });

          setParams(extractedParams);
          if (activeRequest?.id) {
            collectionActions.markUnsaved(activeRequest.id);
          }
        } catch (error) {
          const queryIndex = newUrl.indexOf('?');
          if (queryIndex !== -1) {
            const queryString = newUrl.substring(queryIndex + 1);
            const searchParams = new URLSearchParams(queryString);
            const extractedParams: Param[] = [];

            searchParams.forEach((value, key) => {
              extractedParams.push({ key, value, enabled: true });
            });

            setParams(extractedParams);
            if (activeRequest?.id) {
              collectionActions.markUnsaved(activeRequest.id);
            }
          } else {
            if (!newUrl.includes('?')) {
              setParams([]);
            }
          }
        }

        setTimeout(() => {
          isExtractingRef.current = false;
        }, 150);
      }, 0);
    },
    [activeRequest, setUrl, setParams],
  );

  const handleUpdateRequest = async (overrideName?: string) => {
    try {
      console.log('coming to handle update method');

      setIsSaving(true);
      if (!activeRequest || activeRequest.id?.startsWith('temp-')) {
        showError(
          'Invalid Request',
          'Cannot update a temporary request. Please save it first.',
        );
        return;
      }

      if (!url.trim()) {
        showError(
          'URL Required',
          'Please enter a URL before saving the request.',
        );
        return;
      }

      if (activeCollection) {
        await fetchCollectionRequests.mutateAsync(activeCollection.id);
      }

      let effectiveAuthType = authType;

      if (
        authData?.token &&
        authData.token.trim() !== '' &&
        (!authType || authType === 'none')
      ) {
        effectiveAuthType = 'bearer';
      }

      if (!authData?.token || authData.token.trim() === '') {
        effectiveAuthType = 'none';
      }

      const selectedAssertions = Array.isArray(assertions)
        ? assertions
            .filter((assertion) => assertion.enabled)
            .map((assertion) => ({
              ...assertion,
              requestId: activeRequest.id,
              expectedValue:
                assertion.expectedValue !== undefined &&
                assertion.expectedValue !== null
                  ? typeof assertion.expectedValue === 'string'
                    ? assertion.expectedValue
                    : JSON.stringify(assertion.expectedValue)
                  : '',
            }))
        : [];

      const effectiveFolderId =
        activeRequest?.folderId || selectedFolderId || undefined;

      const requestData: any = {
        workspaceId: currentWorkspace?.id,
        description: '',
        name: overrideName || activeRequest.name || 'New Request',
        method,
        url,
        ...(effectiveFolderId ? { folderId: effectiveFolderId } : {}),
        bodyType: bodyType,
        bodyFormData:
          bodyType === 'form-data'
            ? formFields
                .filter((f) => f.enabled)
                .reduce((acc: Record<string, any>, field) => {
                  if (field.key) {
                    if (field.type === 'file' && field.value instanceof File) {
                      acc[field.key] = field.value;
                    } else {
                      acc[field.key] = String(field.value);
                    }
                  }
                  return acc;
                }, {})
            : [],
        bodyRawContent:
          bodyType === 'raw' || bodyType === 'json'
            ? bodyContent
            : bodyType === 'x-www-form-urlencoded'
              ? new URLSearchParams(
                  urlEncodedFields
                    .filter((f) => f.enabled)
                    .reduce(
                      (acc, field) => {
                        if (field.key) acc[field.key] = field.value;
                        return acc;
                      },
                      {} as Record<string, string>,
                    ),
                ).toString()
              : '',
        authorizationType: effectiveAuthType,
        authorization: {
          token: authData.token,
          username: effectiveAuthType === 'basic' ? authData.username : '',
          password: effectiveAuthType === 'basic' ? authData.password : '',
          key: effectiveAuthType === 'apiKey' ? authData.key : '',
          value: effectiveAuthType === 'apiKey' ? authData.value : '',
          addTo: effectiveAuthType === 'apiKey' ? authData.addTo : 'header',
          oauth1:
            effectiveAuthType === 'oauth1'
              ? {
                  consumerKey: authData.oauth1.consumerKey,
                  consumerSecret: authData.oauth1.consumerSecret,
                  token: authData.oauth1.token,
                  tokenSecret: authData.oauth1.tokenSecret,
                  signatureMethod: authData.oauth1.signatureMethod,
                  version: '1.0',
                  realm: authData.oauth1.realm,
                  nonce: authData.oauth1.nonce,
                  timestamp: authData.oauth1.timestamp,
                }
              : undefined,
          oauth2:
            effectiveAuthType === 'oauth2'
              ? {
                  clientId: authData.oauth2.clientId,
                  clientSecret: authData.oauth2.clientSecret,
                  accessToken: authData.oauth2.accessToken,
                  tokenType: authData.oauth2.tokenType,
                  refreshToken: authData.oauth2.refreshToken,
                  scope: authData.oauth2.scope,
                  grantType: authData.oauth2.grantType,
                  redirectUri: authData.oauth2.redirectUri,
                }
              : undefined,
        },
        params,
        headers: headers.filter((h) => h.enabled),
        assertions: selectedAssertions,
      };

      if (selectedVariable && selectedVariable.length > 0) {
        requestData.variable = selectedVariable;
      }
      if (existingExtractions.length > 0) {
        requestData.extractVariables = existingExtractions;
      }
      if (!activeRequest.id) {
        showError('Missing ID', 'Cannot update a request without an id.');
        return;
      }

      await updateRequestMutation.mutateAsync({
        requestId: activeRequest.id,
        requestData,
      });

      if (overrideName) {
        setActiveRequest({
          ...activeRequest,
          name: overrideName,
        });
        collectionActions.updateOpenedRequest({
          ...activeRequest,
          name: overrideName,
        });
      }

      collectionActions.markSaved(activeRequest.id);

      toast({
        title: overrideName
          ? 'Request renamed successfully!'
          : 'Request updated successfully!',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating request:', error);
      showError('Save Failed', 'An error occurred while saving the request.');
      setError({
        title: 'Save Failed',
        description: 'An error occurred while saving the request.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmSave = async () => {
    try {
      setIsSaving(true);
      if (!activeRequest || !currentWorkspace) return;

      if (!urlAtOpen.trim()) {
        showError(
          'URL Required',
          'Please enter a URL before saving the request.',
        );
        return;
      }

      let createdCollectionId: string | null = null;

      if (isCreatingCollection && newCollectionName.trim()) {
        const res = await addCollectionMutation.mutateAsync({
          name: newCollectionName.trim(),
          workspaceId: currentWorkspace.id,
          isImportant: false,
        });

        if (res?.collectionId) {
          createdCollectionId = res.collectionId;
          setSelectedCollectionId(res.collectionId);
        }
      }

      if (
        !selectedCollectionId &&
        (!isCreatingCollection || !newCollectionName.trim())
      ) {
        showError(
          'Collection Required',
          'Please select or create a collection to save the request.',
        );
        return;
      }

      const targetCollectionId = createdCollectionId || selectedCollectionId;

      if (targetCollectionId) {
        await fetchCollectionRequests.mutateAsync(targetCollectionId);
      }

      let effectiveAuthType = authType;
      if (authData?.token && (!authType || authType === 'none')) {
        effectiveAuthType = 'bearer';
      }

      const selectedAssertions = Array.isArray(assertions)
        ? assertions.filter((a) => a.enabled)
        : [];

      const requestData: any = {
        workspaceId: currentWorkspace.id,
        collectionId: targetCollectionId,
        ...(selectedFolderId ? { folderId: selectedFolderId } : {}),
        description: '',
        name: activeRequest.name || 'New Request',
        method,
        url: urlAtOpen,
        bodyType: bodyType,
        bodyFormData:
          bodyType === 'form-data'
            ? formFields
                .filter((f) => f.enabled)
                .reduce((acc: Record<string, any>, field) => {
                  if (field.key) {
                    if (field.type === 'file' && field.value instanceof File) {
                      acc[field.key] = field.value;
                    } else {
                      acc[field.key] = String(field.value);
                    }
                  }
                  return acc;
                }, {})
            : [],
        bodyRawContent:
          bodyType === 'raw' || bodyType === 'json'
            ? bodyContent
            : bodyType === 'x-www-form-urlencoded'
              ? new URLSearchParams(
                  urlEncodedFields
                    .filter((f) => f.enabled)
                    .reduce(
                      (acc, field) => {
                        if (field.key) acc[field.key] = field.value;
                        return acc;
                      },
                      {} as Record<string, string>,
                    ),
                ).toString()
              : '',
        authorizationType: effectiveAuthType,
        authorization: requestDataAuthorization(effectiveAuthType, authData),
        params,
        headers,
        assertions: selectedAssertions,
        ...(selectedVariable && selectedVariable.length > 0
          ? { variable: selectedVariable }
          : {}),
        extractVariables:
          existingExtractions.length > 0 ? existingExtractions : [],
      };

      const savedRequestResponse =
        await addRequestMutation.mutateAsync(requestData);

      if (
        savedRequestResponse &&
        (savedRequestResponse.id || savedRequestResponse.requestId)
      ) {
        const newId = savedRequestResponse.id || savedRequestResponse.requestId;
        const oldRequestId = activeRequest.id;

        const updatedRequest = {
          ...activeRequest,
          id: newId,
          collectionId: targetCollectionId,
          ...(selectedFolderId ? ({ folderId: selectedFolderId } as any) : {}),
          name: activeRequest.name || 'New Request',
          method,
          url: urlAtOpen,
          bodyType,
          bodyRawContent: bodyContent,
          bodyFormData:
            bodyType === 'form-data' ? formFields.filter((f) => f.enabled) : [],
          authorizationType: effectiveAuthType,
          authorization: requestData.authorization,
          params,
          headers,
          ...(selectedVariable ? { variable: selectedVariable } : {}),
        };
        replaceRequest(oldRequestId || '', updatedRequest);
        setActiveRequest(updatedRequest);

        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      setShowSaveModal(false);
      setNewCollectionName('');
      setIsCreatingCollection(false);

      showSuccess('Request saved successfully!');
    } catch (error) {
      console.error('Error saving request:', error);
      showError('Save Failed', 'An error occurred while saving the request.');
      setError({
        title: 'Save Failed',
        description: 'An error occurred while saving the request.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateContentRequest = async () => {
    try {
      setIsSaving(true);
      if (!activeRequest || activeRequest.id?.startsWith('temp-')) {
        showError(
          'Invalid Request',
          'Cannot update a temporary request. Please save it first.',
        );
        return;
      }
      if (!url.trim()) {
        showError(
          'URL Required',
          'Please enter a URL before saving the request.',
        );
        return;
      }

      if (activeCollection) {
        await fetchCollectionRequests.mutateAsync(activeCollection.id);
      }

      let effectiveAuthType = authType;

      if (
        authData?.token &&
        authData.token.trim() !== '' &&
        (!authType || authType === 'none')
      ) {
        effectiveAuthType = 'bearer';
      }

      if (!authData?.token || authData.token.trim() === '') {
        effectiveAuthType = 'none';
      }

      const selectedAssertions = Array.isArray(assertions)
        ? assertions
            .filter((assertion) => assertion.enabled)
            .map((assertion) => ({
              ...assertion,
              requestId: activeRequest.id,
              expectedValue:
                assertion.expectedValue !== undefined &&
                assertion.expectedValue !== null
                  ? typeof assertion.expectedValue === 'string'
                    ? assertion.expectedValue
                    : JSON.stringify(assertion.expectedValue)
                  : '',
            }))
        : [];

      const effectiveFolderId =
        activeRequest?.folderId || selectedFolderId || undefined;

      const requestData: any = {
        workspaceId: currentWorkspace?.id,
        description: '',
        name: activeRequest.name || 'New Request',
        method,
        url,
        ...(effectiveFolderId ? { folderId: effectiveFolderId } : {}),
        bodyType: bodyType,
        bodyFormData:
          bodyType === 'form-data'
            ? formFields
                .filter((f) => f.enabled)
                .reduce((acc: Record<string, any>, field) => {
                  if (field.key) {
                    if (field.type === 'file' && field.value instanceof File) {
                      acc[field.key] = field.value;
                    } else {
                      acc[field.key] = String(field.value);
                    }
                  }
                  return acc;
                }, {})
            : [],
        bodyRawContent:
          bodyType === 'raw' || bodyType === 'json'
            ? bodyContent
            : bodyType === 'x-www-form-urlencoded'
              ? new URLSearchParams(
                  urlEncodedFields
                    .filter((f) => f.enabled)
                    .reduce(
                      (acc, field) => {
                        if (field.key) acc[field.key] = field.value;
                        return acc;
                      },
                      {} as Record<string, string>,
                    ),
                ).toString()
              : '',
        authorizationType: effectiveAuthType,
        authorization: {
          token: authData.token,
          username: effectiveAuthType === 'basic' ? authData.username : '',
          password: effectiveAuthType === 'basic' ? authData.password : '',
          key: effectiveAuthType === 'apiKey' ? authData.key : '',
          value: effectiveAuthType === 'apiKey' ? authData.value : '',
          addTo: effectiveAuthType === 'apiKey' ? authData.addTo : 'header',
          oauth1:
            effectiveAuthType === 'oauth1'
              ? {
                  consumerKey: authData.oauth1.consumerKey,
                  consumerSecret: authData.oauth1.consumerSecret,
                  token: authData.oauth1.token,
                  tokenSecret: authData.oauth1.tokenSecret,
                  signatureMethod: authData.oauth1.signatureMethod,
                  version: '1.0',
                  realm: authData.oauth1.realm,
                  nonce: authData.oauth1.nonce,
                  timestamp: authData.oauth1.timestamp,
                }
              : undefined,
          oauth2:
            effectiveAuthType === 'oauth2'
              ? {
                  clientId: authData.oauth2.clientId,
                  clientSecret: authData.oauth2.clientSecret,
                  accessToken: authData.oauth2.accessToken,
                  tokenType: authData.oauth2.tokenType,
                  refreshToken: authData.oauth2.refreshToken,
                  scope: authData.oauth2.scope,
                  grantType: authData.oauth2.grantType,
                  redirectUri: authData.oauth2.redirectUri,
                }
              : undefined,
        },
        params,
        headers: headers.filter((h) => h.enabled),
        assertions: selectedAssertions,
        extractVariables:
          existingExtractions.length > 0 ? existingExtractions : [],
      };
      if (selectedVariable && selectedVariable.length > 0) {
        requestData.variable = selectedVariable;
      }
      if (!activeRequest.id) {
        showError('Missing ID', 'Cannot update a request without an id.');
        return;
      }

      await updateRequestMutation.mutateAsync({
        requestId: activeRequest.id,
        requestData,
      });

      collectionActions.markSaved(activeRequest.id);

      toast({
        title: 'Request updated successfully!',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating request:', error);
      showError('Save Failed', 'An error occurred while saving the request.');
      setError({
        title: 'Save Failed',
        description: 'An error occurred while saving the request.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  function requestDataAuthorization(type: string, authData: any) {
    return {
      token: authData.token,
      username: type === 'basic' ? authData.username : '',
      password: type === 'basic' ? authData.password : '',
      key: type === 'apiKey' ? authData.key : '',
      value: type === 'apiKey' ? authData.value : '',
      addTo: type === 'apiKey' ? authData.addTo : 'header',
      oauth1:
        type === 'oauth1'
          ? {
              consumerKey: authData.oauth1.consumerKey,
              consumerSecret: authData.oauth1.consumerSecret,
              token: authData.oauth1.token,
              tokenSecret: authData.oauth1.tokenSecret,
              signatureMethod: authData.oauth1.signatureMethod,
              version: '1.0',
              realm: authData.oauth1.realm,
              nonce: authData.oauth1.nonce,
              timestamp: authData.oauth1.timestamp,
            }
          : undefined,
      oauth2:
        type === 'oauth2'
          ? {
              clientId: authData.oauth2.clientId,
              clientSecret: authData.oauth2.clientSecret,
              accessToken: authData.oauth2.accessToken,
              tokenType: authData.oauth2.tokenType,
              refreshToken: authData.oauth2.refreshToken,
              scope: authData.oauth2.scope,
              grantType: authData.oauth2.grantType,
              redirectUri: authData.oauth2.redirectUri,
            }
          : undefined,
    };
  }

  const substituteVariables = (text: string): string => {
    let result = text;
    variables.forEach((variable) => {
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      result = result.replace(regex, variable.initialValue);
    });
    return result;
  };

  const buildFinalUrl = (): string => {
    if (!url) return '';

    if (
      activeEnvironment?.name === 'No Environment' ||
      !activeEnvironment?.baseUrl
    ) {
      return url;
    }

    let finalUrl = url;

    finalUrl = substituteVariables(finalUrl);

    const envBaseUrl = activeEnvironment.baseUrl.replace(/\/$/, '');

    try {
      const originalUrl = new URL(finalUrl);
      const pathAndQuery =
        originalUrl.pathname + originalUrl.search + originalUrl.hash;

      finalUrl = `${envBaseUrl}${pathAndQuery}`;
    } catch (error) {
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = finalUrl.startsWith('/') ? finalUrl : `/${finalUrl}`;
        finalUrl = `${envBaseUrl}${finalUrl}`;
      }
    }

    return finalUrl;
  };

  const previewUrl = buildFinalUrl();

  const handleCancelSave = () => {
    setShowSaveModal(false);
  };

  const addFormField = () => {
    setFormFields([
      ...formFields,
      { key: '', value: '', enabled: true, type: 'text' },
    ]);
    if (activeRequest?.id) {
      collectionActions.markUnsaved(activeRequest.id);
    }
  };

  const updateFormField = (
    index: number,
    field: keyof KeyValuePairWithFile,
    value: string | boolean | File | undefined,
  ) => {
    const newFormFields = [...formFields];
    newFormFields[index] = { ...newFormFields[index], [field]: value };
    setFormFields(newFormFields);
    if (activeRequest?.id) {
      collectionActions.markUnsaved(activeRequest.id);
    }
  };

  const removeFormField = (index: number) => {
    setFormFields(formFields.filter((_, i) => i !== index));
    if (activeRequest?.id) {
      collectionActions.markUnsaved(activeRequest.id);
    }
  };

  const addUrlEncodedField = () => {
    setUrlEncodedFields([
      ...urlEncodedFields,
      {
        key: '',
        value: '',
        enabled: true,
      },
    ]);
    if (activeRequest?.id) {
      collectionActions.markUnsaved(activeRequest.id);
    }
  };

  const updateUrlEncodedField = (
    index: number,
    field: keyof Param,
    value: string | boolean,
  ) => {
    const newUrlEncodedFields = [...urlEncodedFields];
    newUrlEncodedFields[index] = {
      ...newUrlEncodedFields[index],
      [field]: value,
    };
    setUrlEncodedFields(newUrlEncodedFields);
    if (activeRequest?.id) {
      collectionActions.markUnsaved(activeRequest.id);
    }
  };

  const removeUrlEncodedField = (index: number) => {
    setUrlEncodedFields(urlEncodedFields.filter((_, i) => i !== index));
    if (activeRequest?.id) {
      collectionActions.markUnsaved(activeRequest.id);
    }
  };

  const handleConfirmSubstitutions = (substitutions: PendingSubstitution[]) => {
    const lines = bodyContent.split('\n');
    let updatedContent = bodyContent;

    substitutions.forEach((sub) => {
      if (lines[sub.lineIndex]) {
        const line = lines[sub.lineIndex];
        const updatedLine = `${line} // substituted with {{${sub.variableName}}}`;
        updatedContent = updatedContent.replace(line, updatedLine);
      }
    });

    setBodyContent(updatedContent);
    setPendingSubstitutions([]);
    if (activeRequest?.id) {
      collectionActions.markUnsaved(activeRequest.id);
    }
  };

  const handleBeautifyBody = () => {
    try {
      if (bodyType === 'json' || bodyType === 'raw') {
        const parsed = JSON.parse(bodyContent);
        const beautified = JSON.stringify(parsed, null, 2);
        setBodyContent(beautified);
        if (activeRequest?.id) {
          collectionActions.markUnsaved(activeRequest.id);
        }
      }
    } catch (error) {
      showError(
        'Invalid JSON',
        'Unable to format. Please check your JSON syntax.',
      );
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter - Send Request
      if (e.key === 'Enter' && isModifierPressed(e)) {
        e.preventDefault();
        if (!isLoading && activeRequest) {
          handleSendRequest();
        }
        return;
      }

      // Cmd/Ctrl + S - Save Request
      if (e.key === 's' && isModifierPressed(e)) {
        e.preventDefault();
        if (activeRequest && !activeRequest.id?.startsWith('temp-')) {
          handleUpdateRequest();
        }
        return;
      }

      // Escape - Cancel Request
      if (e.key === 'Escape' && isLoading) {
        e.preventDefault();
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          toast({
            title: 'Request Cancelled',
            description: 'The request was cancelled by keyboard shortcut',
          });
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, activeRequest, handleSendRequest, handleUpdateRequest, toast]);

  const methods: RequestMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  const handleVariableSelect = (variables: SelectedVariable[]) => {
    setSelectedVariable(variables);
    if (activeRequest) {
      collectionActions.markUnsaved(activeRequest.id);
    }
  };

  const handleRemoveVariable = (path: string) => {
    setSelectedVariable((prev) => prev.filter((v) => v.path !== path));
    if (activeRequest?.id) {
      collectionActions.markUnsaved(activeRequest.id);
    }
  };

  const getValueByPath = (obj: any, path: string): any => {
    if (!obj || !path) return undefined;

    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object') {
        if (key.includes('[') && key.includes(']')) {
          const arrayKey = key.substring(0, key.indexOf('['));
          const index = Number.parseInt(
            key.substring(key.indexOf('[') + 1, key.indexOf(']')),
          );
          if (current[arrayKey] && Array.isArray(current[arrayKey])) {
            return current[arrayKey][index];
          }
          return undefined;
        }
        return current[key];
      }
      return undefined;
    }, obj);
  };

  if (!activeRequest) {
    return (
      <div className='flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4'>
        <div className='text-center'>
          <p className='text-gray-500 dark:text-gray-400 mb-4'>
            No request selected
          </p>
          <p className='text-sm text-gray-400 mb-6'>
            Select a request from the sidebar or{' '}
            <button
              onClick={(e: React.MouseEvent) => onCreateRequest()}
              className='text-blue-600 hover:text-blue-700 font-medium underline focus:outline-none'
            >
              Create Request
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className='flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden'>
        <div className='sticky top-0 -z-1 md:z-30 bg-white dark:bg-gray-900'>
          <RequestTabs
            onBeforeTabChange={syncCurrentRequestToStore}
            onSaveRequest={async (request) => {
              if (isNewRequest(activeRequest.id)) {
                handleSaveRequest();
              } else {
                await handleUpdateContentRequest();
              }
            }}
            onCurlImport={handleCurlImport}
          />

          <div className='border-gray-200 dark:border-gray-700 px-4 pt-3 flex-shrink-0'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center text-sm space-x-1'>
                <span className='text-xs md:text-sm text-gray-500 dark:text-gray-400'>
                  {activeCollectionFull?.name}
                </span>
                <span className='text-xs md:text-sm text-gray-500 dark:text-gray-400'>
                  /
                </span>

                {activeRequest?.folderId && (
                  <>
                    <span className='text-xs md:text-sm text-gray-500 dark:text-gray-400'>
                      {findFolderName(
                        activeRequest.folderId,
                        (activeCollectionFull as any)?.folders || [],
                      )}
                    </span>
                    <span className='text-xs md:text-sm text-gray-500 dark:text-gray-400'>
                      /
                    </span>
                  </>
                )}

                <div className='flex items-center gap-1'>
                  <EditableTextWithoutIcon
                    value={activeRequest.name || ''}
                    onSave={handleSaveName}
                    placeholder='Request Name'
                    fontSize='xs'
                    fontWeight='medium'
                  />

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type='button'
                          className='p-1 text-gray-500 hover:text-[rgb(19,111,176)] transition-colors'
                        >
                          <Info className='w-3.5 h-3.5' />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Double click to Rename</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <div className='flex items-center gap-1.5'>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className={`text-xs md:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap cursor-pointer ${
                          !hasPreRequestConfigured || isCurrentRequestPreRequest
                            ? 'opacity-50'
                            : ''
                        }`}
                      >
                        <Key className='w-3.5 h-3.5 inline-block mr-0.5' />
                        Auto Auth Sync
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isCurrentRequestPreRequest
                        ? 'This is the pre-request - token usage is always enabled'
                        : !hasPreRequestConfigured
                          ? 'Configure Auto‑Auth for a Collection'
                          : preRequestEnabled
                            ? 'Disable Auto‑Auth to provide authentication manually'
                            : 'Turn on Auto‑Auth sync'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div
                  className={
                    !hasPreRequestConfigured || isCurrentRequestPreRequest
                      ? 'opacity-50 pointer-events-none'
                      : ''
                  }
                >
                  <ToggleSwitch
                    id='preRequestAuth'
                    checked={
                      isCurrentRequestPreRequest ? true : preRequestEnabled
                    }
                    onChange={handlePreRequestToggle}
                    label=''
                    description=''
                    disabled={
                      !hasPreRequestConfigured || isCurrentRequestPreRequest
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='border-gray-200 dark:border-gray-700 px-4 pt-4 flex-shrink-0'>
          <div className='flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2'>
            <select
              value={method}
              onChange={handleMethodChange}
              className={`w-full sm:w-auto border rounded-md pl-3 pr-0 py-2 text-sm font-medium hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-150 ${getMethodColor(
                method,
              )}`}
              style={{
                appearance: 'auto',
              }}
            >
              {methods.map((m) => (
                <option
                  key={m}
                  value={m}
                  className='bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200'
                >
                  {m}
                </option>
              ))}
            </select>

            <Input
              type='text'
              value={url}
              onChange={handleUrlChange}
              placeholder='Enter request URL'
              className='text-xs md:text-md'
            />

            <div className='justify-end flex space-x-2'>
              {isLoading ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='outline'
                        onClick={() => {
                          if (abortControllerRef.current) {
                            abortControllerRef.current.abort();
                            toast({
                              title: 'Cancelling...',
                              description: 'Request cancellation initiated',
                            });
                          }
                        }}
                        className='border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 sm:px-6 py-2 rounded-md flex items-center space-x-2 transition-colors whitespace-nowrap'
                        aria-label='Cancel request'
                      >
                        <svg
                          className='h-4 w-4'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M6 18L18 6M6 6l12 12'
                          />
                        </svg>
                        <span className='hidden sm:inline'>Cancel</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Cancel ({shortcuts.CANCEL_REQUEST.format()})
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='active'
                        onClick={handleSendRequest}
                        disabled={isLoading}
                        className='disabled:bg-blue-400 text-white px-4 sm:px-6 py-2 rounded-md flex items-center space-x-2 transition-colors whitespace-nowrap'
                        aria-label='Send request'
                      >
                        <Play className='h-4 w-4' />
                        <span className='hidden sm:inline'>Send</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Send Request ({shortcuts.SEND_REQUEST.format()})
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {isNewRequest(activeRequest.id) ? (
                      <button
                        onClick={handleSaveRequest}
                        disabled={isSaving}
                        className='border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed'
                        aria-label='Save request'
                      >
                        {isSaving ? (
                          <Loader2 className='h-4 w-4 text-[#136fb0] animate-spin' />
                        ) : (
                          <Save className='h-4 w-4 text-[#136fb0]' />
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleUpdateContentRequest}
                        disabled={isSaving}
                        className='border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed'
                        aria-label='Update request'
                      >
                        {isSaving ? (
                          <Loader2 className='h-4 w-4 text-[#136fb0] animate-spin' />
                        ) : (
                          <Save className='h-4 w-4 text-[#136fb0]' />
                        )}
                      </button>
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    {isNewRequest(activeRequest.id) ? 'Save' : 'Update'} Request
                    ({shortcuts.SAVE_REQUEST.format()})
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* <TooltipContainer text='Performance Test'>
                // {isNewRequest(activeRequest.id) ? (
                  <button
                    // onClick={handleSaveRequest}
                    className='border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-md'
                    aria-label='Performance Test'
                  >
                    <Rocket className='h-4 w-4 text-[#136fb0]' />
                  </button>
                ) : (
                  <button
                    className='border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-md'
                    aria-label='Performance Test'
                  >
                    <Rocket className='h-4 w-4 text-[#136fb0]' />
                  </button>
                )}
              </TooltipContainer> */}
            </div>
          </div>

          {previewUrl && activeEnvironment?.name !== 'No Environment' && (
            <div className='mt-2 mb-1'>
              <div className='bg-gray-50 dark:bg-gray-800 rounded px-3 py-2 flex gap-2  items-center'>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  <span className='font-medium'>Final URL Preview:</span>
                </p>
                <p className='text-sm text-blue-600 dark:text-blue-400 font-mono break-all'>
                  {previewUrl}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className='border-b border-gray-200 dark:border-gray-700 flex-shrink-0'>
          <nav className='flex overflow-x-auto scrollbar-thin px-4'>
            <TooltipProvider>
              {[
                {
                  id: 'params',
                  label: 'Params',
                  count: params.filter((p) => p.enabled).length,
                },
                {
                  id: 'headers',
                  label: 'Headers',
                  count: headers.filter((h) => h.enabled).length,
                },
                { id: 'body', label: 'Body', count: getBodyCount() },
                { id: 'auth', label: 'Auth', count: getAuthCount() },
                { id: 'pre-request', label: 'Pre-request', count: 0 },
                { id: 'post-response', label: 'Post-response', count: 0 },
                {
                  id: 'schemas',
                  label: 'Schemas',
                  count: Array.isArray(schemas) ? schemas.length : 0,
                },
                { id: 'settings', label: 'Settings' },
              ].map((tab) => {
                const button = (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`
              pt-4 pb-2 px-2 sm:px-4 border-b-2 font-medium text-xs md:text-sm transition-colors whitespace-nowrap
              ${
                activeTab === tab.id
                  ? 'border-[#136fb0] text-[#136fb0]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
                  >
                    {tab.label}

                    {(tab.id === 'auth' ||
                      tab.id === 'body' ||
                      tab.id === 'schemas') &&
                      (tab.count ?? 0) > 0 && (
                        <span
                          className='ml-1 inline-block w-1.5 h-1.5 rounded-full'
                          style={{
                            backgroundColor:
                              'rgb(19 111 176 / var(--tw-bg-opacity, 1))',
                          }}
                        />
                      )}

                    {tab.id !== 'auth' &&
                      tab.id !== 'body' &&
                      tab.id !== 'schemas' &&
                      tab.count !== undefined &&
                      tab.count > 0 && (
                        <span className='ml-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5 text-xs'>
                          {tab.count}
                        </span>
                      )}
                  </button>
                );

                if (tab.id === 'post-response') {
                  return (
                    <Tooltip key={tab.id}>
                      <TooltipTrigger asChild>{button}</TooltipTrigger>
                      <TooltipContent>
                        Manage assertions and extracted variable
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return button;
              })}
            </TooltipProvider>
          </nav>
        </div>

        <div className='flex-1 overflow-auto scrollbar-thin p-4'>
          {activeTab === 'params' && (
            <ParamsTab
              params={params}
              setParams={setParams}
              activeRequestId={activeRequest?.id}
            />
          )}

          {activeTab === 'headers' && (
            <HeadersTab
              headers={headers}
              setHeaders={setHeaders}
              activeRequestId={activeRequest?.id}
            />
          )}
          {activeTab === 'body' && (
            <RequestBody
              bodyType={bodyType}
              bodyContent={bodyContent}
              formFields={formFields}
              urlEncodedFields={urlEncodedFields}
              headers={headers}
              method={method}
              staticVariables={staticVars}
              dynamicVariables={dynamicVars}
              initialVariable={selectedVariable}
              showSubstituteButton={true}
              onBodyTypeChange={(newBodyType) => {
                setBodyType(newBodyType);

                if (newBodyType !== 'none') {
                  const contentTypeValue =
                    getContentTypeForBodyType(newBodyType);
                  const contentTypeHeaderIndex = headers.findIndex(
                    (h) => h.key.toLowerCase() === 'content-type',
                  );

                  if (contentTypeHeaderIndex !== -1) {
                    const updatedHeaders = [...headers];
                    updatedHeaders[contentTypeHeaderIndex] = {
                      ...updatedHeaders[contentTypeHeaderIndex],
                      value: contentTypeValue,
                    };
                    setHeaders(updatedHeaders);
                  } else if (methodsWithBody.includes(method)) {
                    setHeaders([
                      {
                        key: 'Content-Type',
                        value: contentTypeValue,
                        enabled: true,
                      },
                      ...headers,
                    ]);
                  }
                }

                if (activeRequest?.id) {
                  collectionActions.markUnsaved(activeRequest.id);
                }
              }}
              onBodyContentChange={(newContent) => {
                setBodyContent(newContent);
                if (activeRequest?.id) {
                  collectionActions.markUnsaved(activeRequest.id);
                  collectionActions.updateOpenedRequest({
                    ...activeRequest,
                    bodyRawContent: newContent,
                    bodyType,
                  });
                }
              }}
              onBeautify={handleBeautifyBody}
              onVariableSelect={handleVariableSelect}
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
            <AuthTab
              authData={authData}
              setAuthData={setAuthData}
              authType={authType}
              preRequestEnabled={preRequestEnabled}
              isCurrentRequestPreRequest={isCurrentRequestPreRequest}
              activeRequestId={activeRequest?.id}
              activeRequest={activeRequest}
            />
          )}
          {activeTab === 'pre-request' && (
            <Suspense fallback={<TabLoader />}>
              <PrePostRequest
                type='pre-request'
                assertions={assertions}
                setAssertions={setAssertions}
                responseData={responseData}
                activeRequest={activeRequest}
                currentWorkspace={currentWorkspace}
                updateRequestMutation={updateRequestMutation}
                toggleAssertion={toggleAssertion}
                showAssertions={false}
                selectedVariables={selectedVariable}
                onRemoveVariable={handleRemoveVariable}
                onVariableSelect={handleVariableSelect}
                onSaveAssertions={handleUpdateRequest}
                staticVariables={usedVariables.staticVars}
                dynamicVariables={usedVariables.dynamicVars}
              />
            </Suspense>
          )}
          {activeTab === 'post-response' && (
            <Suspense fallback={<TabLoader />}>
              <PrePostRequest
                type='post-response'
                assertions={assertions}
                setAssertions={setAssertions}
                responseData={responseData}
                activeRequest={activeRequest}
                currentWorkspace={currentWorkspace}
                updateRequestMutation={updateRequestMutation}
                toggleAssertion={toggleAssertion}
                showAssertions={true}
                selectedVariables={selectedVariable}
                onRemoveVariable={handleRemoveVariable}
                onVariableSelect={handleVariableSelect}
                onSaveAssertions={handleUpdateRequest}
                staticVariables={usedVariables.staticVars}
                dynamicVariables={usedVariables.dynamicVars}
                extractedVariables={requestSpecificExtractedVariables}
                onRemoveExtraction={(variableName) => {
                  if (activeRequest?.id) {
                    collectionActions.removeExtractedVariableRequest(
                      activeRequest.id,
                      variableName,
                    );
                  }
                  if (activeCollection?.id) {
                    localStorage.removeItem(
                      `extracted_var_${activeCollection.id}_${variableName}`,
                    );
                  }
                  if (activeRequest?.id) {
                    collectionActions.markUnsaved(activeRequest.id);
                  }
                  if (onRemoveExtraction) {
                    onRemoveExtraction(variableName);
                  }
                }}
              />
            </Suspense>
          )}
          {activeTab === 'settings' && (
            <SettingsTab settings={settings} setSettings={setSettings} />
          )}
          {activeTab === 'performance' && (
            <Suspense fallback={<TabLoader />}>
              <PerformanceTab
                settings={settings}
                setSettings={setSettings}
                performanceTestId={performanceTestId}
                onCreatePerformanceTest={handleCreatePerformanceTest}
                isCreatePending={performanceTestCreateMutation.isPending}
                isUpdatePending={performanceTestUpdateMutation.isPending}
                onSaveGeneralSettings={() => {
                  toast({
                    title: 'Settings Saved',
                    description:
                      'Your request settings have been saved successfully.',
                    duration: 3000,
                  });
                }}
              />
            </Suspense>
          )}
          {activeTab === 'schemas' && (
            <div>
              <Suspense fallback={<TabLoader />}>
                <SchemaPage />
              </Suspense>
            </div>
          )}
        </div>

        <Modal
          isOpen={showSaveModal}
          onClose={handleCancelSave}
          title='Save Request'
          footer={
            <div className='flex justify-end space-x-3'>
              <button
                onClick={handleCancelSave}
                className='px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md'
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={
                  isSaving ||
                  (!selectedCollectionId &&
                    (!isCreatingCollection || !newCollectionName.trim()))
                }
                className='px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md flex items-center gap-2' // ← ADD flex items-center gap-2
              >
                {isSaving ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          }
        >
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Save to Collection
            </label>

            {!isCreatingCollection ? (
              <div className='space-y-2'>
                <select
                  value={selectedCollectionId}
                  onChange={(e) => {
                    setSelectedCollectionId(e.target.value);
                  }}
                  className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-all duration-150'
                >
                  <option value=''>Select a collection</option>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                    </option>
                  ))}
                </select>

                {selectedCollectionId && (
                  <div className='space-y-1'>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Folder (optional)
                    </label>
                    <select
                      value={selectedFolderId}
                      onChange={handleFolderSelectChange}
                      className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-all duration-150'
                    >
                      <option value=''>No folder</option>
                      {folderOptions.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  onClick={handleCreateCollectionClick}
                  className='w-full flex items-center justify-center space-x-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-md'
                >
                  <FolderPlus className='h-4 w-4' />
                  <span>Create New Collection</span>
                </button>
              </div>
            ) : (
              <div className='space-y-2'>
                <input
                  type='text'
                  value={newCollectionName}
                  onChange={handleNewCollectionNameChange}
                  placeholder='Enter collection name'
                  className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-all duration-150'
                  autoFocus
                />

                <button
                  onClick={() => {
                    setIsCreatingCollection(false);
                    setNewCollectionName('');
                  }}
                  className='text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                >
                  ← Back to existing collections
                </button>
              </div>
            )}
          </div>

          {!urlAtOpen.trim() && (
            <div className='mt-2 text-red-600 text-sm'>
              URL is required to save a request.
            </div>
          )}

          {!selectedCollectionId &&
            (!isCreatingCollection || !newCollectionName.trim()) && (
              <div className='mt-2 text-red-600 text-sm'>
                Please select or create a collection.
              </div>
            )}
        </Modal>
        <Suspense fallback={null}>
          <ImportModal
            isOpen={showCurlImport}
            onClose={() => setShowCurlImport(false)}
            onCurlImport={handleCurlImport}
          />
        </Suspense>
      </div>
    </TooltipProvider>
  );
};

const RequestEditor: React.FC<RequestEditorProps> = (props) => {
  const { activeRequest } = useCollection();

  return (
    <ErrorBoundary>
      <RequestEditorProvider
        key={activeRequest?.id}
        activeRequestId={activeRequest?.id}
        initialUrl={activeRequest?.url || ''}
        initialMethod={(activeRequest?.method as any) || 'GET'}
        initialParams={activeRequest?.params || []}
        initialHeaders={activeRequest?.headers || []}
        initialBodyType={(activeRequest?.bodyType as any) || 'raw'}
        initialBodyContent={activeRequest?.bodyRawContent || '{}'}
        initialAuthType={(activeRequest?.authorizationType as any) || 'bearer'}
        initialSettings={activeRequest?.settings}
        initialAuthData={
          activeRequest?.authorization
            ? {
                username: activeRequest.authorization.username || '',
                password: activeRequest.authorization.password || '',
                token: activeRequest.authorization.token || '',
                key: activeRequest.authorization.key || '',
                value: activeRequest.authorization.value || '',
                addTo: activeRequest.authorization.addTo || 'header',
                oauth1: {
                  consumerKey:
                    activeRequest.authorization.oauth1?.consumerKey || '',
                  consumerSecret:
                    activeRequest.authorization.oauth1?.consumerSecret || '',
                  token: activeRequest.authorization.oauth1?.token || '',
                  tokenSecret:
                    activeRequest.authorization.oauth1?.tokenSecret || '',
                  signatureMethod:
                    activeRequest.authorization.oauth1?.signatureMethod ||
                    'HMAC-SHA1',
                  version: activeRequest.authorization.oauth1?.version || '1.0',
                  realm: activeRequest.authorization.oauth1?.realm || '',
                  nonce: activeRequest.authorization.oauth1?.nonce || '',
                  timestamp:
                    activeRequest.authorization.oauth1?.timestamp || '',
                },
                oauth2: {
                  clientId: activeRequest.authorization.oauth2?.clientId || '',
                  clientSecret:
                    activeRequest.authorization.oauth2?.clientSecret || '',
                  accessToken:
                    activeRequest.authorization.oauth2?.accessToken || '',
                  tokenType:
                    activeRequest.authorization.oauth2?.tokenType || 'Bearer',
                  refreshToken:
                    activeRequest.authorization.oauth2?.refreshToken || '',
                  scope: activeRequest.authorization.oauth2?.scope || '',
                  grantType:
                    activeRequest.authorization.oauth2?.grantType ||
                    'authorization_code',
                  redirectUri:
                    activeRequest.authorization.oauth2?.redirectUri || '',
                },
              }
            : undefined
        }
      >
        <RequestEditorContent {...props} />
      </RequestEditorProvider>
    </ErrorBoundary>
  );
};

export default React.memo(RequestEditor);
