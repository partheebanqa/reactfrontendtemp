import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Request } from './APITestWorkbench';
import { MethodBadge } from './MethodBadge';

interface Collection {
  id: string;
  name: string;
  requestCount: number;
  requests: Request[];
}

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (requests: Request[]) => void;
}

// Mock data for collections
const mockCollections: Collection[] = [
  {
    id: '1',
    name: 'User Management API',
    requestCount: 3,
    requests: [
      {
        id: '1',
        method: 'GET',
        name: 'Get User Profile',
        endpoint: '/api/users/profile',
        description: 'Retrieve user profile information',
        testCases: { functional: 0, total: 0 },
      },
      {
        id: '2',
        method: 'PUT',
        name: 'Update User Profile',
        endpoint: '/api/users/profile',
        description: 'Update user profile data',
        testCases: { functional: 0, total: 0 },
      },
      {
        id: '3',
        method: 'DELETE',
        name: 'Delete User Account',
        endpoint: '/api/users/account',
        description: 'Delete user account',
        testCases: { functional: 0, total: 0 },
      },
    ],
  },
  {
    id: '2',
    name: 'Authentication API',
    requestCount: 3,
    requests: [
      {
        id: '4',
        method: 'POST',
        name: 'User Login',
        endpoint: '/api/auth/login',
        description: 'Authenticate user credentials',
        testCases: { functional: 0, total: 0 },
      },
      {
        id: '5',
        method: 'POST',
        name: 'User Registration',
        endpoint: '/api/auth/register',
        description: 'Register new user account',
        testCases: { functional: 0, total: 0 },
      },
      {
        id: '6',
        method: 'POST',
        name: 'Password Reset',
        endpoint: '/api/auth/reset-password',
        description: 'Reset user password',
        testCases: { functional: 0, total: 0 },
      },
    ],
  },
];

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [expandedCollections, setExpandedCollections] = useState<string[]>([
    '1',
    '2',
  ]);

  const filteredCollections = mockCollections.filter(
    (collection) =>
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
    const collection = mockCollections.find((c) => c.id === collectionId);
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
    const allRequests = mockCollections.flatMap((c) => c.requests);
    const requestsToImport = allRequests.filter((req) =>
      selectedRequests.includes(req.id)
    );
    onImport(requestsToImport);
    setSelectedRequests([]);
    setSearchQuery('');
  };

  const selectedCount = selectedRequests.length;

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
                <p className='text-muted-foreground'>No requests found</p>
              </div>
            ) : (
              filteredCollections.map((collection) => {
                const isExpanded = expandedCollections.includes(collection.id);
                const allSelected = collection.requests.every((req) =>
                  selectedRequests.includes(req.id)
                );
                const someSelected = collection.requests.some((req) =>
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
                                {request.endpoint}
                              </p>
                              <p className='text-sm text-muted-foreground mt-1'>
                                {request.description}
                              </p>
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
