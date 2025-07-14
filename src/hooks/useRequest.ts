import { useRequestStore, requestActions } from '@/store/requestStore';

/**
 * Hook for managing API requests
 * This replaces the RequestContext with a store-based approach
 */
export function useRequest() {
  // Get request state from store
  const { requestData,isLoading,responseData,error } = useRequestStore();

  const clearError = requestActions.clearError;
  const setRequestData = requestActions.updateRequestData;
  const setResponseData = requestActions.setResponseData;
  const setLoading = requestActions.setIsLoading;
  const setError = requestActions.setError;


  return {
    requestData,
    isLoading,
    responseData,
    error,
    // Actions
    setRequestData,
    clearError,
    setResponseData,
    setLoading,
    setError,
  }
  
}
