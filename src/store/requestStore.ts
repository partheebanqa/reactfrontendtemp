import { Store, useStore } from '@tanstack/react-store';
import {
  RequestData,
  ResponseData,
  KeyValuePair,
  RequestState,
  ErrorState,
} from '@/shared/types/request';
import { CollectionRequest } from '@/shared/types/collection';
import { ReactNode } from 'react';
import { removeDuplicateAssertions } from '@/lib/assertion-utils';

// Define the assertion type
export interface Assertion {
  priority: any;
  field: ReactNode;
  group: any;
  impact: ReactNode;
  id: string;
  category: string;
  description: string;
  enabled: boolean;
  expectedValue: any;
  dataType?: string;
  operator: string;
  type: string;
  actualValue?: any;
}

interface ExtendedRequestState extends RequestState {
  assertions: Assertion[];
}

// Initial state for request
export const initialRequestState: ExtendedRequestState = {
  requestData: {
    method: 'GET',
    url: '',
    params: [],
    headers: [],
    authorization: {},
    authorizationType: 'none',
    bodyType: 'none',
    bodyFormData: null,
    bodyRawContent: null,
    variables: {},
    order: 0,
    createdAt: new Date().toISOString(),
  },
  responseData: null,
  isLoading: false,
  error: {
    title: '',
    description: '',
    suggestions: [],
  },
  assertions: [],
};

// Create the store
export const requestStore = new Store<ExtendedRequestState>(
  initialRequestState
);

// Define actions to update the store
export const requestActions = {
  // Update request data (method, url, params, headers, body)
  updateRequestData: (data: Partial<RequestData>) => {
    requestStore.setState((state) => ({
      ...state,
      data,
    }));
  },

  // Set response data
  setResponseData: (responseData: ResponseData | null) => {
    requestStore.setState((state) => ({
      ...state,
      responseData,
      isLoading: false,
    }));
  },

  // Set assertions
  setAssertions: (assertions: Assertion[]) => {
    // Remove duplicates before setting
    const uniqueAssertions = removeDuplicateAssertions(assertions);

    requestStore.setState((state) => ({
      ...state,
      assertions: uniqueAssertions,
    }));
  },

  // Update a single assertion
  updateAssertion: (assertionId: string, updates: Partial<Assertion>) => {
    requestStore.setState((state) => ({
      ...state,
      assertions: state.assertions.map((assertion) =>
        assertion.id === assertionId ? { ...assertion, ...updates } : assertion
      ),
    }));
  },

  // Toggle assertion enabled state
  toggleAssertion: (assertionId: string) => {
    requestStore.setState((state) => ({
      ...state,
      assertions: state.assertions.map((assertion) =>
        assertion.id === assertionId
          ? { ...assertion, enabled: !assertion.enabled }
          : assertion
      ),
    }));
  },

  // Set loading state
  setIsLoading: (isLoading: boolean) => {
    requestStore.setState((state) => ({
      ...state,
      isLoading,
    }));
  },

  // Set error
  setError: (error: ErrorState) => {
    requestStore.setState((state) => ({
      ...state,
      error,
      isLoading: false,
    }));
  },

  // Helper function to build URL with params
  buildUrl: (url: string, params: KeyValuePair[]): string => {
    const validParams = params.filter((p) => p.key && p.value);
    if (validParams.length === 0) return url;

    const urlObj = new URL(url.startsWith('http') ? url : `http://${url}`);
    validParams.forEach((param) => {
      urlObj.searchParams.append(param.key, param.value);
    });

    return urlObj.toString();
  },

  // Reset request data to initial state
  resetRequestData: () => {
    requestStore.setState((state) => ({
      ...state,
      requestData: initialRequestState.requestData,
    }));
  },

  // Reset response data
  resetResponseData: () => {
    requestStore.setState((state) => ({
      ...state,
      responseData: null,
    }));
  },

  clearError: () => {
    requestStore.setState((state) => ({
      ...state,
      error: {
        title: '',
        description: '',
        suggestions: [],
      },
    }));
  },
};

// Hook to use the request store
export const useRequestStore = () => {
  return useStore(requestStore);
};
