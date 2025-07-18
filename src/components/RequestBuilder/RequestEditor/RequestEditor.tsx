import React, { useState, useEffect } from 'react';
import { Play, Save, Edit2, Check, X, FolderPlus } from 'lucide-react';
import { useRequest } from '@/hooks/useRequest';
import { useCollection } from '@/hooks/useCollection';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Header, Param, RequestMethod } from '@/shared/types/request';
import SchemaPage from '../SchemaPage';
import { useToast } from '@/hooks/useToast';
import { makeRequest } from '@/services/request.service';

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
  } = useCollection();
  const { error: showError, success: showSuccess } = useToast();
  const { currentWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState<
    'params' | 'headers' | 'body' | 'auth' | 'scripts' | 'settings' | 'schemas'
  >('params');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  // const [selectedCollectionId, setActiveCollection] = useState<string>("");
  const [newCollectionName, setNewCollectionName] = useState('');
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState<RequestMethod>('GET');
  const [params, setParams] = useState<Param[]>([]);
  const [headers, setHeaders] = useState<Header[]>([]);
  const [bodyType, setBodyType] = useState<
    'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary'
  >('none');
  const [bodyContent, setBodyContent] = useState('');
  const [authType, setAuthType] = useState<
    'none' | 'basic' | 'bearer' | 'apiKey'
  >('none');
  const [token, setToken] = useState('');
  const [authData, setAuthData] = useState({
    username: '',
    password: '',
    token: '',
    key: '',
    value: '',
    addTo: 'header' as 'header' | 'query',
  });
  const [preRequestScript, setPreRequestScript] = useState('');
  const [testScript, setTestScript] = useState('');
  const [settings, setSettings] = useState({
    followRedirects: true,
    timeout: 30000, // 30 seconds
    sslVerification: true,
  });

  useEffect(() => {
    if (activeRequest) {
      setUrl(activeRequest.url || '');
      setEditedName(activeRequest.name || '');
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
          : 'none'
      );
      setBodyContent(activeRequest.bodyRawContent || '');
      setToken(activeRequest.authorization?.token || '');
      setAuthType(
        (activeRequest.authorizationType as
          | 'none'
          | 'basic'
          | 'bearer'
          | 'apiKey') || 'none'
      );
      setAuthData({
        username: activeRequest.authorization?.username || '',
        password: activeRequest.authorization?.password || '',
        token: activeRequest.authorization?.token || '',
        key: activeRequest.authorization?.key || '',
        value: activeRequest.authorization?.value || '',
        addTo: activeRequest.authorization?.addTo || 'header',
      });
      setPreRequestScript('');
      setTestScript('');
    } else {
      setUrl('');
      setEditedName('');
      setMethod('GET');
      setParams([]);
      setHeaders([]);
      setBodyType('none');
      setBodyContent('');
      setAuthType('none');
      setAuthData({
        username: '',
        password: '',
        token: '',
        key: '',
        value: '',
        addTo: 'header',
      });
      setPreRequestScript('');
      setTestScript('');
    }
  }, [activeRequest]);

  const handleSendRequest = async () => {
    if (!activeRequest) return;
    clearError();
    setLoading(true);
    try {
      const requestData = {
        method: method,
        url: url,
        params: params,
        headers: headers,
        body: bodyContent,
        bodyType: bodyType,
        authorizationType: authType,
        authorization: {
          token: authType === 'bearer' ? authData.token : '',
          username: authType === 'basic' ? authData.username : '',
          password: authType === 'basic' ? authData.password : '',
          key: authType === 'apiKey' ? authData.key : '',
          value: authType === 'apiKey' ? authData.value : '',
          addTo: authType === 'apiKey' ? authData.addTo : 'header',
        },
      };
      const response = await makeRequest(requestData);
      setResponseData(response);
      if (response.data?.error) {
        setError({
          title: response.data.error.message || 'Request Failed',
          description: response.data.error.description,
          suggestions: response.data.error.suggestions,
        });
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

  const handleStartEditName = () => {
    setIsEditingName(true);
    setEditedName(activeRequest?.name || '');
  };

  const handleSaveName = async () => {
    if (!activeRequest) return;
    if (editedName.trim() && activeRequest?.id) {
      await renameRequestMutation.mutateAsync({
        requestId: activeRequest.id,
        newName: editedName.trim(),
      });
    }
    const active = { ...activeRequest, name: editedName.trim() };
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

    setIsEditingName(false);
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName(activeRequest?.name || '');
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
      if (isCreatingCollection && newCollectionName.trim()) {
        const res = await addCollectionMutation.mutateAsync({
          name: newCollectionName.trim(),
          workspaceId: currentWorkspace.id,
          isImportant: false,
        });
        if (res?.collectionId) {
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

      const requestData = {
        collectionId: activeCollection?.id,
        description: '',
        name: activeRequest.name || 'New Request',
        order: activeCollection?.requests.length || 0,
        method: method,
        url: url,
        bodyType: bodyType,
        bodyFormData: bodyType === 'form-data' ? bodyContent : null,
        bodyRawContent: bodyType === 'raw' ? bodyContent : null,
        authorizationType: authType,
        authorization: {
          token: authType === 'bearer' ? authData.token : '',
        },
        params: params,
        headers: headers,
        variables: activeRequest.variables || {},
      };
      const request = await addRequestMutation.mutateAsync(requestData);
      setActiveRequest(requestData);
      setShowSaveModal(false);
      setNewCollectionName('');
      setIsCreatingCollection(false);
      toggleExpandedCollection(request.id);
      showSuccess('Request saved successfully!');
    } catch (error) {
      console.error('Error saving request:', error);
      showError('Save Failed', 'An error occurred while saving the request.');
      setError({
        title: 'Save Failed',
        description: 'An error occurred while saving the request.',
      });
    }
  };

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

  const methods: RequestMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

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
    <div className='flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden'>
      {/* Request Name Header */}
      <div className='border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            {isEditingName ? (
              <div className='flex items-center space-x-2'>
                <input
                  type='text'
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className='text-lg font-semibold bg-transparent border-b-2 border-blue-500 focus:outline-none text-gray-900 dark:text-white min-w-0'
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') handleCancelEditName();
                  }}
                />
                <button
                  onClick={handleSaveName}
                  className='p-1 text-green-600 hover:text-green-700'
                  title='Save name'
                >
                  <Check className='h-4 w-4' />
                </button>
                <button
                  onClick={handleCancelEditName}
                  className='p-1 text-red-600 hover:text-red-700'
                  title='Cancel'
                >
                  <X className='h-4 w-4' />
                </button>
              </div>
            ) : (
              <div className='flex items-center space-x-2'>
                <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                  {activeRequest.name}
                </h2>
                <button
                  onClick={handleStartEditName}
                  className='p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  title='Edit name'
                >
                  <Edit2 className='h-4 w-4' />
                </button>
              </div>
            )}
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                method === 'GET'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : method === 'POST'
                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                  : method === 'PUT'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : method === 'DELETE'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : method === 'PATCH'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
              }`}
            >
              {method}
            </span>
          </div>

          {/* <div className="flex items-center space-x-2">
            <button
              onClick={() =>
                setResponseLayout(
                  responseLayout === "bottom" ? "right" : "bottom"
                )
              }
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
              title={`Switch to ${
                responseLayout === "bottom" ? "right" : "bottom"
              } layout`}
            >
              {responseLayout === "bottom" ? (
                <Layout className="h-4 w-4" />
              ) : (
                <LayoutGrid className="h-4 w-4" />
              )}
            </button>

            <button
              onClick={handleCreateRequest}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm flex items-center space-x-1"
              title="Create new request"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div> */}
        </div>
      </div>

      {/* Request URL Bar */}
      <div className='border-b border-gray-200 dark:border-gray-700 p-4 flex-shrink-0'>
        <div className='flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2'>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as RequestMethod)}
            className='w-full sm:w-auto border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-sm font-medium'
          >
            {methods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <input
            type='text'
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder='Enter request URL'
            className='flex-1 min-w-0 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white'
          />

          <div className='flex space-x-2'>
            <button
              onClick={handleSendRequest}
              disabled={isLoading}
              className='bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 sm:px-6 py-2 rounded-md flex items-center space-x-2 transition-colors whitespace-nowrap'
            >
              <Play className='h-4 w-4' />
              <span className='hidden sm:inline'>
                {isLoading ? 'Sending...' : 'Send'}
              </span>
            </button>

            <button
              onClick={handleSaveRequest}
              className='border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-md'
              aria-label='Save request'
            >
              <Save className='h-4 w-4' />
            </button>

            {/* <button
              className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-md"
              aria-label="More options"
            >
              <MoreVertical className="h-4 w-4" />
            </button> */}
          </div>
        </div>
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
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-base sm:text-lg font-medium text-gray-900 dark:text-white'>
                Query Parameters
              </h3>
              <button
                onClick={addParam}
                className='bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-md text-sm'
              >
                <span className='hidden sm:inline'>Add Parameter</span>
                <span className='sm:hidden'>Add</span>
              </button>
            </div>

            <div className='space-y-2'>
              {params.map((param, index) => (
                <div
                  key={index}
                  className='flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2'
                >
                  <input
                    type='checkbox'
                    checked={param.enabled}
                    onChange={(e) =>
                      updateParam(index, 'enabled', e.target.checked)
                    }
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded sm:flex-shrink-0'
                  />
                  <div className='flex flex-1 space-x-2'>
                    <input
                      type='text'
                      value={param.key}
                      onChange={(e) =>
                        updateParam(index, 'key', e.target.value)
                      }
                      placeholder='Key'
                      className='flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-800 dark:text-white'
                    />
                    <input
                      type='text'
                      value={param.value}
                      onChange={(e) =>
                        updateParam(index, 'value', e.target.value)
                      }
                      placeholder='Value'
                      className='flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-800 dark:text-white'
                    />
                    <button
                      onClick={() => removeParam(index)}
                      className='text-red-600 hover:text-red-700 px-2 py-1 whitespace-nowrap'
                    >
                      <span className='hidden sm:inline'>Remove</span>
                      <span className='sm:hidden'>×</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'headers' && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-base sm:text-lg font-medium text-gray-900 dark:text-white'>
                Headers
              </h3>
              <button
                onClick={addHeader}
                className='bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-md text-sm'
              >
                <span className='hidden sm:inline'>Add Header</span>
                <span className='sm:hidden'>Add</span>
              </button>
            </div>

            <div className='space-y-2'>
              {headers.map((header, index) => (
                <div
                  key={index}
                  className='flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2'
                >
                  <input
                    type='checkbox'
                    checked={header.enabled}
                    onChange={(e) =>
                      updateHeader(index, 'enabled', e.target.checked)
                    }
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded sm:flex-shrink-0'
                  />
                  <div className='flex flex-1 space-x-2'>
                    <input
                      type='text'
                      value={header.key}
                      onChange={(e) =>
                        updateHeader(index, 'key', e.target.value)
                      }
                      placeholder='Key'
                      className='flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-800 dark:text-white'
                    />
                    <input
                      type='text'
                      value={header.value}
                      onChange={(e) =>
                        updateHeader(index, 'value', e.target.value)
                      }
                      placeholder='Value'
                      className='flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-800 dark:text-white'
                    />
                    <button
                      onClick={() => removeHeader(index)}
                      className='text-red-600 hover:text-red-700 px-2 py-1 whitespace-nowrap'
                    >
                      <span className='hidden sm:inline'>Remove</span>
                      <span className='sm:hidden'>×</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
                className='border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-sm font-medium'
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
              <div className='space-y-2'>
                <div className='flex items-center justify-between mb-2'>
                  <div className='text-sm text-gray-600 dark:text-gray-400'>
                    Form fields
                  </div>
                  <button
                    className='bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm'
                    onClick={() => {
                      // Implement form field addition
                    }}
                  >
                    Add Field
                  </button>
                </div>
                <div className='text-gray-500 dark:text-gray-400 text-center p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-md'>
                  Form data fields will be displayed here
                </div>
              </div>
            )}

            {bodyType === 'x-www-form-urlencoded' && (
              <div className='space-y-2'>
                <div className='flex items-center justify-between mb-2'>
                  <div className='text-sm text-gray-600 dark:text-gray-400'>
                    URL encoded fields
                  </div>
                  <button
                    className='bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm'
                    onClick={() => {
                      // Implement url encoded field addition
                    }}
                  >
                    Add Field
                  </button>
                </div>
                <div className='text-gray-500 dark:text-gray-400 text-center p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-md'>
                  URL encoded fields will be displayed here
                </div>
              </div>
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
                className='border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-sm font-medium'
              >
                <option value='none'>No Auth</option>
                <option value='basic'>Basic Auth</option>
                <option value='bearer'>Bearer Token</option>
                <option value='apiKey'>API Key</option>
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
                    className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-sm'
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
                    className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-sm'
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
                  className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-sm'
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
                    className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-sm'
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
                    className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-sm'
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
                className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 font-mono text-sm dark:bg-gray-800 dark:text-white'
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
                className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 font-mono text-sm dark:bg-gray-800 dark:text-white'
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
              <div className='flex items-center justify-between'>
                <div>
                  <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    Follow Redirects
                  </h4>
                  <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                    Automatically follow HTTP redirects
                  </p>
                </div>
                <div className='relative inline-block w-10 mr-2 align-middle select-none'>
                  <input
                    type='checkbox'
                    id='followRedirects'
                    checked={settings.followRedirects}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        followRedirects: e.target.checked,
                      })
                    }
                    className='sr-only'
                  />
                  <label
                    htmlFor='followRedirects'
                    className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                      settings.followRedirects
                        ? 'bg-blue-500'
                        : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`dot block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${
                        settings.followRedirects
                          ? 'translate-x-4'
                          : 'translate-x-0'
                      }`}
                    ></span>
                  </label>
                </div>
              </div>

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
                      timeout: parseInt(e.target.value),
                    })
                  }
                  className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-sm'
                />
                <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                  Time in milliseconds to wait for a response before timing out
                </p>
              </div>

              <div className='flex items-center justify-between'>
                <div>
                  <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    SSL Certificate Verification
                  </h4>
                  <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                    Verify SSL certificates when making HTTPS requests
                  </p>
                </div>
                <div className='relative inline-block w-10 mr-2 align-middle select-none'>
                  <input
                    type='checkbox'
                    id='sslVerification'
                    checked={settings.sslVerification}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        sslVerification: e.target.checked,
                      })
                    }
                    className='sr-only'
                  />
                  <label
                    htmlFor='sslVerification'
                    className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                      settings.sslVerification
                        ? 'bg-blue-500'
                        : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`dot block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${
                        settings.sslVerification
                          ? 'translate-x-4'
                          : 'translate-x-0'
                      }`}
                    ></span>
                  </label>
                </div>
              </div>
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
      {showSaveModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
              Save Request
            </h3>

            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Save to Collection
                </label>

                {!isCreatingCollection ? (
                  <div className='space-y-2'>
                    <select
                      value={activeCollection?.id}
                      onChange={(e) =>
                        setActiveCollection(
                          collections.find((c) => c.id === e.target.value) ||
                            null
                        )
                      }
                      className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                    >
                      <option value=''>Select a collection</option>
                      {collections
                        .filter(
                          (collection) =>
                            collection.workspaceId === currentWorkspace?.id
                        )
                        .map((collection) => (
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
                      className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
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
            </div>

            <div className='flex justify-end space-x-3 mt-6'>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestEditor;
