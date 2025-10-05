'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { Play, Save, FolderPlus, Plus, FileTerminal } from 'lucide-react';
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
import EditableText from '@/components/ui/EditableText';
import Modal from '@/components/ui/Modal';
import { useDataManagement } from '@/hooks/useDataManagement';
import { executeCollectionRequest } from '@/services/executeRequest.service';
import { updateRequest } from '@/services/collection.service';
import { useMutation } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { generateAssertions } from '@/utils/assertionGenerator';
import AssertionManager from './assertionManager';
import ImportModal from './ImportModal';
import { Input } from '@/components/ui/input';
import { Controlled as CodeMirror } from 'react-codemirror2';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/mode/javascript/javascript';
import "./whiteorange.css"

interface FormattedResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  responseTime: number;
  size: number;
}

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
    handleCreateRequest,
    fetchCollectionRequests,
  } = useCollection();

  console.log('fetchCollectionRequests:', fetchCollectionRequests);

  const { variables, environments, activeEnvironment } = useDataManagement();
  console.log('activeEnvironment:', activeEnvironment);
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

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState<RequestMethod>('GET');
  const [params, setParams] = useState<Param[]>([]);
  const [headers, setHeaders] = useState<Header[]>([]);
  const [bodyType, setBodyType] = useState<
    'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary'
  >('none');
  const [bodyContent, setBodyContent] = useState('');
  const [formFields, setFormFields] = useState<KeyValuePairWithFile[]>([]);
  const [urlEncodedFields, setUrlEncodedFields] = useState<Param[]>([]);
  // ✅ FIX: Initialize authType as 'bearer' by default instead of 'none'
  const [authType, setAuthType] = useState<
    'none' | 'basic' | 'bearer' | 'apiKey' | 'oauth1' | 'oauth2'
  >('bearer');
  const [token, setToken] = useState('');
  const [authData, setAuthData] = useState({
    username: '',
    password: '',
    token: '',
    key: '',
    value: '',
    addTo: 'header' as 'header' | 'query',
    // OAuth 1.0 fields
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
    // OAuth 2.0 fields
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
  const [settings, setSettings] = useState({
    followRedirects: true,
    timeout: 30000,
    sslVerification: true,
  });

  console.log('url in state:', url);

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

  useEffect(() => {
    if (activeRequest) {
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
          setHeaders(formattedHeaders);
        } catch (error) {
          console.error('Error formatting headers:', error);
          setHeaders([]);
        }
      } else {
        setHeaders([]);
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
          ? (bodyTypeValue as
            | 'none'
            | 'json'
            | 'form-data'
            | 'x-www-form-urlencoded'
            | 'raw'
            | 'binary')
          : 'json'
      );
      setBodyContent(activeRequest.bodyRawContent || '');

      // Initialize form fields from the request
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

      // Initialize URL encoded fields from the request
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
      // ✅ FIX: Set authType properly, defaulting to 'bearer' if there's a token
      const requestAuthType = activeRequest.authorizationType as
        | 'none'
        | 'basic'
        | 'bearer'
        | 'apiKey'
        | 'oauth1'
        | 'oauth2';

      // If there's a token but no authType specified, assume bearer
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
        // Set default values for OAuth fields
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

      // Load existing assertions from activeRequest if they exist
      if (
        activeRequest.assertions &&
        Array.isArray(activeRequest.assertions) &&
        activeRequest.assertions.length > 0
      ) {
        try {
          const existingAssertions = activeRequest.assertions.map(
            (assertion: any) => {
              // Transform backend assertion format to frontend format
              return {
                id: assertion.id || `temp-${Math.random()}`,
                category: assertion.category || 'general',
                type: assertion.type || 'custom',
                description: assertion.description || 'Custom assertion',
                field: assertion.field,
                operator: assertion.operator || 'equals',
                expectedValue: assertion.expectedValue, // Handle both formats
                enabled:
                  assertion.enabled !== undefined ? assertion.enabled : true, // Mark as selected
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
    } else {
      handleCreateRequest();
      setAssertions([]);
      // ✅ FIX: When creating new request, ensure authType is 'bearer'
      setAuthType('bearer');
    }
    setResponseData(null);
  }, [activeRequest]);

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
      } catch {
        parsedBody = result.body;
      }
    }

    return {
      status: result.statusCode,
      statusText: '',
      headers: filteredHeaders,
      data: parsedBody,
      responseTime: result.metrics?.responseTime ?? 0,
      size: result.metrics?.bytesReceived ?? 0,
    };
  };

  const handleCurlImport = (parsedRequest: any) => {
    console.log('parsedRequest:', parsedRequest);

    try {
      // Set URL
      if (parsedRequest.url) {
        setUrl(parsedRequest.url);
      }

      // Set method
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
        }
      }

      // Set headers
      if (parsedRequest.headers && Array.isArray(parsedRequest.headers)) {
        const formattedHeaders = parsedRequest.headers.map((header: any) => ({
          key: header.key || '',
          value: header.value || '',
          enabled: header.enabled !== undefined ? header.enabled : true,
        }));
        setHeaders(formattedHeaders);
      }

      // Set params
      if (parsedRequest.params && Array.isArray(parsedRequest.params)) {
        const formattedParams = parsedRequest.params.map((param: any) => ({
          key: param.key || '',
          value: param.value || '',
          enabled: param.enabled !== undefined ? param.enabled : true,
        }));
        setParams(formattedParams);
      }

      // Set body type and content
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
          setBodyType(
            parsedRequest.bodyType as
            | 'none'
            | 'json'
            | 'form-data'
            | 'x-www-form-urlencoded'
            | 'raw'
            | 'binary'
          );
        }
      }

      // Set body content
      if (parsedRequest.body) {
        let bodyContentToSet = '';
        if (typeof parsedRequest.body === 'string') {
          bodyContentToSet = parsedRequest.body;
        } else if (typeof parsedRequest.body === 'object') {
          bodyContentToSet = JSON.stringify(parsedRequest.body, null, 2);
        }
        setBodyContent(bodyContentToSet);
      }

      // Set authentication
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
            setAuthType('bearer'); // ✅ FIX: Default to bearer instead of none
            break;
        }
      }

      // Handle form data
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
      }

      // Handle URL encoded fields
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
        } catch (e) {
          console.error('Error parsing URL encoded body:', e);
        }
      }

      // Switch to appropriate tab based on what was imported
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
        type: 'success',
      });
    } catch (error) {
      console.error('Error importing cURL:', error);
      toast({
        title: 'Import Error',
        description: 'Failed to import cURL command. Please check the format.',
        type: 'error',
      });
    }
  };

  const handleSendRequest = async () => {
    if (!activeRequest) return;
    clearError();
    setLoading(true);
    const newUrl = buildFinalUrl();

    try {
      let requestFormData: FormData | undefined;
      if (bodyType === 'form-data') {
        const fileFields = formFields.filter(
          (f) => f.enabled && f.type === 'file' && f.value instanceof File
        );
        if (fileFields.length > 0) {
          requestFormData = new FormData();
          formFields
            .filter((f) => f.enabled)
            .forEach((field) => {
              if (field.type === 'file' && field.value instanceof File) {
                requestFormData!.append(field.key, field.value, field.fileName);
              } else {
                requestFormData!.append(field.key, String(field.value));
              }
            });
        }
      }

      if (!activeRequest?.id) {
        throw new Error('please save a request before sending.');
      }

      // 🔹 Decide environmentId
      const environmentId =
        activeEnvironment?.name !== 'No Environment'
          ? activeEnvironment?.id
          : undefined;

      // 🔹 Send request to backend with optional environmentId
      const backendData = await executeCollectionRequest(
        activeRequest.id,
        environmentId
      );

      const backendBody = backendData?.data?.body;

      if (backendBody) {
        let parsedBody: any = backendBody;
        if (typeof backendBody === 'string') {
          try {
            parsedBody = JSON.parse(backendBody);
          } catch {
            parsedBody = backendBody;
          }
        }

        const normalizedResponse = {
          status: backendData?.data?.statusCode ?? 200,
          statusCode: backendData?.data?.statusCode ?? 200,
          headers: backendData?.data?.headers ?? {},
          body: parsedBody,
          rawBody: backendBody,
          metrics: backendData?.data?.metrics ?? {},
          assertionLogs: backendData?.data?.assertionLogs || [],
          schemaValidation: backendData?.data?.schemaValidation || null,
        };

        setResponseData(normalizedResponse as any);

        // 🔹 Generate assertions
        const formattedResponse = formatBackendResponse(normalizedResponse);
        const generatedAssertions = generateAssertions(formattedResponse);

        const existingAssertions = Array.isArray(assertions) ? assertions : [];
        const existingIds = new Set(existingAssertions.map((a) => a.id));
        const newAssertions = generatedAssertions.filter(
          (newAssertion) => !existingIds.has(newAssertion.id)
        );
        const mergedAssertions = [...existingAssertions, ...newAssertions];
        setAssertions(mergedAssertions);
      }
    } catch (error: any) {
      // Show backend error if present
      const backendErrorMessage =
        error?.response?.data?.errorDetails ||
        error?.response?.data?.error ||
        error?.message ||
        'An unknown error occurred.';

      toast({
        title: 'Error',
        description: backendErrorMessage,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async (newName: string) => {
    try {
      if (!activeRequest) return;
      if (newName.trim() && activeRequest?.id) {
        // First update the server
        await renameRequestMutation.mutateAsync({
          requestId: activeRequest.id,
          newName: newName.trim(),
          workspaceId: currentWorkspace?.id || '',
        });

        // The renameRequest action in the store will update both collections and activeRequest
        // This prevents the race condition where activeRequest gets overwritten
      } else if (newName.trim() && !activeRequest?.id) {
        // For unsaved requests, just update the local state
        const updatedRequest = {
          ...activeRequest,
          name: newName.trim(),
        };
        setActiveRequest(updatedRequest);
      }
    } catch (error) {
      console.error('Error renaming request:', error);
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

    setShowSaveModal(true);
  };

  const handleUpdateRequest = async () => {
    try {
      if (!activeRequest || !currentWorkspace) return;
      if (!url.trim()) {
        showError(
          'URL Required',
          'Please enter a URL before saving the request.'
        );
        return;
      }

      let maxOrder = 0;
      if (activeCollection) {
        const response = await fetchCollectionRequests.mutateAsync(
          activeCollection.id
        );
        if (response && response.length > 0) {
          maxOrder = Math.max(...response.map((req) => req.order || 0));
        }
      }

      const selectedAssertions = Array.isArray(assertions)
        ? assertions
          .filter((assertion) => assertion.enabled)
          .map((assertion) => ({
            ...assertion,
            requestId: activeRequest.id, // ✅ attach requestId
            expectedValue:
              assertion.expectedValue !== undefined &&
                assertion.expectedValue !== null
                ? typeof assertion.expectedValue === 'string'
                  ? assertion.expectedValue
                  : JSON.stringify(assertion.expectedValue)
                : '', // fallback to empty string
          }))
        : [];

      const requestData = {
        workspaceId: currentWorkspace.id,
        description: '',
        name: activeRequest.name || 'New Request',
        order: maxOrder + 1,
        method: method,
        url: url,
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
        authorizationType: authType,
        // ✅ FIX: Always include token when there's one, regardless of authType check
        authorization: {
          token: authData.token, // Always include the token
          username: authType === 'basic' ? authData.username : '',
          password: authType === 'basic' ? authData.password : '',
          key: authType === 'apiKey' ? authData.key : '',
          value: authType === 'apiKey' ? authData.value : '',
          addTo: authType === 'apiKey' ? authData.addTo : 'header',
          oauth1:
            authType === 'oauth1'
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
            authType === 'oauth2'
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
        params: params,
        headers: headers,
        assertions: selectedAssertions,
      };

      if (!activeRequest.id) {
        showError('Missing ID', 'Cannot update a request without an id.');
        return;
      }

      await updateRequestMutation.mutateAsync({
        requestId: activeRequest.id,
        requestData,
      });
      toast({
        title: 'Request updated successfully!',
        duration: 3000,
        type: 'success',
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
      if (!activeRequest || !currentWorkspace) return;
      if (!url.trim()) {
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
          const createdCollection = collections.find(
            (collection) => collection.id === res.collectionId
          );
          setActiveCollection(createdCollection || null);
        }
      }

      if (
        !activeCollection &&
        (!isCreatingCollection || !newCollectionName.trim())
      ) {
        showError(
          'Collection Required',
          'Please select or create a collection to save the request.'
        );
        return;
      }

      let maxOrder = 0;
      if (activeCollection) {
        const response = await fetchCollectionRequests.mutateAsync(
          activeCollection.id
        );
        if (response && response.length > 0) {
          maxOrder = Math.max(...response.map((req) => req.order || 0));
        }
      }

      // ✅ normalize authorizationType
      let effectiveAuthType = authType;
      if (authData?.token && (!authType || authType === 'none')) {
        effectiveAuthType = 'bearer';
      }

      // Get selected assertions
      const selectedAssertions = Array.isArray(assertions)
        ? assertions.filter((a) => a.enabled).map((a) => a)
        : [];

      const requestData = {
        workspaceId: currentWorkspace.id,
        collectionId: createdCollectionId || activeCollection?.id,
        description: '',
        name: activeRequest.name || 'New Request',
        order: maxOrder + 1,
        method,
        url,
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
        authorizationType: effectiveAuthType, // ✅ fixed here
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
        headers,
        assertions: selectedAssertions,
      };

      console.log('requestData to save:', requestData);

      const savedRequestResponse = await addRequestMutation.mutateAsync(
        requestData
      );

      setShowSaveModal(false);
      setNewCollectionName('');
      setIsCreatingCollection(false);
      showSuccess('Request saved successfully!');

      if (
        savedRequestResponse &&
        (savedRequestResponse.id || savedRequestResponse.requestId)
      ) {
        const newId = savedRequestResponse.id || savedRequestResponse.requestId;
        const updatedRequest = {
          ...activeRequest,
          id: newId,
          collectionId: createdCollectionId || activeCollection?.id,
          name: activeRequest.name || 'New Request',
          method,
          url,
          bodyType,
          authorizationType: effectiveAuthType,
          authorization: requestData.authorization,
          params,
          headers,
        };
        setActiveRequest(updatedRequest);
      }
    } catch (error) {
      console.error('Error saving request:', error);
      showError('Save Failed', 'An error occurred while saving the request.');
      setError({
        title: 'Save Failed',
        description: 'An error occurred while saving the request.',
      });
    }
  };

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
    setIsCreatingCollection(false);
    setNewCollectionName('');
  };

  const addParam = () => {
    setParams([...params, { key: '', value: '', enabled: true }]);
  };

  const updateParam = (
    index: number,
    field: keyof Param,
    value: string | boolean
  ) => {
    const newParams = [...params];
    newParams[index] = { ...newParams[index], [field]: value };
    setParams(newParams);
  };

  const removeParam = (index: number) => {
    setParams(params.filter((_, i) => i !== index));
  };

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }]);
  };

  const updateHeader = (
    index: number,
    field: keyof Header,
    value: string | boolean
  ) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setHeaders(newHeaders);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  // Form data field handlers
  const addFormField = () => {
    setFormFields([
      ...formFields,
      { key: '', value: '', enabled: true, type: 'text' },
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
  };

  const removeFormField = (index: number) => {
    setFormFields(formFields.filter((_, i) => i !== index));
  };

  // URL encoded field handlers
  const addUrlEncodedField = () => {
    setUrlEncodedFields([
      ...urlEncodedFields,
      { key: '', value: '', enabled: true },
    ]);
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
  };

  const removeUrlEncodedField = (index: number) => {
    setUrlEncodedFields(urlEncodedFields.filter((_, i) => i !== index));
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

  if (!activeRequest) {
    return (
      <div className='flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4'>
        <div className='text-center'>
          <p className='text-gray-500 dark:text-gray-400 mb-4'>
            No request selected
          </p>
          <p className='text-sm text-gray-400'>
            Select a request from the sidebar or create a new one
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className='flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden'>
        <div className='border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <EditableText
                value={activeRequest.name || ''}
                onSave={handleSaveName}
                placeholder='Request Name'
                fontSize='lg'
                fontWeight='semibold'
              />
            </div>
          </div>
        </div>

        {/* Request URL Bar */}
        <div className='border-b border-gray-200 dark:border-gray-700 p-4 flex-shrink-0'>
          <div className='flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2'>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as RequestMethod)}
              className={`w-full sm:w-auto border rounded-md px-3 py-2 text-sm font-medium hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-150 ${getMethodColor(
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
              onChange={(e) => setUrl(e.target.value)}
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
                {!activeRequest.id ? (
                  <button
                    onClick={handleSaveRequest}
                    className='border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-md'
                    aria-label='Save request'
                  >
                    <Save className='h-4 w-4 text-[#136fb0]' />
                  </button>
                ) : (
                  <button
                    onClick={handleUpdateRequest}
                    className='border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-md'
                    aria-label='Save request'
                  >
                    <Save className='h-4 w-4 text-[#136fb0]' />
                  </button>
                )}
              </TooltipContainer>

              <TooltipContainer text='Import from cURL'>
                <button
                  onClick={() => setShowCurlImport(true)}
                  className='border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium'
                  title='Import from cURL'
                >
                  <FileTerminal className='h-4 w-4 text-[#136fb0]' />
                </button>
              </TooltipContainer>

              <TooltipContainer text='New request'>
                <button
                  onClick={() => {
                    handleCreateRequest();
                  }}
                  className='border border-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800'
                  title='Create new request'
                >
                  <Plus className='h-4 w-4 text-[#136fb0]' />
                </button>
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

        {/* Request Tabs */}
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
              { id: 'body', label: 'Body' },
              { id: 'auth', label: 'Authorization' },
              {
                id: 'assertions',
                label: 'Assertions',
                count: Array.isArray(assertions)
                  ? assertions.filter((a) => a.enabled).length
                  : 0,
              },
              { id: 'settings', label: 'Settings' },
              { id: 'schemas', label: 'Schemas' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  py-4 px-2 sm:px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-[#136fb0] text-[#136fb0]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className='ml-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5 text-xs'>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content - This div now has overflow-auto to enable scrolling */}
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
                <h3 className='text-base sm:text-lg font-medium text-gray-900 dark:text-white'>
                  Request Body
                </h3>
                <select
                  value={bodyType}
                  onChange={(e) => setBodyType(e.target.value as any)}
                  className='border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-sm font-medium hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-150'
                >
                  <option value='none'>None</option>
                  <option value='json'>JSON</option>
                  <option value='form-data'>Form Data</option>
                  <option value='x-www-form-urlencoded'>
                    x-www-form-urlencoded
                  </option>
                  <option value='raw'>Raw</option>
                  <option value='binary'>Binary</option>
                </select>
              </div>

              {bodyType === 'none' && (
                <div className='text-gray-500 dark:text-gray-400 text-center p-8'>
                  This request does not have a body
                </div>
              )}

              {bodyType === 'json' && (
                // <textarea
                //   value={bodyContent}
                //   onChange={(e) => setBodyContent(e.target.value)}
                //   placeholder='Enter JSON body'
                //   rows={8}
                //   className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 font-mono text-sm dark:bg-gray-800 dark:text-white'
                // />
                <CodeMirror
                  value={bodyContent}
                  options={{
                    mode: { name: 'javascript', json: true },
                    theme: 'whiteorange',
                    lineNumbers: true,
                    lineWrapping: true,
                  }}
                  onBeforeChange={(editor, data, value) => {
                    setBodyContent(value);
                  }}
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
                <>
                  {/* <textarea
                  value={bodyContent}
                  onChange={(e) => setBodyContent(e.target.value)}
                  placeholder='Enter raw request body'
                  rows={8}
                  className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 font-mono text-sm dark:bg-gray-800 dark:text-white'
                /> */}
                  {/* <CodeMirror
                    value={bodyContent}
                    options={{
                      mode: { name: 'javascript', json: true },
                      theme: 'material', // base dark theme
                      lineNumbers: true,
                      lineWrapping: true,
                    }}
                    onBeforeChange={(editor, data, value) => {
                      setBodyContent(value);
                    }}
                    editorDidMount={(editor) => {
                      editor.getWrapperElement().style.fontSize = '14px';
                      editor.getWrapperElement().style.color = '#FFA500';
                    }}
                  /> */}

                  <CodeMirror
                    value={bodyContent}
                    options={{
                      mode: { name: 'javascript', json: true },
                      theme: 'whiteorange',
                      lineNumbers: true,
                      lineWrapping: true,
                    }}
                    onBeforeChange={(editor, data, value) => {
                      setBodyContent(value);
                    }}
                  />

                </>


              )}



              {bodyType === 'binary' && (
                <div className='text-center p-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-md'>
                  <p className='text-gray-500 dark:text-gray-400 mb-4'>
                    Select a file to upload
                  </p>
                  <Button   >
                    Choose File
                  </Button>
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
                {/* Locked to Bearer only */}
                <select
                  value='bearer'
                  disabled
                  className='border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-sm font-medium focus:outline-none'
                >
                  <option value='bearer'>Bearer Token</option>
                </select>
              </div>

              {/* Bearer Token only */}
              <div>
                <Input
                  type='text'
                  value={authData.token}
                  onChange={(e) =>
                    setAuthData({ ...authData, token: e.target.value })
                  }
                  placeholder='Enter token'
                // className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-all duration-150 bg-white dark:bg-gray-800 text-sm'
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

        {/* Save Modal */}
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
                  !activeCollection &&
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
                  value={activeCollection?.id || ''} // Set the value to show selected collection
                  onChange={(e) => {
                    setActiveCollection(
                      collections.find((c) => c.id === e.target.value) || null
                    );
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

          {!url.trim() && (
            <div className='mt-2 text-red-600 text-sm'>
              URL is required to save a request.
            </div>
          )}

          {!activeCollection &&
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
