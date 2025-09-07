import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, Settings, Play, RefreshCcw } from 'lucide-react';
import { RequestTestDialog } from './RequestTestDialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Request } from '@/shared/types/TestSuite.model';
import { TestCaseSelectionModal } from './TestCaseSelectionModal';

interface CategoryCount {
  category: string;
  count: number;
}

interface RequestStat {
  requestId: string;
  meta?: {
    totalTests?: number;
    selectedTests?: number;
    selectedByCategory?: CategoryCount[];
  };
}

interface ExtractedVariable {
  name: string;
  path: string;
  source: string;
  type: string;
}

interface ManageRequestsProps {
  requests: Request[];
  testSuiteId?: string;
  onImport: () => void;
  onDeleteRequest: (requestId: string) => void;
  onUpdateTestCases?: (requestId: string, testCaseIds: string[]) => void;
  onRefreshRequests?: () => Promise<void> | void;
  onSaveExtractedVariables?: (
    requestId: string,
    extractedData: ExtractedVariable[]
  ) => void;
  requestStats?: RequestStat[];
  variables?: Array<{ name: string; initialValue: string }>;
  environments?: any[];
  activeEnvironment?: any;
  preRequestId?: string | null;
  extractedVariables?: ExtractedVariable[];
}

const getMethodBadgeColor = (method: string) => {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-100';
    case 'POST':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100';
    case 'PUT':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-100';
    case 'DELETE':
      return 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-100';
    case 'PATCH':
      return 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-100';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-100';
  }
};

export const ManageRequests: React.FC<ManageRequestsProps> = ({
  requests,
  testSuiteId,
  onImport,
  onDeleteRequest,
  onUpdateTestCases,
  onRefreshRequests,
  onSaveExtractedVariables,
  requestStats = [],
  variables = [],
  environments = [],
  activeEnvironment,
  preRequestId,
  extractedVariables = [],
}) => {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isTestCaseModalOpen, setIsTestCaseModalOpen] = useState(false);

  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<Request | null>(null);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);

  const statMap = useMemo(() => {
    const m = new Map<string, RequestStat>();
    requestStats.forEach((s) => m.set(s.requestId, s));
    return m;
  }, [requestStats]);

  const substituteVariables = (text: string): string => {
    let result = text;
    variables.forEach((variable) => {
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      result = result.replace(regex, variable.initialValue);
    });
    return result;
  };

  const buildFinalUrl = (url: string): string => {
    if (!url) return '';
    let finalUrl = url;

    // Apply variable substitution
    finalUrl = substituteVariables(finalUrl);

    const baseUrlVar =
      variables.find((v) => v.name === 'baseUrl')?.initialValue || '';

    if (baseUrlVar) {
      try {
        const originalUrl = new URL(finalUrl);
        const pathAndQuery =
          originalUrl.pathname + originalUrl.search + originalUrl.hash;

        // Combine activeEnvironment base URL with the path from original URL
        const baseUrl = baseUrlVar.replace(/\/$/, '');
        finalUrl = `${baseUrl}${pathAndQuery}`;
      } catch (error) {
        if (
          !finalUrl.startsWith('http://') &&
          !finalUrl.startsWith('https://')
        ) {
          finalUrl = finalUrl.startsWith('/') ? finalUrl : `/${finalUrl}`;
          finalUrl = `${baseUrlVar.replace(/\/$/, '')}${finalUrl}`;
        }
      }
    }
    return finalUrl;
  };

  const handleTestRequest = (request: Request) => {
    // Check if there's already a preRequestId and it's different from current request
    if (
      preRequestId &&
      preRequestId !== request.id &&
      extractedVariables.length > 0
    ) {
      setPendingRequest(request);
      setShowOverwriteDialog(true);
    } else {
      setSelectedRequest(request);
      setIsTestDialogOpen(true);
    }
  };

  const handleConfigureTestCases = (request: Request) => {
    setSelectedRequest(request);
    setIsTestCaseModalOpen(true);
  };

  const handleTestCaseSelection = (testCaseIds: string[]) => {
    if (selectedRequest && onUpdateTestCases) {
      onUpdateTestCases(selectedRequest.id, testCaseIds);
    }
    setIsTestCaseModalOpen(false);
    setSelectedRequest(null);
  };

  const handleConfirmOverwrite = () => {
    if (pendingRequest) {
      setSelectedRequest(pendingRequest);
      setIsTestDialogOpen(true);
      setPendingRequest(null);
    }
    setShowOverwriteDialog(false);
  };

  const handleCancelOverwrite = () => {
    setPendingRequest(null);
    setShowOverwriteDialog(false);
  };

  const handleRefresh = async () => {
    if (!onRefreshRequests) return;
    try {
      setRefreshing(true);
      await onRefreshRequests();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveExtractedVariables = (
    requestId: string,
    extractedVariables: ExtractedVariable[]
  ) => {
    console.log('requestId:', requestId);
    console.log('extractedVariables:', extractedVariables);

    // Pass the data to parent component instead of storing locally
    if (onSaveExtractedVariables) {
      onSaveExtractedVariables(requestId, extractedVariables);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Functional':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'Performance':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      case 'Security':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
      case 'General':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
      case 'Regression':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Functional':
        return '🔧';
      case 'Performance':
        return '⚡';
      case 'Security':
        return '🛡️';
      case 'General':
        return '📋';
      case 'Regression':
        return '🔄';
      default:
        return '📋';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Requests ({requests.length})</CardTitle>

          <div className='flex items-center space-x-2'>
            {onRefreshRequests && (
              <Button
                variant='outline'
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCcw
                  className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
                />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            )}
            <Button variant='outline' onClick={onImport}>
              <Download className='w-4 h-4 mr-2' />
              Import More Requests
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className='space-y-3'>
          {requests.map((request) => {
            const finalUrl = buildFinalUrl(request.url);
            const stat = statMap.get(request.id);
            const totalTests = stat?.meta?.totalTests ?? 0;
            const selectedTests = stat?.meta?.selectedTests ?? 0;
            const selectedByCategory = stat?.meta?.selectedByCategory ?? [];

            return (
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
                      <div className='flex items-center gap-2'>
                        <h4 className='font-medium text-base'>
                          {request.name}
                        </h4>
                        {preRequestId === request.id && (
                          <Badge
                            variant='secondary'
                            className='text-xs bg-green-100 text-green-800'
                          >
                            Pre-request
                          </Badge>
                        )}
                      </div>
                      <p className='text-sm text-muted-foreground mt-1 break-all'>
                        {finalUrl}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleTestRequest(request)}
                            className='text-muted-foreground hover:text-primary hover:bg-primary/10'
                          >
                            <Play className='w-4 h-4' />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Test Request</TooltipContent>
                      </Tooltip>

                      {testSuiteId && onUpdateTestCases && (
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
                          <TooltipContent>Select testcases</TooltipContent>
                        </Tooltip>
                      )}

                      <AlertDialog>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant='ghost'
                                size='sm'
                                className='text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900'
                              >
                                <Trash2 className='w-4 h-4' />
                              </Button>
                            </AlertDialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>Delete Request</TooltipContent>
                        </Tooltip>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete this request?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{request.name}".
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDeleteRequest(request.id)}
                              className='bg-red-600 hover:bg-red-700'
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TooltipProvider>
                  </div>
                </div>
                {testSuiteId && (
                  <div className='mt-4'>
                    <h5 className='text-sm font-medium mb-2'>Test Cases</h5>

                    {/* Show selected test cases by category */}
                    {selectedByCategory.length > 0 && (
                      <div className='space-y-2 mb-3'>
                        {selectedByCategory.map((categoryData) => (
                          <div
                            key={categoryData.category}
                            className='flex items-center justify-between text-xs'
                          >
                            <div className='flex items-center'>
                              <span className='mr-1'>
                                {getCategoryIcon(categoryData.category)}
                              </span>
                              <span className='capitalize text-gray-600 dark:text-gray-300'>
                                {categoryData.category}
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full font-medium ${getCategoryColor(
                                categoryData.category
                              )}`}
                            >
                              {categoryData.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Show total test cases */}
                    <div className='pt-1 border-t border-gray-200 dark:border-gray-700'>
                      <div className='flex items-center justify-between text-xs font-medium'>
                        <span className='text-gray-700 dark:text-gray-300'>
                          Total:
                        </span>
                        <span className='text-gray-900 dark:text-gray-100'>
                          {totalTests ? <>{totalTests}</> : null} test cases
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      {selectedRequest && (
        <RequestTestDialog
          isOpen={isTestDialogOpen}
          onClose={() => {
            setIsTestDialogOpen(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
          onSaveExtractedVariables={handleSaveExtractedVariables}
        />
      )}

      {selectedRequest && testSuiteId && (
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
          testSuiteId={testSuiteId} // always string here
        />
      )}

      {/* Overwrite Confirmation Dialog */}
      <AlertDialog
        open={showOverwriteDialog}
        onOpenChange={setShowOverwriteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Overwrite Pre-request Variables?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You already have extracted variables from another request. Testing
              this request will allow you to extract new variables that will
              overwrite the existing ones. Do you want to continue?
              <div className='mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm'>
                <strong>Current pre-request:</strong>{' '}
                {requests.find((r) => r.id === preRequestId)?.name}
                <br />
                <strong>Extracted variables:</strong>{' '}
                {extractedVariables.length}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelOverwrite}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmOverwrite}
              className='bg-yellow-600 hover:bg-yellow-700'
            >
              Yes, Overwrite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
