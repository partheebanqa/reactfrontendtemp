import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Code } from 'lucide-react';
import { Request, Response } from '../types';

interface TestExecutionDetailsProps {
  request: Request;
  response: Response | null;
  name: string;
  description: string;
}

type TabType = 'request' | 'response' | 'headers' | 'auth' | 'body';

const TestExecutionDetails: React.FC<TestExecutionDetailsProps> = ({
  request,
  response,
  name,
  description
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('request');

  const formatJson = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between"
      >
        <div>
          <h4 className="font-medium text-left">{name}</h4>
          <p className="text-sm text-gray-600 text-left">{description}</p>
        </div>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200">
          <div className="flex border-b border-gray-200">
            <button
              className={`px-4 py-2 text-sm ${
                activeTab === 'request'
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-600'
              }`}
              onClick={() => setActiveTab('request')}
            >
              Request
            </button>
            <button
              className={`px-4 py-2 text-sm ${
                activeTab === 'response'
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : ''
              }`}
              onClick={() => setActiveTab('response')}
            >
              Response
            </button>
            <button
              className={`px-4 py-2 text-sm ${
                activeTab === 'headers'
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-600'
              }`}
              onClick={() => setActiveTab('headers')}
            >
              Headers
            </button>
            <button
              className={`px-4 py-2 text-sm ${
                activeTab === 'auth'
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-600'
              }`}
              onClick={() => setActiveTab('auth')}
            >
              Auth
            </button>
            {request.method !== 'GET' && (
              <button
                className={`px-4 py-2 text-sm ${
                  activeTab === 'body'
                    ? 'text-blue-600 border-b-2 border-blue-500'
                    : 'text-gray-600'
                }`}
                onClick={() => setActiveTab('body')}
              >
                Body
              </button>
            )}
          </div>

          <div className="p-4">
            {activeTab === 'request' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                    {request.method}
                  </span>
                  <span className="text-sm font-mono">{request.url}</span>
                </div>
                {Object.keys(request.params).length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Query Parameters</h5>
                    <pre className="bg-gray-50 p-2 rounded text-sm overflow-auto">
                      {formatJson(request.params)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'response' && response && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-sm font-medium ${
                      response.status >= 200 && response.status < 300
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {response.status} {response.statusText}
                  </span>
                </div>
                <pre className="bg-gray-50 p-2 rounded text-sm overflow-auto">
                  {formatJson(response.data)}
                </pre>
              </div>
            )}

            {activeTab === 'headers' && (
              <div className="space-y-2">
                <div>
                  <h5 className="text-sm font-medium mb-1">Request Headers</h5>
                  <pre className="bg-gray-50 p-2 rounded text-sm overflow-auto text-black">
                    {formatJson(request.headers)}
                  </pre>
                </div>
                {response && (
                  <div>
                    <h5 className="text-sm font-medium mb-1">Response Headers</h5>
                    <pre className="bg-gray-50 p-2 rounded text-sm overflow-auto text-black">
                      {formatJson(response.headers)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'auth' && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium mb-1">Authentication</h5>
                {request.auth?.type === 'none' ? (
                  <p className="text-sm text-gray-600">No authentication</p>
                ) : (
                  <pre className="bg-gray-50 p-2 rounded text-sm overflow-auto text-black">
                    {formatJson({
                      type: request.auth?.type,
                      ...(request.auth?.username && { username: request.auth.username }),
                      ...(request.auth?.token && { token: request.auth.token }),
                      ...(request.auth?.key && { key: request.auth.key }),
                    })}
                  </pre>
                )}
              </div>
            )}

            {activeTab === 'body' && request.method !== 'GET' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-medium text-gray-700">Request Body</h5>
                  {request.isGraphQL && (
                    <span className="text-sm text-gray-500">GraphQL Request</span>
                  )}
                </div>
                {request.isGraphQL ? (
                  <div className="space-y-2">
                    <div>
                      <h6 className="text-sm font-medium text-gray-600 mb-1">Query</h6>
                      <pre className="bg-gray-50 p-2 rounded text-sm overflow-auto">
                        {request.graphQLQuery || ''}
                      </pre>
                    </div>
                    {request.graphQLVariables && (
                      <div>
                        <h6 className="text-sm font-medium text-gray-600 mb-1">Variables</h6>
                        <pre className="bg-gray-50 p-2 rounded text-sm overflow-auto">
                          {request.graphQLVariables}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <pre className="bg-gray-50 p-2 rounded text-sm overflow-auto">
                    {formatJson(request.body)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestExecutionDetails;