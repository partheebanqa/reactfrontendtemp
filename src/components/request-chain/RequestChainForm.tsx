import { FolderTree, Plus, Save, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChainRequest, Collection, CollectionRequest } from '../../types';
import { useRequest } from '../../context/RequestContext';
import ChainRequestComponent from '../api-request/ChainRequest';

interface RequestChainFormProps {
  initialName?: string;
  initialDescription?: string;
//   collections?: Collection[];
//   onSubmit: (data: { name: string; description: string }) => void;
}

const COLLECTIONS_STORAGE_KEY = 'api_collections';

const RequestChainForm: React.FC<RequestChainFormProps> = ({
  initialName = '',
  initialDescription = '',
//   collections = [],
//   onSubmit,
}) => {
  const navigate = useNavigate();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [requests, setRequests] = useState<ChainRequest[]>([]);
  const [showCollectionSelector, setShowCollectionSelector] = useState(false);
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [collections, setCollections] = useState<Collection[]>([]);
  const [expandedRequests, setExpandedRequests] = useState<Record<string, boolean>>({});
  const [activeRequestTabs, setActiveRequestTabs] = useState<Record<string, 'params' | 'auth' | 'headers' | 'body'>>({});
   
  
  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // onSubmit({ name, description });
  };

  
    useEffect(() => {
    const savedCollections = localStorage.getItem(COLLECTIONS_STORAGE_KEY);
    if (savedCollections) {
        setCollections(JSON.parse(savedCollections));
    }
    }, []);

  const toggleCollection = (collectionId: string) => {
    setExpandedCollections(prev => {
      const next = new Set(prev);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });
  };

  const addRequest = () => {
      const newRequest: ChainRequest = {
        id: uuidv4(),
        name: `Request ${requests.length + 1}`,
        method: 'GET',
        url: '',
        headers: {},
        params: {},
        body: '',
        variables: {},
        dependsOn: []
      };
      setRequests([...requests, newRequest]);
      setExpandedRequests(prev => ({ ...prev, [newRequest.id]: true }));
      setActiveRequestTabs(prev => ({ ...prev, [newRequest.id]: 'params' }));
    };

    const handleRequestSelect = (request: CollectionRequest) => {
      const chainRequest: ChainRequest = {
        id: uuidv4(),
        name: request.name,
        method: request.request.method,
        url: request.request.url,
        headers: request.request.headers,
        params: request.request.params,
        body: request.request.body,
        variables: {},
        dependsOn: []
      };
  
      setRequests([...requests, chainRequest]);
      setShowCollectionSelector(false);
    };

    const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const renderCollectionSelector = () => {
      if (!showCollectionSelector) return null;
  
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Import from Collections</h2>
              <button
                onClick={() => setShowCollectionSelector(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
  
            <div className="flex-1 overflow-auto p-4">
              {collections.map(collection => (
                <div key={collection.id} className="mb-4">
                  <div className="flex items-center group">
                    <button
                      onClick={() => toggleCollection(collection.id)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      <FolderTree size={16} />
                    </button>
                    <button
                      className="flex-1 px-2 py-1 text-sm text-left hover:bg-gray-100 rounded font-medium"
                      onClick={() => toggleCollection(collection.id)}
                    >
                      {collection.name}
                    </button>
                  </div>
  
                  {expandedCollections.has(collection.id) && (
                    <div className="ml-6 mt-2 space-y-2">
                      {collection.requests.map(request => (
                        <button
                          key={request.id}
                          onClick={() => handleRequestSelect(request)}
                          className="w-full px-2 py-1 text-sm text-left hover:bg-gray-100 rounded flex items-center gap-2"
                        >
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                            {request.request.method}
                          </span>
                          <span>{request.name}</span>
                        </button>
                      ))}
  
                      {collection.folders.map(folder => (
                        <div key={folder.id}>
                          <div className="flex items-center group">
                            <button
                              onClick={() => toggleFolder(folder.id)}
                              className="p-1 text-gray-500 hover:text-gray-700"
                            >
                              <FolderTree size={16} />
                            </button>
                            <button
                              className="flex-1 px-2 py-1 text-sm text-left hover:bg-gray-100 rounded"
                              onClick={() => toggleFolder(folder.id)}
                            >
                              {folder.name}
                            </button>
                          </div>
  
                          {expandedFolders.has(folder.id) && (
                            <div className="ml-6 mt-2 space-y-2">
                              {folder.requests.map(request => (
                                <button
                                  key={request.id}
                                  onClick={() => handleRequestSelect(request)}
                                  className="w-full px-2 py-1 text-sm text-left hover:bg-gray-100 rounded flex items-center gap-2"
                                >
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                    {request.request.method}
                                  </span>
                                  <span>{request.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    };

  return (
    <div className="space-y-6 py-6 px-4">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Create Request Chain</h1>
        </div>
        <form onSubmit={handleSubmit}>
        <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Basic Information */}
            <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
                <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Request Chain Name
                </label>
                <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="e.g., User Authentication API Tests"
                    required
                />
                </div>
                <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                </label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Describe the purpose of this Request Chain"
                />
                </div>
            </div>
            </div>
        </div>
      </form>
      {/* <div className="flex space-x-2 p-3">
            <button
              onClick={() => setShowCollectionSelector(true)}
              className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 flex items-center gap-1"
            >
              <FolderTree size={16} />
              Import from Collections
            </button>
            <button
              onClick={addRequest}
              className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 flex items-center gap-1"
            >
              <Plus size={16} />
              Add Request
            </button>
        </div> */}
        <div className="space-x-2 w-full">
            <ChainRequestComponent/>
        </div>
        <div className="px-6 py-4 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/request-chain')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Request Chain
            </button>
          </div>

          {renderCollectionSelector()}
    </div>
    
  );
};

export default RequestChainForm;
