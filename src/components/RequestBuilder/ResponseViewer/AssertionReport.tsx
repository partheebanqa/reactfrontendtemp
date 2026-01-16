import React, { useState } from 'react';
import {
  Check,
  X,
  ChevronLeft,
  RotateCcw,
  Clock,
  Share2,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ValidationResult {
  id: string;
  field?: string;
  type: string;
  expectedValue?: any;
  actualValue?: any;
  result: 'passed' | 'failed';
  failureReason?: string;
  category: string;
  description: string;
}

interface ValidationSummary {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
}

interface ValidationHistory {
  totalRuns: number;
  passes: number;
  failures: number;
  failureRate: number;
}

interface AssertionResultsProps {
  results: ValidationResult[];
  summary: ValidationSummary;
  timestamp: string;
  responseTime: string;
  validationHistory?: Record<string, ValidationHistory>;
  onBack?: () => void;
  onRerunAll?: () => void;
  onRerunFailed?: () => void;
  onShare?: () => void;
}

const AssertionResults: React.FC<AssertionResultsProps> = ({
  results,
  summary,
  timestamp,
  responseTime,
  validationHistory = {},
  onBack,
  onRerunAll,
  onRerunFailed,
  onShare,
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'category'>('table');
  const [tableFilterStatus, setTableFilterStatus] = useState<
    'all' | 'passed' | 'failed'
  >('all');
  const [tableFilterCategory, setTableFilterCategory] = useState('all');
  const [tableSortConfig, setTableSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({
    key: null,
    direction: 'asc',
  });
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    headers: true,
    body: true,
    'HeaderGuard™': true,
    performance: true,
    status: true,
  });

  const successRate = Math.round((summary.passed / summary.total) * 100);

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, ValidationResult[]>);

  const categoryLabels: Record<string, string> = {
    headers: 'Response Headers',
    body: 'Request Body Fields',
    'HeaderGuard™': 'Security Headers Guard',
    performance: 'Performance Checks',
    status: 'Status Code',
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const getHistory = (assertionId: string): ValidationHistory => {
    return (
      validationHistory[assertionId] || {
        totalRuns: 0,
        passes: 0,
        failures: 0,
        failureRate: 0,
      }
    );
  };

  const isFlaky = (assertionId: string) => {
    const history = getHistory(assertionId);
    return (
      history.totalRuns >= 3 &&
      history.failureRate > 20 &&
      history.failureRate < 80
    );
  };

  const handleTableSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (tableSortConfig.key === key && tableSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setTableSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (tableSortConfig.key !== columnKey) {
      return <ArrowUpDown className='w-4 h-4 text-gray-400' />;
    }
    return tableSortConfig.direction === 'asc' ? (
      <ArrowUp className='w-4 h-4 text-blue-600' />
    ) : (
      <ArrowDown className='w-4 h-4 text-blue-600' />
    );
  };

  const getFilteredTableData = () => {
    let filtered = [...results];

    if (tableFilterStatus !== 'all') {
      filtered = filtered.filter((r) => r.result === tableFilterStatus);
    }

    if (tableFilterCategory !== 'all') {
      filtered = filtered.filter((r) => r.category === tableFilterCategory);
    }

    if (tableSortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[tableSortConfig.key as keyof ValidationResult];
        let bVal = b[tableSortConfig.key as keyof ValidationResult];

        if (tableSortConfig.key === 'failureRate') {
          const aHistory = getHistory(a.id);
          const bHistory = getHistory(b.id);
          aVal = aHistory.failureRate as any;
          bVal = bHistory.failureRate as any;
        }

        if (aVal < bVal) return tableSortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return tableSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  };

  return (
    <div className='min-h-screen bg-gray-50 p-4 sm:p-6'>
      <div className='max-w-7xl mx-auto space-y-6'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900 mb-1'>
                Validation Results
              </h1>
              <p className='text-sm text-gray-600'>
                Completed on {new Date(timestamp).toLocaleString()}
              </p>
            </div>
            {onBack && (
              <Button onClick={onBack} variant='ghost'>
                <ChevronLeft className='w-4 h-4' />
                Back to Build
              </Button>
            )}
          </div>

          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
            <div className='bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200'>
              <div className='text-green-600 text-sm font-medium mb-1'>
                Passed
              </div>
              <div className='text-3xl font-bold text-green-700'>
                {summary.passed}
              </div>
            </div>
            <div className='bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200'>
              <div className='text-red-600 text-sm font-medium mb-1'>
                Failed
              </div>
              <div className='text-3xl font-bold text-red-700'>
                {summary.failed}
              </div>
            </div>
            <div className='bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200'>
              <div className='text-gray-600 text-sm font-medium mb-1'>
                Skipped
              </div>
              <div className='text-3xl font-bold text-gray-700'>
                {summary.skipped}
              </div>
            </div>
            <div className='bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200'>
              <div className='text-blue-600 text-sm font-medium mb-1'>
                Response Time
              </div>
              <div className='text-3xl font-bold text-blue-700'>
                {responseTime}
              </div>
            </div>
          </div>

          <div className='mb-6'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm font-medium text-gray-700'>
                Success Rate
              </span>
              <span className='text-sm font-bold text-gray-900'>
                {successRate}%
              </span>
            </div>
            <div className='w-full h-3 bg-gray-200 rounded-full overflow-hidden'>
              <div
                className='h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500'
                style={{ width: `${successRate}%` }}
              />
            </div>
          </div>

          <div className='flex flex-wrap gap-3 items-center justify-between'>
            <div className='flex flex-wrap gap-3'>
              {onRerunAll && (
                <Button onClick={onRerunAll} variant='default'>
                  <RotateCcw className='w-4 h-4' />
                  Re-run All
                </Button>
              )}
              {summary.failed > 0 && onRerunFailed && (
                <Button onClick={onRerunFailed} variant='destructive'>
                  <RotateCcw className='w-4 h-4' />
                  Re-run Failed Only
                </Button>
              )}
              <Button
                onClick={() => setShowHistory(!showHistory)}
                variant={showHistory ? 'default' : 'outline'}
              >
                <Clock className='w-4 h-4' />
                {showHistory ? 'Hide History' : 'Show History'}
              </Button>
              {/* {onShare && (
                <Button onClick={onShare} variant='outline'>
                  <Share2 className='w-4 h-4' />
                  Share Results
                </Button>
              )} */}
            </div>

            <div className='flex items-center gap-0 bg-gray-100 rounded-lg p-1'>
              <Button
                onClick={() => setViewMode('table')}
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size='sm'
                className={
                  viewMode === 'table'
                    ? 'bg-white shadow-sm'
                    : 'hover:bg-transparent'
                }
              >
                Table View
              </Button>
              <Button
                onClick={() => setViewMode('category')}
                variant={viewMode === 'category' ? 'secondary' : 'ghost'}
                size='sm'
                className={
                  viewMode === 'category'
                    ? 'bg-white shadow-sm'
                    : 'hover:bg-transparent'
                }
              >
                Category View
              </Button>
            </div>
          </div>
        </div>

        {viewMode === 'category' && (
          <div className='space-y-4'>
            {Object.entries(groupedResults).map(
              ([category, categoryResults]) => {
                const passed = categoryResults.filter(
                  (r) => r.result === 'passed'
                ).length;
                const failed = categoryResults.filter(
                  (r) => r.result === 'failed'
                ).length;
                const isExpanded = expandedCategories[category];

                return (
                  <div
                    key={category}
                    className='bg-white rounded-lg shadow-sm border border-gray-200'
                  >
                    <button
                      onClick={() => toggleCategory(category)}
                      className='w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors'
                    >
                      <div className='flex items-center gap-3'>
                        {isExpanded ? (
                          <ChevronDown className='w-5 h-5 text-gray-600' />
                        ) : (
                          <ChevronRight className='w-5 h-5 text-gray-600' />
                        )}
                        <h3 className='font-semibold text-gray-900'>
                          {categoryLabels[category] || category}
                        </h3>
                        <span className='text-sm text-gray-500'>
                          ({categoryResults.length} tested)
                        </span>
                      </div>
                      <div className='flex items-center gap-4'>
                        <span className='text-sm font-medium text-green-600'>
                          {passed} ✓
                        </span>
                        <span className='text-sm font-medium text-red-600'>
                          {failed} ✗
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className='p-4 pt-0 space-y-3'>
                        {categoryResults.map((result) => {
                          const history = getHistory(result.id);
                          const isResultFlaky = isFlaky(result.id);

                          return (
                            <div
                              key={result.id}
                              className={`rounded-lg border p-4 ${
                                result.result === 'passed'
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-red-50 border-red-200'
                              }`}
                            >
                              <div className='flex items-start gap-3'>
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    result.result === 'passed'
                                      ? 'bg-green-600 text-white'
                                      : 'bg-red-600 text-white'
                                  }`}
                                >
                                  {result.result === 'passed' ? (
                                    <Check className='w-4 h-4' />
                                  ) : (
                                    <X className='w-4 h-4' />
                                  )}
                                </div>

                                <div className='flex-1 min-w-0'>
                                  <div className='flex items-center gap-2 flex-wrap mb-1'>
                                    {result.field && (
                                      <span className='font-mono text-sm font-medium text-gray-900'>
                                        {result.field}
                                      </span>
                                    )}
                                    <span className='text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded'>
                                      {result.type}
                                    </span>
                                    {result.expectedValue && (
                                      <span className='text-sm text-gray-600'>
                                        ={' '}
                                        <span className='text-blue-600 font-mono'>
                                          {result.expectedValue}
                                        </span>
                                      </span>
                                    )}
                                    {isResultFlaky && (
                                      <span className='flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded'>
                                        <TrendingUp className='w-3 h-3' />
                                        Flaky
                                      </span>
                                    )}
                                    <span
                                      className={`ml-auto text-xs px-2 py-1 rounded font-medium ${
                                        result.result === 'passed'
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-red-100 text-red-700'
                                      }`}
                                    >
                                      {result.result === 'passed'
                                        ? 'Passed'
                                        : 'Failed'}
                                    </span>
                                  </div>

                                  <p className='text-sm text-gray-700 mb-2'>
                                    {result.description}
                                  </p>

                                  {history.totalRuns > 0 && (
                                    <div className='flex items-center gap-4 text-xs text-gray-600 mb-2'>
                                      <div className='flex items-center gap-1'>
                                        <Clock className='w-3 h-3' />
                                        <span>
                                          History:{' '}
                                          <span className='font-medium text-green-600'>
                                            {history.passes} passed
                                          </span>
                                          {history.failures > 0 && (
                                            <>
                                              ,{' '}
                                              <span className='font-medium text-red-600'>
                                                {history.failures} failed
                                              </span>
                                            </>
                                          )}{' '}
                                          out of {history.totalRuns} runs
                                        </span>
                                      </div>
                                      {history.failureRate > 0 && (
                                        <div
                                          className={`px-2 py-0.5 rounded ${
                                            history.failureRate > 50
                                              ? 'bg-red-100 text-red-700'
                                              : history.failureRate > 20
                                              ? 'bg-amber-100 text-amber-700'
                                              : 'bg-gray-100 text-gray-600'
                                          }`}
                                        >
                                          {history.failureRate}% failure rate
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {result.result === 'failed' &&
                                    result.failureReason && (
                                      <div className='bg-red-100 rounded p-2 text-xs'>
                                        <div className='font-semibold text-red-900 mb-1'>
                                          Failed:
                                        </div>
                                        <div className='text-red-700'>
                                          {result.failureReason}
                                        </div>
                                        {result.actualValue && (
                                          <div className='text-red-600 mt-1'>
                                            Actual: {result.actualValue}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}

        {viewMode === 'table' && (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
            <div className='p-4 border-b border-gray-200'>
              <div className='flex items-center justify-between mb-3'>
                <h3 className='font-semibold text-gray-900 text-lg'>
                  Detailed Results
                </h3>
                <div className='flex gap-2'>
                  <Select
                    value={tableFilterStatus}
                    onValueChange={(value) =>
                      setTableFilterStatus(value as any)
                    }
                  >
                    <SelectTrigger className='w-[180px]'>
                      <SelectValue placeholder='Filter by status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Status</SelectItem>
                      <SelectItem value='passed'>Passed Only</SelectItem>
                      <SelectItem value='failed'>Failed Only</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={tableFilterCategory}
                    onValueChange={(value) => setTableFilterCategory(value)}
                  >
                    <SelectTrigger className='w-[180px]'>
                      <SelectValue placeholder='Filter by category' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Categories</SelectItem>
                      <SelectItem value='headers'>Headers</SelectItem>
                      <SelectItem value='body'>Request Body</SelectItem>
                      <SelectItem value='HeaderGuard™'>Security</SelectItem>
                      <SelectItem value='performance'>Performance</SelectItem>
                      <SelectItem value='status'>Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-50 border-b border-gray-200'>
                  <tr>
                    <th
                      className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition-colors'
                      onClick={() => handleTableSort('result')}
                    >
                      <div className='flex items-center gap-2'>
                        Status
                        <SortIcon columnKey='result' />
                      </div>
                    </th>
                    <th
                      className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition-colors'
                      onClick={() => handleTableSort('category')}
                    >
                      <div className='flex items-center gap-2'>
                        Category
                        <SortIcon columnKey='category' />
                      </div>
                    </th>
                    <th
                      className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition-colors'
                      onClick={() => handleTableSort('field')}
                    >
                      <div className='flex items-center gap-2'>
                        Field
                        <SortIcon columnKey='field' />
                      </div>
                    </th>
                    <th
                      className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition-colors'
                      onClick={() => handleTableSort('type')}
                    >
                      <div className='flex items-center gap-2'>
                        Assertion
                        <SortIcon columnKey='type' />
                      </div>
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase'>
                      Expected
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase'>
                      Actual
                    </th>
                    <th
                      className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition-colors'
                      onClick={() => handleTableSort('failureRate')}
                    >
                      <div className='flex items-center gap-2'>
                        History
                        <SortIcon columnKey='failureRate' />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200'>
                  {getFilteredTableData().map((result) => {
                    const history = getHistory(result.id);
                    const isResultFlaky = isFlaky(result.id);

                    return (
                      <tr
                        key={result.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          result.result === 'failed' ? 'bg-red-50' : ''
                        }`}
                      >
                        <td className='px-4 py-3 whitespace-nowrap'>
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              result.result === 'passed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {result.result === 'passed' ? (
                              <Check className='w-5 h-5' />
                            ) : (
                              <X className='w-5 h-5' />
                            )}
                          </div>
                        </td>
                        <td className='px-4 py-3'>
                          <span className='text-sm text-gray-600'>
                            {categoryLabels[result.category] || result.category}
                          </span>
                        </td>
                        <td className='px-4 py-3'>
                          <div className='flex items-center gap-2'>
                            <span className='font-mono text-sm text-gray-900'>
                              {result.field || 'N/A'}
                            </span>
                            {isResultFlaky && (
                              <span className='flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded'>
                                <TrendingUp className='w-3 h-3' />
                                Flaky
                              </span>
                            )}
                          </div>
                        </td>
                        <td className='px-4 py-3'>
                          <span className='text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded'>
                            {result.type}
                          </span>
                        </td>
                        <td className='px-4 py-3'>
                          <span className='font-mono text-sm text-gray-900'>
                            {result.expectedValue || 'exists'}
                          </span>
                        </td>
                        <td className='px-4 py-3'>
                          {result.result === 'failed' ? (
                            <div className='space-y-1'>
                              <span className='font-mono text-sm text-red-700'>
                                {result.actualValue}
                              </span>
                              {result.failureReason && (
                                <div className='text-xs text-red-600 max-w-xs'>
                                  {result.failureReason}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className='font-mono text-sm text-green-700'>
                              {result.actualValue}
                            </span>
                          )}
                        </td>

                        <td className='px-4 py-3'>
                          {history.totalRuns > 0 ? (
                            <div className='text-xs'>
                              <div className='flex items-center gap-2 mb-1'>
                                <span className='text-green-600 font-medium'>
                                  {history.passes}✓
                                </span>
                                <span className='text-red-600 font-medium'>
                                  {history.failures}✗
                                </span>
                              </div>
                              {history.failureRate > 0 && (
                                <div
                                  className={`${
                                    history.failureRate > 50
                                      ? 'text-red-600'
                                      : history.failureRate > 20
                                      ? 'text-amber-600'
                                      : 'text-gray-500'
                                  }`}
                                >
                                  {history.failureRate}% fail rate
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className='text-xs text-gray-400'>
                              First run
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {getFilteredTableData().length === 0 && (
              <div className='p-8 text-center text-gray-500'>
                No results match the selected filters
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssertionResults;
