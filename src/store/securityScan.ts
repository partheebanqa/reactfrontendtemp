import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchScanHistory,
  startSecurityScan,
  pollSecurityScan,
  loadHistoricalScan,
  SecurityScanHistoryResponse,
  ScanResult,
} from '@/services/executeRequest.service';

export const securityScanKeys = {
  all: ['securityScans'] as const,
  history: (workspaceId: string) =>
    [...securityScanKeys.all, 'history', workspaceId] as const,
  scan: (scanId: string) => [...securityScanKeys.all, 'scan', scanId] as const,
};

export const useScanHistory = (
  workspaceId: string,
  pageSize: number = 500,
  enabled: boolean = true,
) => {
  return useQuery<SecurityScanHistoryResponse, Error>({
    queryKey: securityScanKeys.history(workspaceId),
    queryFn: () => fetchScanHistory(workspaceId, pageSize),
    enabled: enabled && !!workspaceId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
};

export const useStartSecurityScan = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { scanId: string },
    Error,
    { requestId: string; workspaceId: string }
  >({
    mutationFn: ({ requestId }) => startSecurityScan(requestId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: securityScanKeys.history(variables.workspaceId),
      });
    },
  });
};

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

export const useSecurityScanFlow = (workspaceId: string) => {
  const queryClient = useQueryClient();
  const startScan = useStartSecurityScan();
  const pollScan = usePollSecurityScan();

  const executeScan = async (
    requestId: string,
    onProgress?: (status: any) => void,
    signal?: AbortSignal,
  ): Promise<ScanResult> => {
    try {
      const { scanId } = await startScan.mutateAsync({
        requestId,
        workspaceId,
      });

      const result = await pollScan.mutateAsync({
        scanId,
        onProgress,
        signal,
      });

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
