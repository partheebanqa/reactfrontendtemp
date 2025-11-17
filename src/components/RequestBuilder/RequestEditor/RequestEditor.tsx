'use client';

import type React from 'react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Save, FolderPlus, HelpCircle, Info } from 'lucide-react';
import { useRequest } from '@/hooks/useRequest';
import { useCollection } from '@/hooks/useCollection';
import { useWorkspace } from '@/hooks/useWorkspace';
import type { Header, Param, RequestMethod } from '@/shared/types/request';
import SchemaPage from '../SchemaPage';
import { useToast } from '@/hooks/useToast';
import TooltipContainer from '@/components/ui/tooltip-container';
import KeyValueEditor from '@/components/ui/KeyValueEditor';
import KeyValueEditorWithFileUpload, {
  type KeyValuePairWithFile,
} from '@/components/ui/KeyValueEditorWithFileUpload';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import Modal from '@/components/ui/Modal';
import { useDataManagement } from '@/hooks/useDataManagement';
import {
  executeCollectionRequest,
  executeRequest,
  buildRequestPayload,
} from '@/services/executeRequest.service';
import { updateRequest } from '@/services/collection.service';
import { useMutation } from '@tanstack/react-query';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { generateAssertions } from '@/utils/assertionGenerator';
import AssertionManager from './assertionManager';
import ImportModal from './ImportModal';
import { Input } from '@/components/ui/input';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/mode/javascript/javascript';
import './whiteorange.css';
import EditableTextWithoutIcon from '@/components/ui/EditableTextWithoutIcon';
import { JsonVariableSubstitution } from './JsonVariableSubstitution';
import { generateDynamicValueById } from '@/lib/request-utils';
import RequestTabs from './RequestTabs';
import { collectionActions, useCollectionStore } from '@/store/collectionStore';
import { useSchema } from '@/hooks/useSchema';

type Assertion = {
  id: string;
  category: string;
  type: string;
  description: string;
  field: string;
  operator: string;
  expectedValue: any;
  enabled: boolean;
  impact: string;
  group: string;
  priority: string;
};

interface FormattedResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  responseTime: number;
  size: number;
}

interface SelectedVariable {
  name: string;
  path?: string;
}

interface PendingSubstitution {
  lineIndex: number;
  variableName: string;
}

type BodyType =
  | 'none'
  | 'json'
  | 'form-data'
  | 'x-www-form-urlencoded'
  | 'raw'
  | 'binary';

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
    | 'binary'
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

const RequestEditor: React.FC = () => {
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

  const isExtractingRef = useRef(false);

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
    | 'assertions'
    | 'settings'
    | 'schemas'
  >('params');

  const { schemas } = useSchema();

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [url, setUrl] = useState('');
  const [urlAtOpen, setUrlAtOpen] = useState('');
  const [method, setMethod] = useState<RequestMethod>('GET');
  const [params, setParams] = useState<Param[]>([]);
  const [headers, setHeaders] = useState<Header[]>([]);

  const [bodyType, setBodyType] = useState<BodyType>('json');
  const [bodyContent, setBodyContent] = useState('');
  const [formFields, setFormFields] = useState<KeyValuePairWithFile[]>([]);
  const [urlEncodedFields, setUrlEncodedFields] = useState<Param[]>([]);
  const [authType, setAuthType] = useState<
    'none' | 'basic' | 'bearer' | 'apiKey' | 'oauth1' | 'oauth2'
  >('bearer');

  const [token, setToken] = useState('');
  const [selectedVariable, setSelectedVariable] = useState<SelectedVariable[]>(
    []
  );

  const [pendingSubstitutions, setPendingSubstitutions] = useState<
    PendingSubstitution[]
  >([]);
  const [authData, setAuthData] = useState({
    username: '',
    password: '',
    token: '',
    key: '',
    value: '',
    addTo: 'header' as 'header' | 'query',
    oauth1: {
      consumerKey: '',
      consumerSecret: '',
      token: '',
      tokenSecret: '',
      signatureMethod: 'HMAC-SHA1',
      version: '1.0',
      realm: '',
      nonce: '',
      timestamp: '',
    },
    oauth2: {
      clientId: '',
      clientSecret: '',
      accessToken: '',
      tokenType: 'Bearer',
      refreshToken: '',
      scope: '',
      grantType: 'authorization_code' as
        | 'authorization_code'
        | 'client_credentials'
        | 'password'
        | 'refresh_token',
      redirectUri: '',
    },
  });

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

  const [settings, setSettings] = useState({
    followRedirects: true,
    timeout: 30000,
    sslVerification: true,
  });

  const formattedVariables = useMemo(() => {
    const formatted: Array<{ name: string; value: string }> = [];

    const isValidVar = (name: string) =>
      name.startsWith('S_') || name.startsWith('D_');

    if (Array.isArray(variables)) {
      variables.forEach((variable: any) => {
        const name = variable.name || variable.key || '';
        const value = variable.value || variable.initialValue || '';
        if (name && isValidVar(name)) {
          formatted.push({ name, value });
        }
      });
    }

    if (Array.isArray(dynamicVariables)) {
      dynamicVariables.forEach((variable: any) => {
        const name = variable.name || '';
        if (name && isValidVar(name)) {
          const generatedValue = generateDynamicValueById(
            variable.generatorId || '',
            variable.parameters || {}
          );
          formatted.push({ name, value: String(generatedValue) });
        }
      });
    }

    return formatted;
  }, [variables, dynamicVariables]);

  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [folderOptions, setFolderOptions] = useState<
    Array<{ id: string; label: string }>
  >([]);

  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const [loadedRequestId, setLoadedRequestId] = useState<string | undefined>();

  const collectionsRef = useRef(collections);
  useEffect(() => {
    collectionsRef.current = collections;
  }, [collections]);

  const activeCollectionFull =
    collections.find((c) => c.id === activeCollection?.id) ||
    activeCollection ||
    null;

  function buildFolderOptions(
    folders: any[] = [],
    depth = 0,
    acc: Array<{ id: string; label: string }> = []
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
    const loadFolders = async () => {
      if (!showSaveModal || !selectedCollectionId) return;
      try {
        await fetchCollectionRequests.mutateAsync(selectedCollectionId);
      } catch (e) {
      } finally {
        const latest = collectionsRef.current.find(
          (c) => c.id === selectedCollectionId
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
          (p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`
        )
        .join('&');
      const newUrl = `${baseUrl}?${queryString}`;

      if (newUrl !== url) {
        setUrl(newUrl);
      }
    } else {
      if (url.includes('?') && params.length === 0) {
        setUrl(baseUrl);
      }
    }
  }, [params, isSaving, url]);

  useEffect(() => {
    if (isSaving) return;

    if (activeRequest && activeRequest.id !== loadedRequestId) {
      setLoadedRequestId(activeRequest.id);

      setUrl(activeRequest.url || '');
      setMethod((activeRequest.method as RequestMethod) || 'GET');
      setParams(activeRequest.params || []);

      if (activeRequest.headers && Array.isArray(activeRequest.headers)) {
        try {
          const formattedHeaders = activeRequest.headers.map((h: any) => {
            return {
              key: h.key || h.name || '',
              value: h.value || '',
              enabled: h.enabled !== undefined ? !!h.enabled : true,
            };
          });

          const defaultHeaders = methodsWithBody.includes(
            activeRequest.method as RequestMethod
          )
            ? [
                {
                  key: 'Content-Type',
                  value: 'application/json',
                  enabled: true,
                },
              ]
            : [];

          const filteredHeaders = formattedHeaders.filter(
            (h: Header) =>
              h.key !== 'Postman-Token' &&
              h.key !== 'User-Agent' &&
              !defaultHeaders.find((dh) => dh.key === h.key)
          );

          setHeaders([...defaultHeaders, ...filteredHeaders]);
        } catch (error) {
          console.error('Error formatting headers:', error);
          setHeaders(getDefaultHeaders(activeRequest.method as RequestMethod));
        }
      } else {
        setHeaders(getDefaultHeaders(activeRequest.method as RequestMethod));
      }

      const allowedBodyTypes = [
        'none',
        'json',
        'form-data',
        'x-www-form-urlencoded',
        'raw',
        'binary',
      ];
      const bodyTypeValue = activeRequest.bodyType || 'none';
      setBodyType(
        allowedBodyTypes.includes(bodyTypeValue)
          ? (bodyTypeValue as BodyType)
          : 'json'
      );
      setBodyContent(activeRequest.bodyRawContent || '');
      setPendingSubstitutions([]);

      try {
        if (
          activeRequest.bodyFormData &&
          typeof activeRequest.bodyFormData === 'object'
        ) {
          const formDataFields = Object.entries(activeRequest.bodyFormData).map(
            ([key, value]) => ({
              key,
              value: value?.toString() || '',
              enabled: true,
              type: 'text' as const,
            })
          );
          setFormFields(formDataFields);
        } else {
          setFormFields([]);
        }
      } catch (error) {
        console.error('Error initializing form fields:', error);
        setFormFields([]);
      }

      try {
        if (
          bodyTypeValue === 'x-www-form-urlencoded' &&
          activeRequest.bodyRawContent
        ) {
          try {
            const urlParams = new URLSearchParams(activeRequest.bodyRawContent);
            const encodedFields: Param[] = [];
            urlParams.forEach((value, key) => {
              encodedFields.push({ key, value, enabled: true });
            });
            setUrlEncodedFields(encodedFields);
          } catch (e) {
            setUrlEncodedFields([]);
          }
        } else {
          setUrlEncodedFields([]);
        }
      } catch (error) {
        console.error('Error initializing URL encoded fields:', error);
        setUrlEncodedFields([]);
      }

      setToken(activeRequest.authorization?.token || '');
      const requestAuthType = activeRequest.authorizationType as
        | 'none'
        | 'basic'
        | 'bearer'
        | 'apiKey'
        | 'oauth1'
        | 'oauth2';

      if (activeRequest.authorization?.token && !requestAuthType) {
        setAuthType('bearer');
      } else {
        setAuthType(requestAuthType || 'bearer');
      }

      setAuthData({
        username: activeRequest.authorization?.username || '',
        password: activeRequest.authorization?.password || '',
        token: activeRequest.authorization?.token || '',
        key: activeRequest.authorization?.key || '',
        value: activeRequest.authorization?.value || '',
        addTo: activeRequest.authorization?.addTo || 'header',
        oauth1: {
          consumerKey: '',
          consumerSecret: '',
          token: '',
          tokenSecret: '',
          signatureMethod: 'HMAC-SHA1',
          version: '1.0',
          realm: '',
          nonce: '',
          timestamp: '',
        },
        oauth2: {
          clientId: '',
          clientSecret: '',
          accessToken: '',
          tokenType: 'Bearer',
          refreshToken: '',
          scope: '',
          grantType: 'authorization_code',
          redirectUri: '',
        },
      });

      if (
        activeRequest.assertions &&
        Array.isArray(activeRequest.assertions) &&
        activeRequest.assertions.length > 0
      ) {
        try {
          const existingAssertions = activeRequest.assertions.map(
            (assertion: any) => {
              return {
                id: assertion.id || `temp-${Math.random()}`,
                category: assertion.category || 'general',
                type: assertion.type || 'custom',
                description: assertion.description || 'Custom assertion',
                field: assertion.field,
                operator: assertion.operator || 'equals',
                expectedValue: assertion.expectedValue,
                enabled:
                  assertion.enabled !== undefined ? assertion.enabled : true,
                impact: assertion.impact,
                group: assertion.group || 'custom',
                priority: assertion.priority,
              } as Assertion;
            }
          );

          setAssertions(existingAssertions);
        } catch (error) {
          console.error('Error loading existing assertions:', error);
          setAssertions([]);
        }
      } else {
        setAssertions([]);
      }

      if (activeRequest.folderId) {
        setSelectedFolderId(activeRequest.folderId);
      } else {
        setSelectedFolderId('');
      }

      if (activeRequest.variable) {
        if (Array.isArray(activeRequest.variable)) {
          const filteredVariables = activeRequest.variable.filter(
            (v: any) => v.path || v.name
          );
          setSelectedVariable(filteredVariables);
        } else {
          setSelectedVariable([]);
        }
      } else {
        setSelectedVariable([]);
      }
    } else if (!isSaving && !activeRequest) {
      setLoadedRequestId(undefined);
      setAssertions([]);
      setAuthType('bearer');
      setSelectedVariable([]);
      setPendingSubstitutions([]);
    }
    setResponseData(null);
  }, [activeRequest?.id, isSaving]);

  useEffect(() => {
    if (activeRequest && !activeRequest.id?.startsWith('temp-')) {
      if (activeRequest?.id) {
        collectionActions.markUnsaved(activeRequest.id);
      }
    }
  }, [activeEnvironment]);

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
      if (parsedRequest.url) {
        setUrl(parsedRequest.url);
        if (activeRequest?.id) {
          collectionActions.markUnsaved(activeRequest.id);
        }
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
          setMethod(requestMethod);
          if (activeRequest?.id) {
            collectionActions.markUnsaved(activeRequest.id);
          }
        }
      }

      if (parsedRequest.headers && Array.isArray(parsedRequest.headers)) {
        const formattedHeaders = parsedRequest.headers.map((header: any) => ({
          key: header.key || '',
          value: header.value || '',
          enabled: header.enabled !== undefined ? header.enabled : true,
        }));
        setHeaders(formattedHeaders);
        if (activeRequest?.id) {
          collectionActions.markUnsaved(activeRequest.id);
        }
      }

      if (parsedRequest.params && Array.isArray(parsedRequest.params)) {
        const formattedParams = parsedRequest.params.map((param: any) => ({
          key: param.key || '',
          value: param.value || '',
          enabled: param.enabled !== undefined ? param.enabled : true,
        }));
        setParams(formattedParams);
        if (activeRequest?.id) {
          collectionActions.markUnsaved(activeRequest.id);
        }
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
          setBodyType(parsedRequest.bodyType as BodyType);
          if (activeRequest?.id) {
            collectionActions.markUnsaved(activeRequest.id);
          }
        }
      }

      if (parsedRequest.body) {
        let bodyContentToSet = '';
        if (typeof parsedRequest.body === 'string') {
          bodyContentToSet = parsedRequest.body;
        } else if (typeof parsedRequest.body === 'object') {
          let parsedBodyContent = parsedRequest.body;
          if (
            typeof parsedBodyContent === 'object' &&
            parsedBodyContent !== null
          ) {
            try {
              parsedBodyContent = JSON.stringify(parsedBodyContent, null, 2);
            } catch (e) {
              console.error('Error stringifying parsed body:', e);
            }
          }
          bodyContentToSet = parsedBodyContent;
        }
        setBodyContent(bodyContentToSet);
        if (activeRequest?.id) {
          collectionActions.markUnsaved(activeRequest.id);
        }
      }

      if (parsedRequest.auth && parsedRequest.auth.type) {
        const authTypeValue = parsedRequest.auth.type.toLowerCase();

        switch (authTypeValue) {
          case 'bearer':
            setAuthType('bearer');
            if (parsedRequest.auth.token) {
              setAuthData((prev) => ({
                ...prev,
                token: parsedRequest.auth.token,
              }));
            }
            break;
          case 'basic':
            setAuthType('basic');
            if (parsedRequest.auth.username && parsedRequest.auth.password) {
              setAuthData((prev) => ({
                ...prev,
                username: parsedRequest.auth.username,
                password: parsedRequest.auth.password,
              }));
            }
            break;
          case 'apikey':
            setAuthType('apiKey');
            if (parsedRequest.auth.key && parsedRequest.auth.value) {
              setAuthData((prev) => ({
                ...prev,
                key: parsedRequest.auth.key,
                value: parsedRequest.auth.value,
                addTo: parsedRequest.auth.addTo || 'header',
              }));
            }
            break;
          default:
            setAuthType('bearer');
            break;
        }
        if (activeRequest?.id) {
          collectionActions.markUnsaved(activeRequest.id);
        }
      }

      if (parsedRequest.bodyType === 'form-data' && parsedRequest.formData) {
        const formDataFields = Object.entries(parsedRequest.formData).map(
          ([key, value]) => ({
            key,
            value: String(value),
            enabled: true,
            type: 'text' as const,
          })
        );
        setFormFields(formDataFields);
        if (activeRequest?.id) {
          collectionActions.markUnsaved(activeRequest.id);
        }
      }

      if (
        parsedRequest.bodyType === 'x-www-form-urlencoded' &&
        parsedRequest.body
      ) {
        try {
          const urlParams = new URLSearchParams(parsedRequest.body);
          const encodedFields: Param[] = [];
          urlParams.forEach((value, key) => {
            encodedFields.push({ key, value, enabled: true });
          });
          setUrlEncodedFields(encodedFields);
          if (activeRequest?.id) {
            collectionActions.markUnsaved(activeRequest.id);
          }
        } catch (e) {
          console.error('Error parsing URL encoded body:', e);
        }
      }

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
        description: 'Request has been populated from cURL command',
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
    clearError();
    setLoading(true);

    const newUrl = buildFinalUrl();

    try {
      const hasUnsavedChanges = activeRequest.id
        ? unsavedChanges.has(activeRequest.id)
        : false;

      let backendData;

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

      if (hasUnsavedChanges || activeRequest.id?.startsWith('temp-')) {
        let substitutedBodyContent = bodyContent;

        if (
          selectedVariable &&
          selectedVariable.length > 0 &&
          (bodyType === 'raw' || bodyType === 'json')
        ) {
          try {
            const parsedBody = JSON.parse(bodyContent);

            selectedVariable.forEach((varItem) => {
              const variable = formattedVariables.find(
                (v) => v.name === varItem.name
              );
              if (variable && varItem.path) {
                parsedBody[varItem.path] = variable.value;
              }
            });

            substitutedBodyContent = JSON.stringify(parsedBody, null, 2);
          } catch {
            selectedVariable.forEach((varItem) => {
              const variable = formattedVariables.find(
                (v) => v.name === varItem.name
              );
              if (variable) {
                const regex = new RegExp(`{{${variable.name}}}`, 'g');
                substitutedBodyContent = substitutedBodyContent.replace(
                  regex,
                  variable.value
                );
              }
            });
          }
        } else if (selectedVariable && selectedVariable.length > 0) {
          selectedVariable.forEach((varItem) => {
            const variable = formattedVariables.find(
              (v) => v.name === varItem.name
            );
            if (variable) {
              const regex = new RegExp(`{{${variable.name}}}`, 'g');
              substitutedBodyContent = substitutedBodyContent.replace(
                regex,
                variable.value
              );
            }
          });
        }

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
              ? { token: authData.token }
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

        const payload = buildRequestPayload(
          currentRequest,
          formattedVariables.map((v) => ({
            name: v.name,
            value: v.value,
            type: 'string',
            currentValue: v.value,
          })),
          currentWorkspace?.id
        );

        backendData = await executeRequest(payload);
      } else {
        if (!activeRequest?.id) {
          throw new Error('please save a request before sending.');
        }

        const environmentId =
          activeEnvironment?.name !== 'No Environment'
            ? activeEnvironment?.id
            : undefined;

        backendData = await executeCollectionRequest(
          activeRequest.id,
          environmentId
        );
      }

      let backendBody;
      let statusCode;
      let responseHeaders;
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
        metrics = firstResponse.metrics;
        assertionLogs = [];
        schemaValidation = null;
      } else {
        backendBody = backendData?.data?.body;
        statusCode = backendData?.data?.statusCode;
        responseHeaders = backendData?.data?.headers;
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

        const normalizedResponse = {
          status: statusCode ?? 200,
          statusCode: statusCode ?? 200,
          headers: responseHeaders ?? {},
          body: parsedBody,
          rawBody: backendBody,
          metrics: metrics ?? {},
          assertionLogs,
          schemaValidation,
        };

        setResponseData(normalizedResponse);

        const formattedResponse = formatBackendResponse(normalizedResponse);
        const generatedAssertions = generateAssertions(formattedResponse);

        const existingAssertions = Array.isArray(assertions) ? assertions : [];
        const existingIds = new Set(existingAssertions.map((a) => a.id));

        const newAssertions = generatedAssertions.filter(
          (a) => !existingIds.has(a.id)
        );

        setAssertions([...existingAssertions, ...newAssertions]);
      }
    } catch (error) {
      const backendErrorMessage =
        error?.response?.data?.errorDetails ||
        error?.response?.data?.error ||
        error?.message ||
        'An unknown error occurred.';

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
          activeRequest.id,
          currentWorkspace?.id || ''
        );
      } else {
        await handleUpdateRequest(newName.trim());
      }
    } catch (error) {
      console.error('Error renaming request:', error);
      showError(
        'Rename Failed',
        'An error occurred while renaming the request.'
      );
    }
  };

  const handleSaveRequest = () => {
    if (!activeRequest) return;
    if (!url.trim()) {
      showError(
        'URL Required',
        'Please enter a URL before saving the request.'
      );
      return;
    }

    setIsSaving(true);
    setUrlAtOpen(url);
    setShowSaveModal(true);
  };

  const handleUpdateRequest = async (overrideName?: string) => {
    try {
      if (!activeRequest || activeRequest.id?.startsWith('temp-')) {
        showError(
          'Invalid Request',
          'Cannot update a temporary request. Please save it first.'
        );
        return;
      }

      if (!url.trim()) {
        showError(
          'URL Required',
          'Please enter a URL before saving the request.'
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
        workspaceId: currentWorkspace.id,
        description: '',
        name: overrideName || activeRequest.name || 'New Request',
        method,
        url,
        ...(effectiveFolderId ? { folderId: effectiveFolderId } : {}),
        bodyType: bodyType === 'json' ? 'raw' : bodyType,
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
                  .reduce((acc, field) => {
                    if (field.key) acc[field.key] = field.value;
                    return acc;
                  }, {} as Record<string, string>)
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
    }
  };

  const handleConfirmSave = async () => {
    try {
      setIsSaving(true);
      if (!activeRequest || !currentWorkspace) return;

      if (!urlAtOpen.trim()) {
        showError(
          'URL Required',
          'Please enter a URL before saving the request.'
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
          'Please select or create a collection to save the request.'
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
        bodyType: bodyType === 'json' ? 'raw' : bodyType,
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
                  .reduce((acc, field) => {
                    if (field.key) acc[field.key] = field.value;
                    return acc;
                  }, {} as Record<string, string>)
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
      };

      const savedRequestResponse = await addRequestMutation.mutateAsync(
        requestData
      );

      if (
        savedRequestResponse &&
        (savedRequestResponse.id || savedRequestResponse.requestId)
      ) {
        const newId = savedRequestResponse.id || savedRequestResponse.requestId;

        const updatedRequest = {
          ...activeRequest,
          id: newId,
          collectionId: targetCollectionId,
          ...(selectedFolderId ? ({ folderId: selectedFolderId } as any) : {}),
          name: activeRequest.name || 'New Request',
          method,
          url: urlAtOpen,
          bodyType,
          authorizationType: effectiveAuthType,
          authorization: requestData.authorization,
          params,
          headers,
          ...(selectedVariable ? { variable: selectedVariable } : {}),
        };
        const oldRequestId = activeRequest.id;
        replaceRequest(oldRequestId, updatedRequest);
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
      if (!activeRequest || activeRequest.id?.startsWith('temp-')) {
        showError(
          'Invalid Request',
          'Cannot update a temporary request. Please save it first.'
        );
        return;
      }
      if (!url.trim()) {
        showError(
          'URL Required',
          'Please enter a URL before saving the request.'
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
        workspaceId: currentWorkspace.id,
        description: '',
        name: activeRequest.name || 'New Request',
        method,
        url,
        ...(effectiveFolderId ? { folderId: effectiveFolderId } : {}),
        bodyType: bodyType === 'json' ? 'raw' : bodyType,
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
                  .reduce((acc, field) => {
                    if (field.key) acc[field.key] = field.value;
                    return acc;
                  }, {} as Record<string, string>)
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
        environmentId: activeEnvironment?.id || null,
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
    let finalUrl = url;
    finalUrl = substituteVariables(finalUrl);
    const envBaseUrl = activeEnvironment?.baseUrl || '';
    if (envBaseUrl) {
      try {
        const originalUrl = new URL(finalUrl);
        const pathAndQuery =
          originalUrl.pathname + originalUrl.search + originalUrl.hash;
        const baseUrl = envBaseUrl.replace(/\/$/, '');
        finalUrl = `${baseUrl}${pathAndQuery}`;
      } catch (error) {
        if (
          !finalUrl.startsWith('http://') &&
          !finalUrl.startsWith('https://')
        ) {
          finalUrl = finalUrl.startsWith('/') ? finalUrl : `/${finalUrl}`;
          finalUrl = `${envBaseUrl.replace(/\/$/, '')}${finalUrl}`;
        }
      }
    }
    return finalUrl;
  };

  const previewUrl = buildFinalUrl();

  const handleCancelSave = () => {
    setShowSaveModal(false);
  };

  const addParam = () => {
    setParams([...params, { key: '', value: '', enabled: true }]);
    if (activeRequest?.id) {
      collectionActions.markUnsaved(activeRequest.id);
    }
  };

  const updateParam = (
    index: number,
    field: keyof Param,
    value: string | boolean
  ) => {
    const newParams = [...params];
    newParams[index] = { ...newParams[index], [field]: value };
    setParams(newParams);

    if (activeRequest?.id) {
      collectionActions.markUnsaved(activeRequest.id);
    }
  };

  const removeParam = (index: number) => {
    setParams(params.filter((_, i) => i !== index));
    if (activeRequest?.id) {
      collectionActions.markUnsaved(activeRequest.id);
    }
  };

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }]);
    if (activeRequest?.id) {
      collectionActions.markUnsaved(activeRequest.id);
    }
  };

  const updateHeader = (
    index: number,
    field: keyof Header,
    value: string | boolean
  ) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setHeaders(newHeaders);
    if (activeRequest?.id) {
      collectionActions.markUnsaved(activeRequest.id);
    }
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
    if (activeRequest?.id) {
      collectionActions.markUnsaved(activeRequest.id);
    }
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
    value: string | boolean | File | undefined
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
    value: string | boolean
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
        'Unable to format. Please check your JSON syntax.'
      );
    }
  };

  const methods: RequestMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  const getMethodColor = (method: string) => {
    const colors = {
      GET: 'text-green-600 bg-green-50 border-green-200',
      POST: 'text-blue-600 bg-blue-50 border-blue-200',
      PUT: 'text-orange-600 bg-orange-50 border-orange-200',
      DELETE: 'text-red-600 bg-red-50 border-red-200',
      PATCH: 'text-purple-600 bg-purple-50 border-purple-200',
      HEAD: 'text-gray-600 bg-gray-50 border-gray-200',
      OPTIONS: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    };
    return (
      colors[method as keyof typeof colors] ||
      'text-gray-600 bg-gray-50 border-gray-200'
    );
  };

  const handleMethodChange = (newMethod: RequestMethod) => {
    setMethod(newMethod);

    const hasContentTypeHeader = headers.some((h) => h.key === 'Content-Type');
    if (methodsWithBody.includes(newMethod) && !hasContentTypeHeader) {
      setHeaders([
        { key: 'Content-Type', value: 'application/json', enabled: true },
        ...headers,
      ]);
    } else if (!methodsWithBody.includes(newMethod) && hasContentTypeHeader) {
      setHeaders(headers.filter((h) => h.key !== 'Content-Type'));
    }
  };

  const handleBodyTypeChange = (newBodyType: BodyType) => {
    setBodyType(newBodyType);

    if (newBodyType !== 'none') {
      const contentTypeValue = getContentTypeForBodyType(newBodyType);
      const contentTypeHeaderIndex = headers.findIndex(
        (h) => h.key.toLowerCase() === 'content-type'
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
  };

  const handleVariableSelect = (variables: SelectedVariable[]) => {
    setSelectedVariable(variables);
    if (activeRequest) {
      collectionActions.markUnsaved(activeRequest.id);
    }
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
        <div className='sticky top-0 z-30 bg-white dark:bg-gray-900'>
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

          <div className='border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center text-sm space-x-1'>
                <span className='text-gray-500 dark:text-gray-400'>
                  {activeCollectionFull?.name}
                </span>
                <span className='text-gray-500 dark:text-gray-400'>/</span>

                {activeRequest?.folderId && (
                  <>
                    <span className='text-gray-500 dark:text-gray-400'>
                      {findFolderName(
                        activeRequest.folderId,
                        (activeCollectionFull as any)?.folders || []
                      )}
                    </span>
                    <span className='text-gray-500 dark:text-gray-400'>/</span>
                  </>
                )}

                <div className='flex items-center gap-1'>
                  <EditableTextWithoutIcon
                    value={activeRequest.name || ''}
                    onSave={handleSaveName}
                    placeholder='Request Name'
                    fontSize='sm'
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
            </div>
          </div>
        </div>

        <div className='border-b border-gray-200 dark:border-gray-700 p-4 flex-shrink-0'>
          <div className='flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2'>
            <select
              value={method}
              onChange={(e) => {
                const newMethod = e.target.value as RequestMethod;
                setMethod(newMethod);

                const hasContentTypeHeader = headers.some(
                  (h) => h.key === 'Content-Type'
                );
                if (
                  methodsWithBody.includes(newMethod) &&
                  !hasContentTypeHeader
                ) {
                  setHeaders([
                    {
                      key: 'Content-Type',
                      value: 'application/json',
                      enabled: true,
                    },
                    ...headers,
                  ]);
                } else if (
                  !methodsWithBody.includes(newMethod) &&
                  hasContentTypeHeader
                ) {
                  setHeaders(headers.filter((h) => h.key !== 'Content-Type'));
                }

                if (activeRequest?.id) {
                  collectionActions.updateOpenedRequest({
                    ...activeRequest,
                    method: newMethod,
                  });
                  collectionActions.markUnsaved(activeRequest.id);
                }
              }}
              className={`w-full sm:w-auto border rounded-md pl-3 pr-0 py-2 text-sm font-medium hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-150 ${getMethodColor(
                method
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
              onChange={(e) => {
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
              }}
              placeholder='Enter request URL'
            />

            <div className='flex space-x-2'>
              <Button
                variant='active'
                onClick={handleSendRequest}
                disabled={isLoading}
                className='disabled:bg-blue-400 text-white px-4 sm:px-6 py-2 rounded-md flex items-center space-x-2 transition-colors whitespace-nowrap'
                aria-label='Send request'
                title='Send request'
              >
                <Play className='h-4 w-4' />
                <span className='hidden sm:inline'>
                  {isLoading ? 'Sending...' : 'Send'}
                </span>
              </Button>
              <TooltipContainer text='Save request'>
                {isNewRequest(activeRequest.id) ? (
                  <button
                    onClick={handleSaveRequest}
                    className='border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-md'
                    aria-label='Save request'
                  >
                    <Save className='h-4 w-4 text-[#136fb0]' />
                  </button>
                ) : (
                  <button
                    onClick={handleUpdateContentRequest}
                    className='border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-md'
                    aria-label='Save request'
                  >
                    <Save className='h-4 w-4 text-[#136fb0]' />
                  </button>
                )}
              </TooltipContainer>
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
          <nav className='flex overflow-x-auto px-4'>
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
              { id: 'auth', label: 'Authorization', count: getAuthCount() },
              {
                id: 'assertions',
                label: 'Assertions',
                count: Array.isArray(assertions)
                  ? assertions.filter((a) => a.enabled).length
                  : 0,
              },
              { id: 'settings', label: 'Settings' },
              {
                id: 'schemas',
                label: 'Schemas',
                count: Array.isArray(schemas) ? schemas.length : 0,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                    pt-4 pb-2 px-2 sm:px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
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
                    ></span>
                  )}

                {/* OTHER TABS → show number */}
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
            ))}
          </nav>
        </div>

        <div className='flex-1 overflow-auto p-4'>
          {activeTab === 'params' && (
            <KeyValueEditor
              items={params}
              onAdd={addParam}
              onUpdate={updateParam}
              onRemove={removeParam}
              title='Query Parameters'
              addButtonLabel='Add Parameter'
              emptyMessage='No query parameters added yet.'
            />
          )}

          {activeTab === 'headers' && (
            <KeyValueEditor
              items={headers}
              onAdd={addHeader}
              onUpdate={updateHeader}
              onRemove={removeHeader}
              title='Headers'
              addButtonLabel='Add Header'
              emptyMessage='No headers added yet.'
            />
          )}

          {activeTab === 'body' && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <TooltipProvider>
                  <div className='flex items-center gap-2'>
                    <h3 className='text-base sm:text-lg font-medium text-gray-900 dark:text-white'>
                      Request Body
                    </h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type='button'
                          className='p-1 text-gray-500 hover:text-[rgb(19,111,176)] transition-colors'
                        >
                          <HelpCircle className='w-4 h-4' />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Request body can include both static and dynamic values.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
                <div className='flex items-center gap-2'>
                  {(bodyType === 'json' || bodyType === 'raw') &&
                    bodyContent.trim() && (
                      <button
                        onClick={handleBeautifyBody}
                        className='px-3 py-2 bg-[rgb(19,111,176)] hover:bg-[rgb(15,90,144)] text-white text-sm rounded-md transition-colors font-medium'
                        title='Format JSON with proper indentation'
                      >
                        Beautify
                      </button>
                    )}
                  <select
                    value={bodyType}
                    onChange={(e) => {
                      const newBodyType = e.target.value as BodyType;
                      setBodyType(newBodyType);

                      if (newBodyType !== 'none') {
                        const contentTypeValue =
                          getContentTypeForBodyType(newBodyType);
                        const contentTypeHeaderIndex = headers.findIndex(
                          (h) => h.key.toLowerCase() === 'content-type'
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
                    className='border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-sm font-medium hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-150'
                  >
                    <option value='none'>None</option>
                    <option value='json'>JSON</option>
                    <option value='form-data'>Form Data</option>
                    <option value='x-www-form-urlencoded'>URL Encoded</option>
                    <option value='raw'>Raw</option>
                    <option value='binary'>Binary</option>
                  </select>
                </div>
              </div>

              {bodyType === 'none' && (
                <div className='text-gray-500 dark:text-gray-400 text-center p-8'>
                  This request does not have a body. Select a body type from the
                  dropdown above to add one.
                </div>
              )}

              {bodyType === 'json' && (
                <JsonVariableSubstitution
                  onChange={(newValue) => {
                    setBodyContent(newValue);
                    if (activeRequest?.id) {
                      collectionActions.markUnsaved(activeRequest.id);
                    }
                  }}
                  value={bodyContent}
                  onVariableSelect={handleVariableSelect}
                  onConfirmSubstitution={handleConfirmSubstitutions}
                  mode='json'
                  variables={formattedVariables}
                  initialVariable={activeRequest?.variable || []}
                  readOnly={false}
                />
              )}

              {bodyType === 'form-data' && (
                <>
                  <div className='mb-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700'>
                    <p>
                      Form fields support both text values and file uploads.
                      Click the "File" button next to any field to upload a
                      file.
                    </p>
                  </div>
                  <KeyValueEditorWithFileUpload
                    items={formFields}
                    onAdd={addFormField}
                    onUpdate={updateFormField}
                    onRemove={removeFormField}
                    title='Form fields'
                    addButtonLabel='Add Field'
                    emptyMessage='No form fields added yet.'
                  />
                </>
              )}

              {bodyType === 'x-www-form-urlencoded' && (
                <KeyValueEditor
                  items={urlEncodedFields}
                  onAdd={addUrlEncodedField}
                  onUpdate={updateUrlEncodedField}
                  onRemove={removeUrlEncodedField}
                  title='URL encoded fields'
                  addButtonLabel='Add Field'
                  emptyMessage='No URL encoded fields added yet.'
                />
              )}

              {bodyType === 'raw' && (
                <JsonVariableSubstitution
                  onChange={(newValue) => {
                    setBodyContent(newValue);
                    if (activeRequest?.id) {
                      collectionActions.markUnsaved(activeRequest.id);
                    }
                  }}
                  value={bodyContent}
                  onVariableSelect={handleVariableSelect}
                  onConfirmSubstitution={handleConfirmSubstitutions}
                  mode='raw'
                  variables={formattedVariables}
                  initialVariable={activeRequest?.variable || []}
                  readOnly={false}
                />
              )}

              {bodyType === 'binary' && (
                <div className='text-center p-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-md'>
                  <p className='text-gray-500 dark:text-gray-400 mb-4'>
                    Select a file to upload
                  </p>
                  <Button>Choose File</Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'auth' && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-base sm:text-lg font-medium text-gray-900 dark:text-white'>
                  Authorization
                </h3>
                <select
                  value='bearer'
                  disabled
                  className='border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-sm font-medium focus:outline-none'
                >
                  <option value='bearer'>Bearer Token</option>
                </select>
              </div>

              <div>
                <Input
                  type='text'
                  value={authData.token}
                  onChange={(e) => {
                    setAuthData({ ...authData, token: e.target.value });
                    if (activeRequest?.id) {
                      collectionActions.markUnsaved(activeRequest.id);
                    }
                  }}
                  placeholder='Enter token'
                />
              </div>
            </div>
          )}

          {activeTab === 'assertions' && (
            <AssertionManager
              assertions={assertions}
              setAssertions={setAssertions}
              responseData={responseData}
              activeRequest={activeRequest}
              currentWorkspace={currentWorkspace}
              updateRequestMutation={updateRequestMutation}
              toggleAssertion={toggleAssertion}
            />
          )}

          {activeTab === 'settings' && (
            <div className='space-y-5'>
              <h3 className='text-base sm:text-lg font-medium text-gray-900 dark:text-white'>
                Request Settings
              </h3>

              <div className='space-y-4'>
                <ToggleSwitch
                  id='followRedirects'
                  checked={settings.followRedirects}
                  onChange={(checked) =>
                    setSettings({ ...settings, followRedirects: checked })
                  }
                  label='Follow Redirects'
                  description='Automatically follow HTTP redirects'
                />
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Request Timeout (ms)
                  </label>
                  <input
                    type='number'
                    min='0'
                    value={settings.timeout}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        timeout: Number.parseInt(e.target.value),
                      })
                    }
                    className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-all duration-150 bg-white dark:bg-gray-800 text-sm'
                  />
                  <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                    Time in milliseconds to wait for a response before timing
                    out
                  </p>
                </div>
                <ToggleSwitch
                  id='sslVerification'
                  checked={settings.sslVerification}
                  onChange={(checked) =>
                    setSettings({ ...settings, sslVerification: checked })
                  }
                  label='SSL Certificate Verification'
                  description='Verify SSL certificates when making HTTPS requests'
                />
              </div>

              <div className='mt-6 p-4 bg-yellow-50 dark:bg-yellow-900 rounded-md'>
                <h4 className='text-sm font-medium text-yellow-800 dark:text-yellow-200'>
                  Request Settings Info
                </h4>
                <p className='text-xs text-yellow-700 dark:text-yellow-300 mt-1'>
                  These settings only apply to this specific request. Global
                  settings can be configured in the application settings.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'schemas' && (
            <div>
              <SchemaPage />
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
                  !selectedCollectionId &&
                  (!isCreatingCollection || !newCollectionName.trim())
                }
                className='px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md'
              >
                Save
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
                      onChange={(e) => setSelectedFolderId(e.target.value)}
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
                  onClick={() => setIsCreatingCollection(true)}
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
                  onChange={(e) => setNewCollectionName(e.target.value)}
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
        <ImportModal
          isOpen={showCurlImport}
          onClose={() => setShowCurlImport(false)}
          onCurlImport={handleCurlImport}
        />
      </div>
    </TooltipProvider>
  );
};

export default RequestEditor;
