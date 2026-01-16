import React, { useState } from 'react';
import {
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  AlertCircle,
  Shield,
  Zap,
  Activity,
  CheckCircle,
  FileText,
  Trash2,
  Plus,
  Edit2,
  Play,
  Save,
  RotateCcw,
  Loader2,
  Clock,
  TrendingUp,
  Settings,
  BarChart3,
} from 'lucide-react';

const ApiAssertionsWithTabs = () => {
  const [activeTab, setActiveTab] = useState<'build' | 'results'>('build');
  const [hasResults, setHasResults] = useState(false);

  const handleVerify = () => {
    // Simulate verification
    setHasResults(true);
    setActiveTab('results');
  };

  const tabs = [
    {
      id: 'build',
      label: 'Build',
      icon: Settings,
      disabled: false,
    },
    {
      id: 'results',
      label: 'Results',
      icon: BarChart3,
      disabled: !hasResults,
      badge: hasResults ? '6/8' : undefined,
    },
  ];

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header with Tabs */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 mb-6'>
          <div className='p-4 sm:p-6 border-b border-gray-200'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>
                  API Assertions
                </h1>
                <p className='text-sm text-gray-600 mt-1'>
                  {activeTab === 'build'
                    ? 'Configure and select assertions for validation'
                    : 'View validation results'}
                </p>
              </div>

              {/* Action Button */}
              {activeTab === 'build' && (
                <button
                  onClick={handleVerify}
                  className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                >
                  <Play className='w-4 h-4' />
                  Verify Assertions
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className='flex items-center gap-1 px-4 sm:px-6'>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() =>
                    !tab.disabled && setActiveTab(tab.id as 'build' | 'results')
                  }
                  disabled={tab.disabled}
                  className={`
                    flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all relative
                    ${
                      isActive
                        ? 'text-blue-600'
                        : tab.disabled
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:text-gray-900'
                    }
                    ${!tab.disabled && 'hover:bg-gray-50'}
                  `}
                >
                  <Icon className='w-4 h-4' />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className='ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-semibold'>
                      {tab.badge}
                    </span>
                  )}

                  {/* Active indicator */}
                  {isActive && (
                    <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600' />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'build' && (
          <div className='space-y-6'>
            {/* Build Mode Content */}
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <div className='flex items-center justify-between mb-6'>
                <div>
                  <h2 className='text-lg font-semibold text-gray-900'>
                    Configure Assertions
                  </h2>
                  <p className='text-sm text-gray-600 mt-1'>
                    Select and customize assertions to validate your API
                    responses
                  </p>
                </div>
                <div className='text-right'>
                  <div className='text-sm text-gray-600'>
                    Selected:{' '}
                    <span className='text-2xl font-bold text-blue-600'>6</span>
                  </div>
                </div>
              </div>

              {/* Sample Assertions List */}
              <div className='space-y-4'>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className='flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50'
                  >
                    <input
                      type='checkbox'
                      defaultChecked={i <= 2}
                      className='w-4 h-4 text-blue-600 rounded'
                    />
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-1'>
                        <span className='font-mono text-sm font-medium'>
                          data.status
                        </span>
                        <span className='text-xs bg-gray-100 px-2 py-0.5 rounded'>
                          =
                        </span>
                        <span className='text-sm text-blue-600 font-mono'>
                          200
                        </span>
                      </div>
                      <p className='text-sm text-gray-600'>
                        Validates that the response status code equals 200
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Add Section */}
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <h3 className='font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                <Plus className='w-5 h-5' />
                Quick Add Custom Assertion
              </h3>
              <div className='grid grid-cols-1 sm:grid-cols-4 gap-3'>
                <input
                  type='text'
                  placeholder='Field path'
                  className='px-3 py-2 border border-gray-300 rounded-lg'
                />
                <select className='px-3 py-2 border border-gray-300 rounded-lg'>
                  <option>Equals (=)</option>
                  <option>Contains</option>
                  <option>Exists</option>
                </select>
                <input
                  type='text'
                  placeholder='Expected value'
                  className='px-3 py-2 border border-gray-300 rounded-lg'
                />
                <button className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'>
                  Add Assertion
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'results' && hasResults && (
          <div className='space-y-6'>
            {/* Results Content */}
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <div className='mb-6'>
                <h2 className='text-lg font-semibold text-gray-900 mb-1'>
                  Validation Results
                </h2>
                <p className='text-sm text-gray-600'>
                  Completed on {new Date().toLocaleString()}
                </p>
              </div>

              {/* Summary Cards */}
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
                <div className='bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200'>
                  <div className='text-green-600 text-sm font-medium mb-1'>
                    Passed
                  </div>
                  <div className='text-3xl font-bold text-green-700'>6</div>
                </div>
                <div className='bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200'>
                  <div className='text-red-600 text-sm font-medium mb-1'>
                    Failed
                  </div>
                  <div className='text-3xl font-bold text-red-700'>2</div>
                </div>
                <div className='bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200'>
                  <div className='text-gray-600 text-sm font-medium mb-1'>
                    Skipped
                  </div>
                  <div className='text-3xl font-bold text-gray-700'>0</div>
                </div>
                <div className='bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200'>
                  <div className='text-blue-600 text-sm font-medium mb-1'>
                    Response Time
                  </div>
                  <div className='text-3xl font-bold text-blue-700'>245ms</div>
                </div>
              </div>

              {/* Success Rate */}
              <div className='mb-6'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-gray-700'>
                    Success Rate
                  </span>
                  <span className='text-sm font-bold text-gray-900'>75%</span>
                </div>
                <div className='w-full h-3 bg-gray-200 rounded-full overflow-hidden'>
                  <div
                    className='h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500'
                    style={{ width: '75%' }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex flex-wrap gap-3'>
                <button className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'>
                  <RotateCcw className='w-4 h-4' />
                  Re-run All
                </button>
                <button className='flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700'>
                  <RotateCcw className='w-4 h-4' />
                  Re-run Failed Only
                </button>
                <button className='flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50'>
                  <Clock className='w-4 h-4' />
                  Show History
                </button>
              </div>
            </div>

            {/* Results List */}
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <h3 className='font-semibold text-gray-900 mb-4'>
                Detailed Results
              </h3>
              <div className='space-y-3'>
                {[
                  { status: 'passed', field: 'status', value: '200' },
                  { status: 'passed', field: 'data.userId', value: '12345' },
                  {
                    status: 'failed',
                    field: 'data.email',
                    value: 'invalid format',
                  },
                  {
                    status: 'passed',
                    field: 'headers.content-type',
                    value: 'application/json',
                  },
                ].map((result, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border ${
                      result.status === 'passed'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className='flex items-start gap-3'>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          result.status === 'passed'
                            ? 'bg-green-600 text-white'
                            : 'bg-red-600 text-white'
                        }`}
                      >
                        {result.status === 'passed' ? (
                          <Check className='w-4 h-4' />
                        ) : (
                          <X className='w-4 h-4' />
                        )}
                      </div>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-1'>
                          <span className='font-mono text-sm font-medium'>
                            {result.field}
                          </span>
                          <span className='text-xs bg-gray-100 px-2 py-0.5 rounded'>
                            =
                          </span>
                          <span className='text-sm text-blue-600 font-mono'>
                            {result.value}
                          </span>
                        </div>
                        <p className='text-sm text-gray-600'>
                          {result.status === 'passed'
                            ? 'Assertion passed successfully'
                            : 'Expected value did not match actual value'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiAssertionsWithTabs;
