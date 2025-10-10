'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, ChevronDown, ChevronUp, Check, Upload } from 'lucide-react';
import { MethodBadge } from './MethodBadge';
import { useQuery } from '@tanstack/react-query';
import { getCollectionsWithRequests } from '@/services/collection.service';
import type {
  ExtendedRequest,
  TransformedCollection,
} from '@/models/collection.model';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useLocation } from 'wouter';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (requests: ExtendedRequest[]) => void;
  importedRequestIds?: string[]; // Already imported request IDs
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  importedRequestIds = [],
}) => {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  const {
    data: apiData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['collections', workspaceId],
    queryFn: () => {
      if (!workspaceId) throw new Error('workspaceId is undefined');
      return getCollectionsWithRequests(workspaceId);
    },
    enabled: isOpen && !!workspaceId,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Internal');
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [expandedCollections, setExpandedCollections] = useState<string[]>([]);
  const [externalRequests, setExternalRequests] = useState<ExtendedRequest[]>(
    []
  );
  const [externalFileError, setExternalFileError] = useState<string | null>(
    null
  );

  const collections: TransformedCollection[] = React.useMemo(() => {
    if (!apiData?.collections) return [];

    return apiData.collections
      .filter(
        (collection) =>
          Array.isArray(collection.requests) && collection.requests.length > 0
      ) // skip if no requests
      .map((collection) => ({
        id: collection.collectionId,
        name: collection.collectionName,
        requestCount: collection.requests.length,
        requests: collection.requests.map((request) => ({
          ...request,
          endpoint: request.url,
          description: `${request.method} ${request.url}`,
          testCases: { functional: 0, total: 0 },
        })),
      }));
  }, [apiData]);

  // React.useEffect(() => {
  //   if (collections.length > 0 && expandedCollections.length === 0) {
  //     setExpandedCollections(collections.map((c) => c.id));
  //   }
  // }, [collections, expandedCollections.length]);

  const filteredCollections = collections
    .map((collection: TransformedCollection) => {
      const filteredRequests = collection.requests.filter((request) =>
        (request.name ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      );

      return {
        ...collection,
        requests: filteredRequests,
        requestCount: filteredRequests.length,
      };
    })
    .filter((collection) => collection.requests.length > 0);

  const isRequestImported = (requestId: string) =>
    importedRequestIds.includes(requestId);

  const handleSelectRequest = (requestId: string, checked: boolean) => {
    // Don't allow selecting already imported requests
    if (isRequestImported(requestId)) return;

    if (checked) {
      setSelectedRequests((prev) => [...prev, requestId]);
    } else {
      setSelectedRequests((prev) => prev.filter((id) => id !== requestId));
    }
  };

  const handleSelectAll = (collectionId: string) => {
    const collection = collections.find((c) => c.id === collectionId);
    if (!collection) return;

    // Only consider non-imported requests for selection
    const availableRequests = collection.requests.filter(
      (req) => !isRequestImported(req.id)
    );

    const allAvailableSelected = availableRequests.every((req) =>
      selectedRequests.includes(req.id)
    );

    if (allAvailableSelected) {
      // Deselect all available requests
      setSelectedRequests((prev) =>
        prev.filter((id) => !availableRequests.some((req) => req.id === id))
      );
    } else {
      // Select all available requests
      const newSelections = availableRequests
        .filter((req) => !selectedRequests.includes(req.id))
        .map((req) => req.id);
      setSelectedRequests((prev) => [...prev, ...newSelections]);
    }
  };

  const toggleCollection = (collectionId: string) => {
    setExpandedCollections((prev) =>
      prev.includes(collectionId)
        ? prev.filter((id) => id !== collectionId)
        : [...prev, collectionId]
    );
  };

  const handleImport = () => {
    const internalRequests = collections.flatMap((c) => c.requests);
    const allRequests = [...internalRequests, ...externalRequests];

    const requestsToImport = allRequests.filter((req) =>
      selectedRequests.includes(req.id)
    );

    onImport(requestsToImport);
    setSelectedRequests([]);
    setSearchQuery('');
    onClose();
  };

  const selectedCount = selectedRequests.length;

  const handleExternalFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      if (!json?.item) throw new Error('Invalid Postman collection');

      const requests: ExtendedRequest[] = [];

      const walkItems = (items: any[], folder?: string) => {
        for (const item of items) {
          if (item.item) {
            walkItems(item.item, item.name);
          } else if (item.request) {
            const method = item.request.method;
            const url = item.request.url?.raw || item.request.url;

            // Extract headers
            const headers = item.request.header
              ? item.request.header.map((h: any) => ({
                  id: `header_${Date.now()}_${Math.random()}`,
                  key: h.key || '',
                  value: h.value || '',
                  enabled: !h.disabled,
                }))
              : [];

            // Extract query parameters
            const params = item.request.url?.query
              ? item.request.url.query.map((q: any) => ({
                  id: `param_${Date.now()}_${Math.random()}`,
                  key: q.key || '',
                  value: q.value || '',
                  enabled: !q.disabled,
                }))
              : [];

            // Extract body
            let bodyRawContent = '';
            let bodyType = 'none';
            if (item.request.body) {
              if (item.request.body.mode === 'raw') {
                bodyRawContent = item.request.body.raw || '';
                bodyType = 'raw';
              } else if (item.request.body.mode === 'formdata') {
                bodyType = 'form-data';
                // Convert form-data to a readable format
                if (item.request.body.formdata) {
                  bodyRawContent = item.request.body.formdata
                    .map((fd: any) => `${fd.key}: ${fd.value || fd.src || ''}`)
                    .join('\n');
                }
              } else if (item.request.body.mode === 'urlencoded') {
                bodyType = 'x-www-form-urlencoded';
                if (item.request.body.urlencoded) {
                  bodyRawContent = item.request.body.urlencoded
                    .map((ue: any) => `${ue.key}=${ue.value || ''}`)
                    .join('&');
                }
              }
            }

            // Extract authorization
            let authorizationType = 'none';
            let authorization: any = {};
            if (item.request.auth) {
              const authType = item.request.auth.type;
              if (authType === 'bearer') {
                authorizationType = 'bearer';
                authorization = {
                  token: item.request.auth.bearer?.[0]?.value || '',
                };
              } else if (authType === 'basic') {
                authorizationType = 'basic';
                authorization = {
                  username:
                    item.request.auth.basic?.find(
                      (b: any) => b.key === 'username'
                    )?.value || '',
                  password:
                    item.request.auth.basic?.find(
                      (b: any) => b.key === 'password'
                    )?.value || '',
                };
              } else if (authType === 'apikey') {
                authorizationType = 'apikey';
                const keyData = item.request.auth.apikey || [];
                authorization = {
                  key: keyData.find((k: any) => k.key === 'key')?.value || '',
                  value:
                    keyData.find((k: any) => k.key === 'value')?.value || '',
                  addTo:
                    keyData.find((k: any) => k.key === 'in')?.value || 'header',
                };
              }
            }

            requests.push({
              id: `${item.name}-${method}-${Date.now()}`,
              name: item.name,
              method,
              url,
              endpoint: url,
              folderName: folder,
              testCases: { functional: 0, total: 0 },
              description: item.request.description || '',
              headers,
              params,
              bodyRawContent,
              bodyType,
              authorizationType,
              authorization,
              timeout: 5000,
              retries: 0,
            });
          }
        }
      };

      walkItems(json.item);
      setExternalRequests(requests);
      setExternalFileError(null);
    } catch (err: any) {
      console.error(err);
      setExternalFileError('Invalid Postman collection file');
      setExternalRequests([]);
    }
  };

  const [location] = useLocation();
  const isRequestChainsRoute =
    location === '/request-chains/create' ||
    (location.startsWith('/request-chains/') && location.endsWith('/edit'));

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className='max-w-4xl max-h-[80vh] overflow-hidden flex flex-col'>
          <DialogHeader>
            <DialogTitle>Import from Collection</DialogTitle>
          </DialogHeader>
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
              <p className='text-muted-foreground'>Loading collections...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className='max-w-4xl max-h-[80vh] overflow-hidden flex flex-col'>
          <DialogHeader>
            <DialogTitle>Import from Collection</DialogTitle>
          </DialogHeader>
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <p className='text-destructive mb-4'>Error loading collections</p>
              <p className='text-sm text-muted-foreground'>
                {error instanceof Error
                  ? error.message
                  : 'An unknown error occurred'}
              </p>
              <Button variant='outline' onClick={onClose} className='mt-4'>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-auto flex flex-col'>
        <DialogTitle>Import Collections</DialogTitle>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList
            className={`grid w-full ${
              isRequestChainsRoute ? 'grid-cols-2' : 'grid-cols-1'
            }`}
          >
            <TabsTrigger value='Internal'>
              Import from existing Collection
            </TabsTrigger>
            {isRequestChainsRoute && (
              <TabsTrigger value='extranal'>
                Import new data (Collection)
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value='Internal'>
            <div className='flex-1 overflow-hidden flex flex-col'>
              <div className='mb-4'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground' />
                  <Input
                    placeholder='Search requests...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>

              <div className='flex-1 overflow-y-auto space-y-4 max-h-[50vh]'>
                {filteredCollections.length === 0 ? (
                  <div className='flex flex-col items-center justify-center py-12'>
                    <p className='text-muted-foreground'>
                      {collections.length === 0
                        ? 'No collections found'
                        : 'No requests found'}
                    </p>
                  </div>
                ) : (
                  filteredCollections.map(
                    (collection: TransformedCollection) => {
                      const isExpanded = expandedCollections.includes(
                        collection.id
                      );
                      const availableRequests = collection.requests.filter(
                        (req) => !isRequestImported(req.id)
                      );
                      const allAvailableSelected = availableRequests.every(
                        (req) => selectedRequests.includes(req.id)
                      );
                      const hasAvailableRequests = availableRequests.length > 0;

                      return (
                        <div key={collection.id} className='border rounded-lg'>
                          <div className='flex items-center justify-between p-4'>
                            <div className='flex items-center space-x-3'>
                              <button
                                onClick={() => toggleCollection(collection.id)}
                                className='p-1 hover:bg-muted rounded'
                              >
                                {isExpanded ? (
                                  <ChevronUp className='w-4 h-4' />
                                ) : (
                                  <ChevronDown className='w-4 h-4' />
                                )}
                              </button>
                              <div>
                                <h3 className='font-medium'>
                                  {collection.name}
                                </h3>
                                <p className='text-sm text-muted-foreground'>
                                  ({collection.requestCount} requests)
                                  {importedRequestIds.length > 0 && (
                                    <span className='ml-2 text-green-600'>
                                      •{' '}
                                      {
                                        collection.requests.filter((req) =>
                                          isRequestImported(req.id)
                                        ).length
                                      }{' '}
                                      imported
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            {hasAvailableRequests && (
                              <Button
                                variant='link'
                                size='sm'
                                onClick={() => handleSelectAll(collection.id)}
                                className='text-primary'
                              >
                                {allAvailableSelected
                                  ? 'Deselect All'
                                  : 'Select All Available'}
                              </Button>
                            )}
                          </div>

                          {isExpanded && (
                            <div className='border-t'>
                              {collection.requests.map((request) => {
                                const imported = isRequestImported(request.id);
                                const selected = selectedRequests.includes(
                                  request.id
                                );

                                return (
                                  <div
                                    key={request.id}
                                    className={`flex items-center space-x-3 p-4 border-b last:border-b-0 ${
                                      imported
                                        ? 'bg-green-50 border-green-100'
                                        : 'hover:bg-muted/50'
                                    }`}
                                  >
                                    {imported ? (
                                      <div className='w-4 h-4 rounded bg-green-500 flex items-center justify-center'>
                                        <Check className='w-3 h-3 text-white' />
                                      </div>
                                    ) : (
                                      <Checkbox
                                        checked={selected}
                                        onCheckedChange={(checked) =>
                                          handleSelectRequest(
                                            request.id,
                                            checked as boolean
                                          )
                                        }
                                      />
                                    )}
                                    <MethodBadge
                                      method={request.method || ''}
                                    />
                                    <div className='flex-1'>
                                      <div className='flex items-center space-x-2'>
                                        <h4 className='font-medium'>
                                          {request.name}
                                        </h4>
                                        {imported && (
                                          <span className='text-xs bg-green-100 text-green-700 px-2 py-1 rounded'>
                                            Already imported
                                          </span>
                                        )}
                                      </div>
                                      <p className='text-sm text-muted-foreground'>
                                        {request.endpoint || request.url}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )
                )}
              </div>

              <div className='flex items-center justify-between pt-4 border-t'>
                <span className='text-sm text-muted-foreground'>
                  {selectedCount} request{selectedCount !== 1 ? 's' : ''}{' '}
                  selected
                  {importedRequestIds.length > 0 && (
                    <span className='ml-2 text-green-600'>
                      • {importedRequestIds.length} already imported
                    </span>
                  )}
                </span>
                <div className='flex space-x-2'>
                  <Button variant='outline' onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleImport} disabled={selectedCount === 0}>
                    Import {selectedCount} Request
                    {selectedCount !== 1 ? 's' : ''}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value='extranal'>
            <div className='flex-1 overflow-hidden flex flex-col'>
              {/* Upload Area */}
              <div className='mb-4'>
                {externalRequests.length === 0 ? (
                  <label
                    htmlFor='externalFileUpload'
                    className='border-dashed border-2 border-gray-300 rounded-lg p-6 w-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition'
                  >
                    <Upload className='w-6 h-6 text-gray-500 mb-2' />
                    <span className='text-sm text-gray-500'>
                      Click or drag and drop a Postman collection (.json)
                    </span>
                  </label>
                ) : (
                  <div className='flex items-center justify-between px-4 py-3 bg-muted rounded-md border'>
                    <div className='text-sm text-muted-foreground'>
                      Loaded {externalRequests.length} request
                      {externalRequests.length !== 1 ? 's' : ''}
                    </div>
                    <label
                      htmlFor='externalFileUpload'
                      className='text-sm text-primary hover:underline cursor-pointer'
                    >
                      Import new file
                    </label>
                  </div>
                )}

                <Input
                  id='externalFileUpload'
                  type='file'
                  accept='.json'
                  className='hidden'
                  onChange={handleExternalFileUpload}
                />

                {externalFileError && (
                  <p className='text-sm text-red-500 mt-2'>
                    {externalFileError}
                  </p>
                )}
              </div>

              {/* Requests List */}
              <div className='flex-1 overflow-y-auto space-y-4 max-h-[50vh]'>
                {externalRequests.length === 0 ? (
                  <div className='text-muted-foreground text-center py-12'>
                    Upload a Postman collection to view requests.
                  </div>
                ) : (
                  <div className='border rounded-lg'>
                    <div className='flex items-center justify-between p-4 border-b'>
                      <h3 className='font-medium'>
                        {externalRequests.length} requests found
                      </h3>
                      <Button
                        variant='link'
                        size='sm'
                        onClick={() => {
                          const available = externalRequests.filter(
                            (r) => !isRequestImported(r.id)
                          );
                          const allSelected = available.every((r) =>
                            selectedRequests.includes(r.id)
                          );
                          const newSelections = allSelected
                            ? selectedRequests.filter(
                                (id) => !available.some((r) => r.id === id)
                              )
                            : [
                                ...selectedRequests,
                                ...available.map((r) => r.id),
                              ];

                          setSelectedRequests(newSelections);
                        }}
                      >
                        {externalRequests.every((r) =>
                          selectedRequests.includes(r.id)
                        )
                          ? 'Deselect All'
                          : 'Select All Available'}
                      </Button>
                    </div>

                    {externalRequests.map((request) => {
                      const imported = isRequestImported(request.id);
                      const selected = selectedRequests.includes(request.id);
                      return (
                        <div
                          key={request.id}
                          className={`flex items-center space-x-3 p-4 border-b last:border-b-0 ${
                            imported
                              ? 'bg-green-50 border-green-100'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          {imported ? (
                            <div className='w-4 h-4 rounded bg-green-500 flex items-center justify-center'>
                              <Check className='w-3 h-3 text-white' />
                            </div>
                          ) : (
                            <Checkbox
                              checked={selected}
                              onCheckedChange={(checked) =>
                                handleSelectRequest(
                                  request.id,
                                  checked as boolean
                                )
                              }
                            />
                          )}
                          <MethodBadge method={request.method || ''} />
                          <div className='flex-1'>
                            <div className='flex items-center space-x-2'>
                              <h4 className='font-medium'>{request.name}</h4>
                              {imported && (
                                <span className='text-xs bg-green-100 text-green-700 px-2 py-1 rounded'>
                                  Already imported
                                </span>
                              )}
                            </div>
                            <p className='text-sm text-muted-foreground'>
                              {request.endpoint || request.url}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className='flex items-center justify-between pt-4 border-t'>
                <span className='text-sm text-muted-foreground'>
                  {selectedCount} request{selectedCount !== 1 ? 's' : ''}{' '}
                  selected
                  {importedRequestIds.length > 0 && (
                    <span className='ml-2 text-green-600'>
                      • {importedRequestIds.length} already imported
                    </span>
                  )}
                </span>
                <div className='flex space-x-2'>
                  <Button variant='outline' onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleImport} disabled={selectedCount === 0}>
                    Import {selectedCount} Request
                    {selectedCount !== 1 ? 's' : ''}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
