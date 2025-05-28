import React, { useState } from 'react';
import { Send, ChevronDown, Code } from 'lucide-react';
import { Request } from '../types';
import RequestParams from './RequestParams';
import RequestHeaders from './RequestHeaders';
import RequestAuth from './RequestAuth';
import AssertionsPanel from './AssertionsPanel';
import AssertionResults from './AssertionResults';
import GraphQLEditor from './GraphQLEditor';
import TestGenerator from './TestGenerator';
import Parametrization from './Parametrization';

interface RequestPanelProps {
  request: Request;
  setRequest: (request: Request) => void;
  onSend: () => void;
  loading: boolean;
  response?: any;
}

type TabType = 'params' | 'auth' | 'headers' | 'body' | 'tests' | 'ai_tests' | 'parametrization';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const RequestPanel: React.FC<RequestPanelProps> = ({
  request,
  setRequest,
  onSend,
  loading,
  response
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('params');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const updateAuth = (auth: Request['auth']) => {
    setRequest({ ...request, auth });
  };

  const updateHeaders = (headers: Record<string, string>) => {
    setRequest({ ...request, headers });
  };

  const updateParams = (params: Record<string, string>) => {
    setRequest({ ...request, params });
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(request.body);
      const formatted = JSON.stringify(parsed, null, 2);
      setRequest({ ...request, body: formatted });
      setJsonError(null);
    } catch (err) {
      setJsonError('Invalid JSON format');
    }
  };

  const updateBody = (body: string) => {
    setRequest({ ...request, body });
    try {
      if (body.trim()) {
        JSON.parse(body);
        setJsonError(null);
      } else {
        setJsonError(null);
      }
    } catch (err) {
      setJsonError('Invalid JSON format');
    }
  };

  const updateAssertions = (assertions: Request['assertions']) => {
    setRequest({ ...request, assertions });
  };

  const updateGraphQL = (updates: { query?: string; variables?: string }) => {
    setRequest({
      ...request,
      graphQLQuery: updates.query ?? request.graphQLQuery,
      graphQLVariables: updates.variables ?? request.graphQLVariables,
    });
  };

  return (
    <div className="rounded-lg shadow-lg  mb-4">
      <div className="p-4">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <select
              className="appearance-none bg-blue-50 text-blue-600 font-semibold px-4 py-2 rounded-md pr-8"
              value={request.method}
              onChange={(e) =>
                setRequest({ ...request, method: e.target.value })
              }
              disabled={request.isGraphQL}
            >
              {HTTP_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600"
            />
          </div>
          <input
            type="text"
            placeholder="Enter URL or paste text"
            className="flex-1 border border-gray-200 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            value={request.url}
            onChange={(e) => setRequest({ ...request, url: e.target.value })}
          />
          <div className="flex items-center gap-2">
            {/* <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={request.isGraphQL}
                onChange={(e) => setRequest({ ...request, isGraphQL: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              GraphQL
            </label> */}
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-blue-600"
              onClick={onSend}
              disabled={loading || !request.url || (request.method !== 'GET' && jsonError !== null)}
            >
              <Send size={16} />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200">
        <div className="flex">
          <button 
            className={`px-4 py-2 text-sm  border-b-2 ${
              activeTab === 'params' ? 'border-blue-500' : 'border-transparent'
            }`}
            onClick={() => setActiveTab('params')}
          >
            Params
          </button>
          <button 
            className={`px-4 py-2 text-sm border-b-2 ${
              activeTab === 'auth' ? 'border-blue-500' : 'border-transparent'
            }`}
            onClick={() => setActiveTab('auth')}
          >
            Authorization
          </button>
          <button 
            className={`px-4 py-2 text-sm  border-b-2 ${
              activeTab === 'headers' ? 'border-blue-500' : 'border-transparent'
            }`}
            onClick={() => setActiveTab('headers')}
          >
            Headers
          </button>
          {!request.isGraphQL && request.method !== 'GET' && (
            <button 
              className={`px-4 py-2 text-sm border-b-2 ${
                activeTab === 'body' ? 'border-blue-500' : 'border-transparent'
              }`}
              onClick={() => setActiveTab('body')}
            >
              Body
            </button>
          )}
          <button 
            className={`px-4 py-2 text-sm border-b-2 ${
              activeTab === 'tests' ? 'border-blue-500' : 'border-transparent'
            }`}
            onClick={() => setActiveTab('tests')}
          >
            Tests
          </button>
          <button 
            className={`px-4 py-2 text-sm border-b-2 ${
              activeTab === 'ai_tests' ? 'border-blue-500' : 'border-transparent'
            }`}
            onClick={() => setActiveTab('ai_tests')}
          >
            AI Tests
          </button>
          <button 
            className={`px-4 py-2 text-sm border-b-2 ${
              activeTab === 'parametrization' ? 'border-blue-500' : 'border-transparent'
            }`}
            onClick={() => setActiveTab('parametrization')}
          >
            Parametrization
          </button>
        </div>
        <div className="p-4">
          {activeTab === 'params' && (
            <RequestParams
              params={request.params}
              onChange={updateParams}
            />
          )}
          {activeTab === 'auth' && (
            <RequestAuth
              auth={request.auth}
              onChange={updateAuth}
            />
          )}
          {activeTab === 'headers' && (
            <RequestHeaders
              headers={request.headers}
              onChange={updateHeaders}
            />
          )}
          {activeTab === 'body' && !request.isGraphQL && request.method !== 'GET' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Request Body (JSON)</h3>
                <button
                  onClick={formatJson}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Format JSON
                </button>
              </div>
              <div className="relative">
                <textarea
                  value={request.body}
                  onChange={(e) => updateBody(e.target.value)}
                  className={`w-full h-48 px-3 py-2 text-sm font-mono border rounded ${
                    jsonError ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Enter JSON body"
                  spellCheck={false}
                />
                {jsonError && (
                  <div className="absolute bottom-2 right-2 text-sm text-red-500 px-2 py-1 rounded-md shadow">
                    {jsonError}
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'tests' && (
            <AssertionsPanel
              assertions={request.assertions || {}}
              onChange={updateAssertions}
              availablePaths={response?.data ? Object.keys(response.data) : []}
            />
          )}
          {activeTab === 'ai_tests' && (
            <TestGenerator
              request={request}
              onRunTest={async (testRequest) => {
                setRequest(testRequest);
                await onSend();
                return response;
              }}
            />
          )}
          {activeTab === 'parametrization' && (
            <Parametrization
              request={request}
              onRequestChange={setRequest}
              onSend={onSend}
            />
          )}
          {request.isGraphQL && (
            <GraphQLEditor
              query={request.graphQLQuery || ''}
              variables={request.graphQLVariables || ''}
              onChange={updateGraphQL}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestPanel;