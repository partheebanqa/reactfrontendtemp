import { CheckSquare, Square, Sparkles, RefreshCw } from 'lucide-react';
import { TestCase, APIRequest } from '../types';

interface TestCaseStepProps {
  testCases: TestCase[];
  apis: APIRequest[];
  onToggleSelect: (id: string) => void;
  onGenerateTests: () => void;
  isGenerating: boolean;
}

export function TestCaseStep({
  testCases,
  apis,
  onToggleSelect,
  onGenerateTests,
  isGenerating,
}: TestCaseStepProps) {
  const selectedCount = testCases.filter(tc => tc.selected).length;
  const selectedAPIs = apis.filter(api => api.selected);

  const getAPIName = (apiRequestId: string) => {
    const api = apis.find(a => a.id === apiRequestId);
    return api?.name || 'Unknown API';
  };

  const groupedTestCases = testCases.reduce((acc, testCase) => {
    const apiId = testCase.api_request_id;
    if (!acc[apiId]) {
      acc[apiId] = [];
    }
    acc[apiId].push(testCase);
    return acc;
  }, {} as Record<string, TestCase[]>);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Test Cases</h3>
            <p className="text-sm text-gray-600 mt-1">
              Review and select test cases to execute
            </p>
          </div>
          <button
            onClick={onGenerateTests}
            disabled={isGenerating || selectedAPIs.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Test Cases
              </>
            )}
          </button>
        </div>

        {testCases.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              No Test Cases Generated Yet
            </h4>
            <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
              Click the "Generate Test Cases" button to automatically create comprehensive
              test cases for your selected APIs.
            </p>
            {selectedAPIs.length === 0 && (
              <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-md mx-auto">
                Please select at least one API in the previous step before generating tests.
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">{selectedCount}</span> of{' '}
                <span className="font-semibold">{testCases.length}</span> test cases selected
              </p>
            </div>

            <div className="space-y-6">
              {Object.entries(groupedTestCases).map(([apiId, cases]) => (
                <div key={apiId} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900">{getAPIName(apiId)}</h4>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {cases.length} test case{cases.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {cases.map((testCase) => (
                      <div
                        key={testCase.id}
                        className={`
                          p-4 transition-all
                          ${testCase.selected ? 'bg-blue-50' : 'bg-white'}
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => onToggleSelect(testCase.id)}
                            className="mt-1 flex-shrink-0"
                          >
                            {testCase.selected ? (
                              <CheckSquare className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </button>

                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900 mb-1">
                              {testCase.name}
                            </h5>
                            {testCase.description && (
                              <p className="text-sm text-gray-600 mb-2">
                                {testCase.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              <span className="inline-flex items-center gap-1 text-gray-700">
                                <span className="font-medium">Expected Status:</span>
                                <span
                                  className={`
                                    px-2 py-0.5 rounded font-semibold
                                    ${testCase.expected_status >= 200 && testCase.expected_status < 300 ? 'bg-green-100 text-green-700' : ''}
                                    ${testCase.expected_status >= 400 ? 'bg-red-100 text-red-700' : ''}
                                  `}
                                >
                                  {testCase.expected_status}
                                </span>
                              </span>
                              {testCase.assertions && testCase.assertions.length > 0 && (
                                <span className="text-gray-600">
                                  {testCase.assertions.length} assertion{testCase.assertions.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
