'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import {
  Plus,
  Search,
  Filter,
  Play,
  RefreshCw,
  Layers,
  Loader2,
} from 'lucide-react';
import TestSuiteCard from './TestSuiteCard';
import {
  getAllTestSuites,
  deleteTestSuite,
  executeTestSuite,
  duplicateTestSuite,
} from '@/services/testSuites.service';
import { TestSuite } from '@/shared/types/TestSuite.model';
import { useWorkspace } from '@/hooks/useWorkspace';
import HelpLink from '../HelpModal/HelpLink';
import { TestSuitePagination } from './TestSuitePagination';
import BreadCum from '../BreadCum/Breadcum';
import { useDataManagement } from '@/hooks/useDataManagement';
import { Loader } from '../Loader';

const TestSuites: React.FC = () => {
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [testSuitListData, setTestSuitListData] = useState<TestSuite[] | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all');
  const [tagsFilter, setTagsFilter] = useState<string>('all');
  const { environments, activeEnvironment } = useDataManagement();

  const [sortBy, setSortBy] = useState<
    'name' | 'created' | 'executed' | 'success'
  >('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  // NEW: pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const {
    data: apiData,
    isLoading,
    error,
    isFetching, // optional: for button spinner
    refetch,
  } = useQuery({
    queryKey: ['/api/test-suites', currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
    queryFn: () => getAllTestSuites(currentWorkspace!.id),
  });

  useEffect(() => {
    if (error) {
      console.error('Error fetching test suites:', error);
    }
    if (apiData) {
      setTestSuitListData(apiData);
    }
  }, [apiData, error]);

  const deleteSuiteMutation = useMutation({
    mutationFn: deleteTestSuite,
    onSuccess: () => {
      toast({
        title: 'Deleted',
        description: 'Test suite deleted successfully.',
      });

      queryClient.invalidateQueries({
        queryKey: ['/api/test-suites', currentWorkspace?.id],
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Delete failed',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    },
  });

  const cloneSuiteMutation = useMutation({
    mutationFn: duplicateTestSuite,
    onSuccess: () => {
      toast({
        title: 'Cloned',
        description: 'Test suite Cloned successfully.',
      });

      queryClient.invalidateQueries({
        queryKey: ['/api/test-suites', currentWorkspace?.id],
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Clone failed',
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
    },
    onError: (error: any) => {
      toast({
        title: 'Execute failed',
        description: 'Execution failed. Please try again later.',
        variant: 'destructive',
      });
    },
  });

  const handleDeleteSuite = (id: string) => {
    deleteSuiteMutation.mutate(id);
  };
  const handleClonseSuite = (id: string) => {
    cloneSuiteMutation.mutate(id);
  };

  const handleExecuteSuite = (id: string) => {
    executeSuiteMutation.mutate({ testSuiteId: id });
  };

  const handleEditSuite = (suite: TestSuite) => {
    setLocation(`/test-suites/${suite.id}/?step=select-tests`);
  };

  const handleCreateSuite = () => {
    setLocation('/test-suites/create');
  };

  const envOptions = useMemo(() => {
    const set = new Set<string>();
    environments?.forEach((e) => e?.name && set.add(e.name));
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [environments]);

  const tagsOptions = useMemo(() => {
    const set = new Set<string>();
    testSuitListData?.forEach((suite) => {
      suite.tags?.forEach((tag) => tag && set.add(tag));
    });
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [testSuitListData]);

  const filteredSuites = (testSuitListData ?? []).filter((suite) => {
    const term = searchQuery.toLowerCase();
    const matchesSearch =
      suite.name.toLowerCase().includes(term) ||
      suite.description.toLowerCase().includes(term) ||
      suite.id.toLowerCase().includes(term) ||
      suite.environment?.name?.toLowerCase().includes(term) ||
      suite.createdAt.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === 'All statuses' || suite.status === statusFilter;

    // Tags filter
    const matchesTags =
      tagsFilter === 'all' || suite.tags?.includes(tagsFilter);

    // Environment filter
    const envName = (suite.environment?.name ?? 'No Environment').toLowerCase();
    const matchesEnvironment =
      environmentFilter === 'all' ||
      envName === environmentFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesEnvironment && matchesTags;
  });

  const filteredAndSortedSuites = useMemo(() => {
    const arr = [...filteredSuites];

    arr.sort((a, b) => {
      let cmp = 0;

      switch (sortBy) {
        case 'name': {
          cmp = a.name.localeCompare(b.name);
          break;
        }
        case 'created': {
          // newest first when sortOrder === 'desc'
          const aTime = new Date(a.createdAt).getTime();
          const bTime = new Date(b.createdAt).getTime();
          cmp = aTime - bTime;
          break;
        }

        default:
          cmp = 0;
      }

      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return arr;
  }, [filteredSuites, sortBy, sortOrder]);

  // NEW: compute page slice
  const totalItems = filteredAndSortedSuites.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedSuites = filteredAndSortedSuites.slice(startIndex, endIndex);

  return (
    <div className='space-y-3'>
      <BreadCum
        title='Test Suites'
        subtitle='Test every angle: functional correctness, performance, security flaws, and edge cases in one unified workflow'
        buttonTitle='Create Test suite'
        onClickQuickGuide={() => console.log('Exporting...')}
        onClickCreateNew={handleCreateSuite}
        icon={Layers}
        iconBgClass='bg-green-100'
        iconColor='#0f766e'
        iconSize={36}
        quickGuideTitle='🚀 Guided Onboarding Flow: Working with Test Suites'
        quickGuideContent={
          <div>
            <p className='mb-4 text-base font-medium mt-4'>
              Here’s how to get started:
            </p>
            <ul className='list-none pl-5 space-y-4 text-sm leading-relaxed'>
              <li>
                🟩 <b className='text-[#000000]'>Step 1: Create a Test Suite</b>{' '}
                – Location: “Create Suite” button.
                <span className='block mt-1'>
                  Give your test suite a name and description. Choose the target
                  environment where the suite should run. This sets the context
                  for all included requests.
                </span>
              </li>

              <li>
                🟨{' '}
                <b className='text-[#000000]'>
                  Step 2: Add Requests to the Suite
                </b>{' '}
                – Location: Request selection panel.
                <span className='block mt-1'>
                  Pick requests from your imported APIs to include in the suite.
                  These will be used to generate test cases automatically.
                </span>
              </li>

              <li>
                🟦 <b className='text-[#000000]'>Step 3: Save the Suite</b> –
                Location: Save button.
                <span className='block mt-1'>
                  Once you’ve added requests, save the suite to initiate test
                  case generation. Optraflow will handle the rest.
                </span>
              </li>

              <li>
                🟪{' '}
                <b className='text-[#000000]'>
                  Step 4: Monitor Test Case Generation
                </b>{' '}
                – Location: Test Suite List → Status column.
                <span className='block mt-1'>
                  Check the status column to see if test cases are ‘Generated’
                  or ‘In Progress’. Use the refresh icon to update the status in
                  real time.
                </span>
              </li>

              <li>
                🟧 <b className='text-[#000000]'>Step 5: Edit the Test Suite</b>{' '}
                – Location: Edit icon in suite list.
                <span className='block mt-1'>
                  Click ‘Edit’ to modify the suite. For each request, you’ll see
                  a <i>Select Test Case</i> icon—this lets you choose which test
                  cases to execute.
                </span>
              </li>

              <li>
                🟥{' '}
                <b className='text-[#000000]'>
                  Step 5.1: Add a Pre-Request API
                </b>{' '}
                – Location: “Capture Auth” icon in the suite editor.
                <span className='block mt-1'>
                  Add a pre-request API to fetch authorization tokens before
                  executing your test cases:
                </span>
                <ul className='list-disc pl-6 mt-2 space-y-1'>
                  <li>Click the Capture Auth icon</li>
                  <li>Execute the API using the Send button</li>
                  <li>
                    In the response section, hover over the response and click
                    Extract
                  </li>
                  <li>Select the variable to extract (e.g., token)</li>
                  <li>Click Save Variable to store it</li>
                </ul>
                <i className='block mt-2 text-gray-600'>
                  Note: Test suite execution will start with the pre-request API
                  execution, capture the token and use it for all test cases.
                </i>
              </li>

              <li>
                🟫 <b className='text-[#000000]'>Step 6: Assign Test Cases</b> –
                Location: Select Test Case icon.
                <span className='block mt-1'>
                  Choose the test cases you want to run for each request. Repeat
                  this for all included requests, then save the suite.
                </span>
              </li>

              <li>
                🟨 <b className='text-[#000000]'>Step 7: Execute the Suite</b> –
                Location: Run button (in edit view or list view).
                <span className='block mt-1'>
                  You can execute the test suite from either the edit view or
                  directly from the suite list. This will trigger all assigned
                  test cases.
                </span>
              </li>

              <li>
                ✅{' '}
                <b className='text-[#000000]'>
                  Final Step: View Execution Results
                </b>{' '}
                – Location: Executions page.
                <span className='block mt-1'>
                  Head to the Executions page to review detailed logs, status
                  codes, assertion results, and schema validations for each test
                  case.
                </span>
              </li>
            </ul>
          </div>
        }
      />

      <div className='flex flex-col justify-between lg:flex-row gap-4'>
        <div className='relative flex-1'>
          <Search className='w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
          <Input
            placeholder='Search test suites...'
            className='pl-10'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={environmentFilter} onValueChange={setEnvironmentFilter}>
          <SelectTrigger className='w-48'>
            <SelectValue placeholder='All environments' />
          </SelectTrigger>
          <SelectContent>
            {envOptions.map((name) => (
              <SelectItem key={name} value={name}>
                {name === 'all' ? (
                  'All environments'
                ) : (
                  <div className='flex items-center gap-2'>
                    <span>{name}</span>
                  </div>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>




        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className='w-48'>
            {/* <Filter className='w-4 h-4 mr-2' /> */}
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='All statuses'>All status</SelectItem>
            <SelectItem value='generated'>Generated</SelectItem>
            <SelectItem value='generating'>Generating</SelectItem>
          </SelectContent>
        </Select>

        <Select value={tagsFilter} onValueChange={setTagsFilter}>
          <SelectTrigger className='w-48'>
            <SelectValue placeholder='All tags' />
          </SelectTrigger>
          <SelectContent>
            {tagsOptions.map((name) => (
              <SelectItem key={name} value={name}>
                {name === 'all' ? (
                  'All Tags'
                ) : (
                  <div className='flex items-center gap-2'>
                    <span>{name}</span>
                  </div>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={`${sortBy}-${sortOrder}`}
          onValueChange={(value) => {
            const [field, order] = value.split('-');
            setSortBy(field as typeof sortBy);
            setSortOrder(order as typeof sortOrder);
          }}
        >
          <SelectTrigger className='w-full sm:w-[180px]'>
            <SelectValue placeholder='Sort by' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='name-asc'>Name A-Z</SelectItem>
            <SelectItem value='name-desc'>Name Z-A</SelectItem>
            <SelectItem value='created-desc'>Newest First</SelectItem>
            <SelectItem value='created-asc'>Oldest First</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant='default'
          className='hover-scale'
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={`mr-2 ${isFetching ? 'animate-spin' : ''}`}
            size={16}
          />
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className=''>
        {isFetching ? (
          <>
            <Loader message='Loading Test Suites' />
          </>
        ) : paginatedSuites.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-500'>No test suites found</p>
          </div>
        ) : (
          <>
            <div className=''>
              {paginatedSuites.map((suite) => (
                <TestSuiteCard
                  key={suite.id}
                  suite={suite}
                  onEdit={handleEditSuite}
                  onDelete={handleDeleteSuite}
                  onExecute={handleExecuteSuite}
                  onClone={handleClonseSuite}
                  onRefresh={() => refetch()}
                  refreshing={isFetching}
                />
              ))}
            </div>

            {/* Pagination footer */}
            <TestSuitePagination
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default TestSuites;
