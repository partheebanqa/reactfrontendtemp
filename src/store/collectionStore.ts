import { Store, useStore } from "@tanstack/react-store";
import {
  RequestData,
  ResponseData,
  KeyValuePair,
} from "@/shared/types/request";
import { Collection, CollectionRequest } from "@/shared/types/collection";
import { rename } from "fs";

// Define the shape of our request state
interface CollectionState {
  responseLayout: "bottom" | "right";
  activeRequest: CollectionRequest | null;
  activeCollection: Collection | null;
  collections: Collection[];
  isCreatingCollection: boolean;
  expandedCollections: Set<string>;
  isLoading: boolean;
  error: string | null;
}

// Initial state for request
export const initialCollectionState: CollectionState = {
  responseLayout: "bottom", // Default layout
  activeCollection: null,
  activeRequest: null,
  collections: [],
  isCreatingCollection: false,
  expandedCollections: new Set(),
  isLoading: false,
  error: null,
};

// Create the store
export const collectionStore = new Store<CollectionState>(
  initialCollectionState
);

// Define actions to update the store
export const collectionActions = {
  // Update response layout
  setResponseLayout: (layout: "bottom" | "right") => {
    collectionStore.setState((state) => ({
      ...state,
      responseLayout: layout,
    }));
  },

  // Update active collection
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

  setCollections: (collections: Collection[]) => {
    collectionStore.setState((state) => ({
      ...state,
      collections,
    }));
  },

  // Add a new collection
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

  // Remove a collection
  removeCollection: (collectionId: string) => {
    collectionStore.setState((state) => ({
      ...state,
      collections: state.collections.filter((c) => c.id !== collectionId),
    }));
  },

  // Set loading state
  setIsLoading: (isLoading: boolean) => {
    collectionStore.setState((state) => ({
      ...state,
      isLoading,
    }));
  },

  // Set error
  setError: (error: string | null) => {
    collectionStore.setState((state) => ({
      ...state,
      error,
      isLoading: false,
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
      // Find which collection contains this request
      const updatedCollections = state.collections.map((collection) => {
        // If this collection has the request, filter it out
        if (collection.requests.some((req) => req.id === requestId)) {
          return {
            ...collection,
            requests: collection.requests.filter((req) => req.id !== requestId),
          };
        }
        return collection;
      });

      // If the active request is the one being deleted, set it to null
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

  renameRequest: (name: string, requestId: string) => {
    collectionStore.setState((state) => {
      const updatedCollections = state.collections.map((collection) => {
        const updatedRequests = collection.requests.map((request) => {
          if (request.id === requestId) {
            return { ...request, name };
          }
          return request;
        });
        return {
          ...collection,
          requests: updatedRequests,
        };
      });

      return {
        ...state,
        collections: updatedCollections,
      };
    });
  },
};

// Hook to use the collection store
export const useCollectionStore = () => {
  return useStore(collectionStore);
};

// Define the shape of our collection state
