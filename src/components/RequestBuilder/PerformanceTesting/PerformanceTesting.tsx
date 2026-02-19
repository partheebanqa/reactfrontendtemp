'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Loader2,
  X,
  Download,
  Share2,
  Search,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle,
  Play,
  FileText,
  ChevronLeft,
  ChevronRight,
  Rocket,
  Plus,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { useWorkspace } from '@/hooks/useWorkspace';

import {
  downloadSecurityScanAsPDF,
  downloadSecurityScanAsHTML,
  shareSecurityScan,
  ScanResult,
} from '@/utils/securityExportUtils';

import {
  useLoadHistoricalScan,
  useScanHistory,
  useSecurityScanFlow,
} from '@/store/securityScan';
import { ConfigFormDialog } from './ConfigFormDialog';
import { ExecutionHistory } from './ExecutionHistory';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  PerformanceConfig,
  PerformanceRunApi,
  PerformanceRunDTO,
  PerformanceRunResultsResponse,
  PerformanceTestConfigApi,
  PerformanceTestConfigDTO,
  PerformanceTestUpdatePayload,
} from '@/models/performanceTest.model';
import {
  deletePerformanceTestConfig,
  executePerformanceTest,
  getPerformanceConfigsByRequestId,
  getPerformanceRunByExecutionId,
  getPerformanceRunResults,
  getPerformanceTestConfig,
  performanceTestCreate,
  updatePerformanceTestConfig,
} from '@/services/performance.service';
import { ConfigList } from './ConfigList';
import { queryClient } from '@/lib/queryClient';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RunDetailsInline } from './RunDetailsInline';
import { RunResultsTable } from './RunResultsTable';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RunSummaryCard } from './RunSummaryCard';
import RateLimitDashboard, { RateLimitRequest, RateLimitSummary } from './RateLimitDashboard';

export interface PerformanceTestProps {
  request: {
    id: string;
    name: string;
    method: string;
    url: string;
  };
  workspaceId: string;
  environmentId?: string;
  preRequestId?: string;
  onClose: () => void;
}
type ScanStatus = 'idle' | 'initializing' | 'scanning' | 'completed' | 'error';


function computePercentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
}

function mapRunResultsToRateLimitDashboard(runResultsResponse: any): {
  summary: RateLimitSummary;
  requests: RateLimitRequest[];
} {
  const results = runResultsResponse?.results ?? [];
  const s = runResultsResponse?.summary ?? {};

  const requests: RateLimitRequest[] = results.map((r: any, idx: number) => {
    const statusCode = Number(r.statusCode ?? r.status ?? 0);
    const responseTime = Number(r.responseTime ?? r.latencyMs ?? 0);
    const ttfbTime = Number(r.ttfbTime ?? r.ttfb ?? 0);
    const size = Number(r.size ?? r.bytes ?? 0);

    return {
      id: String(r.id ?? r.requestId ?? idx),
      url: String(r.url ?? r.requestUrl ?? ""),
      method: String(r.method ?? "GET"),
      statusCode,
      responseTime,
      size,
      success: Boolean(r.success ?? (statusCode >= 200 && statusCode < 300)),
      requestHeaders: (r.requestHeaders ?? {}) as any,
      responseHeaders: (r.responseHeaders ?? {}) as any,
      responseBody: typeof r.responseBody === "string" ? r.responseBody : JSON.stringify(r.responseBody ?? ""),
      curlCommand: String(r.curlCommand ?? ""),
      dnsTime: Number(r.dnsTime ?? 0),
      tcpTime: Number(r.tcpTime ?? 0),
      tlsTime: Number(r.tlsTime ?? 0),
      ttfbTime,
      timestamp: String(r.timestamp ?? r.time ?? new Date().toISOString()),
    };
  });

  const responseTimes = requests.map((x) => x.responseTime).filter((n) => Number.isFinite(n));
  const ttfbs = requests.map((x) => x.ttfbTime).filter((n) => Number.isFinite(n));

  const startTime = String(s.startTime ?? s.startedAt ?? s.start ?? requests[0]?.timestamp ?? new Date().toISOString());
  const endTime = String(s.endTime ?? s.endedAt ?? s.end ?? requests[requests.length - 1]?.timestamp ?? new Date().toISOString());

  const totalRequests = Number(s.totalRequests ?? requests.length);
  const successfulRequests = Number(s.successfulRequests ?? requests.filter((r) => r.success).length);
  const failedRequests = Number(s.failedRequests ?? (totalRequests - successfulRequests));

  const avgResp =
    Number(s.avgResponseTime) ||
    (responseTimes.reduce((a, b) => a + b, 0) / (responseTimes.length || 1));

  const avgTtfb =
    Number(s.avgTtfb) ||
    (ttfbs.reduce((a, b) => a + b, 0) / (ttfbs.length || 1));

  const minResp = Number(s.minResponseTime ?? Math.min(...(responseTimes.length ? responseTimes : [0])));
  const maxResp = Number(s.maxResponseTime ?? Math.max(...(responseTimes.length ? responseTimes : [0])));

  const p50 = Number(s.p50ResponseTime ?? computePercentile(responseTimes, 50));
  const p90 = Number(s.p90ResponseTime ?? computePercentile(responseTimes, 90));
  const p95 = Number(s.p95ResponseTime ?? computePercentile(responseTimes, 95));
  const p99 = Number(s.p99ResponseTime ?? computePercentile(responseTimes, 99));

  const durationSec =
    Number(s.totalDuration) ||
    Math.max(0, (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000);

  const totalDataTransferred =
    Number(s.totalDataTransferred) ||
    requests.reduce((acc, r) => acc + (Number(r.size) || 0), 0);

  const rps =
    Number(s.requestsPerSecond) ||
    (durationSec > 0 ? totalRequests / durationSec : 0);

  const summary: RateLimitSummary = {
    id: String(s.id ?? s.executionId ?? "unknown"),
    status: String(s.status ?? "COMPLETED"),
    startTime,
    endTime,
    totalRequests,
    successfulRequests,
    failedRequests,
    rateLimitDetected: Boolean(s.rateLimitDetected ?? s.rateLimited ?? false),
    rateLimitThreshold: Number(s.rateLimitThreshold ?? s.threshold ?? 0),
    avgResponseTime: avgResp,
    maxResponseTime: maxResp,
    minResponseTime: minResp,
    p50ResponseTime: p50,
    p90ResponseTime: p90,
    p95ResponseTime: p95,
    p99ResponseTime: p99,
    avgTtfb,
    totalDataTransferred,
    requestsPerSecond: rps,
    throughput: Number(s.throughput ?? rps),
    totalDuration: durationSec,
  };

  return { summary, requests };
}

export default function PerformanceTesting({
  request,
  environmentId,
  preRequestId,
  onClose,
}: PerformanceTestProps) {
  const { currentWorkspace } = useWorkspace();

  const requestId = request?.id;
  const [editingConfig, setEditingConfig] =
    useState<PerformanceTestConfigApi | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] =
    useState<PerformanceTestConfigApi | null>(null);

  const { toast } = useToast();

  const {
    data: historyData,
    isLoading: loadingHistory,
    refetch: refetchHistory,
  } = useScanHistory(currentWorkspace?.id || '');
  const { executeScan, isLoading: isScanning } = useSecurityScanFlow(
    currentWorkspace?.id || '',
  );

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [executingConfigId, setExecutingConfigId] = useState<string | null>(
    null,
  );
  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(
    null,
  );
  const [showResults, setShowResults] = useState(false);

  const [formConfig, setFormConfig] = useState<PerformanceConfig | null>(null);

  const {
    data: perfConfigs,
    isLoading,
    isFetching,
    isError,
  } = useQuery<PerformanceTestConfigApi[]>({
    queryKey: ['performance-configs-by-request', requestId],
    queryFn: () => getPerformanceConfigsByRequestId(requestId!),
    enabled: !!requestId && !String(requestId).startsWith('temp-'),
    refetchOnWindowFocus: false,
  });

  const configs = perfConfigs;

  const createConfigMutation = useMutation({
    mutationFn: performanceTestCreate,
    onSuccess: () => {
      toast({
        title: 'Configuration created',
        description: 'Saved successfully',
      });
      setFormDialogOpen(false);
      queryClient.invalidateQueries({
        queryKey: ['performance-configs-by-request', requestId],
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: PerformanceTestUpdatePayload;
    }) => updatePerformanceTestConfig(id, payload),
    onSuccess: () => {
      toast({
        title: 'Configuration updated',
        description: 'Updated successfully',
      });
      setFormDialogOpen(false);
      setEditingConfig(null);
      queryClient.invalidateQueries({
        queryKey: ['performance-configs-by-request', requestId],
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteConfigMutation = useMutation({
    mutationFn: (id: string) => deletePerformanceTestConfig(id),

    onSuccess: () => {
      toast({
        title: 'Configuration deleted',
        description: 'The configuration has been removed successfully',
      });

      setDeleteDialogOpen(false);
      setConfigToDelete(null);

      queryClient.invalidateQueries({
        queryKey: ['performance-configs-by-request', requestId],
      });
    },

    onError: (error: any) => {
      toast({
        title: 'Delete failed',
        description: error.message || 'Could not delete configuration',
        variant: 'destructive',
      });
    },
  });

  const executeMutation = useMutation({
    mutationFn: (configId: string) => executePerformanceTest({ configId }),

    onMutate: (configId) => {
      setExecutingConfigId(configId);
    },

    onSuccess: (data) => {
      toast({
        title: 'Test started',
        description: data.message || 'Performance test started successfully.',
      });

      setActiveExecutionId(data.executionId);
    },

    onError: (error: any) => {
      toast({
        title: 'Run failed',
        description: error.message || 'Could not start performance test',
        variant: 'destructive',
      });
    },

    onSettled: () => {
      setExecutingConfigId(null);
    },
  });

  const {
    data: editingConfigData,
    isFetching: isFetchingEditConfig,
    refetch: refetchEditConfig,
  } = useQuery({
    queryKey: ['performance-config-by-id', editingConfigId],
    queryFn: () => getPerformanceTestConfig(editingConfigId!),
    enabled: false,
    refetchOnWindowFocus: false,
  });

  // console.log(editingConfigData, "editingConfigData");

  const handleCreateClick = () => {
    setFormConfig(null);
    setEditingConfigId(null);
    setFormDialogOpen(true);
  };

  const handleEditClick = async (row: PerformanceTestConfigApi) => {
    try {
      const data = await getPerformanceTestConfig(row.Id);

      const mapped: PerformanceConfig = {
        id: data.Id,
        createdAt: data.CreatedAt,
        updatedAt: data.UpdatedAt,
        name: data.Name,
        // description: data.Description,
        numRequests: data.NumRequests,
        concurrency: data.Concurrency,
        delay: data.Delay,
        timeout: data.Timeout,
        rateLimitEnabled: data.RateLimitEnabled,
        stopOnError: data.StopOnError,
        rateLimitRequests: data.RateLimitRequests,
        rateLimitPeriod: data.RateLimitPeriod,
        rateLimitType: data.RateLimitType,
      };

      setEditingConfigId(row.Id);
      setFormConfig(mapped);
      setFormDialogOpen(true);
    } catch (err: any) {
      toast({
        title: 'Failed to load config',
        description: err.message || 'Could not fetch configuration',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClick = (config: PerformanceTestConfigApi) => {
    setConfigToDelete(config);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!configToDelete) return;
    await deleteConfigMutation.mutateAsync(configToDelete.Id);
  };

  const handleCreateConfig = async (payload: any) => {
    if (!requestId || !currentWorkspace?.id) return;

    await createConfigMutation.mutateAsync({
      ...payload,
      requestId,
      workspaceId: currentWorkspace.id,
      environmentId,
      preRequestId,
    });
  };
  const handleUpdateConfig = async (payload: PerformanceTestUpdatePayload) => {
    if (!editingConfigId) return;

    await updateConfigMutation.mutateAsync({
      id: editingConfigId,
      payload,
    });
  };

  const handleRunClick = async (configId: string) => {
    await executeMutation.mutateAsync(configId);
  };

  const {
    data: runDetails,
    isFetching: isFetchingRunDetails,
    error: runDetailsError,
  } = useQuery({
    queryKey: ['performance-run-details', activeExecutionId],
    queryFn: () => getPerformanceRunByExecutionId(activeExecutionId!),
    enabled: !!activeExecutionId,
    refetchOnWindowFocus: false,
    refetchInterval: (query) => {
      const data = query.state.data as any;
      if (!data) return 1500;
      // console.log(runDetails, "runDetails");
      const status = runDetails?.status;
      // console.log(status, "status");
      if (
        status === 'COMPLETED' ||
        status === 'FAILED' ||
        status === 'CANCELLED' ||
        status === 'STOPPED'
      )
        return false;
      return 2000;
    },
  });

  const {
    data: runResultsResponse,
    isFetching: isFetchingResults,
    error: resultsError,
    refetch: refetchResults,
  } = useQuery<PerformanceRunResultsResponse>({
    queryKey: ['performance-run-results', activeExecutionId],
    queryFn: () => getPerformanceRunResults(activeExecutionId!),
    enabled: false,
    refetchOnWindowFocus: false,
  });

  // console.log(runResultsResponse, "runResultsResponse");

  const isRunFinished =
    runDetails?.status === 'COMPLETED' ||
    runDetails?.status === 'FAILED' ||
    runDetails?.status === 'CANCELLED' ||
    runDetails?.status === 'STOPPED';

  return (
    <div className='bg-white dark:bg-gray-900 w-full h-full flex flex-col overflow-auto'>
      {/* Header */}
      <div className='border-b border-gray-200 dark:border-gray-800 pt-4 px-4 flex-shrink-0'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-1'>
              <Rocket className='w-5 h-5 text-blue-500' />
              <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                Rate Limit Test
              </h2>
            </div>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              {/* <span className='font-medium'>{request.method}</span>{' '}
              {request.url} */}
              {/* Configure and execute performance tests with rate limiting */}
              Request : {request.name} ({request?.url})
            </p>
          </div>

          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors'
          >
            <X className='w-5 h-5 text-gray-500' />
          </button>
        </div>
      </div>
      <ConfigFormDialog
        open={formDialogOpen}
        onOpenChange={(open) => {
          setFormDialogOpen(open);
          if (!open) {
            setFormConfig(null);
            setEditingConfigId(null);
          }
        }}
        config={formConfig ?? undefined}
        onSubmit={formConfig ? handleUpdateConfig : handleCreateConfig}
        isSubmitting={
          createConfigMutation.isPending || updateConfigMutation.isPending
        }
        isLoadingConfig={isFetchingEditConfig}
      />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete configuration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{configToDelete?.Name}". This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteConfigMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              disabled={deleteConfigMutation.isPending}
            >
              {deleteConfigMutation.isPending ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Deleting
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className='flex-1 flex overflow-hidden relative'>
        {/* RIGHT COLUMN - Scan Interface */}
        <div className='flex-1 overflow-auto scrollbar-thin p-3'>
          <Card className='flex justify-between p-3 mb-2'>
            <div>
              <CardTitle>Rate Limit Configurations</CardTitle>
              <CardDescription>
                Manage your performance test configurations
              </CardDescription>
            </div>
            <div>
              <Button onClick={handleCreateClick}>
                <Plus className='h-4 w-4 mr-2' />
                New Configuration
              </Button>
            </div>
          </Card>
          <ConfigList
            configs={perfConfigs || []}
            isLoading={isLoading}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onExecute={handleRunClick}
            executingConfigId={executingConfigId || ''}
          />
        </div>

        {/* RUN DETAILS PANEL */}
      </div>
      {activeExecutionId && (
        <div className='border-t border-gray-200 dark:border-gray-800 p-4'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
            {/* LEFT */}
            <div>
              <h3 className='text-base font-semibold text-gray-900 dark:text-white'>
                Latest Run Details
              </h3>
              <p className='text-xs text-muted-foreground break-all'>
                Execution ID: {activeExecutionId}
              </p>
            </div>

            {/* RIGHT */}
            <div className='flex flex-wrap items-center justify-end gap-2'>
              {isRunFinished && (
                <Button
                  size='sm'
                  onClick={async () => {
                    setShowResults(true);
                    await refetchResults();
                  }}
                  disabled={!activeExecutionId || isFetchingResults}
                >
                  {isFetchingResults ? (
                    <>
                      <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                      Loading results...
                    </>
                  ) : (
                    'Show Results'
                  )}
                </Button>
              )}

              {showResults && (
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => setShowResults(false)}
                >
                  Hide
                </Button>
              )}

              <Button
                variant='ghost'
                size='sm'
                onClick={() => {
                  setShowResults(false);
                  setActiveExecutionId(null);
                }}
              >
                <X />
              </Button>
            </div>
          </div>

          <div className='mt-4'>
            {isFetchingRunDetails && !runDetails ? (
              <div className='flex items-center gap-2 text-sm text-muted-foreground py-6'>
                <Loader2 className='h-4 w-4 animate-spin' />
                Fetching run details...
              </div>
            ) : runDetailsError ? (
              <div className='text-sm text-destructive'>
                {(runDetailsError as any)?.message ||
                  'Failed to load run details'}
              </div>
            ) : !runDetails ? (
              <div className='text-sm text-muted-foreground'>
                No run data yet.
              </div>
            ) : (
              <RunDetailsInline
                data={runDetails}
                loading={isFetchingRunDetails}
              />
            )}
          </div>
        </div>
      )}
      {showResults && runResultsResponse && (
        <div className='border-t border-gray-200 dark:border-gray-800 p-4'>
          {isFetchingResults && !runResultsResponse ? (
            <div className='flex items-center gap-2 text-sm text-muted-foreground py-6'>
              <Loader2 className='h-4 w-4 animate-spin' />
              Fetching results...
            </div>
          ) : resultsError ? (
            <div className='text-sm text-destructive'>
              {(resultsError as any)?.message || 'Failed to load results'}
            </div>
          ) : !runResultsResponse ? (
            <div className='text-sm text-muted-foreground'>
              No results found.
            </div>
          ) : (
            <div className='space-y-4'>
              {/* <RunSummaryCard summary={runResultsResponse.summary} />
              <RunResultsTable results={runResultsResponse.results} /> */}
              {(() => {
                const mapped = mapRunResultsToRateLimitDashboard(runResultsResponse);
                return (
                  <RateLimitDashboard
                    summary={mapped.summary}
                    requests={mapped.requests}
                  />
                );
              })()}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
