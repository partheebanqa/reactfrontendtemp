import { Store, useStore } from '@tanstack/react-store';
import type { Collection, CollectionRequest } from '@/shared/types/collection';

interface CollectionState {
  responseLayout: 'bottom' | 'right';
  activeRequest: CollectionRequest | null;
  activeCollection: Collection | null;
  collections: Collection[];
  isCreatingCollection: boolean;
  expandedCollections: Set<string>;
  isLoading: boolean;
  error: string | null;
  openedRequests: CollectionRequest[];
  unsavedChanges: Set<string>;
}

export const initialCollectionState: CollectionState = {
  responseLayout: 'bottom',
  activeCollection: null,
  activeRequest: null,
  collections: [],
  isCreatingCollection: false,
  expandedCollections: new Set(),
  isLoading: false,
  error: null,
  openedRequests: [],
  unsavedChanges: new Set(),
};

export const collectionStore = new Store<CollectionState>(
  initialCollectionState
);

export const collectionActions = {
  setResponseLayout: (layout: 'bottom' | 'right') => {
    collectionStore.setState((state) => ({
      ...state,
      responseLayout: layout,
    }));
  },

  setActiveCollection: (collection: Collection | null) => {
    collectionStore.setState((state) => ({
      ...state,
      activeCollection: collection,
    }));
  },

  setActiveRequest: (request: CollectionRequest) => {
    collectionStore.setState((state) => ({
      ...state,
      activeRequest: request,
    }));
  },

  openRequest: (request: CollectionRequest) => {
    collectionStore.setState((state) => {
      const isAlreadyOpen = state.openedRequests.some(
        (r) => r.id === request.id
      );
      return {
        ...state,
        openedRequests: isAlreadyOpen
          ? state.openedRequests
          : [...state.openedRequests, request],
        activeRequest: request,
      };
    });
  },

  closeRequest: (requestId: string) => {
    collectionStore.setState((state) => {
      const updatedOpened = state.openedRequests.filter(
        (r) => r.id !== requestId
      );
      const updatedUnsaved = new Set(state.unsavedChanges);
      updatedUnsaved.delete(requestId);

      let newActiveRequest = state.activeRequest;
      if (state.activeRequest?.id === requestId) {
        newActiveRequest = updatedOpened[updatedOpened.length - 1] || null;
      }

      return {
        ...state,
        openedRequests: updatedOpened,
        unsavedChanges: updatedUnsaved,
        activeRequest: newActiveRequest,
      };
    });
  },

  markUnsaved: (requestId: string) => {
    collectionStore.setState((state) => {
      const updatedUnsaved = new Set(state.unsavedChanges);
      updatedUnsaved.add(requestId);
      return {
        ...state,
        unsavedChanges: updatedUnsaved,
      };
    });
  },

  markSaved: (requestId: string) => {
    collectionStore.setState((state) => {
      const updatedUnsaved = new Set(state.unsavedChanges);
      updatedUnsaved.delete(requestId);
      return {
        ...state,
        unsavedChanges: updatedUnsaved,
      };
    });
  },

  setCollections: (collections: Collection[]) => {
    collectionStore.setState((state) => ({
      ...state,
      collections,
    }));
  },

  addCollection: (collection: Collection) => {
    collectionStore.setState((state) => ({
      ...state,
      collections: [...state.collections, collection],
    }));
  },

  deleteCollection: (collectionId: string) => {
    collectionStore.setState((state) => ({
      ...state,
      collections: state.collections.filter((c) => c.id !== collectionId),
      activeCollection:
        state.activeCollection?.id === collectionId
          ? null
          : state.activeCollection,
      activeRequest:
        state.activeRequest?.collectionId === collectionId
          ? null
          : state.activeRequest,
    }));
  },

  removeCollection: (collectionId: string) => {
    collectionStore.setState((state) => ({
      ...state,
      collections: state.collections.filter((c) => c.id !== collectionId),
    }));
  },

  updateCollection: (updatedCollection: Collection) => {
    collectionStore.setState((state) => ({
      ...state,
      collections: state.collections.map((c) =>
        c.id === updatedCollection.id ? updatedCollection : c
      ),
    }));
  },

  renameCollection: (id: string, name: string) => {
    collectionStore.setState((state) => ({
      ...state,
      collections: state.collections.map((c) =>
        c.id === id ? { ...c, name } : c
      ),
    }));
  },

  setFavouriteCollection: (id: string, IsImportant: boolean) => {
    collectionStore.setState((state) => ({
      ...state,
      collections: state.collections.map((c) =>
        c.id === id ? { ...c, IsImportant } : c
      ),
    }));
  },

  setUnFavouriteCollection: (id: string) => {
    collectionStore.setState((state) => ({
      ...state,
      collections: state.collections.map((c) =>
        c.id === id ? { ...c, isImportant: false } : c
      ),
    }));
  },

  setIsCreatingCollection: (isCreating: boolean) => {
    collectionStore.setState((state) => ({
      ...state,
      isCreatingCollection: isCreating,
    }));
  },

  setExpandedCollections: (collectionId: string, isExpanded: boolean) => {
    collectionStore.setState((state) => {
      const expandedCollections = new Set(state.expandedCollections);
      if (isExpanded) {
        expandedCollections.add(collectionId);
      } else {
        expandedCollections.delete(collectionId);
      }
      return {
        ...state,
        expandedCollections,
      };
    });
  },

  toggleExpandedCollection: (collectionId: string) => {
    collectionStore.setState((state) => {
      const expandedCollections = new Set(state.expandedCollections);
      if (expandedCollections.has(collectionId)) {
        expandedCollections.delete(collectionId);
      } else {
        expandedCollections.add(collectionId);
      }
      return {
        ...state,
        expandedCollections,
      };
    });
  },

  deleteRequest: (requestId: string) => {
    collectionStore.setState((state) => {
      const updatedCollections = state.collections.map((collection) => {
        if (collection.requests.some((req) => req.id === requestId)) {
          return {
            ...collection,
            requests: collection.requests.filter((req) => req.id !== requestId),
          };
        }
        return collection;
      });

      const newActiveRequest =
        state.activeRequest?.id === requestId ? null : state.activeRequest;

      return {
        ...state,
        collections: updatedCollections,
        activeRequest: newActiveRequest,
      };
    });
  },

  addRequestToCollection: (
    collectionId: string,
    request: CollectionRequest
  ) => {
    collectionStore.setState((state) => {
      const updatedCollections = state.collections.map((collection) => {
        if (collection.id === collectionId) {
          return {
            ...collection,
            requests: [...collection.requests, request],
          };
        }
        return collection;
      });

      return {
        ...state,
        collections: updatedCollections,
      };
    });
  },

  renameRequest: (name: string, requestId: string, workspaceId: string) => {
    collectionStore.setState((state) => {
      const updatedCollections = state.collections.map((collection) => {
        const updatedRequests = collection.requests.map((request) => {
          if (request.id === requestId) {
            return { ...request, name, workspaceId };
          }
          return request;
        });
        return {
          ...collection,
          requests: updatedRequests,
        };
      });

      const updatedActiveRequest =
        state.activeRequest?.id === requestId
          ? { ...state.activeRequest, name, workspaceId }
          : state.activeRequest;

      const updatedOpenedRequests = state.openedRequests.map((request) => {
        if (request.id === requestId) {
          return { ...request, name };
        }
        return request;
      });

      return {
        ...state,
        collections: updatedCollections,
        activeRequest: updatedActiveRequest,
        openedRequests: updatedOpenedRequests,
      };
    });
  },

  setIsLoading: (isLoading: boolean) => {
    collectionStore.setState((state) => ({
      ...state,
      isLoading,
    }));
  },

  setError: (error: string | null) => {
    collectionStore.setState((state) => ({
      ...state,
      error,
      isLoading: false,
    }));
  },
};

export const useCollectionStore = () => {
  return useStore(collectionStore);
};
