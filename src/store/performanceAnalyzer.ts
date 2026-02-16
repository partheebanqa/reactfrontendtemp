import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPerformanceHistory,
  startPerformanceAnalyzer,
  pollPerformanceReport,
  loadHistoricalPerformanceAnalysis,
  PerformanceAnalyzerHistoryResponse,
  PerformanceAnalyzerResult,
  StartPerformanceAnalyzerPayload,
} from '@/services/executeRequest.service';

export const performanceAnalyzerKeys = {
  all: ['performanceAnalyzer'] as const,
  history: (requestId: string) =>
    [...performanceAnalyzerKeys.all, 'history', requestId] as const,
  report: (analyserId: string) =>
    [...performanceAnalyzerKeys.all, 'report', analyserId] as const,
};

/* -------------------- Queries -------------------- */

export const usePerformanceHistory = (
  requestId: string,
  page: number = 1,
  limit: number = 10,
  enabled: boolean = true,
) => {
  return useQuery<PerformanceAnalyzerHistoryResponse, Error>({
    queryKey: performanceAnalyzerKeys.history(requestId),
    queryFn: () => fetchPerformanceHistory(requestId, page, limit),
    enabled: enabled && !!requestId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
};

/* -------------------- Mutations -------------------- */

type StartAnalyzerResponse = {
  analyserId: string;
  status: string;
  message: string;
};

export const useStartPerformanceAnalyzer = () => {
  const queryClient = useQueryClient();

  return useMutation<
    StartAnalyzerResponse,
    Error,
    StartPerformanceAnalyzerPayload
  >({
    mutationFn: startPerformanceAnalyzer,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: performanceAnalyzerKeys.history(variables.requestId),
      });
    },
  });
};

export const usePollPerformanceReport = () => {
  return useMutation<
    PerformanceAnalyzerResult,
    Error,
    { analyserId: string; signal?: AbortSignal }
  >({
    mutationFn: ({ analyserId, signal }) =>
      pollPerformanceReport(analyserId, signal),
  });
};

export const useLoadHistoricalPerformanceAnalysis = () => {
  return useMutation<
    PerformanceAnalyzerResult,
    Error,
    { analyserId: string; signal?: AbortSignal }
  >({
    mutationFn: ({ analyserId, signal }) =>
      loadHistoricalPerformanceAnalysis(analyserId, signal),
  });
};

/* -------------------- Flow Hook -------------------- */
export const usePerformanceAnalyzerFlow = (
  requestId: string,
  workspaceId: string,
  environmentId?: string,
  preRequestId?: string,
) => {
  const queryClient = useQueryClient();
  const startAnalyzer = useStartPerformanceAnalyzer();
  const pollReport = usePollPerformanceReport();

  const executeAnalysis = async (
    signal?: AbortSignal,
    enabledChecks?: string[],
  ): Promise<PerformanceAnalyzerResult> => {
    try {
      // Use provided checks or default to all checks
      const checksToRun = enabledChecks || [
        'keep_alive',
        'compression',
        'caching',
        'response_time',
        'connection_pooling',
        'batch_capability',
        'pagination_support',
        'request_lifecycle',
      ];

      const { analyserId } = await startAnalyzer.mutateAsync({
        requestId,
        workspaceId,
        environmentId,
        preRequestId,
        enabledChecks: checksToRun,
      });

      const result = await pollReport.mutateAsync({
        analyserId,
        signal,
      });

      queryClient.invalidateQueries({
        queryKey: performanceAnalyzerKeys.history(requestId),
      });

      return result;
    } catch (error) {
      throw error;
    }
  };

  return {
    executeAnalysis,
    isStarting: startAnalyzer.isPending,
    isPolling: pollReport.isPending,
    isLoading: startAnalyzer.isPending || pollReport.isPending,
    error: startAnalyzer.error || pollReport.error,
  };
};
