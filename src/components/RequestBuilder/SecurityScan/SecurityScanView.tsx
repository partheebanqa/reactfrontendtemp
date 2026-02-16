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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { VulnerabilityCard } from './VulnerabilityCard';
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

export interface SecurityScanViewProps {
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

export default function SecurityScanView({
  request,
  environmentId,
  preRequestId,
  onClose,
}: SecurityScanViewProps) {
  const { currentWorkspace } = useWorkspace();
  console.log('currentWorkspace111:', currentWorkspace);

  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [expandedVulnerability, setExpandedVulnerability] = useState<
    string | null
  >(null);
  const [scanProgress, setScanProgress] = useState('');
  const [remainingTime, setRemainingTime] = useState(60);
  const [selectedHistoryScan, setSelectedHistoryScan] = useState<string | null>(
    null,
  );
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);

  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    data: historyData,
    isLoading: loadingHistory,
    refetch: refetchHistory,
  } = useScanHistory(currentWorkspace.id || '');
  const { executeScan, isLoading: isScanning } = useSecurityScanFlow(
    currentWorkspace.id || '',
  );
  const loadHistoricalMutation = useLoadHistoricalScan();

  useEffect(() => {
    if (scanStatus === 'idle') {
      setIsHistoryOpen(true);
    } else {
      setIsHistoryOpen(false);
    }
  }, [scanStatus]);

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

  const startScan = async () => {
    try {
      abortControllerRef.current = new AbortController();

      setScanStatus('initializing');
      setScanProgress('Initializing scan...');
      setRemainingTime(60);
      setSelectedHistoryScan(null);

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

      setScanStatus('scanning');
      setScanProgress('Scanning endpoint...');

      const result = await executeScan(
        request.id,
        (status) => {
          if (abortControllerRef.current?.signal.aborted) {
            throw new Error('Scan cancelled');
          }
          if (status.progress) {
            setScanProgress(`Scanning... ${status.progress}%`);
          }
        },
        abortControllerRef.current.signal,
        environmentId,
        preRequestId,
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
        title: 'Scan Complete',
        description: `Found ${result.totalIssues} security issues`,
      });

      // Refetch history to show the new scan
      refetchHistory();
    } catch (error: any) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      if (error.message === 'Scan cancelled') {
        return;
      }

      console.error('Security scan failed:', error);
      setScanStatus('error');
      toast({
        title: 'Scan Failed',
        description: error.message || 'Failed to complete security scan',
        variant: 'destructive',
      });
    } finally {
      abortControllerRef.current = null;
    }
  };

  const cancelScan = () => {
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
      title: 'Scan Cancelled',
      description: 'Security scan has been cancelled',
    });
  };

  const loadHistoryScan = async (scanId: string) => {
    try {
      setSelectedHistoryScan(scanId);
      setScanStatus('scanning');
      setScanProgress('Loading historical scan...');

      const result = await loadHistoricalMutation.mutateAsync({ scanId });

      setScanResult(result);
      setScanStatus('completed');

      toast({
        title: 'Historical Scan Loaded',
        description: 'Previous scan results loaded successfully',
      });
    } catch (error: any) {
      console.error('Failed to load historical scan:', error);
      toast({
        title: 'Failed to Load Scan',
        description: error.message || 'Could not load historical scan',
        variant: 'destructive',
      });
      setScanStatus('error');
      setSelectedHistoryScan(null);
    }
  };

  const severityStyles = {
    high: {
      active: 'bg-red-500 text-white',
      hover: 'hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600',
    },
    medium: {
      active: 'bg-orange-500 text-white',
      hover:
        'hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-600',
    },
    low: {
      active: 'bg-sky-500 text-white',
      hover: 'hover:bg-sky-100 dark:hover:bg-sky-900/30',
    },
    info: {
      active: 'bg-yellow-500 text-white',
      hover:
        'hover:bg-yellow-100 dark:hover:bg-yellow-900/30 hover:text-yellow-600',
    },
  };

  const handleShare = async () => {
    if (!scanResult) return;

    try {
      const result = await shareSecurityScan(scanResult, request);

      if (result.method === 'cancelled') {
        return;
      }

      if (result.method === 'shared') {
        toast({
          title: 'Shared Successfully',
          description: 'Security scan summary shared',
        });
      } else if (
        result.method === 'clipboard' ||
        result.method === 'execCommand'
      ) {
        toast({
          title: 'Copied to Clipboard',
          description:
            'Security scan summary copied - you can now paste it anywhere',
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      toast({
        title: 'Share Failed',
        description: 'Failed to share security scan',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadPDF = async () => {
    if (!scanResult) return;

    try {
      await downloadSecurityScanAsPDF(
        'security-scan-content',
        `${request.name}_security_scan.pdf`,
      );
      toast({
        title: 'PDF Downloaded',
        description: 'Security scan report downloaded as PDF',
      });
    } catch (error) {
      console.error('PDF download error:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download PDF',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadHTML = () => {
    if (!scanResult) return;

    try {
      downloadSecurityScanAsHTML(
        scanResult,
        request,
        `${request.name}_security_scan.html`,
      );
      toast({
        title: 'HTML Downloaded',
        description: 'Security scan report downloaded as HTML',
      });
    } catch (error) {
      console.error('HTML download error:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download HTML',
        variant: 'destructive',
      });
    }
  };

  const filteredVulnerabilities = useMemo(() => {
    if (!scanResult?.vulnerabilities) return [];

    return scanResult.vulnerabilities.filter((vuln) => {
      const matchesSearch =
        vuln.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vuln.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSeverity =
        selectedSeverity === 'all' || vuln.severity === selectedSeverity;
      return matchesSearch && matchesSeverity;
    });
  }, [scanResult, searchQuery, selectedSeverity]);

  const scanHistory = historyData?.scans || [];

  return (
    <div className='bg-white dark:bg-gray-900 w-full h-full flex flex-col overflow-hidden'>
      {/* Header */}
      <div className='border-b border-gray-200 dark:border-gray-800 pt-4 px-4 flex-shrink-0'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-1'>
              <Shield className='w-5 h-5 text-blue-500' />
              <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                Security Scan{' '}
                <span className='text-sm italic font-normal text-gray-500 dark:text-gray-400'>
                  (powered by ZAP proxy)
                </span>
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
        {/* LEFT COLUMN - Collapsible Scan History */}
        <div
          className={`border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden transition-all duration-300 ${
            isHistoryOpen ? 'w-80' : 'w-0'
          }`}
        >
          <div className='p-4 border-b border-gray-200 dark:border-gray-800'>
            <h3 className='font-semibold text-gray-900 dark:text-white flex items-center gap-2'>
              <Clock className='w-4 h-4' />
              Scan History
            </h3>
          </div>

          <div className='flex-1 overflow-auto p-3 space-y-2 scrollbar-thin'>
            {loadingHistory ? (
              <div className='flex items-center justify-center py-8'>
                <Loader2 className='w-6 h-6 animate-spin text-gray-400' />
              </div>
            ) : scanHistory.length === 0 ? (
              <div className='text-center py-8 text-sm text-gray-500'>
                No previous scans
              </div>
            ) : (
              scanHistory.map((scan) => (
                <button
                  key={scan.id}
                  onClick={() => loadHistoryScan(scan.id)}
                  disabled={loadHistoricalMutation.isPending}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedHistoryScan === scan.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className='flex items-center justify-between mb-2'>
                    <div className='flex items-center gap-2'>
                      {scan.status === 'completed' ? (
                        <CheckCircle className='w-4 h-4 text-green-500' />
                      ) : scan.status === 'running' ? (
                        <Loader2 className='w-4 h-4 text-blue-500 animate-spin' />
                      ) : (
                        <AlertCircle className='w-4 h-4 text-gray-400' />
                      )}
                      <span className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                        {new Date(scan.startTime).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className='text-xs text-gray-500 dark:text-gray-500 mb-2'>
                    {new Date(scan.startTime).toLocaleTimeString()}
                  </div>

                  <div className='flex gap-2 text-xs flex-wrap'>
                    {scan.highRisk > 0 && (
                      <span className='px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded'>
                        H: {scan.highRisk}
                      </span>
                    )}
                    {scan.mediumRisk > 0 && (
                      <span className='px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded'>
                        M: {scan.mediumRisk}
                      </span>
                    )}
                    {scan.lowRisk > 0 && (
                      <span className='px-2 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded'>
                        L: {scan.lowRisk}
                      </span>
                    )}
                    <span className='px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded'>
                      Total: {scan.totalAlerts}
                    </span>
                  </div>
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

        {/* RIGHT COLUMN - Scan Interface */}
        <div className='flex-1 overflow-auto scrollbar-thin'>
          {scanStatus === 'idle' && (
            <div className='flex items-center justify-center h-full px-6'>
              <div className='text-center max-w-md'>
                <div className='relative mb-6'>
                  <div className='w-32 h-32 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto'>
                    <Shield className='w-14 h-14 text-blue-600' />
                  </div>
                </div>

                <h3 className='text-2xl font-semibold text-gray-900 dark:text-white mb-2'>
                  Ready to Scan
                </h3>

                <p className='text-gray-600 dark:text-gray-400 mb-8'>
                  Analyze your API endpoint for security vulnerabilities,
                  misconfigurations, and best practice violations.
                </p>

                <Button onClick={startScan}>
                  <Play className='w-4 h-4' />
                  Start Security Scan
                </Button>
              </div>
            </div>
          )}

          {(scanStatus === 'initializing' || scanStatus === 'scanning') && (
            <div className='flex items-center justify-center h-full p-8'>
              <div className='text-center max-w-md'>
                <div className='relative w-20 h-20 mx-auto mb-6'>
                  <Loader2 className='w-20 h-20 text-blue-500 animate-spin' />
                  <Shield className='w-10 h-10 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' />
                </div>
                <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                  {scanStatus === 'initializing'
                    ? 'Initializing Scan'
                    : 'Scanning API Endpoint'}
                </h3>
                <p className='text-gray-600 dark:text-gray-400 mb-2'>
                  {scanProgress}
                </p>
                {scanStatus === 'scanning' && (
                  <p className='text-sm text-gray-500 dark:text-gray-500 mb-6'>
                    Timeout in {remainingTime}s
                  </p>
                )}
                <button
                  onClick={cancelScan}
                  className='px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 mx-auto'
                >
                  <X size={16} />
                  Cancel Scan
                </button>
              </div>
            </div>
          )}

          {scanStatus === 'completed' && scanResult && (
            <div className='h-full overflow-auto scrollbar-thin'>
              <div id='security-scan-content'>
                <div className='border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4'>
                  <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                      <Clock className='w-4 h-4' />
                      <span>
                        Completed{' '}
                        {new Date(scanResult.completedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className='flex gap-2'>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={handleDownloadHTML}
                              className='p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors'
                            >
                              <FileText className='w-5 h-5' />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Download HTML</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={handleDownloadPDF}
                              className='p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors'
                            >
                              <Download className='w-5 h-5' />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Download PDF</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={handleShare}
                              className='p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors'
                            >
                              <Share2 className='w-5 h-5' />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Share Report</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button onClick={startScan} size='sm'>
                              <Shield size={14} />
                              Rescan
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Run security scan again
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <div className='flex gap-2'>
                    <div className='flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 min-w-0'>
                      <div className='text-xs text-slate-600 dark:text-slate-400 mb-1 font-medium'>
                        Total Issues
                      </div>
                      <div className='text-2xl font-bold text-slate-900 dark:text-white'>
                        {scanResult.totalIssues}
                      </div>
                    </div>

                    <div className='flex-1 bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800 min-w-0'>
                      <div className='text-xs text-red-700 dark:text-red-400 mb-1 font-medium'>
                        High Severity
                      </div>
                      <div className='text-2xl font-bold text-red-600 dark:text-red-400'>
                        {scanResult.highSeverity}
                      </div>
                    </div>

                    <div className='flex-1 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800 min-w-0'>
                      <div className='text-xs text-orange-700 dark:text-orange-400 mb-1 font-medium'>
                        Medium Severity
                      </div>
                      <div className='text-2xl font-bold text-orange-600 dark:text-orange-400'>
                        {scanResult.mediumSeverity}
                      </div>
                    </div>

                    <div className='flex-1 bg-sky-50 dark:bg-sky-900/20 rounded-lg p-3 border border-sky-200 dark:border-sky-800 min-w-0'>
                      <div className='text-xs text-sky-700 dark:text-sky-400 mb-1 font-medium'>
                        Low Severity
                      </div>
                      <div className='text-2xl font-bold text-sky-600 dark:text-sky-400'>
                        {scanResult.lowSeverity}
                      </div>
                    </div>

                    <div className='flex-1 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800 min-w-0'>
                      <div className='text-xs text-yellow-700 dark:text-yellow-400 mb-1 font-medium'>
                        Informational
                      </div>
                      <div className='text-2xl font-bold text-yellow-600 dark:text-yellow-400'>
                        {scanResult.informational}
                      </div>
                    </div>
                  </div>
                </div>

                <div className='p-4 border-b border-gray-200 dark:border-gray-800'>
                  <div className='flex items-center justify-between mb-3'>
                    <h3 className='font-semibold text-gray-900 dark:text-white'>
                      Detected Vulnerabilities
                    </h3>
                    <div className='flex gap-2'>
                      {(['high', 'medium', 'low', 'info'] as const).map(
                        (severity) => {
                          const isActive = selectedSeverity === severity;
                          const styles = severityStyles[severity];

                          return (
                            <Button
                              key={severity}
                              onClick={() =>
                                setSelectedSeverity(isActive ? 'all' : severity)
                              }
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                isActive
                                  ? styles.active
                                  : `bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 ${styles.hover}`
                              }`}
                            >
                              {severity.charAt(0).toUpperCase() +
                                severity.slice(1)}
                            </Button>
                          );
                        },
                      )}
                    </div>
                  </div>

                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                    <input
                      type='text'
                      placeholder='Search vulnerabilities...'
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    />
                  </div>
                </div>

                <div className='p-4 space-y-3'>
                  {filteredVulnerabilities.length === 0 ? (
                    <div className='text-center py-12'>
                      <CheckCircle className='w-12 h-12 text-green-500 mx-auto mb-3' />
                      <p className='text-gray-600 dark:text-gray-400'>
                        No vulnerabilities found matching your criteria
                      </p>
                    </div>
                  ) : (
                    filteredVulnerabilities.map((vuln) => (
                      <VulnerabilityCard
                        key={vuln.id}
                        vulnerability={vuln}
                        isExpanded={expandedVulnerability === vuln.id}
                        onToggle={() =>
                          setExpandedVulnerability(
                            expandedVulnerability === vuln.id ? null : vuln.id,
                          )
                        }
                      />
                    ))
                  )}
                </div>

                <div className='p-4 border-t border-gray-200 dark:border-gray-800'>
                  <div className='flex items-center gap-4 text-sm'>
                    <div className='flex items-center gap-2'>
                      <AlertCircle className='w-4 h-4 text-red-500' />
                      <span className='text-gray-600 dark:text-gray-400'>
                        Vulnerabilities ({scanResult.totalIssues})
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <CheckCircle className='w-4 h-4 text-green-500' />
                      <span className='text-gray-600 dark:text-gray-400'>
                        Passed Checks ({scanResult.passedChecks})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {scanStatus === 'error' && (
            <div className='flex items-center justify-center h-full p-8'>
              <div className='text-center max-w-md'>
                <AlertCircle className='w-16 h-16 text-red-500 mx-auto mb-4' />
                <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                  Scan Failed
                </h3>
                <p className='text-gray-600 dark:text-gray-400 mb-6'>
                  Unable to complete the security scan. Please try again.
                </p>
                <Button onClick={startScan}>Retry Scan</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
