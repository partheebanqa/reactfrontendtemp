import { useEffect, useState } from "react";
import {
  useAddCollectionMutation,
  useAddRequestMutation,
  useCollectionQuery,
  useCollectionRequestsQuery,
  useDeleteRequestMutation,
  useDuplicateRequestMutation,
  useImpotPostmanCollectionMutation,
  useRenameCollectionMutation,
  useRenameRequestMutation,
  useSetFavouriteCollectionMutation,
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
    collectionActions.toggleExpandedCollection(collectionId);
    const targetCollection = collections?.find(
      (col) => col.id === collectionId
    );
    if (targetCollection?.hasFetchedRequests) {
      return;
    }
    fetchCollectionRequests.mutateAsync(collectionId);
  };

  useEffect(() => {
    if (collections.length === 0) {
      setShouldFetchCollections(true);
    } else {
      setShouldFetchCollections(false);
    }
  }, [isAuthenticated, collections]);

  const addCollectionMutation = useAddCollectionMutation();
  const renameCollectionMutation = useRenameCollectionMutation();
  const setFavouriteCollectionMutation = useSetFavouriteCollectionMutation();
  const fetchCollectionRequests = useCollectionRequestsQuery();
  const deleteCollectionMutation = useDeleteRequestMutation();
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
  };
}
