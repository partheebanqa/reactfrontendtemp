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
import { Search, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { MethodBadge } from './MethodBadge';
import { useQuery } from '@tanstack/react-query';
import { getCollectionsWithRequests } from '@/services/collection.service';
import {
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
  const [externalRequests, setExternalRequests] = useState<ExtendedRequest[]>([]);
const [externalFileError, setExternalFileError] = useState<string | null>(null);


  const collections: TransformedCollection[] = React.useMemo(() => {
    if (!apiData?.collections) return [];

    return apiData.collections.map((collection) => ({
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

  React.useEffect(() => {
    if (collections.length > 0 && expandedCollections.length === 0) {
      setExpandedCollections(collections.map((c) => c.id));
    }
  }, [collections, expandedCollections.length]);

  const filteredCollections = collections.filter(
    (collection: TransformedCollection) =>
      collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collection.requests.some((request) =>
        request.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

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

  const handleExternalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
            requests.push({
              id: `${item.name}-${method}`,
              name: item.name,
              method,
              url,
              endpoint: url,
              folderName: folder,
              testCases: { functional: 0, total: 0 },
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
  const isRequestChainsRoute = location === '/request-chains';
  


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
      
          <DialogTitle>Collections</DialogTitle>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full ${
          isRequestChainsRoute ? 'grid-cols-2' : 'grid-cols-1'
        }`}
        >
          <TabsTrigger value='Internal'>Import from Collection</TabsTrigger>
            {isRequestChainsRoute && (
              <TabsTrigger value='extranal'>Import from External</TabsTrigger>
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
              filteredCollections.map((collection: TransformedCollection) => {
                const isExpanded = expandedCollections.includes(collection.id);
                const availableRequests = collection.requests.filter(
                  (req) => !isRequestImported(req.id)
                );
                const allAvailableSelected = availableRequests.every((req) =>
                  selectedRequests.includes(req.id)
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
                          <h3 className='font-medium'>{collection.name}</h3>
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
                              <MethodBadge method={request.method} />
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
              })
            )}
          </div>

          <div className='flex items-center justify-between pt-4 border-t'>
            <span className='text-sm text-muted-foreground'>
              {selectedCount} request{selectedCount !== 1 ? 's' : ''} selected
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
                Import {selectedCount} Request{selectedCount !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
        </TabsContent>

        <TabsContent value='extranal'>
        <div className='flex-1 overflow-hidden flex flex-col'>
    <div className='mb-4'>
      <Input type='file' accept='.json' onChange={handleExternalFileUpload} />
      {externalFileError && (
        <p className='text-sm text-red-500 mt-2'>{externalFileError}</p>
      )}
    </div>
    

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
                  : [...selectedRequests, ...available.map((r) => r.id)];

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
                      handleSelectRequest(request.id, checked as boolean)
                    }
                  />
                )}
                <MethodBadge method={request.method} />
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

    <div className='flex items-center justify-between pt-4 border-t'>
      <span className='text-sm text-muted-foreground'>
        {selectedCount} request{selectedCount !== 1 ? 's' : ''} selected
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
          Import {selectedCount} Request{selectedCount !== 1 ? 's' : ''}
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
