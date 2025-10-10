import { useMutation, useQuery } from '@tanstack/react-query';
import { collectionActions, collectionStore } from '../collectionStore';
import {
  addCollection,
  addRequest,
  deleteCollection,
  deleteRequest,
  duplicateRequest,
  fetchCollectionList,
  getCollectionRequests,
  importCollectionFile,
  renameCollection,
  renameRequest,
  setFavouriteCollection,
  unsetFavouriteCollection,
} from '@/services/collection.service';
import { workspaceStore } from '../workspaceStore';
import {
  Collection,
  CollectionRequest,
  CreateCollection,
} from '@/shared/types/collection';
import { queryClient } from '@/lib/queryClient';

// Query to fetch collection data with current workspace context
export const useCollectionQuery = (enabled = true) => {
  const currentWorkspace = workspaceStore.state.currentWorkspace;
  return useQuery({
    queryKey: ['/collections', currentWorkspace?.id],
    enabled: enabled && !!currentWorkspace?.id, // Only enable if we have a workspace
    queryFn: async () => {
      if (!currentWorkspace?.id) {
        throw new Error('No active workspace selected');
      }
      try {
        collectionActions.setIsLoading(true);
        const data = await fetchCollectionList(currentWorkspace?.id as string);
        if (data) {
          collectionActions.setCollections(data);
        } else {
          collectionActions.setCollections([]);
        }

        collectionActions.setIsLoading(false);
        return data;
      } catch (error) {
        console.error('Collection fetch error:', error);
        collectionActions.setIsLoading(false);
        collectionActions.setError(
          error instanceof Error ? error.message : 'Failed to fetch collections'
        );
        return null;
      }
    },
    refetchInterval: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
  });
};

export const useAddCollectionMutation = () => {
  const collectionQuery = useCollectionQuery();
  return useMutation({
    mutationFn: addCollection,
    onSuccess: async (response) => {
      collectionQuery.refetch();
      return response;
    },
    onError: (error) => {
      console.error('Error adding collection:', error);
      throw error;
    },
  });
};

export const useRenameCollectionMutation = () => {
  return useMutation({
    mutationFn: renameCollection,
    onSuccess: (data, variables) => {
      console.log('🚀 ~ useRenameCollectionMutation ~ data:', data);
      collectionActions.renameCollection(variables.id, variables.name);
    },
  });
};

export const useSetFavouriteCollectionMutation = () => {
  return useMutation({
    mutationFn: setFavouriteCollection,
    onSuccess: async (data, variables) => {
      collectionActions.setFavouriteCollection(
        variables.collectionId,
        variables.IsImportant
      );

      await queryClient.invalidateQueries({
        queryKey: ['/collections'],
        exact: false,
      });

      return data;
    },
    onError: (error) => {
      console.error('Error setting favourite collection:', error);
      throw error;
    },
  });
};

export const useUnsetFavouriteCollectionMutation = () => {
  return useMutation({
    mutationFn: unsetFavouriteCollection,
    onSuccess: async (data, id) => {
      collectionActions.setUnFavouriteCollection(id);

      await queryClient.invalidateQueries({
        queryKey: ['/collections'],
        exact: false,
      });

      return data;
    },
    onError: (error) => {
      console.error('Error unsetting favourite collection:', error);
      throw error;
    },
  });
};

export const useCollectionRequestsQuery = () => {
  return useMutation({
    mutationFn: getCollectionRequests,
    onSuccess: (requests, collectionId) => {
      const updatedCollection = collectionStore.state.collections.map(
        (collection) => {
          if (collection.id === collectionId) {
            const unsavedRequests = collection.requests.filter(
              (req) => !req.id
            );
            if (unsavedRequests.length > 0) {
              const collectionRequest: CollectionRequest = collectionStore.state
                .activeRequest as CollectionRequest;
              collectionActions.setActiveRequest({
                ...collectionRequest,
                order: collection.requests.length,
              });
            }
            return {
              ...collection,
              requests: [
                ...requests,
                ...unsavedRequests.map((req) => ({
                  ...req,
                  order: requests.length + 1,
                })),
              ],
              hasFetchedRequests: true,
            };
          }
          return collection;
        }
      );
      collectionActions.setCollections(updatedCollection);
      return requests;
    },
  });
};

export const useImpotPostmanCollectionMutation = () => {
  const collectionQuery = useCollectionQuery();
  return useMutation({
    mutationFn: importCollectionFile,
    onSuccess: async (response) => {
      collectionQuery.refetch();
      return response;
    },
    onError: (error) => {
      console.error('Error importing collection:', error);
      throw error;
    },
  });
};

export const useImpotCollectionJsonMutation = () => {
  const collectionQuery = useCollectionQuery();
  return useMutation({
    mutationFn: importCollectionJson,
    onSuccess: async (response) => {
      collectionQuery.refetch();
      return response;
    },
    onError: (error) => {
      console.error('Error importing collection:', error);
      throw error;
    },
  });
};

export const useAddRequestMutation = () => {
  const fetchCollectionRequests = useCollectionRequestsQuery();
  return useMutation({
    mutationFn: addRequest,
    onSuccess: async (data, variables) => {
      fetchCollectionRequests.mutateAsync(variables.collectionId);
      return data;
    },
    onError: (error) => {
      console.error('Error adding request:', error);
      throw error;
    },
  });
};

export const useRenameRequestMutation = () => {
  return useMutation({
    mutationFn: renameRequest,
    onSuccess: (data, variables) => {
      collectionActions.renameRequest(
        variables?.newName || '',
        variables.requestId,
        variables.workspaceId || ''
      );
    },
    onError: (error) => {
      throw error;
    },
  });
};

export const useDeleteCollectionMutation = () => {
  return useMutation({
    mutationFn: deleteCollection,
    onSuccess: (data, variables) => {
      console.log('🚀 ~ useDeleteCollectionMutation ~ variables:', variables);
      collectionActions.deleteCollection(variables);
    },
    onError: (error) => {
      console.error('Error deleting collection:', error);
      throw error;
    },
  });
};

export const useDeleteRequestMutation = () => {
  return useMutation({
    mutationFn: deleteRequest,
    onSuccess: (data, variables) => {
      collectionActions.deleteRequest(variables);
    },
    onError: (error) => {
      console.error('Error deleting request:', error);
      throw error;
    },
  });
};

export const useDuplicateRequestMutation = () => {
  const fetchCollectionRequests = useCollectionRequestsQuery();
  return useMutation({
    mutationFn: duplicateRequest,
    onSuccess: (data, variables) => {
      return data;
    },
    onError: (error) => {
      console.error('Error duplicating request:', error);
      throw error;
    },
  });
};
