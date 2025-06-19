import React, { useRef, useState } from 'react';
import { ChainRequest, CollectionRequest } from '../types';
import RequestParams from './RequestParams';
import RequestHeaders from './RequestHeaders';
import RequestAuth from './RequestAuth';
import VariableSuggestions from './VariableSuggestions';

interface RequestChainTabsProps {
  request: CollectionRequest;
  onUpdate: (updates: Partial<CollectionRequest>) => void;
  activeTab: 'params' | 'auth' | 'headers' | 'body';
  onTabChange: (tab: 'params' | 'auth' | 'headers' | 'body') => void;
  variables?: Record<string, any>;
}

const RequestChainTabs: React.FC<RequestChainTabsProps> = ({
  request,
  onUpdate,
  activeTab,
  onTabChange,
  variables,
}) => {
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleVariableSelect = (variableName: string) => {
    if (!bodyRef.current) return;

    const start = bodyRef.current.selectionStart || 0;
    const end = bodyRef.current.selectionEnd || 0;
    const currentValue = bodyRef.current.value;

    // Find the start of the current variable
    let varStart = start - 1;
    while (varStart >= 0 && currentValue[varStart] !== '$') {
      varStart--;
    }

    // Replace the partial variable with the complete one
    const newValue = 
      currentValue.substring(0, varStart) +
      '${' + variableName + '}' +
      currentValue.substring(end);

    onUpdate({ body: newValue });
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(request.body);
      const formatted = JSON.stringify(parsed, null, 2);
      onUpdate({ body: formatted });
      setJsonError(null);
    } catch (err) {
      setJsonError('Invalid JSON format');
    }
  };

  const updateBody = (body: string) => {
    onUpdate({ body });
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

  const storedDataRepoVars = localStorage.getItem('dataRepoVariables');
  const dataRepoVariables = storedDataRepoVars ? JSON.parse(storedDataRepoVars) : [];

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <div className="flex border-b border-gray-200">
        <button 
          className={`px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border-b-2 ${
            activeTab === 'params' ? 'border-blue-500' : 'border-transparent'
          }`}
          onClick={() => onTabChange('params')}
        >
          Params
        </button>
        <button 
          className={`px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border-b-2 ${
            activeTab === 'auth' ? 'border-blue-500' : 'border-transparent'
          }`}
          onClick={() => onTabChange('auth')}
        >
          Authorization
        </button>
        <button 
          className={`px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border-b-2 ${
            activeTab === 'headers' ? 'border-blue-500' : 'border-transparent'
          }`}
          onClick={() => onTabChange('headers')}
        >
          Headers
        </button>
        {request.method !== 'GET' && (
          <button 
            className={`px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border-b-2 ${
              activeTab === 'body' ? 'border-blue-500' : 'border-transparent'
            }`}
            onClick={() => onTabChange('body')}
          >
            Body
          </button>
        )}
      </div>

      <div className="p-4">
        {activeTab === 'params' && (
          <RequestParams
            params={request.params}
            onChange={(params) => onUpdate({ params })}
          />
        )}
        {activeTab === 'auth' && (
            <RequestAuth
              authorizationType={request.authorizationType ? request.authorizationType : "none"}
              authorization={request.authorization ? request.authorization:{}}
              onChange={(authType, auth) => 
                onUpdate({
                  authorizationType: authType,
                  authorization: auth
                })
              }
            />
        )}
        {activeTab === 'headers' && (
          <RequestHeaders
            headers={request.headers}
            onChange={(headers) => onUpdate({ headers })}
          />
        )}
        {activeTab === 'body' && request.method !== 'GET' && (
          <div className="space-y-2 relative">
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
                ref={bodyRef}
                value={request.body}
                onChange={(e) => updateBody(e.target.value)}
                className={`w-full h-48 px-3 py-2 text-sm font-mono border rounded ${
                  jsonError ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Enter JSON body"
                spellCheck={false}
              />
              {jsonError && (
                <div className="absolute bottom-2 right-2 text-sm text-red-500 bg-white px-2 py-1 rounded-md shadow">
                  {jsonError}
                </div>
              )}
            </div>
            <VariableSuggestions
              inputRef={bodyRef}
              chainVariables={variables}
              dataRepoVariables={dataRepoVariables}
              onSelect={handleVariableSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestChainTabs;