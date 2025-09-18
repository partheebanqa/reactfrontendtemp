'use client';

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Save,
  FolderPlus,
  Filter,
  CheckSquare,
  Square,
  Zap,
  Search,
} from 'lucide-react';
import { useRequest } from '@/hooks/useRequest';
import { useCollection } from '@/hooks/useCollection';
import { useWorkspace } from '@/hooks/useWorkspace';
import type { Header, Param, RequestMethod } from '@/shared/types/request';
import type { Assertion } from '@/store/requestStore';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useDataManagement } from '@/hooks/useDataManagement';
import { executeCollectionRequest } from '@/services/executeRequest.service';
import { updateRequest } from '@/services/collection.service';
import { useMutation } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { generateAssertions } from '@/utils/assertionGenerator';
import EditableNumber from '@/components/ui/EditableNumber';

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
    | 'params'
    | 'headers'
    | 'body'
    | 'auth'
    | 'assertions'
    | 'settings'
    | 'schemas'
  >('params');

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showAssertionDialog, setShowAssertionDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
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
  const [settings, setSettings] = useState({
    followRedirects: true,
    timeout: 30000,
    sslVerification: true,
  });

  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  const parseTextWithEditableNumbers = (
    text: string,
    assertionId: string,
    field: 'description' | 'impact'
  ): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const numberRegex = /\b\d+\b/g;
    let lastIndex = 0;
    let match;

    while ((match = numberRegex.exec(text)) !== null) {
      // Add text before the number
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      const numberValue = match[0];
      const numberIndex = match.index;
      const editKey = `${assertionId}-${field}-${numberIndex}`;

      // Add the editable number
      parts.push(
        <EditableNumber
          key={editKey}
          value={numberValue}
          onSave={(newValue) => {
            setAssertions((prevAssertions) => {
              if (!Array.isArray(prevAssertions)) return prevAssertions;

              return prevAssertions.map((assertion) => {
                if (assertion.id !== assertionId) return assertion;

                const updatedAssertion = { ...assertion };

                // Update the description/impact text
                const regex = new RegExp(`\\b${numberValue}\\b`, 'g');
                if (field === 'description') {
                  updatedAssertion.description = assertion.description.replace(
                    regex,
                    newValue
                  );
                } else if (field === 'impact') {
                  updatedAssertion.impact = assertion.impact.replace(
                    regex,
                    newValue
                  );
                }

                // Update related numeric properties
                const numericValue = Number.parseInt(newValue);
                const originalValue = Number.parseInt(numberValue);

                if (!isNaN(numericValue) && !isNaN(originalValue)) {
                  // Update expectedValue if it matches
                  if (assertion.expectedValue === originalValue) {
                    updatedAssertion.expectedValue = numericValue;
                  }

                  // Update ID if it contains the original value
                  if (assertion.id.includes(numberValue)) {
                    updatedAssertion.id = assertion.id.replace(
                      numberValue,
                      newValue
                    );
                  }

                  // Update other numeric properties that might match
                  if (assertion.minValue === originalValue) {
                    updatedAssertion.minValue = numericValue;
                  }
                  if (assertion.maxValue === originalValue) {
                    updatedAssertion.maxValue = numericValue;
                  }
                }

                return updatedAssertion;
              });
            });
          }}
        />
      );

      lastIndex = numberRegex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  const updateAssertions = useCallback(
    (updater: (prev: Assertion[]) => Assertion[]) => {
      setAssertions((prev) => {
        if (!prev || !Array.isArray(prev)) {
          console.warn(
            '[v0] Previous assertions is not an array, returning empty array:',
            prev
          );
          return [];
        }
        const result = updater(prev);
        if (!Array.isArray(result)) {
          console.error('[v0] Updater returned non-array:', result);
          return prev; // Return previous state if update failed
        }
        return result;
      });
    },
    []
  );

  const applyEditedValues = (assertion: Assertion): Assertion => {
    const updatedAssertion = { ...assertion };
    let updatedDescription = assertion.description;
    let updatedImpact = assertion.impact;

    // Apply any edited values for this assertion
    Object.entries(editedValues).forEach(([editKey, newValue]) => {
      if (editKey.startsWith(`${assertion.id}-description-`)) {
        const originalValue = editKey.split('-').pop();

        if (originalValue) {
          const regex = new RegExp(`\\b${originalValue}\\b`, 'g');
          updatedDescription = updatedDescription.replace(regex, newValue);

          // Update related assertion properties based on the assertion type
          const numericValue = Number.parseInt(newValue);
          if (!isNaN(numericValue)) {
            // Update expectedValue if it matches the original value
            if (assertion.expectedValue === Number.parseInt(originalValue)) {
              updatedAssertion.expectedValue = numericValue;
            }

            // Update ID if it contains the original value
            if (assertion.id.includes(originalValue)) {
              updatedAssertion.id = assertion.id.replace(
                originalValue,
                newValue
              );
            }

            // Update other numeric properties that might match
            if (assertion.minValue === Number.parseInt(originalValue)) {
              updatedAssertion.minValue = numericValue;
            }
            if (assertion.maxValue === Number.parseInt(originalValue)) {
              updatedAssertion.maxValue = numericValue;
            }
          }
        }
      } else if (editKey.startsWith(`${assertion.id}-impact-`)) {
        const originalValue = editKey.split('-').pop();
        if (originalValue) {
          const regex = new RegExp(`\\b${originalValue}\\b`, 'g');
          updatedImpact = updatedImpact.replace(regex, newValue);
        }
      }
    });

    return {
      ...updatedAssertion,
      description: updatedDescription,
      impact: updatedImpact,
    };
  };

  const getFilteredAssertions = (): Assertion[] => {
    if (!assertions || !Array.isArray(assertions)) {
      console.warn('[v0] Assertions is not an array:', assertions);
      return [];
    }
    if (selectedCategory === 'all') return assertions;
    return assertions.filter(
      (assertion) => assertion.category === selectedCategory
    );
  };

  const getSelectedAssertions = (): Assertion[] => {
    if (!assertions || !Array.isArray(assertions)) {
      console.warn(
        '[v0] Assertions is not an array in getSelectedAssertions:',
        assertions
      );
      return [];
    }
    return assertions.filter((a) => a.enabled);
  };

  const getSelectedAssertionsByCategory = () => {
    if (!assertions || !Array.isArray(assertions) || assertions.length === 0) {
      console.warn(
        '[v0] Assertions is not a valid array in getSelectedAssertionsByCategory:',
        assertions
      );
      return {};
    }

    const selectedAssertions = assertions.filter((a) => a.enabled);
    const categoryCount: Record<string, number> = {};

    selectedAssertions.forEach((assertion) => {
      categoryCount[assertion.category] =
        (categoryCount[assertion.category] || 0) + 1;
    });

    return categoryCount;
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

  const handleSendRequest = async () => {
    if (!activeRequest) return;
    clearError();
    setLoading(true);
    const newUrl = buildFinalUrl();

    try {
      // 🔹 File uploads handling...
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

      // 🔹 Call backend
      if (!activeRequest?.id) {
        throw new Error('please save a request before sending.');
      }

      const backendData = await executeCollectionRequest(activeRequest.id);

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
        };

        setResponseData(normalizedResponse as any);

        // 🔹 Generate assertions
        const formattedResponse = formatBackendResponse(normalizedResponse);
        const generatedAssertions = generateAssertions(formattedResponse);

        const existingAssertions = assertions || [];
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

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
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

  const handleGenerateAssertions = () => {
    if (!responseData) {
      showError(
        'No Response',
        'Please send a request first to generate assertions.'
      );
      return;
    }

    // Generate assertions if not already available or if we want to refresh them
    const formattedResponse = formatBackendResponse(responseData);
    const generatedAssertions = generateAssertions(formattedResponse);

    // Merge with existing assertions, keeping existing ones enabled
    const existingAssertions = assertions || [];
    const existingIds = new Set(existingAssertions.map((a) => a.id));

    // Add new generated assertions that don't already exist
    const newAssertions = generatedAssertions.filter(
      (newAssertion) => !existingIds.has(newAssertion.id)
    );

    const mergedAssertions = [...existingAssertions, ...newAssertions];
    setAssertions(mergedAssertions);

    setShowAssertionDialog(true);
  };

  const handleSaveAssertions = async () => {
    try {
      if (!assertions || !Array.isArray(assertions)) {
        console.error('[v0] Assertions is not an array:', assertions);
        return;
      }

      if (!activeRequest?.id) {
        toast({
          title: 'Error',
          description: 'Cannot update a request without an id.',
          variant: 'destructive',
        });
        return;
      }

      const selectedAssertions = assertions
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
        }));

      const requestData = {
        assertions: selectedAssertions,
        workspaceId: currentWorkspace?.id,
      };

      await updateRequestMutation.mutateAsync({
        requestId: activeRequest.id,
        requestData,
      });

      toast({
        title: 'Success',
        description: 'Assertions saved successfully',
      });
      setShowAssertionDialog(false);
    } catch (error) {
      console.error('[v0] Error saving assertions:', error);
      toast({
        title: 'Error',
        description: 'Failed to save assertions',
        variant: 'destructive',
      });
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

      const selectedAssertions = assertions
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
        }));

      const requestData = {
        workspaceId: currentWorkspace.id,
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
      let requestCount = 0;
      if (activeCollection) {
        const response = await fetchCollectionRequests.mutateAsync(
          activeCollection.id
        );
        requestCount = response.length;
      }

      // Get selected assertions from the store
      const selectedAssertions = assertions
        .filter((assertion) => assertion.enabled)
        .map((assertion) => assertion);

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
        assertions: selectedAssertions,
        // variables: activeRequest.variables || {},
      };

      const savedRequestResponse = await addRequestMutation.mutateAsync(
        requestData
      );

      setShowSaveModal(false);
      setNewCollectionName('');
      setIsCreatingCollection(false);
      showSuccess('Request saved successfully!');

      if (savedRequestResponse && savedRequestResponse.id) {
        const updatedRequest = {
          ...activeRequest,
          id: savedRequestResponse.id,
          collectionId: createdCollectionId || activeCollection?.id,
          name: activeRequest.name || 'New Request',
          method: method,
          url: url,
          bodyType: bodyType,
          authorizationType: authType,
          authorization: requestData.authorization,
          params: params,
          headers: headers,
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

  // Get unique categories from assertions
  const getCategories = (): string[] => {
    if (!assertions || assertions.length === 0) return [];
    const categories = [
      ...new Set(assertions.map((assertion) => assertion.category)),
    ];
    return categories.sort();
  };

  // Get category display name with proper capitalization
  const getCategoryDisplayName = (category: string): string => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  // Get assertion type badge color
  const getAssertionTypeColor = (category: string): string => {
    const colors: Record<string, string> = {
      status:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      headers: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      body: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      response:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      performance:
        'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    };
    return (
      colors[category] ||
      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
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
              {
                id: 'assertions',
                label: 'Assertions',
                count: assertions?.filter((a) => a.enabled).length || 0,
              },
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

          {activeTab === 'assertions' && (
            <div className='space-y-4'>
              <div className='flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between'>
                <div>
                  <h3 className='text-base sm:text-lg font-medium text-gray-900 dark:text-white'>
                    Manage Assertions
                  </h3>
                  <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                    Send a request and click "Generate Assertions" to
                    automatically create and manage test assertions.
                  </p>
                </div>
                <Button onClick={handleGenerateAssertions}>
                  <Zap className='h-3 w-3 mr-1' />
                  Generate Assertions
                </Button>
              </div>

              {/* Show selected assertions with full details */}
              {getSelectedAssertions().length > 0 ? (
                <div className='space-y-4'>
                  <div className='border-b border-gray-200 dark:border-gray-600 pb-3'>
                    <h4 className='text-md font-semibold text-gray-900 dark:text-white'>
                      Selected Assertions ({getSelectedAssertions().length})
                    </h4>
                    <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                      These assertions will be included when the request is
                      saved
                    </p>
                  </div>

                  <div className='space-y-3'>
                    {getSelectedAssertions().map((assertion) => (
                      <div
                        key={assertion.id}
                        className='border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 rounded-lg p-4 hover:shadow-sm transition-all duration-200'
                      >
                        <div className='flex items-start space-x-3'>
                          {/* Enabled indicator */}
                          <div className='flex-shrink-0 mt-0.5'>
                            <CheckSquare className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                          </div>

                          {/* Content */}
                          <div className='flex-1 min-w-0'>
                            {/* Top row: Description + Category + Priority */}
                            <div className='flex items-center justify-between gap-2 mb-2'>
                              <p className='text-sm font-medium text-gray-900 dark:text-white'>
                                {parseTextWithEditableNumbers(
                                  assertion.description,
                                  assertion.id,
                                  'description'
                                )}
                                {assertion.operator && (
                                  <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'>
                                    Operator: {assertion.operator}
                                  </span>
                                )}
                              </p>

                              <div className='flex items-center gap-2'>
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAssertionTypeColor(
                                    assertion.category
                                  )}`}
                                >
                                  {getCategoryDisplayName(assertion.category)}
                                </span>

                                {assertion?.priority && (
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                                      assertion.priority
                                    )}`}
                                  >
                                    {assertion.priority}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Operator and expected value */}

                            {/* Field, Group, and Type details */}
                            {/* <div className='flex flex-wrap items-center gap-2 mb-2'>
                              {assertion?.field && (
                                <div className='text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 rounded px-2 py-1'>
                                  Field: {assertion.field}
                                </div>
                              )}
                              {assertion?.group && (
                                <div className='text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 rounded px-2 py-1'>
                                  Group: {assertion.group}
                                </div>
                              )}
                              {assertion.type && (
                                <div className='text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 rounded px-2 py-1'>
                                  Type: {assertion.type}
                                </div>
                              )}
                            </div> */}

                            {/* Impact */}
                            {assertion?.impact && (
                              <div className='text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 italic'>
                                Impact:{' '}
                                {parseTextWithEditableNumbers(
                                  assertion.impact,
                                  assertion.id,
                                  'impact'
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : assertions && assertions.length > 0 ? (
                <div className='text-center p-6 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg'>
                  <p className='text-gray-500 dark:text-gray-400'>
                    You have {assertions.length} assertions available. Click
                    "Generate Assertions" to select which ones to include.
                  </p>
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center h-48 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-lg'>
                  <div className='text-gray-400 mb-4'>
                    <CheckSquare className='h-12 w-12 mx-auto' />
                  </div>
                  <h4 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
                    No Assertions Available
                  </h4>
                  <p className='text-gray-500 dark:text-gray-400 max-w-md'>
                    Send a request first to generate test assertions based on
                    the response.
                  </p>
                </div>
              )}
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

        {/* Assertion Generation Dialog */}
        <Dialog
          open={showAssertionDialog}
          onOpenChange={setShowAssertionDialog}
        >
          <DialogContent className='max-w-4xl max-h-[80vh] overflow-hidden flex flex-col'>
            <DialogHeader className='flex-shrink-0'>
              <DialogTitle>Select Assertions to Include</DialogTitle>
            </DialogHeader>

            <div className='flex-shrink-0 border-b border-gray-200 dark:border-gray-700 pb-4 space-y-4'>
              {/* Category Filter and Search */}
              <div className='flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between'>
                <div className='flex items-center gap-3 flex-1'>
                  {/* <p className='text-sm text-gray-500 dark:text-gray-400'>
                    Choose which assertions for request
                  </p> */}
                  <div className='relative flex-1 max-w-xs'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                    <input
                      type='text'
                      placeholder='Search assertions...'
                      value={searchTerm || ''}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className='w-full pl-10 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-150'
                    />
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  <Filter className='h-4 w-4 text-gray-500' />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className='border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm 
               bg-white dark:bg-gray-800 hover:border-blue-400 
               focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
               focus:outline-none transition-all duration-150'
                  >
                    <option value='all'>
                      All Categories ({assertions?.length || 0})
                    </option>
                    {getCategories().map((category) => {
                      const count =
                        assertions && Array.isArray(assertions)
                          ? assertions.filter((a) => a.category === category)
                              .length
                          : 0;
                      return (
                        <option key={category} value={category}>
                          {getCategoryDisplayName(category)} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-600 dark:text-gray-400'>
                  {assertions?.filter((a) => a.enabled).length || 0} of{' '}
                  {assertions?.length || 0} assertions selected
                </span>
                <div className='flex space-x-2'>
                  <button
                    onClick={() => {
                      assertions.forEach((assertion) => {
                        if (!assertion.enabled) {
                          toggleAssertion(assertion.id);
                        }
                      });
                    }}
                    className='px-3 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors'
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => {
                      assertions.forEach((assertion) => {
                        if (assertion.enabled) {
                          toggleAssertion(assertion.id);
                        }
                      });
                    }}
                    className='px-3 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
                  >
                    Clear All
                  </button>
                </div>
              </div> */}
            </div>

            <div className='flex-1 overflow-y-auto'>
              {assertions && assertions.length > 0 ? (
                <div className='space-y-3 p-1'>
                  {getFilteredAssertions().map((assertion) => (
                    <div
                      key={assertion.id}
                      className={`border rounded-lg p-4 transition-all duration-200 ${
                        assertion.enabled
                          ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                          : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/20'
                      } hover:shadow-sm`}
                    >
                      <div className='flex items-start space-x-3'>
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleAssertion(assertion.id)}
                          className='flex-shrink-0 mt-0.5 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
                          title={
                            assertion.enabled
                              ? 'Unselect assertion'
                              : 'Select assertion'
                          }
                        >
                          {assertion.enabled ? (
                            <CheckSquare className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                          ) : (
                            <Square className='h-5 w-5 text-gray-400' />
                          )}
                        </button>

                        {/* Content */}
                        <div className='flex-1 min-w-0'>
                          {/* Top row: Description + Category + Priority */}
                          <div className='flex items-center justify-between gap-2'>
                            <p
                              className={`text-sm font-medium truncate ${
                                assertion.enabled
                                  ? 'text-gray-900 dark:text-white'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}
                              title={assertion.description} // tooltip on hover
                            >
                              {parseTextWithEditableNumbers(
                                assertion.description,
                                assertion.id,
                                'description'
                              )}

                              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'>
                                Operator: {assertion.operator}
                              </span>
                            </p>

                            <div className='flex items-center gap-2'>
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAssertionTypeColor(
                                  assertion.category
                                )}`}
                              >
                                {getCategoryDisplayName(assertion.category)}
                              </span>

                              {assertion?.priority && (
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                                    assertion.priority
                                  )}`}
                                >
                                  {assertion.priority}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Operator badge */}
                          <div className='mt-2 flex items-center gap-2 text-sm'>
                            {/* {assertion.operator && (
                              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'>
                                {assertion.operator}
                              </span>
                            )} */}
                            {/* {assertion?.expectedValue && (
                              <span
                                className={`font-mono block truncate max-w-full ${
                                  assertion.enabled
                                    ? 'text-gray-900 dark:text-white'
                                    : 'text-gray-600 dark:text-gray-400'
                                }`}
                                title={String(assertion.expectedValue)} // full value on hover
                              >
                                Expected{' '}
                                {typeof assertion.expectedValue === 'object'
                                  ? JSON.stringify(assertion.expectedValue)
                                  : String(assertion.expectedValue)}
                              </span>
                            )} */}
                          </div>

                          {/* Field + Group same row */}
                          {/* <div className='mt-2 flex flex-wrap items-center gap-2'>
                            {assertion?.field && (
                              <div className='text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 rounded px-2 py-1'>
                                Field: {assertion.field}
                              </div>
                            )}
                            {assertion?.group && (
                              <div className='text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 rounded px-2 py-1'>
                                Group: {assertion.group}
                              </div>
                            )}
                            {assertion.type && (
                              <div className='text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 rounded px-2 py-1'>
                                Type: {assertion.type}
                              </div>
                            )}
                          </div> */}

                          {/* Impact */}
                          {assertion?.impact && (
                            <div className='mt-2 text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 italic'>
                              Impact:{' '}
                              {parseTextWithEditableNumbers(
                                assertion.impact,
                                assertion.id,
                                'impact'
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center h-48 text-center'>
                  <div className='text-gray-400 mb-4'>
                    <CheckSquare className='h-12 w-12 mx-auto' />
                  </div>
                  <h4 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
                    No Response Data Available
                  </h4>
                  <p className='text-gray-500 dark:text-gray-400 max-w-md'>
                    Send a request first to generate assertions based on the
                    response data.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className='flex-shrink-0'>
              <div className='w-full flex items-center justify-between'>
                {/* Left side: count */}
                <span className='text-sm text-gray-600 dark:text-gray-400'>
                  {assertions?.filter((a) => a.enabled).length || 0} of{' '}
                  {assertions?.length || 0} assertions selected
                </span>

                {/* Right side: buttons*/}
                <div className='flex space-x-3'>
                  <button
                    onClick={() => setShowAssertionDialog(false)}
                    className='px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAssertions}
                    className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md'
                  >
                    Save Assertions
                  </button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default RequestEditor;
