import type React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Layers,
  Info,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  Play,
  Loader2,
  KeyRound,
  Upload,
} from 'lucide-react';

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

import BreadCum from '../BreadCum/Breadcum';
import { WorkflowStepper } from './Components/WorkflowStepper';

import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useDataManagement } from '@/hooks/useDataManagement';

import {
  getTestSuites,
  createTestSuite,
  updateTestSuite,
  executeTestSuite,
} from '@/services/testSuites.service';
import { getCollectionsWithRequests } from '@/services/collection.service';

import { ManageRequests } from '@/components/TestSuit/ManageRequests';
import { ImportModal } from '@/components/TestSuit/ImportModal';

import type { WorkflowStep } from '@/types';
import { RequestTestDialog } from '../TestSuit/RequestTestDialog';

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

const CreateTestSuit: React.FC = () => {
  // ------- ROUTE / MODE -------
  const params = useParams();
  const [location, setLocation] = useLocation();
  const id = (params as any).id as string | undefined;
  const isCreateMode = location.includes('/create');

  // ------- STEP STATE -------
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('basic-info');
  const [completedSteps, setCompletedSteps] = useState<WorkflowStep[]>([]);

  const steps: WorkflowStep[] = [
    'basic-info',
    'prerequisites',
    'select-apis',
    'select-tests',
    'execute',
  ];

  const navigateToStep = (step: WorkflowStep) => {
    if (isCreateMode) {
      // create mode
      setLocation(`/test-suites/create?step=${step}`);
    } else if (id) {
      // edit mode
      setLocation(`/test-suites/${id}?step=${step}`);
    }
  };

  // ------- GLOBAL HOOKS -------
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const { environments, activeEnvironment } = useDataManagement();

  // ------- STATE -------
  const [testSuiteName, setTestSuiteName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('');
  const [selectedEnvName, setSelectedEnvName] = useState<string>('');
  const [requests, setRequests] = useState<Request[]>([]);
  const [originalRequestIds, setOriginalRequestIds] = useState<string[]>([]);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [preRequestId, setPreRequestId] = useState<string | null>(null);

  const [extractVariables, setExtractVariables] = useState<ExtractedVariable[]>(
    []
  );

  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);

  const [preRequestInfo, setPreRequestInfo] = useState<{
    id: string;
    name: string;
    method: string;
    url: string;
  } | null>(null);

  const mainRequests = useMemo(
    () => requests.filter((r) => r.id !== preRequestId),
    [requests, preRequestId]
  );

  const mainRequestsCount = mainRequests.length;

  // ------- QUERIES -------
  const {
    data: testSuite,
    isLoading: isLoadingTestSuite,
    isError,
    error,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ['testSuite', id],
    queryFn: () => getTestSuites(id!, currentWorkspace!.id),
    enabled: !!id && !isCreateMode,
  });

  const { data: collectionsWithRequests } = useQuery({
    queryKey: ['collectionsWithRequests'],
    queryFn: () => getCollectionsWithRequests(''),
  });

  const { data: collectionsData } = useQuery({
    queryKey: ['collections', currentWorkspace?.id],
    queryFn: () => {
      if (!currentWorkspace?.id) throw new Error('workspaceId is undefined');
      return getCollectionsWithRequests(currentWorkspace.id);
    },
    enabled: !!currentWorkspace?.id && !isCreateMode,
  });

  // ------- IMPORTED REQUEST MAP (old logic) -------
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

  // ------- ENV DEFAULT -------
  useEffect(() => {
    if (activeEnvironment) {
      setSelectedEnvironment(activeEnvironment.id);
    }
  }, [activeEnvironment]);

  useEffect(() => {
    if (activeEnvironment) {
      setSelectedEnvironment(activeEnvironment.id);
      setSelectedEnvName(activeEnvironment.name);
    }
  }, [activeEnvironment]);

  const handleEnvironmentChange = (environmentId: string) => {
    setSelectedEnvironment(environmentId);
  };

  // ------- MUTATIONS -------
  const createMutation = useMutation({
    mutationFn: (data: {
      name: string;
      description: string;
      environmentId: string;
      requestIds: string[];
      preRequestId?: string;
      extractVariables?: ExtractedVariable[];
    }) => createTestSuite({ ...data, workspaceId: currentWorkspace!.id }),
    onMutate: () => {
      toast({
        title: 'Generating test cases…',
        description:
          'Test cases are being generated, please wait for some time.',
        variant: 'default',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Testcase are getting generated ',
        description:
          'Wait for testcase generation status and select the testcases',
        variant: 'success',
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/test-suites', currentWorkspace?.id],
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create test suite',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get('step') as WorkflowStep | null;

    if (stepParam && steps.includes(stepParam)) {
      setCurrentStep(stepParam);

      // mark all previous steps as completed for the UI
      const stepIndex = steps.indexOf(stepParam);
      setCompletedSteps(steps.slice(0, stepIndex));
    }
  }, [location]);

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
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    },
  });

  const executeSuiteMutation = useMutation({
    mutationFn: executeTestSuite,
    onSuccess: () => {
      toast({
        title: 'Queued',
        description: 'Test suite has been added to the queue for execution.',
      });
      queryClient.invalidateQueries({ queryKey: ['testSuites'] });
      setLocation('/test-suites');
    },
    onError: () => {
      toast({
        title: 'Execute failed',
        description: 'Execution failed. Please try again later.',
        variant: 'destructive',
      });
    },
  });

  const isExecuting = executeSuiteMutation.isPending;

  const handleExecuteSuite = (id: string) => {
    if (!id) return;
    executeSuiteMutation.mutate({ testSuiteId: id });
  };

  // ------- TRANSFORM REQUEST -------
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
      authorizationType:
        req.authorizationType ||
        req.authorization_type ||
        req.authType ||
        'none',
      authorization: req.authorization || req.auth || null,
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

  // ------- LOAD EXISTING TEST SUITE (edit mode) -------
  useEffect(() => {
    if (testSuite && !isCreateMode) {
      setTestSuiteName(testSuite.name || '');
      setDescription(testSuite.description || '');
      if (testSuite.environment?.id) {
        setSelectedEnvironment(testSuite.environment?.id);
      }

      if (Array.isArray(testSuite.requests) && testSuite.requests.length > 0) {
        const transformedRequests: Request[] =
          testSuite.requests.map(transformRequestData);

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

  // ------- ERROR HANDLING -------
  useEffect(() => {
    if (isError && error && !isCreateMode) {
      toast({
        title: 'Error',
        description: 'Failed to load test suite data. Please try again.',
        variant: 'destructive',
      });
    }
  }, [isError, error, toast, isCreateMode]);

  // ------- IMPORT REQUESTS -------
  const handleImportRequests = (selectedRequests: any[]) => {
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
      meta: extReq.meta,
    }));

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
    refetchRequests();
  };

  const handleSaveExtractVariables = (
    request: { id: string; name: string; method: string; url: string },
    variables: ExtractedVariable[]
  ) => {
    setPreRequestId(request.id);
    setPreRequestInfo(request);
    setExtractVariables(variables);
    toast({
      title: 'Variables extracted',
      description: `${variables?.length} variable(s) extracted and will be saved with the test suite`,
    });
  };

  // ------- REQUEST DIFF (for CTA + updateMutation) -------
  const calculateRequestChanges = () => {
    const currentRequestIds = requests.map((req) => req.id);
    const addRequestIds = currentRequestIds.filter(
      (rid) => !originalRequestIds.includes(rid)
    );
    const removeRequestIds = originalRequestIds.filter(
      (rid) => !currentRequestIds.includes(rid)
    );
    return { addRequestIds, removeRequestIds };
  };

  // 🔹 CTA config for Select APIs step
  const getRequestsCTAConfig = () => {
    const { addRequestIds, removeRequestIds } = calculateRequestChanges();

    const hasAddedNew = addRequestIds.length > 0;
    const hasRemoved = removeRequestIds.length > 0;

    // NOTE: With diff-vs-original logic, "re-added" nets to no change,
    // so we don't have a separate re-added state here.

    if (hasAddedNew && !hasRemoved) {
      return {
        text: 'Generate Test Cases',
        description: 'Generate test cases for new requests',
        color: 'bg-[#136fb0] hover:bg-[#136fb0]',
      };
    }

    if (hasRemoved && !hasAddedNew) {
      return {
        text: 'Select Test Cases',
        description: 'Select or modify existing test cases',
        color: 'bg-[#136fb0] hover:bg-[#136fb0]',
      };
    }

    if (hasAddedNew && hasRemoved) {
      return {
        text: 'Generate Test Cases',
        description: 'Generate test cases for new requests',
        color: 'bg-[#136fb0] hover:bg-[#136fb0]',
      };
    }

    return {
      text: 'Select Test Cases',
      description: 'No changes made to requests',
      color: 'bg-[#136fb0] hover:bg-[#136fb0]',
    };
  };

  // ------- SAVE (called on final step / select-apis) -------
  const handleSaveChanges = (opts?: { goToNextAfterSave?: boolean }) => {
    if (!testSuiteName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Test suite name is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedEnvironment) {
      toast({
        title: 'Validation Error',
        description: 'Environment is required.',
        variant: 'destructive',
      });
      return;
    }

    const moveToNextStep = () => {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps((prev) => [...prev, currentStep]);
      }

      const currentIndex = steps.indexOf(currentStep);
      if (currentIndex < steps.length - 1) {
        const nextStep = steps[currentIndex + 1];
        setCurrentStep(nextStep);
        navigateToStep(nextStep);
      }
    };

    if (isCreateMode) {
      // CREATE FLOW
      createMutation.mutate(
        {
          name: testSuiteName,
          description,
          environmentId: selectedEnvironment,
          requestIds: requests.map((r) => r.id),
          preRequestId: preRequestId || undefined,
          extractVariables: extractVariables.length
            ? extractVariables
            : undefined,
        },
        opts?.goToNextAfterSave
          ? {
              onSuccess: (created: any) => {
                if (created?.id) {
                  setLocation(`/test-suites/${created.id}?step=select-tests`);
                } else {
                  moveToNextStep();
                }
              },
            }
          : undefined
      );
    } else {
      const { addRequestIds, removeRequestIds } = calculateRequestChanges();

      updateMutation.mutate(
        {
          id: id!,
          name: testSuiteName,
          description,
          environmentId: selectedEnvironment,
          addRequestIds: addRequestIds.length ? addRequestIds : undefined,
          removeRequestIds: removeRequestIds.length
            ? removeRequestIds
            : undefined,
          preRequestId: preRequestId || undefined,
          extractVariables: extractVariables.length
            ? extractVariables
            : undefined,
        },
        opts?.goToNextAfterSave
          ? {
              onSuccess: () => {
                moveToNextStep();
              },
            }
          : undefined
      );
    }
  };

  const handleBackToList = () => {
    setLocation('/test-suites');
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isLoading = isCreateMode ? false : isLoadingTestSuite;

  const importedRequestIds = requests.map((r) => r.id);

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
      return collectionsWithRequests.flatMap((collection: any) =>
        collection.requests.map((request: any) => ({
          ...request,
          collectionName: collection.name,
        }))
      );
    }
    return [];
  }, [collectionsWithRequests]);

  // ------- STEPPER NAVIGATION -------
  const canProceed = () => {
    switch (currentStep) {
      case 'basic-info':
        return !!testSuiteName.trim() && !!selectedEnvironment;
      case 'prerequisites':
        return true;
      case 'select-apis':
        return mainRequestsCount > 0;
      case 'generate-tests':
        return requests.length > 0;
      case 'select-tests':
        return totalTestCases > 0;
      case 'execute':
        return true;
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    if (!canProceed()) return;

    // SPECIAL CASE: When on "select-apis"
    if (currentStep === 'select-apis') {
      // Do NOT move step immediately
      // Trigger save and only move after success
      handleSaveChanges({ goToNextAfterSave: true });
      return;
    }

    // NORMAL NAVIGATION for all other steps
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep]);
    }

    const currentIndex = steps.indexOf(currentStep);

    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      setCurrentStep(nextStep);
      navigateToStep(nextStep);
    } else if (currentStep === 'execute') {
      // nothing for now
    }
  };

  const handleBackStep = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      const prevStep = steps[currentIndex - 1];
      setCurrentStep(prevStep);
      navigateToStep(prevStep);
    } else {
      handleBackToList();
    }
  };

  const isPreparingTestCases =
    currentStep === 'select-tests' &&
    totalTestCases === 0 &&
    requests.length > 0;

  const getNextButtonText = () => {
    if (isPreparingTestCases) {
      return 'Select test cases';
    }

    if (isSaving) {
      if (currentStep === 'select-apis') {
        const cta = getRequestsCTAConfig();
        if (cta.text === 'Generate Test Cases') {
          return 'Generating test cases...';
        }
        if (cta.text === 'Select Test Cases') {
          return 'Saving changes...';
        }
        return 'Processing...';
      }
      return 'Saving...';
    }

    switch (currentStep) {
      case 'basic-info':
        return 'Continue to Prerequisites';
      case 'prerequisites':
        return 'Continue to Select APIs';
      case 'select-apis': {
        const cta = getRequestsCTAConfig();
        return cta.text;
      }
      case 'select-tests':
        return 'Continue to Execute';
      case 'execute':
        return isCreateMode ? 'Create & Run' : 'Save & Run';
      default:
        return 'Next';
    }
  };

  const showNextLoader = currentStep === 'select-apis' && isSaving;

  const authRequest = requests.find((r) => r.id === preRequestId);
  const authBaseUrl = authRequest?.url;

  const isExecuteViewRoute = currentStep === 'execute' && !isCreateMode;

  const isSelectApisStep = currentStep === 'select-apis';
  const selectApisCTA = isSelectApisStep ? getRequestsCTAConfig() : null;

  // ✅ In CreateTestSuit, just above the return JSX
  const hasPrereqAuthCandidates = useMemo(() => {
    // In prerequisites step we only care about POST login-like APIs
    return requests.some((r) => {
      if (!r.url) return false;
      const url = r.url.toLowerCase();
      const isLoginLike =
        url.includes('/login') ||
        url.includes('/sign-in') ||
        url.includes('/signin');

      const isPost = (r.method || '').toUpperCase() === 'POST';
      return isLoginLike && isPost;
    });
  }, [requests]);

  return (
    <div className='bg-gray-50'>
      <BreadCum
        title={
          isCreateMode
            ? 'Create Test Suite'
            : `Edit Test Suite - ${testSuiteName}`
        }
        subtitle={
          !isCreateMode
            ? `Test Suite ID: ${id}`
            : 'Manage your API automation workflows'
        }
        buttonTitle='Create Test suite'
        showCreateButton={false}
        showQuickGuide={true}
        quickGuideTitle='🚀 Guided Onboarding: Create Test Suites'
        onClickQuickGuide={() => console.log('Quick guide')}
        icon={Layers}
        quickGuideContent={
          <div>
            <div>
              <div className='px-2 py-2 space-y-2'>
                <div className='space-y-4'>
                  <h3 className='font-semibold text-gray-900 text-lg'>
                    Workflow Steps
                  </h3>
                  <div className='space-y-4'>
                    <div className='border border-gray-200 rounded-lg p-4'>
                      <div className='flex items-start gap-3'>
                        <div className='w-6 h-6 rounded-full bg-[#136fb0] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0'>
                          1
                        </div>
                        <div className='flex-1'>
                          <h4 className='font-semibold text-gray-900 mb-2'>
                            Provide Basic Information
                          </h4>
                          <p className='text-sm text-gray-600 mb-2'>
                            Start by giving your test suite a meaningful name
                            and selecting the target environment.
                          </p>
                          <ul className='text-sm text-gray-600 space-y-1 ml-4'>
                            <li className='flex items-start gap-2'>
                              <ChevronRight className='w-4 h-4 mt-0.5 flex-shrink-0' />
                              <span>Enter a descriptive test suite name</span>
                            </li>
                            <li className='flex items-start gap-2'>
                              <ChevronRight className='w-4 h-4 mt-0.5 flex-shrink-0' />
                              <span>Add an optional description</span>
                            </li>
                            <li className='flex items-start gap-2'>
                              <ChevronRight className='w-4 h-4 mt-0.5 flex-shrink-0' />
                              <span>
                                Select the environment (Development, Staging,
                                Production, etc.)
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className='border border-gray-200 rounded-lg p-4'>
                      <div className='flex items-start gap-3'>
                        <div className='w-6 h-6 rounded-full bg-[#136fb0] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0'>
                          2
                        </div>
                        <div className='flex-1'>
                          <h4 className='font-semibold text-gray-900 mb-2'>
                            Configure Prerequisites
                          </h4>
                          <p className='text-sm text-gray-600 mb-2'>
                            If your APIs require authentication, add a
                            pre-request API that will fetch the authentication
                            token.
                          </p>
                          <ul className='text-sm text-gray-600 space-y-1 ml-4'>
                            <li className='flex items-start gap-2'>
                              <ChevronRight className='w-4 h-4 mt-0.5 flex-shrink-0' />
                              <span>Add the login/auth endpoint details</span>
                            </li>
                            <li className='flex items-start gap-2'>
                              <ChevronRight className='w-4 h-4 mt-0.5 flex-shrink-0' />
                              <span>
                                Specify where the token appears in the response
                              </span>
                            </li>
                            <li className='flex items-start gap-2'>
                              <ChevronRight className='w-4 h-4 mt-0.5 flex-shrink-0' />
                              <span>
                                Skip this step if no authentication is needed
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className='border border-gray-200 rounded-lg p-4'>
                      <div className='flex items-start gap-3'>
                        <div className='w-6 h-6 rounded-full bg-[#136fb0] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0'>
                          3
                        </div>
                        <div className='flex-1'>
                          <h4 className='font-semibold text-gray-900 mb-2'>
                            Import & Select APIs
                          </h4>
                          <p className='text-sm text-gray-600 mb-2'>
                            Import API requests from your collections and select
                            which ones to test.
                          </p>
                          <ul className='text-sm text-gray-600 space-y-1 ml-4'>
                            {/* <li className="flex items-start gap-2">
                              <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>Import from Postman, Insomnia, or add manually</span>
                            </li> */}
                            <li className='flex items-start gap-2'>
                              <ChevronRight className='w-4 h-4 mt-0.5 flex-shrink-0' />
                              <span>
                                Check which APIs require authentication
                              </span>
                            </li>
                            <li className='flex items-start gap-2'>
                              <ChevronRight className='w-4 h-4 mt-0.5 flex-shrink-0' />
                              <span>Select the APIs you want to test</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className='border border-gray-200 rounded-lg p-4'>
                      <div className='flex items-start gap-3'>
                        <div className='w-6 h-6 rounded-full bg-[#136fb0] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0'>
                          4
                        </div>
                        <div className='flex-1'>
                          <h4 className='font-semibold text-gray-900 mb-2'>
                            Generate Test Cases
                          </h4>
                          <p className='text-sm text-gray-600 mb-2'>
                            The system will automatically generate comprehensive
                            test cases for each selected API.
                          </p>
                          <ul className='text-sm text-gray-600 space-y-1 ml-4'>
                            <li className='flex items-start gap-2'>
                              <ChevronRight className='w-4 h-4 mt-0.5 flex-shrink-0' />
                              <span>Status code validation</span>
                            </li>
                            <li className='flex items-start gap-2'>
                              <ChevronRight className='w-4 h-4 mt-0.5 flex-shrink-0' />
                              <span>Response structure verification</span>
                            </li>
                            <li className='flex items-start gap-2'>
                              <ChevronRight className='w-4 h-4 mt-0.5 flex-shrink-0' />
                              <span>Error handling scenarios</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className='border border-gray-200 rounded-lg p-4'>
                      <div className='flex items-start gap-3'>
                        <div className='w-6 h-6 rounded-full bg-[#136fb0] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0'>
                          5
                        </div>
                        <div className='flex-1'>
                          <h4 className='font-semibold text-gray-900 mb-2'>
                            Select Test Cases
                          </h4>
                          <p className='text-sm text-gray-600 mb-2'>
                            Review and select which test cases to execute.
                          </p>
                          <ul className='text-sm text-gray-600 space-y-1 ml-4'>
                            <li className='flex items-start gap-2'>
                              <ChevronRight className='w-4 h-4 mt-0.5 flex-shrink-0' />
                              <span>Review generated test cases</span>
                            </li>
                            <li className='flex items-start gap-2'>
                              <ChevronRight className='w-4 h-4 mt-0.5 flex-shrink-0' />
                              <span>Select all or choose specific tests</span>
                            </li>
                            <li className='flex items-start gap-2'>
                              <ChevronRight className='w-4 h-4 mt-0.5 flex-shrink-0' />
                              <span>Customize test parameters if needed</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className='border border-gray-200 rounded-lg p-4'>
                      <div className='flex items-start gap-3'>
                        <div className='w-6 h-6 rounded-full bg-[#136fb0] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0'>
                          6
                        </div>
                        <div className='flex-1'>
                          <h4 className='font-semibold text-gray-900 mb-2'>
                            Execute Tests
                          </h4>
                          <p className='text-sm text-gray-600 mb-2'>
                            Run the selected test cases and view detailed
                            results.
                          </p>
                          <ul className='text-sm text-gray-600 space-y-1 ml-4'>
                            <li className='flex items-start gap-2'>
                              <ChevronRight className='w-4 h-4 mt-0.5 flex-shrink-0' />
                              <span>
                                Tests will run with authentication if configured
                              </span>
                            </li>
                            <li className='flex items-start gap-2'>
                              <ChevronRight className='w-4 h-4 mt-0.5 flex-shrink-0' />
                              <span>View pass/fail status for each test</span>
                            </li>
                            <li className='flex items-start gap-2'>
                              <ChevronRight className='w-4 h-4 mt-0.5 flex-shrink-0' />
                              <span>Export results for reporting</span>
                            </li>
                            <li className='flex items-start gap-2'>
                              <ChevronRight className='w-4 h-4 mt-0.5 flex-shrink-0' />
                              <span>
                                {' '}
                                View execution results in{' '}
                                <Link
                                  style={{ color: '#136fb0' }}
                                  to='/executions'
                                >
                                  “Executions”
                                </Link>
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
                  <h3 className='font-semibold text-yellow-900 mb-2'>
                    Pro Tips
                  </h3>
                  <ul className='text-sm text-yellow-800 space-y-1'>
                    <li className='flex items-start gap-2'>
                      <ChevronRight className='w-4 h-4 mt-0.5 flex-shrink-0' />
                      <span>Save your test suite to reuse it later</span>
                    </li>
                    <li className='flex items-start gap-2'>
                      <ChevronRight className='w-4 h-4 mt-0.5 flex-shrink-0' />
                      <span>
                        You can edit generated test cases before execution
                      </span>
                    </li>
                    <li className='flex items-start gap-2'>
                      <ChevronRight className='w-4 h-4 mt-0.5 flex-shrink-0' />
                      <span>
                        Authentication tokens are automatically injected into
                        requests
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        }
        iconBgClass='bg-green-100'
        iconColor='#0f766e'
        iconSize={36}
      />

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-8 border border-gray-200 bg-background rounded-lg mt-3'>
        {/* STEP INDICATOR */}
        <WorkflowStepper
          currentStep={currentStep}
          completedSteps={completedSteps}
        />

        <div className='mt-2 space-y-4'>
          {/* STEP 1: BASIC INFO */}
          {currentStep === 'basic-info' && (
            <Card>
              <CardHeader>
                <CardTitle className='text-lg font-medium'>
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium mb-1'>
                    Test Suite Name <span className='text-destructive'>*</span>
                  </label>
                  <Input
                    value={testSuiteName}
                    onChange={(e) => setTestSuiteName(e.target.value)}
                    placeholder='Enter test suite name'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium mb-1'>
                    Description (optional)
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder='Enter test suite description'
                    rows={3}
                  />
                </div>

                <div className='space-y-1'>
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
                              {env.name}{' '}
                              <span className='text-xs text-muted-foreground break-all'>
                                - {env.baseUrl}
                              </span>
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className='text-xs'>
                    Select the target environment for these tests
                  </p>
                </div>

                {testSuite?.name && testSuite?.environment && (
                  <div className='bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 mt-4'>
                    <div className='w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5'>
                      <svg
                        className='w-3 h-3'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                    <div>
                      <p className='text-sm font-semibold text-green-900'>
                        Ready to proceed
                      </p>
                      <p className='text-xs text-green-800 mt-0.5'>
                        All required information has been filled in
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* STEP 2: PREREQUISITES (AUTH API) */}
          {currentStep === 'prerequisites' && (
            <>
              {preRequestInfo && (
                <div className='bg-gray-50 p-3 rounded-lg border border-dashed flex flex-col items-center justify-center text-center'>
                  <div className='w-full text-left'>
                    <p className='text-sm text-muted-foreground text-center'>
                      This authentication API will run before your test suite
                      and its token can be used in all imported requests.
                    </p>
                  </div>
                </div>
              )}

              {!hasPrereqAuthCandidates ? (
                <div className='bg-gray-50 p-3 rounded-lg border border-dashed flex flex-col items-center justify-center text-center'>
                  <div className='w-16 h-16 mb-6 rounded-full bg-muted flex items-center justify-center'>
                    <KeyRound className='w-8 h-8 text-muted-foreground' />
                  </div>
                  <p className='text-muted-foreground mb-2'>
                    If your APIs require authentication, add a pre-request API
                    to fetch the auth token.
                  </p>
                  <p className='text-muted-foreground mb-2'>
                    This token will be automatically used when executing your
                    test cases.
                  </p>
                  <p className='text-muted-foreground mb-6'>
                    You can skip this step if authentication isn’t needed.
                  </p>
                  <Button onClick={() => setIsImportModalOpen(true)}>
                    <Upload className='w-4 h-4 mr-2' />
                    Choose Authentication Request
                  </Button>
                </div>
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
                    filterMethod='POST'
                    showAuthCapture={true}
                  />
                </>
              )}

              <RequestTestDialog
                isOpen={isTestDialogOpen}
                onClose={() => setIsTestDialogOpen(false)}
                onSaveExtractVariables={handleSaveExtractVariables}
              />
            </>
          )}

          {/* STEP 3: SELECT APIS */}
          {currentStep === 'select-apis' && (
            <div>
              {mainRequestsCount === 0 ? (
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
                    showAuthCapture={false}
                  />

                  <div className='px-6 py-4 bg-gray-50 mt-4 border-gray-200 flex justify-between items-center'>
                    <div className='text-sm text-gray-600 space-y-1'>
                      <div>Total requests: {mainRequestsCount}</div>
                      {extractVariables.length > 0 && (
                        <div className='text-green-600'>
                          Extracted Auth: {extractVariables.length}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 4: SELECT TESTS */}
          {currentStep === 'select-tests' && (
            <div>
              {isLoading ? (
                <div className='space-y-4'>
                  {/* title skeleton */}
                  <div className='h-4 w-1/3 bg-gray-200 rounded animate-pulse' />
                  {/* row 1 */}
                  <div className='flex items-center gap-4 p-4 border rounded-lg bg-gray-100 animate-pulse'>
                    <div className='w-10 h-10 rounded bg-gray-300'></div>
                    <div className='flex-1 space-y-2'>
                      <div className='h-3 w-1/2 bg-gray-300 rounded'></div>
                      <div className='h-3 w-1/3 bg-gray-300 rounded'></div>
                    </div>
                  </div>
                  {/* row 2 */}
                  <div className='flex items-center gap-4 p-4 border rounded-lg bg-gray-100 animate-pulse'>
                    <div className='w-10 h-10 rounded bg-gray-300'></div>
                    <div className='flex-1 space-y-2'>
                      <div className='h-3 w-1/2 bg-gray-300 rounded'></div>
                      <div className='h-3 w-1/3 bg-gray-300 rounded'></div>
                    </div>
                  </div>
                </div>
              ) : requests.length === 0 ? (
                <div className='bg-gray-50 p-6 rounded-lg border border-dashed flex flex-col items-center justify-center text-center'>
                  <div className='w-16 h-16 mb-6 rounded-full bg-muted flex items-center justify-center'>
                    <Download className='w-8 h-8 text-muted-foreground' />
                  </div>
                  <p className='text-muted-foreground mb-2 max-w-md'>
                    No requests found in this test suite.
                  </p>
                  <p className='text-xs text-gray-500 max-w-md'>
                    Go back to{' '}
                    <span className='font-semibold'>“Select APIs”</span> and
                    import APIs before selecting test cases.
                  </p>
                </div>
              ) : (
                <>
                  <ManageRequests
                    requests={requests}
                    testSuiteId={id || ''}
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
                      <div>Total requests: {mainRequestsCount}</div>
                      <div className='font-medium'>
                        Selected Test Cases: {totalTestCases}
                      </div>
                      {extractVariables.length > 0 && (
                        <div className='text-green-600'>
                          Extracted Auth: {extractVariables.length}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 5: EXECUTE / FINAL SUMMARY */}
          {currentStep === 'execute' && (
            <div className='bg-white border border-gray-200 rounded-lg p-8 text-center'>
              <Play className='w-16 h-16 text-[#136fb0] mx-auto mb-4' />
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                Ready to Run Your Test Suite?
              </h3>
              <p className='text-gray-600 mb-2'>
                You've configured {totalTestCases} test cases across{' '}
                {requests.filter((r) => r.id !== preRequestId).length} requests.
              </p>
              <p className='text-gray-600 mb-2'>
                {preRequestId
                  ? 'Authentication is set via your pre-request API'
                  : 'No authentication was added for pre-request API'}
              </p>

              {activeEnvironment && (
                <p className='text-gray-600 mb-2'>
                  Environment is set to {selectedEnvName}
                </p>
              )}

              {preRequestId && (
                <p className='text-gray-600 font-bold mb-2'>
                  Click Run Tests to execute and verify the selected test cases.
                </p>
              )}

              <div className='flex items-center justify-center gap-4'>
                <Button
                  className='inline-flex items-center gap-2'
                  disabled={
                    isSaving ||
                    isExecuting ||
                    requests.length === 0 ||
                    totalTestCases === 0
                  }
                  onClick={() => handleExecuteSuite(id || '')}
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className='w-5 h-5 animate-spin' />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className='w-5 h-5' />
                      Run Tests
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM NAVIGATION */}
        <div className='mt-5 flex items-center justify-between'>
          <button
            onClick={handleBackStep}
            className='inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <ChevronLeft className='w-4 h-4' />
            Back
          </button>

          <div className='flex flex-col items-end gap-1'>
            {!isExecuteViewRoute && (
              <Button
                onClick={handleNextStep}
                disabled={
                  !canProceed() ||
                  (currentStep === 'select-apis' && isSaving) ||
                  isPreparingTestCases
                }
                className={[
                  'inline-flex items-center gap-2 px-6 py-2 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed',
                  isSelectApisStep
                    ? selectApisCTA?.color ?? 'bg-[#136fb0] hover:bg-[#136fb0]'
                    : 'bg-[#136fb0] hover:bg-[#136fb0]',
                ].join(' ')}
              >
                {getNextButtonText()}

                {showNextLoader ? (
                  <Loader2 className='w-4 h-4 animate-spin' />
                ) : (
                  <ChevronRight className='w-4 h-4' />
                )}
              </Button>
            )}

            {isSelectApisStep && selectApisCTA?.description && (
              <p className='text-xs text-gray-500 text-right'>
                {selectApisCTA.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* IMPORT MODAL (global) */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportRequests}
        importedRequestIds={importedRequestIds}
        // @ts-ignore
        requests={importableRequests}
        authBaseUrl={authBaseUrl}
      />
    </div>
  );
};

export default CreateTestSuit;
