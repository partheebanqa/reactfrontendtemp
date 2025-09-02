'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { Play, Save, FolderPlus } from 'lucide-react';
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
import HelpLink from '@/components/HelpModal/HelpLink';
import { executeRequest } from '@/services/executeRequest.service';
import { updateRequest } from '@/services/collection.service';
import { useMutation } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

const RequestEditor: React.FC = () => {
  const { isLoading, clearError, setLoading, setError, setResponseData } =
    useRequest();
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
    toggleExpandedCollection,
    renameRequestMutation,
    setCollection,
    expandedCollections,
    handleCreateRequest,
    fetchCollectionRequests,
  } = useCollection();

  const { variables, environments, activeEnvironment } = useDataManagement();
  const { error: showError, success: showSuccess, toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState<
    'params' | 'headers' | 'body' | 'auth' | 'scripts' | 'settings' | 'schemas'
  >('params');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState<RequestMethod>('GET');
  const [params, setParams] = useState<Param[]>([]);
  const [headers, setHeaders] = useState<Header[]>([]);
  const [bodyType, setBodyType] = useState<
    'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary'
  >('json');
  const [bodyContent, setBodyContent] = useState('');
  const [formFields, setFormFields] = useState<KeyValuePairWithFile[]>([]);
  const [urlEncodedFields, setUrlEncodedFields] = useState<Param[]>([]);
  const [authType, setAuthType] = useState<
    'none' | 'basic' | 'bearer' | 'apiKey' | 'oauth1' | 'oauth2'
  >('none');
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
  const [preRequestScript, setPreRequestScript] = useState('');
  const [testScript, setTestScript] = useState('');
  const [settings, setSettings] = useState({
    followRedirects: true,
    timeout: 30000, // 30 seconds
    sslVerification: true,
  });

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
      setAuthType(
        (activeRequest.authorizationType as
          | 'none'
          | 'basic'
          | 'bearer'
          | 'apiKey'
          | 'oauth1'
          | 'oauth2') || 'none'
      );
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
      setPreRequestScript('');
      setTestScript('');
    } else {
      handleCreateRequest();
    }
    setResponseData(null);
  }, [activeRequest]);

  const handleSendRequest = async () => {
    console.log('activeRequest:', activeRequest);
    if (!activeRequest) return;
    clearError();
    setLoading(true);
    const newUrl = buildFinalUrl();
    try {
      // Create FormData object for file uploads if needed
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

      const requestData = {
        request: {
          name: activeRequest.name || 'New Request',
          workspaceId: currentWorkspace?.id || '',
          method: method,
          url: newUrl,
          params: params,
          headers: headers,
          bodyRawContent: requestFormData || bodyContent,
          bodyType: bodyType,
          formData:
            bodyType === 'form-data'
              ? formFields
                  .filter((f) => f.enabled)
                  .reduce((acc, field) => {
                    // For file fields, store a reference to the file object
                    if (field.type === 'file' && field.value instanceof File) {
                      acc[field.key] = field.value;
                    } else {
                      acc[field.key] = String(field.value);
                    }
                    return acc;
                  }, {} as Record<string, string | File>)
              : undefined,
          urlEncodedData:
            bodyType === 'x-www-form-urlencoded'
              ? urlEncodedFields
                  .filter((f) => f.enabled)
                  .reduce((acc, field) => {
                    acc[field.key] = field.value;
                    return acc;
                  }, {} as Record<string, string>)
              : undefined,
          authorizationType: authType,
          authorization: {
            token: authType === 'bearer' ? authData.token : '',
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
        },
      };
      console.log('requestData123:', requestData);

      // const response = await makeRequest(requestData);
      const backendData = await executeRequest(requestData);

      const result = backendData?.data?.responses?.[0];

      if (result) {
        let parsedBody: any = result.body;
        if (typeof result.body === 'string') {
          try {
            parsedBody = JSON.parse(result.body);
          } catch {
            parsedBody = result.body;
          }
        }

        const normalizedResponse = {
          status: result.statusCode,
          statusCode: result.statusCode,
          headers: result.headers ?? {},
          body: parsedBody,
          rawBody: result.body,
          metrics: result.metrics ?? {},
        };

        setResponseData(normalizedResponse as any);
      }
    } catch (error: any) {
      setError({
        title: 'Unexpected Error',
        description: 'An unexpected error occurred while sending the request.',
        suggestions: [
          'Check your network connection',
          'Try the request again',
          'Contact support if the problem persists',
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async (newName: string) => {
    try {
      if (!activeRequest) return;
      if (newName.trim() && activeRequest?.id) {
        await renameRequestMutation.mutateAsync({
          requestId: activeRequest.id,
          newName: newName.trim(),
        });
        toast({
          title: 'Request renamed successfully!',
          duration: 3000,
          type: 'success',
        });
      }
      const active = { ...activeRequest, name: newName.trim() };
      setActiveRequest(active);
      setCollection(
        collections.map((collection) => {
          if (collection.id === activeRequest.collectionId) {
            return {
              ...collection,
              requests: collection.requests.map((request) => {
                return request.order === activeRequest.order ? active : request;
              }),
            };
          } else {
            return collection;
          }
        })
      );
    } catch (error) {
      console.error('Error saving request name:', error);
      showError(
        'Rename Failed',
        'An error occurred while renaming the request name.'
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

    setShowSaveModal(true);
    if (activeRequest.collectionId) {
      const collection = collections.find(
        (c) => c.id === activeRequest.collectionId
      );
      setActiveCollection(collection || null);
    } else {
      const workspaceCollections = collections.filter(
        (collection) => collection.workspaceId === currentWorkspace?.id
      );
      if (workspaceCollections.length > 0) {
        setActiveCollection(workspaceCollections[0]);
      }
    }
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

      let requestCount = 0;
      if (activeCollection) {
        const response = await fetchCollectionRequests.mutateAsync(
          activeCollection.id
        );
        requestCount = response.length;
      }

      const requestData = {
        // collectionId removed per backend contract
        workspaceId: currentWorkspace.id, // REQUIRED by backend
        description: '',
        name: activeRequest.name || 'New Request',
        order: (requestCount || 0) + 1,
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
            : [], // use empty array when not used (no null)
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
            : '', // use empty string when not used (no null)
        authorizationType: authType,
        authorization: {
          token: authType === 'bearer' ? authData.token : '',
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
      let requestCount = 0;
      if (activeCollection) {
        const response = await fetchCollectionRequests.mutateAsync(
          activeCollection.id
        );
        requestCount = response.length;
      }

      const requestData = {
        collectionId: createdCollectionId
          ? createdCollectionId
          : activeCollection?.id,
        description: '',
        name: activeRequest.name || 'New Request',
        order: (requestCount || 0) + 1,
        method: method,
        url: url,
        bodyType: bodyType == 'json' ? 'raw' : bodyType,
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
            : null,
        bodyRawContent:
          bodyType === 'raw' || bodyType === 'json'
            ? bodyContent
            : bodyType === 'x-www-form-urlencoded'
            ? new URLSearchParams(
                urlEncodedFields
                  .filter((f) => f.enabled)
                  .reduce((acc, field) => {
                    if (field.key) {
                      acc[field.key] = field.value;
                    }
                    return acc;
                  }, {} as Record<string, string>)
              ).toString()
            : null,
        authorizationType: authType,
        authorization: {
          token: authType === 'bearer' ? authData.token : '',
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
        // variables: activeRequest.variables || {},
      };
      await addRequestMutation.mutateAsync(requestData);
      setShowSaveModal(false);
      setNewCollectionName('');
      setIsCreatingCollection(false);
      showSuccess('Request saved successfully!');
      handleCreateRequest();
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

    // Apply variable substitution
    finalUrl = substituteVariables(finalUrl);

    const baseUrVar =
      variables.find((v) => v.name === 'baseUrl')?.initialValue || '';

    // Apply environment base URL if not "no-environment"
    if (baseUrVar) {
      try {
        const originalUrl = new URL(finalUrl);
        const pathAndQuery =
          originalUrl.pathname + originalUrl.search + originalUrl.hash;

        // Combine activeEnvironment base URL with the path from original URL
        const baseUrl = baseUrVar.replace(/\/$/, '');
        finalUrl = `${baseUrl}${pathAndQuery}`;
      } catch (error) {
        if (
          !finalUrl.startsWith('http://') &&
          !finalUrl.startsWith('https://')
        ) {
          finalUrl = finalUrl.startsWith('/') ? finalUrl : `/${finalUrl}`;
          finalUrl = `${baseUrVar.replace(/\/$/, '')}${finalUrl}`;
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
            {/* <HelpLink /> */}
          </div>
        </div>

        {/* Request URL Bar */}
        <div className='border-b border-gray-200 dark:border-gray-700 p-4 flex-shrink-0'>
          <div className='flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2'>
            {/* Replace the old method selector with the one built into HighlightedUrlInput */}
            {/* <HighlightedUrlInput 
              url={url} 
              setUrl={setUrl} 
              method={method}
              setMethod={(newMethod) => setMethod(newMethod as RequestMethod)}
            /> */}
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as RequestMethod)}
              className={`w-full sm:w-auto border rounded-md px-3 py-2 text-sm font-medium hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-150 ${getMethodColor(
                method
              )}`}
              style={{
                appearance: 'auto',
              }} /* Ensures dropdown styling is maintained */
            >
              {methods.map((m) => (
                <option
                  key={m}
                  value={m}
                  className='bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200' /* Normal styling for options */
                >
                  {m}
                </option>
              ))}
            </select>

            <input
              type='text'
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder='Enter request URL'
              className='flex-1 min-w-0 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-all duration-150 dark:bg-gray-800 dark:text-white'
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
                    <Save className='h-4 w-4' />
                  </button>
                ) : (
                  <button
                    onClick={handleUpdateRequest}
                    className='border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-md'
                    aria-label='Save request'
                  >
                    <Save className='h-4 w-4' />
                  </button>
                )}
              </TooltipContainer>

              {/* <button
                className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-md"
                aria-label="More options"
              >
                <MoreVertical className="h-4 w-4" />
              </button> */}
            </div>
          </div>

          {previewUrl && (
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
              { id: 'scripts', label: 'Scripts' },
              { id: 'settings', label: 'Settings' },
              { id: 'schemas', label: 'Schemas' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  py-4 px-2 sm:px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
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
                <textarea
                  value={bodyContent}
                  onChange={(e) => setBodyContent(e.target.value)}
                  placeholder='Enter JSON body'
                  rows={8}
                  className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 font-mono text-sm dark:bg-gray-800 dark:text-white'
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
                <textarea
                  value={bodyContent}
                  onChange={(e) => setBodyContent(e.target.value)}
                  placeholder='Enter raw request body'
                  rows={8}
                  className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 font-mono text-sm dark:bg-gray-800 dark:text-white'
                />
              )}

              {bodyType === 'binary' && (
                <div className='text-center p-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-md'>
                  <p className='text-gray-500 dark:text-gray-400 mb-4'>
                    Select a file to upload
                  </p>
                  <button className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md'>
                    Choose File
                  </button>
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
                  value={authType}
                  onChange={(e) => setAuthType(e.target.value as any)}
                  className='border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-sm font-medium hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-150'
                >
                  <option value='none'>No Auth</option>
                  <option value='basic'>Basic Auth</option>
                  <option value='bearer'>Bearer Token</option>
                  <option value='apiKey'>API Key</option>
                  <option value='oauth1'>OAuth 1.0</option>
                  <option value='oauth2'>OAuth 2.0</option>
                </select>
              </div>

              {authType === 'none' && (
                <div className='text-gray-500 dark:text-gray-400 text-center p-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-md'>
                  No authorization is set for this request
                </div>
              )}

              {authType === 'basic' && (
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Username
                    </label>
                    <input
                      type='text'
                      value={authData.username}
                      onChange={(e) =>
                        setAuthData({ ...authData, username: e.target.value })
                      }
                      placeholder='Enter username'
                      className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-all duration-150 bg-white dark:bg-gray-800 text-sm'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Password
                    </label>
                    <input
                      type='password'
                      value={authData.password}
                      onChange={(e) =>
                        setAuthData({ ...authData, password: e.target.value })
                      }
                      placeholder='Enter password'
                      className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-all duration-150 bg-white dark:bg-gray-800 text-sm'
                    />
                  </div>
                </div>
              )}

              {authType === 'bearer' && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Token
                  </label>
                  <input
                    type='text'
                    value={authData.token}
                    onChange={(e) =>
                      setAuthData({ ...authData, token: e.target.value })
                    }
                    placeholder='Enter token'
                    className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-all duration-150 bg-white dark:bg-gray-800 text-sm'
                  />
                  <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                    The token will be sent as "Bearer {token}" in the
                    Authorization header
                  </p>
                </div>
              )}

              {authType === 'apiKey' && (
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Key
                    </label>
                    <input
                      type='text'
                      value={authData.key}
                      onChange={(e) =>
                        setAuthData({ ...authData, key: e.target.value })
                      }
                      placeholder='Enter API key name'
                      className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-all duration-150 bg-white dark:bg-gray-800 text-sm'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Value
                    </label>
                    <input
                      type='text'
                      value={authData.value}
                      onChange={(e) =>
                        setAuthData({ ...authData, value: e.target.value })
                      }
                      placeholder='Enter API key value'
                      className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-all duration-150 bg-white dark:bg-gray-800 text-sm'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Add to
                    </label>
                    <div className='flex space-x-4'>
                      <label className='inline-flex items-center'>
                        <input
                          type='radio'
                          checked={authData.addTo === 'header'}
                          onChange={() =>
                            setAuthData({ ...authData, addTo: 'header' })
                          }
                          className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300'
                        />
                        <span className='ml-2 text-sm text-gray-700 dark:text-gray-300'>
                          Header
                        </span>
                      </label>
                      <label className='inline-flex items-center'>
                        <input
                          type='radio'
                          checked={authData.addTo === 'query'}
                          onChange={() =>
                            setAuthData({ ...authData, addTo: 'query' })
                          }
                          className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300'
                        />
                        <span className='ml-2 text-sm text-gray-700 dark:text-gray-300'>
                          Query Parameter
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {authType === 'oauth1' && (
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Consumer Key
                    </label>
                    <input
                      type='text'
                      value={authData.oauth1.consumerKey}
                      onChange={(e) =>
                        setAuthData({
                          ...authData,
                          oauth1: {
                            ...authData.oauth1,
                            consumerKey: e.target.value,
                          },
                        })
                      }
                      placeholder='Enter consumer key'
                      className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-all duration-150 bg-white dark:bg-gray-800 text-sm'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Consumer Secret
                    </label>
                    <input
                      type='password'
                      value={authData.oauth1.consumerSecret}
                      onChange={(e) =>
                        setAuthData({
                          ...authData,
                          oauth1: {
                            ...authData.oauth1,
                            consumerSecret: e.target.value,
                          },
                        })
                      }
                      placeholder='Enter consumer secret'
                      className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-all duration-150 bg-white dark:bg-gray-800 text-sm'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Access Token
                    </label>
                    <input
                      type='text'
                      value={authData.oauth1.token}
                      onChange={(e) =>
                        setAuthData({
                          ...authData,
                          oauth1: { ...authData.oauth1, token: e.target.value },
                        })
                      }
                      placeholder='Enter access token'
                      className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-all duration-150 bg-white dark:bg-gray-800 text-sm'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Token Secret
                    </label>
                    <input
                      type='password'
                      value={authData.oauth1.tokenSecret}
                      onChange={(e) =>
                        setAuthData({
                          ...authData,
                          oauth1: {
                            ...authData.oauth1,
                            tokenSecret: e.target.value,
                          },
                        })
                      }
                      placeholder='Enter token secret'
                      className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-all duration-150 bg-white dark:bg-gray-800 text-sm'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Signature Method
                    </label>
                    <select
                      value={authData.oauth1.signatureMethod}
                      onChange={(e) =>
                        setAuthData({
                          ...authData,
                          oauth1: {
                            ...authData.oauth1,
                            signatureMethod: e.target.value,
                          },
                        })
                      }
                      className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-sm font-medium hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-150'
                    >
                      <option value='HMAC-SHA1'>HMAC-SHA1</option>
                      <option value='HMAC-SHA256'>HMAC-SHA256</option>
                      <option value='PLAINTEXT'>PLAINTEXT</option>
                      <option value='RSA-SHA1'>RSA-SHA1</option>
                    </select>
                  </div>
                  <div>
                    <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                      OAuth 1.0 parameters will be automatically generated and
                      added to the Authorization header.
                    </p>
                  </div>
                </div>
              )}

              {authType === 'oauth2' && (
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Grant Type
                    </label>
                    <select
                      value={authData.oauth2.grantType}
                      onChange={(e) =>
                        setAuthData({
                          ...authData,
                          oauth2: {
                            ...authData.oauth2,
                            grantType: e.target.value as any,
                          },
                        })
                      }
                      className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-sm font-medium hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-150'
                    >
                      <option value='authorization_code'>
                        Authorization Code
                      </option>
                      <option value='client_credentials'>
                        Client Credentials
                      </option>
                      <option value='password'>Password</option>
                      <option value='refresh_token'>Refresh Token</option>
                    </select>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Access Token
                    </label>
                    <input
                      type='text'
                      value={authData.oauth2.accessToken}
                      onChange={(e) =>
                        setAuthData({
                          ...authData,
                          oauth2: {
                            ...authData.oauth2,
                            accessToken: e.target.value,
                          },
                        })
                      }
                      placeholder='Enter access token'
                      className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-all duration-150 bg-white dark:bg-gray-800 text-sm'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Client ID
                    </label>
                    <input
                      type='text'
                      value={authData.oauth2.clientId}
                      onChange={(e) =>
                        setAuthData({
                          ...authData,
                          oauth2: {
                            ...authData.oauth2,
                            clientId: e.target.value,
                          },
                        })
                      }
                      placeholder='Enter client ID'
                      className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-all duration-150 bg-white dark:bg-gray-800 text-sm'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Client Secret
                    </label>
                    <input
                      type='password'
                      value={authData.oauth2.clientSecret}
                      onChange={(e) =>
                        setAuthData({
                          ...authData,
                          oauth2: {
                            ...authData.oauth2,
                            clientSecret: e.target.value,
                          },
                        })
                      }
                      placeholder='Enter client secret'
                      className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-all duration-150 bg-white dark:bg-gray-800 text-sm'
                    />
                  </div>
                  {authData.oauth2.grantType === 'authorization_code' && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                        Redirect URI
                      </label>
                      <input
                        type='text'
                        value={authData.oauth2.redirectUri}
                        onChange={(e) =>
                          setAuthData({
                            ...authData,
                            oauth2: {
                              ...authData.oauth2,
                              redirectUri: e.target.value,
                            },
                          })
                        }
                        placeholder='Enter redirect URI'
                        className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-all duration-150 bg-white dark:bg-gray-800 text-sm'
                      />
                    </div>
                  )}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Scope
                    </label>
                    <input
                      type='text'
                      value={authData.oauth2.scope}
                      onChange={(e) =>
                        setAuthData({
                          ...authData,
                          oauth2: { ...authData.oauth2, scope: e.target.value },
                        })
                      }
                      placeholder='Enter scope (space-separated)'
                      className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-all duration-150 bg-white dark:bg-gray-800 text-sm'
                    />
                  </div>
                  <div>
                    <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                      OAuth 2.0 access token will be sent as a Bearer token in
                      the Authorization header.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'scripts' && (
            <div className='space-y-6'>
              <div className='space-y-2'>
                <h3 className='text-base sm:text-lg font-medium text-gray-900 dark:text-white'>
                  Pre-request Script
                </h3>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  This script will be executed before the request is sent
                </p>
                <textarea
                  value={preRequestScript}
                  onChange={(e) => setPreRequestScript(e.target.value)}
                  placeholder='// Write pre-request JavaScript code here'
                  rows={6}
                  className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-all duration-150 font-mono text-sm dark:bg-gray-800 dark:text-white'
                />
              </div>

              <div className='space-y-2'>
                <h3 className='text-base sm:text-lg font-medium text-gray-900 dark:text-white'>
                  Tests
                </h3>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  This script will be executed after the response is received
                </p>
                <textarea
                  value={testScript}
                  onChange={(e) => setTestScript(e.target.value)}
                  placeholder="// Write test JavaScript code here
// Example: 
// pm.test('Status code is 200', function() {
//   pm.response.to.have.status(200);
// });"
                  rows={8}
                  className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-all duration-150 font-mono text-sm dark:bg-gray-800 dark:text-white'
                />
              </div>

              <div className='bg-blue-50 dark:bg-blue-900 p-3 rounded-md'>
                <h4 className='text-sm font-medium text-blue-800 dark:text-blue-200'>
                  Tip
                </h4>
                <p className='text-xs text-blue-700 dark:text-blue-300 mt-1'>
                  You can access request and response data using the{' '}
                  <code className='bg-blue-100 dark:bg-blue-800 px-1 rounded'>
                    pm
                  </code>{' '}
                  object. Use{' '}
                  <code className='bg-blue-100 dark:bg-blue-800 px-1 rounded'>
                    pm.request
                  </code>{' '}
                  for request data and
                  <code className='bg-blue-100 dark:bg-blue-800 px-1 rounded'>
                    pm.response
                  </code>{' '}
                  for response data.
                </p>
              </div>
            </div>
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
      </div>
    </TooltipProvider>
  );
};

export default RequestEditor;
