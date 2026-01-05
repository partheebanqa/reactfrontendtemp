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

  const handleShare = async () => {
    if (!scanResult) return;

    const summaryText = `
Security Scan Results: ${request.name}
Completed: ${new Date(scanResult.completedAt).toLocaleString()}

Total Issues: ${scanResult.totalIssues}
High Severity: ${scanResult.highSeverity}
Medium Severity: ${scanResult.mediumSeverity}
Low Severity: ${scanResult.lowSeverity}
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
      <div className='border-b border-gray-200 dark:border-gray-800 p-4 flex-shrink-0'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-1'>
              <Shield className='w-5 h-5 text-blue-500' />
              <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                Security Scan
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

        {scanStatus === 'idle' && (
          <Button
            onClick={startScan}
            className='w-full px-4 py-2.5  rounded-lg font-medium transition-colors flex items-center justify-center gap-2'
          >
            <Shield size={16} />
            Start Security Scan
          </Button>
        )}
      </div>

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
          <div className='p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50'>
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

            <div className='grid grid-cols-4 gap-3'>
              <div className='bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700'>
                <div className='text-xs text-gray-600 dark:text-gray-400 mb-1'>
                  Total Issues
                </div>
                <div className='text-2xl font-bold text-gray-900 dark:text-white'>
                  {scanResult.totalIssues}
                </div>
              </div>
              <div className='bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800'>
                <div className='text-xs text-red-700 dark:text-red-400 mb-1'>
                  High Severity
                </div>
                <div className='text-2xl font-bold text-red-600 dark:text-red-400'>
                  {scanResult.highSeverity}
                </div>
              </div>
              <div className='bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800'>
                <div className='text-xs text-orange-700 dark:text-orange-400 mb-1'>
                  Medium Severity
                </div>
                <div className='text-2xl font-bold text-orange-600 dark:text-orange-400'>
                  {scanResult.mediumSeverity}
                </div>
              </div>
              <div className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800'>
                <div className='text-xs text-blue-700 dark:text-blue-400 mb-1'>
                  Low Severity
                </div>
                <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                  {scanResult.lowSeverity}
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
                {['high', 'medium', 'low', 'info'].map((severity) => (
                  <Button
                    key={severity}
                    onClick={() =>
                      setSelectedSeverity(
                        severity === selectedSeverity ? 'all' : severity
                      )
                    }
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      selectedSeverity === severity
                        ? severity === 'high'
                          ? 'bg-red-500 text-white'
                          : severity === 'medium'
                          ? 'bg-orange-500 text-white'
                          : severity === 'low'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </Button>
                ))}
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
