'use client';

import { Store, useStore } from '@tanstack/react-store';
import type { Collection, CollectionRequest } from '@/shared/types/collection';

export interface RequestResponse {
  status: number;
  statusCode: number;
  statusText?: string;
  headers: Record<string, string>;
  requestCurl?: any;
  actualRequest?: any;
  body: any;
  rawBody?: any;
  metrics?: any;
  assertionLogs?: any[];
  schemaValidation?: any;
}

export interface CollectionState {
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
  requestResponses: Map<string, RequestResponse>;
  extractedVariables: Record<string, Record<string, any>>;
  extractedVariablesRequest: Record<string, Record<string, any>>;
  sanitizeTestRunner: {
    isOpen: boolean;
    collectionId: string | null;
  };
  securityScan: {
    isOpen: boolean;
    requestId: string | null;
    request: CollectionRequest | null;
  };
  performanceScan: {
    isOpen: boolean;
    requestId: string | null;
    request: CollectionRequest | null;
  };
  preRequestAuth?: {
    collectionId: string | null;
    preRequestId: string | null;
    enabled: boolean;
  };
  requestPreRequestEnabled: Map<string, boolean>;
  performanceTest?: {
    isOpen: boolean;
    requestId: string | null;
    request: CollectionRequest | null;
  };
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
  requestResponses: new Map(),
  extractedVariables: {},
  extractedVariablesRequest: {},
  sanitizeTestRunner: {
    isOpen: false,
    collectionId: null,
  },
  securityScan: {
    isOpen: false,
    requestId: null,
    request: null,
  },
  performanceScan: {
    isOpen: false,
    requestId: null,
    request: null,
  },
  preRequestAuth: {
    collectionId: null,
    preRequestId: null,
    enabled: false,
  },
  requestPreRequestEnabled: new Map(),

  performanceTest: {
    isOpen: false,
    requestId: null,
    request: null,
  },
};

const STORAGE_KEY = 'collection-store-tabs';

function serializeTabState(state: CollectionState) {
  // Strip assertions from persisted tab state — IDB is the single source
  // of truth for assertions. Storing them here causes stale data to resurface
  // on page reload before IDB is consulted.
  const stripAssertions = (req: CollectionRequest) => {
    const { assertions, ...rest } = req as any;
    return rest;
  };

  return JSON.stringify({
    openedRequests: state.openedRequests.map(stripAssertions),
    activeRequest: state.activeRequest
      ? stripAssertions(state.activeRequest)
      : null,
  });
}
function loadTabState(): Partial<CollectionState> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const openedRequests = (parsed.openedRequests || []).filter(
      (r: any) => !r.id?.startsWith('temp-'),
    );
    const activeRequest = parsed.activeRequest?.id?.startsWith('temp-')
      ? openedRequests[0] || null
      : parsed.activeRequest || null;
    return { openedRequests, activeRequest };
  } catch {
    return {};
  }
}

export const collectionStore = new Store<CollectionState>({
  ...initialCollectionState,
  ...loadTabState(),
});

collectionStore.subscribe(() => {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      serializeTabState(collectionStore.state),
    );
  } catch {
    // sessionStorage unavailable (private mode, storage full, etc.)
  }
});

export const collectionActions = {
  replaceRequest: (oldRequestId: string, newRequest: CollectionRequest) => {
    collectionStore.setState((state) => {
      const updatedOpened = state.openedRequests.map((r) =>
        r.id === oldRequestId ? newRequest : r,
      );

      const updatedUnsaved = new Set(state.unsavedChanges);
      updatedUnsaved.delete(oldRequestId);

      return {
        ...state,
        openedRequests: updatedOpened,
        unsavedChanges: updatedUnsaved,
        activeRequest:
          state.activeRequest?.id === oldRequestId
            ? newRequest
            : state.activeRequest,
      };
    });
  },

  updateOpenedRequest: (updatedRequest: CollectionRequest) => {
    collectionStore.setState((state) => ({
      ...state,
      openedRequests: state.openedRequests.map((r) =>
        r.id === updatedRequest.id ? updatedRequest : r,
      ),
      activeRequest:
        state.activeRequest?.id === updatedRequest.id
          ? updatedRequest
          : state.activeRequest,
    }));
  },

  setActiveCollection: (collection: Collection | null) => {
    collectionStore.setState((state) => ({
      ...state,
      activeCollection: collection,
    }));
  },

  setActiveRequest: (request: CollectionRequest) => {
    collectionStore.setState((state) => {
      const existingOpen = state.openedRequests.find(
        (r) => r.id === request.id,
      );
      const isUnsaved = !!request.id && state.unsavedChanges.has(request.id);
      const merged = existingOpen
        ? {
            ...existingOpen,
            assertions: isUnsaved
              ? existingOpen.assertions // local buffer wins
              : (request.assertions ?? existingOpen.assertions), // backend wins when clean
            extractVariables: request.extractVariables?.length
              ? request.extractVariables
              : existingOpen.extractVariables,
          }
        : request;
      return {
        ...state,
        activeRequest: merged,
      };
    });
  },

  // AFTER
  openRequest: (request: CollectionRequest) => {
    collectionStore.setState((state) => {
      const existingOpen = state.openedRequests.find(
        (r) => r.id === request.id,
      );
      const isUnsaved = !!request.id && state.unsavedChanges.has(request.id);
      const merged = existingOpen
        ? {
            ...existingOpen,
            assertions: isUnsaved
              ? existingOpen.assertions // local buffer wins
              : (request.assertions ?? existingOpen.assertions), // backend wins when clean
            extractVariables: request.extractVariables?.length
              ? request.extractVariables
              : existingOpen.extractVariables,
          }
        : request;
      return {
        ...state,
        openedRequests: existingOpen
          ? state.openedRequests.map((r) => (r.id === request.id ? merged : r))
          : [...state.openedRequests, merged],
        activeRequest: merged,
      };
    });
  },

  closeRequest: (requestId: string) => {
    collectionStore.setState((state) => {
      const updatedOpened = state.openedRequests.filter(
        (r) => r.id !== requestId,
      );
      const updatedUnsaved = new Set(state.unsavedChanges);
      updatedUnsaved.delete(requestId);

      const newResponses = new Map(state.requestResponses);
      newResponses.delete(requestId);

      const newPreRequestMap = new Map(state.requestPreRequestEnabled);
      for (const key of newPreRequestMap.keys()) {
        if (key.endsWith(`:${requestId}`) || key === requestId) {
          newPreRequestMap.delete(key);
        }
      }

      const newExtractedVariablesRequest = {
        ...state.extractedVariablesRequest,
      };
      delete newExtractedVariablesRequest[requestId];

      let newActiveRequest = state.activeRequest;
      if (state.activeRequest?.id === requestId) {
        newActiveRequest = updatedOpened[updatedOpened.length - 1] || null;
      }

      return {
        ...state,
        openedRequests: updatedOpened,
        unsavedChanges: updatedUnsaved,
        activeRequest: newActiveRequest,
        requestResponses: newResponses,
        requestPreRequestEnabled: newPreRequestMap,
        extractedVariablesRequest: newExtractedVariablesRequest,
      };
    });
  },

  openMultipleRequests: (requests: CollectionRequest[]) => {
    collectionStore.setState((state) => {
      const openedIds = new Set(state.openedRequests.map((r) => r.id));
      const newRequests = requests.filter((r) => !openedIds.has(r.id));
      const updatedOpenedRequests = [...state.openedRequests, ...newRequests];
      const newActiveRequest = state.activeRequest || requests[0] || null;

      return {
        ...state,
        openedRequests: updatedOpenedRequests,
        activeRequest: newActiveRequest,
      };
    });
  },

  openAllCollectionRequests: (collectionId: string) => {
    collectionStore.setState((state) => {
      const collection = state.collections.find((c) => c.id === collectionId);
      if (!collection) return state;

      const allRequests =
        collectionActions.getAllRequestsFromCollection(collection);

      if (allRequests.length === 0) return state;

      const openedIds = new Set(state.openedRequests.map((r) => r.id));
      const newRequests = allRequests.filter((r) => !openedIds.has(r.id));
      const updatedOpenedRequests = [...state.openedRequests, ...newRequests];

      return {
        ...state,
        openedRequests: updatedOpenedRequests,
        activeRequest: allRequests[0],
        activeCollection: collection,
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
        c.id === updatedCollection.id ? updatedCollection : c,
      ),
    }));
  },

  renameCollection: (id: string, name: string) => {
    collectionStore.setState((state) => ({
      ...state,
      collections: state.collections.map((c) =>
        c.id === id ? { ...c, name } : c,
      ),
    }));
  },

  setFavouriteCollection: (id: string, IsImportant: boolean) => {
    collectionStore.setState((state) => ({
      ...state,
      collections: state.collections.map((c) =>
        c.id === id ? { ...c, IsImportant } : c,
      ),
    }));
  },

  setUnFavouriteCollection: (id: string) => {
    collectionStore.setState((state) => ({
      ...state,
      collections: state.collections.map((c) =>
        c.id === id ? { ...c, isImportant: false } : c,
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

      const newPreRequestMap = new Map(state.requestPreRequestEnabled);
      newPreRequestMap.delete(requestId);

      return {
        ...state,
        collections: updatedCollections,
        activeRequest: newActiveRequest,
        requestPreRequestEnabled: newPreRequestMap,
      };
    });
  },

  addRequestToCollection: (
    collectionId: string,
    request: CollectionRequest,
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

  openSanitizeTestRunner: (collectionId: string) => {
    collectionStore.setState((state) => {
      const newState = {
        ...state,
        sanitizeTestRunner: {
          isOpen: true,
          collectionId,
        },
      };

      return newState;
    });
  },

  closeSanitizeTestRunner: () => {
    collectionStore.setState((state) => ({
      ...state,
      sanitizeTestRunner: {
        isOpen: false,
        collectionId: null,
      },
    }));
  },

  openSecurityScan: (request: CollectionRequest) => {
    collectionStore.setState((state) => ({
      ...state,
      securityScan: {
        isOpen: true,
        requestId: request.id || null,
        request: request,
      },
    }));
  },

  closeSecurityScan: () => {
    collectionStore.setState((state) => ({
      ...state,
      securityScan: {
        isOpen: false,
        requestId: null,
        request: null,
      },
    }));
  },

  openPerformanceScanning: (request: CollectionRequest) => {
    collectionStore.setState((state) => ({
      ...state,
      performanceScan: {
        isOpen: true,
        requestId: request.id || null,
        request: request,
      },
    }));
  },

  closePerformanceScan: () => {
    collectionStore.setState((state) => ({
      ...state,
      performanceScan: {
        isOpen: false,
        requestId: null,
        request: null,
      },
    }));
  },

  openPerformanceTesting: (request: CollectionRequest) => {
    collectionStore.setState((state) => ({
      ...state,
      performanceTest: {
        isOpen: true,
        requestId: request.id || null,
        request: request,
      },
    }));
  },

  closePerformanceTesting: () => {
    collectionStore.setState((state) => ({
      ...state,
      performanceTest: {
        isOpen: false,
        requestId: null,
        request: null,
      },
    }));
  },

  setRequestResponse: (requestId: string, response: RequestResponse) => {
    collectionStore.setState((state) => {
      const newResponses = new Map(state.requestResponses);
      newResponses.set(requestId, response);
      return {
        ...state,
        requestResponses: newResponses,
      };
    });
  },

  getRequestResponse: (requestId: string): RequestResponse | undefined => {
    return collectionStore.state.requestResponses.get(requestId);
  },

  clearRequestResponse: (requestId: string) => {
    collectionStore.setState((state) => {
      const newResponses = new Map(state.requestResponses);
      newResponses.delete(requestId);
      return {
        ...state,
        requestResponses: newResponses,
      };
    });
  },

  clearAllResponses: () => {
    collectionStore.setState((state) => ({
      ...state,
      requestResponses: new Map(),
    }));
  },

  setExtractedVariable: (collectionId: string, name: string, value: any) => {
    collectionStore.setState((state) => ({
      ...state,
      extractedVariables: {
        ...state.extractedVariables,
        [collectionId]: {
          ...(state.extractedVariables[collectionId] || {}),
          [name]: value,
        },
      },
    }));
  },

  removeExtractedVariable: (collectionId: string, name: string) => {
    collectionStore.setState((state) => {
      const collectionVars = {
        ...(state.extractedVariables[collectionId] || {}),
      };
      delete collectionVars[name];

      return {
        ...state,
        extractedVariables: {
          ...state.extractedVariables,
          [collectionId]: collectionVars,
        },
      };
    });
  },

  getExtractedVariables: (collectionId: string): Record<string, any> => {
    return collectionStore.state.extractedVariables[collectionId] || {};
  },

  clearCollectionExtractedVariables: (collectionId: string) => {
    collectionStore.setState((state) => {
      const newExtractedVariables = { ...state.extractedVariables };
      delete newExtractedVariables[collectionId];

      return {
        ...state,
        extractedVariables: newExtractedVariables,
      };
    });
  },

  clearAllExtractedVariables: () => {
    collectionStore.setState((state) => ({
      ...state,
      extractedVariables: {},
    }));
  },

  setExtractedVariableRequest: (
    requestId: string,
    name: string,
    value: any,
  ) => {
    collectionStore.setState((state) => ({
      ...state,
      extractedVariablesRequest: {
        ...state.extractedVariablesRequest,
        [requestId]: {
          ...(state.extractedVariablesRequest[requestId] || {}),
          [name]: value,
        },
      },
    }));
  },

  // NEW: Remove extracted variable from specific request
  removeExtractedVariableRequest: (requestId: string, name: string) => {
    collectionStore.setState((state) => {
      const requestVars = {
        ...(state.extractedVariablesRequest[requestId] || {}),
      };
      delete requestVars[name];

      return {
        ...state,
        extractedVariablesRequest: {
          ...state.extractedVariablesRequest,
          [requestId]: requestVars,
        },
      };
    });
  },

  // NEW: Get all extracted variables for specific request
  getExtractedVariablesRequest: (requestId: string): Record<string, any> => {
    return collectionStore.state.extractedVariablesRequest[requestId] || {};
  },

  // NEW: Clear all extracted variables for specific request
  clearRequestExtractedVariablesRequest: (requestId: string) => {
    collectionStore.setState((state) => {
      const newExtractedVariablesRequest = {
        ...state.extractedVariablesRequest,
      };
      delete newExtractedVariablesRequest[requestId];

      return {
        ...state,
        extractedVariablesRequest: newExtractedVariablesRequest,
      };
    });
  },

  // NEW: Clear extracted variables for all requests in a collection
  clearCollectionRequestsVariablesRequest: (collectionId: string) => {
    collectionStore.setState((state) => {
      const collection = state.collections.find((c) => c.id === collectionId);
      if (!collection) return state;

      const newExtractedVariablesRequest = {
        ...state.extractedVariablesRequest,
      };

      collection.requests.forEach((req) => {
        if (req.id) {
          delete newExtractedVariablesRequest[req.id];
        }
      });

      return {
        ...state,
        extractedVariablesRequest: newExtractedVariablesRequest,
      };
    });
  },

  // NEW: Clear all request-specific extracted variables
  clearAllExtractedVariablesRequest: () => {
    collectionStore.setState((state) => ({
      ...state,
      extractedVariablesRequest: {},
    }));
  },

  setRequestPreRequestEnabled: (
    requestId: string,
    enabled: boolean,
    collectionId?: string,
  ) => {
    collectionStore.setState((state) => {
      const newMap = new Map(state.requestPreRequestEnabled);
      const key = collectionId ? `${collectionId}:${requestId}` : requestId;
      newMap.set(key, enabled);
      return {
        ...state,
        requestPreRequestEnabled: newMap,
      };
    });
  },

  getRequestPreRequestEnabled: (
    requestId: string,
    collectionId?: string,
  ): boolean => {
    const key = collectionId ? `${collectionId}:${requestId}` : requestId;
    return collectionStore.state.requestPreRequestEnabled.get(key) ?? false;
  },

  clearRequestPreRequestEnabled: (requestId: string, collectionId?: string) => {
    collectionStore.setState((state) => {
      const newMap = new Map(state.requestPreRequestEnabled);
      const key = collectionId ? `${collectionId}:${requestId}` : requestId;
      newMap.delete(key);
      return {
        ...state,
        requestPreRequestEnabled: newMap,
      };
    });
  },

  clearCollectionPreRequestStates: (collectionId: string) => {
    collectionStore.setState((state) => {
      const collection = state.collections.find((c) => c.id === collectionId);
      if (!collection) return state;

      const newMap = new Map(state.requestPreRequestEnabled);

      // Get ALL requests including those in folders
      const allRequests =
        collectionActions.getAllRequestsFromCollection(collection);

      allRequests.forEach((req) => {
        if (req.id) {
          const key = `${collectionId}:${req.id}`;
          newMap.delete(key);
        }
      });

      return {
        ...state,
        requestPreRequestEnabled: newMap,
      };
    });
  },

  autoEnableCollectionPreRequest: (collectionId: string) => {
    collectionStore.setState((state) => {
      const collection = state.collections.find((c) => c.id === collectionId);
      if (!collection || !collection.preRequestId) return state;

      const newMap = new Map(state.requestPreRequestEnabled);

      // Get ALL requests including those in folders
      const allRequests =
        collectionActions.getAllRequestsFromCollection(collection);

      allRequests.forEach((req) => {
        if (req.id && req.id !== collection.preRequestId) {
          const key = `${collectionId}:${req.id}`;
          newMap.set(key, true);
        }
      });

      return {
        ...state,
        requestPreRequestEnabled: newMap,
      };
    });
  },

  getAllRequestsFromCollection: (
    collection: Collection,
  ): CollectionRequest[] => {
    const requests: CollectionRequest[] = [];

    requests.push(...(collection.requests || []));

    const getFolderRequests = (folders: any[] = []): void => {
      folders.forEach((folder) => {
        if (folder.requests) {
          requests.push(...folder.requests);
        }
        if (folder.folders && folder.folders.length > 0) {
          getFolderRequests(folder.folders);
        }
      });
    };

    getFolderRequests((collection as any).folders || []);

    return requests;
  },
};

export const useCollectionStore = () => {
  return useStore(collectionStore);
};
