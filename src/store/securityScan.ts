import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchScanHistory,
  startSecurityScan,
  pollSecurityScan,
  loadHistoricalScan,
  SecurityScanHistoryResponse,
  ScanResult,
} from '@/services/executeRequest.service';

// ==================== QUERY KEYS ====================

export const securityScanKeys = {
  all: ['securityScans'] as const,
  history: (workspaceId: string) =>
    [...securityScanKeys.all, 'history', workspaceId] as const,
  scan: (scanId: string) => [...securityScanKeys.all, 'scan', scanId] as const,
};

// ==================== HOOKS ====================

/**
 * Fetch scan history for a workspace
 * @param workspaceId - The workspace ID
 * @param pageSize - Number of scans to fetch (default: 500)
 */
export const useScanHistory = (
  workspaceId: string,
  pageSize: number = 500,
  enabled: boolean = true
) => {
  return useQuery<SecurityScanHistoryResponse, Error>({
    queryKey: securityScanKeys.history(workspaceId),
    queryFn: () => fetchScanHistory(workspaceId, pageSize),
    enabled: enabled && !!workspaceId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
};

/**
 * Start a new security scan
 */
export const useStartSecurityScan = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { scanId: string },
    Error,
    { requestId: string; workspaceId: string }
  >({
    mutationFn: ({ requestId }) => startSecurityScan(requestId),
    onSuccess: (_, variables) => {
      // Invalidate scan history to refetch
      queryClient.invalidateQueries({
        queryKey: securityScanKeys.history(variables.workspaceId),
      });
    },
  });
};

/**
 * Poll for security scan completion
 */
export const usePollSecurityScan = () => {
  return useMutation<
    ScanResult,
    Error,
    {
      scanId: string;
      onProgress?: (status: any) => void;
      signal?: AbortSignal;
    }
  >({
    mutationFn: ({ scanId, onProgress, signal }) =>
      pollSecurityScan(scanId, onProgress, signal),
  });
};

/**
 * Load historical scan results
 */
export const useLoadHistoricalScan = () => {
  return useMutation<
    ScanResult,
    Error,
    {
      scanId: string;
      signal?: AbortSignal;
    }
  >({
    mutationFn: ({ scanId, signal }) => loadHistoricalScan(scanId, signal),
  });
};

/**
 * Combined hook for the entire scan flow
 * This simplifies the component by handling start + poll in one hook
 */
export const useSecurityScanFlow = (workspaceId: string) => {
  const queryClient = useQueryClient();
  const startScan = useStartSecurityScan();
  const pollScan = usePollSecurityScan();

  const executeScan = async (
    requestId: string,
    onProgress?: (status: any) => void,
    signal?: AbortSignal
  ): Promise<ScanResult> => {
    try {
      // Start the scan
      const { scanId } = await startScan.mutateAsync({
        requestId,
        workspaceId,
      });

      // Poll for results
      const result = await pollScan.mutateAsync({
        scanId,
        onProgress,
        signal,
      });

      // Invalidate history after successful scan
      queryClient.invalidateQueries({
        queryKey: securityScanKeys.history(workspaceId),
      });

      return result;
    } catch (error) {
      throw error;
    }
  };

  return {
    executeScan,
    isStarting: startScan.isPending,
    isPolling: pollScan.isPending,
    isLoading: startScan.isPending || pollScan.isPending,
    error: startScan.error || pollScan.error,
  };
};
