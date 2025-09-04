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
import { Collection, CollectionRequest } from '@/shared/types/collection';
import { useRequest } from './useRequest';

/**
 * Hook for managing API requests
 * This replaces the RequestContext with a store-based approach
 */
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
      return;
    }

    // Store any local requests that haven't been saved to the server yet
    const unsavedRequests =
      targetCollection?.requests.filter((req) => !req.id) || [];

    // Fetch requests from server, then merge with unsaved local requests
    fetchCollectionRequests.mutateAsync(collectionId).then(() => {
      if (unsavedRequests.length > 0) {
        // After fetching, add back any unsaved requests
        const updatedCollections = collections.map((col) => {
          if (col.id === collectionId) {
            return {
              ...col,
              requests: [...col.requests, ...unsavedRequests],
            };
          }
          return col;
        });
        setCollection(updatedCollections);
      }
    });
  };

  const handleCreateRequest = async (collection?: Collection) => {
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
      order: 0, // This will be updated when adding to collection
    };
    setResponseData(null);
    if (collection) {
      // Ensure collection is expanded when adding a new request
      if (!expandedCollections.has(collection.id)) {
        toggleExpandedCollection(collection.id);
      }
      newRequest.collectionId = collection.id;
      newRequest.order = (collection.requests?.length || 0) + 1;
      setCollection(
        collections.map((col) =>
          col.id === collection.id
            ? {
                ...col,
                requests: [...(col.requests || []), newRequest],
              }
            : col
        )
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
