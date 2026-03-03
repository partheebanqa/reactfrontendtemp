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
  X,
  Save,
  Search,
  Zap,
  Import,
  CopyPlus,
  Shield,
  Key,
  Rocket,
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
import MoveToModal from '../MoveToMove/moveToMove';
import { Input } from '@/components/ui/input';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { useAddFolder } from '@/hooks/use-folder';
import { renameFolder, deleteFolder } from '@/services/folder.service';
import { moveRequest } from '@/services/movetomove.service';
import { collectionActions } from '@/store/collectionStore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableRequest from './sortable-request';
import SortableFolder from './sortable-folder';
import SortableCollection from './sortable-collection';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { executeRequest } from '@/services/executeRequest.service';
import {
  extractDataFromResponse,
  getValueByPath,
  isBearerToken,
  shouldRefreshExtractedVariables,
} from '@/lib/request-utils';
import { CollectionRequestsResponse } from '@/shared/types/request';

interface ISidebar {
  toggleSidebar: () => void
}

const Sidebar: React.FC<ISidebar> = ({ toggleSidebar }) => {
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
    markAuthRequestMutation,
    renameRequestMutation,
    deleteCollectionMutation,
    handleCreateRequest,
    updateRequestMutation,
  } = useCollection();
  const { setResponseData } = useRequest();
  const { toast, error: showError } = useToast();
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);
  const [showMarkAuthDialog, setShowMarkAuthDialog] = useState(false);
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
    new Set(),
  );

  const [selectedFolder, setSelectedFolder] = useState<any | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveItemType, setMoveItemType] = useState<'request' | 'folder'>(
    'request',
  );
  const [moveItemName, setMoveItemName] = useState('');
  const [showDeleteCollectionDialog, setShowDeleteCollectionDialog] =
    useState(false);
  const [showDeleteRequestDialog, setShowDeleteRequestDialog] = useState(false);
  const [showDeleteAuthRequestDialog, setShowDeleteAuthRequestDialog] =
    useState(false);

  const { mutateAsync: addFolder, loading: addingFolder } = useAddFolder();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const [activeDragItem, setActiveDragItem] = useState<any>(null);

  const selectRequest = (
    req: CollectionRequest,
    parentCollection: Collection,
  ) => {
    try {
      setResponseData(null);
    } catch { }
    setActiveCollection(parentCollection);
    setActiveRequest(req);
    collectionActions.openRequest(req);
    collectionActions.closeSanitizeTestRunner();
    collectionActions.closeSecurityScan();
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

    if (top + menuH > vh - 8 && typeof anchorTop === 'number') {
      const flippedTop = Math.max(8, anchorTop - menuH);
      if (flippedTop !== top) {
        top = flippedTop;
        changed = true;
      }
    }

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

  const handleDndDragStart = (event: any) => {
    const { active } = event;
    setActiveDragItem(active.data.current);
  };

  const handleDndDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over || active.id === over.id) return;

    const activeData = active.data.current;

    const overData = over.data.current;

    if (!activeData) return;

    let targetCollectionId: string;
    let targetFolderId: string | undefined;

    if (overData?.type === 'collection') {
      targetCollectionId = overData.collection.id;
      targetFolderId = undefined;
    } else if (overData?.type === 'folder') {
      targetCollectionId = overData.collectionId;
      targetFolderId = overData.folder.id;
    } else if (overData?.type === 'request') {
      targetCollectionId = overData.collectionId;
      targetFolderId = overData.request.folderId || undefined;
    } else {
      const targetCollection = collections.find((c) => c.id === over.id);
      if (targetCollection) {
        targetCollectionId = targetCollection.id;
        targetFolderId = undefined;
      } else {
        console.warn('Could not determine drop target', {
          over,
          overData,
        });
        return;
      }
    }

    try {
      if (activeData.type === 'request') {
        const { createdBy, createdAt, updatedAt, ...cleanRequest } =
          activeData.request;

        const requestData: any = {
          ...cleanRequest,
          workspaceId: currentWorkspace?.id ?? '',
          collectionId: targetCollectionId,
          folderId: targetFolderId || undefined,
          bodyFormData: targetFolderId ? undefined : [],
        };

        await updateRequestMutation.mutateAsync({
          requestId: activeData.request.id,
          requestData,
        });

        toast({
          title: 'Request moved',
          description: `"${activeData.request.name}" has been moved successfully`,
          variant: 'success',
        });
      }

      if (activeData.collectionId) {
        await fetchCollectionRequests.mutateAsync(activeData.collectionId);
      }
      if (targetCollectionId !== activeData.collectionId) {
        await fetchCollectionRequests.mutateAsync(targetCollectionId);
      }
    } catch (error) {
      console.error('Failed to move item:', error);
      toast({
        title: 'Error',
        description: `Failed to move ${activeData.type}. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  const handleOpenSecurityScan = (request: CollectionRequest) => {
    collectionActions.openSecurityScan(request);
    setShowMenu(null);
    setMenuPosition(null);
  };

  const getAutoAuthState = (
    request: CollectionRequest,
  ): 'no-extraction' | 'has-extraction' | 'is-auth' => {
    if (!request.id || !request.collectionId) return 'no-extraction';

    // Condition 3: already set as auth request
    if (isAuthRequest(request.id, request.collectionId)) return 'is-auth';

    // Condition 2: extraction is configured and has valid token
    if (hasExtractedVariables(request)) return 'has-extraction';

    // Condition 1: no extraction set
    return 'no-extraction';
  };

  const handleOpenPerformanceTesting = (request: CollectionRequest) => {
    collectionActions.openPerformanceTesting(request);
    setShowMenu(null);
    setMenuPosition(null);
  };
  const handleOpenPerformanceScanning = (request: CollectionRequest) => {
    collectionActions.openPerformanceScanning(request);
    setShowMenu(null);
    setMenuPosition(null);
  };

  const handleCreateCollection = () => {
    setSelectedCollection(null);
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
    if (request.id) setRequestId(request.id);
    if (request.name) setRenameValue(request.name);
    setShowRequestRenameModal(true);
    setShowMenu(null);
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

  const handleMarkAuth = async (request: CollectionRequest) => {
    if (!request.id || !selectedCollection?.id) {
      toast({
        title: 'Error',
        description: 'Invalid request or collection data.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await markAuthRequestMutation.mutateAsync({
        requestId: request.id,
        collectionId: selectedCollection.id,
      });

      setCollection(
        collections.map((col) =>
          col.id === selectedCollection.id
            ? {
              ...col,
              preRequestId: request.id,
            }
            : col,
        ),
      );

      toast({
        title: 'Request marked',
        description: `"${request.name}" has been marked for authentication`,
        variant: 'success',
      });

      setShowMenu(null);
      setMenuPosition(null);
      setShowMarkAuthDialog(false);
    } catch (error) {
      console.error('Failed to mark auth:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark request for auth. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveAuth = async () => {
    if (!selectedCollection?.id) return;
    try {
      await markAuthRequestMutation.mutateAsync({
        requestId: null,
        collectionId: selectedCollection.id,
      });
      setCollection(
        collections.map((col) =>
          col.id === selectedCollection.id
            ? { ...col, preRequestId: undefined }
            : col,
        ),
      );
      toast({
        title: 'Auto Auth removed',
        description: 'Auto Auth has been disabled for this collection.',
        variant: 'success',
      });
      setShowMarkAuthDialog(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove Auto Auth. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const saveRenamedRequest = async () => {
    try {
      if (renameValue.trim() && requestId) {
        const isTempRequest = requestId.startsWith('temp-');

        if (isTempRequest) {
          collectionActions.renameRequest(
            renameValue,
            requestId,
            currentWorkspace?.id ?? '',
          );
        } else {
          await renameRequestMutation.mutateAsync({
            requestId,
            newName: renameValue,
            workspaceId: currentWorkspace?.id ?? '',
            folderId: selectedRequest?.folderId ?? '',
            collectionId: selectedRequest?.collectionId ?? '',
          });
        }

        if (activeRequest?.id === requestId) {
          setActiveRequest({
            ...activeRequest,
            name: renameValue.trim(),
          });

          collectionActions.updateOpenedRequest({
            ...activeRequest,
            name: renameValue.trim(),
          });
        }

        setShowRequestRenameModal(false);

        toast({
          title: 'Request renamed',
          description: `Request renamed to "${renameValue.trim()}"`,
          variant: 'success',
        });
      }
    } catch (error) {
      console.error('Failed to rename request:', error);
      showError(
        'Rename Failed',
        'An error occurred while renaming the request name.',
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
      setShowDeleteCollectionDialog(false);
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the collection. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleMoveRequest = async (
    targetCollectionId: string,
    targetFolderId?: string,
  ) => {
    if (!selectedRequest?.id) return;

    try {
      const payload: any = {
        collectionId: targetCollectionId,
      };

      if (targetFolderId) {
        payload.folderId = targetFolderId;
      }

      await moveRequest({
        requestId: selectedRequest.id,
        ...payload,
      });

      if (selectedCollection?.id) {
        await fetchCollectionRequests.mutateAsync(selectedCollection.id);
      }
      if (targetCollectionId !== selectedCollection?.id) {
        await fetchCollectionRequests.mutateAsync(targetCollectionId);
      }

      toast({
        title: 'Request moved',
        description: `Request has been moved successfully`,
        variant: 'success',
      });

      setShowMoveModal(false);
    } catch (error) {
      console.error('Failed to move request:', error);
      toast({
        title: 'Error',
        description: 'Failed to move the request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getMethodColor = (method: string) => {
    const colors = {
      GET: 'text-green-600',
      POST: 'text-blue-600',
      PUT: 'text-orange-600',
      DELETE: 'text-red-600',
      PATCH: 'text-purple-600',
      HEAD: 'text-gray-600',
      OPTIONS: 'text-indigo-600',
    };
    return colors[method as keyof typeof colors] || 'text-gray-600';
  };

  const removeRequestAtIndexFromFolderTree = (
    folders: any[] = [],
    folderId: string,
    index: number,
  ): any[] => {
    return folders.map((f: any) => {
      if (f.id === folderId) {
        return {
          ...f,
          requests: (f.requests || []).filter(
            (_: any, i: number) => i !== index,
          ),
        };
      }
      if (Array.isArray(f.folders) && f.folders.length) {
        return {
          ...f,
          folders: removeRequestAtIndexFromFolderTree(
            f.folders,
            folderId,
            index,
          ),
        };
      }
      return f;
    });
  };

  const handleDeleteNewRequest = () => {
    if (requestIndex == null) return;

    if (selectedFolder?.id) {
      setCollection(
        collections.map((col) =>
          col.id === selectedCollection?.id
            ? {
              ...col,
              requests: col.requests,
              folders: removeRequestAtIndexFromFolderTree(
                (col as any).folders || [],
                selectedFolder.id,
                requestIndex,
              ),
            }
            : col,
        ),
      );
    } else if (selectedCollection) {
      setCollection(
        collections.map((col) =>
          col.id === selectedCollection.id
            ? {
              ...col,
              requests: col.requests.filter(
                (_, index) => index !== requestIndex,
              ),
            }
            : col,
        ),
      );
    }

    setRequestIndex(null);
  };

  const handleClose = () => {
    setShowCollectionModal(false);
    setSelectedCollection(null);
  };

  const [searchQuery, setSearchQuery] = useState('');

  const hasExtractedVariables = (request: CollectionRequest) => {
    if (!request.id || !request.collectionId) return false;

    const hasRequestExtractions =
      request.extractVariables &&
      Array.isArray(request.extractVariables) &&
      request.extractVariables.length > 0;

    if (!hasRequestExtractions) return false;

    const collection = collections.find((c) => c.id === request.collectionId);
    if (!collection?.id) return false;

    const storageKeys = Object.keys(localStorage).filter((key) =>
      key.startsWith(`extracted_var_${collection.id}_`),
    );

    let hasValidToken = false;

    for (const storageKey of storageKeys) {
      try {
        const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
        if (data.value && isBearerToken(data.value)) {
          hasValidToken = true;
          break;
        }
      } catch (error) {
        console.error('Error parsing stored token:', error);
      }
    }

    if (!hasValidToken) {
      const extractedVars = collectionActions.getExtractedVariables(
        collection.id,
      );
      hasValidToken = Object.values(extractedVars).some((value) =>
        isBearerToken(value),
      );
    }

    return hasValidToken;
  };

  const isAuthRequest = (requestId: string, collectionId: string) => {
    const collection = collections.find((c) => c.id === collectionId);

    if (!collection?.hasFetchedRequests) {
      return false;
    }

    return collection.preRequestId === requestId;
  };

  const autoRunPreRequest = async (
    collectionId: string,
    preRequestId: string,
    collectionsData: Collection[],
  ) => {
    try {
      const collection = collectionsData.find((c) => c.id === collectionId);
      if (!collection) {
        console.error('Collection not found:', collectionId);
        return;
      }

      const findRequestInCollection = (requestId: string): any => {
        const topLevelRequest = collection.requests.find(
          (r) => r.id === requestId,
        );
        if (topLevelRequest) {
          return topLevelRequest;
        }

        const searchInFolders = (folders: any[] = []): any => {
          for (const folder of folders) {
            if (folder.requests && Array.isArray(folder.requests)) {
              const found = folder.requests.find(
                (r: any) => r.id === requestId,
              );
              if (found) {
                return found;
              }
            }
            if (folder.folders && Array.isArray(folder.folders)) {
              const found = searchInFolders(folder.folders);
              if (found) return found;
            }
          }
          return null;
        };

        const folderResult = searchInFolders((collection as any).folders || []);
        if (folderResult) {
          return folderResult;
        }

        console.error('Pre-request not found anywhere in collection');
        return null;
      };

      const preRequest = findRequestInCollection(preRequestId);

      if (!preRequest) {
        toast({
          title: 'Pre-request Not Found',
          description:
            'The authentication request could not be found in this collection',
          variant: 'destructive',
        });
        return;
      }

      const payload = {
        request: {
          workspaceId: currentWorkspace?.id || '',
          name: preRequest.name,
          order: 0,
          method: preRequest.method,
          url: preRequest.url,
          bodyType: preRequest.bodyType || 'raw',
          bodyFormData: preRequest.bodyFormData || null,
          bodyRawContent: preRequest.bodyRawContent || '',
          authorizationType: preRequest.authorizationType || 'none',
          headers: preRequest.headers || [],
          params: preRequest.params || [],
        },
        assertions: [],
      };

      const response = await executeRequest(payload);

      if (
        preRequest.extractVariables &&
        Array.isArray(preRequest.extractVariables) &&
        preRequest.extractVariables.length > 0
      ) {
        let rawBody =
          response?.data?.responses?.[0]?.body ||
          response?.data?.body ||
          response?.body;

        let responseBody;
        if (typeof rawBody === 'string') {
          try {
            responseBody = JSON.parse(rawBody);
          } catch (parseError) {
            console.error('Failed to parse response body as JSON:', parseError);
            toast({
              title: 'Parse Error',
              description: 'Failed to parse authentication response',
              variant: 'destructive',
            });
            return;
          }
        } else {
          responseBody = rawBody;
        }

        let extractedCount = 0;

        const extractedVariables = extractDataFromResponse(
          {
            body: responseBody,
            headers:
              response?.data?.responses?.[0]?.headers ||
              response?.data?.headers ||
              response?.headers ||
              {},
            cookies:
              response?.data?.responses?.[0]?.cookies ||
              response?.data?.cookies ||
              response?.cookies ||
              {},
          },
          preRequest.extractVariables,
        );

        Object.entries(extractedVariables).forEach(([varName, value]) => {
          if (value !== undefined && value !== null) {
            const storageKey = `extracted_var_${collectionId}_${varName}`;

            localStorage.setItem(
              storageKey,
              JSON.stringify({
                name: varName,
                value: String(value),
                timestamp: Date.now(),
                collectionId: collectionId,
                source: 'response_body',
                requestName: preRequest.name || '',
                requestId: preRequest.id || '',
                path:
                  preRequest.extractVariables.find(
                    (ev: any) => (ev.variableName || ev.name) === varName,
                  )?.path || '',
              }),
            );

            collectionActions.setExtractedVariable(
              collectionId,
              varName,
              String(value),
            );

            extractedCount++;
          }
        });

        if (extractedCount > 0) {
          const executionKey = `preRequest_executed_${collectionId}_${preRequestId}`;
          localStorage.setItem(executionKey, Date.now().toString());

          toast({
            title: 'Authentication Complete',
            description: `Pre-request executed and ${extractedCount} variable(s) extracted`,
            variant: 'success',
          });
        } else {
          toast({
            title: 'No Variables Extracted',
            description: 'Pre-request executed but no variables were found',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('❌ Failed to auto-run pre-request:', error);
      toast({
        title: 'Pre-request Failed',
        description: 'Could not execute authentication request',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    collections.forEach((collection) => {
      if (!collection.id) return;

      const storageKeys = Object.keys(localStorage).filter((key) =>
        key.startsWith(`extracted_var_${collection.id}_`),
      );

      storageKeys.forEach((key) => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');

          if (data.value && data.name) {
            collectionActions.setExtractedVariable(
              collection.id,
              data.name,
              data.value,
            );
          }
        } catch (error) {
          console.error(
            'Error loading extracted variable from localStorage:',
            error,
          );
        }
      });
    });
  }, [collections.length]);

  const handleCollectionExpand = async (collectionId: string) => {
    try {
      const collectionData = (await fetchCollectionRequests.mutateAsync(
        collectionId,
      )) as CollectionRequestsResponse;

      if (collectionData) {
        setCollection(
          collections.map((col) =>
            col.id === collectionId
              ? {
                ...col,
                preRequestId: collectionData?.preRequestId,
                hasFetchedRequests: true,
                requests: collectionData.requests || col.requests,
                folders: collectionData.folders || col.folders,
              }
              : col,
          ),
        );

        const storageKeys = Object.keys(localStorage).filter((key) =>
          key.startsWith(`extracted_var_${collectionId}_`),
        );

        storageKeys.forEach((key) => {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.value && data.name) {
              collectionActions.setExtractedVariable(
                collectionId,
                data.name,
                data.value,
              );
            }
          } catch (error) {
            console.error('Error restoring variable from localStorage:', error);
          }
        });

        if (collectionData?.preRequestId) {
          const findRequestInCollection = (requestId: string): any => {
            const topLevelRequest = collectionData.requests?.find(
              (r: any) => r.id === requestId,
            );
            if (topLevelRequest) return topLevelRequest;

            const searchInFolders = (folders: any[] = []): any => {
              for (const folder of folders) {
                if (folder.requests && Array.isArray(folder.requests)) {
                  const found = folder.requests.find(
                    (r: any) => r.id === requestId,
                  );
                  if (found) return found;
                }
                if (folder.folders && Array.isArray(folder.folders)) {
                  const found = searchInFolders(folder.folders);
                  if (found) return found;
                }
              }
              return null;
            };

            return searchInFolders(collectionData.folders || []);
          };

          const preRequest = findRequestInCollection(
            collectionData.preRequestId,
          );

          if (
            preRequest &&
            preRequest.extractVariables &&
            preRequest.extractVariables.length > 0
          ) {
            const needsRefresh = shouldRefreshExtractedVariables(
              collectionId,
              collectionData.preRequestId,
            );

            if (needsRefresh) {
              const executionKey = `preRequest_executed_${collectionId}_${collectionData.preRequestId}`;
              localStorage.removeItem(executionKey);

              const updatedCollection = {
                id: collectionId,
                preRequestId: collectionData.preRequestId,
                requests: collectionData.requests || [],
                folders: collectionData.folders || [],
              };

              await autoRunPreRequest(
                collectionId,
                collectionData.preRequestId,
                [updatedCollection],
              );
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching collection requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load collection requests',
        variant: 'destructive',
      });
    }
  };

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
          req.name?.toLowerCase().includes(query),
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

  const FolderNodeView: React.FC<{
    folder: any;
    parentCollection: Collection;
    onClickRequest: (
      req: CollectionRequest,
      parentCollection: Collection,
    ) => void;
    depth?: number;
  }> = ({ folder, parentCollection, onClickRequest, depth = 0 }) => {
    const isOpen = expandedFolders.has(folder.id);
    const sortableIds = [
      folder.id,
      ...(folder.requests || []).map(
        (r: CollectionRequest) => r.id || `temp-${r.name}`,
      ),
      ...(folder.folders || []).map((f: any) => f.id),
    ];

    return (
      <div className='ml-3'>
        <SortableFolder
          folder={folder}
          depth={depth}
          collectionId={parentCollection.id}
        >
          <div className='flex items-center justify-between p-[6px] rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group transition-all'>
            <div
              className='flex items-center space-x-2 flex-1'
              onClick={() => toggleFolder(folder.id)}
            >
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
              <TooltipContainer text='Folder Actions'>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
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
              </TooltipContainer>
            </div>
          </div>
        </SortableFolder>

        <div
          className={`ml-4 transition-all ${isOpen ? 'max-h-[1000px]' : 'max-h-0 overflow-hidden'
            }`}
        >
          <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
          >
            {(folder.requests || []).map(
              (request: CollectionRequest, index: number) => {
                return (
                  <SortableRequest
                    key={request.id || `${folder.id}-${request.name}-${index}`}
                    request={request}
                    depth={depth + 1}
                    collectionId={parentCollection.id}
                  >
                    <div
                      className={`group flex items-center justify-between p-[6px] rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${activeRequest?.id === request.id
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : ''
                        } ${isAuthRequest(request.id, parentCollection.id)
                          ? 'border-2 border-blue-500 rounded-lg shadow-sm'
                          : ''
                        }`}
                    >
                      <div
                        className='flex items-center space-x-2 flex-1 min-w-0'
                        onClick={(e) => {
                          if (!e.defaultPrevented) {
                            onClickRequest(request, parentCollection);
                          }
                        }}
                      >
                        {/* Add auth badge before method */}
                        {isAuthRequest(request.id, parentCollection.id) && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Key className='h-3 w-3 text-blue-600 flex-shrink-0' />
                              </TooltipTrigger>
                              <TooltipContent side='top'>
                                Auth Request
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <span
                          className={`text-xs font-medium ${getMethodColor(
                            request.method,
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
                        <TooltipContainer text='Request Actions'>
                          <button
                            onMouseDown={(e) => e.stopPropagation()}
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
                                `request-${request.id || `${folder.id}-${index}`}`,
                              );
                            }}
                            className='p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700'
                            aria-label='More options'
                          >
                            <MoreVertical className='h-3 w-3' />
                          </button>
                        </TooltipContainer>
                      </div>
                    </div>
                  </SortableRequest>
                );
              },
            )}

            {(folder.folders || []).map((sub: any) => (
              <FolderNodeView
                key={sub.id}
                folder={sub}
                parentCollection={parentCollection}
                onClickRequest={onClickRequest}
                depth={depth + 1}
              />
            ))}
          </SortableContext>
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDndDragStart}
        onDragEnd={handleDndDragEnd}
      >
        <div className='dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out w-full h-full md:w-64 overflow-auto scrollbar-thin'>
          <div className='p-1 sm:p-2'>
            <div className='flex items-center justify-between mb-2 border-b border-gray-200 dark:border-gray-700 pb-2'>
              <h2 className='text-base sm:text-lg font-semibold text-gray-900 dark:text-white'>
                Collections
              </h2>
              <div className='flex items-center space-x-1'>

                <TooltipContainer text='Create collection'>
                  <button
                    onClick={handleCreateCollection}
                    className='hidden md:flex border border-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800'
                  >
                    <FolderPlus className='text-[#136fb0]' size={23} />
                  </button>
                </TooltipContainer>
                <TooltipContainer text='Import collection'>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className='hidden md:flex border border-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800'
                    aria-label='Import collection'
                  >
                    <Import className='text-[#136fb0]' size={23} />
                  </button>
                </TooltipContainer>

                <TooltipContainer text='Create collection'>
                  <button
                    onClick={handleCreateCollection}
                    className='flex md:hidden border border-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800'
                  >
                    <FolderPlus className='text-[#136fb0]' size={18} />
                  </button>
                </TooltipContainer>
                <TooltipContainer text='Import collection'>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className='flex md:hidden border border-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800'
                  >
                    <Import className='text-[#136fb0]' size={18} />
                  </button>
                </TooltipContainer>
                <TooltipContainer text='Create collection'>
                  <button
                    onClick={toggleSidebar}
                    className='flex md:hidden border border-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800'
                  >
                    <X className='text-[#136fb0]' size={20} />
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
                <SortableContext
                  items={filteredCollections.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredCollections.map((collection) => {
                    const expanded = isCollectionExpanded(collection.id);

                    const collectionSortableIds = [
                      ...collection.requests
                        .filter((r: any) => !r.folderId)
                        .map((r) => r.id || `temp-${r.name}`),
                      ...((collection as any).folders || []).map(
                        (f: any) => f.id,
                      ),
                    ];

                    return (
                      <SortableCollection
                        key={collection.id}
                        collection={collection}
                      >
                        <div className='group'>
                          <div className='rounded-md'>
                            <div
                              className='flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group'
                              onDoubleClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onClick={async () => {
                                if (isSearching) return;

                                setActiveCollection(collection);

                                const isExpanding = !expandedCollections.has(
                                  collection.id,
                                );

                                await toggleExpandedCollection(collection.id);
                                if (
                                  isExpanding &&
                                  !collection.hasFetchedRequests
                                ) {
                                  await handleCollectionExpand(collection.id);
                                }
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

                              <div className='flex items-center space-x-1 relative'>
                                {collection.preRequestId && (
                                  <TooltipContainer text='Auto Auth'>
                                    <div className='p-1'>
                                      <Key className='h-4 w-4 text-blue-600' />
                                    </div>
                                  </TooltipContainer>
                                )}
                                <div className='opacity-0 group-hover:opacity-100 transition-opacity'>
                                  <TooltipContainer text='Collection Actions'>
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
                                  </TooltipContainer>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div
                            className={`ml-4 sm:ml-6 overflow-hidden ${expanded
                              ? isSearching
                                ? 'max-h-none'
                                : 'max-h-[1000px]'
                              : 'max-h-0'
                              }`}
                          >
                            {expanded && (
                              <div className='overflow-y-auto scrollbar-thin max-h-[600px]'>
                                <SortableContext
                                  items={collectionSortableIds}
                                  strategy={verticalListSortingStrategy}
                                >
                                  {collection.requests
                                    .filter((r: any) => !r.folderId)
                                    .map((request, index) => (
                                      <SortableRequest
                                        key={request.id || `root-${index}`}
                                        request={request}
                                        depth={0}
                                        collectionId={collection.id}
                                      >
                                        <div
                                          className={`flex items-center justify-between p-[6px] rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${activeRequest?.id === request.id
                                            ? 'bg-blue-50 dark:bg-blue-900/20'
                                            : ''
                                            } ${isAuthRequest(
                                              request.id,
                                              collection.id,
                                            )
                                              ? 'border-2 border-blue-500 rounded-lg'
                                              : ''
                                            }`}
                                        >
                                          <div
                                            className='flex items-center space-x-2 flex-1 min-w-0'
                                            onClick={() =>
                                              selectRequest(request, collection)
                                            }
                                          >
                                            {isAuthRequest(
                                              request.id,
                                              collection.id,
                                            ) && (
                                                <TooltipProvider>
                                                  <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      <Key className='h-3 w-3 text-blue-600 flex-shrink-0' />
                                                    </TooltipTrigger>
                                                    <TooltipContent side='top'>
                                                      Auto Auth
                                                    </TooltipContent>
                                                  </Tooltip>
                                                </TooltipProvider>
                                              )}
                                            <span
                                              className={`text-xs font-medium ${getMethodColor(
                                                request.method,
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
                                            <TooltipContainer text='Request Actions'>
                                              <button
                                                draggable={false}
                                                onMouseDown={(e) =>
                                                  e.stopPropagation()
                                                }
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
                                                  setSelectedCollection(
                                                    collection,
                                                  );
                                                  setRequestId(
                                                    request.id || '',
                                                  );
                                                  setShowMenu(
                                                    `request-${request.id}`,
                                                  );
                                                }}
                                                className='p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700'
                                              >
                                                <MoreVertical className='h-3 w-3' />
                                              </button>
                                            </TooltipContainer>
                                          </div>
                                        </div>
                                      </SortableRequest>
                                    ))}

                                  {(collection as any).folders?.map(
                                    (folder: any) => (
                                      <FolderNodeView
                                        key={folder.id}
                                        folder={folder}
                                        parentCollection={collection}
                                        onClickRequest={(req, parentCol) =>
                                          selectRequest(req, parentCol)
                                        }
                                      />
                                    ),
                                  )}
                                </SortableContext>
                              </div>
                            )}
                          </div>
                        </div>
                      </SortableCollection>
                    );
                  })}
                </SortableContext>
              ) : (
                <div className='text-center py-1 px-2'>
                  <p className='text-gray-500 mb-3 text-sm'>
                    No collections yet
                  </p>
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
                    <label className='block text-sm font-medium mb-1'>
                      Name
                    </label>
                    <input
                      type='text'
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className='w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800'
                      placeholder='Request name'
                    />
                  </div>
                </div>

                <div className='flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700'>
                  <button
                    onClick={() => setShowRequestRenameModal(false)}
                    className='px-4 py-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveRenamedRequest}
                    disabled={!renameValue.trim()}
                    className='px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2'
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
                      className='flex items-center w-full px-4 py-1 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50'
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
                      className='flex items-center w-full px-4 py-1 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700'
                    >
                      <Plus className='h-4 w-4 mr-2' />
                      Add Request
                    </button>

                    <div className='border-t border-gray-200 dark:border-gray-700 my-1'></div>

                    <button
                      onClick={async () => {
                        if (selectedCollection) {
                          await handleCollectionExpand(selectedCollection.id);

                          collectionActions.openSanitizeTestRunner(
                            selectedCollection.id,
                          );
                        }
                        setShowMenu(null);
                        setMenuPosition(null);
                      }}
                      className='flex items-center w-full px-4 py-1 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700'
                    >
                      <Zap className='h-4 w-4 mr-2' />
                      Quick Test
                    </button>
                    <div className='border-t border-gray-200 dark:border-gray-700 my-1'></div>

                    <button
                      onClick={() => {
                        if (selectedCollection)
                          handleRenameCollection(selectedCollection);
                        setShowMenu(null);
                        setMenuPosition(null);
                      }}
                      className='flex items-center w-full px-4 py-1 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700'
                    >
                      <Edit className='h-4 w-4 mr-2' />
                      Rename
                    </button>

                    <button
                      onClick={() => {
                        setShowDeleteCollectionDialog(true);
                        setShowMenu(null);
                        setMenuPosition(null);
                      }}
                      className='flex items-center w-full px-4 py-1 text-sm text-left text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700'
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
                      className='flex items-center w-full px-4 py-1 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700'
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
                      className='flex items-center w-full px-4 py-1 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700'
                    >
                      <CopyPlus className='h-4 w-4 mr-2' />
                      Duplicate
                    </button>
                    <div className='border-t border-gray-200 dark:border-gray-700 my-1'></div>
                    {selectedRequest.method === 'POST' && (
                      <>
                        {getAutoAuthState(selectedRequest) === 'is-auth' ? (
                          <button
                            onClick={() => {
                              setShowMarkAuthDialog(true);
                              setShowMenu(null);
                              setMenuPosition(null);
                            }}
                            className='flex items-center w-full px-4 py-1 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700'
                          >
                            <Key className='h-4 w-4 mr-2' />
                            Remove Auto Auth
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setShowMarkAuthDialog(true);
                              setShowMenu(null);
                              setMenuPosition(null);
                            }}
                            className='flex items-center w-full px-4 py-1 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700'
                          >
                            <div className='flex items-center text-blue-600 dark:text-blue-400'>
                              <Key className='h-4 w-4 mr-2' />
                              Set Auto Auth
                            </div>

                            <span className='ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'>
                              Setup
                            </span>
                          </button>
                        )}
                        <div className='border-t border-gray-200 dark:border-gray-700 my-1'></div>
                      </>
                    )}
                    <button
                      onClick={() => handleOpenSecurityScan(selectedRequest)}
                      className='flex items-center w-full px-4 py-1 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700'
                    >
                      <Shield className='h-4 w-4 mr-2' />
                      <span>
                        Security Scan{' '}
                        <span className='text-xs italic text-gray-500'>
                          (Beta)
                        </span>
                      </span>
                    </button>

                    <button
                      onClick={() =>
                        handleOpenPerformanceScanning(selectedRequest)
                      }
                      className='flex items-center w-full px-4 py-1 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700'
                    >
                      <Zap className='h-4 w-4 mr-2' />
                      <span>
                        Performance Analysis {''}
                        <span className='text-xs italic text-gray-500'>
                          (Beta)
                        </span>
                      </span>
                    </button>

                    <button
                      onClick={() =>
                        handleOpenPerformanceTesting(selectedRequest)
                      }
                      className='flex items-center w-full px-4 py-1 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700'
                    >
                      <Rocket className='h-4 w-4 mr-2' />
                      <span>
                        Rate limit Test {''}
                        <span className='text-xs italic text-gray-500'>
                          (Beta)
                        </span>
                      </span>
                    </button>

                    <div className='border-t border-gray-200 dark:border-gray-700 my-1'></div>
                    <button
                      onClick={() => {
                        // Check if this is an auth request
                        if (
                          selectedRequest &&
                          selectedCollection &&
                          isAuthRequest(
                            selectedRequest.id,
                            selectedCollection.id,
                          )
                        ) {
                          setShowDeleteAuthRequestDialog(true);
                        } else {
                          setShowDeleteRequestDialog(true);
                        }
                        setShowMenu(null);
                        setMenuPosition(null);
                      }}
                      className='flex items-center w-full px-4 py-1 text-sm text-left text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700'
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
                        className='flex items-center w-full px-4 py-1 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700'
                      >
                        <FolderPlus className='h-4 w-4 mr-2' />
                        Add Folder
                      </button>

                      <button
                        onClick={() => {
                          handleCreateRequest(
                            selectedCollection,
                            selectedFolder.id,
                          );
                          setShowMenu(null);
                          setMenuPosition(null);
                        }}
                        className='flex items-center w-full px-4 py-1 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700'
                      >
                        <Plus className='h-4 w-4 mr-2' />
                        Add Request
                      </button>
                      <div className='border-t border-gray-200 dark:border-gray-700 my-1'></div>

                      <button
                        onClick={() => {
                          setShowMenu(null);
                          setMenuPosition(null);
                          setShowRenameFolderModal(true);
                        }}
                        className='flex items-center w-full px-4 py-1 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700'
                      >
                        <Edit className='h-4 w-4 mr-2' />
                        Rename Folder
                      </button>
                      {/* <button
                        onClick={handleOpenMoveFolderModal}
                        className='flex items-center w-full px-4 py-1 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700'
                      >
                        <Move className='h-4 w-4 mr-2' />
                        Move to
                      </button> */}
                      <button
                        onClick={() => {
                          setShowMenu(null);
                          setMenuPosition(null);
                          setShowDeleteFolderModal(true);
                        }}
                        className='flex items-center w-full px-4 py-1 text-sm text-left text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                      >
                        <Trash2 className='h-4 w-4 mr-2' />
                        Delete Folder
                      </button>
                    </div>
                  )}
              </div>,
              document.body,
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
                await fetchCollectionRequests.mutateAsync(
                  selectedCollection.id,
                );
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
                await fetchCollectionRequests.mutateAsync(
                  selectedCollection.id,
                );
                toast({
                  title: 'Folder renamed',
                  description: `Folder is now "${name}"`,
                  variant: 'success',
                });
              } catch (err) {
                console.error('renameFolder error:', err);
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
                await fetchCollectionRequests.mutateAsync(
                  selectedCollection.id,
                );
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
          <MoveToModal
            isOpen={showMoveModal}
            onClose={() => setShowMoveModal(false)}
            onMove={handleMoveRequest}
            collections={collections}
            currentCollectionId={selectedCollection?.id || ''}
            currentFolderId={selectedFolder?.id}
            itemType={moveItemType}
            itemName={moveItemName}
          />

          <AlertDialog
            open={showDeleteCollectionDialog}
            onOpenChange={setShowDeleteCollectionDialog}
          >
            <AlertDialogTrigger asChild></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete "{selectedCollection?.name}"?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action will permanently delete the collection and all its
                  requests. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button
                  variant='destructive'
                  onClick={() => handleDeleteCollection()}
                >
                  Delete Collection
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog
            open={showDeleteCollectionDialog}
            onOpenChange={setShowDeleteCollectionDialog}
          >
            <AlertDialogTrigger asChild></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete "{selectedCollection?.name}"?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action will permanently delete the collection and all its
                  requests. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button onClick={() => handleDeleteCollection()}>
                  Delete Collection
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog
            open={showDeleteRequestDialog}
            onOpenChange={setShowDeleteRequestDialog}
          >
            <AlertDialogTrigger asChild></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete "{selectedRequest?.name}"?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action will permanently delete this request. This cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button
                  onClick={async () => {
                    if (selectedRequest?.id) {
                      await handleDeleteRequest(selectedRequest.id);
                    } else {
                      handleDeleteNewRequest();
                    }
                    setShowDeleteRequestDialog(false);
                  }}
                >
                  Delete Request
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog
            open={showDeleteAuthRequestDialog}
            onOpenChange={setShowDeleteAuthRequestDialog}
          >
            <AlertDialogTrigger asChild></AlertDialogTrigger>
            <AlertDialogContent className='border-2 border-red-500'>
              <AlertDialogHeader>
                <AlertDialogTitle className='flex items-center gap-2 text-red-600'>
                  <Key className='h-5 w-5' />
                  Delete Auto-Auth Request "{selectedRequest?.name}"?
                </AlertDialogTitle>
                <AlertDialogDescription className='space-y-3'>
                  <div className='p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md'>
                    <p className='text-sm text-red-800 dark:text-red-200 font-medium'>
                      ⚠️ Warning: This request handles Auto-Auth for{' '}
                      <span className='font-bold'>
                        {selectedCollection?.name}
                      </span>
                      .
                    </p>
                    <p className='text-sm text-red-700 dark:text-red-300 mt-2'>
                      If you remove it, you'll need to enter tokens manually for
                      each request in this collection.
                    </p>
                  </div>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    This action cannot be undone.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button
                  variant='destructive'
                  onClick={async () => {
                    if (selectedRequest?.id) {
                      await handleDeleteRequest(selectedRequest.id);
                    } else {
                      handleDeleteNewRequest();
                    }
                    setShowDeleteAuthRequestDialog(false);
                  }}
                >
                  <Trash2 className='h-4 w-4 mr-2' />
                  Yes, Delete Auto-Auth Request
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <AlertDialog
          open={showMarkAuthDialog}
          onOpenChange={setShowMarkAuthDialog}
        >
          <AlertDialogContent className='max-w-3xl bg-[#0d1117] border border-gray-700 text-white max-h-[90vh] overflow-y-auto scrollbar-thin'>
            <AlertDialogHeader>
              <AlertDialogTitle className='text-cyan-400 text-xl'>
                <Key className='h-5 w-5 inline-block mr-2' />
                Set "{selectedRequest?.name}" as Auto Auth?
              </AlertDialogTitle>
              <AlertDialogDescription className='text-gray-400'>
                The token extracted from this API will be used for all requests
                in this collection.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
              <div className='border border-red-500/30 bg-red-500/10 rounded-xl p-4'>
                <h3 className='text-sm font-semibold text-red-400 mb-3'>
                  ● WITHOUT AUTO AUTH
                </h3>
                <ul className='space-y-2 text-sm text-gray-400'>
                  <li>1️⃣ Run login API</li>
                  <li>2️⃣ Copy token from response</li>
                  <li>3️⃣ Paste into each request header</li>
                  <li>4️⃣ Repeat every time token expires</li>
                </ul>
              </div>

              <div className='border border-emerald-500/30 bg-emerald-500/10 rounded-xl p-4'>
                <h3 className='text-sm font-semibold text-emerald-400 mb-3'>
                  ● WITH AUTO AUTH
                </h3>
                <ul className='space-y-2 text-sm text-gray-400'>
                  <li>✔ Run any API in the collection</li>
                  <li>✔ Token is fetched & injected automatically</li>
                </ul>
                <div className='mt-3 text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full w-fit border border-emerald-500/30'>
                  Saves minutes every session
                </div>
              </div>
            </div>

            {selectedRequest &&
              getAutoAuthState(selectedRequest) !== 'is-auth' && (
                <div className='mt-6'>
                  <h4 className='text-sm font-semibold mb-4 text-cyan-400'>
                    HOW TO ENABLE IT — 3 STEPS
                  </h4>

                  <div className='space-y-3 text-sm'>
                    <div className='border border-gray-700 bg-gray-800/50 rounded-lg p-3'>
                      <p className='font-medium text-white'>
                        Step 1: Find your Login Request
                      </p>
                      <p className='text-gray-400 text-xs mt-1'>
                        Open the API request that handles login and returns a
                        token.
                      </p>
                    </div>

                    <div className='border border-gray-700 bg-gray-800/50 rounded-lg p-3'>
                      <p className='font-medium text-white'>
                        Step 2: Set a Token Extraction
                      </p>
                      <p className='text-gray-400 text-xs mt-1'>
                        Extract the token from response body and store it as a
                        variable.
                      </p>
                    </div>

                    <div className='border border-gray-700 bg-gray-800/50 rounded-lg p-3'>
                      <p className='font-medium text-white'>
                        Step 3: Enable Auto Auth
                      </p>
                      <p className='text-gray-400 text-xs mt-1'>
                        Mark this request as Auto Auth to apply token
                        automatically.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            <AlertDialogFooter className='mt-6'>
              <AlertDialogCancel className='bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'>
                Cancel
              </AlertDialogCancel>

              {/* Condition 1: No extraction set */}
              {selectedRequest &&
                getAutoAuthState(selectedRequest) === 'no-extraction' && (
                  <Button
                    className='bg-cyan-500 hover:bg-cyan-400 text-black font-semibold'
                    onClick={() => {
                      if (selectedRequest && selectedCollection) {
                        selectRequest(selectedRequest, selectedCollection);
                      }
                      setShowMarkAuthDialog(false);
                    }}
                  >
                    <Key className='h-4 w-4 mr-2' />
                    Extract Token
                  </Button>
                )}

              {/* Condition 2: Extraction set, not yet auth */}
              {selectedRequest &&
                getAutoAuthState(selectedRequest) === 'has-extraction' && (
                  <Button
                    className='bg-cyan-500 hover:bg-cyan-400 text-black font-semibold'
                    onClick={() =>
                      selectedRequest && handleMarkAuth(selectedRequest)
                    }
                  >
                    <Key className='h-4 w-4 mr-2' />
                    Enable Auto Auth
                  </Button>
                )}

              {/* Condition 3: Already the auth request */}
              {selectedRequest &&
                getAutoAuthState(selectedRequest) === 'is-auth' && (
                  <Button
                    variant='destructive'
                    className='bg-red-600 hover:bg-red-500'
                    onClick={handleRemoveAuth}
                  >
                    <Trash2 className='h-4 w-4 mr-2' />
                    Remove Auto Auth
                  </Button>
                )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <DragOverlay>
          {activeDragItem ? (
            <div className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 shadow-lg opacity-90'>
              {activeDragItem?.type === 'request' ? (
                <div className='flex items-center space-x-2'>
                  <span
                    className={`text-xs font-medium ${getMethodColor(
                      activeDragItem?.request?.method,
                    )}`}
                  >
                    {activeDragItem?.request?.method}
                  </span>
                  <span className='text-sm'>
                    {activeDragItem?.request?.name}
                  </span>
                </div>
              ) : (
                <div className='flex items-center space-x-2'>
                  <Folder className='h-4 w-4 text-orange-500' />
                  <span className='text-sm'>
                    {activeDragItem?.folder?.name}
                  </span>
                </div>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </TooltipProvider>
  );
};

export default Sidebar;
