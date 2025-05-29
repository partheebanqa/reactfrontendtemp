import { useState, useEffect } from 'react';
import RequestChain from '../../components/RequestChain';
import CollectionsSidebar from '../../components/CollectionsSidebar';
import ImportModal from '../../components/ImportModal';
import RequestModal from '../../components/RequestModal';
import { Request, ChainRequest, Response, ChainResponse, Collection, CollectionRequest } from '../../types';
import { processVariables } from '../../utils/variableProcessor';
import { validateResponse } from '../../utils/assertions';
import { v4 as uuidv4 } from 'uuid';
import { createUrlWithParams, fetchWithTimeout, mergeHeaders, prepareRequestBody, prepareRequestOptions, RequestError } from '../../utils/requestDefaults';

const COLLECTIONS_STORAGE_KEY = 'api_collections';

function ChainRequestComponent() {
  const [activeRequest, setActiveRequest] = useState<Request>({
    method: 'GET',
    url: '',
    headers: {},
    params: {},
    body: '',
    isGraphQL: false,
    graphQLQuery: '',
    graphQLVariables: ''
  });

  const [response, setResponse] = useState<Response | null>(null);
  const [chainResponses, setChainResponses] = useState<ChainResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
//   const [showCollections, setShowCollections] = useState(false);
  const [showSaveRequestModal, setShowSaveRequestModal] = useState(false);

  useEffect(() => {
    const savedCollections = localStorage.getItem(COLLECTIONS_STORAGE_KEY);
    if (savedCollections) {
      setCollections(JSON.parse(savedCollections));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(collections));
  }, [collections]);

  const handleSend = async () => {
    setLoading(true);
    try {
      const storedDataRepoVars = localStorage.getItem('dataRepoVariables');
      const dataRepoVariables = storedDataRepoVars ? JSON.parse(storedDataRepoVars) : [];

      const processedUrl = processVariables(activeRequest.url, {}, dataRepoVariables);

      const processedHeaders = Object.entries(activeRequest.headers).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: processVariables(value, {}, dataRepoVariables)
      }), {});

      const processedParams = Object.entries(activeRequest.params).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: processVariables(value, {}, dataRepoVariables)
      }), {});

      const body = prepareRequestBody({
        method: activeRequest.method,
        body: activeRequest.body,
        isGraphQL: activeRequest.isGraphQL,
        graphQLQuery: processVariables(activeRequest.graphQLQuery || '', {}, dataRepoVariables),
        graphQLVariables: processVariables(activeRequest.graphQLVariables || '', {}, dataRepoVariables)
      });

      const url = createUrlWithParams(processedUrl, processedParams);

      const options = prepareRequestOptions(
        activeRequest.method,
        processedHeaders,
        body,
        activeRequest.isGraphQL
      );

      const startTime = performance.now();
      const response = await fetchWithTimeout(url, options);
      const endTime = performance.now();
      const responseTime = (endTime - startTime) / 1000;

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      const responseObj: Response = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers),
        data,
        responseTime,
      };

      if (activeRequest.assertions) {
        responseObj.assertions = validateResponse(responseObj, activeRequest.assertions);
      }

      setResponse(responseObj);
    } catch (error:any) {
      console.error('Request error:', error);
      
      let errorResponse: Response;
      if (error instanceof RequestError) {
        errorResponse = {
          status: error.status || 0,
          statusText: error.statusText || 'Error',
          headers: error.response ? Object.fromEntries(error.response.headers) : {},
          data: null,
          error: error.message,
          errorDetails: {
            message: error.message,
            code: error.status?.toString()
          }
        };
      } else {
        errorResponse = {
          status: 0,
          statusText: 'Error',
          headers: {},
          data: null,
          error: error instanceof Error ? error.message : 'An unknown error occurred',
        };
      }
      
      setResponse(errorResponse);
    }
    setLoading(false);
  };

  const executeChain = async (requests: ChainRequest[]) => {
    setChainResponses([]);
    setLoading(true);

    const responses: ChainResponse[] = [];
    const variables: Record<string, any> = {};

    const resolveVariables = (text: string): string => {
      return processVariables(text, variables);
    };

    const executeRequest = async (request: ChainRequest) => {
      try {
        const resolvedUrl = resolveVariables(request.url);
        const resolvedBody = request.body ? resolveVariables(request.body) : undefined;

        const headers = mergeHeaders(request.headers);

        const body = prepareRequestBody({
          method: request.method,
          body: resolvedBody || '',
          isGraphQL: request.isGraphQL,
          graphQLQuery: resolveVariables(request.graphQLQuery || ''),
          graphQLVariables: resolveVariables(request.graphQLVariables || '')
        });

        const url = createUrlWithParams(resolvedUrl, request.params);

        const options = prepareRequestOptions(request.method, headers, body, request.isGraphQL);

        const startTime = performance.now();
        const response = await fetchWithTimeout(url, options);
        const endTime = performance.now();
        const responseTime = (endTime - startTime) / 1000;

        let data;
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        const chainResponse: ChainResponse = {
          requestId: request.id,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers),
          data,
          responseTime,
        };

        if (request.assertions) {
          chainResponse.assertions = validateResponse(chainResponse, request.assertions);
        }

        responses.push(chainResponse);
        setChainResponses([...responses]);

        if (request.variables) {
          Object.entries(request.variables).forEach(([key, path]) => {
            let value = data;
            path.split('.').forEach(part => {
              value = value?.[part];
            });
            variables[key] = value;
          });
        }

        return chainResponse;
      } catch (error:any) {
        console.error('Chain request error:', error);
        
        let errorResponse: ChainResponse;
        if (error instanceof RequestError) {
          errorResponse = {
            requestId: request.id,
            status: error.status || 0,
            statusText: error.statusText || 'Error',
            headers: error.response ? Object.fromEntries(error.response.headers) : {},
            data: null,
            error: error.message,
            errorDetails: {
              message: error.message,
              code: error.status?.toString()
            }
          };
        } else {
          errorResponse = {
            requestId: request.id,
            status: 0,
            statusText: 'Error',
            headers: {},
            data: null,
            error: error instanceof Error ? error.message : 'An unknown error occurred',
          };
        }
        
        responses.push(errorResponse);
        setChainResponses([...responses]);
        return errorResponse;
      }
    };

    for (const request of requests) {
      if (request.dependsOn?.length) {
        const dependencyResponses = responses.filter(res => 
          request.dependsOn?.includes(res.requestId)
        );
        
        if (dependencyResponses.length !== request.dependsOn.length || 
            dependencyResponses.some(res => res.error || res.status >= 400)) {
          responses.push({
            requestId: request.id,
            status: 0,
            statusText: 'Skipped - Failed Dependencies',
            headers: {},
            data: null,
            error: 'One or more dependencies failed',
          });
          continue;
        }
      }

      await executeRequest(request);
    }

    setLoading(false);
  };

  const handleCollectionCreate = (collection: Collection) => {
    setCollections(prev => [...prev, collection]);
  };

  const handleCollectionUpdate = (collection: Collection) => {
    setCollections(prev => prev.map(c => c.id === collection.id ? collection : c));
  };

  const handleCollectionDelete = (collectionId: string) => {
    setCollections(prev => prev.filter(c => c.id !== collectionId));
  };

  const handleRequestSelect = (request: CollectionRequest) => {
    setActiveRequest(request.request);
    setActiveTab('single');
  };

  const handleImport = (importedCollections: Collection[]) => {
    setCollections(prev => [...prev, ...importedCollections]);
  };

  const handleSaveRequest = (request: CollectionRequest) => {
    const collection = collections.find(c => c.id === request.collectionId);
    if (!collection) return;

    const updatedCollection = { ...collection };
    
    if (request.folderId) {
      const updateFolders = (folders: CollectionFolder[]): CollectionFolder[] => {
        return folders.map(f => {
          if (f.id === request.folderId) {
            return {
              ...f,
              requests: [...f.requests, request]
            };
          }
          if (f.folders.length > 0) {
            return {
              ...f,
              folders: updateFolders(f.folders)
            };
          }
          return f;
        });
      };

      updatedCollection.folders = updateFolders(updatedCollection.folders);
    } else {
      updatedCollection.requests = [...updatedCollection.requests, request];
    }

    updatedCollection.changelog = [
      ...updatedCollection.changelog,
      {
        id: uuidv4(),
        action: 'create',
        itemType: 'request',
        itemId: request.id,
        itemName: request.name,
        timestamp: new Date().toISOString(),
        details: 'Request saved to collection'
      }
    ];

    handleCollectionUpdate(updatedCollection);
    setShowSaveRequestModal(false);
  };

  return (
        <div className="h-full">
            <div className="flex bg-gray-50 overflow-y-auto h-full">
                {/* <CollectionsSidebar
                  collections={collections}
                  onCollectionCreate={handleCollectionCreate}
                  onCollectionUpdate={handleCollectionUpdate}
                  onCollectionDelete={handleCollectionDelete}
                  onRequestSelect={handleRequestSelect}
                  onImport={() => setShowImportModal(true)}
                  currentRequest={activeRequest}
                /> */}

                <div className="flex-1 overflow-auto p-4">
                    <RequestChain
                      onExecuteChain={executeChain}
                      responses={chainResponses}
                      collections={collections}
                      onRequestSelect={handleRequestSelect}
                    />
                </div>
                <ImportModal
                  isOpen={showImportModal}
                  onClose={() => setShowImportModal(false)}
                  onImport={handleImport}/>
        
                {showSaveRequestModal && (
                    <RequestModal
                    isOpen={showSaveRequestModal}
                    onClose={() => setShowSaveRequestModal(false)}
                    onSave={handleSaveRequest}
                    currentRequest={activeRequest}
                    collections={collections}
                    onCollectionCreate={handleCollectionCreate}
                    />
                )}
          </div>
        </div>
  );
}

export default ChainRequestComponent;