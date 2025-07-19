import React from 'react';
import { Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { APIRequest, ExecutionLog } from '@/shared/types/requestChain.model';

interface VariablesTableProps {
  requests: APIRequest[];
  executionLogs: ExecutionLog[];
  extractedVariables: Record<string, any>;
  isExecuting: boolean;
  currentRequestIndex: number;
}

export function VariablesTable({
  requests,
  executionLogs,
  extractedVariables,
  isExecuting,
  currentRequestIndex,
}: VariablesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Database className='w-5 h-5' />
          Variables Table
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='text-center py-8 text-muted-foreground'>
          <Database className='w-12 h-12 mx-auto mb-3 text-muted-foreground/50' />
          <p>No variable extractions found</p>
          <p className='text-sm'>
            Configure variable extractions in your requests to see them here
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
