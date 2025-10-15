'use client';
import type React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Download, Info, Layers } from 'lucide-react';
import { ManageRequests } from '@/components/TestSuit/ManageRequests';
import { ImportModal } from '@/components/TestSuit/ImportModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTestSuites,
  createTestSuite,
  updateTestSuite,
} from '@/services/testSuites.service';
import { getCollectionsWithRequests } from '@/services/collection.service';
import type {
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
  const [extractVariables, setExtractVariables] = useState<ExtractedVariable[]>(
    []
  );

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

  const { data: collectionsWithRequests } = useQuery({
    queryKey: ['collectionsWithRequests'],
    queryFn: () => getCollectionsWithRequests(),
  });

  const { data: collectionsData } = useQuery({
    queryKey: ['collections', currentWorkspace?.id],
    queryFn: () => {
      if (!currentWorkspace?.id) throw new Error('workspaceId is undefined');
      return getCollectionsWithRequests(currentWorkspace.id);
    },
    enabled: !!currentWorkspace?.id && !isCreateMode,
  });

  // Build a map of requestId -> imported request for quick fallback lookups
  const importedRequestMap = useMemo(() => {
    const map: Record<string, any> = {};
    const cols = collectionsData?.collections ?? [];
    for (const col of cols) {
      const reqs = Array.isArray(col.requests) ? col.requests : [];
      for (const r of reqs) {
        map[r.id] = r;
      }
    }
    return map;
  }, [collectionsData, isCreateMode]);

  useEffect(() => {
    if (activeEnvironment) {
      setSelectedEnvironment(activeEnvironment.id);
    }
  }, [activeEnvironment]);

  const handleEnvironmentChange = (environmentId: string) => {
    setSelectedEnvironment(environmentId);
    const selectedEnv = environments.find((env) => env.id === environmentId);
    // if (selectedEnv) {
    //   setActiveEnvironment(selectedEnv);
    // }
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateTestSuitePayload) =>
      createTestSuite({ ...data, workspaceId: currentWorkspace!.id }),
    onSuccess: (data) => {
      toast({
        title: 'Test cases are being generated.',
        description:
          'You can check their status in the list view after a few minutes',
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
      extractVariables?: ExtractedVariable[];
    }) =>
      updateTestSuite(data.id, {
        name: data.name,
        description: data.description,
        environmentId: data.environmentId,
        addRequestIds: data.addRequestIds,
        removeRequestIds: data.removeRequestIds,
        preRequestId: data.preRequestId,
        extractVariables: data.extractVariables,
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

  const transformRequestData = (req: any): Request => {
    return {
      id: req.id,
      method: req.method || 'GET',
      name: req.name || `${req.method} ${req.url}`,
      endpoint: req.endpoint || req.url || '',
      url: req.url || req.endpoint || '',
      description:
        req.description || `${req.method} ${req.url || req.endpoint}`,

      bodyType: req.bodyType || req.body_type || 'raw',
      bodyRawContent:
        req.bodyRawContent ||
        req.body_raw_content ||
        req.bodyContent ||
        req.body ||
        '',
      bodyFormData:
        req.bodyFormData || req.body_form_data || req.formData || null,

      // Preserve auth-related properties
      authorizationType:
        req.authorizationType ||
        req.authorization_type ||
        req.authType ||
        'none',
      authorization: req.authorization || req.auth || null,

      // Preserve headers and params
      headers: Array.isArray(req.headers) ? req.headers : [],
      params: Array.isArray(req.params)
        ? req.params
        : Array.isArray(req.parameters)
        ? req.parameters
        : [],

      order: req.order || 0,
      testCases: {
        functional: req.testCases?.functional || 0,
        total: req.testCases?.total || 0,
      },
      selectedTestCases: req.selectedTestCases || [],

      meta: req.meta
        ? {
            totalTests: req.meta.totalTests,
            selectedTests: req.meta.selectedTests,
            positive: req.meta.positive,
            negative: req.meta.negative,
            semantic: req.meta.semantic,
            edgeCase: req.meta.edgeCase,
            security: req.meta.security,
            advancedSecurity: req.meta.advancedSecurity,
          }
        : undefined,
    };
  };

  useEffect(() => {
    if (testSuite && !isCreateMode) {
      setTestSuiteName(testSuite.name || '');
      setDescription(testSuite.description || '');

      if (Array.isArray(testSuite.requests) && testSuite.requests.length > 0) {
        console.log('Original testSuite.requests:', testSuite.requests);

        const transformedRequests: Request[] =
          testSuite.requests.map(transformRequestData);

        // Fallback merge: if backend request lacks headers/body/etc, enrich from imported source by id
        const enrichedRequests: Request[] = transformedRequests.map((req) => {
          const imported = importedRequestMap[req.id];
          if (!imported) return req;

          const hasHeaders =
            Array.isArray(req.headers) && req.headers.length > 0;
          const hasParams = Array.isArray(req.params) && req.params.length > 0;
          const hasBody =
            typeof req.bodyRawContent === 'string'
              ? req.bodyRawContent.trim().length > 0
              : false;
          const hasBodyType = !!req.bodyType && req.bodyType !== 'none';
          const hasAuthType =
            !!req.authorizationType && req.authorizationType !== 'none';
          const hasAuth = !!req.authorization;

          return {
            ...req,
            headers: hasHeaders
              ? req.headers
              : Array.isArray(imported.headers)
              ? imported.headers
              : [],
            params: hasParams
              ? req.params
              : Array.isArray(imported.params)
              ? imported.params
              : [],
            bodyRawContent: hasBody
              ? req.bodyRawContent
              : imported.bodyRawContent ?? imported.body ?? '',
            bodyType: hasBodyType ? req.bodyType : imported.bodyType ?? 'raw',
            authorizationType: hasAuthType
              ? req.authorizationType
              : imported.authorizationType ?? 'none',
            authorization: hasAuth
              ? req.authorization
              : imported.authorization ?? null,
          };
        });

        console.log('Transformed requests:', enrichedRequests);

        setRequests(enrichedRequests);
        setOriginalRequestIds(enrichedRequests.map((r) => r.id));
      }

      if (testSuite.preRequestDetails?.id) {
        setPreRequestId(testSuite.preRequestDetails.id);
      } else if (testSuite.preRequestId) {
        setPreRequestId(testSuite.preRequestId);
      }

      if (
        testSuite.extractVariables &&
        Array.isArray(testSuite.extractVariables)
      ) {
        setExtractVariables(testSuite.extractVariables);
      }
    }
  }, [testSuite, isCreateMode, importedRequestMap]);

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
      // Preserve meta field during import
      meta: extReq.meta,
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

    // Trigger a backend refetch so meta.selectedTests (and related totals) update immediately
    refetchRequests();
  };

  const handleSaveExtractVariables = (
    requestId: string,
    variables: ExtractedVariable[]
  ) => {
    console.log('Saving extracted variables:', { requestId, variables });

    // Check if we're changing from an existing preRequestId
    if (
      preRequestId &&
      preRequestId !== requestId &&
      extractVariables.length > 0
    ) {
      console.log('Overwriting existing variables from different request');
    }

    setPreRequestId(requestId);
    setExtractVariables(variables);

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
        extractVariables:
          extractVariables.length > 0 ? extractVariables : undefined,
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
        extractVariables:
          extractVariables.length > 0 ? extractVariables : undefined,
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
  const totalTestCases = useMemo(
    () =>
      isCreateMode
        ? requests.reduce(
            (total, req) => total + (req.selectedTestCases?.length || 0),
            0
          )
        : requests.reduce(
            (total, req) => total + (req.meta?.selectedTests ?? 0),
            0
          ),
    [requests, isCreateMode]
  );

  const importableRequests = useMemo(() => {
    if (collectionsWithRequests) {
      return collectionsWithRequests.flatMap((collection) =>
        collection.requests.map((request) => ({
          ...request,
          collectionName: collection.name,
        }))
      );
    }
    return [];
  }, [collectionsWithRequests]);

  function setIsQuickGuideOpen(arg0: boolean): void {
    throw new Error('Function not implemented.');
  }

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

                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    onClick={() => setIsImportModalOpen(true)}
                    className='shrink-0'
                  >
                    <Download className='w-4 h-4 mr-2' />
                    Import Requests
                  </Button>

                  {/* 🔹 Quick Guide button */}
                  <Button
                    variant='outline'
                    onClick={() => setIsQuickGuideOpen(true)}
                    className='shrink-0'
                  >
                    <Info className='w-4 h-4 mr-2' />
                    Quick Guide
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {requests.length === 0 ? (
                <>
                  <div className='bg-gray-50 p-6 rounded-lg border border-dashed flex flex-col items-center justify-center text-center'>
                    <div className='w-16 h-16 mb-6 rounded-full bg-muted flex items-center justify-center'>
                      <Download className='w-8 h-8 text-muted-foreground' />
                    </div>
                    <p className='text-muted-foreground mb-6 max-w-md'>
                      Start by importing API requests from your collections. You
                      can then configure specific test cases for each request.
                    </p>
                    <Button onClick={() => setIsImportModalOpen(true)}>
                      <Download className='w-4 h-4 mr-2' />
                      Import Your First Request
                    </Button>
                  </div>

                  <div className='px-6 py-4 bg-gray-50 mt-4 border-gray-200 flex justify-between items-center'>
                    <div className='text-sm text-gray-600 space-y-1'>
                      <div>Imported requests: 0</div>
                      <div className='font-medium'>Total test cases: 0</div>
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
                  <ManageRequests
                    requests={requests}
                    testSuiteId={id || ''}
                    onImport={() => setIsImportModalOpen(true)}
                    onDeleteRequest={handleDeleteRequest}
                    onUpdateTestCases={handleUpdateTestCases}
                    onRefreshRequests={async () => {
                      await refetchRequests();
                    }}
                    onSaveExtractVariables={handleSaveExtractVariables}
                    preRequestId={preRequestId}
                    extractVariables={extractVariables}
                  />

                  <div className='px-6 py-4 bg-gray-50 mt-4 border-gray-200 flex justify-between items-center'>
                    <div className='text-sm text-gray-600 space-y-1'>
                      <div>Imported requests: {requests.length}</div>
                      <div className='font-medium'>
                        Total test cases: {totalTestCases}
                      </div>
                      {extractVariables.length > 0 && (
                        <div className='text-green-600'>
                          Extracted variables: {extractVariables.length}
                        </div>
                      )}
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
