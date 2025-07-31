import React, { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
} from 'lucide-react';
import {
  APIRequest,
  ExecutionLog,
  RequestChain,
  Variable,
} from '@/shared/types/requestChain.model';
import { useRequestChainData } from '@/hooks/useRequestChainData';

interface RequestExecutorProps {
  chainId?: string;
  requests: APIRequest[];
  variables: Variable[];
  chainName?: string;
  onExecutionComplete: (
    logs: ExecutionLog[],
    extractedVariables: Variable[]
  ) => void;
  onVariableUpdate: (variables: Variable[]) => void;
  onExecutionStateChange?: (
    isExecuting: boolean,
    currentRequestIndex: number
  ) => void;
}

interface RequestExecutorPropsNew {
 
}


interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export function RequestExecutor({
  requests,
  variables,
  onExecutionComplete,
  onVariableUpdate,
  onExecutionStateChange,
  onPreExecute,
  chainName,
  chainId,
}: RequestExecutorProps & {
  onPreExecute?: () => Promise<RequestChain | null>;
}) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentRequestIndex, setCurrentRequestIndex] = useState(-1);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [extractedVariables, setExtractedVariables] = useState<Variable[]>([]);

  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [allVariables, setAllVariables] = useState<Variable[]>(variables);

  // console.log('calling executor', allVariables);

  // Update local variables when prop changes
  React.useEffect(() => {
    setAllVariables(variables);
  }, [variables]);

  const replaceVariables = (text: string, vars: Variable[]): string => {
    let result = text;

    vars.forEach((variable) => {
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      const oldResult = result;
      result = result.replace(regex, variable.value);

      if (oldResult !== result) {
        // console.log(`✅ Replaced {{${variable.name}}} with: ${variable.value}`);
      }
    });
    console.log('result', result);

    return result;
  };

  const extractDataFromResponse = (
    response: any,
    extractions: APIRequest['dataExtractions']
  ): Record<string, any> => {
    const extracted: Record<string, any> = {};

    extractions.forEach((extraction) => {
      try {
        let value;

        if (extraction.source === 'response_body') {
          // JSON path extraction
          const jsonData =
            typeof response.body === 'string'
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
              const transformFunction = new Function(
                'value',
                `return ${extraction.transform}`
              );
              value = transformFunction(value);
            } catch (transformError) {
              console.error(
                `Transform error for ${extraction.variableName}:`,
                transformError
              );
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
          const index = parseInt(
            key.substring(key.indexOf('[') + 1, key.indexOf(']'))
          );
          return current[arrayKey] && current[arrayKey][index];
        }
        return current[key];
      }
      return undefined;
    }, obj);
  };

  const parseCookies = (cookieHeader: string): Record<string, string> => {
    const cookies: Record<string, string> = {};
    if (!cookieHeader) return cookies;

    cookieHeader.split(',').forEach((cookie) => {
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

  const executeRequest = async (
    request: APIRequest,
    currentVars: Variable[]
  ): Promise<ExecutionLog> => {
    const startTime = new Date().toISOString();
    const logId = Date.now().toString() + Math.random();

    try {
      // Replace variables in URL, headers, and body
      const processedUrl = replaceVariables(request.url, currentVars);
      const processedHeaders: Record<string, string> = {};

      request.headers.forEach((header) => {
        if (header.enabled) {
          processedHeaders[header.key] = replaceVariables(
            header.value,
            currentVars
          );
        }
      });

      let processedBody = request.body
        ? replaceVariables(request.body, currentVars)
        : undefined;

      // Add URL parameters
      const url = new URL(processedUrl);
      request.params.forEach((param) => {
        if (param.enabled) {
          url.searchParams.set(
            param.key,
            replaceVariables(param.value, currentVars)
          );
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
        processedHeaders['Authorization'] = `Bearer ${replaceVariables(
          request.authToken,
          currentVars
        )}`;
      } else if (
        request.authType === 'basic' &&
        request.authUsername &&
        request.authPassword
      ) {
        const credentials = btoa(
          `${request.authUsername}:${request.authPassword}`
        );
        processedHeaders['Authorization'] = `Basic ${credentials}`;
      } else if (
        request.authType === 'apikey' &&
        request.authApiKey &&
        request.authApiValue
      ) {
        if (request.authApiLocation === 'header') {
          processedHeaders[request.authApiKey] = replaceVariables(
            request.authApiValue,
            currentVars
          );
        } else {
          url.searchParams.set(
            request.authApiKey,
            replaceVariables(request.authApiValue, currentVars)
          );
        }
      }

      const requestOptions: RequestInit = {
        method: request.method,
        headers: processedHeaders,
        body: processedBody,
      };

      const response = await fetch(url.toString(), requestOptions);
      const responseBody = await response.text();
      const endTime = new Date().toISOString();

      // Extract variables from response
      const extractedData = extractDataFromResponse(
        {
          body: responseBody,
          headers: Object.fromEntries(response.headers.entries()),
          cookies: parseCookies(response.headers.get('set-cookie') || ''),
        },
        request.dataExtractions
      );

      const log: ExecutionLog = {
        id: logId,
        chainId: 'current-chain',
        requestId: request.id,
        status: response.ok ? 'success' : 'error',
        startTime,
        endTime,
        duration: new Date(endTime).getTime() - new Date(startTime).getTime(),
        request: {
          method: request.method,
          url: url.toString(),
          headers: processedHeaders,
          body: processedBody,
        },
        response: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseBody,
          size: responseBody.length,
          cookies: parseCookies(response.headers.get('set-cookie') || ''),
        },
        extractedVariables: extractedData,
      };

      return log;
    } catch (error) {
      const endTime = new Date().toISOString();

      return {
        id: logId,
        chainId: 'current-chain',
        requestId: request.id,
        status: 'error',
        startTime,
        endTime,
        duration: new Date(endTime).getTime() - new Date(startTime).getTime(),
        request: {
          method: request.method,
          url: request.url,
          headers: {},
          body: request.body,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }


  };



 
    const { data, isLoading, error } = useRequestChainData(chainId || '');
  
  console.log("Request Chain Data:", data);

  const handleExecuteChain = async () => {
    // ✅ Save the chain before execution
    const savedChain = await onPreExecute?.();
  
    console.log('savedChain response from API:', savedChain);
  
    if (!savedChain?.id) {
      console.warn('Execution aborted: Chain not saved properly.');
      return;
    }

  
    if (requests.length === 0) return;
  
    setIsExecuting(true);
    setCurrentRequestIndex(0);
    setExecutionLogs([]);
  
    onExecutionStateChange?.(true, 0); // notify parent
  
    let currentVars = [...allVariables];
    const logs: ExecutionLog[] = [];
    const newExtractedVars: Variable[] = [];
  
    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      if (!request.enabled) continue;
  
      setCurrentRequestIndex(i);
      onExecutionStateChange?.(true, i);
  
      const log = await executeRequest(request, currentVars);
      logs.push(log);
      setExecutionLogs([...logs]); // Update UI
  
      if (log.extractedVariables) {
        Object.entries(log.extractedVariables).forEach(([name, value]) => {
          const existingIndex = currentVars.findIndex((v) => v.name === name);
  
          const newVar: Variable = {
            id: `${Date.now()}-${Math.random()}`,
            name,
            value: String(value),
            type: typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string',
            source: 'extracted',
            extractionPath: request.dataExtractions.find((e) => e.variableName === name)?.path,
          };
  
          if (existingIndex >= 0) {
            currentVars[existingIndex] = { ...currentVars[existingIndex], ...newVar };
          } else {
            currentVars.push(newVar);
            newExtractedVars.push(newVar);
          }
        });
  
        setAllVariables([...currentVars]);
      }
  
      if (log.status === 'error' && request.errorHandling === 'stop') {
        break;
      }
    }
  
    setIsExecuting(false);
    setCurrentRequestIndex(-1);
    setExtractedVariables(newExtractedVars);
    onExecutionComplete(logs, newExtractedVars);
    onVariableUpdate(currentVars);
    onExecutionStateChange?.(false, -1);
  };
  

  const stopExecution = () => {
    setIsExecuting(false);
    setCurrentRequestIndex(-1);
    onExecutionStateChange?.(false, -1);
  };

  const toggleLogExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const copyResponse = (response: string) => {
    navigator.clipboard.writeText(response);
  };

  const getStatusIcon = (status: ExecutionLog['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className='w-5 h-5 text-green-500' />;
      case 'error':
        return <XCircle className='w-5 h-5 text-red-500' />;
      case 'timeout':
        return <AlertTriangle className='w-5 h-5 text-yellow-500' />;
      default:
        return <Clock className='w-5 h-5 text-gray-500' />;
    }
  };

  const formatResponseBody = (body: string, contentType?: string) => {
    try {
      if (
        contentType?.includes('application/json') ||
        body.trim().startsWith('{')
      ) {
        return JSON.stringify(JSON.parse(body), null, 2);
      }
    } catch {
      // Return as-is if not valid JSON
    }
    return body;
  };

  return (
    <div className='bg-card rounded-xl border border-border p-4 sm:p-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4'>
        <div>
          <h3 className='text-lg font-semibold text-foreground'>
            Request Execution
          </h3>
          <p className='text-sm text-muted-foreground'>
            {requests.filter((r) => r.enabled).length} enabled requests
          </p>
        </div>
        <div className='flex space-x-3'>
          {isExecuting ? (
            <button
              onClick={stopExecution}
              className='flex items-center justify-center space-x-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors w-full sm:w-auto'
            >
              <Square className='w-4 h-4' />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={handleExecuteChain}
              disabled={
                !chainName?.trim() ||
                requests.filter((r) => r.enabled).length === 0
              }
              className='flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto'
            >
              <Play className='w-4 h-4' />
              <span className='hidden sm:inline'>Save chain & Execute</span>
              <span className='sm:hidden'>Execute</span>
            </button>
          )}
        </div>
      </div>

      {/* Execution Progress */}
      {isExecuting && (
        <div className='mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg'>
          <div className='flex items-center space-x-3'>
            <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-primary'></div>
            <div className='min-w-0 flex-1'>
              <p className='font-medium text-primary truncate'>
                Executing request {currentRequestIndex + 1} of{' '}
                {requests.filter((r) => r.enabled).length}
              </p>
              <p className='text-sm text-primary/80 truncate'>
                {requests[currentRequestIndex]?.name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Extracted Variables */}
      {extractedVariables.length > 0 && (
        <div className='mb-6 p-4 bg-accent/20 border border-accent/30 rounded-lg'>
          <h4 className='font-medium text-accent-foreground mb-2'>
            Extracted Variables
          </h4>
          <div className='space-y-2'>
            {extractedVariables.map((variable) => (
              <div
                key={variable.id}
                className='flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-card rounded border border-border gap-2'
              >
                <div className='min-w-0 flex-1'>
                  <span className='font-medium text-foreground'>
                    {variable.name}
                  </span>
                  <span className='text-sm text-muted-foreground ml-2'>
                    ({variable.type})
                  </span>
                </div>
                <span className='text-sm text-foreground font-mono bg-muted px-2 py-1 rounded break-all'>
                  {variable.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execution Logs */}
      {executionLogs.length > 0 && (
        <div className='space-y-3'>
          <h4 className='font-medium text-gray-900'>Execution Logs</h4>
          {executionLogs.map((log) => (
            <div key={log.id} className='border border-gray-200 rounded-lg'>
              <div
                className='flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50'
                onClick={() => toggleLogExpanded(log.id)}
              >
                <div className='flex items-center space-x-3 min-w-0 flex-1'>
                  {getStatusIcon(log.status)}
                  <div className='min-w-0 flex-1'>
                    <p className='font-medium text-gray-900 truncate'>
                      {log.request.method} {new URL(log.request.url).pathname}
                    </p>
                    <p className='text-sm text-gray-500'>
                      {log.duration}ms •{' '}
                      {new Date(log.startTime).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className='flex items-center space-x-2 flex-shrink-0'>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      log.status === 'success'
                        ? 'bg-green-100 text-green-800'
                        : log.status === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {log.response?.status || log.status}
                  </span>
                  {expandedLogs.has(log.id) ? (
                    <ChevronDown className='w-4 h-4 text-gray-400' />
                  ) : (
                    <ChevronRight className='w-4 h-4 text-gray-400' />
                  )}
                </div>
              </div>

              {expandedLogs.has(log.id) && (
                <div className='border-t border-gray-200 p-4 bg-gray-50'>
                  <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
                    {/* Request Details */}
                    <div>
                      <h5 className='font-medium text-gray-900 mb-2'>
                        Request
                      </h5>
                      <div className='space-y-2 text-sm'>
                        <div>
                          <span className='font-medium'>URL:</span>
                          <p className='font-mono text-gray-700 break-all text-xs sm:text-sm'>
                            {log.request.url}
                          </p>
                        </div>
                        {Object.keys(log.request.headers).length > 0 && (
                          <div>
                            <span className='font-medium'>Headers:</span>
                            <pre className='font-mono text-gray-700 bg-white p-2 rounded border text-xs overflow-x-auto max-h-32'>
                              {JSON.stringify(log.request.headers, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.request.body && (
                          <div>
                            <span className='font-medium'>Body:</span>
                            <pre className='font-mono text-gray-700 bg-white p-2 rounded border text-xs overflow-x-auto max-h-32'>
                              {formatResponseBody(log.request.body)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Response Details */}
                    <div>
                      <div className='flex items-center justify-between mb-2'>
                        <h5 className='font-medium text-gray-900'>Response</h5>
                        {log.response && (
                          <button
                            onClick={() => copyResponse(log.response!.body)}
                            className='flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded transition-colors'
                          >
                            <Copy className='w-3 h-3' />
                            <span className='hidden sm:inline'>Copy</span>
                          </button>
                        )}
                      </div>
                      {log.response ? (
                        <div className='space-y-2 text-sm'>
                          <div>
                            <span className='font-medium'>Status:</span>
                            <span
                              className={`ml-2 px-2 py-1 text-xs rounded ${
                                log.response.status < 300
                                  ? 'bg-green-100 text-green-800'
                                  : log.response.status < 400
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {log.response.status}
                            </span>
                          </div>
                          <div>
                            <span className='font-medium'>Size:</span>
                            <span className='ml-2 text-gray-700'>
                              {log.response.size} bytes
                            </span>
                          </div>
                          <div>
                            <span className='font-medium'>Body:</span>
                            <pre className='font-mono text-gray-700 bg-white p-2 rounded border text-xs overflow-x-auto max-h-40'>
                              {formatResponseBody(
                                log.response.body,
                                log.response.headers['content-type']
                              )}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <div className='text-red-600'>
                          <span className='font-medium'>Error:</span>
                          <p className='text-sm break-words'>{log.error}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Extracted Variables */}
                  {log.extractedVariables &&
                    Object.keys(log.extractedVariables).length > 0 && (
                      <div className='mt-4 pt-4 border-t border-gray-200'>
                        <h5 className='font-medium text-gray-900 mb-2'>
                          Extracted Variables
                        </h5>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                          {Object.entries(log.extractedVariables).map(
                            ([name, value]) => (
                              <div
                                key={name}
                                className='flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-white rounded border gap-1'
                              >
                                <span className='font-medium text-gray-900'>
                                  {name}
                                </span>
                                <span className='text-sm text-gray-700 font-mono bg-gray-100 px-2 py-1 rounded break-all'>
                                  {String(value)}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
