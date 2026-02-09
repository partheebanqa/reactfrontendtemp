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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PerformanceAnalyzerResult } from '@/services/executeRequest.service';

interface PerformanceReportViewProps {
  result: PerformanceAnalyzerResult;
  request: {
    id: string;
    name: string;
    method: string;
    url: string;
  };
  onClose: () => void;
}

type ViewMode = 'summary' | 'detailed';

export default function PerformanceReportView({
  result,
  request,
  onClose,
}: PerformanceReportViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const [expandedChecks, setExpandedChecks] = useState<Set<string>>(new Set());

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

  return (
    <div className='fixed inset-0 bg-white z-50 overflow-auto'>
      <div className='sticky top-0 bg-white border-b border-gray-200 z-10'>
        <div className='max-w-7xl mx-auto px-6 py-4'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-3'>
              <FileText className='w-6 h-6 text-blue-600' />
              <h1 className='text-xl font-bold text-gray-900'>
                API Performance Analyzer
              </h1>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                onClick={() => setViewMode('summary')}
                variant={viewMode === 'summary' ? 'default' : 'outline'}
                size='sm'
              >
                View Success Report
              </Button>
              <Button
                onClick={() => setViewMode('detailed')}
                variant={viewMode === 'detailed' ? 'default' : 'outline'}
                size='sm'
              >
                View Failed Report
              </Button>
              <button
                onClick={onClose}
                className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
              >
                <X className='w-5 h-5 text-gray-500' />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className='max-w-7xl mx-auto px-6 py-8'>
        {/* Report Header */}
        <div className='bg-white border border-gray-200 rounded-lg p-6 mb-6'>
          <div className='flex items-start justify-between mb-4'>
            <div>
              <h2 className='text-2xl font-bold text-gray-900 mb-2'>
                API Performance Analysis Report
              </h2>
              <p className='text-gray-600'>{request.name}</p>
            </div>
            <div className='flex gap-2'>
              <Button variant='outline' size='sm'>
                <FileText className='w-4 h-4' />
                HTML
              </Button>
              <Button variant='outline' size='sm' className='text-green-600'>
                <Download className='w-4 h-4' />
                PDF
              </Button>
              <Button variant='outline' size='sm' className='text-purple-600'>
                <Share2 className='w-4 h-4' />
                Share
              </Button>
            </div>
          </div>

          <div className='flex items-center gap-8 text-sm text-gray-600'>
            <div className='flex items-center gap-2'>
              <Clock className='w-4 h-4' />
              <span>
                Duration:{' '}
                {new Date(result.completedAt).getTime() -
                  new Date(result.startedAt).getTime()}
                ms
              </span>
            </div>
            <div>
              <span className='font-medium'>Started:</span>{' '}
              {new Date(result.startedAt).toLocaleString()}
            </div>
            <div>
              <span className='font-medium'>Completed:</span>{' '}
              {new Date(result.completedAt).toLocaleString()}
            </div>
          </div>
        </div>

        <div className='grid grid-cols-3 gap-6'>
          {/* Left Column - Score and Recommendations */}
          <div className='space-y-6'>
            {/* Overall Performance Score */}
            <div className='bg-white border border-gray-200 rounded-lg p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-6'>
                Overall Performance Score
              </h3>

              <div className='flex flex-col items-center mb-6'>
                {/* Circular Progress */}
                <div className='relative w-48 h-48'>
                  <svg className='w-full h-full transform -rotate-90'>
                    <circle
                      cx='96'
                      cy='96'
                      r='88'
                      fill='none'
                      stroke='#e5e7eb'
                      strokeWidth='16'
                    />
                    <circle
                      cx='96'
                      cy='96'
                      r='88'
                      fill='none'
                      stroke={
                        result.overallScore >= 80
                          ? '#22c55e'
                          : result.overallScore >= 60
                            ? '#eab308'
                            : '#ef4444'
                      }
                      strokeWidth='16'
                      strokeDasharray={`${(result.overallScore / 100) * 553} 553`}
                      strokeLinecap='round'
                    />
                  </svg>
                  <div className='absolute inset-0 flex flex-col items-center justify-center'>
                    <div
                      className={`text-5xl font-bold ${getScoreColor(result.overallScore)}`}
                    >
                      {result.overallScore}
                    </div>
                    <div className='text-sm text-gray-500'>out of 100</div>
                  </div>
                </div>

                <div
                  className={`mt-4 px-4 py-2 rounded-full ${getGradeBgColor(result.grade)}`}
                >
                  <span className='font-semibold'>{result.grade}</span>
                </div>
              </div>
            </div>

            {/* Priority Recommendations */}
            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-6'>
              <div className='flex items-center gap-2 mb-4'>
                <AlertTriangle className='w-5 h-5 text-yellow-600' />
                <h3 className='text-lg font-semibold text-gray-900'>
                  Priority Recommendations
                </h3>
              </div>

              <div className='space-y-3'>
                {priorityRecommendations.length === 0 ? (
                  <p className='text-sm text-gray-600'>
                    No critical issues found. Great job!
                  </p>
                ) : (
                  priorityRecommendations.map((rec) => (
                    <div key={rec.priority} className='flex gap-3'>
                      <div className='flex-shrink-0 w-6 h-6 rounded-full bg-yellow-600 text-white flex items-center justify-center text-xs font-bold'>
                        {rec.priority}
                      </div>
                      <p className='text-sm text-gray-700 flex-1'>{rec.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Detailed Results */}
          <div className='col-span-2 space-y-6'>
            {/* Tabs */}
            <div className='bg-white border border-gray-200 rounded-lg'>
              <div className='border-b border-gray-200'>
                <div className='flex'>
                  <button
                    onClick={() => setViewMode('detailed')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      viewMode === 'detailed'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Detailed Results ({result.results.length})
                  </button>
                  <button
                    onClick={() => setViewMode('summary')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      viewMode === 'summary'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Summary
                  </button>
                </div>
              </div>

              <div className='p-6'>
                {viewMode === 'summary' && (
                  <div className='space-y-6'>
                    {/* Performance Overview */}
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                        Performance Overview
                      </h3>
                      <div className='grid grid-cols-4 gap-4'>
                        <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                          <div className='text-3xl font-bold text-green-600 mb-1'>
                            {performanceOverview.excellent}
                          </div>
                          <div className='text-sm text-green-700'>
                            Excellent
                          </div>
                        </div>
                        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
                          <div className='text-3xl font-bold text-yellow-600 mb-1'>
                            {performanceOverview.good}
                          </div>
                          <div className='text-sm text-yellow-700'>Good</div>
                        </div>
                        <div className='bg-orange-50 border border-orange-200 rounded-lg p-4'>
                          <div className='text-3xl font-bold text-orange-600 mb-1'>
                            {performanceOverview.needsWork}
                          </div>
                          <div className='text-sm text-orange-700'>
                            Needs Work
                          </div>
                        </div>
                        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                          <div className='text-3xl font-bold text-red-600 mb-1'>
                            {performanceOverview.critical}
                          </div>
                          <div className='text-sm text-red-700'>Critical</div>
                        </div>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                        Metadata
                      </h3>
                      <div className='space-y-2'>
                        <div className='flex justify-between py-2 border-b border-gray-100'>
                          <span className='text-sm text-gray-600'>
                            Analysis ID:
                          </span>
                          <span className='text-sm font-mono text-gray-900'>
                            {result.analyserId}
                          </span>
                        </div>
                        <div className='flex justify-between py-2 border-b border-gray-100'>
                          <span className='text-sm text-gray-600'>
                            Request ID:
                          </span>
                          <span className='text-sm font-mono text-gray-900'>
                            {result.requestId}
                          </span>
                        </div>
                        <div className='flex justify-between py-2'>
                          <span className='text-sm text-gray-600'>Status:</span>
                          <span className='text-sm font-semibold text-green-600'>
                            {result.status.charAt(0).toUpperCase() +
                              result.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {viewMode === 'detailed' && (
                  <div className='space-y-4'>
                    {result.results.map((check) => (
                      <div
                        key={check.name}
                        className={`border-l-4 ${getCheckBorderColor(check.passed, check.score)} bg-white border border-gray-200 rounded-lg overflow-hidden`}
                      >
                        <button
                          onClick={() => toggleCheckExpansion(check.name)}
                          className='w-full p-4 text-left hover:bg-gray-50 transition-colors'
                        >
                          <div className='flex items-center justify-between mb-2'>
                            <div className='flex items-center gap-3'>
                              {getCheckIcon(check.passed, check.score)}
                              <h4 className='font-semibold text-gray-900'>
                                {check.name}
                              </h4>
                            </div>
                            <div className='flex items-center gap-3'>
                              <div className='w-24 h-2 bg-gray-200 rounded-full overflow-hidden'>
                                <div
                                  className={`h-full ${getScoreBarColor(check.score)}`}
                                  style={{ width: `${check.score}%` }}
                                />
                              </div>
                              <span
                                className={`font-bold text-sm ${getScoreColor(check.score)}`}
                              >
                                {check.score}/100
                              </span>
                              {expandedChecks.has(check.name) ? (
                                <ChevronUp className='w-4 h-4 text-gray-400' />
                              ) : (
                                <ChevronDown className='w-4 h-4 text-gray-400' />
                              )}
                            </div>
                          </div>

                          <p className='text-sm text-gray-600'>
                            {check.details}
                          </p>
                        </button>

                        {expandedChecks.has(check.name) &&
                          check.suggestions.length > 0 && (
                            <div className='px-4 pb-4 bg-gray-50 border-t border-gray-200'>
                              <h5 className='text-sm font-semibold text-gray-700 mb-2 mt-3'>
                                Suggestions for Improvement:
                              </h5>
                              <ul className='space-y-1'>
                                {check.suggestions.map((suggestion, idx) => (
                                  <li
                                    key={idx}
                                    className='text-sm text-gray-600 flex items-start gap-2'
                                  >
                                    <span className='text-blue-500 mt-1'>
                                      •
                                    </span>
                                    <span>{suggestion}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='mt-8 pt-6 border-t border-gray-200 text-center'>
          <p className='text-sm text-gray-500 mb-1'>
            Generated on {new Date(result.completedAt).toLocaleString()}
          </p>
          <p className='text-xs text-gray-400'>
            API Performance Analysis System v2.0
          </p>
        </div>
      </div>
    </div>
  );
}
