'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Loader2,
  X,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle,
  Play,
  ChevronLeft,
  ChevronRight,
  Settings,
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
  useLoadHistoricalPerformanceAnalysis,
  usePerformanceHistory,
  usePerformanceAnalyzerFlow,
} from '@/store/performanceAnalyzer';
import { PerformanceAnalyzerResult } from '@/services/executeRequest.service';
import PerformanceReportView from './PerformanceReportView';

export interface PerformanceScanProps {
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

type ScanStatus = 'idle' | 'initializing' | 'analyzing' | 'completed' | 'error';

interface PerformanceCheck {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

const DEFAULT_CHECKS: PerformanceCheck[] = [
  {
    id: 'keep_alive',
    name: 'Keep-Alive Connection',
    description: 'Checks if persistent connections are enabled',
    enabled: true,
  },
  {
    id: 'compression',
    name: 'Payload Compression',
    description: 'Verifies response compression (gzip, deflate)',
    enabled: true,
  },
  {
    id: 'caching',
    name: 'HTTP Caching Headers',
    description: 'Validates cache-control and ETag headers',
    enabled: true,
  },
  {
    id: 'response_time',
    name: 'Response Time Performance',
    description: 'Measures average response time and latency',
    enabled: true,
  },
  {
    id: 'connection_pooling',
    name: 'Connection Pooling & Concurrency',
    description: 'Tests concurrent request handling',
    enabled: true,
  },
  {
    id: 'batch_capability',
    name: 'Batch Processing Support',
    description: 'Checks for batch operation capabilities',
    enabled: true,
  },
  {
    id: 'pagination_support',
    name: 'Pagination Support',
    description: 'Validates pagination implementation',
    enabled: true,
  },
  {
    id: 'request_lifecycle',
    name: 'Request Lifecycle Performance',
    description: 'Analyzes DNS, TCP, TLS, and TTFB metrics',
    enabled: true,
  },
];

export default function PerformanceScanView({
  request,
  workspaceId,
  environmentId,
  preRequestId,
  onClose,
}: PerformanceScanProps) {
  const { currentWorkspace } = useWorkspace();

  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [scanResult, setScanResult] =
    useState<PerformanceAnalyzerResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'passed' | 'failed'
  >('all');
  const [selectedHistoryAnalysis, setSelectedHistoryAnalysis] = useState<
    string | null
  >(null);
  const [expandedCheck, setExpandedCheck] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState('');
  const [remainingTime, setRemainingTime] = useState(60);

  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [performanceChecks, setPerformanceChecks] =
    useState<PerformanceCheck[]>(DEFAULT_CHECKS);
  const [showCheckConfig, setShowCheckConfig] = useState(false);

  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    data: historyData,
    isLoading: loadingHistory,
    refetch: refetchHistory,
  } = usePerformanceHistory(request.id);
  const { executeAnalysis, isLoading: isAnalyzing } =
    usePerformanceAnalyzerFlow(
      request.id,
      workspaceId,
      environmentId,
      preRequestId,
    );

  const loadHistoricalMutation = useLoadHistoricalPerformanceAnalysis();

  useEffect(() => {
    if (scanStatus === 'idle') {
      setIsHistoryOpen(true);
    } else {
      setIsHistoryOpen(false);
    }
  }, [scanStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const toggleCheck = (checkId: string) => {
    setPerformanceChecks((checks) =>
      checks.map((check) =>
        check.id === checkId ? { ...check, enabled: !check.enabled } : check,
      ),
    );
  };

  const toggleAllChecks = (enabled: boolean) => {
    setPerformanceChecks((checks) =>
      checks.map((check) => ({ ...check, enabled })),
    );
  };

  const enabledChecksCount = performanceChecks.filter((c) => c.enabled).length;

  const startAnalysis = async () => {
    const enabledCheckIds = performanceChecks
      .filter((check) => check.enabled)
      .map((check) => check.id);

    if (enabledCheckIds.length === 0) {
      toast({
        title: 'No Checks Selected',
        description: 'Please select at least one performance check',
        variant: 'destructive',
      });
      return;
    }

    try {
      abortControllerRef.current = new AbortController();

      setScanStatus('initializing');
      setScanProgress('Initializing performance analysis...');
      setRemainingTime(60);
      setSelectedHistoryAnalysis(null);
      setShowCheckConfig(false);

      // Start countdown timer
      timerIntervalRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setScanStatus('analyzing');
      setScanProgress('Analyzing endpoint performance...');

      const result = await executeAnalysis(
        abortControllerRef.current.signal,
        enabledCheckIds,
      );

      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      setScanResult(result);
      setScanStatus('completed');

      toast({
        title: 'Analysis Complete',
        description: `Performance score: ${result.overallScore}/100 (${result.grade})`,
      });

      // Refetch history to show the new analysis
      refetchHistory();
    } catch (error: any) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      if (error.message === 'Analysis cancelled') {
        return;
      }

      console.error('Performance analysis failed:', error);
      setScanStatus('error');
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to complete performance analysis',
        variant: 'destructive',
      });
    } finally {
      abortControllerRef.current = null;
    }
  };

  const cancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    setScanStatus('idle');
    setScanProgress('');
    setRemainingTime(60);

    toast({
      title: 'Analysis Cancelled',
      description: 'Performance analysis has been cancelled',
    });
  };

  const loadHistoryAnalysis = async (analyserId: string) => {
    try {
      setSelectedHistoryAnalysis(analyserId);
      setScanStatus('analyzing');
      setScanProgress('Loading historical analysis...');

      const result = await loadHistoricalMutation.mutateAsync({ analyserId });

      setScanResult(result);
      setScanStatus('completed');

      toast({
        title: 'Historical Analysis Loaded',
        description: 'Previous analysis results loaded successfully',
      });
    } catch (error: any) {
      console.error('Failed to load historical analysis:', error);
      toast({
        title: 'Failed to Load Analysis',
        description: error.message || 'Could not load historical analysis',
        variant: 'destructive',
      });
      setScanStatus('error');
      setSelectedHistoryAnalysis(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A'))
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
    if (grade.startsWith('B'))
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
  };

  const filteredResults = useMemo(() => {
    if (!scanResult?.results) return [];

    return scanResult.results.filter((check) => {
      const matchesSearch =
        check.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        check.details.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        selectedFilter === 'all' ||
        (selectedFilter === 'passed' && check.passed) ||
        (selectedFilter === 'failed' && !check.passed);

      return matchesSearch && matchesFilter;
    });
  }, [scanResult, searchQuery, selectedFilter]);

  const analysisHistory = historyData?.items || [];

  return (
    <div className='bg-white dark:bg-gray-900 w-full h-full flex flex-col overflow-hidden'>
      {/* Header */}
      <div className='border-b border-gray-200 dark:border-gray-800 pt-4 px-4 flex-shrink-0'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-1'>
              <Zap className='w-5 h-5 text-blue-500' />
              <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                Performance Analysis
              </h2>
            </div>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              <span className='font-medium'>{request.method}</span>{' '}
              {request.url}
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

      {/* Two Column Layout with Collapsible History */}
      <div className='flex-1 flex overflow-hidden relative'>
        {/* LEFT COLUMN - Collapsible Analysis History */}
        <div
          className={`border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden transition-all duration-300 ${
            isHistoryOpen ? 'w-80' : 'w-0'
          }`}
        >
          <div className='p-4 border-b border-gray-200 dark:border-gray-800'>
            <h3 className='font-semibold text-gray-900 dark:text-white flex items-center gap-2'>
              <Clock className='w-4 h-4' />
              Analysis History
            </h3>
          </div>

          <div className='flex-1 overflow-auto p-3 space-y-2 scrollbar-thin'>
            {loadingHistory ? (
              <div className='flex items-center justify-center py-8'>
                <Loader2 className='w-6 h-6 animate-spin text-gray-400' />
              </div>
            ) : analysisHistory.length === 0 ? (
              <div className='text-center py-8 text-sm text-gray-500'>
                No previous analyses
              </div>
            ) : (
              analysisHistory.map((analysis) => (
                <button
                  key={analysis.analyserId}
                  onClick={() => loadHistoryAnalysis(analysis.analyserId)}
                  disabled={loadHistoricalMutation.isPending}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedHistoryAnalysis === analysis.analyserId
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className='flex items-center justify-between mb-2'>
                    <div className='flex items-center gap-2'>
                      {analysis.status === 'completed' ? (
                        <CheckCircle className='w-4 h-4 text-green-500' />
                      ) : analysis.status === 'running' ||
                        analysis.status === 'pending' ? (
                        <Loader2 className='w-4 h-4 text-blue-500 animate-spin' />
                      ) : (
                        <AlertCircle className='w-4 h-4 text-gray-400' />
                      )}
                      <span className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                        {new Date(analysis.startedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className='text-xs text-gray-500 dark:text-gray-500 mb-2'>
                    {new Date(analysis.startedAt).toLocaleTimeString()}
                  </div>

                  {analysis.overallScore !== undefined && (
                    <div className='flex items-center gap-2'>
                      <div
                        className={`text-sm font-bold ${getScoreColor(analysis.overallScore)}`}
                      >
                        Score: {analysis.overallScore}/100
                      </div>
                      {analysis.grade && (
                        <span
                          className={`text-xs px-2 py-1 rounded ${getGradeColor(analysis.grade)}`}
                        >
                          {analysis.grade}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          className='absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-r-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-md'
          style={{ left: isHistoryOpen ? '320px' : '0px' }}
        >
          {isHistoryOpen ? (
            <ChevronLeft className='w-4 h-4 text-gray-600 dark:text-gray-400' />
          ) : (
            <ChevronRight className='w-4 h-4 text-gray-600 dark:text-gray-400' />
          )}
        </button>

        <div className='flex-1 overflow-auto scrollbar-thin'>
          {scanStatus === 'idle' && (
            <div className='flex items-center justify-center h-full px-6'>
              <div className='text-center max-w-2xl w-full'>
                <div className='relative mb-6'>
                  <div className='w-32 h-32 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto'>
                    <Zap className='w-14 h-14 text-blue-600' />
                  </div>
                </div>

                <h3 className='text-2xl font-semibold text-gray-900 dark:text-white mb-2'>
                  Ready to Analyze
                </h3>

                <p className='text-gray-600 dark:text-gray-400 mb-6'>
                  Analyze your API endpoint for performance metrics including
                  response time, caching, compression, and connection handling.
                </p>

                {/* Performance Checks Configuration */}
                <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 text-left'>
                  <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-2'>
                      <Settings className='w-5 h-5 text-gray-700 dark:text-gray-300' />
                      <h4 className='font-semibold text-gray-900 dark:text-white'>
                        Performance Checks ({enabledChecksCount}/
                        {performanceChecks.length})
                      </h4>
                    </div>
                    <button
                      onClick={() => setShowCheckConfig(!showCheckConfig)}
                      className='text-sm text-blue-600 dark:text-blue-400 hover:underline'
                    >
                      {showCheckConfig ? 'Hide' : 'Configure'}
                    </button>
                  </div>

                  {showCheckConfig && (
                    <div className='space-y-2 mb-4'>
                      <div className='flex gap-2 mb-3'>
                        <button
                          onClick={() => toggleAllChecks(true)}
                          className='text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => toggleAllChecks(false)}
                          className='text-xs px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors'
                        >
                          Deselect All
                        </button>
                      </div>

                      {performanceChecks.map((check) => (
                        <label
                          key={check.id}
                          className='flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750 cursor-pointer transition-colors'
                        >
                          <input
                            type='checkbox'
                            checked={check.enabled}
                            onChange={() => toggleCheck(check.id)}
                            className='mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500'
                          />
                          <div className='flex-1'>
                            <div className='font-medium text-gray-900 dark:text-white text-sm'>
                              {check.name}
                            </div>
                            <div className='text-xs text-gray-600 dark:text-gray-400 mt-1'>
                              {check.description}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {!showCheckConfig && (
                    <div className='text-sm text-gray-600 dark:text-gray-400'>
                      {enabledChecksCount === performanceChecks.length ? (
                        'All checks enabled'
                      ) : (
                        <>
                          {performanceChecks
                            .filter((c) => c.enabled)
                            .map((c) => c.name)
                            .join(', ')}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  onClick={startAnalysis}
                  disabled={enabledChecksCount === 0}
                  size='lg'
                >
                  <Play className='w-4 h-4' />
                  Start Performance Analysis
                </Button>

                {enabledChecksCount === 0 && (
                  <p className='text-sm text-red-600 dark:text-red-400 mt-2'>
                    Please select at least one performance check
                  </p>
                )}
              </div>
            </div>
          )}

          {(scanStatus === 'initializing' || scanStatus === 'analyzing') && (
            <div className='flex items-center justify-center h-full p-8'>
              <div className='text-center max-w-md'>
                <div className='relative w-20 h-20 mx-auto mb-6'>
                  <Loader2 className='w-20 h-20 text-blue-500 animate-spin' />
                  <Zap className='w-10 h-10 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' />
                </div>
                <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                  {scanStatus === 'initializing'
                    ? 'Initializing Analysis'
                    : 'Analyzing API Performance'}
                </h3>
                <p className='text-gray-600 dark:text-gray-400 mb-2'>
                  {scanProgress}
                </p>
                {scanStatus === 'analyzing' && (
                  <p className='text-sm text-gray-500 dark:text-gray-500 mb-6'>
                    Timeout in {remainingTime}s
                  </p>
                )}
                <button
                  onClick={cancelAnalysis}
                  className='px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 mx-auto'
                >
                  <X size={16} />
                  Cancel Analysis
                </button>
              </div>
            </div>
          )}

          {scanStatus === 'completed' && scanResult && (
            <div className='h-full overflow-auto scrollbar-thin'>
              <PerformanceReportView
                result={scanResult}
                request={request}
                onClose={() => setScanStatus('idle')}
                onRescan={startAnalysis}
              />
            </div>
          )}

          {scanStatus === 'error' && (
            <div className='flex items-center justify-center h-full p-8'>
              <div className='text-center max-w-md'>
                <AlertCircle className='w-16 h-16 text-red-500 mx-auto mb-4' />
                <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                  Analysis Failed
                </h3>
                <p className='text-gray-600 dark:text-gray-400 mb-6'>
                  Unable to complete the performance analysis. Please try again.
                </p>
                <Button onClick={() => setScanStatus('idle')}>
                  Retry Analysis
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
