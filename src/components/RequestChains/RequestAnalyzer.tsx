'use client';
import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  PlayCircle,
  Link2,
  Hash,
  Copy,
  Loader2,
  ChevronDown,
  ChevronUp,
  Plus,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RequestAnalyzerProps {
  requests: any[];
  executionLogs: any[];
  analysisResults: any[];
  extractedVariablesByRequest: Record<string, Record<string, any>>;
  isExecuting: boolean;
  onRunAll: () => void;
  onCopyVariable?: (requestId: string, variableName: string) => void;
  onExtractVariable?: (
    requestId: string,
    path: string,
    suggestedName: string
  ) => void;
  onApplyToAllRequests?: (variableName: string) => void;
  onApplyToRequest?: (requestId: string, variableName: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Utility functions for variable substitution
const hasVariablePattern = (text: string): boolean => {
  if (!text) return false;
  return /\{\{[^}]+\}\}/.test(text);
};

const substituteVariables = (
  text: string,
  extractedVariablesByRequest: Record<string, Record<string, any>>
): string => {
  if (!text) return text;

  let result = text;

  // Substitute all extracted variables
  Object.values(extractedVariablesByRequest).forEach((variables) => {
    Object.entries(variables).forEach(([name, value]) => {
      const regex = new RegExp(`\\{\\{${name}\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    });
  });

  return result;
};

const UrlDisplay = ({
  url,
  extractedVariablesByRequest,
}: {
  url: string;
  extractedVariablesByRequest: Record<string, Record<string, any>>;
}) => {
  const hasVariables = hasVariablePattern(url);
  const substitutedUrl = hasVariables
    ? substituteVariables(url, extractedVariablesByRequest)
    : url;

  if (!hasVariables) {
    return <p className='text-xs text-muted-foreground mt-1 truncate'>{url}</p>;
  }

  return (
    <div className='mt-1 space-y-1'>
      <div className='flex items-start gap-2'>
        <span className='text-xs text-purple-600 font-medium whitespace-nowrap'>
          Substituted Url:
        </span>
        <code className='text-xs font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded break-all flex-1'>
          {url}
        </code>
      </div>
      {/* <div className='flex items-start gap-2'>
        <span className='text-xs text-green-600 font-medium whitespace-nowrap flex items-center gap-1'>
          <ArrowRight className='w-3 h-3' />
          Resolved:
        </span>
        <code className='text-xs font-mono text-green-700 bg-green-50 px-2 py-0.5 rounded break-all flex-1'>
          {substitutedUrl}
        </code>
      </div> */}
    </div>
  );
};

export function RequestAnalyzer({
  requests,
  executionLogs,
  analysisResults,
  extractedVariablesByRequest,
  isExecuting,
  onRunAll,
  onCopyVariable,
  onExtractVariable,
  onApplyToAllRequests,
  onApplyToRequest,
  open,
  onOpenChange,
}: RequestAnalyzerProps) {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [expandedResponses, setExpandedResponses] = useState<Set<string>>(
    new Set()
  );
  const [justExtractedVariable, setJustExtractedVariable] = useState<{
    requestId: string;
    variableName: string;
  } | null>(null);

  const getMethodColor = (method: string) => {
    const colors = {
      GET: 'bg-green-100 text-green-800',
      POST: 'bg-blue-100 text-blue-800',
      PUT: 'bg-orange-100 text-orange-800',
      DELETE: 'bg-red-100 text-red-800',
      PATCH: 'bg-purple-100 text-purple-800',
      HEAD: 'bg-gray-100 text-gray-800',
      OPTIONS: 'bg-yellow-100 text-yellow-800',
    };
    return colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleCopy = async (requestId: string, variableName: string) => {
    try {
      await navigator.clipboard.writeText(`{{${variableName}}}`);
      setCopiedStates((prev) => ({
        ...prev,
        [`${requestId}-${variableName}`]: true,
      }));
      setTimeout(() => {
        setCopiedStates((prev) => ({
          ...prev,
          [`${requestId}-${variableName}`]: false,
        }));
      }, 2000);
      if (onCopyVariable) {
        onCopyVariable(requestId, variableName);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const toggleResponsePreview = (requestId: string) => {
    setExpandedResponses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(requestId)) {
        newSet.delete(requestId);
      } else {
        newSet.add(requestId);
      }
      return newSet;
    });
  };

  const formatJSON = (data: any): string => {
    try {
      if (typeof data === 'string') {
        return JSON.stringify(JSON.parse(data), null, 2);
      }
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const handleExtractClick = (
    sourceRequest: any,
    path: string,
    suggestedName: string
  ) => {
    if (!onExtractVariable) return;

    onExtractVariable(sourceRequest.id, path, suggestedName);

    setJustExtractedVariable({
      requestId: sourceRequest.id,
      variableName: `E_${suggestedName}`,
    });
  };

  const successCount = executionLogs.filter(
    (log) => log.status === 'success'
  ).length;
  const failedCount = executionLogs.filter(
    (log) => log.status === 'error'
  ).length;
  const extractionCount = Object.keys(extractedVariablesByRequest).length;
  const availableAuthToken = (() => {
    for (const [requestId, variables] of Object.entries(
      extractedVariablesByRequest
    )) {
      const authVar = Object.entries(variables).find(([key, value]) => {
        if (!value || typeof value !== 'string') return false;
        const looksLikeJWT =
          /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(
            value as string
          );
        const looksLikeToken = (value as string).length > 20;
        return looksLikeJWT || looksLikeToken;
      });
      if (authVar) {
        return { requestId, variableName: authVar[0] };
      }
    }
    return null;
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-6xl h-[90vh] flex flex-col'>
        <DialogHeader className='flex-shrink-0'>
          <DialogTitle className='flex items-center gap-2'>
            <AlertTriangle className='w-5 h-5 text-orange-600' />
            Chain Analysis
          </DialogTitle>
          <DialogDescription>
            {requests.length} requests analyzed • {extractionCount} requests
            with extractions
          </DialogDescription>
        </DialogHeader>

        <div className='flex items-center gap-4 text-sm mb-4 flex-shrink-0'>
          <div className='flex items-center gap-2'>
            <CheckCircle className='w-4 h-4 text-green-600' />
            <span className='font-medium'>{successCount} Success</span>
          </div>
          {failedCount > 0 && (
            <div className='flex items-center gap-2'>
              <XCircle className='w-4 h-4 text-red-600' />
              <span className='font-medium'>{failedCount} Failed</span>
            </div>
          )}
        </div>

        {(justExtractedVariable || availableAuthToken) && (
          <div className='flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg mb-4 flex-shrink-0'>
            <div className='flex items-center gap-2'>
              <CheckCircle className='w-5 h-5 text-green-600' />
              <div>
                <p className='font-medium text-green-900 text-sm'>
                  Variable Ready to Apply!
                </p>
                <p className='text-xs text-green-700'>
                  {(justExtractedVariable || availableAuthToken)?.variableName}{' '}
                  can be applied to all requests
                </p>
              </div>
            </div>
            <div className='flex gap-2'>
              <Button
                size='sm'
                onClick={() => {
                  const varName = (justExtractedVariable || availableAuthToken)
                    ?.variableName;
                  if (varName && onApplyToAllRequests) {
                    onApplyToAllRequests(varName);
                  }
                  setJustExtractedVariable(null);
                }}
                className='bg-green-600 hover:bg-green-700 text-white'
              >
                <Zap className='w-4 h-4 mr-2' />
                Apply to All Requests
              </Button>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => setJustExtractedVariable(null)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        <div className='flex-1 overflow-y-auto space-y-4 min-h-0'>
          {requests.map((request, index) => {
            const analysis = analysisResults[index];
            const executionLog = executionLogs.find(
              (log) => log.requestId === request.id
            );
            const isResponseExpanded = expandedResponses.has(request.id);

            return (
              <div
                key={request.id}
                className='border rounded-lg overflow-hidden hover:shadow-md transition-shadow'
              >
                <div className='bg-gray-50 px-4 py-3 border-b flex items-center justify-between'>
                  <div className='flex items-center gap-3 flex-1 min-w-0'>
                    <div className='w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0'>
                      #{index + 1}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <Badge className={getMethodColor(request.method)}>
                          {request.method}
                        </Badge>
                        <span className='font-medium truncate'>
                          {request.name || request.url || 'Unnamed Request'}
                        </span>
                      </div>
                      <UrlDisplay
                        url={request.url}
                        extractedVariablesByRequest={
                          extractedVariablesByRequest
                        }
                      />
                    </div>
                  </div>
                  {executionLog && (
                    <div className='flex items-center gap-2 flex-shrink-0 ml-4'>
                      {executionLog.status === 'success' ? (
                        <CheckCircle className='w-5 h-5 text-green-600' />
                      ) : (
                        <XCircle className='w-5 h-5 text-red-600' />
                      )}
                      {executionLog.response && (
                        <Badge
                          variant={
                            executionLog.response.status < 300
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {executionLog.response.status}
                        </Badge>
                      )}
                      <span className='text-sm text-muted-foreground'>
                        {executionLog.duration}ms
                      </span>
                    </div>
                  )}
                </div>

                <div className='p-4 space-y-3'>
                  <div className='space-y-2'>
                    <h4 className='text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                      Dependencies
                    </h4>

                    {analysis?.hasAuthWarning && (
                      <div className='flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded'>
                        <AlertTriangle className='w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5' />
                        <div className='flex-1 min-w-0'>
                          <p className='font-medium text-amber-900 text-sm'>
                            Auth Token Not Found
                          </p>
                          <p className='text-xs text-amber-700 mt-1'>
                            Token is used but not extracted from previous
                            responses
                          </p>
                          {analysis.suggestedAuthSource && (
                            <div className='mt-2 flex items-start gap-2'>
                              <div className='flex-1'>
                                <p className='text-xs text-amber-700'>
                                  💡 <strong>Suggestion:</strong> Extract token
                                  from "{analysis.suggestedAuthSource.apiName}"
                                  at{' '}
                                  <code className='bg-amber-100 px-1 rounded'>
                                    {analysis.suggestedAuthSource.path}
                                  </code>
                                </p>
                              </div>
                              {(() => {
                                const sourceRequestIndex =
                                  analysis.suggestedAuthSource.apiIndex;
                                const sourceRequest =
                                  requests[sourceRequestIndex];
                                const extractedVars =
                                  extractedVariablesByRequest[
                                    sourceRequest?.id
                                  ] || {};

                                const extractedAuthVar = Object.entries(
                                  extractedVars
                                ).find(([key, value]) => {
                                  if (!value || typeof value !== 'string')
                                    return false;
                                  const looksLikeJWT =
                                    /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(
                                      value as string
                                    );
                                  const looksLikeToken =
                                    (value as string).length > 20;
                                  return looksLikeJWT || looksLikeToken;
                                });

                                if (extractedAuthVar) {
                                  return (
                                    <div className='flex gap-2'>
                                      <button
                                        onClick={() => {
                                          if (onApplyToRequest) {
                                            onApplyToRequest(
                                              request.id,
                                              extractedAuthVar[0]
                                            );
                                          }
                                        }}
                                        className='px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors flex items-center gap-1 whitespace-nowrap'
                                      >
                                        <Zap className='w-3 h-3' />
                                        Apply to This Request
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (onApplyToAllRequests) {
                                            onApplyToAllRequests(
                                              extractedAuthVar[0]
                                            );
                                          }
                                        }}
                                        className='px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors flex items-center gap-1 whitespace-nowrap'
                                      >
                                        <Zap className='w-3 h-3' />
                                        Apply to All
                                      </button>
                                    </div>
                                  );
                                }

                                return (
                                  <button
                                    onClick={() => {
                                      if (
                                        !analysis.suggestedAuthSource ||
                                        !onExtractVariable
                                      )
                                        return;

                                      const sourceRequestIndex =
                                        analysis.suggestedAuthSource.apiIndex;
                                      const sourceRequest =
                                        requests[sourceRequestIndex];

                                      if (!sourceRequest) {
                                        console.error(
                                          'Source request not found at index:',
                                          sourceRequestIndex
                                        );
                                        return;
                                      }

                                      if (!analysis.suggestedAuthSource.path) {
                                        console.error(
                                          'No path specified for extraction'
                                        );
                                        return;
                                      }

                                      const pathParts =
                                        analysis.suggestedAuthSource.path.split(
                                          '.'
                                        );
                                      const suggestedName =
                                        pathParts[pathParts.length - 1] ||
                                        'authToken';

                                      handleExtractClick(
                                        sourceRequest,
                                        analysis.suggestedAuthSource.path,
                                        suggestedName
                                      );
                                    }}
                                    className='px-3 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700 transition-colors flex items-center gap-1 whitespace-nowrap'
                                  >
                                    <Plus className='w-3 h-3' />
                                    Extract Now
                                  </button>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {analysis?.authSource && (
                      <div className='flex items-start gap-2 p-2 bg-white border border-gray-200 rounded'>
                        <Link2 className='w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5' />
                        <div className='flex-1 min-w-0'>
                          <p className='text-sm text-gray-900'>
                            <strong>Auth Token</strong> → API #
                            {analysis.authSource.apiName.match(/\d+/)?.[0] ||
                              ''}
                          </p>
                          <p className='text-xs text-gray-600 mt-0.5'>
                            {analysis.authSource.path}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {analysis?.queryParams && analysis.queryParams.length > 0 && (
                    <div className='space-y-2'>
                      <h4 className='text-sm font-medium text-gray-900'>
                        Query Parameters ({analysis.queryParams.length})
                      </h4>
                      <div className='space-y-1'>
                        {analysis.queryParams.map((param: any, idx: number) => (
                          <div
                            key={idx}
                            className={`flex items-start gap-2 p-2 rounded border text-xs ${
                              param.source
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            {param.source ? (
                              <>
                                <Link2 className='w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5' />
                                <div className='flex-1 min-w-0'>
                                  <p className='text-blue-900'>
                                    <strong>{param.name}:</strong> From "
                                    {param.source.apiName}" at{' '}
                                    <code className='bg-blue-100 px-1 rounded break-all'>
                                      {param.source.path}
                                    </code>
                                  </p>

                                  {(() => {
                                    const sourceRequest =
                                      requests[param.source.apiIndex];
                                    const extractedVars =
                                      extractedVariablesByRequest[
                                        sourceRequest?.id
                                      ] || {};
                                    const alreadyExtracted = Object.entries(
                                      extractedVars
                                    ).find(
                                      ([key, value]) => value === param.value
                                    );

                                    if (alreadyExtracted) {
                                      return (
                                        <div className='mt-1 flex items-center gap-2'>
                                          <span className='text-xs text-green-700'>
                                            ✓ Already extracted as:{' '}
                                            <strong>
                                              {alreadyExtracted[0]}
                                            </strong>
                                          </span>
                                          <button
                                            onClick={() => {
                                              if (onApplyToRequest) {
                                                onApplyToRequest(
                                                  request.id,
                                                  alreadyExtracted[0]
                                                );
                                              }
                                            }}
                                            className='px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors flex items-center gap-1'
                                            title='Apply this variable to current request'
                                          >
                                            <Zap className='w-3 h-3' />
                                            Apply
                                          </button>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div className='mt-1'>
                                        <button
                                          onClick={() => {
                                            if (onExtractVariable) {
                                              const pathParts =
                                                param.source.path.split('.');
                                              const suggestedName =
                                                pathParts[
                                                  pathParts.length - 1
                                                ] || param.name;
                                              onExtractVariable(
                                                sourceRequest.id,
                                                param.source.path,
                                                suggestedName
                                              );
                                            }
                                          }}
                                          className='px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors flex items-center gap-1'
                                        >
                                          <Plus className='w-3 h-3' />
                                          Extract from Source
                                        </button>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </>
                            ) : (
                              <>
                                <Hash className='w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5' />
                                <div className='flex-1 min-w-0'>
                                  <p className='text-gray-900'>
                                    <strong>{param.name}:</strong> Static value
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {executionLog?.extractedVariables &&
                    Object.keys(executionLog.extractedVariables).length > 0 && (
                      <div className='space-y-2'>
                        <h4 className='text-sm font-medium text-gray-900'>
                          Extracted Variables (
                          {Object.keys(executionLog.extractedVariables).length})
                        </h4>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                          {Object.entries(executionLog.extractedVariables).map(
                            ([name, value]) => (
                              <div
                                key={name}
                                className='p-2 bg-green-50 border border-green-200 rounded'
                              >
                                <div className='flex items-center justify-between mb-1'>
                                  <code className='text-xs font-mono text-green-800 truncate flex-1'>
                                    {name}
                                  </code>
                                  <button
                                    onClick={() => handleCopy(request.id, name)}
                                    className='p-1 hover:bg-green-100 rounded flex-shrink-0 ml-2'
                                    title='Copy variable'
                                  >
                                    {copiedStates[`${request.id}-${name}`] ? (
                                      <CheckCircle className='w-3 h-3 text-green-600' />
                                    ) : (
                                      <Copy className='w-3 h-3 text-green-600' />
                                    )}
                                  </button>
                                </div>
                                <p
                                  className='text-xs text-green-700 truncate'
                                  title={String(value)}
                                >
                                  {String(value).substring(0, 50)}
                                  {String(value).length > 50 ? '...' : ''}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {executionLog?.response?.assertions &&
                    executionLog.response.assertions.length > 0 && (
                      <div className='space-y-2'>
                        <h4 className='text-sm font-medium text-gray-900'>
                          Assertions (
                          {
                            executionLog.response.assertions.filter(
                              (a: any) => a.status === 'passed'
                            ).length
                          }
                          /{executionLog.response.assertions.length} passed)
                        </h4>
                        <div className='space-y-1'>
                          {executionLog.response.assertions.map(
                            (assertion: any, idx: number) => (
                              <div
                                key={idx}
                                className={`flex items-center gap-2 p-2 rounded text-xs ${
                                  assertion.status === 'passed'
                                    ? 'bg-green-50 text-green-800 border border-green-200'
                                    : 'bg-red-50 text-red-800 border border-red-200'
                                }`}
                              >
                                {assertion.status === 'passed' ? (
                                  <CheckCircle className='w-3 h-3 flex-shrink-0' />
                                ) : (
                                  <XCircle className='w-3 h-3 flex-shrink-0' />
                                )}
                                <span
                                  className='flex-1 truncate'
                                  title={assertion.description}
                                >
                                  {assertion.description}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {executionLog?.response && (
                    <div className='border-t pt-3'>
                      <button
                        onClick={() => toggleResponsePreview(request.id)}
                        className='flex items-center justify-between w-full text-left hover:bg-gray-50 p-2 rounded transition-colors'
                      >
                        <h4 className='text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                          Response Preview
                        </h4>
                        {isResponseExpanded ? (
                          <ChevronUp className='w-4 h-4 text-gray-500' />
                        ) : (
                          <ChevronDown className='w-4 h-4 text-gray-500' />
                        )}
                      </button>

                      {isResponseExpanded && (
                        <div className='mt-2 bg-gray-900 text-gray-100 rounded-lg p-4 max-h-96 overflow-auto'>
                          <pre className='text-xs font-mono whitespace-pre-wrap break-words'>
                            {formatJSON(executionLog.response.body)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {(!requests || requests.length === 0) && (
            <div className='text-center py-12'>
              <AlertTriangle className='w-12 h-12 text-gray-300 mx-auto mb-3' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                No Requests to Analyze
              </h3>
              <p className='text-sm text-gray-500'>
                Add requests and run them to see the analysis
              </p>
            </div>
          )}

          {requests && requests.length > 0 && executionLogs.length === 0 && (
            <div className='text-center py-12'>
              <PlayCircle className='w-12 h-12 text-gray-300 mx-auto mb-3' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                Run Requests to See Analysis
              </h3>
              <p className='text-sm text-gray-500 mb-4'>
                Click "Run All" to execute requests and view detailed analysis
              </p>
              <Button onClick={onRunAll} disabled={isExecuting}>
                {isExecuting ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Running...
                  </>
                ) : (
                  <>
                    <PlayCircle className='w-4 h-4 mr-2' />
                    Run All Requests
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
