import React, { useEffect, useRef, useState } from 'react';
import { Plus, MoreVertical, Upload, FolderTree, Trash2, Edit, Move, StarIcon, Star, MoveRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Collection, CollectionFolder, CollectionRequest, Request } from '../types';
import CollectionModal from './CollectionModal';
import FolderModal from './FolderModal';
import RequestModal from './RequestModal';
import MoveRequestModal from './MoveRequestModal';
import { useWorkspace } from '../context/WorkspaceContext';
import { collectionService } from '../shared/services/collectionService';
import { useCollectionRequest } from '../context/CollectionRequestContext';

interface CollectionsSidebarProps {
  collections: Collection[];
  onCollectionCreate: (collection: Collection) => void;
  onCollectionUpdate: (collection: Collection) => void;
  onRequestSelect: (request: CollectionRequest) => void;
  onImport: () => void;
  currentRequest?: CollectionRequest;
}

const CollectionsSidebar: React.FC<CollectionsSidebarProps> = ({
  onCollectionCreate,
  onCollectionUpdate,
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
  const { selectedWorkspaceId } = useWorkspace(); 
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const { collectionRequest } = useCollectionRequest();

const toggleCollection = (collectionId: string) => {
  // Expand/collapse first
  setExpandedCollections(prev => {
    const next = new Set(prev);
    if (next.has(collectionId)) {
      next.delete(collectionId);
    } else {
      next.add(collectionId);
    }
    return next;
  });

  const targetCollection = collections.find(col => col.id === collectionId);
  
  // ✅ If already fetched, do not call API again
  if (targetCollection?.hasFetchedRequests) {
    return;
  }

  const fetchCollectionRequests = async () => {
    try {
      const response = await collectionService.getCollectionRequests(collectionId); // may be empty []

      setCollections(prevCollections =>
        prevCollections.map(collection =>
          collection.id === collectionId
            ? {
                ...collection,
                requests: response,
                hasFetchedRequests: true, // mark as fetched
              }
            : collection
        )
      );
    } catch (error) {
      console.error('Failed to fetch requests for collection:', error);
    }
  };

  fetchCollectionRequests();
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

  useEffect(() => {
    if (!selectedWorkspaceId) return;
    const fetchCollections = async () => {
    const response = await collectionService.getCollections(selectedWorkspaceId);

    const mappedCollections: Collection[] = response.collections.map((c: any) => ({
      id: c.Id,
      workspaceId: c.WorkspaceId,
      name: c.Name,
      isImportant: c.IsImportant,
      variables: c.Variables,
      createdAt: c.CreatedAt,
      updatedAt: c.UpdatedAt,
      deletedAt: c.DeletedAt,
      requests: []
    }));
    setCollections(mappedCollections);
    }
    fetchCollections();
  }, [selectedWorkspaceId]);


  const onCollectionDelete = async (collectionId: string) => {
    try {
      const response = await collectionService.deleteCollections(collectionId);
      if (response) {
          setCollections((prev) => prev.filter((c) => c.id !== collectionId));
        }
      } catch (error) {
        console.error("Error deleting collection:", error);
      }
  };

  const onSaveCollection = (collection :Collection) => {
    setCollections(prev => {
        const exists = prev.find(c => c.id === collection.id);
        if (exists) {
          return prev.map(c => c.id === collection.id ? collection : c);
        } else {
          return [...prev, collection];
        }
      });
  }

  useEffect(() => {
  if (!collectionRequest) return;

    setCollections(prevCollections =>
      prevCollections.map(collection =>
        collection.id === collectionRequest.collectionId
          ? {
              ...collection,
              requests: [
                ...(collection.requests || []),
                collectionRequest
              ]
            }
          : collection
      )
    );
  }, [collectionRequest]);

  
  const handleAddRequest = (collectionId: string, folderId?: string) => {
    setSelectedCollectionForRequest(collectionId);
    setSelectedFolderForRequest(folderId || null);
    setShowRequestModal(true);
    setShowMenu(null);
  };

  const handleSaveRequest = (request: CollectionRequest) => {
    const collection = collections.find(c => c.id === request.collectionId);
    if (!collection) return;

    const updatedCollection = { ...collection };
    
    // if (request.folderId) {
    //   const updateFolders = (folders: CollectionFolder[]): CollectionFolder[] => {
    //     return folders.map(f => {
    //       if (f.id === request.folderId) {
    //         return {
    //           ...f,
    //           requests: [...f.requests, request]
    //         };
    //       }
    //       if (f.folders.length > 0) {
    //         return {
    //           ...f,
    //           folders: updateFolders(f.folders)
    //         };
    //       }
    //       return f;
    //     });
    //   };

    //   updatedCollection.folders = updateFolders(updatedCollection.folders);
    // } else {
    //   updatedCollection.requests = [...updatedCollection.requests, request];
    // }
    updatedCollection.requests = [...updatedCollection.requests, request];

    onCollectionUpdate(updatedCollection);
    setShowRequestModal(false);
  };

  const handleMoveRequest = (targetCollectionId: string, targetFolderId?: string) => {
    if (!selectedRequest) return;

    // Remove from source
    const sourceCollection = collections.find(c => c.id === selectedRequest.collectionId);
    if (!sourceCollection) return;

    const updatedSourceCollection = { ...sourceCollection };
    updatedSourceCollection.requests = updatedSourceCollection.requests.filter(
        r => r.id !== selectedRequest.id
      );
    // if (selectedRequest.folderId) {
    //   const removeFolderRequest = (folders: CollectionFolder[]): CollectionFolder[] => {
    //     return folders.map(f => {
    //       if (f.id === selectedRequest.folderId) {
    //         return {
    //           ...f,
    //           requests: f.requests.filter(r => r.id !== selectedRequest.id)
    //         };
    //       }
    //       if (f.folders.length > 0) {
    //         return {
    //           ...f,
    //           folders: removeFolderRequest(f.folders)
    //         };
    //       }
    //       return f;
    //     });
    //   };

    //   updatedSourceCollection.folders = removeFolderRequest(updatedSourceCollection.folders);
    // } else {
    //   updatedSourceCollection.requests = updatedSourceCollection.requests.filter(
    //     r => r.id !== selectedRequest.id
    //   );
    // }

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

  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(null); // close the menu
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
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Collections</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCollectionModal(true)}
              className="p-1 text-gray-500 rounded-md hover:bg-gray-100"
              title="New Collection"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={onImport}
              className="p-1 text-gray-500 rounded-md hover:bg-gray-100"
              title="Import Collection"
            >
              <Upload size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-2">
        {collections.map(collection => (
          <div key={collection.id} className="mb-2">
            <div className="flex items-center group hover:bg-gray-100">
              <button
                onClick={() => toggleCollection(collection.id)}
                className="p-1 text-gray-500"
              >
                <FolderTree size={16} />
              </button>
              <button
                className="flex-1 px-2 py-1 text-sm text-left rounded"
                onClick={() => toggleCollection(collection.id)}
              >
                {collection.name}
              </button>
              <div className="relative" ref={menuRef}>
                <button className='text-gray-400 hover:text-gray-600'>
                  <Star size={16} fill={collection.isImportant ? 'currentColor' : 'none'}  />
                </button>
                <button
                  onClick={() => setShowMenu(showMenu === collection.id ? null : collection.id)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <MoreVertical size={16} />
                </button>
                { showMenu === collection.id && (
                  <div className="absolute mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                    <div className="p-1">
                      <button
                        onClick={() => handleAddRequest(collection.id)}
                        className="w-full px-4 py-2 text-sm text-left text-gray-70 flex items-center gap-2"
                      >
                        {/* <Plus size={14} /> */}
                        Add Request
                      </button>
                      <button className="w-full px-4 py-2 text-sm text-left text-gray-700 flex items-center gap-2">
                        Add folder
                      </button>
                      <hr />
                      <button className="w-full px-4 py-2 text-sm text-left text-gray-700 flex items-center gap-2">
                        Share
                      </button>
                      <button className="w-full px-4 py-2 text-sm text-left text-gray-700 flex items-center gap-2">
                        Move
                      </button>
                      <hr />
                      <button
                        onClick={() => {
                          setSelectedCollection(collection);
                          setShowCollectionModal(true);
                          setShowMenu(null);
                        }}
                        className="w-full px-4 py-2 text-sm text-left text-gray-700 flex items-center gap-2"
                      >
                        Rename
                      </button>
                      <button className="w-full px-4 py-2 text-sm text-left text-gray-700 flex items-center gap-2">
                        Duplicate
                      </button>
                      <button
                        onMouseDown={(e) => e.stopPropagation()} // prevent menu from closing early
                        onClick={() => {
                          onCollectionDelete(collection.id);
                          setShowMenu(null);
                          setActiveSubMenu(null);
                        }}
                        className="w-full px-4 py-2 text-sm text-left text-red-600 flex items-center gap-2"
                      >
                        Delete
                      </button>
                      <hr />
                      <div className="flex relative group">
                        <button
                          onClick={() => setActiveSubMenu(activeSubMenu === collection.id ? null : collection.id)}
                          className="w-full px-4 py-2 text-sm text-left text-gray-700 flex items-center gap-2"
                        >
                          More
                          <ChevronRight size={16} className="ml-auto mt-[2px]" />
                        </button>

                        {activeSubMenu === collection.id && (
                          <div className="absolute left-full top-0 ml-1 w-40 bg-white border border-gray-200 rounded-md shadow z-20 p-2">
                            <button className="w-full px-4 py-2 text-sm text-left text-gray-70">
                              Generate Test
                            </button>
                            <hr />
                            <button className="w-full px-4 py-2 text-sm text-left text-gray-70">
                              Export
                            </button>
                          </div>
                        )}
                      </div>
                     
                    </div>
                  </div>
                )}
              </div>
            </div>

            {expandedCollections.has(collection.id) && collection.requests.length > 0 && (
              <div className="ml-4 mt-1 space-y-1">
                {collection.requests.map(request => (
                  <div key={request.id} className="flex items-center group hover:bg-gray-100">
                    <button
                      onClick={() => onRequestSelect(request)}
                      className={`text-sm text-left
                        ${
                            request.method === 'GET'
                              ? 'text-blue-600'
                              : request.method === 'POST' || request.method === 'PUT'
                              ? 'text-yellow-600'
                              : request.method === 'DELETE'
                              ? 'text-red-600'
                              : 'text-gray-700'
                          }`}
                      >
                      {request.method}
                    </button>
                    <button
                      onClick={() => onRequestSelect(request)}
                      className="flex-1 px-2 py-1 text-sm text-left rounded"
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
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                          <div className="py-1">
                            {/* <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowMoveModal(true);
                                setShowMenu(null);
                              }}
                              className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Move size={14} />
                              Move Request
                            </button> */}
                            <button
                              className="w-full px-4 py-2 text-sm text-left flex items-center gap-2"
                            >
                              Duplicate
                            </button>
                            <button
                              className="w-full px-4 py-2 text-sm text-left flex items-center gap-2"
                            >
                              Rename
                            </button>
                            <button
                              onClick={() => {
                                // Handle delete request
                                setShowMenu(null);
                              }}
                              className="w-full px-4 py-2 text-sm text-left flex items-center gap-2"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {showCollectionModal && (
        <CollectionModal
          isOpen={showCollectionModal}
          onClose={() => {
            setShowCollectionModal(false);
            setSelectedCollection(null);
          }}
          // onSave={(collection) => {
          //   if (selectedCollection) {
          //     onCollectionUpdate(collection);
          //   } else {
          //     onCollectionCreate(collection);
          //   }
          //   setShowCollectionModal(false);
          //   setSelectedCollection(null);
          // }}
          onSaveCollection={onSaveCollection}
          collection={selectedCollection || undefined}
        />
      )}

      {showRequestModal && (
        <RequestModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          onSave={handleSaveRequest}
          currentRequest={currentRequest}
          collections={collections}
          onCollectionCreate={onCollectionCreate}
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