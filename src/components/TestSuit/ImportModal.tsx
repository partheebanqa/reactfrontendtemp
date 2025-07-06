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
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { MethodBadge } from './MethodBadge';
import { useQuery } from '@tanstack/react-query';
import { getCollectionsWithRequests } from '../../services/collection.service';
import {
  ExtendedRequest,
  TransformedCollection,
} from '../../models/collection.model';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (requests: ExtendedRequest[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const {
    data: apiData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['collections'],
    queryFn: getCollectionsWithRequests,
    enabled: isOpen, // Only fetch when modal is open
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [expandedCollections, setExpandedCollections] = useState<string[]>([]);

  // Transform API data to match the component's expected structure
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

  // Initialize expanded collections when data is loaded
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

  const handleSelectRequest = (requestId: string, checked: boolean) => {
    if (checked) {
      setSelectedRequests((prev) => [...prev, requestId]);
    } else {
      setSelectedRequests((prev) => prev.filter((id) => id !== requestId));
    }
  };

  const handleSelectAll = (collectionId: string) => {
    const collection = collections.find((c) => c.id === collectionId);
    if (!collection) return;

    const allSelected = collection.requests.every((req) =>
      selectedRequests.includes(req.id)
    );

    if (allSelected) {
      // Deselect all
      setSelectedRequests((prev) =>
        prev.filter((id) => !collection.requests.some((req) => req.id === id))
      );
    } else {
      // Select all
      const newSelections = collection.requests
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
    const allRequests = collections.flatMap((c) => c.requests);
    const requestsToImport = allRequests.filter((req) =>
      selectedRequests.includes(req.id)
    );
    onImport(requestsToImport);
    setSelectedRequests([]);
    setSearchQuery('');
    onClose();
  };

  const selectedCount = selectedRequests.length;

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
      <DialogContent className='max-w-4xl max-h-[80vh] overflow-hidden flex flex-col'>
        <DialogHeader>
          <DialogTitle>Import from Collection</DialogTitle>
        </DialogHeader>

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

          <div className='flex-1 overflow-y-auto space-y-4'>
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
                const allSelected = collection.requests.every((req) =>
                  selectedRequests.includes(req.id)
                );

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
                          </p>
                        </div>
                      </div>
                      <Button
                        variant='link'
                        size='sm'
                        onClick={() => handleSelectAll(collection.id)}
                        className='text-primary'
                      >
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className='border-t'>
                        {collection.requests.map((request) => (
                          <div
                            key={request.id}
                            className='flex items-center space-x-3 p-4 border-b last:border-b-0 hover:bg-muted/50'
                          >
                            <Checkbox
                              checked={selectedRequests.includes(request.id)}
                              onCheckedChange={(checked) =>
                                handleSelectRequest(
                                  request.id,
                                  checked as boolean
                                )
                              }
                            />
                            <MethodBadge method={request.method} />
                            <div className='flex-1'>
                              <h4 className='font-medium'>{request.name}</h4>
                              <p className='text-sm text-muted-foreground'>
                                {request.endpoint || request.url}
                              </p>
                              {request.description && (
                                <p className='text-sm text-muted-foreground mt-1'>
                                  {request.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
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
      </DialogContent>
    </Dialog>
  );
};
