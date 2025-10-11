import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Globe, Clock, AlertCircle } from 'lucide-react';
import { CodeBlock } from './CodeBlock';
// import JsonView from 'react18-json-view';




export interface TestCase {
  id: string;
  name: string;
  category: string;
  method: string;
  url: string;
  status: 'passed' | 'failed' | 'skipped';
  severity: 'low' | 'medium' | 'high' | 'critical';
  responseSize: number;
  duration: number;
  extractedVariables: any;
  requestCurl: string;
  response: string;
}

export interface TestCategory {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  apis: TestCase[];
}

export interface TestSuiteData {
  id: string;
  name: string;
  description: string;
  status?: 'completed' | 'aborted' | 'partial';
  abortReason?: string;
  workspaceId: string;
  environmentId: string;
  requestId: string;
  lastExecutionDate: string;
  duration: number;
  executedBy: string;
  successRate: number;
  totalTestCases: number;
  successfulTestCases: number;
  failedTestCases: number;
  skippedTestCases: number;
  positiveTests: TestCategory;
  negativeTests: TestCategory;
  functionalTests: TestCategory;
  semanticTests: TestCategory;
  edgeCaseTests: TestCategory;
  securityTests: TestCategory;
  advancedSecurityTests: TestCategory;
  totalAssertions: number;
  passedAssertions: number;
  failedAssertions: number;
  assertionSuccessRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReportResponse {
  data: TestSuiteData;
  message: string;
}

interface TestCaseDetailProps {
  testCase: TestCase;
}

export const TestCaseDetail: React.FC<TestCaseDetailProps> = ({ testCase }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'skipped':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-600 text-white';
      case 'medium':
        return 'bg-yellow-600 text-white';
      case 'low':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const formatResponse = (response: string) => {
    try {
      const parsed = JSON.parse(response);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return response;
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
      <div
        className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}

            <div>
              <h3 className="font-semibold text-gray-900">{testCase.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(testCase.status)}`}>
                  {testCase.status.toUpperCase()}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getSeverityColor(testCase.severity)}`}>
                  {testCase.severity.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Globe className="w-4 h-4" />
              <span>{testCase.method}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{testCase.duration}ms</span>
            </div>
            <div className="flex items-center space-x-1">
              <AlertCircle className="w-4 h-4" />
              <span>{testCase.responseSize}B</span>
            </div>
          </div>
        </div>
      </div>



      {isExpanded && (
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Endpoint</h4>
              <CodeBlock
                language="http"
                code={`${testCase.method.toUpperCase()} ${testCase.url}`}
              />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Request cURL</h4>
              <CodeBlock language="bash" code={testCase.requestCurl} />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Response</h4>
              <CodeBlock
                language="json"
                code={formatResponse(testCase.response)}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};