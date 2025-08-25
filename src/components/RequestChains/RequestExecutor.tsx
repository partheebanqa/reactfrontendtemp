'use client';

import React, { useState } from 'react';
import {
  Play,
  Square,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Copy,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  APIRequest,
  ExecutionLog,
  ExecutionRequestChainPayload,
} from '@/shared/types/requestChain.model';
import { useExecuteRequestChain } from '@/shared/hooks/requestChain';

interface Variable {
  id?: string;
  name: string;
  value: string;
  type: string;
  source: string;
  extractionPath?: string;
}

interface RequestChain {
  id: string;
  name: string;
  requestchain: { id: string };
}

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
  onPreExecute?: () => Promise<RequestChain | null>;
  onPostExecute?: () => void;
  request?: APIRequest;
  onResponse?: (response: any) => void;
}

export function RequestExecutor({
  requests,
  variables,
  onExecutionComplete,
  onVariableUpdate,
  onExecutionStateChange,
  onPreExecute,
  onPostExecute,
  chainName,
  chainId,
  request,
  onResponse,
}: RequestExecutorProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentRequestIndex, setCurrentRequestIndex] = useState(-1);
  const [savedChainId, setSavedChainId] = useState<string | undefined>(
    undefined
  );
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [extractedVariables, setExtractedVariables] = useState<Variable[]>([]);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [allVariables, setAllVariables] = useState<Variable[]>(variables);
  const { mutateAsync: playChain } = useExecuteRequestChain();

  React.useEffect(() => {
    setAllVariables(variables);
  }, [variables]);

  const replaceVariables = (text: string, vars: Variable[]): string => {
    let result = text;
    vars.forEach((variable) => {
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      result = result.replace(regex, variable.value ?? '');
    });
    return result;
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

  const extractDataFromResponse = (
    response: any,
    extractVariables: any[]
  ): Record<string, any> => {
    const extracted: Record<string, any> = {};
    extractVariables.forEach((variable) => {
      const value = response.body
        ? JSON.parse(response.body)[variable.path]
        : undefined;
      if (value !== undefined) {
        extracted[variable.variableName] = value;
      }
    });
    return extracted;
  };

  const executeRequest = async (
    request: APIRequest,
    currentVars: Variable[]
  ): Promise<ExecutionLog> => {
    const startTime = new Date().toISOString();
    const logId = Date.now().toString() + Math.random();

    try {
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

      const processedBody = request.body
        ? replaceVariables(request.body, currentVars)
        : undefined;

      const url = new URL(processedUrl);
      request.params.forEach((param) => {
        if (param.enabled) {
          url.searchParams.set(
            param.key,
            replaceVariables(param.value, currentVars)
          );
        }
      });

      if (request.bodyType === 'json' && processedBody) {
        processedHeaders['Content-Type'] = 'application/json';
      } else if (request.bodyType === 'x-www-form-urlencoded') {
        processedHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
      }

      if (request.authorizationType === 'bearer') {
        const bearerToken = request.authorization?.token || request.authToken;
        if (bearerToken) {
          processedHeaders['Authorization'] = `Bearer ${replaceVariables(
            bearerToken,
            currentVars
          )}`;
        }
      } else if (
        request.authorizationType === 'basic' &&
        request.authUsername &&
        request.authPassword
      ) {
        const credentials = btoa(
          `${request.authUsername}:${request.authPassword}`
        );
        processedHeaders['Authorization'] = `Basic ${credentials}`;
      } else if (
        request.authorizationType === 'apikey' &&
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

      const extractedData = extractDataFromResponse(
        {
          body: responseBody,
          headers: Object.fromEntries(response.headers.entries()),
          cookies: parseCookies(response.headers.get('set-cookie') || ''),
        },
        request.extractVariables
      );

      const log: ExecutionLog = {
        id: logId,
        chainId: chainId || 'current-chain',
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
        chainId: chainId || 'current-chain',
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

  const handleExecuteChain = async () => {
    setIsExecuting(true);
    let currentChainId = savedChainId;

    // Only call save API if we don't have a saved chain ID
    if (onPreExecute && !currentChainId) {
      try {
        const savedChain = await onPreExecute();
        currentChainId = savedChain?.id;
        setSavedChainId(currentChainId);

        if (!chainName?.trim()) {
          toast({
            title: 'Validation Error',
            description: 'Please enter a chain name',
            variant: 'destructive',
          });
          setIsExecuting(false);
          return;
        }

        if (!currentChainId) {
          toast({
            title: 'Validation Error',
            description: 'Chain must be saved before execution',
            variant: 'destructive',
          });
          setIsExecuting(false);
          return;
        }
      } catch (err: any) {
        toast({
          title: 'Save Failed',
          description: err?.message || 'Unable to save chain before execution.',
          variant: 'destructive',
        });
        setIsExecuting(false);
        return;
      }
    }

    // Execute the chain if we have a chain ID
    if (currentChainId) {
      try {
        const payload: ExecutionRequestChainPayload = {
          requestChainId: currentChainId,
        };

        const result = await playChain(payload);
        console.log('result00:', result);
        toast({
          title: 'Execution Started',
          description: `Request chain execution started successfully.`,
        });
      } catch (error: any) {
        toast({
          title: 'Execution Failed',
          description: error?.message || 'Could not execute the request chain.',
          variant: 'destructive',
        });
      }
    }

    if (request && onResponse) {
      try {
        const log = await executeRequest(request, allVariables);
        onResponse(log);
        setExecutionLogs([log]);

        if (log.extractedVariables) {
          const newExtractedVars: Variable[] = [];
          Object.entries(log.extractedVariables).forEach(([name, value]) => {
            const newVar: Variable = {
              id: `${Date.now()}-${Math.random()}`,
              name,
              value: String(value),
              type:
                typeof value === 'number'
                  ? 'number'
                  : typeof value === 'boolean'
                  ? 'boolean'
                  : 'string',
              source: 'extracted',
              extractionPath: request.extractVariables.find(
                (e) => e.variableName === name
              )?.path,
            };
            newExtractedVars.push(newVar);
          });
          setExtractedVariables(newExtractedVars);

          const updatedAllVars = [...allVariables];
          newExtractedVars.forEach((newVar) => {
            const existingIndex = updatedAllVars.findIndex(
              (v) => v.name === newVar.name
            );
            if (existingIndex >= 0) {
              updatedAllVars[existingIndex] = newVar;
            } else {
              updatedAllVars.push(newVar);
            }
          });
          setAllVariables(updatedAllVars);
          onVariableUpdate(updatedAllVars);
        }
      } catch (error) {
        console.error('Individual request execution failed:', error);
      } finally {
        setIsExecuting(false);
      }
      return;
    }

    if (requests.length === 0) return;

    setIsExecuting(true);
    setCurrentRequestIndex(0);
    setExecutionLogs([]);
    onExecutionStateChange?.(true, 0);

    const currentVars = [...allVariables];
    const logs: ExecutionLog[] = [];
    const newExtractedVars: Variable[] = [];

    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      if (!request.enabled) continue;

      setCurrentRequestIndex(i);
      onExecutionStateChange?.(true, i);

      try {
        const log = await executeRequest(request, currentVars);
        logs.push(log);
        setExecutionLogs([...logs]);

        if (log.extractedVariables) {
          Object.entries(log.extractedVariables).forEach(([name, value]) => {
            const existingIndex = currentVars.findIndex((v) => v.name === name);
            const newVar: Variable = {
              id: `${Date.now()}-${Math.random()}`,
              name,
              value: String(value),
              type:
                typeof value === 'number'
                  ? 'number'
                  : typeof value === 'boolean'
                  ? 'boolean'
                  : 'string',
              source: 'extracted',
              extractionPath: request.extractVariables.find(
                (e) => e.variableName === name
              )?.path,
            };

            if (existingIndex >= 0) {
              currentVars[existingIndex] = {
                ...currentVars[existingIndex],
                ...newVar,
              };
            } else {
              currentVars.push(newVar);
              newExtractedVars.push(newVar);
            }
          });
          setAllVariables([...currentVars]);
        }

        if (log.status === 'error' && request.errorHandling === 'stop') {
          toast({
            title: 'Execution Stopped',
            description: `Request ${request.name} failed and chain execution was stopped.`,
            variant: 'destructive',
          });
          break;
        }
      } catch (err: any) {
        toast({
          title: 'Request Execution Error',
          description:
            err?.message || `An error occurred in request ${request.name}.`,
          variant: 'destructive',
        });
        break;
      }
    }

    setIsExecuting(false);
    setCurrentRequestIndex(-1);
    setExtractedVariables(newExtractedVars);
    onExecutionComplete(logs, newExtractedVars);
    onVariableUpdate(currentVars);
    onExecutionStateChange?.(false, -1);

    const successCount = logs.filter((log) => log.status === 'success').length;
    const totalCount = logs.length;

    toast({
      title: 'Execution Complete',
      description: `Completed ${successCount}/${totalCount} requests successfully`,
      variant: successCount === totalCount ? 'default' : 'destructive',
    });

    if (onPostExecute && currentChainId) {
      // Small delay to let user see the completion toast
      setTimeout(() => {
        onPostExecute();
      }, 1500);
    }
  };

  const handleUpdateExecute = async () => {
    setIsExecuting(true);

    // Use existing saved chain ID if available, otherwise save first
    let currentChainId = savedChainId;

    if (onPreExecute && !currentChainId) {
      try {
        const savedChain = await onPreExecute();
        currentChainId = savedChain?.requestchain?.id || savedChain?.id;
        setSavedChainId(currentChainId);

        if (!chainName?.trim()) {
          toast({
            title: 'Validation Error',
            description: 'Please enter a chain name',
            variant: 'destructive',
          });
          setIsExecuting(false);
          return;
        }

        if (!currentChainId) {
          toast({
            title: 'Validation Error',
            description: 'Chain must be saved before execution',
            variant: 'destructive',
          });
          setIsExecuting(false);
          return;
        }
      } catch (err: any) {
        toast({
          title: 'Save Failed',
          description: err?.message || 'Unable to save chain before execution.',
          variant: 'destructive',
        });
        setIsExecuting(false);
        return;
      }
    }

    // Execute the chain
    if (currentChainId) {
      try {
        const payload: ExecutionRequestChainPayload = {
          requestChainId: currentChainId,
        };

        const result = await playChain(payload);
        console.log('result00:', result);
        toast({
          title: 'Execution Started',
          description: `Request chain execution started successfully.`,
        });
      } catch (error: any) {
        toast({
          title: 'Execution Failed',
          description: error?.message || 'Could not execute the request chain.',
          variant: 'destructive',
        });
      }
    }

    if (request && onResponse) {
      try {
        const log = await executeRequest(request, allVariables);
        onResponse(log);
        setExecutionLogs([log]);

        if (log.extractedVariables) {
          const newExtractedVars: Variable[] = [];
          Object.entries(log.extractedVariables).forEach(([name, value]) => {
            const newVar: Variable = {
              id: `${Date.now()}-${Math.random()}`,
              name,
              value: String(value),
              type:
                typeof value === 'number'
                  ? 'number'
                  : typeof value === 'boolean'
                  ? 'boolean'
                  : 'string',
              source: 'extracted',
              extractionPath: request.extractVariables.find(
                (e) => e.variableName === name
              )?.path,
            };
            newExtractedVars.push(newVar);
          });
          setExtractedVariables(newExtractedVars);

          const updatedAllVars = [...allVariables];
          newExtractedVars.forEach((newVar) => {
            const existingIndex = updatedAllVars.findIndex(
              (v) => v.name === newVar.name
            );
            if (existingIndex >= 0) {
              updatedAllVars[existingIndex] = newVar;
            } else {
              updatedAllVars.push(newVar);
            }
          });
          setAllVariables(updatedAllVars);
          onVariableUpdate(updatedAllVars);
        }
      } catch (error) {
        console.error('Individual request execution failed:', error);
      } finally {
        setIsExecuting(false);
      }
      return;
    }

    if (requests.length === 0) return;

    setIsExecuting(true);
    setCurrentRequestIndex(0);
    setExecutionLogs([]);
    onExecutionStateChange?.(true, 0);

    const currentVars = [...allVariables];
    const logs: ExecutionLog[] = [];
    const newExtractedVars: Variable[] = [];

    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      if (!request.enabled) continue;

      setCurrentRequestIndex(i);
      onExecutionStateChange?.(true, i);

      try {
        const log = await executeRequest(request, currentVars);
        logs.push(log);
        setExecutionLogs([...logs]);

        if (log.extractedVariables) {
          Object.entries(log.extractedVariables).forEach(([name, value]) => {
            const existingIndex = currentVars.findIndex((v) => v.name === name);
            const newVar: Variable = {
              id: `${Date.now()}-${Math.random()}`,
              name,
              value: String(value),
              type:
                typeof value === 'number'
                  ? 'number'
                  : typeof value === 'boolean'
                  ? 'boolean'
                  : 'string',
              source: 'extracted',
              extractionPath: request.extractVariables.find(
                (e) => e.variableName === name
              )?.path,
            };

            if (existingIndex >= 0) {
              currentVars[existingIndex] = {
                ...currentVars[existingIndex],
                ...newVar,
              };
            } else {
              currentVars.push(newVar);
              newExtractedVars.push(newVar);
            }
          });
          setAllVariables([...currentVars]);
        }

        if (log.status === 'error' && request.errorHandling === 'stop') {
          toast({
            title: 'Execution Stopped',
            description: `Request ${request.name} failed and chain execution was stopped.`,
            variant: 'destructive',
          });
          break;
        }
      } catch (err: any) {
        toast({
          title: 'Request Execution Error',
          description:
            err?.message || `An error occurred in request ${request.name}.`,
          variant: 'destructive',
        });
        break;
      }
    }

    setIsExecuting(false);
    setCurrentRequestIndex(-1);
    setExtractedVariables(newExtractedVars);
    onExecutionComplete(logs, newExtractedVars);
    onVariableUpdate(currentVars);
    onExecutionStateChange?.(false, -1);

    const successCount = logs.filter((log) => log.status === 'success').length;
    const totalCount = logs.length;

    toast({
      title: 'Execution Complete',
      description: `Completed ${successCount}/${totalCount} requests successfully`,
      variant: successCount === totalCount ? 'default' : 'destructive',
    });

    if (onPostExecute && currentChainId) {
      // Small delay to let user see the completion toast
      setTimeout(() => {
        onPostExecute();
      }, 1500);
    }
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
            {request
              ? 'Individual request execution'
              : `${
                  requests?.filter((r) => r.enabled).length ?? 0
                } enabled requests`}
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
          ) : chainId ? (
            <button
              onClick={handleUpdateExecute}
              disabled={request ? !request.url : false}
              className='flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto'
            >
              <Play className='w-4 h-4' />
              <span className='hidden sm:inline'>
                {savedChainId ? 'Execute' : 'Update Chain & Execute'}
              </span>
              <span className='sm:hidden'>
                {savedChainId ? 'Execute' : 'Update'}
              </span>
            </button>
          ) : (
            <button
              onClick={handleExecuteChain}
              disabled={
                request
                  ? !request.url
                  : !chainName?.trim() ||
                    requests.filter((r) => r.enabled).length === 0
              }
              className='flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto'
            >
              <Play className='w-4 h-4' />
              <span className='hidden sm:inline'>
                {request
                  ? 'Run'
                  : onPreExecute
                  ? savedChainId
                    ? 'Execute'
                    : 'Save Chain & Execute'
                  : 'Execute'}
              </span>
              <span className='sm:hidden'>{request ? 'Run' : 'Execute'}</span>
            </button>
          )}
        </div>
      </div>

      {isExecuting && !request && (
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

      {executionLogs.length > 0 && (
        <div className='space-y-3'>
          <h4 className='font-medium text-foreground'>Execution Logs</h4>
          {executionLogs.map((log) => (
            <div key={log.id} className='border border-border rounded-lg'>
              <div
                className='flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50'
                onClick={() => toggleLogExpanded(log.id)}
              >
                <div className='flex items-center space-x-3 min-w-0 flex-1'>
                  {getStatusIcon(log.status)}
                  <div className='min-w-0 flex-1'>
                    <p className='font-medium text-foreground truncate'>
                      {log.request.method} {new URL(log.request.url).pathname}
                    </p>
                    <p className='text-sm text-muted-foreground'>
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
                    <ChevronDown className='w-4 h-4 text-muted-foreground' />
                  ) : (
                    <ChevronRight className='w-4 h-4 text-muted-foreground' />
                  )}
                </div>
              </div>

              {expandedLogs.has(log.id) && (
                <div className='border-t border-border p-4 bg-muted/30'>
                  <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
                    <div>
                      <h5 className='font-medium text-foreground mb-2'>
                        Request
                      </h5>
                      <div className='space-y-2 text-sm'>
                        <div>
                          <span className='font-medium'>URL:</span>
                          <p className='font-mono text-muted-foreground break-all text-xs sm:text-sm'>
                            {log.request.url}
                          </p>
                        </div>
                        {Object.keys(log.request.headers).length > 0 && (
                          <div>
                            <span className='font-medium'>Headers:</span>
                            <pre className='font-mono text-muted-foreground bg-card p-2 rounded border text-xs overflow-x-auto max-h-32'>
                              {JSON.stringify(log.request.headers, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.request.body && (
                          <div>
                            <span className='font-medium'>Body:</span>
                            <pre className='font-mono text-muted-foreground bg-card p-2 rounded border text-xs overflow-x-auto max-h-32'>
                              {formatResponseBody(log.request.body)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className='flex items-center justify-between mb-2'>
                        <h5 className='font-medium text-foreground'>
                          Response
                        </h5>
                        {log.response && (
                          <button
                            onClick={() => copyResponse(log.response!.body)}
                            className='flex items-center space-x-1 px-2 py-1 text-xs text-muted-foreground hover:bg-muted rounded transition-colors'
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
                            <span className='ml-2 text-muted-foreground'>
                              {log.response.size} bytes
                            </span>
                          </div>
                          <div>
                            <span className='font-medium'>Body:</span>
                            <pre className='font-mono text-muted-foreground bg-card p-2 rounded border text-xs overflow-x-auto max-h-40'>
                              {formatResponseBody(
                                log.response.body,
                                log.response.headers['content-type']
                              )}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <div className='text-destructive'>
                          <span className='font-medium'>Error:</span>
                          <p className='text-sm break-words'>{log.error}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {log.extractedVariables &&
                    Object.keys(log.extractedVariables).length > 0 && (
                      <div className='mt-4 pt-4 border-t border-border'>
                        <h5 className='font-medium text-foreground mb-2'>
                          Extracted Variables
                        </h5>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                          {Object.entries(log.extractedVariables).map(
                            ([name, value]) => (
                              <div
                                key={name}
                                className='flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-card rounded border gap-1'
                              >
                                <span className='font-medium text-foreground'>
                                  {name}
                                </span>
                                <span className='text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded break-all'>
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
