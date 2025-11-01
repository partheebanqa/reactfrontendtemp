'use client';

import type React from 'react';
import { useState, useRef, useEffect, useMemo, useLayoutEffect } from 'react';
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
  FlaskConical,
} from 'lucide-react';
import { useCollection } from '@/hooks/useCollection';
import { useWorkspace } from '@/hooks/useWorkspace';
import type { Collection, CollectionRequest } from '@/shared/types/collection';
import { useToast } from '@/hooks/use-toast';
import ImportModal from '../ImportModal';
import { useRequest } from '@/hooks/useRequest';
import TooltipContainer from '@/components/ui/tooltip-container';
import CreateCollectionModel from '../CreateCollectionModel/CreateCollectionModel';
import AddFolderModal from '../AddFolder/addFolderModel';
import RenameFolderModal from '../AddFolder/rename-folder-modal';
import DeleteFolderModal from '../AddFolder/delete-folder-modal';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAddFolder } from '@/hooks/use-folder';
import { renameFolder, deleteFolder } from '@/services/folder.service';
import { collectionActions } from '@/store/collectionStore';

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
    handleOpenAllCollectionRequests,
    openedRequests,
    closeRequest,
  } = useCollection();
  const { setResponseData } = useRequest();
  const { toast, error: showError } = useToast();
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);

  const [showImportModal, setShowImportModal] = useState(false);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    anchorTop?: number;
  } | null>(null);

  const [selectedRequest, setSelectedRequest] =
    useState<CollectionRequest | null>(null);
  const [showRequestRenameModal, setShowRequestRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [requestId, setRequestId] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const [requestIndex, setRequestIndex] = useState<number | null>(null);

  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false);
  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [selectedFolder, setSelectedFolder] = useState<any | null>(null);

  const { mutateAsync: addFolder, loading: addingFolder } = useAddFolder();

  const selectRequest = (
    req: CollectionRequest,
    parentCollection: Collection
  ) => {
    try {
      setResponseData(null);
    } catch {}
    setActiveCollection(parentCollection);
    setActiveRequest(req);
    collectionActions.openRequest(req);
  };

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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  useLayoutEffect(() => {
    if (
      !showMenu ||
      !menuPosition ||
      !menuRef.current ||
      typeof window === 'undefined'
    )
      return;

    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const menuH = menuRef.current.offsetHeight;
    const menuW = menuRef.current.offsetWidth;

    let { top, left, anchorTop } = menuPosition;
    let changed = false;

    // Flip upward if bottom would overflow (8px viewport padding)
    if (top + menuH > vh - 8 && typeof anchorTop === 'number') {
      const flippedTop = Math.max(8, anchorTop - menuH);
      if (flippedTop !== top) {
        top = flippedTop;
        changed = true;
      }
    }

    // Keep within right edge
    if (left + menuW > vw - 8) {
      const clampedLeft = Math.max(8, vw - menuW - 8);
      if (clampedLeft !== left) {
        left = clampedLeft;
        changed = true;
      }
    }

    if (changed) {
      setMenuPosition({ ...menuPosition, top, left });
    }
  }, [showMenu, menuPosition]);

  const handleCreateCollection = () => setShowCollectionModal(true);

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
    if (request.id) setRequestId(request.id);
    if (request.name) setRenameValue(request.name);
    setShowRequestRenameModal(true);
    setShowMenu(null);
  };

  const handleFavoriteCollection = async (collection: Collection) => {
    try {
      if (collection.isImportant) {
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

  const handleDeleteNewRequest = (index: number) => {
    if (index == null || !selectedRequest?.id) {
      console.log('[v0] Cannot delete: index or selectedRequest.id missing');
      return;
    }

    console.log('[v0] Deleting temp request:', selectedRequest.id);
    console.log('[v0] selectedCollection:', selectedCollection);
    console.log('[v0] selectedFolder:', selectedFolder);
    console.log('[v0] index:', index);

    const remainingRequests = openedRequests.filter(
      (req) => req.id !== selectedRequest.id
    );
    closeRequest(selectedRequest.id);

    if (remainingRequests.length > 0) {
      const lastRequest = remainingRequests[remainingRequests.length - 1];
      setActiveRequest(lastRequest);
    } else {
      setActiveRequest(null);
    }

    if (selectedFolder?.id) {
      console.log('[v0] Deleting from folder:', selectedFolder.id);
      setCollection(
        collections.map((col) =>
          col.id === selectedCollection?.id
            ? {
                ...col,
                requests: col.requests,
                folders: removeRequestAtIndexFromFolderTree(
                  (col as any).folders || [],
                  selectedFolder.id,
                  index
                ),
              }
            : col
        )
      );
    } else if (selectedCollection) {
      console.log(
        '[v0] Deleting from root collection, filtering out index:',
        index
      );
      console.log(
        '[v0] Current requests count:',
        selectedCollection.requests?.length
      );

      const updatedCollections = collections.map((col) =>
        col.id === selectedCollection.id
          ? {
              ...col,
              requests: col.requests.filter((_, i) => i !== index),
            }
          : col
      );

      console.log(
        '[v0] Updated requests count:',
        updatedCollections.find((c) => c.id === selectedCollection.id)?.requests
          ?.length
      );
      setCollection(updatedCollections);
    } else {
      console.log('[v0] Neither folder nor collection found!');
    }

    setRequestIndex(null);
    setShowMenu(null);
    setMenuPosition(null);
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

  const findRequestIndex = (requestId: string): number | null => {
    if (!selectedCollection) return null;

    if (selectedFolder?.id) {
      // Find index in folder
      const findInFolder = (folders: any[]): number | null => {
        for (const folder of folders) {
          if (folder.id === selectedFolder.id) {
            return (
              folder.requests?.findIndex((r: any) => r.id === requestId) ?? null
            );
          }
          if (Array.isArray(folder.folders)) {
            const result = findInFolder(folder.folders);
            if (result !== null) return result;
          }
        }
        return null;
      };
      return findInFolder((selectedCollection as any).folders || []);
    } else {
      // Find index in root requests
      return (
        selectedCollection.requests?.findIndex((r) => r.id === requestId) ??
        null
      );
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
        const isTempRequest = requestId.startsWith('temp-');

        if (isTempRequest) {
          // For temp requests, update local state immediately without API call
          collectionActions.renameRequest(
            renameValue,
            requestId,
            currentWorkspace?.id ?? ''
          );
        } else {
          // For saved requests, call the API to persist changes
          await renameRequestMutation.mutateAsync({
            requestId,
            newName: renameValue,
            workspaceId: currentWorkspace?.id ?? '',
            folderId: selectedRequest?.folderId ?? '',
          });
        }
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
      await fetchCollectionRequests.mutateAsync(collection.id);
      const collectionWithRequests = collections.find(
        (c) => c.id === collection.id
      );
      if (!collectionWithRequests) {
        showError('Collection not found');
        return;
      }
      const exportData = {
        info: {
          _postman_id: collection.id || `uuid-${Date.now()}`,
          name: collection.name,
          schema:
            'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
          description: '',
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
                          options: { raw: { language: 'json' } },
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
                      ? { raw: request.bodyRawContent || '' }
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
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${collection.name.replace(
        /\s+/g,
        '_'
      )}.postman_collection.json`;
      document.body.appendChild(link);
      link.click();
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

  const getProtocol = (url: string): string[] => {
    try {
      const urlObj = new URL(url);
      return [urlObj.protocol.replace(':', '')];
    } catch {
      const match = url.match(/^(https?):\/\//);
      return match ? [match[1]] : [];
    }
  };

  const getHost = (url: string): string[] => {
    try {
      const match = url.match(/^(?:https?:\/\/)?([^/]+)/i);
      return match ? match[1].split('.') : [];
    } catch {
      return [];
    }
  };

  const getPath = (url: string): string[] => {
    try {
      const match = url.match(/^(?:https?:\/\/)?[^/]+(\/[^?#]*)/i);
      return match && match[1] ? match[1].split('/').filter(Boolean) : [];
    } catch {
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

  const removeRequestAtIndexFromFolderTree = (
    folders: any[] = [],
    folderId: string,
    index: number
  ): any[] => {
    return folders.map((f: any) => {
      if (f.id === folderId) {
        return {
          ...f,
          requests: (f.requests || []).filter(
            (_: any, i: number) => i !== index
          ),
        };
      }
      if (Array.isArray(f.folders) && f.folders.length) {
        return {
          ...f,
          folders: removeRequestAtIndexFromFolderTree(
            f.folders,
            folderId,
            index
          ),
        };
      }
      return f;
    });
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
            requests: collectionMatches
              ? collection.requests
              : matchingRequests,
          };
        }
        return null;
      })
      .filter(Boolean) as typeof collections;
  }, [collections, searchQuery]);

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Folder tree with parentCollection passed through for breadcrumb correctness.
  const FolderNodeView: React.FC<{
    folder: any;
    parentCollection: Collection;
    onClickRequest: (
      req: CollectionRequest,
      parentCollection: Collection
    ) => void;
  }> = ({ folder, parentCollection, onClickRequest }) => {
    const isOpen = expandedFolders.has(folder.id);
    return (
      <div className='ml-3'>
        <div
          className='flex items-center justify-between p-[7px] rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group'
          onClick={() => toggleFolder(folder.id)}
        >
          <div className='flex items-center space-x-2'>
            {isOpen ? (
              <ChevronDown className='h-4 w-4 text-gray-500' />
            ) : (
              <ChevronRight className='h-4 w-4 text-gray-500' />
            )}
            <Folder className='h-4 w-4 text-orange-500' />
            <span className='text-sm font-medium text-gray-900 dark:text-white truncate max-w-[140px]'>
              {folder.name}
            </span>
          </div>

          <div className='opacity-0 group-hover:opacity-100 transition-opacity'>
            <button
              className='p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700'
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setMenuPosition({
                  top: rect.bottom,
                  left: rect.left,
                  anchorTop: rect.top,
                });
                setSelectedCollection(parentCollection);
                setSelectedFolder(folder);
                setShowMenu(`folder-${folder.id}`);
              }}
              aria-label='Folder options'
            >
              <MoreVertical className='h-3 w-3' />
            </button>
          </div>
        </div>

        <div
          className={`ml-4 overflow-hidden ${
            isOpen ? 'max-h-[1000px]' : 'max-h-0'
          }`}
        >
          {(folder.requests || []).map(
            (request: CollectionRequest, index: number) => (
              <div
                key={request.id || `${folder.id}-${request.name}-${index}`}
                className={`flex items-center justify-between p-[7px] rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  activeRequest?.id === request.id
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : ''
                }`}
              >
                <div
                  className='flex items-center space-x-2 flex-1 min-w-0'
                  onClick={() => onClickRequest(request, parentCollection)}
                >
                  <span
                    className={`text-xs font-medium ${getMethodColor(
                      request.method
                    )} flex-shrink-0`}
                  >
                    {request.method}
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className='text-sm text-gray-900 dark:text-white truncate min-w-0 max-w-[150px]'>
                          {request.name}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side='top'>{request.name}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className='flex items-center opacity-0 group-hover:opacity-100 transition-opacity relative'>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = (
                        e.currentTarget as HTMLButtonElement
                      ).getBoundingClientRect();
                      setMenuPosition({
                        top: rect.bottom,
                        left: rect.left,
                        anchorTop: rect.top,
                      });
                      setSelectedRequest(request);
                      setSelectedCollection(parentCollection);
                      setSelectedFolder(folder);
                      setRequestId(request.id || '');
                      setRequestIndex(index);
                      setShowMenu(
                        `request-${request.id || `${folder.id}-${index}`}`
                      );
                    }}
                    className='p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700'
                    aria-label='More options'
                  >
                    <MoreVertical className='h-3 w-3' />
                  </button>
                </div>
              </div>
            )
          )}

          {(folder.folders || []).map((sub: any) => (
            <FolderNodeView
              key={sub.id}
              folder={sub}
              parentCollection={parentCollection}
              onClickRequest={onClickRequest}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className='dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out w-full h-full md:w-64 overflow-auto'>
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

          <div className='text-center mb-2'>
            <div className='mx-auto relative'>
              <Search
                className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400'
                size={20}
              />
              <Input
                placeholder='Search Collections...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10 text-base'
              />
            </div>
          </div>

          <div>
            {filteredCollections.length > 0 ? (
              filteredCollections.map((collection) => {
                const expanded = isCollectionExpanded(collection.id);
                return (
                  <div key={collection.id} className='group'>
                    <div
                      className='flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group'
                      onClick={() => {
                        if (isSearching) return;
                        setActiveCollection(collection);
                        void toggleExpandedCollection(collection.id);
                      }}
                    >
                      <div className='flex items-center space-x-2'>
                        {expanded ? (
                          <ChevronDown className='h-4 w-4 text-gray-500' />
                        ) : (
                          <ChevronRight className='h-4 w-4 text-gray-500' />
                        )}
                        <Folder className='h-4 w-4 text-orange-500' />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className='text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px] inline-block align-bottom'
                                style={{
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden',
                                  whiteSpace: 'nowrap',
                                  verticalAlign: 'bottom',
                                }}
                              >
                                {collection.name}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side='top'>
                              {collection.name}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      <div className='flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity relative'>
                        <TooltipContainer
                          text={
                            collection.isImportant ? 'Unfavorite' : 'Favorite'
                          }
                          children={
                            <button
                              className='p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700'
                              onClick={() =>
                                handleFavoriteCollection(collection)
                              }
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  collection.isImportant
                                    ? 'fill-yellow-400 text-yellow-500'
                                    : ''
                                }`}
                              />
                            </button>
                          }
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = (
                              e.currentTarget as HTMLButtonElement
                            ).getBoundingClientRect();
                            setMenuPosition({
                              top: rect.bottom,
                              left: rect.left,
                              anchorTop: rect.top,
                            });
                            setSelectedCollection(collection);
                            setShowMenu(collection.id);
                          }}
                          className='p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700'
                          aria-label='More options'
                        >
                          <MoreVertical className='h-3 w-3' />
                        </button>
                      </div>
                    </div>

                    <div
                      className={`ml-4 sm:ml-6 overflow-hidden ${
                        expanded
                          ? isSearching
                            ? 'max-h-none'
                            : 'max-h-[1000px]'
                          : 'max-h-0'
                      }`}
                    >
                      {expanded && (
                        <div className='overflow-y-auto max-h-[600px]'>
                          {collection.requests
                            .filter((r: any) => !r.folderId)
                            .map((request, index) => (
                              <div
                                key={request.id || `root-${index}`}
                                className={`flex items-center justify-between p-[7px] rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                                  activeRequest?.id === request.id
                                    ? 'bg-blue-50 dark:bg-blue-900/20'
                                    : ''
                                }`}
                              >
                                <div
                                  className='flex items-center space-x-2 flex-1 min-w-0'
                                  onClick={() =>
                                    selectRequest(request, collection)
                                  }
                                >
                                  <span
                                    className={`text-xs font-medium ${getMethodColor(
                                      request.method
                                    )} flex-shrink-0`}
                                  >
                                    {request.method}
                                  </span>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className='text-sm text-gray-900 dark:text-white truncate min-w-0 max-w-[150px]'>
                                          {request.name}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent side='top'>
                                        {request.name}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <div className='flex items-center opacity-0 group-hover:opacity-100 transition-opacity relative'>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const rect = (
                                        e.currentTarget as HTMLButtonElement
                                      ).getBoundingClientRect();
                                      setMenuPosition({
                                        top: rect.bottom,
                                        left: rect.left,
                                        anchorTop: rect.top,
                                      });
                                      setSelectedRequest(request);
                                      setSelectedCollection(collection);
                                      setRequestId(request.id || '');
                                      setShowMenu(`request-${request.id}`);
                                    }}
                                    className='p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700'
                                  >
                                    <MoreVertical className='h-3 w-3' />
                                  </button>
                                </div>
                              </div>
                            ))}

                          {(collection as any).folders?.map((folder: any) => (
                            <FolderNodeView
                              key={folder.id}
                              folder={folder}
                              parentCollection={collection}
                              onClickRequest={(req, parentCol) =>
                                selectRequest(req, parentCol)
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className='text-center py-2 px-2'>
                <p className='text-gray-500 mb-3 text-sm'>No collections yet</p>
                <div className='space-y-2'>
                  <button
                    onClick={handleCreateCollection}
                    className='flex items-center justify-center w-full px-2 py-1.5 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50'
                  >
                    <Plus className='h-3 w-3 mr-1.5' /> Create Collection
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className='flex items-center justify-center w-full px-2 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50'
                  >
                    <Upload className='h-3 w-3 mr-1.5' /> Import Collection
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

        {showRequestRenameModal && (
          <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
            <div className='bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700'>
              <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
                <h2 className='text-xl font-semibold'>Rename Request</h2>
                <button
                  onClick={() => setShowRequestRenameModal(false)}
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
                  onClick={() => setShowRequestRenameModal(false)}
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

        {showImportModal && (
          <ImportModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
          />
        )}

        {showMenu &&
          menuPosition &&
          typeof document !== 'undefined' &&
          ReactDOM.createPortal(
            <div
              ref={menuRef}
              className='fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 min-w-[180px]'
              style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
              }}
            >
              {showMenu === selectedCollection?.id && (
                <div>
                  <button
                    onClick={() => {
                      if (selectedCollection && !addingFolder) {
                        setSelectedFolder(null);
                        setShowMenu(null);
                        setMenuPosition(null);
                        setShowAddFolderModal(true);
                      }
                    }}
                    disabled={addingFolder}
                    className='flex items-center w-full px-4 py-2 text-sm text-gray-900 dark:text-white text-left hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50'
                  >
                    <FolderPlus className='h-4 w-4 mr-2' />
                    Add Folder
                  </button>

                  <button
                    onClick={() => {
                      if (selectedCollection)
                        handleCreateRequest(selectedCollection);
                      setShowMenu(null);
                      setMenuPosition(null);
                    }}
                    className='flex items-center w-full px-4 py-2 text-sm text-gray-900 dark:text-white text-left hover:bg-gray-100 dark:hover:bg-gray-700'
                  >
                    <Plus className='h-4 w-4 mr-2' />
                    Add Request
                  </button>

                  <div className='border-t border-gray-200 dark:border-gray-700 my-1'></div>

                  <button
                    onClick={async () => {
                      console.log(
                        '[v0] Sanitize test clicked for collection:',
                        selectedCollection?.id
                      );
                      if (selectedCollection) {
                        await fetchCollectionRequests.mutateAsync(
                          selectedCollection.id
                        );
                        collectionActions.openSanitizeTestRunner(
                          selectedCollection.id
                        );
                      }
                      setShowMenu(null);
                      setMenuPosition(null);
                    }}
                    className='flex items-center w-full px-4 py-2 text-sm text-gray-900 dark:text-white text-left hover:bg-gray-100 dark:hover:bg-gray-700'
                  >
                    <FlaskConical className='h-4 w-4 mr-2' />
                    Sanitize Test
                  </button>

                  <div className='border-t border-gray-200 dark:border-gray-700 my-1'></div>

                  <button
                    onClick={() => {
                      if (selectedCollection)
                        handleRenameCollection(selectedCollection);
                      setShowMenu(null);
                      setMenuPosition(null);
                    }}
                    className='flex items-center w-full px-4 py-2 text-sm text-gray-900 dark:text-white text-left hover:bg-gray-100 dark:hover:bg-gray-700'
                  >
                    <Edit className='h-4 w-4 mr-2' />
                    Rename
                  </button>

                  <button
                    onClick={() => {
                      handleDeleteCollection();
                      setShowMenu(null);
                      setMenuPosition(null);
                    }}
                    className='flex items-center w-full px-4 py-2 text-sm text-red-500 dark:text-red-400 text-left hover:bg-gray-100 dark:hover:bg-gray-700'
                  >
                    <Trash2 className='h-4 w-4 mr-2' />
                    Delete
                  </button>
                </div>
              )}

              {showMenu.startsWith('request-') && selectedRequest && (
                <div>
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
                      console.log(
                        '[v0] Delete button clicked, selectedRequest:',
                        selectedRequest
                      );
                      const isTempRequest =
                        selectedRequest?.id?.startsWith('temp-');
                      console.log('[v0] Is temp request:', isTempRequest);

                      if (isTempRequest) {
                        const index = findRequestIndex(
                          selectedRequest.id || ''
                        );
                        console.log('[v0] Found request index:', index);

                        if (index !== null) {
                          handleDeleteNewRequest(index);
                        } else {
                          console.log(
                            '[v0] Could not find request index, using fallback'
                          );
                          // Fallback: just close the request without removing from collection
                          closeRequest(selectedRequest.id || '');
                          const remainingRequests = openedRequests.filter(
                            (req) => req.id !== selectedRequest.id
                          );
                          if (remainingRequests.length > 0) {
                            const lastRequest =
                              remainingRequests[remainingRequests.length - 1];
                            setActiveRequest(lastRequest);
                          } else {
                            setActiveRequest(null);
                          }
                        }
                      } else if (selectedRequest?.id) {
                        handleDeleteRequest(selectedRequest.id);
                      } else {
                        console.log('[v0] No request ID found');
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

              {showMenu.startsWith('folder-') &&
                selectedFolder &&
                selectedCollection && (
                  <div>
                    <button
                      onClick={() => {
                        setShowMenu(null);
                        setMenuPosition(null);
                        setShowAddFolderModal(true);
                      }}
                      className='flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700'
                    >
                      <FolderPlus className='h-4 w-4 mr-2' />
                      Add Folder
                    </button>

                    <button
                      onClick={() => {
                        handleCreateRequest(
                          selectedCollection,
                          selectedFolder.id
                        );
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
                        setShowMenu(null);
                        setMenuPosition(null);
                        setShowRenameFolderModal(true);
                      }}
                      className='flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700'
                    >
                      <span className='h-4 w-4 mr-2'>✎</span>
                      Rename Folder
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(null);
                        setMenuPosition(null);
                        setShowDeleteFolderModal(true);
                      }}
                      className='flex items-center w-full px-4 py-2 text-sm text-left text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                    >
                      <span className='h-4 w-4 mr-2'>🗑</span>
                      Delete Folder
                    </button>
                  </div>
                )}
            </div>,
            document.body
          )}

        <AddFolderModal
          isOpen={showAddFolderModal}
          collection={selectedCollection}
          onClose={() => setShowAddFolderModal(false)}
          onSave={async (folderName: string) => {
            if (!selectedCollection) return;
            try {
              await addFolder({
                collectionId: selectedCollection.id,
                name: folderName.trim(),
                parentId: selectedFolder?.id,
              });
              await fetchCollectionRequests.mutateAsync(selectedCollection.id);
              toast({
                title: 'Folder created',
                description: `Folder "${folderName.trim()}" has been added.`,
                variant: 'success',
              });
            } catch (error) {
              console.error('Failed to add folder:', error);
              toast({
                title: 'Error',
                description: 'Failed to add folder. Please try again.',
                variant: 'destructive',
              });
            } finally {
              setShowAddFolderModal(false);
            }
          }}
          loading={addingFolder}
        />

        <RenameFolderModal
          isOpen={showRenameFolderModal}
          initialName={selectedFolder?.name || ''}
          onClose={() => setShowRenameFolderModal(false)}
          onSave={async (name: string) => {
            if (!selectedFolder || !selectedCollection) return;
            try {
              await renameFolder({ folderId: selectedFolder.id, name });
              await fetchCollectionRequests.mutateAsync(selectedCollection.id);
              toast({
                title: 'Folder renamed',
                description: `Folder is now "${name}"`,
                variant: 'success',
              });
            } catch (err) {
              console.error('[v0] renameFolder error:', err);
              toast({
                title: 'Error',
                description: 'Failed to rename folder. Please try again.',
                variant: 'destructive',
              });
            } finally {
              setShowRenameFolderModal(false);
            }
          }}
        />

        <DeleteFolderModal
          isOpen={showDeleteFolderModal}
          folderName={selectedFolder?.name || ''}
          onClose={() => setShowDeleteFolderModal(false)}
          onConfirm={async () => {
            if (!selectedFolder || !selectedCollection) return;
            try {
              await deleteFolder(selectedFolder.id);
              await fetchCollectionRequests.mutateAsync(selectedCollection.id);
              toast({
                title: 'Folder deleted',
                description: 'The folder has been removed.',
                variant: 'success',
              });
            } catch (err) {
              console.error('deleteFolder error:', err);
              toast({
                title: 'Error',
                description: 'Failed to delete folder. Please try again.',
                variant: 'destructive',
              });
            } finally {
              setShowDeleteFolderModal(false);
            }
          }}
        />
      </div>
    </TooltipProvider>
  );
};

export default Sidebar;
