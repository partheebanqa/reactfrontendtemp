import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Copy,
  Download,
  RefreshCw,
  Database,
  Code,
  Hash,
  Cookie,
  ChevronDown,
  ChevronUp,
  MoreVertical,
} from 'lucide-react';
import {
  ExecutionLog,
  APIRequest,
  DataExtraction,
} from '@/shared/types/requestChain.model';

interface VariableExtractionResult {
  id: string;
  requestIndex: number;
  requestName: string;
  requestMethod: string;
  variableName: string;
  extractionPath: string;
  extractionSource: DataExtraction['source'];
  extractedValue: any;
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  requestId: string;
  logId?: string;
}

interface VariablesTableProps {
  requests: APIRequest[];
  executionLogs: ExecutionLog[];
  extractedVariables: Record<string, any>;
  isExecuting: boolean;
  currentRequestIndex: number;
}

export function VariablesTable({
  requests,
  executionLogs,
  extractedVariables,
  isExecuting,
  currentRequestIndex,
}: VariablesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'success' | 'failed' | 'pending'
  >('all');
  const [requestFilter, setRequestFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<
    'all' | 'response_body' | 'response_header' | 'response_cookie'
  >('all');
  const [sortBy, setSortBy] = useState<
    'request' | 'variable' | 'status' | 'timestamp'
  >('request');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Generate extraction results from requests and execution logs
  const extractionResults = useMemo(() => {
    const results: VariableExtractionResult[] = [];

    requests.forEach((request, requestIndex) => {
      request.dataExtractions.forEach((extraction) => {
        const log = executionLogs.find((l) => l.requestId === request.id);
        const extractedValue =
          log?.extractedVariables?.[extraction.variableName];

        let status: 'success' | 'failed' | 'pending' = 'pending';
        if (log) {
          if (log.status === 'success' && extractedValue !== undefined) {
            status = 'success';
          } else if (log.status === 'error' || extractedValue === undefined) {
            status = 'failed';
          }
        } else if (isExecuting && requestIndex <= currentRequestIndex) {
          status = 'pending';
        }

        results.push({
          id: `${request.id}-${extraction.variableName}`,
          requestIndex,
          requestName: request.name,
          requestMethod: request.method,
          variableName: extraction.variableName,
          extractionPath: extraction.path,
          extractionSource: extraction.source,
          extractedValue:
            extractedValue || extractedVariables[extraction.variableName],
          status,
          timestamp: log?.endTime || new Date().toISOString(),
          requestId: request.id,
          logId: log?.id,
        });
      });
    });

    return results;
  }, [
    requests,
    executionLogs,
    extractedVariables,
    isExecuting,
    currentRequestIndex,
  ]);

  // Filter and sort results
  const filteredResults = useMemo(() => {
    let filtered = extractionResults.filter((result) => {
      const matchesSearch =
        result.variableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.requestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.extractionPath.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || result.status === statusFilter;
      const matchesRequest =
        requestFilter === 'all' || result.requestId === requestFilter;
      const matchesSource =
        sourceFilter === 'all' || result.extractionSource === sourceFilter;

      return matchesSearch && matchesStatus && matchesRequest && matchesSource;
    });

    // Sort results
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'request':
          comparison = a.requestIndex - b.requestIndex;
          break;
        case 'variable':
          comparison = a.variableName.localeCompare(b.variableName);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'timestamp':
          comparison =
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [
    extractionResults,
    searchTerm,
    statusFilter,
    requestFilter,
    sourceFilter,
    sortBy,
    sortOrder,
  ]);

  const toggleRowExpanded = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const copyValue = (value: any) => {
    const textValue =
      typeof value === 'object'
        ? JSON.stringify(value, null, 2)
        : String(value);
    navigator.clipboard.writeText(textValue);
  };

  const exportResults = () => {
    const csvContent = [
      [
        'Request',
        'Variable Name',
        'Source',
        'Path',
        'Value',
        'Status',
        'Timestamp',
      ],
      ...filteredResults.map((result) => [
        `${result.requestIndex + 1}. ${result.requestName}`,
        result.variableName,
        result.extractionSource,
        result.extractionPath,
        typeof result.extractedValue === 'object'
          ? JSON.stringify(result.extractedValue)
          : String(result.extractedValue || ''),
        result.status,
        new Date(result.timestamp).toLocaleString(),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted-variables.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: VariableExtractionResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className='w-4 h-4 text-green-500' />;
      case 'failed':
        return <XCircle className='w-4 h-4 text-red-500' />;
      case 'pending':
        return <AlertTriangle className='w-4 h-4 text-yellow-500' />;
    }
  };

  const getSourceIcon = (source: DataExtraction['source']) => {
    switch (source) {
      case 'response_body':
        return <Code className='w-4 h-4 text-blue-500' />;
      case 'response_header':
        return <Hash className='w-4 h-4 text-purple-500' />;
      case 'response_cookie':
        return <Cookie className='w-4 h-4 text-orange-500' />;
    }
  };

  const getMethodColor = (method: string) => {
    const colors = {
      GET: 'text-green-600 bg-green-50',
      POST: 'text-blue-600 bg-blue-50',
      PUT: 'text-orange-600 bg-orange-50',
      DELETE: 'text-red-600 bg-red-50',
      PATCH: 'text-purple-600 bg-purple-50',
      HEAD: 'text-gray-600 bg-gray-50',
      OPTIONS: 'text-yellow-600 bg-yellow-50',
    };
    return colors[method as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const stats = {
    total: extractionResults.length,
    success: extractionResults.filter((r) => r.status === 'success').length,
    failed: extractionResults.filter((r) => r.status === 'failed').length,
    pending: extractionResults.filter((r) => r.status === 'pending').length,
  };

  return (
    <div className='bg-card rounded-xl border border-border overflow-hidden'>
      {/* Header */}
      <div className='p-4 sm:p-6 border-b border-border'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4'>
          <div className='flex items-center space-x-3'>
            <Database className='w-6 h-6 text-primary' />
            <div>
              <h3 className='text-lg font-semibold text-foreground'>
                Variables Table
              </h3>
              <p className='text-sm text-muted-foreground'>
                Track all variable extractions across the chain
              </p>
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <button
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              className='sm:hidden flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
            >
              <Filter className='w-4 h-4' />
              <span>Filters</span>
            </button>
            <button
              onClick={exportResults}
              className='flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
            >
              <Download className='w-4 h-4' />
              <span className='hidden sm:inline'>Export</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6'>
          <div className='text-center p-2 sm:p-3 bg-gray-50 rounded-lg'>
            <p className='text-xl sm:text-2xl font-bold text-gray-900'>
              {stats.total}
            </p>
            <p className='text-xs text-gray-500'>Total</p>
          </div>
          <div className='text-center p-2 sm:p-3 bg-green-50 rounded-lg'>
            <p className='text-xl sm:text-2xl font-bold text-green-600'>
              {stats.success}
            </p>
            <p className='text-xs text-green-600'>Success</p>
          </div>
          <div className='text-center p-2 sm:p-3 bg-red-50 rounded-lg'>
            <p className='text-xl sm:text-2xl font-bold text-red-600'>
              {stats.failed}
            </p>
            <p className='text-xs text-red-600'>Failed</p>
          </div>
          <div className='text-center p-2 sm:p-3 bg-yellow-50 rounded-lg'>
            <p className='text-xl sm:text-2xl font-bold text-yellow-600'>
              {stats.pending}
            </p>
            <p className='text-xs text-yellow-600'>Pending</p>
          </div>
        </div>

        {/* Filters */}
        <div
          className={`space-y-4 ${
            isMobileFiltersOpen ? 'block' : 'hidden'
          } sm:block`}
        >
          <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
              <input
                type='text'
                placeholder='Search variables...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
              className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
            >
              <option value='all'>All Status</option>
              <option value='success'>Success</option>
              <option value='failed'>Failed</option>
              <option value='pending'>Pending</option>
            </select>

            <select
              value={requestFilter}
              onChange={(e) => setRequestFilter(e.target.value)}
              className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
            >
              <option value='all'>All Requests</option>
              {requests.map((request, index) => (
                <option key={request.id} value={request.id}>
                  {index + 1}. {request.name}
                </option>
              ))}
            </select>

            <select
              value={sourceFilter}
              onChange={(e) =>
                setSourceFilter(e.target.value as typeof sourceFilter)
              }
              className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
            >
              <option value='all'>All Sources</option>
              <option value='response_body'>Response Body</option>
              <option value='response_header'>Response Header</option>
              <option value='response_cookie'>Response Cookie</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className='overflow-x-auto'>
        {filteredResults.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className='hidden lg:block'>
              <table className='w-full'>
                <thead className='bg-gray-50 border-b border-gray-200'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      <button
                        onClick={() => handleSort('request')}
                        className='flex items-center space-x-1 hover:text-gray-700'
                      >
                        <span>#</span>
                        {sortBy === 'request' &&
                          (sortOrder === 'asc' ? (
                            <ChevronUp className='w-3 h-3' />
                          ) : (
                            <ChevronDown className='w-3 h-3' />
                          ))}
                      </button>
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Request
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      <button
                        onClick={() => handleSort('variable')}
                        className='flex items-center space-x-1 hover:text-gray-700'
                      >
                        <span>Variable Name</span>
                        {sortBy === 'variable' &&
                          (sortOrder === 'asc' ? (
                            <ChevronUp className='w-3 h-3' />
                          ) : (
                            <ChevronDown className='w-3 h-3' />
                          ))}
                      </button>
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Source & Path
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Value
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      <button
                        onClick={() => handleSort('status')}
                        className='flex items-center space-x-1 hover:text-gray-700'
                      >
                        <span>Status</span>
                        {sortBy === 'status' &&
                          (sortOrder === 'asc' ? (
                            <ChevronUp className='w-3 h-3' />
                          ) : (
                            <ChevronDown className='w-3 h-3' />
                          ))}
                      </button>
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-background divide-y divide-border'>
                  {filteredResults.map((result) => (
                    <React.Fragment key={result.id}>
                      <tr className='hover:bg-muted/50 transition-colors'>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium'>
                            {result.requestIndex + 1}
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='flex items-center space-x-3'>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded ${getMethodColor(
                                result.requestMethod
                              )}`}
                            >
                              {result.requestMethod}
                            </span>
                            <div>
                              <p className='text-sm font-medium text-gray-900'>
                                {result.requestName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <code className='px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm font-mono'>
                            {result.variableName}
                          </code>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='flex items-center space-x-2'>
                            {getSourceIcon(result.extractionSource)}
                            <div>
                              <p className='text-sm text-gray-600'>
                                {result.extractionSource
                                  .replace('_', ' ')
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </p>
                              <code className='text-xs text-gray-500 font-mono'>
                                {result.extractionPath}
                              </code>
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='max-w-xs'>
                            {result.extractedValue !== undefined ? (
                              <div className='flex items-center space-x-2'>
                                <code className='px-2 py-1 bg-green-50 text-green-800 rounded text-sm font-mono truncate'>
                                  {typeof result.extractedValue === 'object'
                                    ? JSON.stringify(
                                        result.extractedValue
                                      ).substring(0, 50) + '...'
                                    : String(result.extractedValue).substring(
                                        0,
                                        50
                                      ) +
                                      (String(result.extractedValue).length > 50
                                        ? '...'
                                        : '')}
                                </code>
                                {(typeof result.extractedValue === 'object' ||
                                  String(result.extractedValue).length >
                                    50) && (
                                  <button
                                    onClick={() => toggleRowExpanded(result.id)}
                                    className='p-1 text-gray-400 hover:text-gray-600 rounded'
                                  >
                                    <Eye className='w-4 h-4' />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className='text-sm text-gray-400 italic'>
                                No value extracted
                              </span>
                            )}
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='flex items-center space-x-2'>
                            {getStatusIcon(result.status)}
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                result.status === 'success'
                                  ? 'bg-green-100 text-green-800'
                                  : result.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {result.status}
                            </span>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='flex items-center space-x-2'>
                            {result.extractedValue !== undefined && (
                              <button
                                onClick={() => copyValue(result.extractedValue)}
                                className='p-1 text-gray-400 hover:text-gray-600 rounded transition-colors'
                                title='Copy value'
                              >
                                <Copy className='w-4 h-4' />
                              </button>
                            )}
                            {isExecuting && result.status === 'pending' && (
                              <RefreshCw className='w-4 h-4 text-yellow-500 animate-spin' />
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      {expandedRows.has(result.id) &&
                        result.extractedValue !== undefined && (
                          <tr>
                            <td colSpan={7} className='px-6 py-4 bg-gray-50'>
                              <div className='space-y-3'>
                                <h4 className='font-medium text-gray-900'>
                                  Full Value:
                                </h4>
                                <pre className='bg-white p-4 rounded border text-sm font-mono overflow-x-auto max-h-64'>
                                  {typeof result.extractedValue === 'object'
                                    ? JSON.stringify(
                                        result.extractedValue,
                                        null,
                                        2
                                      )
                                    : String(result.extractedValue)}
                                </pre>
                                <button
                                  onClick={() =>
                                    copyValue(result.extractedValue)
                                  }
                                  className='flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors'
                                >
                                  <Copy className='w-3 h-3' />
                                  <span>Copy Full Value</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className='lg:hidden divide-y divide-gray-200'>
              {filteredResults.map((result) => (
                <div key={result.id} className='p-4 space-y-3'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-center space-x-2'>
                      <div className='w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium'>
                        {result.requestIndex + 1}
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getMethodColor(
                          result.requestMethod
                        )}`}
                      >
                        {result.requestMethod}
                      </span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      {getStatusIcon(result.status)}
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          result.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : result.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {result.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className='text-sm font-medium text-gray-900 truncate'>
                      {result.requestName}
                    </p>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-xs text-gray-500'>Variable</p>
                      <code className='text-sm font-mono bg-gray-100 px-2 py-1 rounded'>
                        {result.variableName}
                      </code>
                    </div>
                    <div className='text-right'>
                      <p className='text-xs text-gray-500'>Source</p>
                      <div className='flex items-center space-x-1'>
                        {getSourceIcon(result.extractionSource)}
                        <span className='text-xs'>
                          {result.extractionSource.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className='text-xs text-gray-500 mb-1'>Path</p>
                    <code className='text-xs font-mono text-gray-700'>
                      {result.extractionPath}
                    </code>
                  </div>

                  {result.extractedValue !== undefined && (
                    <div>
                      <p className='text-xs text-gray-500 mb-1'>Value</p>
                      <div className='flex items-center justify-between'>
                        <code className='text-sm font-mono bg-green-50 text-green-800 px-2 py-1 rounded truncate flex-1 mr-2'>
                          {typeof result.extractedValue === 'object'
                            ? JSON.stringify(result.extractedValue).substring(
                                0,
                                30
                              ) + '...'
                            : String(result.extractedValue).substring(0, 30) +
                              (String(result.extractedValue).length > 30
                                ? '...'
                                : '')}
                        </code>
                        <div className='flex items-center space-x-1'>
                          <button
                            onClick={() => copyValue(result.extractedValue)}
                            className='p-1 text-gray-400 hover:text-gray-600 rounded'
                          >
                            <Copy className='w-4 h-4' />
                          </button>
                          {(typeof result.extractedValue === 'object' ||
                            String(result.extractedValue).length > 30) && (
                            <button
                              onClick={() => toggleRowExpanded(result.id)}
                              className='p-1 text-gray-400 hover:text-gray-600 rounded'
                            >
                              <Eye className='w-4 h-4' />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expanded Content for Mobile */}
                  {expandedRows.has(result.id) &&
                    result.extractedValue !== undefined && (
                      <div className='space-y-2 pt-2 border-t border-gray-200'>
                        <h5 className='font-medium text-gray-900 text-sm'>
                          Full Value:
                        </h5>
                        <pre className='bg-white p-3 rounded border text-xs font-mono overflow-x-auto max-h-32'>
                          {typeof result.extractedValue === 'object'
                            ? JSON.stringify(result.extractedValue, null, 2)
                            : String(result.extractedValue)}
                        </pre>
                        <button
                          onClick={() => copyValue(result.extractedValue)}
                          className='w-full flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors'
                        >
                          <Copy className='w-3 h-3' />
                          <span>Copy Full Value</span>
                        </button>
                      </div>
                    )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className='text-center py-12 px-4'>
            <Database className='w-12 h-12 text-gray-300 mx-auto mb-3' />
            <p className='text-gray-500 mb-2'>No variable extractions found</p>
            <p className='text-sm text-gray-400 text-center'>
              {extractionResults.length === 0
                ? 'Configure variable extractions in your requests to see them here'
                : 'Try adjusting your filters to see more results'}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredResults.length > 0 && (
        <div className='px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-200'>
          <p className='text-sm text-gray-600'>
            Showing {filteredResults.length} of {extractionResults.length}{' '}
            variable extractions
          </p>
        </div>
      )}
    </div>
  );
}
