import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, Settings } from 'lucide-react';
import { TestCaseSelectionModal } from './TestCaseSelectionModal';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RefreshCcw } from 'lucide-react';

interface Request {
  id: string;
  method: string;
  name: string;
  endpoint: string;
  description: string;
  testCases: {
    functional: number;
    total: number;
  };
  selectedTestCases?: string[];
}

interface ManageRequestsProps {
  requests: Request[];
  testSuiteId: string;
  onImport: () => void;
  onDeleteRequest: (requestId: string) => void;
  onUpdateTestCases: (requestId: string, testCaseIds: string[]) => void;
}

const getMethodBadgeColor = (method: string) => {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'POST':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'PUT':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    case 'DELETE':
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    case 'PATCH':
      return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

export const ManageRequests: React.FC<ManageRequestsProps> = ({
  requests,
  testSuiteId,
  onImport,
  onDeleteRequest,
  onUpdateTestCases,
}) => {
  console.log('requests123:', requests);

  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  const [isTestCaseModalOpen, setIsTestCaseModalOpen] = useState(false);

  const handleConfigureTestCases = (request: Request) => {
    setSelectedRequest(request);
    setIsTestCaseModalOpen(true);
  };

  const handleTestCaseSelection = (testCaseIds: string[]) => {
    if (selectedRequest) {
      onUpdateTestCases(selectedRequest.id, testCaseIds);
    }
    setIsTestCaseModalOpen(false);
    setSelectedRequest(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Requests ({requests.length})</CardTitle>

          <div className='flex items-center space-x-2'>
            <Button variant='outline'>
              <RefreshCcw className='w-4 h-4 mr-2' />
              Refresh
            </Button>
            <Button variant='outline' onClick={onImport}>
              <Download className='w-4 h-4 mr-2' />
              Import More Requests
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className='space-y-3'>
          {requests.map((request) => (
            <div
              key={request.id}
              className='p-4 border rounded-lg hover:bg-muted/50 transition-colors'
            >
              <div className='flex items-start justify-between'>
                <div className='flex items-start space-x-3 flex-1'>
                  <Badge className={getMethodBadgeColor(request.method)}>
                    {request.method}
                  </Badge>
                  <div className='flex-1 min-w-0'>
                    <h4 className='font-medium text-base'>{request.name}</h4>
                    <p className='text-sm text-muted-foreground mt-1'>
                      {request.endpoint}
                    </p>
                    {/* {request.description && (
                      <p className='text-sm text-muted-foreground mt-1'>
                        {request.description}
                      </p>
                    )} */}
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleConfigureTestCases(request)}
                          className='text-muted-foreground hover:text-primary hover:bg-primary/10'
                        >
                          {testSuiteId && <Settings className='w-4 h-4' />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Configuration</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => onDeleteRequest(request.id)}
                          className='text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              {testSuiteId && (
                <div className='mt-4'>
                  <h5 className='text-sm font-medium mb-2'>Test Cases:</h5>
                  <div className='flex items-center space-x-4'>
                    {(request.selectedTestCases?.length || 0) > 0 && (
                      <div className='flex items-center space-x-1'>
                        <span className='text-sm text-muted-foreground'>
                          🧪 Functional
                        </span>
                        <span className='text-sm font-medium'>
                          {request.selectedTestCases?.length || 0}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className='text-sm text-muted-foreground mt-1'>
                    Total:{' '}
                    <span className='font-medium'>
                      {request.selectedTestCases?.length || 0} test cases
                    </span>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>

      {selectedRequest && (
        <TestCaseSelectionModal
          isOpen={isTestCaseModalOpen}
          onClose={() => {
            setIsTestCaseModalOpen(false);
            setSelectedRequest(null);
          }}
          onSelect={handleTestCaseSelection}
          request={{
            ...selectedRequest,
            selectedTestCases: selectedRequest.selectedTestCases || [],
          }}
          testSuiteId={testSuiteId}
        />
      )}
    </Card>
  );
};
