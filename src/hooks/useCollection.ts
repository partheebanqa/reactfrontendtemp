'use client';

import { useEffect, useState } from 'react';
import { collectionActions, useCollectionStore } from '@/store/collectionStore';
import { useWorkspace } from './useWorkspace';
import type { Collection, CollectionRequest } from '@/shared/types/collection';
import { useRequest } from './useRequest';
import {
  useCollectionQuery,
  useAddCollectionMutation,
  useRenameCollectionMutation,
  useSetFavouriteCollectionMutation,
  useUnsetFavouriteCollectionMutation,
  useCollectionRequestsQuery,
  useDeleteCollectionMutation,
  useImpotPostmanCollectionMutation,
  useAddRequestMutation,
  useUpdateRequestMutation,
  useRenameRequestMutation,
  useDeleteRequestMutation,
  useDuplicateRequestMutation,
  useMarkAuthRequestMutation,
} from '@/store/query/collectionQuery';

export function useCollection() {
  const { currentWorkspace } = useWorkspace();
  const [shouldFetchCollections, setShouldFetchCollections] = useState(true);
  const {
    activeCollection,
    collections,
    error,
    isLoading,
    activeRequest,
    responseLayout,
    isCreatingCollection,
    expandedCollections,
    openedRequests,
    unsavedChanges,
  } = useCollectionStore();
  const { setResponseData } = useRequest();

  // Setup queries and mutations
  const { refetch, isLoading: isRefetching } = useCollectionQuery(
    shouldFetchCollections,
  );

  const setActiveCollection = collectionActions.setActiveCollection;
  const setActiveRequest = collectionActions.setActiveRequest;
  const setResponseLayout = collectionActions.setResponseLayout;
  const setCollection = collectionActions.setCollections;
  const setIsCreatingCollection = collectionActions.setIsCreatingCollection;
  const deleteRequest = collectionActions.deleteRequest;
  const addRequestToCollection = collectionActions.addRequestToCollection;
  const openRequest = collectionActions.openRequest;
  const closeRequest = collectionActions.closeRequest;
  const markUnsaved = collectionActions.markUnsaved;
  const markSaved = collectionActions.markSaved;
  const replaceRequest = collectionActions.replaceRequest;

  const toggleExpandedCollection = async (collectionId: string) => {
    if (!collectionId) return;
    collectionActions.toggleExpandedCollection(collectionId);

    const targetCollection = collections?.find(
      (col) => col.id === collectionId,
    );
    if (targetCollection?.hasFetchedRequests) {
      return; // already loaded
    }

    await fetchCollectionRequests.mutateAsync(collectionId);
  };

  const handleOpenAllCollectionRequests = async (collection: Collection) => {
    if (!collection) return;

    // Ensure the collection is expanded and requests are fetched
    if (!expandedCollections.has(collection.id)) {
      await toggleExpandedCollection(collection.id);
    }

    // Ensure requests are loaded
    if (!collection.hasFetchedRequests) {
      await fetchCollectionRequests.mutateAsync(collection.id);
    }

    // Open all requests from the collection
    collectionActions.openAllCollectionRequests(collection.id);
  };

  const handleCreateRequest = async (
    collection?: Collection,
    folderId?: string,
  ) => {
    if (activeRequest && activeRequest.id) {
      collectionActions.updateOpenedRequest(activeRequest);
    }

    const generateUniqueRequestId = (): string => {
      return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };

    const newRequest: CollectionRequest = {
      id: generateUniqueRequestId(),
      name: 'New Request',
      method: 'GET',
      // bodyRawContent: '{}',
      url: '',
      bodyType: 'raw',
      bodyFormData: null,
      authorizationType: 'none',
      authorization: {},
      variables: {},
      headers: [],
      params: [],
      order: 0,
    };

    setResponseData(null);

    if (collection) {
      // Ensure the collection is expanded when adding a new request
      if (!expandedCollections.has(collection.id)) {
        toggleExpandedCollection(collection.id);
      }

      // Attach collectionId and optionally folderId, compute order from target list
      newRequest.collectionId = collection.id;
      if (folderId) newRequest.folderId = folderId;

      // Helpers to work with folder tree
      const findFolderById = (
        folders: any[] | undefined,
        id: string,
      ): any | null => {
        if (!folders) return null;
        for (const f of folders) {
          if (f.id === id) return f;
          const child = findFolderById(f.folders, id);
          if (child) return child;
        }
        return null;
      };

      const insertIntoFolders = (
        folders: any[] | undefined,
        id: string,
        req: CollectionRequest,
      ): any[] | undefined => {
        if (!folders) return folders;
        return folders.map((f) => {
          if (f.id === id) {
            return {
              ...f,
              requests: [...(f.requests || []), req],
            };
          }
          return {
            ...f,
            folders: insertIntoFolders(f.folders, id, req),
          };
        });
      };

      setCollection(
        collections.map((col) => {
          if (col.id !== collection.id) return col;

          // Add to folder if folderId provided; else add to root requests
          if (folderId) {
            const targetFolder = findFolderById((col as any).folders, folderId);
            const nextOrder = ((targetFolder?.requests || []).length || 0) + 1;
            newRequest.order = nextOrder;
            return {
              ...col,
              folders: insertIntoFolders(
                (col as any).folders,
                folderId,
                newRequest,
              ),
            } as any;
          } else {
            const nextOrder =
              ((col.requests || []).filter((r: any) => !r.folderId).length ||
                0) + 1;
            newRequest.order = nextOrder;
            return {
              ...col,
              requests: [...(col.requests || []), newRequest],
            };
          }
        }),
      );

      setActiveCollection(
        collections.find((col) => col.id === collection.id) || null,
      );
    }

    setActiveRequest(newRequest);
    openRequest(newRequest);
  };

  useEffect(() => {
    if (collections.length === 0) {
      setShouldFetchCollections(true);
    } else {
      setShouldFetchCollections(false);
    }
  }, [collections.length]);

  const addCollectionMutation = useAddCollectionMutation();
  const renameCollectionMutation = useRenameCollectionMutation();
  const setFavouriteCollectionMutation = useSetFavouriteCollectionMutation();
  const unsetFavouriteCollectionMutation =
    useUnsetFavouriteCollectionMutation();
  const fetchCollectionRequests = useCollectionRequestsQuery();
  const deleteCollectionMutation = useDeleteCollectionMutation();
  const importCollectionMutation = useImpotPostmanCollectionMutation();
  const addRequestMutation = useAddRequestMutation();
  const updateRequestMutation = useUpdateRequestMutation();

  const renameRequestMutation = useRenameRequestMutation();
  const deleteRequestMutation = useDeleteRequestMutation();
  const duplicateRequestMutation = useDuplicateRequestMutation();
  const markAuthRequestMutation = useMarkAuthRequestMutation();

  return {
    activeCollection,
    collections,
    error,
    isLoading,
    activeRequest,
    responseLayout,
    isCreatingCollection,
    expandedCollections,
    openedRequests,
    unsavedChanges,

    handleCreateRequest,
    handleOpenAllCollectionRequests,
    setActiveCollection,
    setActiveRequest,
    setResponseLayout,
    setCollection,
    setIsCreatingCollection,
    toggleExpandedCollection,
    deleteRequest,
    addRequestToCollection,
    openRequest,
    closeRequest,
    markUnsaved,
    markSaved,
    replaceRequest,
    refetch,

    fetchCollectionRequests,
    renameCollectionMutation,
    addCollectionMutation,
    importCollectionMutation,
    addRequestMutation,
    updateRequestMutation,
    renameRequestMutation,
    duplicateRequestMutation,
    markAuthRequestMutation,
    setFavouriteCollectionMutation,
    unsetFavouriteCollectionMutation,
    deleteCollectionMutation,
    deleteRequestMutation,
  };
}
