import React, { useState } from 'react';
import { AlertCircle, Play, CheckCircle2, XCircle, RefreshCw, Filter } from 'lucide-react';
import { Request, Response } from '../types';
import { TestCase, generateTestCases, generateManualTestCases, validateTestCase } from '../utils/testGenerator';
import TestExecutionDetails from './TestExecutionDetails';

interface TestGeneratorProps {
  request: Request;
  onRunTest: (request: Request) => Promise<Response>;
}

type TestType = 'positive' | 'negative' | 'boundary' | 'invalid_value' | 'invalid_type' | 'semantic';

const TEST_TYPE_LABELS: Record<TestType, string> = {
  positive: 'Positive Tests',
  negative: 'Negative Tests',
  boundary: 'Boundary Tests',
  invalid_value: 'Invalid Value Tests',
  invalid_type: 'Invalid Type Tests',
  semantic: 'Semantic Tests'
};

const TestGenerator: React.FC<TestGeneratorProps> = ({ request, onRunTest }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [results, setResults] = useState<Record<string, { passed: boolean; response: Response | null }>>({});
  const [generationType, setGenerationType] = useState<'manual' | 'ai'>('manual');
  const [selectedTypes, setSelectedTypes] = useState<Set<TestType>>(new Set());
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      let cases: TestCase[];
      if (generationType === 'ai') {
        cases = await generateTestCases(request);
      } else {
        cases = generateManualTestCases(request);
      }
      setTestCases(cases);
      setResults({});
      setSelectedTests(new Set());
      setSelectedTypes(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate test cases');
    } finally {
      setLoading(false);
    }
  };

  const runTest = async (testCase: TestCase) => {
    try {
      const response = await onRunTest({
        ...request,
        ...testCase.request
      });
      
      const passed = validateTestCase(testCase, response);
      setResults(prev => ({
        ...prev,
        [testCase.name]: { passed, response }
      }));
    } catch (err) {
      setResults(prev => ({
        ...prev,
        [testCase.name]: { passed: false, response: null }
      }));
    }
  };

  const runSelectedTests = async () => {
    const testsToRun = testCases.filter(test => 
      selectedTests.has(test.name) || selectedTypes.has(test.type as TestType)
    );
    for (const testCase of testsToRun) {
      await runTest(testCase);
    }
  };

  const toggleTestType = (type: TestType) => {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const toggleTestCase = (testName: string) => {
    setSelectedTests(prev => {
      const next = new Set(prev);
      if (next.has(testName)) {
        next.delete(testName);
      } else {
        next.add(testName);
      }
      return next;
    });
  };

  const getTestTypeColor = (type: TestCase['type']) => {
    switch (type) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      case 'boundary':
        return 'bg-yellow-100 text-yellow-800';
      case 'invalid_value':
        return 'bg-orange-100 text-orange-800';
      case 'invalid_type':
        return 'bg-purple-100 text-purple-800';
      case 'semantic':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const groupedTestCases = testCases.reduce((acc, test) => {
    const type = test.type as TestType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(test);
    return acc;
  }, {} as Record<TestType, TestCase[]>);

  const hasSelectedTests = selectedTests.size > 0 || selectedTypes.size > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Test Generator</h3>
        <div className="flex gap-2">
          <select
            value={generationType}
            onChange={(e) => setGenerationType(e.target.value as 'manual' | 'ai')}
            className="text-sm border border-gray-200 rounded px-3 py-1.5 bg-[var(--bg-primary)] text-[var(--text-primary)]"
          >
            <option value="manual">Manual Generation</option>
            <option value="ai">AI Generation</option>
          </select>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Generating...' : 'Generate Tests'}
          </button>
          {testCases.length > 0 && hasSelectedTests && (
            <button
              onClick={runSelectedTests}
              className="px-3 py-1.5 text-sm bg-green-50 text-green-600 rounded-md hover:bg-green-100 flex items-center gap-1"
            >
              <Play size={16} />
              Run Selected Tests
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {testCases.length > 0 && (
        <div className="border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm font-medium">Filter by Test Type</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(TEST_TYPE_LABELS).map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => toggleTestType(type as TestType)}
                  className={`px-3 py-1.5 text-xs rounded-full border ${
                    selectedTypes.has(type as TestType)
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {Object.entries(groupedTestCases).map(([type, tests]) => (
              <div key={type} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{TEST_TYPE_LABELS[type as TestType]}</h4>
                  <span className="text-sm text-gray-500">{tests.length} tests</span>
                </div>
                <div className="space-y-3">
                  {tests.map((testCase) => (
                    <div key={testCase.name} className="space-y-2">
                      <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={selectedTests.has(testCase.name) || selectedTypes.has(type as TestType)}
                            onChange={() => toggleTestCase(testCase.name)}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300"
                          />
                          <div>
                            <h5 className="font-medium">{testCase.name}</h5>
                            <p className="text-sm text-gray-600">{testCase.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {results[testCase.name] !== undefined && (
                            <div className="flex items-center gap-1">
                              {results[testCase.name].passed ? (
                                <CheckCircle2 className="text-green-500" size={16} />
                              ) : (
                                <XCircle className="text-red-500" size={16} />
                              )}
                              <span className={results[testCase.name].passed ? 'text-green-600' : 'text-red-600'}>
                                {results[testCase.name].passed ? 'Passed' : 'Failed'}
                              </span>
                            </div>
                          )}
                          <button
                            onClick={() => runTest(testCase)}
                            className="px-2 py-1 text-sm bg-gray-50 text-gray-600 rounded hover:bg-gray-100"
                          >
                            Run
                          </button>
                        </div>
                      </div>

                      {results[testCase.name] && (
                        <TestExecutionDetails
                          request={testCase.request}
                          response={results[testCase.name].response}
                          name={testCase.name}
                          description={testCase.description}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestGenerator;