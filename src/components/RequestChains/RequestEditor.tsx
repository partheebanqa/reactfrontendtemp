import React, { useState } from 'react';
import { 
  Play, 
  Save, 
  Copy, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Code,
  Key,
  Settings,
  FileText,
  TestTube,
  Shield,
  Download,
  Share,
  Search
} from 'lucide-react';
import { APIRequest, ExecutionLog, TestScript, Variable, DataExtraction } from '../../types';
import { ResponseExplorer } from './ResponseExplorer';

interface RequestEditorProps {
  request: APIRequest;
  globalVariables?: Variable[];
  onUpdate: (updates: Partial<APIRequest>) => void;
  onExecute?: (request: APIRequest) => Promise<ExecutionLog>;
  onSave?: () => void;
  compact?: boolean;
}

export function RequestEditor({ 
  request, 
  globalVariables = [], 
  onUpdate, 
  onExecute, 
  onSave, 
  compact = false 
}: RequestEditorProps) {
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'auth' | 'tests' | 'settings'>('params');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionLog | null>(null);
  const [showResponse, setShowResponse] = useState(false);
  const [extractedVariables, setExtractedVariables] = useState<Record<string, any>>({});
  const [responseTab, setResponseTab] = useState<'body' | 'cookies' | 'headers' | 'test-results'>('body');

  const replaceVariables = (text: string, vars: Variable[]): string => {
    let result = text;
    vars.forEach(variable => {
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      result = result.replace(regex, variable.value);
    });
    return result;
  };

  const handleExecute = async () => {
    if (!request.url) return;
    
    setIsExecuting(true);
    try {
      // Replace variables in URL, headers, and body
      const processedUrl = replaceVariables(request.url, globalVariables);
      const processedHeaders: Record<string, string> = {};
      
      request.headers.forEach(header => {
        if (header.enabled) {
          processedHeaders[header.key] = replaceVariables(header.value, globalVariables);
        }
      });

      let processedBody = request.body ? replaceVariables(request.body, globalVariables) : undefined;
      
      // Add URL parameters
      const url = new URL(processedUrl);
      request.params.forEach(param => {
        if (param.enabled) {
          url.searchParams.set(param.key, replaceVariables(param.value, globalVariables));
        }
      });

      // Set content type based on body type
      if (request.bodyType === 'json' && processedBody) {
        processedHeaders['Content-Type'] = 'application/json';
      } else if (request.bodyType === 'x-www-form-urlencoded') {
        processedHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
      }

      // Add authentication
      if (request.authType === 'bearer' && request.authToken) {
        processedHeaders['Authorization'] = `Bearer ${replaceVariables(request.authToken, globalVariables)}`;
      } else if (request.authType === 'basic' && request.authUsername && request.authPassword) {
        const credentials = btoa(`${request.authUsername}:${request.authPassword}`);
        processedHeaders['Authorization'] = `Basic ${credentials}`;
      } else if (request.authType === 'apikey' && request.authApiKey && request.authApiValue) {
        if (request.authApiLocation === 'header') {
          processedHeaders[request.authApiKey] = replaceVariables(request.authApiValue, globalVariables);
        } else {
          url.searchParams.set(request.authApiKey, replaceVariables(request.authApiValue, globalVariables));
        }
      }

      const requestOptions: RequestInit = {
        method: request.method,
        headers: processedHeaders,
        body: processedBody,
      };

      const startTime = Date.now();
      const response = await fetch(url.toString(), requestOptions);
      const endTime = Date.now();
      const responseBody = await response.text();
      
      // Extract variables from response
      const extractedData = extractDataFromResponse(
        {
          body: responseBody,
          headers: Object.fromEntries(response.headers.entries()),
          cookies: parseCookies(response.headers.get('set-cookie') || '')
        },
        request.dataExtractions
      );

      const log: ExecutionLog = {
        id: Date.now().toString(),
        chainId: 'current-chain',
        requestId: request.id,
        status: response.ok ? 'success' : 'error',
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration: endTime - startTime,
        request: {
          method: request.method,
          url: url.toString(),
          headers: processedHeaders,
          body: processedBody
        },
        response: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseBody,
          size: responseBody.length,
          cookies: parseCookies(response.headers.get('set-cookie') || '')
        },
        extractedVariables: extractedData
      };

      setExecutionResult(log);
      setShowResponse(true);
      setExtractedVariables(extractedData);

    } catch (error) {
      const endTime = Date.now();
      
      setExecutionResult({
        id: Date.now().toString(),
        chainId: 'current-chain',
        requestId: request.id,
        status: 'error',
        startTime: new Date().toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration: 0,
        request: {
          method: request.method,
          url: request.url,
          headers: {},
          body: request.body
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      setShowResponse(true);
    } finally {
      setIsExecuting(false);
    }
  };

  const parseCookies = (cookieHeader: string): Record<string, string> => {
    const cookies: Record<string, string> = {};
    if (!cookieHeader) return cookies;
    
    cookieHeader.split(',').forEach(cookie => {
      const [nameValue] = cookie.trim().split(';');
      if (nameValue) {
        const [name, value] = nameValue.split('=');
        if (name && value) {
          cookies[name.trim()] = value.trim();
        }
      }
    });
    
    return cookies;
  };

  const extractDataFromResponse = (
    response: any, 
    extractions: APIRequest['dataExtractions']
  ): Record<string, any> => {
    const extracted: Record<string, any> = {};
    
    extractions.forEach(extraction => {
      try {
        let value;
        
        if (extraction.source === 'response_body') {
          // JSON path extraction
          const jsonData = typeof response.body === 'string' 
            ? JSON.parse(response.body) 
            : response.body;
          
          value = getValueByPath(jsonData, extraction.path);
        } else if (extraction.source === 'response_header') {
          value = response.headers[extraction.path.toLowerCase()];
        } else if (extraction.source === 'response_cookie') {
          value = response.cookies?.[extraction.path];
        }
        
        if (value !== undefined) {
          // Apply transformation if specified
          if (extraction.transform) {
            try {
              // Create a function that applies the transformation
              const transformFunction = new Function('value', `return ${extraction.transform}`);
              value = transformFunction(value);
            } catch (transformError) {
              console.error(`Transform error for ${extraction.variableName}:`, transformError);
            }
          }
          extracted[extraction.variableName] = value;
        }
      } catch (error) {
        console.error(`Failed to extract ${extraction.variableName}:`, error);
      }
    });
    
    return extracted;
  };

  const getValueByPath = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object') {
        if (key.includes('[') && key.includes(']')) {
          const arrayKey = key.substring(0, key.indexOf('['));
          const index = parseInt(key.substring(key.indexOf('[') + 1, key.indexOf(']')));
          return current[arrayKey] && current[arrayKey][index];
        }
        return current[key];
      }
      return undefined;
    }, obj);
  };

  const handleExtractVariable = (extraction: DataExtraction) => {
    const updatedExtractions = [...request.dataExtractions, extraction];
    onUpdate({ dataExtractions: updatedExtractions });
    
    // Re-extract variables with new configuration
    if (executionResult?.response) {
      const extracted = extractDataFromResponse(
        executionResult.response,
        updatedExtractions
      );
      setExtractedVariables(extracted);
    }
  };

  const handleRemoveExtraction = (variableName: string) => {
    const updatedExtractions = request.dataExtractions.filter(e => e.variableName !== variableName);
    onUpdate({ dataExtractions: updatedExtractions });
    
    // Remove from extracted variables
    const newExtracted = { ...extractedVariables };
    delete newExtracted[variableName];
    setExtractedVariables(newExtracted);
  };

  const addParam = () => {
    onUpdate({
      params: [...request.params, { key: '', value: '', enabled: true }]
    });
  };

  const updateParam = (index: number, updates: Partial<{ key: string; value: string; enabled: boolean }>) => {
    const updatedParams = request.params.map((param, i) =>
      i === index ? { ...param, ...updates } : param
    );
    onUpdate({ params: updatedParams });
  };

  const removeParam = (index: number) => {
    onUpdate({
      params: request.params.filter((_, i) => i !== index)
    });
  };

  const addHeader = () => {
    onUpdate({
      headers: [...request.headers, { key: '', value: '', enabled: true }]
    });
  };

  const updateHeader = (index: number, updates: Partial<{ key: string; value: string; enabled: boolean }>) => {
    const updatedHeaders = request.headers.map((header, i) =>
      i === index ? { ...header, ...updates } : header
    );
    onUpdate({ headers: updatedHeaders });
  };

  const removeHeader = (index: number) => {
    onUpdate({
      headers: request.headers.filter((_, i) => i !== index)
    });
  };

  const addTest = (type: 'status' | 'responseTime' | 'jsonContent') => {
    const newTest: TestScript = {
      id: Date.now().toString(),
      type,
      enabled: true,
      ...(type === 'status' && { 
        operator: 'equal', 
        expectedValue: '200',
        description: 'Status code should be equal to 200 (OK)'
      }),
      ...(type === 'responseTime' && { 
        operator: 'lessThan', 
        expectedValue: '200',
        description: 'Response time should be less than 200 ms'
      }),
      ...(type === 'jsonContent' && { 
        jsonPath: '$.property',
        operator: 'contain', 
        expectedValue: 'expected value',
        description: 'JSON value at path $.property should contain expected value'
      })
    };
    
    onUpdate({
      testScripts: [...(request.testScripts || []), newTest]
    });
  };

  const updateTest = (testId: string, updates: Partial<TestScript>) => {
    const updatedTests = (request.testScripts || []).map(test =>
      test.id === testId ? { ...test, ...updates } : test
    );
    onUpdate({ testScripts: updatedTests });
  };

  const removeTest = (testId: string) => {
    onUpdate({
      testScripts: (request.testScripts || []).filter(test => test.id !== testId)
    });
  };

  const getMethodColor = (method: string) => {
    const colors = {
      GET: 'text-green-600 bg-green-50 border-green-200',
      POST: 'text-blue-600 bg-blue-50 border-blue-200',
      PUT: 'text-orange-600 bg-orange-50 border-orange-200',
      DELETE: 'text-red-600 bg-red-50 border-red-200',
      PATCH: 'text-purple-600 bg-purple-50 border-purple-200',
      HEAD: 'text-gray-600 bg-gray-50 border-gray-200',
      OPTIONS: 'text-yellow-600 bg-yellow-50 border-yellow-200'
    };
    return colors[method as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const formatResponseBody = (body: string, contentType?: string) => {
    try {
      if (contentType?.includes('application/json') || body.trim().startsWith('{')) {
        return JSON.stringify(JSON.parse(body), null, 2);
      }
    } catch {
      // Return as-is if not valid JSON
    }
    return body;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const tabs = [
    { id: 'params', label: 'Params', icon: FileText },
    { id: 'headers', label: 'Headers', icon: Code },
    { id: 'body', label: 'Body', icon: FileText },
    { id: 'auth', label: 'Auth', icon: Shield },
    { id: 'tests', label: 'Tests', icon: TestTube },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Request Header */}
      {!compact && (
        <div className="p-6 border-b border-gray-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Request Name
              </label>
              <input
                type="text"
                value={request.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="New Request"
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                value={request.method}
                onChange={(e) => onUpdate({ method: e.target.value as APIRequest['method'] })}
                className={`px-3 py-2 border rounded-lg font-medium text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${getMethodColor(request.method)}`}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
                <option value="HEAD">HEAD</option>
                <option value="OPTIONS">OPTIONS</option>
              </select>
              
              <input
                type="url"
                value={request.url}
                onChange={(e) => onUpdate({ url: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter URL or paste text"
              />
              
              <button
                onClick={handleExecute}
                disabled={isExecuting || !request.url}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isExecuting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span>Run</span>
              </button>
              
              {onSave && (
                <button
                  onClick={onSave}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compact Header for Inline Editing */}
      {compact && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <select
              value={request.method}
              onChange={(e) => onUpdate({ method: e.target.value as APIRequest['method'] })}
              className={`px-2 py-1 border rounded text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent ${getMethodColor(request.method)}`}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
              <option value="HEAD">HEAD</option>
              <option value="OPTIONS">OPTIONS</option>
            </select>
            
            <input
              type="url"
              value={request.url}
              onChange={(e) => onUpdate({ url: e.target.value })}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter URL"
            />
            
            <button
              onClick={handleExecute}
              disabled={isExecuting || !request.url}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExecuting ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              ) : (
                <Play className="w-3 h-3" />
              )}
              <span>Run</span>
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.id === 'tests' && request.testScripts && request.testScripts.length > 0 && (
                  <span className="ml-1 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
                    {request.testScripts.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'params' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Query Parameters</h3>
              <button
                onClick={addParam}
                className="flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Parameter</span>
              </button>
            </div>
            
            {request.params.length > 0 ? (
              <div className="space-y-2">
                {request.params.map((param, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={param.key}
                      onChange={(e) => updateParam(index, { key: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Key"
                    />
                    <input
                      type="text"
                      value={param.value}
                      onChange={(e) => updateParam(index, { value: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Value (use {{variableName}} for variables)"
                    />
                    <button
                      onClick={() => updateParam(index, { enabled: !param.enabled })}
                      className={`p-2 rounded-lg transition-colors ${
                        param.enabled ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {param.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => removeParam(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>No parameters added. Click "Add Parameter" to get started.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Headers</h3>
              <button
                onClick={addHeader}
                className="flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Header</span>
              </button>
            </div>
            
            {request.headers.length > 0 ? (
              <div className="space-y-2">
                {request.headers.map((header, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={header.key}
                      onChange={(e) => updateHeader(index, { key: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Header name"
                    />
                    <input
                      type="text"
                      value={header.value}
                      onChange={(e) => updateHeader(index, { value: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Header value (use {{variableName}} for variables)"
                    />
                    <button
                      onClick={() => updateHeader(index, { enabled: !header.enabled })}
                      className={`p-2 rounded-lg transition-colors ${
                        header.enabled ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {header.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => removeHeader(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Code className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>No headers added. Click "Add Header" to get started.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'body' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Request Body</h3>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="bodyType"
                  value="none"
                  checked={request.bodyType === 'none'}
                  onChange={(e) => onUpdate({ bodyType: e.target.value as APIRequest['bodyType'] })}
                  className="text-blue-600"
                />
                <span className="text-sm">None</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="bodyType"
                  value="form-data"
                  checked={request.bodyType === 'form-data'}
                  onChange={(e) => onUpdate({ bodyType: e.target.value as APIRequest['bodyType'] })}
                  className="text-blue-600"
                />
                <span className="text-sm">Form Data</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="bodyType"
                  value="x-www-form-urlencoded"
                  checked={request.bodyType === 'x-www-form-urlencoded'}
                  onChange={(e) => onUpdate({ bodyType: e.target.value as APIRequest['bodyType'] })}
                  className="text-blue-600"
                />
                <span className="text-sm">x-www-form-urlencoded</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="bodyType"
                  value="raw"
                  checked={request.bodyType === 'raw'}
                  onChange={(e) => onUpdate({ bodyType: e.target.value as APIRequest['bodyType'] })}
                  className="text-blue-600"
                />
                <span className="text-sm">Raw</span>
              </label>
            </div>

            {request.bodyType === 'raw' && (
              <div className="space-y-2">
                <div className="flex items-center justify-end">
                  <select
                    value={request.rawBodyType || 'text'}
                    onChange={(e) => onUpdate({ rawBodyType: e.target.value as 'text' | 'json' | 'xml' | 'html' })}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="text">Text</option>
                    <option value="json">JSON</option>
                    <option value="xml">XML</option>
                    <option value="html">HTML</option>
                  </select>
                </div>
                <textarea
                  value={request.body || ''}
                  onChange={(e) => onUpdate({ body: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Enter request body... Use {{variableName}} for variables"
                />
              </div>
            )}

            {request.bodyType !== 'none' && request.bodyType !== 'raw' && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>Form data editor coming soon...</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'auth' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Authentication</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auth Type
                </label>
                <select
                  value={request.authType || 'none'}
                  onChange={(e) => onUpdate({ authType: e.target.value as APIRequest['authType'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="none">No Auth</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="basic">Basic Auth</option>
                  <option value="apikey">API Key</option>
                  <option value="oauth2">OAuth 2.0</option>
                </select>
              </div>

              {request.authType === 'bearer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bearer Token
                  </label>
                  <input
                    type="text"
                    value={request.authToken || ''}
                    onChange={(e) => onUpdate({ authToken: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter bearer token or use {{tokenVariable}}"
                  />
                </div>
              )}

              {request.authType === 'basic' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={request.authUsername || ''}
                      onChange={(e) => onUpdate({ authUsername: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={request.authPassword || ''}
                      onChange={(e) => onUpdate({ authPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Password"
                    />
                  </div>
                </div>
              )}

              {request.authType === 'apikey' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Key
                      </label>
                      <input
                        type="text"
                        value={request.authApiKey || ''}
                        onChange={(e) => onUpdate({ authApiKey: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="API Key name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Value
                      </label>
                      <input
                        type="text"
                        value={request.authApiValue || ''}
                        onChange={(e) => onUpdate({ authApiValue: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="API Key value"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add to
                    </label>
                    <select
                      value={request.authApiLocation || 'header'}
                      onChange={(e) => onUpdate({ authApiLocation: e.target.value as 'header' | 'query' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="header">Header</option>
                      <option value="query">Query Params</option>
                    </select>
                  </div>
                </div>
              )}

              {request.authType === 'oauth2' && (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>OAuth 2.0 configuration coming soon...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Test Scripts</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => addTest('responseTime')}
                  className="flex items-center space-x-2 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Clock className="w-4 h-4" />
                  <span>Response Time</span>
                </button>
                <button
                  onClick={() => addTest('status')}
                  className="flex items-center space-x-2 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Status Code</span>
                </button>
                <button
                  onClick={() => addTest('jsonContent')}
                  className="flex items-center space-x-2 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Code className="w-4 h-4" />
                  <span>JSON Content</span>
                </button>
              </div>
            </div>

            {request.testScripts && request.testScripts.length > 0 ? (
              <div className="space-y-3">
                {request.testScripts.map((test) => (
                  <div key={test.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        {test.type === 'status' && 'Status Code Test'}
                        {test.type === 'responseTime' && 'Response Time Test'}
                        {test.type === 'jsonContent' && 'JSON Content Test'}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateTest(test.id, { enabled: !test.enabled })}
                          className={`p-1 rounded transition-colors ${
                            test.enabled ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'
                          }`}
                        >
                          {test.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => removeTest(test.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      {test.type === 'status' && (
                        <>
                          <div>
                            <span className="text-gray-600">Status code should be</span>
                          </div>
                          <select
                            value={test.operator}
                            onChange={(e) => updateTest(test.id, { operator: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="equal">equal</option>
                            <option value="notEqual">not equal</option>
                            <option value="greaterThan">greater than</option>
                            <option value="lessThan">less than</option>
                          </select>
                          <select
                            value={test.expectedValue}
                            onChange={(e) => updateTest(test.id, { expectedValue: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="200">200 (OK)</option>
                            <option value="201">201 (Created)</option>
                            <option value="204">204 (No Content)</option>
                            <option value="400">400 (Bad Request)</option>
                            <option value="401">401 (Unauthorized)</option>
                            <option value="404">404 (Not Found)</option>
                            <option value="500">500 (Server Error)</option>
                          </select>
                        </>
                      )}

                      {test.type === 'responseTime' && (
                        <>
                          <div>
                            <span className="text-gray-600">Response time should be</span>
                          </div>
                          <select
                            value={test.operator}
                            onChange={(e) => updateTest(test.id, { operator: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="lessThan">less than</option>
                            <option value="greaterThan">greater than</option>
                            <option value="equal">equal to</option>
                          </select>
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              value={test.expectedValue}
                              onChange={(e) => updateTest(test.id, { expectedValue: e.target.value })}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="200"
                            />
                            <span className="text-gray-500">ms</span>
                          </div>
                        </>
                      )}

                      {test.type === 'jsonContent' && (
                        <>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-600">JSON value at path</span>
                            <input
                              type="text"
                              value={test.jsonPath || ''}
                              onChange={(e) => updateTest(test.id, { jsonPath: e.target.value })}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                              placeholder="$.property"
                            />
                          </div>
                          <select
                            value={test.operator}
                            onChange={(e) => updateTest(test.id, { operator: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="contain">contain</option>
                            <option value="equal">equal</option>
                            <option value="notEqual">not equal</option>
                            <option value="exist">exist</option>
                            <option value="notExist">not exist</option>
                          </select>
                          <input
                            type="text"
                            value={test.expectedValue}
                            onChange={(e) => updateTest(test.id, { expectedValue: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="expected value"
                          />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TestTube className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="mb-4">No tests added. Click one of the buttons above to add a test.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Request Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeout (ms)
                </label>
                <input
                  type="number"
                  value={request.timeout}
                  onChange={(e) => onUpdate({ timeout: parseInt(e.target.value) || 5000 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1000"
                  max="60000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Retries
                </label>
                <input
                  type="number"
                  value={request.retries}
                  onChange={(e) => onUpdate({ retries: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="5"
                />
              </div>
            </div>

            <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <h4 className="font-medium text-orange-900">Error Handling</h4>
              </div>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="errorHandling"
                    value="stop"
                    checked={request.errorHandling === 'stop'}
                    onChange={(e) => onUpdate({ errorHandling: e.target.value as 'stop' | 'continue' | 'retry' })}
                    className="text-orange-600"
                  />
                  <span className="text-sm text-orange-800">Stop chain on failure</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="errorHandling"
                    value="continue"
                    checked={request.errorHandling === 'continue'}
                    onChange={(e) => onUpdate({ errorHandling: e.target.value as 'stop' | 'continue' | 'retry' })}
                    className="text-orange-600"
                  />
                  <span className="text-sm text-orange-800">Continue to next step</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="errorHandling"
                    value="retry"
                    checked={request.errorHandling === 'retry'}
                    onChange={(e) => onUpdate({ errorHandling: e.target.value as 'stop' | 'continue' | 'retry' })}
                    className="text-orange-600"
                  />
                  <span className="text-sm text-orange-800">Retry with backoff</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Response Section - New Design */}
      {executionResult && (
        <div className="border-t border-gray-200">
          {/* Response Header */}
          <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              {executionResult.status === 'success' ? (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-green-700">Response</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium text-red-700">Response</span>
                </div>
              )}
              
              {executionResult.response && (
                <>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    executionResult.response.status < 300 ? 'bg-green-100 text-green-800' :
                    executionResult.response.status < 400 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {executionResult.response.status} {
                      executionResult.response.status === 200 ? 'OK' :
                      executionResult.response.status === 201 ? 'Created' :
                      executionResult.response.status === 404 ? 'Not Found' :
                      executionResult.response.status === 500 ? 'Server Error' : ''
                    }
                  </span>
                  
                  <span className="text-sm text-gray-600">
                    {executionResult.duration}ms
                  </span>
                  
                  <span className="text-sm text-gray-600">
                    {(executionResult.response.size / 1024).toFixed(2)} KB
                  </span>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowResponse(!showResponse)}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded transition-colors"
              >
                {showResponse ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span>{showResponse ? 'Hide' : 'Show'}</span>
              </button>
            </div>
          </div>

          {showResponse && executionResult.response && (
            <>
              {/* Response Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'body', label: 'Body', count: null },
                    { id: 'cookies', label: 'Cookies', count: executionResult.response.cookies ? Object.keys(executionResult.response.cookies).length : 0 },
                    { id: 'headers', label: 'Headers', count: Object.keys(executionResult.response.headers).length },
                    { id: 'test-results', label: 'Test Results', count: null }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setResponseTab(tab.id as typeof responseTab)}
                      className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                        responseTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.count !== null && tab.count > 0 && (
                        <span className="ml-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Response Content */}
              <div className="p-6">
                {responseTab === 'body' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">JSON</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyToClipboard(executionResult.response!.body)}
                          className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>
                        <button className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors">
                          <Share className="w-3 h-3" />
                          <span>Share</span>
                        </button>
                        <button className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors">
                          <Download className="w-3 h-3" />
                          <span>Save</span>
                        </button>
                        <button className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors">
                          <Search className="w-3 h-3" />
                          <span>Search</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm font-mono overflow-x-auto max-h-96 leading-relaxed">
                        <code className="text-gray-800">
                          {formatResponseBody(executionResult.response.body, executionResult.response.headers['content-type'])}
                        </code>
                      </pre>
                      
                      {/* Line numbers */}
                      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-100 border-r border-gray-200 rounded-l-lg flex flex-col text-xs text-gray-500 font-mono">
                        {formatResponseBody(executionResult.response.body, executionResult.response.headers['content-type'])
                          .split('\n')
                          .map((_, index) => (
                            <div key={index} className="px-2 py-0.5 text-right leading-relaxed">
                              {index + 1}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {responseTab === 'cookies' && (
                  <div className="space-y-3">
                    {executionResult.response.cookies && Object.keys(executionResult.response.cookies).length > 0 ? (
                      Object.entries(executionResult.response.cookies).map(([name, value]) => (
                        <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                          <div>
                            <span className="font-medium text-gray-900">{name}</span>
                            <p className="text-sm text-gray-600 font-mono">{value}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(value)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No cookies in response</p>
                    )}
                  </div>
                )}

                {responseTab === 'headers' && (
                  <div className="space-y-3">
                    {Object.entries(executionResult.response.headers).map(([name, value]) => (
                      <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div>
                          <span className="font-medium text-gray-900">{name}</span>
                          <p className="text-sm text-gray-600 font-mono">{value}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(value)}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {responseTab === 'test-results' && (
                  <div className="text-center py-8 text-gray-500">
                    <TestTube className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>Test results will appear here after running tests</p>
                  </div>
                )}
              </div>
            </>
          )}

          {showResponse && !executionResult.response && (
            <div className="p-6">
              <div className="text-red-600">
                <h4 className="font-medium mb-2">Error</h4>
                <p className="text-sm">{executionResult.error}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Variable Extraction Section - After Response */}
      {executionResult && executionResult.response && (
        <div className="border-t border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Extract Variables from Response</h3>
          <ResponseExplorer
            response={executionResult.response}
            onExtractVariable={handleExtractVariable}
            extractedVariables={extractedVariables}
            existingExtractions={request.dataExtractions}
            onRemoveExtraction={handleRemoveExtraction}
          />
        </div>
      )}
    </div>
  );
}