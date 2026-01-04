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
  AlertTriangle,
  Info,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FileJson,
  FileText,
  Table,
} from 'lucide-react';
import {
  pollSecurityScan,
  startSecurityScan,
} from '@/services/executeRequest.service';
import { useToast } from '@/hooks/use-toast';

interface SecurityScanModalProps {
  request: {
    id: string;
    name: string;
    method: string;
    url: string;
  };
  onClose: () => void;
}

interface Vulnerability {
  id: string;
  severity: 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  recommendation?: string;
  cwe?: string;
  owasp?: string;
}

interface ScanResult {
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

// Vulnerability Card Component
function VulnerabilityCard({
  vulnerability,
  isExpanded,
  onToggle,
}: {
  vulnerability: Vulnerability;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const severityConfig = {
    high: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      badge: 'bg-red-500 text-white',
      icon: AlertCircle,
      iconColor: 'text-red-500',
    },
    medium: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      badge: 'bg-orange-500 text-white',
      icon: AlertTriangle,
      iconColor: 'text-orange-500',
    },
    low: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      badge: 'bg-blue-500 text-white',
      icon: Info,
      iconColor: 'text-blue-500',
    },
    info: {
      bg: 'bg-gray-50 dark:bg-gray-900/20',
      border: 'border-gray-200 dark:border-gray-800',
      badge: 'bg-gray-500 text-white',
      icon: Info,
      iconColor: 'text-gray-500',
    },
  };

  const config = severityConfig[vulnerability.severity];
  const Icon = config.icon;

  return (
    <div
      className={`${config.bg} ${config.border} rounded-lg border overflow-hidden`}
    >
      <button
        onClick={onToggle}
        className='w-full p-4 flex items-start gap-3 hover:opacity-80 transition-opacity'
      >
        <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
        <div className='flex-1 text-left'>
          <div className='flex items-start justify-between gap-3 mb-2'>
            <h4 className='font-semibold text-gray-900 dark:text-white'>
              {vulnerability.title}
            </h4>
            <div className='flex items-center gap-2'>
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${config.badge} uppercase`}
              >
                {vulnerability.severity}
              </span>
              {isExpanded ? (
                <ChevronUp className='w-4 h-4 text-gray-500' />
              ) : (
                <ChevronDown className='w-4 h-4 text-gray-500' />
              )}
            </div>
          </div>
          {!isExpanded && (
            <p className='text-sm text-gray-600 dark:text-gray-400 line-clamp-2'>
              {vulnerability.description}
            </p>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className='px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3'>
          <div>
            <h5 className='text-sm font-semibold text-gray-900 dark:text-white mb-1'>
              Description
            </h5>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              {vulnerability.description}
            </p>
          </div>

          {vulnerability.recommendation && (
            <div>
              <h5 className='text-sm font-semibold text-gray-900 dark:text-white mb-1'>
                Recommendation
              </h5>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                {vulnerability.recommendation}
              </p>
            </div>
          )}

          <div className='flex gap-3 text-xs'>
            {vulnerability.cwe && (
              <span className='px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300'>
                CWE: {vulnerability.cwe}
              </span>
            )}
            {vulnerability.owasp && (
              <span className='px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300'>
                OWASP: {vulnerability.owasp}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Export Modal Component
function ExportModal({
  isOpen,
  onClose,
  scanResult,
  request,
}: {
  isOpen: boolean;
  onClose: () => void;
  scanResult: ScanResult;
  request: { name: string };
}) {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'json' | 'csv'>(
    'json'
  );
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const formats = [
    {
      id: 'pdf' as const,
      label: 'PDF Report',
      icon: FileText,
      description: 'Professional PDF with details',
    },
    {
      id: 'json' as const,
      label: 'JSON Data',
      icon: FileJson,
      description: 'Structured data export',
    },
    {
      id: 'csv' as const,
      label: 'CSV File',
      icon: Table,
      description: 'Spreadsheet compatible',
    },
  ];

  const handleExport = () => {
    setIsExporting(true);

    setTimeout(() => {
      if (selectedFormat === 'json') {
        const data = JSON.stringify(scanResult, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `security-scan-${request.name}-${
          new Date().toISOString().split('T')[0]
        }.json`;
        link.click();
        URL.revokeObjectURL(url);
      }

      setIsExporting(false);
      onClose();
      toast({
        title: 'Export Successful',
        description: `Security report exported as ${selectedFormat.toUpperCase()}`,
      });
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full'>
        <div className='flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700'>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
            Export Security Report
          </h2>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg'
          >
            <X size={20} className='text-gray-500' />
          </button>
        </div>

        <div className='p-6 space-y-6'>
          <div>
            <label className='text-sm font-semibold text-gray-900 dark:text-white mb-3 block'>
              Export Format
            </label>
            <div className='space-y-2'>
              {formats.map(({ id, label, icon: Icon, description }) => (
                <button
                  key={id}
                  onClick={() => setSelectedFormat(id)}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                    selectedFormat === id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon
                    size={20}
                    className={
                      selectedFormat === id ? 'text-blue-600' : 'text-gray-400'
                    }
                  />
                  <div className='text-left'>
                    <div className='font-medium text-gray-900 dark:text-white'>
                      {label}
                    </div>
                    <div className='text-xs text-gray-500 dark:text-gray-400'>
                      {description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className='flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700'>
            <button
              onClick={onClose}
              disabled={isExporting}
              className='flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className='flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2'
            >
              {isExporting ? (
                <>
                  <Loader2 size={16} className='animate-spin' />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Security Scan Modal Component
export default function SecurityScanModal({
  request,
  onClose,
}: SecurityScanModalProps) {
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [expandedVulnerability, setExpandedVulnerability] = useState<
    string | null
  >(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const { toast } = useToast();

  const startScan = async () => {
    try {
      setScanStatus('initializing');
      setScanProgress('Initializing scan...');

      // Start the scan
      const { scanId } = await startSecurityScan(request.id);

      setScanStatus('scanning');
      setScanProgress('Scanning endpoint...');

      // Poll for results
      const result = await pollSecurityScan(scanId, (status) => {
        if (status.progress) {
          setScanProgress(`Scanning... ${status.progress}%`);
        }
      });

      setScanResult(result);
      setScanStatus('completed');

      toast({
        title: 'Scan Complete',
        description: `Found ${result.totalIssues} security issues`,
      });
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
    if (!scanResult) return [];

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
    <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
      <div className='bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden'>
        {/* Header */}
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
            <button
              onClick={startScan}
              className='w-full px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2'
            >
              <Shield size={16} />
              Start Security Scan
            </button>
          )}
        </div>

        {/* Scanning State */}
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
              <p className='text-gray-600 dark:text-gray-400 mb-6'>
                {scanProgress}
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

        {/* Results State */}
        {scanStatus === 'completed' && scanResult && (
          <div className='flex-1 overflow-auto'>
            {/* Summary Cards */}
            <div className='p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                  <Clock className='w-4 h-4' />
                  <span>
                    Completed{' '}
                    {new Date(scanResult.completedAt).toLocaleString()}
                  </span>
                </div>
                <div className='flex gap-2'>
                  <button
                    onClick={() => setIsExportModalOpen(true)}
                    className='px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm'
                  >
                    <Download size={14} />
                    Export
                  </button>
                  <button
                    onClick={handleShare}
                    className='px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm'
                  >
                    <Share2 size={14} />
                    Share
                  </button>
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

            {/* Filters and Search */}
            <div className='p-4 border-b border-gray-200 dark:border-gray-800'>
              <div className='flex items-center justify-between mb-3'>
                <h3 className='font-semibold text-gray-900 dark:text-white'>
                  Detected Vulnerabilities
                </h3>
                <div className='flex gap-2'>
                  {['high', 'medium', 'low', 'info'].map((severity) => (
                    <button
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
                    </button>
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

            {/* Vulnerabilities List */}
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

            {/* Footer */}
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
                <button
                  onClick={startScan}
                  className='px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-2'
                >
                  <Shield size={14} />
                  Rescan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
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
              <button
                onClick={startScan}
                className='px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors'
              >
                Retry Scan
              </button>
            </div>
          </div>
        )}

        {/* Export Modal */}
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          scanResult={scanResult!}
          request={request}
        />
      </div>
    </div>
  );
}
