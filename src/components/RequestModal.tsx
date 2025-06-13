import React, { useState, useEffect } from 'react';
import { X, Save, Plus, FolderTree } from 'lucide-react';
import { CollectionRequest, Request, Collection, CollectionFolder } from '../types';
import { v4 as uuidv4 } from 'uuid';
import CollectionModal from './CollectionModal';

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (request: CollectionRequest) => void;
  request?: CollectionRequest;
  currentRequest?: CollectionRequest;
  collections?: any[];
  onCollectionCreate?: (collection: Collection) => void;
  // onCollectionCreate?: (collection: CollectionList) => void;
  collectionId?: string; // Add this prop for pre-selecting collection
}

const RequestModal: React.FC<RequestModalProps> = ({
  isOpen,
  onClose,
  onSave,
  request,
  currentRequest,
  collections = [],
  onCollectionCreate,
  collectionId // Add this prop
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setName(request?.name || '');
      setDescription(request?.description || '');
      // Set the selected collection ID to either the provided collectionId or the first collection
      setSelectedCollectionId(collectionId || collections[0]?.id || '');
      setSelectedFolderId('');
    }
  }, [isOpen, request, collectionId, collections]);

  if (!isOpen) return null;

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

  const handleSave = () => {
    const newRequest: CollectionRequest = {
      id: request?.id || uuidv4(),
      name,
      description,
      collectionId: selectedCollectionId, // Add this to track the collection
      // folderId: selectedFolderId || undefined, // Add this to track the folder
      createdAt: request?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: 0,
      method: '',
      bodyType: '',
      authorizationType: '',
      authorization: {
        token: undefined
      },
      variables: {
        userId: ''
      },
      createdBy: '',
      url: ''
    };

    console.log(newRequest)
    // onSave(newRequest);
    onClose();
  };

  const handleNewCollectionCreate = (collection: Collection) => {
    onCollectionCreate?.(collection);
    setSelectedCollectionId(collection.id);
    setShowNewCollectionModal(false);
  };

  const renderFolders = (folders: CollectionFolder[], level = 0) => {
    return folders.map(folder => (
      <div key={folder.id} style={{ marginLeft: `${level * 20}px` }}>
        <div className="flex items-center py-1">
          <button
            onClick={() => toggleFolder(folder.id)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <FolderTree size={16} className="text-gray-500" />
          </button>
          <button
            onClick={() => setSelectedFolderId(folder.id)}
            className={`flex-1 px-2 py-1 text-left text-sm rounded hover:bg-gray-100 ${
              selectedFolderId === folder.id ? 'bg-blue-50 text-blue-600' : ''
            }`}
          >
            {folder.name}
          </button>
        </div>
        {/* {expandedFolders.has(folder.id) && folder.folders.length > 0 && (
          renderFolders(folder.folders, level + 1)
        )} */}
      </div>
    ));
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">
              {request ? 'Edit Request' : 'Save Request'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Request name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md h-32"
                placeholder="Describe your request..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Collection
                </label>
                <button
                  onClick={() => setShowNewCollectionModal(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus size={14} />
                  New Collection
                </button>
              </div>
              <select
                value={selectedCollectionId}
                onChange={(e) => {
                  setSelectedCollectionId(e.target.value);
                  setSelectedFolderId('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a collection</option>
                {collections.map(collection => (
                  <option key={collection.Id} value={collection.Id}>
                    {collection.Name}
                  </option>
                ))}
              </select>
            </div>

            {selectedCollectionId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Folder (Optional)
                </label>
                {/* <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto">
                  <div className="p-2">
                    <button
                      onClick={() => setSelectedFolderId('')}
                      className={`w-full px-2 py-1 text-left text-sm rounded hover:bg-gray-100 ${
                        !selectedFolderId ? 'bg-blue-50 text-blue-600' : ''
                      }`}
                    >
                      Root Level
                    </button>
                    {collections
                      .find(c => c.Id === selectedCollectionId)
                      ?.folders.map(folder => (
                        <div key={folder.id}>
                          <div className="flex items-center py-1">
                            <button
                              onClick={() => toggleFolder(folder.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <FolderTree size={16} className="text-gray-500" />
                            </button>
                            <button
                              onClick={() => setSelectedFolderId(folder.id)}
                              className={`flex-1 px-2 py-1 text-left text-sm rounded hover:bg-gray-100 ${
                                selectedFolderId === folder.id ? 'bg-blue-50 text-blue-600' : ''
                              }`}
                            >
                              {folder.name}
                            </button>
                          </div>
                          {expandedFolders.has(folder.id) && folder.folders.length > 0 && (
                            renderFolders(folder.folders)
                          )}
                        </div>
                      ))}
                  </div>
                </div> */}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || !selectedCollectionId}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={16} />
              Save Request
            </button>
          </div>
        </div>
      </div>

      {showNewCollectionModal && (
        <CollectionModal
          isOpen={showNewCollectionModal}
          onClose={() => setShowNewCollectionModal(false)}
          onSaveCollection={handleNewCollectionCreate}
        />
      )}
    </>
  );
};

export default RequestModal;