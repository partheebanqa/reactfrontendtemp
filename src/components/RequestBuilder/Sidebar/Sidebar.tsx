import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Folder,
  FileText,
  Upload,
  MoreVertical,
  FolderPlus,
  Trash2,
  Edit,
  Star,
  X,
  Save,
  Copy,
} from "lucide-react";
import { useCollection } from "@/hooks/useCollection";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useRequestBuilder } from "@/hooks/useRequestBuilder";
import { Collection, CollectionRequest } from "@/shared/types/collection";
import { useToast } from "@/hooks/useToast";
import ImportModal from "../ImportModal";

const Sidebar: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const {
    collections,
    activeRequest,
    expandedCollections,
    setActiveRequest,
    setActiveCollection,
    fetchCollectionRequests,
    addCollectionMutation,
    setCollection,
    toggleExpandedCollection,
    renameCollectionMutation,
    deleteRequest,
    duplicateRequestMutation,
    setFavouriteCollectionMutation,
    renameRequestMutation
  } = useCollection();
  const { toast,error:showError } = useToast();
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);
  const [showRequestRenameModal, setShowRequestRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [requestId, setRequestId] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(null);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const handleCreateCollection = () => {
    setShowCollectionModal(true);
  };

  const handleRenameCollection = (collection: Collection) => {
    setSelectedCollection(collection);
    setShowCollectionModal(true);
    setShowMenu(null);
  };

  const handleCreateRequest = (collectionId?: string) => {
    const newRequest: CollectionRequest = {
      name: "New Request",
      order: 0,
      method: "GET",
      url: "",
      bodyType: "none",
      bodyFormData: null,
      authorizationType: "none",
      authorization: {},
      variables: {},
      headers: [],
      params: [],
    };
    setActiveRequest(newRequest);
    if (collectionId) {
      setCollection(
        collections.map((collection) =>
          collection.id === collectionId
            ? {
                ...collection,
                requests: [...(collection.requests || []), newRequest],
              }
            : collection
        )
      );
      setActiveCollection(
        collections.find((col) => col.id === collectionId) || null
      );
      toggleExpandedCollection(collectionId);
    }
  };

  const handleSaveCollection = async (collectionName: string) => {
    if (currentWorkspace && collectionName.trim()) {
      try {
        if (selectedCollection) {
          await renameCollectionMutation.mutateAsync({
            id: selectedCollection.id,
            name: collectionName,
          });
        } else {
          await addCollectionMutation.mutateAsync({
            name: collectionName,
            workspaceId: currentWorkspace.id,
            isImportant: false,
          });
        }
        setShowCollectionModal(false);
      } catch (error) {
        console.error("Error creating collection:", error);
      }
    }
  };

  const handleRenameRequest = (request: CollectionRequest) => {
    if (request.id) {
      setRequestId(request.id);
    }
    if (request.name) {
      setRenameValue(request.name);
    }
    setShowRequestRenameModal(true);
    setShowMenu(null);
  };

  const handleFavoriteCollection = async (collection: Collection) => {
    try {
      await setFavouriteCollectionMutation.mutateAsync({
        collectionId: collection.id,
        IsImportant: collection.isImportant ? false : true,
      });
    } catch (error) {
      console.error("Error favoriting collection:", error);
      showError('failed to favorite collection');
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    try {
      await deleteRequest(requestId);
      deleteRequest(requestId);
      setShowMenu(null);

      toast({
        title: "Request deleted",
        description: "The request has been successfully deleted",
        variant: "success",
      });
    } catch (error) {
      console.error("Failed to delete request:", error);
      toast({
        title: "Error",
        description: "Failed to delete the request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateRequest = async (request: CollectionRequest) => {
    if (!request.id || !request.collectionId) {
      toast({
        title: "Error",
        description: "Invalid request data. Cannot duplicate.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Duplicating request",
        description: "Creating a copy of the request...",
      });
      const duplicatedRequest = await duplicateRequestMutation.mutateAsync({
        requestId: request.id,
      });
      if (duplicatedRequest) {
        fetchCollectionRequests.mutateAsync(request.collectionId);
      }
      setShowMenu(null);
      toast({
        title: "Request duplicated",
        description: "A copy of the request has been created",
        variant: "success",
      });
    } catch (error) {
      console.error("Failed to duplicate request:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate the request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const saveRenamedRequest = async () => {
    try {
      if (renameValue.trim() && requestId) {
        await renameRequestMutation.mutateAsync({
          requestId: requestId,
          newName: renameValue,
        });
        setShowRequestRenameModal(false);
      }
    } catch (error) {
      console.error("Failed to rename request:", error);
    }
  };

  const getMethodColor = (method: string) => {
    const colors = {
      GET: "text-green-600",
      POST: "text-orange-600",
      PUT: "text-blue-600",
      DELETE: "text-red-600",
      PATCH: "text-purple-600",
      HEAD: "text-gray-600",
      OPTIONS: "text-gray-600",
    };
    return colors[method as keyof typeof colors] || "text-gray-600";
  };
  

  return (
    <div
      className={`
      bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
      transition-all duration-300 ease-in-out
       w-64
      fixed lg:relative h-full z-40 overflow-hidden
    `}
    >
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Collections
          </h2>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleCreateRequest()}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Create new request"
            >
              <Plus className="h-4 w-4 text-blue-600" />
            </button>
            <button
              onClick={handleCreateCollection}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Create collection"
            >
              <FolderPlus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Import collection"
            >
              <Upload className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-1">
          {collections.map((collection) => {
            return (
              <div key={collection.id} className="group">
                <div
                  className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group"
                  onClick={() => toggleExpandedCollection(collection.id)}
                >
                  <div className="flex items-center space-x-2">
                    {expandedCollections?.has(collection.id) ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                    <Folder className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {collection.name}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateRequest(collection.id);
                      }}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      aria-label="Add request"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(collection.id);
                      }}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      aria-label="More options"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </button>

                    {showMenu === collection.id && (
                      <div
                        ref={menuRef}
                        className="absolute right-12 mt-8 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 min-w-[150px]"
                      >
                        <button
                          onClick={() => handleRenameCollection(collection)}
                          className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Rename
                        </button>
                        <button className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleFavoriteCollection(collection)}>
                          <Star className="h-4 w-4 mr-2" />
                          Favorite
                        </button>
                        <button className="flex items-center w-full px-4 py-2 text-sm text-left text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {expandedCollections?.has(collection.id) && (
                  <div className="ml-4 sm:ml-6 space-y-1">
                    {collection.requests.map((request) => (
                      <div
                        key={request.id}
                        className={`
                          flex items-center justify-between p-2 rounded-md cursor-pointer
                          hover:bg-gray-50 dark:hover:bg-gray-800
                          ${
                            activeRequest?.id === request.id
                              ? "bg-blue-50 dark:bg-blue-900/20"
                              : ""
                          }
                        `}
                      >
                        <div
                          className="flex items-center space-x-2 flex-1 min-w-0"
                          onClick={() => setActiveRequest(request)}
                        >
                          <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <span
                            className={`text-xs font-medium ${getMethodColor(
                              request.method
                            )} flex-shrink-0`}
                          >
                            {request.method}
                          </span>
                          <span className="text-sm text-gray-900 dark:text-white truncate min-w-0">
                            {request.name}
                          </span>
                        </div>

                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowMenu(`request-${request.id}`);
                            }}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </button>

                          {showMenu === `request-${request.id}` && (
                            <div
                              ref={menuRef}
                              className="absolute right-12 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 min-w-[150px]"
                            >
                              <button
                                onClick={() => handleRenameRequest(request)}
                                className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Rename
                              </button>
                              <button
                                onClick={() => handleDuplicateRequest(request)}
                                className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </button>
                              <button
                                className="flex items-center w-full px-4 py-2 text-sm text-left text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={() => {
                                  if (request.id) {
                                    handleDeleteRequest(request.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Collection Modal */}
      {showCollectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">
                {selectedCollection ? "Edit Collection" : "New Collection"}
              </h2>
              <button
                onClick={() => {
                  setShowCollectionModal(false);
                  setSelectedCollection(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  defaultValue={selectedCollection?.name || ""}
                  id="collectionName"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                  placeholder="Collection name"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowCollectionModal(false);
                  setSelectedCollection(null);
                }}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const nameInput = document.getElementById(
                    "collectionName"
                  ) as HTMLInputElement;
                  if (nameInput && nameInput.value.trim()) {
                    handleSaveCollection(nameInput.value);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Save size={16} />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Rename Modal */}
      {showRequestRenameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">Rename Request</h2>
              <button
                onClick={() => {
                  setShowRequestRenameModal(false);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                  placeholder="Request name"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowRequestRenameModal(false);
                }}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={saveRenamedRequest}
                disabled={!renameValue.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save size={16} />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
    </div>
  );
};

export default Sidebar;
