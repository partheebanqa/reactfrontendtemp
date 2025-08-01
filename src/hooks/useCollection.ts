import { useEffect, useState } from "react";
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
  useUploadRequestSchemaMutation,
} from "@/store/query/collectionQuery";
import { collectionActions, useCollectionStore } from "@/store/collectionStore";
import { useAuth } from "./useAuth";
import { useWorkspace } from "./useWorkspace";

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

  const toggleExpandedCollection = (collectionId: string) => {
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
    deleteCollectionMutation,
    deleteRequestMutation,
  };
}
