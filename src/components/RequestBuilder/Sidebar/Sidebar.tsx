import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Folder,
  Upload,
  MoreVertical,
  FolderPlus,
  Trash2,
  Edit,
  Star,
  X,
  Save,
  Copy,
  FileJson2,
  Search,
} from 'lucide-react';
import { useCollection } from '@/hooks/useCollection';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Collection, CollectionRequest } from '@/shared/types/collection';
import { useToast } from '@/hooks/useToast';
import ImportModal from '../ImportModal';
import { useRequest } from '@/hooks/useRequest';
import TooltipContainer from '@/components/ui/tooltip-container';
import CreateCollectionModel from '../CreateCollectionModel/CreateCollectionModel';
import { Input } from '@/components/ui/input';

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
    deleteRequestMutation,
    duplicateRequestMutation,
    setFavouriteCollectionMutation,
    unsetFavouriteCollectionMutation,
    renameRequestMutation,
    deleteCollectionMutation,
    handleCreateRequest,
  } = useCollection();
  const { setResponseData } = useRequest();
  const { toast, error: showError } = useToast();
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);
  const [selectedRequest, setSelectedRequest] =
    useState<CollectionRequest | null>(null);
  const [showRequestRenameModal, setShowRequestRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [requestId, setRequestId] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const [requstIndex, setRequestIndex] = useState<number | null>(null);

  // console.log("collections in sidebar:", collections);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(null);
        setMenuPosition(null);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleCreateCollection = () => {
    console.log('handleCreateCollection called');

    setShowCollectionModal(true);
  };

  const handleRenameCollection = (collection: Collection) => {
    setSelectedCollection(collection);
    setShowCollectionModal(true);
    setShowMenu(null);
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
        console.error('Error creating collection:', error);
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
      if (collection.isImportant) {
        // unset expects just the id
        await unsetFavouriteCollectionMutation.mutateAsync(collection.id);
      } else {
        await setFavouriteCollectionMutation.mutateAsync({
          collectionId: collection.id,
          IsImportant: true,
        });
      }
    } catch (error) {
      console.error('Error updating favorite collection:', error);
      showError('failed to update favorite collection');
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    try {
      await deleteRequestMutation.mutateAsync(requestId);
      setShowMenu(null);

      toast({
        title: 'Request deleted',
        description: 'The request has been successfully deleted',
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to delete request:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicateRequest = async (request: CollectionRequest) => {
    if (!request.id || !request.collectionId) {
      toast({
        title: 'Error',
        description: 'Invalid request data. Cannot duplicate.',
        variant: 'destructive',
      });
      return;
    }

    try {
      toast({
        title: 'Duplicating request',
        description: 'Creating a copy of the request...',
      });
      const duplicatedRequest = await duplicateRequestMutation.mutateAsync({
        requestId: request.id,
      });
      if (duplicatedRequest) {
        fetchCollectionRequests.mutateAsync(request.collectionId);
      }
      setShowMenu(null);
      toast({
        title: 'Request duplicated',
        description: 'A copy of the request has been created',
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to duplicate request:', error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate the request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const saveRenamedRequest = async () => {
    try {
      if (renameValue.trim() && requestId) {
        await renameRequestMutation.mutateAsync({
          requestId: requestId,
          newName: renameValue,
          workspaceId: ''
        });
        setShowRequestRenameModal(false);
      }
    } catch (error) {
      console.error('Failed to rename request:', error);
      showError(
        'Rename Failed',
        'An error occurred while renaming the request name.'
      );
    }
  };

  // Add proper async handling
  const handleDeleteCollection = async () => {
    if (!selectedCollection) return;

    try {
      await deleteCollectionMutation.mutateAsync(selectedCollection.id);

      toast({
        title: 'Collection deleted',
        description: 'The collection has been successfully deleted',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the collection. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleExportCollection = async (collection: Collection) => {
    try {
      // Ensure we have the latest data for this collection
      await fetchCollectionRequests.mutateAsync(collection.id);

      // Find the collection with updated requests
      const collectionWithRequests = collections.find(
        (c) => c.id === collection.id
      );

      if (!collectionWithRequests) {
        showError('Collection not found');
        return;
      }

      // Format the collection in Postman-like structure
      const exportData = {
        info: {
          _postman_id: collection.id || `uuid-${Date.now()}`,
          name: collection.name,
          schema:
            'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
          description: '', // Postman requires this field
        },
        item: collectionWithRequests.requests.map((request) => ({
          name: request.name,
          request: {
            method: request.method,
            header:
              request.headers?.map((h) => ({
                key: h.key,
                value: h.value,
                type: 'text',
                disabled: !h.enabled,
              })) || [],
            url: {
              raw: request.url,
              protocol: getProtocol(request.url),
              host: getHost(request.url),
              path: getPath(request.url),
              query:
                request.params?.map((p) => ({
                  key: p.key,
                  value: p.value,
                  disabled: !p.enabled,
                })) || [],
            },
            body:
              request.bodyType !== 'none'
                ? {
                  mode: getPostmanBodyMode(request.bodyType),
                  ...(request.bodyType === 'json'
                    ? {
                      raw: request.bodyRawContent || '{}',
                      options: {
                        raw: {
                          language: 'json',
                        },
                      },
                    }
                    : {}),
                  ...(request.bodyType === 'form-data'
                    ? {
                      formdata: Array.isArray(request.bodyFormData)
                        ? request.bodyFormData.map((item: any) => ({
                          key: item.key,
                          value: item.type === 'file' ? '' : item.value,
                          type: item.type || 'text',
                          disabled: !item.enabled,
                        }))
                        : [],
                    }
                    : {}),
                  ...(request.bodyType === 'x-www-form-urlencoded'
                    ? {
                      urlencoded: Array.isArray(
                        (request as any).urlEncodedData
                      )
                        ? (request as any).urlEncodedData.map(
                          (item: any) => ({
                            key: item.key,
                            value: item.value,
                            disabled: !item.enabled,
                          })
                        )
                        : [],
                    }
                    : {}),
                  ...(request.bodyType === 'raw'
                    ? {
                      raw: request.bodyRawContent || '',
                    }
                    : {}),
                }
                : undefined,
            auth:
              request.authorizationType !== 'none'
                ? {
                  type: request.authorizationType,
                  [request.authorizationType]: getAuthDetails(request),
                }
                : undefined,
          },
          response: [],
        })),
      };

      // Convert to JSON string with indentation for readability
      const jsonString = JSON.stringify(exportData, null, 2);

      // Create a blob and download link
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${collection.name.replace(
        /\s+/g,
        '_'
      )}.postman_collection.json`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Collection exported',
        description: `${collection.name} has been exported successfully`,
        variant: 'success',
      });

      setShowMenu(null);
    } catch (error) {
      console.error('Error exporting collection:', error);
      showError('Failed to export collection');
    }
  };

  // Helper functions for export format conversion
  const getPostmanBodyMode = (bodyType: string): string => {
    switch (bodyType) {
      case 'json':
        return 'raw';
      case 'form-data':
        return 'formdata';
      case 'x-www-form-urlencoded':
        return 'urlencoded';
      case 'raw':
        return 'raw';
      case 'binary':
        return 'file';
      default:
        return 'raw';
    }
  };

  // URL parsing helper functions
  // Add try-catch to URL parsing functions
  const getProtocol = (url: string): string[] => {
    try {
      const urlObj = new URL(url);
      return [urlObj.protocol.replace(':', '')];
    } catch (e) {
      const match = url.match(/^(https?):\/\//);
      return match ? [match[1]] : [];
    }
  };

  const getHost = (url: string): string[] => {
    try {
      const match = url.match(/^(?:https?:\/\/)?([^\/]+)/i);
      return match ? match[1].split('.') : [];
    } catch (e) {
      return [];
    }
  };

  const getPath = (url: string): string[] => {
    try {
      const match = url.match(/^(?:https?:\/\/)?[^\/]+(\/[^?#]*)/i);
      return match && match[1] ? match[1].split('/').filter(Boolean) : [];
    } catch (e) {
      return [];
    }
  };

  const getAuthDetails = (request: CollectionRequest) => {
    switch (request.authorizationType) {
      case 'basic':
        return [
          {
            key: 'username',
            value: request.authorization?.username || '',
            type: 'string',
          },
          {
            key: 'password',
            value: request.authorization?.password || '',
            type: 'string',
          },
        ];
      case 'bearer':
        return [
          {
            key: 'token',
            value: request.authorization?.token || '',
            type: 'string',
          },
        ];
      case 'apiKey':
        return [
          {
            key: 'key',
            value: request.authorization?.key || '',
            type: 'string',
          },
          {
            key: 'value',
            value: request.authorization?.value || '',
            type: 'string',
          },
          {
            key: 'in',
            value: request.authorization?.addTo || 'header',
            type: 'string',
          },
        ];
      default:
        return [];
    }
  };

  const getMethodColor = (method: string) => {
    const colors = {
      GET: 'text-green-600',
      POST: 'text-orange-600',
      PUT: 'text-blue-600',
      DELETE: 'text-red-600',
      PATCH: 'text-purple-600',
      HEAD: 'text-gray-600',
      OPTIONS: 'text-gray-600',
    };
    return colors[method as keyof typeof colors] || 'text-gray-600';
  };

  const handleDeleteNewRequest = () => {
    setCollection(
      collections.map((col) =>
        col.id === selectedCollection?.id
          ? {
            ...col,
            requests: col.requests.filter(
              (req, index) => index !== requstIndex
            ),
          }
          : col
      )
    );
    setRequestIndex(null);
  };

  const handleClose = () => {
    setShowCollectionModal(false);
    setSelectedCollection(null);
  };

  const [searchQuery, setSearchQuery] = useState('');

  const isSearching = searchQuery.trim().length > 0;
  const isCollectionExpanded = (collectionId: string) =>
    isSearching ? true : expandedCollections.has(collectionId);


  const filteredCollections = useMemo(() => {
    if (!searchQuery.trim()) return collections;

    const query = searchQuery.toLowerCase();

    return collections
      .map((collection) => {
        const collectionMatches = collection.name.toLowerCase().includes(query);

        const matchingRequests = collection.requests.filter((req) =>
          req.name?.toLowerCase().includes(query)
        );

        if (collectionMatches || matchingRequests.length > 0) {
          return {
            ...collection,
            requests: collectionMatches ? collection.requests : matchingRequests,
          };
        }
        return null;
      })
      .filter(Boolean) as typeof collections;
  }, [collections, searchQuery]);


  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={`
       dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
      transition-all duration-300 ease-in-out
      w-full h-full md:w-64 overflow-auto
    `}
    >
      <div className='p-1 sm:p-2'>
        <div className='flex items-center justify-between mb-2 border-b border-gray-200 dark:border-gray-700 pb-2'>
          <h2 className='text-base sm:text-lg font-semibold text-gray-900 dark:text-white'>
            Collections
          </h2>
          <div className='flex items-center space-x-1'>
            <TooltipContainer text='Create collection'>
              <button
                onClick={handleCreateCollection}
                className='border border-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800'
                title='Create collection'
              >
                <FolderPlus className='text-[#136fb0]' size={23} />
              </button>
            </TooltipContainer>
            <TooltipContainer text='Import collection'>
              <button
                onClick={() => setShowImportModal(true)}
                className='border border-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800'
                aria-label='Import collection'
                title='Import from Existing Collection'
              >
                <Upload className='text-[#136fb0]' size={23} />
              </button>
            </TooltipContainer>
          </div>
        </div>

        <div className="text-center mb-2">
          <div className="mx-auto relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
              size={20}
            />
            <Input
              placeholder="Search Collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-base"
            />
          </div>
        </div>

        <div className="">
          {filteredCollections.length > 0 ? (
            filteredCollections.map((collection) => {
              const expanded = isCollectionExpanded(collection.id);

              return (
                <div key={collection.id} className="group">
                  <div
                    className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group"
                    onClick={async () => {
                      if (isSearching) return;
                      await toggleExpandedCollection(collection.id);
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      {expanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                      <Folder className="h-4 w-4 text-orange-500" />
                      <TooltipContainer text={collection.name}>
                        <span
                          className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px] inline-block align-bottom"
                          style={{
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            verticalAlign: 'bottom',
                          }}
                        >
                          {collection.name}
                          {collection.name.length > 18 && <span>&nbsp;…</span>}
                        </span>
                      </TooltipContainer>
                    </div>

                    {/* Collection Actions */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity relative">
                      <TooltipContainer
                        text={collection.isImportant ? 'Unfavorite' : 'Favorite'}
                        children={
                          <button
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => handleFavoriteCollection(collection)}
                          >
                            <Star
                              className={`h-4 w-4 ${collection.isImportant ? 'fill-yellow-400 text-yellow-500' : ''
                                }`}
                            />
                          </button>
                        }
                      />

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMenuPosition({ top: rect.bottom, left: rect.left });
                          setSelectedCollection(collection);
                          setShowMenu(collection.id);
                        }}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        aria-label="More options"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Collection Requests */}
                  <div
                    className={`
    ml-4 sm:ml-6 overflow-hidden
    ${expanded ? (isSearching ? 'max-h-none' : 'max-h-[1000px]') : 'max-h-0'}
  `}
                  >
                    {expanded && (
                      <div className="overflow-y-auto max-h-[600px]">
                        {collection.requests.map((request, index) => (
                          <div
                            key={request.id}
                            className={`
                      flex items-center justify-between p-2 rounded-md cursor-pointer
                      hover:bg-gray-50 dark:hover:bg-gray-800
                      ${activeRequest?.id === request.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                    `}
                          >
                            <div
                              className="flex items-center space-x-2 flex-1 min-w-0"
                              onClick={() => setActiveRequest(request)}
                            >
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

                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setMenuPosition({ top: rect.bottom, left: rect.left });
                                  setSelectedRequest(request);
                                  setShowMenu(`request-${request.id}`);
                                  setRequestId(request.id || '');
                                  setRequestIndex(index);
                                }}
                                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <MoreVertical className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-2 px-2">
              <p className="text-gray-500 mb-3 text-sm">No collections yet</p>
              <div className="space-y-2">
                <button
                  onClick={handleCreateCollection}
                  className="flex items-center justify-center w-full px-2 py-1.5 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                >
                  <Plus className="h-3 w-3 mr-1.5" /> Create Collection
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center justify-center w-full px-2 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <Upload className="h-3 w-3 mr-1.5" /> Import Collection
                </button>
              </div>
            </div>
          )}
        </div>



      </div>

      {showCollectionModal && (
        <CreateCollectionModel
          handleClose={handleClose}
          handleSaveCollection={handleSaveCollection}
          selectedCollection={selectedCollection}
        />
      )}

      {/* Request Rename Modal */}
      {showRequestRenameModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700'>
            <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
              <h2 className='text-xl font-semibold'>Rename Request</h2>
              <button
                onClick={() => {
                  setShowRequestRenameModal(false);
                }}
                className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              >
                <X size={20} />
              </button>
            </div>

            <div className='p-4 space-y-4'>
              <div>
                <label className='block text-sm font-medium mb-1'>Name</label>
                <input
                  type='text'
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800'
                  placeholder='Request name'
                />
              </div>
            </div>

            <div className='flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700'>
              <button
                onClick={() => {
                  setShowRequestRenameModal(false);
                }}
                className='px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              >
                Cancel
              </button>
              <button
                onClick={saveRenamedRequest}
                disabled={!renameValue.trim()}
                className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2'
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

      {/* Portal Menus */}
      {showMenu &&
        menuPosition &&
        typeof document !== 'undefined' &&
        ReactDOM.createPortal(
          <>
            {/* Collection Menu */}
            {showMenu === selectedCollection?.id && (
              <div
                ref={menuRef}
                className='fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 min-w-[180px]'
                style={{
                  top: `${menuPosition.top}px`,
                  left: `${menuPosition.left}px`,
                }}
              >
                <button
                  onClick={() => {
                    if (selectedCollection)
                      handleCreateRequest(selectedCollection);
                    setShowMenu(null);
                    setMenuPosition(null);
                  }}
                  className='flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700'
                >
                  <Plus className='h-4 w-4 mr-2' />
                  Add Request
                </button>
                <button
                  onClick={() => {
                    if (selectedCollection)
                      handleRenameCollection(selectedCollection);
                    setShowMenu(null);
                    setMenuPosition(null);
                  }}
                  className='flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700'
                >
                  <Edit className='h-4 w-4 mr-2' />
                  Rename
                </button>
                <button
                  className='flex items-center w-full px-4 py-2 text-sm text-left text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                  onClick={() => {
                    handleDeleteCollection();
                    setShowMenu(null);
                    setMenuPosition(null);
                  }}
                >
                  <Trash2 className='h-4 w-4 mr-2' />
                  Delete
                </button>
                <div className='border-t border-gray-200 dark:border-gray-700 my-1'></div>
                <button
                  className='flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700'
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedCollection)
                      handleExportCollection(selectedCollection);
                    setShowMenu(null);
                    setMenuPosition(null);
                  }}
                >
                  <FileJson2 className='h-4 w-4 mr-2' />
                  Export
                </button>
              </div>
            )}

            {/* Request Menu */}
            {showMenu.startsWith('request-') && selectedRequest && (
              <div
                ref={menuRef}
                className='fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 min-w-[180px]'
                style={{
                  top: `${menuPosition.top}px`,
                  left: `${menuPosition.left}px`,
                }}
              >
                <button
                  onClick={() => {
                    handleRenameRequest(selectedRequest);
                    setShowMenu(null);
                    setMenuPosition(null);
                  }}
                  className='flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700'
                >
                  <Edit className='h-4 w-4 mr-2' />
                  Rename
                </button>
                <button
                  onClick={() => {
                    handleDuplicateRequest(selectedRequest);
                    setShowMenu(null);
                    setMenuPosition(null);
                  }}
                  className='flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700'
                >
                  <Copy className='h-4 w-4 mr-2' />
                  Duplicate
                </button>
                <button
                  className='flex items-center w-full px-4 py-2 text-sm text-left text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                  onClick={() => {
                    if (selectedRequest.id) {
                      handleDeleteRequest(selectedRequest.id);
                    } else {
                      handleDeleteNewRequest();
                    }
                    setShowMenu(null);
                    setMenuPosition(null);
                  }}
                >
                  <Trash2 className='h-4 w-4 mr-2' />
                  Delete
                </button>
              </div>
            )}
          </>,
          document.body
        )}
    </div>
  );
};

export default Sidebar;
