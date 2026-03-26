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
  markRequestAsAuth,
  renameCollection,
  renameRequest,
  setFavouriteCollection,
  unsetFavouriteCollection,
  updateRequest,
} from '@/services/collection.service';
import { workspaceStore } from '../workspaceStore';
import type { CollectionRequest } from '@/shared/types/collection';
import { queryClient } from '@/lib/queryClient';
import { storageManager } from '@/utils/storage-manager';

export const useCollectionQuery = (enabled = true) => {
  const currentWorkspace = workspaceStore.state.currentWorkspace;
  return useQuery({
    queryKey: ['/collections', currentWorkspace?.id],
    enabled: enabled && !!currentWorkspace?.id,
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
          error instanceof Error
            ? error.message
            : 'Failed to fetch collections',
        );
        return null;
      }
    },
    refetchInterval: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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
        variables.IsImportant,
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
  const flattenFolderTree = (folders: any[]): any[] => {
    const all: any[] = [];
    const walk = (nodes: any[]) => {
      for (const f of nodes) {
        if (Array.isArray(f.requests)) {
          all.push(...f.requests);
        }
        if (Array.isArray(f.folders) && f.folders.length) {
          walk(f.folders);
        }
      }
    };
    walk(folders);
    return all;
  };

  return useMutation({
    mutationFn: getCollectionRequests,
    onSuccess: async (payload, collectionId) => {
      const rootRequests = Array.isArray(payload?.requests)
        ? payload.requests
        : [];
      const fromFolders = Array.isArray(payload?.folders)
        ? flattenFolderTree(payload.folders)
        : [];

      const fetchedAll = [...rootRequests, ...fromFolders];

      const updatedCollection = collectionStore.state.collections.map(
        (collection) => {
          if (collection.id === collectionId) {
            const unsavedRequests = collection.requests.filter(
              (req) => !req.id,
            );

            if (unsavedRequests.length > 0) {
              const collectionRequest = collectionStore.state
                .activeRequest as CollectionRequest;
              collectionActions.setActiveRequest({
                ...collectionRequest,
                order: fetchedAll.length,
              });
            }

            const mergedRequests = [
              ...fetchedAll,
              ...unsavedRequests.map((req, idx) => ({
                ...req,
                order: fetchedAll.length + idx + 1,
              })),
            ];

            return {
              ...collection,
              requests: mergedRequests,
              folders: payload?.folders || [],
              hasFetchedRequests: true,
            };
          }
          return collection;
        },
      );

      collectionActions.setCollections(updatedCollection);

      const currentActive = collectionStore.state.activeRequest;

      const unsavedIds = collectionStore.state.unsavedChanges;

      const updatedOpenedRequests = await Promise.all(
        collectionStore.state.openedRequests.map(async (openedReq) => {
          const fresh = fetchedAll.find((f) => f.id === openedReq.id);
          if (!fresh) return openedReq;

          const isUnsaved = !!openedReq.id && unsavedIds.has(openedReq.id);
          let resolvedAssertions: any[];

          if (isUnsaved) {
            const idbAssertions = await storageManager.getAssertions(
              openedReq.id!,
            );
            resolvedAssertions = idbAssertions ?? openedReq.assertions ?? [];
          } else {
            resolvedAssertions = fresh.assertions ?? openedReq.assertions ?? [];
          }

          return {
            ...openedReq,
            assertions: resolvedAssertions,
            extractVariables: fresh.extractVariables?.length
              ? fresh.extractVariables
              : openedReq.extractVariables,
          };
        }),
      );

      // Resolve active request assertions BEFORE entering setState (can't await inside setState)
      const freshActive = fetchedAll.find((f) => f.id === currentActive?.id);
      let resolvedActiveAssertions = currentActive?.assertions ?? [];

      if (freshActive && currentActive) {
        const isActiveUnsaved =
          !!currentActive.id && unsavedIds.has(currentActive.id);
        if (isActiveUnsaved) {
          const idbAssertions = await storageManager.getAssertions(
            currentActive.id!,
          );
          resolvedActiveAssertions =
            idbAssertions ?? currentActive.assertions ?? [];
        } else {
          resolvedActiveAssertions =
            freshActive.assertions ?? currentActive.assertions ?? [];
        }
      }

      collectionStore.setState((state) => {
        const updatedActive =
          freshActive && currentActive
            ? {
                ...currentActive,
                assertions: resolvedActiveAssertions, // pre-resolved above
                extractVariables: freshActive.extractVariables?.length
                  ? freshActive.extractVariables
                  : currentActive.extractVariables,
              }
            : currentActive;

        return {
          ...state,
          openedRequests: updatedOpenedRequests,
          activeRequest: updatedActive,
        };
      });

      // collectionStore.setState((state) => {
      //   const freshActive = fetchedAll.find((f) => f.id === currentActive?.id);
      //   const updatedActive =
      //     freshActive && currentActive
      //       ? {
      //           ...currentActive,
      //           assertions: freshActive.assertions ?? [], // backend always wins
      //           extractVariables: freshActive.extractVariables?.length
      //             ? freshActive.extractVariables
      //             : currentActive.extractVariables,
      //         }
      //       : currentActive;

      //   return {
      //     ...state,
      //     openedRequests: updatedOpenedRequests,
      //     activeRequest: updatedActive,
      //   };
      // });

      // Sync fresh backend assertions to IDB in the background
      // so page reload always gets the latest data
      Promise.allSettled(
        fetchedAll
          .filter(
            (req) =>
              req.id &&
              Array.isArray(req.assertions) &&
              req.assertions.length > 0 &&
              !unsavedIds.has(req.id),
          )
          .map((req) =>
            storageManager.saveAssertions(
              req.id,
              req.assertions,
              collectionId as string,
            ),
          ),
      ).catch(() => {});

      return fetchedAll;
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
  const fetchCollectionRequests = useCollectionRequestsQuery();

  return useMutation({
    mutationFn: renameRequest,
    onSuccess: async (data, variables) => {
      fetchCollectionRequests.mutateAsync(variables.collectionId);
      return data;
    },
    onError: (error) => {
      throw error;
    },
  });
};

export const useMarkAuthRequestMutation = () => {
  const fetchCollectionRequests = useCollectionRequestsQuery();

  return useMutation({
    mutationFn: async ({
      requestId,
      collectionId,
    }: {
      requestId: any;
      collectionId: string;
    }) => {
      return await markRequestAsAuth(requestId, collectionId);
    },
    onSuccess: async (data, variables) => {
      fetchCollectionRequests.mutateAsync(variables.collectionId);
      return data;
    },
    onError: (error) => {
      console.error('Error marking request as auth:', error);
      throw error;
    },
  });
};
export const useUpdateRequestMutation = () => {
  return useMutation({
    mutationFn: updateRequest,
    onSuccess: (data, variables) => {},
    onError: (error) => {
      throw error;
    },
  });
};

export const useDeleteCollectionMutation = () => {
  return useMutation({
    mutationFn: deleteCollection,
    onSuccess: (data, variables) => {
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
