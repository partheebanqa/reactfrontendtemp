'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronUp, Folder, Check } from 'lucide-react';
import { MethodBadge } from '@/components/TestSuit/MethodBadge';
import type { FolderNode } from '@/shared/types/folderNode';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Upload } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  getCollectionsWithRequests,
  getCollectionRequests,
} from '@/services/collection.service';
import type {
  ExtendedRequest,
  TransformedCollection,
} from '@/models/collection.model';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation } from 'wouter';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (requests: ExtendedRequest[]) => void;
  importedRequestIds?: string[];
}

const buildFolderTreeFromRequests = (
  requests: ExtendedRequest[]
): FolderNode => {
  const root: FolderNode = {
    id: 'root',
    name: 'root',
    type: 'folder',
    folders: [],
    requests: [],
  };

  requests.forEach((request) => {
    if (request.folderName) {
      const folderPath = request.folderName.split('/').filter(Boolean);
      let currentFolder = root;

      folderPath.forEach((folderName) => {
        let existingFolder = currentFolder.folders?.find(
          (f) => f.name === folderName
        );

        if (!existingFolder) {
          existingFolder = {
            id: `${currentFolder.id}/${folderName}`,
            name: folderName,
            type: 'folder',
            folders: [],
            requests: [],
          };
          if (!currentFolder.folders) currentFolder.folders = [];
          currentFolder.folders.push(existingFolder);
        }

        currentFolder = existingFolder;
      });

      if (!currentFolder.requests) currentFolder.requests = [];
      currentFolder.requests.push(request);
    } else {
      if (!root.requests) root.requests = [];
      root.requests.push(request);
    }
  });

  return root;
};

const FolderTreeItem: React.FC<{
  folder: FolderNode;
  collectionId: string;
  selectedRequests: string[];
  importedRequestIds: string[];
  onSelectRequest: (requestId: string, checked: boolean) => void;
  expandedFolders: Set<string>;
  onToggleFolder: (folderId: string) => void;
  searchQuery: string;
}> = ({
  folder,
  collectionId,
  selectedRequests,
  importedRequestIds,
  onSelectRequest,
  expandedFolders,
  onToggleFolder,
  searchQuery,
}) => {
  const isExpanded = expandedFolders.has(folder.id);
  const hasSubFolders = folder.folders && folder.folders.length > 0;
  const hasRequests = folder.requests && folder.requests.length > 0;

  const filteredRequests = folder.requests?.filter((req) =>
    (req.name ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasExpandableContent = hasSubFolders || hasRequests;
  const hasVisibleContent =
    (filteredRequests && filteredRequests.length > 0) || hasSubFolders;

  if (!hasVisibleContent) return null;

  return (
    <div className='ml-6'>
      {/* Folder header */}
      <div className='flex items-center gap-3 py-2.5 px-3 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors border-l-2 border-primary/50'>
        {hasExpandableContent && (
          <button
            onClick={() => onToggleFolder(folder.id)}
            className='p-0.5 hover:bg-background rounded transition-colors'
          >
            {isExpanded ? (
              <ChevronUp className='w-4 h-4 text-primary' />
            ) : (
              <ChevronDown className='w-4 h-4 text-primary' />
            )}
          </button>
        )}
        {!hasExpandableContent && <div className='w-5' />}
        <div className='p-1.5 bg-primary/10 rounded'>
          <Folder className='w-4 h-4 text-primary' />
        </div>
        <span className='font-medium text-foreground'>{folder.name}</span>
      </div>

      {/* Folder contents */}
      {isExpanded && (
        <div className='ml-2'>
          {/* Requests in this folder */}
          {filteredRequests && filteredRequests.length > 0 && (
            <div className='ml-8 space-y-1 border-l-2 border-muted pl-4'>
              {filteredRequests.map((request) => {
                const imported = importedRequestIds.includes(request.id);
                const selected = selectedRequests.includes(request.id);

                return (
                  <div
                    key={request.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      imported
                        ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900'
                        : 'hover:bg-muted/50 border border-transparent hover:border-border'
                    }`}
                  >
                    {imported ? (
                      <div className='w-4 h-4 rounded bg-green-500 flex items-center justify-center flex-shrink-0'>
                        <Check className='w-3 h-3 text-white' />
                      </div>
                    ) : (
                      <Checkbox
                        checked={selected}
                        onCheckedChange={(checked) =>
                          onSelectRequest(request.id, checked as boolean)
                        }
                        className='flex-shrink-0'
                      />
                    )}
                    <MethodBadge method={request.method || 'GET'} />
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2'>
                        <h4 className='font-medium text-foreground truncate'>
                          {request.name}
                        </h4>
                        {imported && (
                          <span className='text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full whitespace-nowrap font-medium'>
                            Already imported
                          </span>
                        )}
                      </div>
                      <p className='text-sm text-muted-foreground truncate mt-0.5'>
                        {request.url}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Nested folders */}
          {folder.folders && folder.folders.length > 0 && (
            <div className='mt-1'>
              {folder.folders.map((subFolder) => (
                <FolderTreeItem
                  key={subFolder.id}
                  folder={subFolder}
                  collectionId={collectionId}
                  selectedRequests={selectedRequests}
                  importedRequestIds={importedRequestIds}
                  onSelectRequest={onSelectRequest}
                  expandedFolders={expandedFolders}
                  onToggleFolder={onToggleFolder}
                  searchQuery={searchQuery}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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

  const [folderTreeData, setFolderTreeData] = useState<Record<string, any>>({});
  const [loadingFolderTree, setLoadingFolderTree] = useState<
    Record<string, boolean>
  >({});
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

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
  const [externalFolderTree, setExternalFolderTree] =
    useState<FolderNode | null>(null);
  const [externalExpandedFolders, setExternalExpandedFolders] = useState<
    Set<string>
  >(new Set());

  const collections: TransformedCollection[] = React.useMemo(() => {
    if (!apiData?.collections) return [];

    return apiData.collections
      .filter(
        (collection) =>
          Array.isArray(collection.requests) && collection.requests.length > 0
      )
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

  const extractAllRequestsFromFolderTree = (folderTree: any): string[] => {
    const requestIds: string[] = [];

    const walkFolders = (folders: any[]) => {
      if (!folders) return;

      folders.forEach((folder) => {
        if (folder.requests && Array.isArray(folder.requests)) {
          folder.requests.forEach((req: any) => {
            requestIds.push(req.id);
          });
        }
        if (folder.folders && Array.isArray(folder.folders)) {
          walkFolders(folder.folders);
        }
      });
    };

    if (folderTree.requests && Array.isArray(folderTree.requests)) {
      folderTree.requests.forEach((req: any) => {
        requestIds.push(req.id);
      });
    }

    if (folderTree.folders && Array.isArray(folderTree.folders)) {
      walkFolders(folderTree.folders);
    }

    return requestIds;
  };

  const handleSelectAll = async (collectionId: string) => {
    if (!folderTreeData[collectionId]) {
      setLoadingFolderTree((prev) => ({ ...prev, [collectionId]: true }));
      try {
        const treeData = await getCollectionRequests(collectionId);
        setFolderTreeData((prev) => ({ ...prev, [collectionId]: treeData }));

        const allRequestIds = extractAllRequestsFromFolderTree(treeData);
        const availableRequests = allRequestIds.filter(
          (id) => !isRequestImported(id)
        );
        const allAvailableSelected = availableRequests.every((id) =>
          selectedRequests.includes(id)
        );

        if (allAvailableSelected) {
          setSelectedRequests((prev) =>
            prev.filter((id) => !availableRequests.includes(id))
          );
        } else {
          const newSelections = availableRequests.filter(
            (id) => !selectedRequests.includes(id)
          );
          setSelectedRequests((prev) => [...prev, ...newSelections]);
        }
      } catch (err) {
        console.error('Error fetching folder tree:', err);
      } finally {
        setLoadingFolderTree((prev) => ({ ...prev, [collectionId]: false }));
      }
    } else {
      const allRequestIds = extractAllRequestsFromFolderTree(
        folderTreeData[collectionId]
      );
      const availableRequests = allRequestIds.filter(
        (id) => !isRequestImported(id)
      );
      const allAvailableSelected = availableRequests.every((id) =>
        selectedRequests.includes(id)
      );

      if (allAvailableSelected) {
        setSelectedRequests((prev) =>
          prev.filter((id) => !availableRequests.includes(id))
        );
      } else {
        const newSelections = availableRequests.filter(
          (id) => !selectedRequests.includes(id)
        );
        setSelectedRequests((prev) => [...prev, ...newSelections]);
      }
    }
  };

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
    if (isRequestImported(requestId)) return;

    if (checked) {
      setSelectedRequests((prev) => [...prev, requestId]);
    } else {
      setSelectedRequests((prev) => prev.filter((id) => id !== requestId));
    }
  };

  const toggleCollection = async (collectionId: string) => {
    const isCurrentlyExpanded = expandedCollections.includes(collectionId);

    if (!isCurrentlyExpanded && !folderTreeData[collectionId]) {
      setLoadingFolderTree((prev) => ({ ...prev, [collectionId]: true }));
      try {
        const treeData = await getCollectionRequests(collectionId);
        setFolderTreeData((prev) => ({ ...prev, [collectionId]: treeData }));
      } catch (err) {
        console.error('Error fetching folder tree:', err);
      } finally {
        setLoadingFolderTree((prev) => ({ ...prev, [collectionId]: false }));
      }
    }

    setExpandedCollections((prev) =>
      prev.includes(collectionId)
        ? prev.filter((id) => id !== collectionId)
        : [...prev, collectionId]
    );
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
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
            const headers = item.request.header
              ? item.request.header.map((h: any) => ({
                  id: `header_${Date.now()}_${Math.random()}`,
                  key: h.key || '',
                  value: h.value || '',
                  enabled: !h.disabled,
                }))
              : [];
            const params = item.request.url?.query
              ? item.request.url.query.map((q: any) => ({
                  id: `param_${Date.now()}_${Math.random()}`,
                  key: q.key || '',
                  value: q.value || '',
                  enabled: !q.disabled,
                }))
              : [];
            let bodyRawContent = '';
            let bodyType = 'none';
            if (item.request.body) {
              if (item.request.body.mode === 'raw') {
                bodyRawContent = item.request.body.raw || '';
                bodyType = 'raw';
              } else if (item.request.body.mode === 'formdata') {
                bodyType = 'form-data';
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
      const folderTree = buildFolderTreeFromRequests(requests);
      setExternalFolderTree(folderTree);
      setExternalFileError(null);
    } catch (err: any) {
      console.error(err);
      setExternalFileError('Invalid Postman collection file');
      setExternalRequests([]);
      setExternalFolderTree(null);
    }
  };

  const [location] = useLocation();
  const isRequestChainsRoute =
    location === '/request-chains/create' ||
    (location.startsWith('/request-chains/') && location.endsWith('/edit'));

  const toggleExternalFolder = (folderId: string) => {
    setExternalExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

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
              <p className='text-muted-foreground'>
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

              <div className='flex-1 overflow-y-auto scrollbar-thin space-y-3 max-h-[50vh]'>
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
                      const isLoadingTree = loadingFolderTree[collection.id];
                      const treeData = folderTreeData[collection.id];

                      return (
                        <div
                          key={collection.id}
                          className='border rounded-lg overflow-hidden bg-card'
                        >
                          <div className='flex items-center justify-between p-4 bg-muted/30'>
                            <div className='flex items-center gap-3 flex-1'>
                              <button
                                onClick={() => toggleCollection(collection.id)}
                                className='p-1 hover:bg-muted rounded transition-colors'
                                disabled={isLoadingTree}
                              >
                                {isExpanded ? (
                                  <ChevronUp className='w-4 h-4' />
                                ) : (
                                  <ChevronDown className='w-4 h-4' />
                                )}
                              </button>
                              <div>
                                <h3 className='font-semibold text-foreground'>
                                  {collection.name}
                                </h3>
                                <p className='text-muted-foreground'>
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
                            <Button
                              variant='link'
                              size='sm'
                              onClick={() => handleSelectAll(collection.id)}
                              disabled={isLoadingTree}
                              className='text-blue-600 hover:text-blue-700 font-medium'
                            >
                              {isLoadingTree ? (
                                <>
                                  <span className='animate-spin mr-2'>⏳</span>
                                  Loading...
                                </>
                              ) : (
                                'Select All Available'
                              )}
                            </Button>
                          </div>

                          {isExpanded && (
                            <div className='border-t p-4 bg-card'>
                              {isLoadingTree ? (
                                <div className='flex items-center justify-center py-8'>
                                  <div className='text-center'>
                                    <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2'></div>
                                    <p className='text-muted-foreground'>
                                      Loading folder structure...
                                    </p>
                                  </div>
                                </div>
                              ) : treeData ? (
                                <div className='space-y-1'>
                                  {treeData.requests &&
                                    treeData.requests.length > 0 && (
                                      <div className='space-y-1 mb-4'>
                                        {treeData.requests
                                          .filter((req: any) =>
                                            (req.name ?? '')
                                              .toLowerCase()
                                              .includes(
                                                searchQuery.toLowerCase()
                                              )
                                          )
                                          .map((request: any) => {
                                            const imported = isRequestImported(
                                              request.id
                                            );
                                            const selected =
                                              selectedRequests.includes(
                                                request.id
                                              );

                                            return (
                                              <div
                                                key={request.id}
                                                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                                                  imported
                                                    ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900'
                                                    : 'hover:bg-muted/50 border border-transparent hover:border-border'
                                                }`}
                                              >
                                                {imported ? (
                                                  <div className='w-4 h-4 rounded bg-green-500 flex items-center justify-center flex-shrink-0'>
                                                    <Check className='w-3 h-3 text-white' />
                                                  </div>
                                                ) : (
                                                  <Checkbox
                                                    checked={selected}
                                                    onCheckedChange={(
                                                      checked
                                                    ) =>
                                                      handleSelectRequest(
                                                        request.id,
                                                        checked as boolean
                                                      )
                                                    }
                                                    className='flex-shrink-0'
                                                  />
                                                )}
                                                <MethodBadge
                                                  method={
                                                    request.method || 'GET'
                                                  }
                                                />
                                                <div className='flex-1 min-w-0'>
                                                  <div className='flex items-center gap-2'>
                                                    <h4 className='font-medium text-foreground truncate'>
                                                      {request.name}
                                                    </h4>
                                                    {imported && (
                                                      <span className='text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full whitespace-nowrap font-medium'>
                                                        Already imported
                                                      </span>
                                                    )}
                                                  </div>
                                                  <p className='text-sm text-muted-foreground truncate mt-0.5'>
                                                    {request.url}
                                                  </p>
                                                </div>
                                              </div>
                                            );
                                          })}
                                      </div>
                                    )}

                                  {treeData.folders &&
                                    treeData.folders.length > 0 && (
                                      <div>
                                        {treeData.folders.map((folder: any) => (
                                          <FolderTreeItem
                                            key={folder.id}
                                            folder={folder}
                                            collectionId={collection.id}
                                            selectedRequests={selectedRequests}
                                            importedRequestIds={
                                              importedRequestIds
                                            }
                                            onSelectRequest={
                                              handleSelectRequest
                                            }
                                            expandedFolders={expandedFolders}
                                            onToggleFolder={toggleFolder}
                                            searchQuery={searchQuery}
                                          />
                                        ))}
                                      </div>
                                    )}
                                </div>
                              ) : (
                                <p className='text-muted-foreground text-center py-4'>
                                  No requests found
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )
                )}
              </div>

              <div className='flex items-center justify-between pt-4 border-t mt-4'>
                <span className='text-muted-foreground'>
                  {selectedCount} request{selectedCount !== 1 ? 's' : ''}{' '}
                  selected
                  {importedRequestIds.length > 0 && (
                    <span className='ml-2 text-green-600'>
                      • {importedRequestIds.length} already imported
                    </span>
                  )}
                </span>
                <div className='flex gap-2'>
                  <Button variant='outline' onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={selectedCount === 0}
                    className='bg-blue-500 hover:bg-blue-600 text-white'
                  >
                    Import {selectedCount} Request
                    {selectedCount !== 1 ? 's' : ''}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value='extranal'>
            <div className='flex-1 overflow-hidden flex flex-col'>
              <div className='mb-4'>
                {externalRequests.length === 0 ? (
                  <label
                    htmlFor='externalFileUpload'
                    className='border-dashed border-2 border-muted-foreground/30 rounded-lg p-8 w-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors'
                  >
                    <Upload className='w-6 h-6 text-muted-foreground mb-2' />
                    <span className='text-muted-foreground'>
                      Click or drag and drop a Postman collection (.json)
                    </span>
                  </label>
                ) : (
                  <div className='flex items-center justify-between px-4 py-3 bg-muted/30 rounded-lg border'>
                    <div className='text-muted-foreground font-medium'>
                      Loaded {externalRequests.length} request
                      {externalRequests.length !== 1 ? 's' : ''}
                    </div>
                    <label
                      htmlFor='externalFileUpload'
                      className='text-blue-600 hover:text-blue-700 font-medium cursor-pointer'
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
                  <p className='text-red-500 mt-2 font-medium'>
                    {externalFileError}
                  </p>
                )}
              </div>

              <div className='flex-1 overflow-y-auto scrollbar-thin space-y-3 max-h-[50vh]'>
                {externalRequests.length === 0 ? (
                  <div className='text-muted-foreground text-center py-12'>
                    Upload a Postman collection to view requests.
                  </div>
                ) : (
                  <div className='border rounded-lg overflow-hidden bg-card'>
                    <div className='flex items-center justify-between p-4 bg-muted/30 border-b'>
                      <h3 className='font-semibold'>
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
                        className='text-blue-600 hover:text-blue-700 font-medium'
                      >
                        {externalRequests.every((r) =>
                          selectedRequests.includes(r.id)
                        )
                          ? 'Deselect All'
                          : 'Select All Available'}
                      </Button>
                    </div>

                    <div className='p-4 space-y-1'>
                      {externalFolderTree?.requests &&
                        externalFolderTree.requests.length > 0 && (
                          <div className='space-y-1 mb-4'>
                            {externalFolderTree.requests
                              .filter((req: any) =>
                                (req.name ?? '')
                                  .toLowerCase()
                                  .includes(searchQuery.toLowerCase())
                              )
                              .map((request: any) => {
                                const imported = isRequestImported(request.id);
                                const selected = selectedRequests.includes(
                                  request.id
                                );

                                return (
                                  <div
                                    key={request.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                                      imported
                                        ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900'
                                        : 'hover:bg-muted/50 border border-transparent hover:border-border'
                                    }`}
                                  >
                                    {imported ? (
                                      <div className='w-4 h-4 rounded bg-green-500 flex items-center justify-center flex-shrink-0'>
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
                                        className='flex-shrink-0'
                                      />
                                    )}
                                    <MethodBadge
                                      method={request.method || 'GET'}
                                    />
                                    <div className='flex-1 min-w-0'>
                                      <div className='flex items-center gap-2'>
                                        <h4 className='font-medium text-foreground truncate'>
                                          {request.name}
                                        </h4>
                                        {imported && (
                                          <span className='text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full whitespace-nowrap font-medium'>
                                            Already imported
                                          </span>
                                        )}
                                      </div>
                                      <p className='text-sm text-muted-foreground truncate mt-0.5'>
                                        {request.url}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}

                      {externalFolderTree?.folders &&
                        externalFolderTree.folders.length > 0 && (
                          <div>
                            {externalFolderTree.folders.map((folder: any) => (
                              <FolderTreeItem
                                key={folder.id}
                                folder={folder}
                                collectionId='external'
                                selectedRequests={selectedRequests}
                                importedRequestIds={importedRequestIds}
                                onSelectRequest={handleSelectRequest}
                                expandedFolders={externalExpandedFolders}
                                onToggleFolder={toggleExternalFolder}
                                searchQuery={searchQuery}
                              />
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>

              <div className='flex items-center justify-between pt-4 border-t mt-4'>
                <span className='text-muted-foreground'>
                  {selectedCount} request{selectedCount !== 1 ? 's' : ''}{' '}
                  selected
                  {importedRequestIds.length > 0 && (
                    <span className='ml-2 text-green-600'>
                      • {importedRequestIds.length} already imported
                    </span>
                  )}
                </span>
                <div className='flex gap-2'>
                  <Button variant='outline' onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={selectedCount === 0}
                    className='bg-blue-500 hover:bg-blue-600 text-white'
                  >
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
