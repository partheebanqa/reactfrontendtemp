import React, { useState } from 'react';
import { X, Search, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface Request {
  id: string;
  name: string;
  method: string;
  url: string;
  description?: string;
}

interface Collection {
  id: string;
  name: string;
  requests: Request[];
}

interface ImportCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (selectedRequests: Request[]) => void;
}

const ImportCollectionModal: React.FC<ImportCollectionModalProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());

  // Mock collections data
  const collections: Collection[] = [
    {
      id: 'col1',
      name: 'User Management API',
      requests: [
        { id: 'req1', name: 'Get User Profile', method: 'GET', url: '/api/users/profile', description: 'Retrieve user profile information' },
        { id: 'req2', name: 'Update User Profile', method: 'PUT', url: '/api/users/profile', description: 'Update user profile data' },
        { id: 'req3', name: 'Delete User Account', method: 'DELETE', url: '/api/users/account', description: 'Delete user account' },
      ]
    },
    {
      id: 'col2',
      name: 'Authentication API',
      requests: [
        { id: 'req4', name: 'User Login', method: 'POST', url: '/api/auth/login', description: 'Authenticate user credentials' },
        { id: 'req5', name: 'User Logout', method: 'POST', url: '/api/auth/logout', description: 'End user session' },
        { id: 'req6', name: 'Refresh Token', method: 'POST', url: '/api/auth/refresh', description: 'Refresh authentication token' },
      ]
    },
    {
      id: 'col3',
      name: 'Payment API',
      requests: [
        { id: 'req7', name: 'Process Payment', method: 'POST', url: '/api/payments/process', description: 'Process payment transaction' },
        { id: 'req8', name: 'Get Payment History', method: 'GET', url: '/api/payments/history', description: 'Retrieve payment history' },
        { id: 'req9', name: 'Refund Payment', method: 'POST', url: '/api/payments/refund', description: 'Process payment refund' },
      ]
    }
  ];

  const filteredCollections = collections.map(collection => ({
    ...collection,
    requests: collection.requests.filter(request =>
      request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.method.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(collection => collection.requests.length > 0);

  const toggleCollection = (collectionId: string) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(collectionId)) {
      newExpanded.delete(collectionId);
    } else {
      newExpanded.add(collectionId);
    }
    setExpandedCollections(newExpanded);
  };

  const toggleRequest = (requestId: string) => {
    const newSelected = new Set(selectedRequests);
    if (newSelected.has(requestId)) {
      newSelected.delete(requestId);
    } else {
      newSelected.add(requestId);
    }
    setSelectedRequests(newSelected);
  };

  const selectAllInCollection = (collection: Collection) => {
    const newSelected = new Set(selectedRequests);
    const allSelected = collection.requests.every(req => newSelected.has(req.id));
    
    if (allSelected) {
      collection.requests.forEach(req => newSelected.delete(req.id));
    } else {
      collection.requests.forEach(req => newSelected.add(req.id));
    }
    setSelectedRequests(newSelected);
  };

  const handleImport = () => {
    const allRequests = collections.flatMap(col => col.requests);
    const requestsToImport = allRequests.filter(req => selectedRequests.has(req.id));
    onImport(requestsToImport);
    onClose();
    setSelectedRequests(new Set());
    setSearchTerm('');
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-100 text-blue-800';
      case 'POST': return 'bg-green-100 text-green-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Import from Collection</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {filteredCollections.map((collection) => (
              <div key={collection.id} className="border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-t-lg">
                  <button
                    onClick={() => toggleCollection(collection.id)}
                    className="flex items-center flex-1 text-left"
                  >
                    <div className="flex items-center">
                      {expandedCollections.has(collection.id) ? (
                        <ChevronDown className="h-5 w-5 text-gray-500 mr-2" />
                      ) : (
                        <ChevronUp className="h-5 w-5 text-gray-500 mr-2" />
                      )}
                      <h4 className="text-sm font-medium text-gray-900">{collection.name}</h4>
                      <span className="ml-2 text-xs text-gray-500">
                        ({collection.requests.length} requests)
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => selectAllInCollection(collection)}
                    className="text-sm text-primary-600 hover:text-primary-800"
                  >
                    {collection.requests.every(req => selectedRequests.has(req.id)) ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                {expandedCollections.has(collection.id) && (
                  <div className="p-4 space-y-2">
                    {collection.requests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                      >
                        <div className="flex items-center flex-1">
                          <input
                            type="checkbox"
                            checked={selectedRequests.has(request.id)}
                            onChange={() => toggleRequest(request.id)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getMethodColor(request.method)} mr-2`}>
                                {request.method}
                              </span>
                              <h5 className="text-sm font-medium text-gray-900">{request.name}</h5>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{request.url}</p>
                            {request.description && (
                              <p className="text-xs text-gray-400 mt-1">{request.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {selectedRequests.size} request{selectedRequests.size !== 1 ? 's' : ''} selected
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button 
              onClick={handleImport}
              disabled={selectedRequests.size === 0}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Import {selectedRequests.size} Request{selectedRequests.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportCollectionModal;