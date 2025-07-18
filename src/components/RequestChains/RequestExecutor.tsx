import React, { useState } from 'react';
import { Play, Square, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  APIRequest,
  Variable,
  ExecutionLog,
} from '@/shared/types/requestChain.model';

interface RequestExecutorProps {
  requests: APIRequest[];
  variables: Variable[];
  onExecutionComplete: (
    logs: ExecutionLog[],
    extractedVars: Variable[]
  ) => void;
  onVariableUpdate: (variables: Variable[]) => void;
  onExecutionStateChange?: (
    isExecuting: boolean,
    currentRequestIndex: number
  ) => void;
}

export function RequestExecutor({
  requests,
  variables,
  onExecutionComplete,
  onVariableUpdate,
  onExecutionStateChange,
}: RequestExecutorProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentRequestIndex, setCurrentRequestIndex] = useState(-1);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);

  const executeChain = async () => {
    if (requests.length === 0) return;

    setIsExecuting(true);
    setCurrentRequestIndex(0);
    setExecutionLogs([]);

    onExecutionStateChange?.(true, 0);

    // Mock execution
    const logs: ExecutionLog[] = [];

    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      if (!request.enabled) continue;

      setCurrentRequestIndex(i);
      onExecutionStateChange?.(true, i);

      // Mock delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockLog: ExecutionLog = {
        id: Date.now().toString() + i,
        chainId: 'current-chain',
        requestId: request.id,
        status: 'success',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        duration: 200,
        request: {
          method: request.method,
          url: request.url,
          headers: {},
          body: request.body,
        },
        response: {
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: '{"message": "Success", "data": {"id": 123}}',
          size: 50,
        },
      };

      logs.push(mockLog);
      setExecutionLogs([...logs]);
    }

    setIsExecuting(false);
    setCurrentRequestIndex(-1);
    onExecutionComplete(logs, []);
    onExecutionStateChange?.(false, -1);
  };

  const stopExecution = () => {
    setIsExecuting(false);
    setCurrentRequestIndex(-1);
    onExecutionStateChange?.(false, -1);
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Request Execution</CardTitle>
            <p className='text-sm text-muted-foreground'>
              {requests.filter((r) => r.enabled).length} enabled requests
            </p>
          </div>
          <div className='flex space-x-3'>
            {isExecuting ? (
              <Button
                onClick={stopExecution}
                variant='destructive'
                className='gap-2'
              >
                <Square className='w-4 h-4' />
                Stop
              </Button>
            ) : (
              <Button
                onClick={executeChain}
                disabled={requests.filter((r) => r.enabled).length === 0}
                className='gap-2'
              >
                <Play className='w-4 h-4' />
                Execute Chain
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isExecuting && (
          <div className='mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
            <div className='flex items-center space-x-3'>
              <div className='w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
              <div>
                <p className='font-medium text-blue-900'>
                  Executing request {currentRequestIndex + 1} of{' '}
                  {requests.filter((r) => r.enabled).length}
                </p>
                <p className='text-sm text-blue-700'>
                  {requests[currentRequestIndex]?.name}
                </p>
              </div>
            </div>
          </div>
        )}

        {executionLogs.length > 0 && (
          <div className='space-y-3'>
            <h4 className='font-medium'>Execution Logs</h4>
            {executionLogs.map((log) => (
              <div key={log.id} className='border rounded-lg p-4'>
                <div className='flex items-center space-x-3'>
                  <CheckCircle className='w-5 h-5 text-green-500' />
                  <div>
                    <p className='font-medium'>
                      {log.request.method} {log.request.url}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      {log.duration}ms •{' '}
                      {new Date(log.startTime).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
