'use client';

import { useEffect, useState } from 'react';
import {
  useAddCollectionMutation,
  useAddRequestMutation,
  useCollectionQuery,
  useCollectionRequestsQuery,
  useDeleteCollectionMutation,
  useDeleteRequestMutation,
  useDuplicateRequestMutation,
  useImpotPostmanCollectionMutation,
  useRenameCollectionMutation,
  useRenameRequestMutation,
  useSetFavouriteCollectionMutation,
  useUnsetFavouriteCollectionMutation,
} from '@/store/query/collectionQuery';
import { collectionActions, useCollectionStore } from '@/store/collectionStore';
import { useAuth } from './useAuth';
import { useWorkspace } from './useWorkspace';
import type { Collection, CollectionRequest } from '@/shared/types/collection';
import { useRequest } from './useRequest';

export function useCollection() {
  const { isAuthenticated } = useAuth();
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
  } = useCollectionStore();
  const { setResponseData } = useRequest();

  // Setup queries and mutations
  const { refetch, isLoading: isRefetching } = useCollectionQuery(
    shouldFetchCollections
  );

  const setActiveCollection = collectionActions.setActiveCollection;
  const setActiveRequest = collectionActions.setActiveRequest;
  const setResponseLayout = collectionActions.setResponseLayout;
  const setCollection = collectionActions.setCollections;
  const setIsCreatingCollection = collectionActions.setIsCreatingCollection;
  const deleteRequest = collectionActions.deleteRequest;
  const addRequestToCollection = collectionActions.addRequestToCollection;

  const toggleExpandedCollection = async (collectionId: string) => {
    if (!collectionId) return;
    collectionActions.toggleExpandedCollection(collectionId);

    const targetCollection = collections?.find(
      (col) => col.id === collectionId
    );
    if (targetCollection?.hasFetchedRequests) {
      return; // already loaded
    }

    // Just fetch; merging unsaved requests and setting folders is handled in useCollectionRequestsQuery.onSuccess
    await fetchCollectionRequests.mutateAsync(collectionId);
  };

  const handleCreateRequest = async (
    collection?: Collection,
    folderId?: string
  ) => {
    const newRequest: CollectionRequest = {
      name: 'New Request',
      method: 'GET',
      url: '',
      bodyType: 'json',
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
        id: string
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
        req: CollectionRequest
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
                newRequest
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
        })
      );

      setActiveCollection(
        collections.find((col) => col.id === collection.id) || null
      );
    }

    setActiveRequest(newRequest);
  };

  useEffect(() => {
    if (collections.length === 0) {
      setShouldFetchCollections(true);
    } else {
      setShouldFetchCollections(false);
    }
  }, [isAuthenticated, collections.length]);

  const addCollectionMutation = useAddCollectionMutation();
  const renameCollectionMutation = useRenameCollectionMutation();
  const setFavouriteCollectionMutation = useSetFavouriteCollectionMutation();
  const unsetFavouriteCollectionMutation =
    useUnsetFavouriteCollectionMutation();
  const fetchCollectionRequests = useCollectionRequestsQuery();
  const deleteCollectionMutation = useDeleteCollectionMutation();
  const importCollectionMutation = useImpotPostmanCollectionMutation();
  const addRequestMutation = useAddRequestMutation();
  const renameRequestMutation = useRenameRequestMutation();
  const deleteRequestMutation = useDeleteRequestMutation();
  const duplicateRequestMutation = useDuplicateRequestMutation();

  return {
    activeCollection,
    collections,
    error,
    isLoading,
    activeRequest,
    responseLayout,
    isCreatingCollection,
    expandedCollections,

    handleCreateRequest,
    setActiveCollection,
    setActiveRequest,
    setResponseLayout,
    setCollection,
    setIsCreatingCollection,
    toggleExpandedCollection,
    deleteRequest,
    addRequestToCollection,
    refetch,

    fetchCollectionRequests,
    renameCollectionMutation,
    addCollectionMutation,
    importCollectionMutation,
    addRequestMutation,
    renameRequestMutation,
    duplicateRequestMutation,
    setFavouriteCollectionMutation,
    unsetFavouriteCollectionMutation,
    deleteCollectionMutation,
    deleteRequestMutation,
  };
}
