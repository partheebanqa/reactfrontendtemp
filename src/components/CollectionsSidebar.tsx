import React, { useEffect, useRef, useState } from 'react';
import { Plus, MoreVertical, Upload, FolderTree, Trash2, Edit, Move } from 'lucide-react';
import { Collection, CollectionRequest, Request } from '../types';
import CollectionModal from './CollectionModal';
import FolderModal from './FolderModal';
import RequestModal from './RequestModal';
import MoveRequestModal from './MoveRequestModal';
import { useWorkspace } from '../context/WorkspaceContext';
import { CollectionList, collectionService } from '../shared/services/collectionService';
import { showSnackbar } from '../shared/services/snackbarService';

interface CollectionsSidebarProps {
  collections: any[];
  onCollectionCreate: (collection: Collection) => void;
  onCollectionUpdate: (collection: Collection) => void;
  onCollectionDelete: (collectionId: string) => void;
  onRequestSelect: (request: CollectionRequest) => void;
  onImport: () => void;
  currentRequest?: Request;
}

const CollectionsSidebar: React.FC<CollectionsSidebarProps> = ({
  collections,
  onCollectionCreate,
  onCollectionUpdate,
  onCollectionDelete,
  onRequestSelect,
  onImport,
  currentRequest
}) => {
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [selectedCollectionForRequest, setSelectedCollectionForRequest] = useState<string>('');
  const [selectedFolderForRequest, setSelectedFolderForRequest] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<CollectionRequest | null>(null);

  //latest code
  const { selectedWorkspaceId } = useWorkspace();
  const [localCollections, setLocalCollections] = useState<CollectionList[]>([]);
  const [localCollection, editLocalCollection] = useState<CollectionList>();
  
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

  const handleAddRequest = (collectionId: string, folderId?: string) => {
    setSelectedCollectionForRequest(collectionId);
    setSelectedFolderForRequest(folderId || null);
    setShowRequestModal(true);
    setShowMenu(null);
  };

  useEffect(() => {
  const fetchCollections = async () => {
    try {
      const response = await collectionService.getCollections(selectedWorkspaceId);
      setLocalCollections(response.collections);
    } catch (err) {
      console.error("Failed to fetch collections", err);
    }
  };

  if (selectedWorkspaceId) {
    fetchCollections();
  }
  }, [selectedWorkspaceId]);

  const onSaveCollection = (collection:CollectionList) => {
    const isCollection = localCollections.find((x) => x.Id == collection.Id);
     if (isCollection) {
      console.log(collection)
       setLocalCollections(prev =>
        prev.map(c =>
          c.Id === collection.Id
            ? { ...c, Name: collection.Name } // Only update the name
            : c
          )
        );
        return ;
    }
    setLocalCollections([...localCollections,collection ])
  }

  const deleteCollections = async (id:string) => {
    const response = await collectionService.deleteCollections(id);
    showSnackbar(response.message, 'success');
    setLocalCollections(prev => prev.filter(localCollections => localCollections.Id !== id));
  }

  const handleSaveRequest = (request: CollectionRequest) => {
    const collection = localCollections.find(c => c.id === request.collectionId);
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

    onCollectionUpdate(updatedCollection);
    setShowRequestModal(false);
  };

  const handleMoveRequest = (targetCollectionId: string, targetFolderId?: string) => {
    if (!selectedRequest) return;

    // Remove from source
    const sourceCollection = collections.find(c => c.id === selectedRequest.collectionId);
    if (!sourceCollection) return;

    const updatedSourceCollection = { ...sourceCollection };
    if (selectedRequest.folderId) {
      const removeFolderRequest = (folders: CollectionFolder[]): CollectionFolder[] => {
        return folders.map(f => {
          if (f.id === selectedRequest.folderId) {
            return {
              ...f,
              requests: f.requests.filter(r => r.id !== selectedRequest.id)
            };
          }
          if (f.folders.length > 0) {
            return {
              ...f,
              folders: removeFolderRequest(f.folders)
            };
          }
          return f;
        });
      };

      updatedSourceCollection.folders = removeFolderRequest(updatedSourceCollection.folders);
    } else {
      updatedSourceCollection.requests = updatedSourceCollection.requests.filter(
        r => r.id !== selectedRequest.id
      );
    }

    onCollectionUpdate(updatedSourceCollection);

    // Add to target
    const targetCollection = collections.find(c => c.id === targetCollectionId);
    if (!targetCollection) return;

    const updatedTargetCollection = { ...targetCollection };
    const movedRequest = {
      ...selectedRequest,
      collectionId: targetCollectionId,
      folderId: targetFolderId
    };

    if (targetFolderId) {
      const addFolderRequest = (folders: CollectionFolder[]): CollectionFolder[] => {
        return folders.map(f => {
          if (f.id === targetFolderId) {
            return {
              ...f,
              requests: [...f.requests, movedRequest]
            };
          }
          if (f.folders.length > 0) {
            return {
              ...f,
              folders: addFolderRequest(f.folders)
            };
          }
          return f;
        });
      };

      updatedTargetCollection.folders = addFolderRequest(updatedTargetCollection.folders);
    } else {
      updatedTargetCollection.requests = [...updatedTargetCollection.requests, movedRequest];
    }

    onCollectionUpdate(updatedTargetCollection);
    setShowMoveModal(false);
    setSelectedRequest(null);
  };

  useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.collection-menu')) {
      setShowMenu(null);
    }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div className="w-64 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Collections</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCollectionModal(true)}
              className="p-1 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
              title="New Collection"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={onImport}
              className="p-1 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
              title="Import Collection"
            >
              <Upload size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {localCollections?.map(collection => (
          <div key={collection.Id} className="mb-2">
            <div className="flex items-center group">
              <button
                onClick={() => toggleCollection(collection.Id)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <FolderTree size={16} />
              </button>
              <button
                className="flex-1 px-2 py-1 text-sm text-left hover:bg-gray-100 rounded"
                onClick={() => toggleCollection(collection.Id)}
              >
                {collection.Name}
              </button>
              <div className="relative collection-menu">
                <button
                  onClick={() => setShowMenu(showMenu === collection.Id ? null : collection.Id)}
                  className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical size={16} />
                </button>
                {showMenu === collection.Id && (
                  <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg z-10 border border-gray-200 bg-white">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          // setSelectedCollection(collection);
                          editLocalCollection(collection)
                          setShowCollectionModal(true);
                          setShowMenu(null);
                        }}
                        className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Edit size={14} />
                        Edit Collection
                      </button>
                      <button
                        onClick={() => {
                          handleAddRequest(collection.Id)
                        }}
                        className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Plus size={14} />
                        Add Request
                      </button>
                      <button
                        onClick={() => {
                          // onCollectionDelete(collection.Id);
                          deleteCollections(collection.Id)
                          setShowMenu(null);
                        }}
                        className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 size={14} />
                          Delete Collection
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* {expandedCollections.has(collection.id) && (
              <div className="ml-4 mt-1 space-y-1">
                {collection.requests.map(request => (
                  <div key={request.id} className="flex items-center group">
                    <button
                      onClick={() => onRequestSelect(request)}
                      className="flex-1 px-2 py-1 text-sm text-left hover:bg-gray-100 rounded"
                    >
                      {request.name}
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowMenu(`request-${request.id}`)}
                        className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {showMenu === `request-${request.id}` && (
                        <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg z-10 border border-gray-200">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowMoveModal(true);
                                setShowMenu(null);
                              }}
                              className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Move size={14} />
                              Move Request
                            </button>
                            <button
                              onClick={() => {
                                // Handle delete request
                                setShowMenu(null);
                              }}
                              className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 size={14} />
                              Delete Request
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )} */}
          </div>
        ))}
      </div>

      {/* prev */}
      {/* {showCollectionModal && (
        <CollectionModal
          isOpen={showCollectionModal}
          onClose={() => {
            setShowCollectionModal(false);
            setSelectedCollection(null);
          }}
          onSave={(collection) => {
            if (selectedCollection) {
              onCollectionUpdate(collection);
            } else {
              onCollectionCreate(collection);
            }
            setShowCollectionModal(false);
            setSelectedCollection(null);
          }}
          collection={selectedCollection || undefined}
        />
      )} */}

      {showCollectionModal && (
        <CollectionModal
          isOpen={showCollectionModal}
          onClose={() => {
            setShowCollectionModal(false);
            setSelectedCollection(null);
            editLocalCollection(undefined);
          }}
          onSaveCollection={(collection) => {
            onSaveCollection(collection)
          }}
          collection={localCollection || undefined}
        />
      )}

      {showRequestModal && (
        <RequestModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          onSave={handleSaveRequest}
          currentRequest={currentRequest}
          collections={localCollections}
          // onCollectionCreate={onCollectionCreate}
          onCollectionCreate={onSaveCollection}
          collectionId={selectedCollectionForRequest}
        />
      )}

      {/* {showMoveModal && selectedRequest && (
        <MoveRequestModal
          isOpen={showMoveModal}
          onClose={() => {
            setShowMoveModal(false);
            setSelectedRequest(null);
          }}
          onMove={handleMoveRequest}
          collections={collections}
          currentCollectionId={selectedRequest.collectionId}
          currentFolderId={selectedRequest.folderId}
        />
      )} */}
    </div>
  );
};

export default CollectionsSidebar;