'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Download, Layers, Save } from 'lucide-react';
import { ManageRequests } from '@/components/TestSuit/ManageRequests';
import { ImportModal } from '@/components/TestSuit/ImportModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTestSuites,
  createTestSuite,
  updateTestSuite,
} from '@/services/testSuites.service';
import {
  CreateTestSuitePayload,
  ExtendedRequest,
} from '@/models/collection.model';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useDataManagement } from '@/hooks/useDataManagement';
import BreadCum from '../BreadCum/Breadcum';

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
  headers?: any[];
  params?: any[];
  order?: number;
  testCases: {
    functional: number;
    total: number;
  };
  selectedTestCases?: string[];
}

interface ExtractedVariable {
  name: string;
  path: string;
  source: string;
  type: string;
}

const EditTestSuiteContent: React.FC = () => {
  const params = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  // Fix the parameter access by properly handling the params object
  const id = (params as any).id;
  const isCreateMode = location.includes('/create');

  const { environments, activeEnvironment, setActiveEnvironment } =
    useDataManagement();

  const [testSuiteName, setTestSuiteName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('');
  const [requests, setRequests] = useState<Request[]>([]);
  const [originalRequestIds, setOriginalRequestIds] = useState<string[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Add state for extracted variables and preRequestId
  const [preRequestId, setPreRequestId] = useState<string | null>(null);
  const [extractedVariables, setExtractedVariables] = useState<
    ExtractedVariable[]
  >([]);

  const {
    data: testSuite,
    isLoading: isLoadingTestSuite,
    isError,
    error,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ['testSuite', id],
    queryFn: () => getTestSuites(id!),
    enabled: !!id && !isCreateMode,
  });

  useEffect(() => {
    if (activeEnvironment) {
      setSelectedEnvironment(activeEnvironment.id);
    }
  }, [activeEnvironment]);

  const handleEnvironmentChange = (environmentId: string) => {
    setSelectedEnvironment(environmentId);
    const selectedEnv = environments.find((env) => env.id === environmentId);
    if (selectedEnv) {
      setActiveEnvironment(selectedEnv);
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateTestSuitePayload) =>
      createTestSuite({ ...data, workspaceId: currentWorkspace!.id }),
    onSuccess: (data) => {
      toast({
        title: 'Test suite created',
        description:
          'Test suite created. Test cases are in progress—please wait for few minutes',
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/test-suites', currentWorkspace?.id],
      });
      setLocation('/test-suites');
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create test suite',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: {
      id: string;
      name: string;
      description: string;
      environmentId: string;
      addRequestIds?: string[];
      removeRequestIds?: string[];
      preRequestId?: string;
      extractedVariables?: ExtractedVariable[];
    }) =>
      updateTestSuite(data.id, {
        name: data.name,
        description: data.description,
        environmentId: data.environmentId,
        addRequestIds: data.addRequestIds,
        removeRequestIds: data.removeRequestIds,
        preRequestId: data.preRequestId,
        extractedVariables: data.extractedVariables,
      }),
    onSuccess: () => {
      toast({
        title: 'Changes saved',
        description: 'Test suite has been updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['testSuites'] });
      queryClient.invalidateQueries({ queryKey: ['testSuite', id] });
      // ✅ Redirect after successful update
      setLocation('/test-suites');
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (testSuite && !isCreateMode) {
      setTestSuiteName(testSuite.name || '');
      setDescription(testSuite.description || '');
      // Transform and set existing requests
      if (Array.isArray(testSuite.requests) && testSuite.requests.length > 0) {
        const transformedRequests: Request[] = testSuite.requests.map(
          (req: any) => ({
            ...req,
            endpoint: req.url,
            testCases: {
              functional: 0,
              total: 0,
            },
          })
        );
        setRequests(transformedRequests);
        // Store original request IDs for tracking changes
        setOriginalRequestIds(transformedRequests.map((req) => req.id));
      }

      // Set existing preRequestId and extractedVariables if they exist
      if (testSuite.preRequestId) {
        setPreRequestId(testSuite.preRequestId);
      }
      if (testSuite.extractedVariables) {
        setExtractedVariables(testSuite.extractedVariables);
      }
    }
  }, [testSuite, isCreateMode]);

  useEffect(() => {
    if (isError && error && !isCreateMode) {
      toast({
        title: 'Error',
        description: 'Failed to load test suite data. Please try again.',
        variant: 'destructive',
      });
    }
  }, [isError, error, toast, isCreateMode]);

  const handleImportRequests = (selectedRequests: ExtendedRequest[]) => {
    const transformedRequests: Request[] = selectedRequests.map((extReq) => ({
      ...extReq,
      endpoint: extReq.endpoint || extReq.url || '',
      description:
        extReq.description ||
        `${extReq.method} ${extReq.endpoint || extReq.url}`,
      testCases: extReq.testCases || {
        functional: 0,
        total: 0,
      },
    }));

    // Add the transformed requests to the existing requests
    setRequests((prev) => [...prev, ...transformedRequests]);
    setIsImportModalOpen(false);

    toast({
      title: 'Requests imported',
      description: `${selectedRequests.length} request(s) imported successfully`,
    });
  };

  const handleDeleteRequest = (requestId: string) => {
    setRequests((prev) => prev.filter((req) => req.id !== requestId));
    toast({
      title: 'Request removed',
      description: 'Request has been removed from the test suite',
    });
  };

  const handleUpdateTestCases = (requestId: string, testCaseIds: string[]) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === requestId ? { ...req, selectedTestCases: testCaseIds } : req
      )
    );
    toast({
      title: 'Test cases updated',
      description: `${testCaseIds.length} test cases configured for this request`,
    });
  };

  // Handler for saving extracted variables from ManageRequests
  const handleSaveExtractedVariables = (
    requestId: string,
    variables: ExtractedVariable[]
  ) => {
    console.log('requestId:', requestId);
    console.log('extractedVariables:', variables);

    setPreRequestId(requestId);
    setExtractedVariables(variables);

    toast({
      title: 'Variables extracted',
      description: `${variables.length} variable(s) extracted and will be saved with the test suite`,
    });
  };

  const calculateRequestChanges = () => {
    const currentRequestIds = requests.map((req) => req.id);
    // Find added requests (present in current but not in original)
    const addRequestIds = currentRequestIds.filter(
      (id) => !originalRequestIds.includes(id)
    );
    // Find removed requests (present in original but not in current)
    const removeRequestIds = originalRequestIds.filter(
      (id) => !currentRequestIds.includes(id)
    );
    return { addRequestIds, removeRequestIds };
  };

  const handleSaveChanges = () => {
    if (!testSuiteName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Test suite name is required.',
        variant: 'destructive',
      });
      return;
    }

    if (isCreateMode) {
      createMutation.mutate({
        name: testSuiteName,
        description: description,
        environmentId: selectedEnvironment,
        requestIds: requests.map((request) => request.id),
        preRequestId: preRequestId || undefined,
        extractedVariables:
          extractedVariables.length > 0 ? extractedVariables : undefined,
      });
    } else {
      const { addRequestIds, removeRequestIds } = calculateRequestChanges();
      updateMutation.mutate({
        id: id!,
        name: testSuiteName,
        description: description,
        environmentId: selectedEnvironment,
        addRequestIds: addRequestIds.length > 0 ? addRequestIds : undefined,
        removeRequestIds:
          removeRequestIds.length > 0 ? removeRequestIds : undefined,
        preRequestId: preRequestId || undefined,
        extractedVariables:
          extractedVariables.length > 0 ? extractedVariables : undefined,
      });
    }
  };

  const handleBack = () => {
    setLocation('/test-suites');
  };

  const isLoading = isCreateMode ? false : isLoadingTestSuite;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Get imported request IDs to pass to ImportModal
  const importedRequestIds = requests.map((request) => request.id);

  // Calculate total test cases
  const totalTestCases = requests.reduce(
    (total, req) => total + (req.selectedTestCases?.length || 0),
    0
  );

  return (
    <>
      <BreadCum
        title={isCreateMode ? 'Create Test Suite' : 'Edit Test Suite'}
        subtitle={
          !isCreateMode
            ? `Test Suite ID: ${id}`
            : 'Manage your API automation workflows'
        }
        buttonTitle=' Create Test suite'
        showCreateButton={false}
        showQuickGuide={false}
        onClickQuickGuide={() => console.log('Exporting...')}
        icon={Layers}
        iconBgClass='bg-green-100'
        iconColor='#0f766e'
        iconSize={36}
      />
      <div className='border border-gray-200 rounded-lg min-h-screen bg-background mt-3'>
        <div className='p-6 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='text-lg font-medium'>
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <label className='block text-sm font-medium mb-2'>
                  Test Suite Name <span className='text-destructive'>*</span>
                </label>
                <Input
                  value={testSuiteName}
                  onChange={(e) => setTestSuiteName(e.target.value)}
                  placeholder='Enter test suite name'
                />
              </div>
              <div>
                <label className='block text-sm font-medium mb-2'>
                  Description (optional)
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='Enter test suite description'
                  rows={3}
                />
              </div>
              <div className='space-y-2'>
                <label
                  htmlFor='environment-select'
                  className='block text-sm font-medium'
                >
                  Environment <span className='text-destructive'>*</span>
                </label>
                <Select
                  value={selectedEnvironment}
                  onValueChange={handleEnvironmentChange}
                >
                  <SelectTrigger id='environment-select'>
                    <SelectValue placeholder='Select environment' />
                  </SelectTrigger>
                  <SelectContent>
                    {environments.map((env) => (
                      <SelectItem key={env.id} value={env.id}>
                        <div className='flex flex-col text-left'>
                          <span className='font-medium text-sm'>
                            {env.name} -{' '}
                            <span className='text-xs text-muted-foreground break-all'>
                              {env.baseUrl}
                            </span>
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Import Requests Section */}
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='text-lg font-medium'>
                    Import Requests & Configure Test Cases
                  </h3>
                  <p className='text-sm text-muted-foreground mt-1'>
                    Import API requests from collections and configure test
                    cases for each request
                  </p>
                </div>
                <Button
                  variant='outline'
                  onClick={() => setIsImportModalOpen(true)}
                  className='shrink-0'
                >
                  <Download className='w-4 h-4 mr-2' />
                  Import Requests
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <>
                  <div className='bg-gray-50 p-8 rounded-lg border border-dashed flex flex-col items-center justify-center py-12 px-6'>
                    <div className='w-16 h-16 mb-6 rounded-full bg-muted flex items-center justify-center'>
                      <Download className='w-8 h-8 text-muted-foreground' />
                    </div>
                    <h3 className='text-lg font-medium mb-2'></h3>
                    <p className='text-muted-foreground text-center mb-6 max-w-md'>
                      Start by importing API requests from your collections. You
                      can then configure specific test cases for each request.
                    </p>
                    <Button onClick={() => setIsImportModalOpen(true)}>
                      <Download className='w-4 h-4 mr-2' />
                      Import Your First Request
                    </Button>
                  </div>

                  <div className='px-6 py-4 bg-gray-50 mt-5 border-gray-200 flex justify-between items-center'>
                    <div className='text-sm text-gray-600'>
                      <div className='space-y-1'>
                        <div>Imported requests: 0 </div>
                        <div className='font-medium'>Total test cases: 0</div>
                      </div>
                    </div>
                    <div className='flex space-x-3'>
                      <Button variant='outline' onClick={handleBack}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveChanges}
                        disabled={
                          isSaving ||
                          !testSuiteName.trim() ||
                          requests.length === 0
                        }
                      >
                        {isSaving
                          ? isCreateMode
                            ? 'Creating Test Suite...'
                            : 'Saving...'
                          : isCreateMode
                          ? 'Create Test Suite'
                          : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Show requests when they exist */}
                  <ManageRequests
                    requests={requests}
                    testSuiteId={id || ''}
                    onImport={() => setIsImportModalOpen(true)}
                    onDeleteRequest={handleDeleteRequest}
                    onUpdateTestCases={handleUpdateTestCases}
                    onRefreshRequests={async () => {
                      await refetchRequests();
                    }}
                    onSaveExtractedVariables={handleSaveExtractedVariables}
                    requestStats={testSuite?.stats?.requestStats ?? []}
                  />

                  <div className='px-6 py-4 bg-gray-50 mt-5 border-gray-200 flex justify-between items-center'>
                    <div className='text-sm text-gray-600'>
                      <div className='space-y-1'>
                        <div>Imported requests: {requests.length} </div>
                        <div className='font-medium'>
                          Total test cases: {totalTestCases}
                        </div>
                        {extractedVariables.length > 0 && (
                          <div className='text-green-600'>
                            Extracted variables: {extractedVariables.length}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className='flex space-x-3'>
                      <Button variant='outline' onClick={handleBack}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveChanges}
                        disabled={
                          isSaving ||
                          !testSuiteName.trim() ||
                          requests.length === 0
                        }
                      >
                        {isSaving
                          ? isCreateMode
                            ? 'Creating Test Suite...'
                            : 'Saving...'
                          : isCreateMode
                          ? 'Create Test Suite'
                          : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <ImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImport={handleImportRequests}
            importedRequestIds={importedRequestIds}
          />
        </div>
      </div>
    </>
  );
};

export default EditTestSuiteContent;
