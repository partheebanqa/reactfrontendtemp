import React, { useState } from 'react';
import {
  Copy,
  Download,
  Search,
  Eye,
  Code,
  X,
  CheckCircle,
  Clock,
  HardDrive,
} from 'lucide-react';
import { useRequest } from '@/hooks/useRequest';
import JsonViewer from '../RequestEditor/JsonViewer';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponseViewerProps {
  isBottomLayout: boolean;
}

const ResponseViewer = ({ isBottomLayout }: ResponseViewerProps) => {
  const { responseData } = useRequest();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<
    'body' | 'headers' | 'cookies' | 'test-results' | 'schema'
  >('body');
  const [bodyView, setBodyView] = useState<'pretty' | 'raw' | 'preview'>(
    'pretty'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 300 && status < 400) return 'text-yellow-600';
    if (status >= 400 && status < 500) return 'text-orange-600';
    if (status >= 500) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const kb = bytes / k;
    return parseFloat(kb.toFixed(2)) + ' KB';
  };

  const calculateResponseSize = (data: any): string => {
    try {
      const size = new Blob([JSON.stringify(data)]).size;
      return formatBytes(size);
    } catch {
      return formatBytes(0);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadResponse = () => {
    if (!responseData) return;

    const blob = new Blob([JSON.stringify(responseData.body, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'response.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filterResponseData = (data: any, query: string): any => {
    if (!query.trim()) return data;

    try {
      const jsonString = JSON.stringify(data, null, 2);
      const lines = jsonString.split('\n');
      const filteredLines = lines.filter((line) =>
        line.toLowerCase().includes(query.toLowerCase())
      );

      if (filteredLines.length === 0) return data;

      // Return the original data but we'll highlight matches in the JsonViewer
      return data;
    } catch {
      return data;
    }
  };

  if (!responseData) {
    return (
      <div className='flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4'>
        <div className='text-center'>
          <p className='text-gray-500 dark:text-gray-400 mb-4'>
            No response yet
          </p>
          <p className='text-sm text-gray-400'>
            Send a request to see the response here
          </p>
        </div>
      </div>
    );
  }

  // --- Status summary component for reuse ---
  const StatusSummary = () => (
    <div className='flex items-center space-x-4 text-sm'>
      <div className='flex items-center space-x-1'>
        <CheckCircle
          className={`h-4 w-4 ${getStatusColor(responseData.status)}`}
        />
        <span className={`font-medium ${getStatusColor(responseData.status)}`}>
          {responseData.status} {responseData.statusText}
        </span>
      </div>
      <div className='flex items-center space-x-1'>
        <Clock className='h-4 w-4 text-gray-500' />
        <span className='font-medium text-gray-900 dark:text-white'>
          {`${responseData.metrics?.responseTime || 0}ms`}
        </span>
      </div>
      <div className='flex items-center space-x-1'>
        <HardDrive className='h-4 w-4 text-gray-500' />
        <span className='font-medium text-gray-900 dark:text-white'>
          {calculateResponseSize(responseData.body)}
        </span>
      </div>
    </div>
  );

  // --- Tab definitions ---
  const tabs = [
    { id: 'body', label: 'Body' },
    {
      id: 'headers',
      label: 'Headers',
      count: Object.keys(responseData.headers).length,
    },
    { id: 'cookies', label: 'Cookies' },
    { id: 'test-results', label: 'Test Results' },
    { id: 'schema', label: 'Schema' },
  ];

  return (
    <div className='flex-1 flex flex-col bg-white dark:bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 min-h-0 overflow-hidden'>
      {/* Response Tabs & Status */}
      <div className='border-b border-gray-200 dark:border-gray-700 flex-shrink-0'>
        <div
          className={`items-center justify-between px-4 ${
            !isBottomLayout ? 'mt-5' : 'flex'
          }`}
        >
          {/* Top status summary (desktop) */}
          {!isBottomLayout && (
            <div className='flex items-center space-x-4'>
              <StatusSummary />
            </div>
          )}
          {/* Tab navigation */}
          <nav className='flex overflow-x-auto' aria-label='Response tabs'>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 sm:px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
                tabIndex={0}
                type='button'
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className='ml-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5 text-xs'>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
          {/* Bottom status summary (mobile/bottom layout) */}
          {isBottomLayout && (
            <div className='flex items-center space-x-4'>
              <StatusSummary />
            </div>
          )}
        </div>
        {/* Search Bar */}
        {showSearch && (
          <div className='px-4 pb-3 flex items-center space-x-2'>
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search in response...'
                className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm'
                autoFocus
              />
            </div>
            <button
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
              }}
              className='p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
              aria-label='Close search'
              type='button'
            >
              <X className='h-4 w-4' />
            </button>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className='flex-1 overflow-auto'>
        {activeTab === 'body' && (
          <div className='h-full flex flex-col min-h-0'>
            <div className='border-b border-gray-200 dark:border-gray-700 p-2 sm:p-3 flex-shrink-0'>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
                <div className='flex items-center gap-1 sm:gap-2'>
                  <button
                    onClick={() => setBodyView('pretty')}
                    className={`px-2 py-1 rounded-md text-xs sm:text-sm flex items-center ${
                      bodyView === 'pretty'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-[#136fb0]'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Eye className='h-3 w-3 sm:h-4 sm:w-4 mr-1' />
                    <span className='hidden sm:inline'>Pretty</span>
                    <span className='sm:hidden'>P</span>
                  </button>
                  <button
                    onClick={() => setBodyView('raw')}
                    className={`px-2 py-1 rounded-md text-xs sm:text-sm flex items-center ${
                      bodyView === 'raw'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Code className='h-3 w-3 sm:h-4 sm:w-4 mr-1' />
                    <span className='hidden sm:inline'>Raw</span>
                    <span className='sm:hidden'>R</span>
                  </button>
                  <button
                    onClick={() => setBodyView('preview')}
                    className={`px-2 py-1 rounded-md text-xs sm:text-sm flex items-center ${
                      bodyView === 'preview'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className='hidden sm:inline'>Preview</span>
                    <span className='sm:hidden'>Prev</span>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className='flex items-center space-x-1 justify-end'>
                  <button
                    onClick={() => setShowSearch(!showSearch)}
                    className='p-1.5 sm:p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
                    title='Search in response'
                  >
                    <Search className='h-3 w-3 sm:h-4 sm:w-4' />
                  </button>

                  <button
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(responseData.body, null, 2)
                      )
                    }
                    className='p-1.5 sm:p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
                    title='Copy response'
                  >
                    <Copy className='h-3 w-3 sm:h-4 sm:w-4' />
                  </button>

                  <button
                    onClick={downloadResponse}
                    className='p-1.5 sm:p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
                    title='Download response'
                  >
                    <Download className='h-3 w-3 sm:h-4 sm:w-4' />
                  </button>
                </div>
              </div>
            </div>

            <div className='flex-1 p-4 overflow-auto'>
              <JsonViewer
                data={filterResponseData(responseData.body, searchQuery)}
                view={bodyView}
                isError={
                  responseData.status === 0 || responseData.status >= 400
                }
                searchQuery={searchQuery}
              />
            </div>
          </div>
        )}

        {activeTab === 'headers' && (
          <div className='p-4 overflow-auto h-full'>
            <div className='space-y-2 min-w-0'>
              {Object.entries(responseData.headers).map(
                ([key, value]: [string, any]) => (
                  <div
                    key={key}
                    className='flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 py-2 border-b border-gray-100 dark:border-gray-800'
                  >
                    <span className='font-medium text-gray-900 dark:text-white min-w-0 sm:flex-1 break-all'>
                      {key}:
                    </span>
                    <span className='text-gray-600 dark:text-gray-400 min-w-0 sm:flex-1 break-all'>
                      {value}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {activeTab === 'cookies' && (
          <div className='p-4 overflow-auto h-full'>
            <div className='text-gray-500 dark:text-gray-400'>
              No cookies in this response
            </div>
          </div>
        )}

        {activeTab === 'test-results' && (
          <div className='p-4 overflow-auto h-full'>
            {responseData.assertionLogs &&
            responseData.assertionLogs.length > 0 ? (
              <div className='space-y-6'>
                {/* Summary Cards */}
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                  {(() => {
                    const passedCount = responseData.assertionLogs.filter(
                      (log) => log.status === 'passed'
                    ).length;
                    const failedCount = responseData.assertionLogs.filter(
                      (log) => log.status === 'failed'
                    ).length;
                    const totalCount = responseData.assertionLogs.length;

                    return (
                      <>
                        {/* Passed Assertions */}
                        <div className='bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4'>
                          <div className='flex items-center mb-2'>
                            <CheckCircle className='h-5 w-5 text-green-600 mr-2' />
                            <span className='text-2xl font-bold text-green-800 dark:text-green-300'>
                              {passedCount}{' '}
                              <span className='text-sm text-green-700 dark:text-green-400'>
                                Assertions Passed
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Failed Assertions */}
                        <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4'>
                          <div className='flex items-center mb-2'>
                            <X className='h-5 w-5 text-red-600 mr-2' />
                            <span className='text-2xl font-bold text-red-800 dark:text-red-300'>
                              {failedCount}{' '}
                              <span className='text-sm text-red-700 dark:text-red-400'>
                                Assertions Failed
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Total Assertions */}
                        <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'>
                          <div className='flex items-center mb-2'>
                            <Clock className='h-5 w-5 text-blue-600 mr-2' />
                            <span className='text-2xl font-bold text-blue-800 dark:text-blue-300'>
                              {totalCount}{' '}
                              <span className='text-sm text-blue-700 dark:text-blue-400'>
                                Total Assertions
                              </span>
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Individual Assertion Results */}
                <div className='space-y-3'>
                  {responseData.assertionLogs.map((assertion, index) => (
                    <div
                      key={assertion.id}
                      className={`border rounded-lg p-4 ${
                        assertion.status === 'passed'
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      }`}
                    >
                      <div className='flex items-start justify-between mb-3'>
                        <div className='flex items-center space-x-2'>
                          {assertion.status === 'passed' ? (
                            <CheckCircle className='h-5 w-5 text-green-600 flex-shrink-0' />
                          ) : (
                            <X className='h-5 w-5 text-red-600 flex-shrink-0' />
                          )}
                        </div>

                        {/* Description + Category/Group in one line */}
                        <div className='flex flex-1 items-center justify-between ml-2'>
                          <h4
                            className={`font-medium ${
                              assertion.status === 'passed'
                                ? 'text-green-800 dark:text-green-300'
                                : 'text-red-800 dark:text-red-300'
                            }`}
                          >
                            {assertion.description ||
                              `${assertion.type} assertion`}
                          </h4>

                          {assertion.category && (
                            <div className='flex items-center space-x-2'>
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  assertion.category === 'status'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                    : assertion.category === 'security'
                                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                                }`}
                              >
                                {assertion.category}
                              </span>
                              {assertion.group && (
                                <span className='px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'>
                                  {assertion.group}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Assertion Details */}
                      <div className='space-y-2 text-sm'>
                        {assertion.expectedValue && (
                          <div className='flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4'>
                            <span className='font-medium text-gray-700 dark:text-gray-300 min-w-[100px]'>
                              Expected: {assertion.expectedValue}
                            </span>
                          </div>
                        )}

                        {assertion.errorMessage && (
                          <div className='mt-3 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300'>
                            <span className='font-medium'>Error: </span>
                            {assertion.errorMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className='text-center py-8'>
                <div className='text-gray-500 dark:text-gray-400 mb-2'>
                  No test results available
                </div>
                <div className='text-sm text-gray-400'>
                  Run tests to see assertion results here
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'schema' && (
          <div className='p-4 overflow-auto h-full'>
            {responseData.schemaValidation ? (
              <div className='space-y-4'>
                <div
                  className={`border rounded-lg p-4 ${
                    responseData.schemaValidation.passed
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className='flex items-center space-x-2'>
                    {responseData.schemaValidation.passed ? (
                      <CheckCircle className='h-5 w-5 text-green-600 flex-shrink-0' />
                    ) : (
                      <X className='h-5 w-5 text-red-600 flex-shrink-0' />
                    )}
                    <div>
                      <h3
                        className={`font-medium ${
                          responseData.schemaValidation.passed
                            ? 'text-green-800 dark:text-green-300'
                            : 'text-red-800 dark:text-red-300'
                        }`}
                      >
                        Schema Validation{' '}
                        {responseData.schemaValidation.passed
                          ? 'Passed'
                          : 'Failed'}
                      </h3>
                      <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                        Schema: {responseData.schemaValidation.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className='text-center py-8'>
                <div className='text-gray-500 dark:text-gray-400 mb-2'>
                  No schema validation results
                </div>
                <div className='text-sm text-gray-400'>
                  Schema validation will appear here when available
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponseViewer;
