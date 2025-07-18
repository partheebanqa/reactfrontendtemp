'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Download } from 'lucide-react';
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

const EditTestSuiteContent: React.FC = () => {
  const params = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  // Fix the parameter access by properly handling the params object
  const id = (params as any).id;
  const isCreateMode = location.includes('/create');

  console.log('Current location:', location);
  console.log('Is create mode:', isCreateMode);
  console.log('Params:', params);
  console.log('ID:', id);

  const [testSuiteName, setTestSuiteName] = useState('');
  const [description, setDescription] = useState('');
  const [requests, setRequests] = useState<Request[]>([]);
  const [originalRequestIds, setOriginalRequestIds] = useState<string[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const {
    data: testSuite,
    isLoading: isLoadingTestSuite,
    error,
    isError,
  } = useQuery({
    queryKey: ['testSuite', id],
    queryFn: () => getTestSuites(id!),
    enabled: !!id && !isCreateMode,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTestSuitePayload) =>
      createTestSuite({ ...data, workspaceId: currentWorkspace!.id }),

    onSuccess: (data) => {
      toast({
        title: 'Test suite created',
        description: 'Your test suite has been created successfully.',
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
      addRequestIds?: string[];
      removeRequestIds?: string[];
    }) =>
      updateTestSuite(data.id, {
        name: data.name,
        description: data.description,
        addRequestIds: data.addRequestIds,
        removeRequestIds: data.removeRequestIds,
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

  useEffect(() => {
    if (testSuite && !isCreateMode) {
      setTestSuiteName(testSuite.name || '');
      setDescription(testSuite.description || '');

      // Transform and set existing requests
      if (Array.isArray(testSuite.requests) && testSuite.requests.length > 0) {
        const transformedRequests: Request[] = testSuite.requests.map(
          (req: any) => ({
            id: req.id,
            method: req.method,
            name: req.name,
            endpoint: req.url,
            description: req.description || `${req.method} ${req.url}`,
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
    // Transform ExtendedRequest to Request format
    const transformedRequests: Request[] = selectedRequests.map((extReq) => ({
      id: extReq.id,
      method: extReq.method,
      name: extReq.name,
      endpoint: extReq.endpoint || extReq.url || '', // Handle undefined endpoint
      description:
        extReq.description ||
        `${extReq.method} ${extReq.endpoint || extReq.url}`,
      testCases: extReq.testCases || {
        functional: 0,
        total: 0,
      },
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
        requestIds: requests.map((request) => request.id), // Pass request IDs
      });
    } else {
      const { addRequestIds, removeRequestIds } = calculateRequestChanges();

      updateMutation.mutate({
        id: id!,
        name: testSuiteName,
        description: description,
        addRequestIds: addRequestIds.length > 0 ? addRequestIds : undefined,
        removeRequestIds:
          removeRequestIds.length > 0 ? removeRequestIds : undefined,
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

  return (
    <div className='min-h-screen bg-background'>
      <div className='bg-card border-b px-6 py-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleBack}
              className='text-muted-foreground hover:text-foreground'
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Back
            </Button>
            <div>
              <h1 className='text-2xl font-semibold'>
                {isCreateMode ? 'Create Test Suite' : 'Edit Test Suite'}
              </h1>
              <div className='flex items-center space-x-4 mt-1'>
                {!isCreateMode && (
                  <>
                    <span className='text-sm text-muted-foreground'>
                      Test Suite ID: {id}
                    </span>
                    <Badge variant='secondary'>CI/CD Integration</Badge>
                  </>
                )}
                {isCreateMode && (
                  <span className='text-sm text-muted-foreground'>
                    New Test Suite
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <Button variant='outline' onClick={handleBack}>
              Cancel
            </Button>
            <Button onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving
                ? isCreateMode
                  ? 'Creating...'
                  : 'Saving...'
                : isCreateMode
                ? 'Create Suite'
                : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      <div className='p-6 space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
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
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Enter test suite description'
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {requests.length === 0 ? (
          <Card className='border-2 border-dashed border-border'>
            <CardContent className='flex flex-col items-center justify-center py-16 px-6'>
              <div className='w-16 h-16 mb-6 rounded-full bg-muted flex items-center justify-center'>
                <Download className='w-8 h-8 text-muted-foreground' />
              </div>
              <h3 className='text-xl font-semibold mb-2'>
                No requests added yet
              </h3>
              <p className='text-muted-foreground text-center mb-6 max-w-md'>
                Import API requests from your collections to start configuring
                test cases for this test suite.
              </p>
              <Button
                variant='outline'
                size='lg'
                onClick={() => setIsImportModalOpen(true)}
              >
                <Download className='w-4 h-4 mr-2' />
                Import Requests
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ManageRequests
            requests={requests}
            testSuiteId={id || ''}
            onImport={() => setIsImportModalOpen(true)}
            onDeleteRequest={handleDeleteRequest}
            onUpdateTestCases={handleUpdateTestCases}
          />
        )}

        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportRequests}
          importedRequestIds={importedRequestIds}
        />
      </div>
    </div>
  );
};

export default EditTestSuiteContent;
