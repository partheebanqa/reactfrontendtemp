import {
  useRequestStore,
  requestActions,
  type Assertion,
} from '@/store/requestStore';

/**
 * Hook for managing API requests
 * This replaces the RequestContext with a store-based approach
 */
export function useRequest() {
  // Get request state from store
  const { requestData, isLoading, responseData, error, assertions } =
    useRequestStore();

  const clearError = requestActions.clearError;
  const setRequestData = requestActions.updateRequestData;
  const setResponseData = requestActions.setResponseData;
  const setLoading = requestActions.setIsLoading;
  const setError = requestActions.setError;
  const setAssertions = requestActions.setAssertions;
  const updateAssertion = requestActions.updateAssertion;
  const toggleAssertion = requestActions.toggleAssertion;

  return {
    requestData,
    isLoading,
    responseData,
    error,
    assertions,
    // Actions
    setRequestData,
    clearError,
    setResponseData,
    setLoading,
    setError,
    setAssertions,
    updateAssertion,
    toggleAssertion,
  };
}
