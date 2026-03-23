/**
 * ExecutionResultPanel
 *
 * Memoized wrapper around ResponseExplorer. Extracted from RequestChainEditor
 * to prevent re-rendering the response/assertion panel when unrelated state
 * (e.g., expanding a different request accordion) changes.
 *
 * P1-D Decomposition: previously this was ~160 lines of deeply nested JSX
 * inside the request card forEach loop in RequestChainEditor.
 */
import React, { memo, useMemo } from 'react';
import { ResponseExplorer } from './ResponseExplorer';
import type {
  ExecutionLog,
  DataExtraction,
} from '@/shared/types/requestChain.model';
import type { APIRequest } from '@/shared/types/requestChain.model';

interface ExecutionResultPanelProps {
  executionLog: ExecutionLog;
  chainId: string;
  requestIndex: number;
  chainRequests: APIRequest[];
  extractedVariablesByRequest: Record<string, Record<string, any>>;
  extractedVariablesArray: Array<{ name: string; value: any }>;
  allAssertions: any[];
  copiedState: boolean;
  usedStaticVars: Array<{ name: string; value: string }>;
  usedDynamicVars: Array<{ name: string; value: string }>;
  onExtractVariable: (requestId: string, extraction: DataExtraction) => void;
  onRemoveExtraction: (requestId: string, variableName: string) => void;
  onCopy: (requestId: string, value: string) => void;
  onAssertionsUpdate: (requestId: string, assertions: any[]) => Promise<void>;
  onApplyToAllRequests: (name: string) => void;
}

export const ExecutionResultPanel = memo(function ExecutionResultPanel({
  executionLog,
  chainId,
  requestIndex,
  chainRequests,
  extractedVariablesByRequest,
  extractedVariablesArray,
  allAssertions,
  copiedState,
  usedStaticVars,
  usedDynamicVars,
  onExtractVariable,
  onRemoveExtraction,
  onCopy,
  onAssertionsUpdate,
  onApplyToAllRequests,
}: ExecutionResultPanelProps) {
  const { requestId } = executionLog;

  const requestExtractedVariables = useMemo(() => {
    const varsUpToThisPoint: Record<string, any> = {};
    for (let i = 0; i <= requestIndex; i++) {
      const reqId = chainRequests[i]?.id;
      if (reqId && extractedVariablesByRequest[reqId]) {
        Object.assign(varsUpToThisPoint, extractedVariablesByRequest[reqId]);
      }
    }
    return varsUpToThisPoint;
  }, [chainRequests, extractedVariablesByRequest, requestIndex]);

  const existingExtractions = useMemo(
    () => chainRequests.find((r) => r.id === requestId)?.extractVariables || [],
    [chainRequests, requestId],
  );

  if (executionLog.response == null && !executionLog.error) return null;

  return (
    <div className='border-t border-gray-200 p-2'>
      <ResponseExplorer
        response={{
          ...executionLog.response,
          requestId,
        }}
        onExtractVariable={(extraction) =>
          onExtractVariable(requestId, extraction)
        }
        extractedVariables={extractedVariablesByRequest[requestId] || {}}
        existingExtractions={existingExtractions}
        onRemoveExtraction={(variableName) =>
          onRemoveExtraction(requestId, variableName)
        }
        handleCopy={(value) => onCopy(requestId, value)}
        chainId={chainId}
        copied={copiedState}
        actualRequestUrl={executionLog.request?.url}
        actualRequestHeaders={executionLog.request?.headers}
        actualRequestBody={executionLog.request?.body}
        actualRequestMethod={executionLog.request?.method}
        executionStatus={executionLog.status}
        errorMessage={executionLog.error}
        executionLog={executionLog}
        allAssertions={allAssertions}
        onAssertionsUpdate={(assertions) =>
          onAssertionsUpdate(requestId, assertions)
        }
        onApplyToAllRequests={onApplyToAllRequests}
        variables={usedStaticVars}
        dynamicVariables={usedDynamicVars}
        requestIndex={requestIndex}
        extractedVariablesByRequest={extractedVariablesByRequest}
        chainRequests={chainRequests}
        requestExtractedVariables={requestExtractedVariables}
        allDynamicVariables={usedDynamicVars}
        allStaticVariables={usedStaticVars}
        allExtractedVariables={extractedVariablesArray}
      />
    </div>
  );
});
