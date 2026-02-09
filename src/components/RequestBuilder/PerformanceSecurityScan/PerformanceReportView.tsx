'use client';

import React, { useState } from 'react';
import {
  X,
  Download,
  Share2,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Filter,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { PerformanceAnalyzerResult } from '@/services/executeRequest.service';
import {
  downloadPerformanceReportAsPDF,
  downloadPerformanceReportAsHTML,
  sharePerformanceReport,
} from '@/utils/performanceExportUtils';

interface PerformanceReportViewProps {
  result: PerformanceAnalyzerResult;
  request: {
    id: string;
    name: string;
    method: string;
    url: string;
  };
  onClose: () => void;
  onRescan: () => void;
}

type ViewMode = 'summary' | 'detailed';
type FilterMode = 'all' | 'passed' | 'failed';

export default function PerformanceReportView({
  result,
  request,
  onClose,
  onRescan,
}: PerformanceReportViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('detailed');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [expandedChecks, setExpandedChecks] = useState<Set<string>>(new Set());

  const { toast } = useToast();

  const toggleCheckExpansion = (checkName: string) => {
    const newExpanded = new Set(expandedChecks);
    if (newExpanded.has(checkName)) {
      newExpanded.delete(checkName);
    } else {
      newExpanded.add(checkName);
    }
    setExpandedChecks(newExpanded);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBorderColor = (score: number) => {
    if (score >= 80) return 'border-green-500';
    if (score >= 60) return 'border-yellow-500';
    return 'border-red-500';
  };

  const getGradeBgColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-700';
    if (grade.startsWith('B')) return 'bg-yellow-100 text-yellow-700';
    if (grade.startsWith('C')) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  const getCheckIcon = (passed: boolean, score: number) => {
    if (passed && score >= 80) {
      return <CheckCircle className='w-5 h-5 text-green-500' />;
    } else if (score >= 60) {
      return <Info className='w-5 h-5 text-yellow-500' />;
    } else {
      return <AlertCircle className='w-5 h-5 text-red-500' />;
    }
  };

  const getCheckBorderColor = (passed: boolean, score: number) => {
    if (passed && score >= 80) return 'border-l-green-500';
    if (score >= 60) return 'border-l-yellow-500';
    return 'border-l-red-500';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const performanceOverview = {
    excellent: result.results.filter((r) => r.score >= 90).length,
    good: result.results.filter((r) => r.score >= 70 && r.score < 90).length,
    needsWork: result.results.filter((r) => r.score >= 50 && r.score < 70)
      .length,
    critical: result.results.filter((r) => r.score < 50).length,
  };

  // Generate priority recommendations from failed/low-score checks
  const priorityRecommendations = result.results
    .filter((r) => !r.passed || r.score < 70)
    .slice(0, 5)
    .map((r, idx) => ({
      priority: idx + 1,
      text: r.suggestions[0] || r.details,
      check: r.name,
    }));

  // Filter results based on selected filter mode
  const filteredResults = result.results.filter((check) => {
    if (filterMode === 'all') return true;
    if (filterMode === 'passed') return check.passed;
    if (filterMode === 'failed') return !check.passed;
    return true;
  });

  const handleShare = async () => {
    try {
      const shareResult = await sharePerformanceReport(result, request);

      if (shareResult.method === 'cancelled') {
        return;
      }

      if (shareResult.method === 'shared') {
        toast({
          title: 'Shared Successfully',
          description: 'Performance report shared',
        });
      } else if (
        shareResult.method === 'clipboard' ||
        shareResult.method === 'execCommand'
      ) {
        toast({
          title: 'Copied to Clipboard',
          description:
            'Performance report copied - you can now paste it anywhere',
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      toast({
        title: 'Share Failed',
        description: 'Failed to share performance report',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadPDF = async () => {
    try {
      await downloadPerformanceReportAsPDF(
        'performance-report-content',
        `${request.name}_performance_report.pdf`,
      );
      toast({
        title: 'PDF Downloaded',
        description: 'Performance report downloaded as PDF',
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
    try {
      downloadPerformanceReportAsHTML(
        result,
        request,
        `${request.name}_performance_report.html`,
      );
      toast({
        title: 'HTML Downloaded',
        description: 'Performance report downloaded as HTML',
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

  return (
    <div className='w-full bg-white dark:bg-gray-900'>
      <div id='performance-report-content'>
        {/* Report Header - Simplified */}
        <div className='bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4'>
          <div className='flex items-center justify-between'>
            {/* Left side: Report + Duration + Completed */}
            <div className='flex items-center gap-6'>
              <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                <Clock className='w-4 h-4' />
                <span>
                  Duration:{' '}
                  {new Date(result.completedAt).getTime() -
                    new Date(result.startedAt).getTime()}
                  ms
                </span>
              </div>

              <div className='text-sm text-gray-600 dark:text-gray-400'>
                <span className='font-medium'>Completed:</span>{' '}
                {new Date(result.completedAt).toLocaleString()}
              </div>
            </div>

            {/* Right side: buttons */}
            <div className='flex items-center gap-2'>
              <Button
                onClick={() => setViewMode('summary')}
                variant={viewMode === 'summary' ? 'default' : 'outline'}
                size='sm'
              >
                Summary
              </Button>
              <Button
                onClick={() => setViewMode('detailed')}
                variant={viewMode === 'detailed' ? 'default' : 'outline'}
                size='sm'
              >
                Detailed
              </Button>

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
                    <Button onClick={onRescan} size='sm'>
                      <Zap size={14} />
                      Rescan
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Run performance analysis again
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className='p-4'>
          <div className='grid grid-cols-3 gap-4'>
            {/* Left Column - Score and Recommendations */}
            <div className='space-y-4'>
              {/* Overall Performance Score */}
              <div className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4'>
                <h3 className='text-base font-semibold text-gray-900 dark:text-white mb-4'>
                  Overall Score
                </h3>

                <div className='flex flex-col items-center'>
                  {/* Circular Progress */}
                  <div className='relative w-32 h-32'>
                    <svg className='w-full h-full transform -rotate-90'>
                      <circle
                        cx='64'
                        cy='64'
                        r='56'
                        fill='none'
                        stroke='#e5e7eb'
                        strokeWidth='12'
                      />
                      <circle
                        cx='64'
                        cy='64'
                        r='56'
                        fill='none'
                        stroke={
                          result.overallScore >= 80
                            ? '#22c55e'
                            : result.overallScore >= 60
                              ? '#eab308'
                              : '#ef4444'
                        }
                        strokeWidth='12'
                        strokeDasharray={`${(result.overallScore / 100) * 352} 352`}
                        strokeLinecap='round'
                      />
                    </svg>
                    <div className='absolute inset-0 flex flex-col items-center justify-center'>
                      <div
                        className={`text-3xl font-bold ${getScoreColor(result.overallScore)}`}
                      >
                        {result.overallScore}
                      </div>
                      <div className='text-xs text-gray-500'>out of 100</div>
                    </div>
                  </div>

                  <div
                    className={`mt-3 px-3 py-1 rounded-full text-sm ${getGradeBgColor(result.grade)}`}
                  >
                    <span className='font-semibold'>{result.grade}</span>
                  </div>
                </div>
              </div>
              {/* Performance Overview */}
              <div className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4'>
                <h3 className='text-sm font-semibold text-gray-900 dark:text-white mb-3'>
                  Performance Overview
                </h3>
                <div className='grid grid-cols-2 gap-2'>
                  <div className='bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2'>
                    <div className='text-xl font-bold text-green-600'>
                      {performanceOverview.excellent}
                    </div>
                    <div className='text-xs text-green-700 dark:text-green-400'>
                      Excellent
                    </div>
                  </div>
                  <div className='bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2'>
                    <div className='text-xl font-bold text-yellow-600'>
                      {performanceOverview.good}
                    </div>
                    <div className='text-xs text-yellow-700 dark:text-yellow-400'>
                      Good
                    </div>
                  </div>
                  <div className='bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-2'>
                    <div className='text-xl font-bold text-orange-600'>
                      {performanceOverview.needsWork}
                    </div>
                    <div className='text-xs text-orange-700 dark:text-orange-400'>
                      Needs Work
                    </div>
                  </div>
                  <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2'>
                    <div className='text-xl font-bold text-red-600'>
                      {performanceOverview.critical}
                    </div>
                    <div className='text-xs text-red-700 dark:text-red-400'>
                      Critical
                    </div>
                  </div>
                </div>
              </div>

              {/* Priority Recommendations */}
              {priorityRecommendations.length > 0 && (
                <div className='bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4'>
                  <div className='flex items-center gap-2 mb-3'>
                    <AlertTriangle className='w-4 h-4 text-yellow-600' />
                    <h3 className='text-sm font-semibold text-gray-900 dark:text-white'>
                      Top Priorities
                    </h3>
                  </div>

                  <div className='space-y-2'>
                    {priorityRecommendations.map((rec) => (
                      <div key={rec.priority} className='flex gap-2'>
                        <div className='flex-shrink-0 w-5 h-5 rounded-full bg-yellow-600 text-white flex items-center justify-center text-xs font-bold'>
                          {rec.priority}
                        </div>
                        <p className='text-xs text-gray-700 dark:text-gray-300 flex-1'>
                          {rec.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Detailed Results */}
            <div className='col-span-2'>
              <div className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg'>
                <div className='border-b border-gray-200 dark:border-gray-800 p-3'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-sm font-semibold text-gray-900 dark:text-white'>
                      {viewMode === 'detailed'
                        ? `Detailed Results (${filteredResults.length})`
                        : 'Summary'}
                    </h3>

                    {/* Filter Buttons - Only show in detailed view */}
                    {viewMode === 'detailed' && (
                      <div className='flex items-center gap-2'>
                        <Filter className='w-4 h-4 text-gray-400' />
                        <div className='flex gap-1'>
                          <Button
                            onClick={() => setFilterMode('all')}
                            variant={
                              filterMode === 'all' ? 'default' : 'outline'
                            }
                            size='sm'
                            className='h-7 px-2 text-xs'
                          >
                            All ({result.results.length})
                          </Button>
                          <Button
                            onClick={() => setFilterMode('passed')}
                            variant={
                              filterMode === 'passed' ? 'default' : 'outline'
                            }
                            size='sm'
                            className='h-7 px-2 text-xs'
                          >
                            <CheckCircle className='w-3 h-3 mr-1' />
                            Passed (
                            {result.results.filter((r) => r.passed).length})
                          </Button>
                          <Button
                            onClick={() => setFilterMode('failed')}
                            variant={
                              filterMode === 'failed' ? 'default' : 'outline'
                            }
                            size='sm'
                            className='h-7 px-2 text-xs'
                          >
                            <AlertCircle className='w-3 h-3 mr-1' />
                            Failed (
                            {result.results.filter((r) => !r.passed).length})
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className='p-4 max-h-[600px] overflow-y-auto scrollbar-thin'>
                  {viewMode === 'summary' && (
                    <div className='space-y-4'>
                      {/* Metadata */}
                      <div>
                        <h4 className='text-sm font-semibold text-gray-900 dark:text-white mb-2'>
                          Metadata
                        </h4>
                        <div className='space-y-1'>
                          <div className='flex justify-between py-1 border-b border-gray-100 dark:border-gray-800'>
                            <span className='text-xs text-gray-600 dark:text-gray-400'>
                              Analysis ID:
                            </span>
                            <span className='text-xs font-mono text-gray-900 dark:text-white'>
                              {result.analyserId}
                            </span>
                          </div>
                          <div className='flex justify-between py-1 border-b border-gray-100 dark:border-gray-800'>
                            <span className='text-xs text-gray-600 dark:text-gray-400'>
                              Request ID:
                            </span>
                            <span className='text-xs font-mono text-gray-900 dark:text-white'>
                              {result.requestId}
                            </span>
                          </div>
                          <div className='flex justify-between py-1'>
                            <span className='text-xs text-gray-600 dark:text-gray-400'>
                              Status:
                            </span>
                            <span className='text-xs font-semibold text-green-600'>
                              {result.status.charAt(0).toUpperCase() +
                                result.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {viewMode === 'detailed' && (
                    <>
                      {filteredResults.length === 0 ? (
                        <div className='flex flex-col items-center justify-center py-12 text-center'>
                          <Info className='w-12 h-12 text-gray-400 mb-3' />
                          <p className='text-sm text-gray-600 dark:text-gray-400'>
                            No results match the selected filter
                          </p>
                          <Button
                            onClick={() => setFilterMode('all')}
                            variant='outline'
                            size='sm'
                            className='mt-3'
                          >
                            Show All Results
                          </Button>
                        </div>
                      ) : (
                        <div className='space-y-2'>
                          {filteredResults.map((check) => (
                            <div
                              key={check.name}
                              className={`border-l-4 ${getCheckBorderColor(check.passed, check.score)} bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden`}
                            >
                              <button
                                onClick={() => toggleCheckExpansion(check.name)}
                                className='w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
                              >
                                <div className='flex items-center justify-between mb-1'>
                                  <div className='flex items-center gap-2'>
                                    {getCheckIcon(check.passed, check.score)}
                                    <h4 className='text-sm font-semibold text-gray-900 dark:text-white'>
                                      {check.name}
                                    </h4>
                                  </div>
                                  <div className='flex items-center gap-2'>
                                    <div className='w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden'>
                                      <div
                                        className={`h-full ${getScoreBarColor(check.score)}`}
                                        style={{ width: `${check.score}%` }}
                                      />
                                    </div>
                                    <span
                                      className={`text-xs font-bold ${getScoreColor(check.score)}`}
                                    >
                                      {check.score}
                                    </span>
                                    {expandedChecks.has(check.name) ? (
                                      <ChevronUp className='w-4 h-4 text-gray-400' />
                                    ) : (
                                      <ChevronDown className='w-4 h-4 text-gray-400' />
                                    )}
                                  </div>
                                </div>

                                <p className='text-xs text-gray-600 dark:text-gray-400'>
                                  {check.details}
                                </p>
                              </button>

                              {expandedChecks.has(check.name) &&
                                check.suggestions.length > 0 && (
                                  <div className='px-3 pb-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700'>
                                    <h5 className='text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 mt-2'>
                                      Suggestions:
                                    </h5>
                                    <ul className='space-y-1'>
                                      {check.suggestions.map(
                                        (suggestion, idx) => (
                                          <li
                                            key={idx}
                                            className='text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2'
                                          >
                                            <span className='text-blue-500 mt-0.5'>
                                              •
                                            </span>
                                            <span>{suggestion}</span>
                                          </li>
                                        ),
                                      )}
                                    </ul>
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
