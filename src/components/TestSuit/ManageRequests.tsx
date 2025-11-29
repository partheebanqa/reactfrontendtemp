

import type React from 'react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Trash2,
  Settings,
  Play,
  RefreshCcw,
  FileKey,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
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
import { TestCaseSelectionModal } from './TestCaseSelectionModal';
import {
  CategoryCount,
  RequestHeader,
  RequestParam,
} from '@/shared/types/TestSuite.model';
import { ExtractedVariable } from '@/shared/types/requestChain.model';

interface Request {
  id: string;
  method: string;
  name: string;
  endpoint: string;
  url: string;
  description: string;
  bodyType?: string;
  bodyRawContent?: string;
  bodyFormData?: any;
  authorizationType?: string;
  authorization?: any;
  headers?: RequestHeader[];
  params?: RequestParam[];
  order?: number;
  testCases: {
    functional: number;
    total: number;
  };
  selectedTestCases?: string[];
  meta?: {
    totalTests?: number;
    selectedTests?: number;
    positive?: number;
    negative?: number;
    semantic?: number;
    edgeCase?: number;
    security?: number;
    advancedSecurity?: number;
  };
}

interface ManageRequestsProps {
  requests: Request[];
  testSuiteId?: string;
  onImport?: () => void;
  onDeleteRequest: (requestId: string) => void;
  onUpdateTestCases?: (requestId: string, testCaseIds: string[]) => void;
  onRefreshRequests?: () => Promise<void> | void;
  onSaveExtractVariables?: (
    requestId: string,
    extractedData: ExtractedVariable[]
  ) => void;
  variables?: Array<{ name: string; initialValue: string }>;
  environments?: any[];
  activeEnvironment?: any;
  preRequestId?: string | null;
  extractVariables?: ExtractedVariable[];
  filterMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  showAuthCapture?: boolean;
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
  onSaveExtractVariables,
  variables = [],
  environments = [],
  activeEnvironment,
  preRequestId,
  extractVariables = [],
  filterMethod,
  showAuthCapture,
}) => {
  const [showCategories, setShowCategories] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isTestCaseModalOpen, setIsTestCaseModalOpen] = useState(false);

  // console.log('requests123:', requests);

  // console.log('preRequestId:', preRequestId);

  // console.log('extractVariables:', extractVariables);

  // console.log('testSuiteId:', testSuiteId);

  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<Request | null>(null);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);

  const visibleRequests = useMemo(() => {
    if (!filterMethod) return requests;
    return requests.filter(
      (r) => r.method?.toUpperCase() === filterMethod.toUpperCase()
    );
  }, [requests, filterMethod]);

  const mapCategoryData = (meta: any) => {
    if (!meta)
      return { totalTests: 0, selectedTests: 0, selectedByCategory: [] };

    const categoryMapping: { [key: string]: string } = {
      positive: 'positive',
      negative: 'negative',
      semantic: 'semantic',
      edgeCase: 'edgeCase',
      security: 'security',
      advancedSecurity: 'advancedSecurity',
    };

    const categoryCounts: { [key: string]: number } = {};

    // Sum up counts by UI category
    Object.entries(meta).forEach(([key, value]) => {
      if (categoryMapping[key] && typeof value === 'number' && value > 0) {
        const uiCategory = categoryMapping[key];
        categoryCounts[uiCategory] = (categoryCounts[uiCategory] || 0) + value;
      }
    });

    const selectedByCategory = Object.entries(categoryCounts).map(
      ([category, count]) => ({
        category,
        count,
      })
    );

    return {
      totalTests: meta.totalTests || 0,
      selectedTests: meta.selectedTests || 0,
      selectedByCategory,
    };
  };

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
    if (
      preRequestId &&
      preRequestId !== request.id &&
      extractVariables.length > 0
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
    console.log('User confirmed overwrite');
    if (pendingRequest) {
      setSelectedRequest(pendingRequest);
      setIsTestDialogOpen(true);
      setPendingRequest(null);
    }
    setShowOverwriteDialog(false);
  };

  const handleCancelOverwrite = () => {
    console.log('User cancelled overwrite');
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

  const handleSaveExtractVariables = (
    requestId: string,
    extractVariables: ExtractedVariable[]
  ) => {
    // console.log('requestId:', requestId);
    // console.log('extractVariables:', extractVariables);

    // Pass the data to parent component instead of storing locally
    if (onSaveExtractVariables) {
      onSaveExtractVariables(requestId, extractVariables);
    }
  };

  // ✅ Central mapping of all categories with color + icon
  const categoryConfig: {
    [key: string]: { color: string; icon: string };
  } = {
    Functional: {
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      icon: '🔧',
    },
    Performance: {
      color:
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
      icon: '⚡',
    },
    Security: {
      color:
        'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
      icon: '🛡️',
    },
    General: {
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
      icon: '📋',
    },
    Regression: {
      color:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      icon: '🔄',
    },

    // 🔥 New categories
    positive: {
      color:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      icon: '👍',
    },
    negative: {
      color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
      icon: '👎',
    },
    semantic: {
      color:
        'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100',
      icon: '🧩',
    },
    edgeCase: {
      color:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
      icon: '⚠️',
    },
    security: {
      color:
        'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
      icon: '🛡️',
    },
    advancedSecurity: {
      color: 'bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-100',
      icon: '🚨',
    },
  };

  // ✅ Default fallback values
  const DEFAULT_COLOR =
    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
  const DEFAULT_ICON = '📋';

  // 👉 Functions to use everywhere
  const getCategoryColor = (category: string) =>
    categoryConfig[category]?.color || DEFAULT_COLOR;

  const getCategoryIcon = (category: string) =>
    categoryConfig[category]?.icon || DEFAULT_ICON;

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
            {onImport && (
              <Button variant='outline' onClick={onImport}>
                <Download className='w-4 h-4 mr-2' />
                Import More Requests
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className='space-y-3'>
          {visibleRequests.map((request) => {
            const finalUrl = buildFinalUrl(request.url);
            const { totalTests, selectedTests, selectedByCategory } =
              mapCategoryData(request.meta);

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
                      {showAuthCapture && request.method === 'POST' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleTestRequest(request)}
                              className='text-muted-foreground hover:text-primary hover:bg-primary/10'
                            >
                              <FileKey className='w-4 h-4' />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Capture Auth</TooltipContent>
                        </Tooltip>
                      )}

                      {testSuiteId &&
                        onUpdateTestCases &&
                        preRequestId !== request.id && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() =>
                                  handleConfigureTestCases(request)
                                }
                                className='text-muted-foreground hover:text-primary hover:bg-primary/10'
                              >
                                <Settings className='w-4 h-4' />
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
                              {preRequestId === request.id
                                ? 'You are trying to delete the pre-request api. Check once before deleting.'
                                : `This will permanently delete "${request.name}". This action cannot be undone.`}
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
                {testSuiteId && preRequestId !== request.id && (
                  <div className='mt-4'>
                    {selectedByCategory.length === 0 && (
                      <h5 className='text-sm font-medium mb-2'>Test Cases</h5>
                    )}
                    {/* <h5 className='text-sm font-medium mb-2'>Test Cases</h5> */}
                    {selectedByCategory.length > 0 && (
                      <div>
                        {/* header row with toggle */}
                        <div className='flex items-center justify-between mb-1'>
                          <span className='text-sm font-medium mb-2'>
                            Test Cases
                          </span>
                          <button
                            onClick={() => setShowCategories(!showCategories)}
                            className='flex items-center text-xs font-medium text-primary hover:underline'
                          >
                            {showCategories ? (
                              <>
                                <ChevronDown className='w-4 h-4 mr-1' /> Hide
                              </>
                            ) : (
                              <>
                                <ChevronRight className='w-4 h-4 mr-1' /> Show
                              </>
                            )}
                          </button>
                        </div>

                        {/* collapsible category list */}
                        <div
                          className={`overflow-hidden transition-all duration-300 ${showCategories
                            ? 'max-h-[1000px] opacity-100'
                            : 'max-h-0 opacity-0'
                            }`}
                        >
                          <div className='space-y-2'>
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
                        </div>
                      </div>
                    )}

                    <div className='pt-1 border-t border-gray-200 dark:border-gray-700'>
                      <div className='flex items-center justify-between text-xs font-medium'>
                        <span className='text-gray-700 dark:text-gray-300'>
                          Selected:
                        </span>
                        <span className='text-gray-900 dark:text-gray-100'>
                          {selectedTests ?? 0} / {totalTests ?? 0} test cases
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
          onSaveExtractVariables={handleSaveExtractVariables}
          existingExtractedVariables={
            preRequestId === selectedRequest.id ? extractVariables : []
          }
        />
      )}

      {/* {selectedRequest && testSuiteId && (
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
      )} */}

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
          testSuiteId={testSuiteId || ''}
        />
      )}


      <AlertDialog
        open={showOverwriteDialog}
        onOpenChange={setShowOverwriteDialog}
      >
        <AlertDialogContent className='max-w-2xl w-full h-auto max-h-[80vh]'>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch Authentication Source?</AlertDialogTitle>
            <AlertDialogDescription>
              You've already extracted authentication variables from another API
              request. Switching to a new request will overwrite the existing
              variables with fresh values from the selected API.
              <div className='mt-3 p-3  border border--blue-200 rounded text-sm'>
                <div className='space-y-1'>
                  <div>
                    <strong>Current Pre-request Api:</strong>{' '}
                    {requests.find((r) => r.id === preRequestId)?.name ||
                      'Unknown'}
                  </div>
                  <div>
                    <strong>Extracted variables:</strong>{' '}
                    {extractVariables.length > 0
                      ? extractVariables.map((v) => v.name).join(', ')
                      : 'None'}
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelOverwrite}>
              Cancel
            </AlertDialogCancel>
            <Button onClick={handleConfirmOverwrite}>Yes, Switch Source</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
