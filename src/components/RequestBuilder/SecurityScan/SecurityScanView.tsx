'use client';

import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import {
  pollSecurityScan,
  startSecurityScan,
} from '@/services/executeRequest.service';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ExportModal } from './Export';
import { VulnerabilityCard } from './VulnerabilityCard';

export interface SecurityScanViewProps {
  request: {
    id: string;
    name: string;
    method: string;
    url: string;
  };
  onClose: () => void;
}

export interface Vulnerability {
  id: string;
  severity: 'high' | 'medium' | 'low' | 'info';
  confidence?: 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
  recommendation?: string;
  cwe?: string;
  owasp?: string;
}

export interface ScanResult {
  scanId: string;
  completedAt: string;
  totalIssues: number;
  highSeverity: number;
  mediumSeverity: number;
  lowSeverity: number;
  informational: number;
  vulnerabilities: Vulnerability[];
  passedChecks: number;
}

type ScanStatus = 'idle' | 'initializing' | 'scanning' | 'completed' | 'error';

export default function SecurityScanView({
  request,
  onClose,
}: SecurityScanViewProps) {
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [expandedVulnerability, setExpandedVulnerability] = useState<
    string | null
  >(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const [remainingTime, setRemainingTime] = useState(60);
  const { toast } = useToast();

  const startScan = async () => {
    try {
      setScanStatus('initializing');
      setScanProgress('Initializing scan...');
      setRemainingTime(60);

      const { scanId } = await startSecurityScan(request.id);

      setScanStatus('scanning');
      setScanProgress('Scanning endpoint...');

      const timerInterval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      try {
        const result = await pollSecurityScan(scanId, (status) => {
          if (status.progress) {
            setScanProgress(`Scanning... ${status.progress}%`);
          }
        });

        clearInterval(timerInterval);
        setScanResult(result);
        setScanStatus('completed');

        toast({
          title: 'Scan Complete',
          description: `Found ${result.totalIssues} security issues`,
        });
      } catch (pollError: any) {
        clearInterval(timerInterval);
        throw pollError;
      }
    } catch (error: any) {
      console.error('Security scan failed:', error);
      setScanStatus('error');
      toast({
        title: 'Scan Failed',
        description: error.message || 'Failed to complete security scan',
        variant: 'destructive',
      });
    }
  };

  const cancelScan = () => {
    setScanStatus('idle');
    setScanProgress('');
    setRemainingTime(60);
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
      active: 'bg-green-500 text-white',
      hover:
        'hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600',
    },
    info: {
      active: 'bg-yellow-500 text-white',
      hover:
        'hover:bg-yellow-100 dark:hover:bg-yellow-900/30 hover:text-yellow-600',
    },
  };

  const handleShare = async () => {
    if (!scanResult) return;

    const summaryText = `
Security Scan Results: ${request.name}
Completed: ${new Date(scanResult.completedAt).toLocaleString()}

Total Issues: ${scanResult.totalIssues}
High Severity: ${scanResult.highSeverity}
Medium Severity: ${scanResult.mediumSeverity}
Low Severity: ${scanResult.lowSeverity}
Informational: ${scanResult.informational}
Passed Checks: ${scanResult.passedChecks}
    `.trim();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Security Scan: ${request.name}`,
          text: summaryText,
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    } else {
      await navigator.clipboard.writeText(summaryText);
      toast({
        title: 'Copied to Clipboard',
        description: 'Summary copied to clipboard',
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

  return (
    <div className='bg-white dark:bg-gray-900 w-full h-full flex flex-col overflow-hidden'>
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

      {scanStatus === 'idle' && (
        <div className='flex-1 flex items-center justify-center px-6'>
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
        <div className='flex-1 flex items-center justify-center p-8'>
          <div className='text-center max-w-md'>
            <div className='relative w-20 h-20 mx-auto mb-6'>
              <Loader2 className='w-20 h-20 text-blue-500 animate-spin' />
              <Shield className='w-10 h-10 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' />
            </div>
            <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
              Scanning API Endpoint
            </h3>
            <p className='text-gray-600 dark:text-gray-400 mb-2'>
              {scanProgress}
            </p>
            <p className='text-sm text-gray-500 dark:text-gray-500 mb-6'>
              Timeout in {remainingTime}s
            </p>
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
        <div className='flex-1 overflow-auto'>
          <div className=' border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                <Clock className='w-4 h-4' />
                <span>
                  Completed {new Date(scanResult.completedAt).toLocaleString()}
                </span>
              </div>
              <div className='flex gap-2'>
                <Button onClick={() => setIsExportModalOpen(true)}>
                  <Download size={14} />
                  Export
                </Button>
                <Button onClick={handleShare}>
                  <Share2 size={14} />
                  Share
                </Button>
              </div>
            </div>

            <div className='flex gap-2'>
              {/* Total */}
              <div className='flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 min-w-0'>
                <div className='text-xs text-slate-600 dark:text-slate-400 mb-1 font-medium'>
                  Total Issues
                </div>
                <div className='text-2xl font-bold text-slate-900 dark:text-white'>
                  {scanResult.totalIssues}
                </div>
              </div>

              {/* High - Red */}
              <div className='flex-1 bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800 min-w-0'>
                <div className='text-xs text-red-700 dark:text-red-400 mb-1 font-medium'>
                  High Severity
                </div>
                <div className='text-2xl font-bold text-red-600 dark:text-red-400'>
                  {scanResult.highSeverity}
                </div>
              </div>

              {/* Medium - Orange */}
              <div className='flex-1 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800 min-w-0'>
                <div className='text-xs text-orange-700 dark:text-orange-400 mb-1 font-medium'>
                  Medium Severity
                </div>
                <div className='text-2xl font-bold text-orange-600 dark:text-orange-400'>
                  {scanResult.mediumSeverity}
                </div>
              </div>

              {/* Low - Light Green */}
              <div className='flex-1 bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800 min-w-0'>
                <div className='text-xs text-green-700 dark:text-green-400 mb-1 font-medium'>
                  Low Severity
                </div>
                <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
                  {scanResult.lowSeverity}
                </div>
              </div>

              {/* Informational - Yellow */}
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
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors
          ${
            isActive
              ? styles.active
              : `bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 ${styles.hover}`
          }
        `}
                      >
                        {severity.charAt(0).toUpperCase() + severity.slice(1)}
                      </Button>
                    );
                  }
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
                      expandedVulnerability === vuln.id ? null : vuln.id
                    )
                  }
                />
              ))
            )}
          </div>

          <div className='p-4 border-t border-gray-200 dark:border-gray-800'>
            <div className='flex items-center justify-between text-sm'>
              <div className='flex items-center gap-4'>
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
              <Button onClick={startScan}>
                <Shield size={14} />
                Rescan
              </Button>
            </div>
          </div>
        </div>
      )}

      {scanStatus === 'error' && (
        <div className='flex-1 flex items-center justify-center p-8'>
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

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        scanResult={scanResult!}
        request={request}
      />
    </div>
  );
}
