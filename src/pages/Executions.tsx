import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle,
  XCircle,
  Clock,
  Play,
  AlertCircle,
  ChartColumn,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { executionService } from '@/services/executionService.service';
import { ExecutionsHeader } from '@/components/Executions/ExecutionsHeader';
import { ExecutionsFilters } from '@/components/Executions/ExecutionsFilters';
import { ExecutionsTable } from '@/components/Executions/ExecutionsTable';
import { ExecutionsPagination } from '@/components/Executions/ExecutionsPagination';
import { ExecutionDetailsDialog } from '@/components/Executions/ExecutionDetailsDialog';
import { MappedExecution, SavedFilter } from '@/shared/types/execution';
import { useWorkspace } from '@/hooks/useWorkspace';
import BreadCum from '@/components/BreadCum/Breadcum';
import { Loader } from '@/components/Loader';

const Executions = () => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [environmentFilter, setEnvironmentFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [triggerFilter, setTriggerFilter] = useState('all');
  const [executionIdFilter, setExecutionIdFilter] = useState('');
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [durationRange, setDurationRange] = useState({ min: 0, max: 100000 });

  // UI states
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [selectedExecution, setSelectedExecution] =
    useState<MappedExecution | null>(null);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(
    null
  );

  // Saved filters (mock data for now)
  const [savedFilters] = useState<SavedFilter[]>([
    {
      id: '1',
      name: 'Failed Tests Only',
      filters: {
        searchQuery: '',
        statusFilter: 'failed',
        environmentFilter: 'all',
        typeFilter: 'all',
        triggerFilter: 'all',
        dateRange: { from: undefined, to: undefined },
        executionIdFilter: '',
        durationRange: { min: 0, max: 100000 },
      },
    },
  ]);

  // Mock schedules data
  const schedules = [
    {
      id: 'schedule-ece6e34e-1984-4220-9c5a-99305d591d33',
      environment: 'production',
    },
    {
      id: 'schedule-05083f96-f872-44a2-a22f-220476f29ff0',
      environment: 'staging',
    },
  ];

  // Fetch execution data

  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  // console.log("workspaceId", workspaceId);

  const {
    data: executionData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['executions', currentPage, itemsPerPage, workspaceId],
    queryFn: () =>
      executionService
        .getExecutionHistory({
          page: currentPage,
          limit: itemsPerPage,
          workspaceId: workspaceId!, // safe since we only enable when it's truthy
        })
        .then(executionService.mapData),
    enabled: !!workspaceId, // 👈 only run when workspaceId is available
  });

  // Filter executions based on current filters
  const filteredExecutions = useMemo(() => {
    if (!executionData?.executions) return [];

    const q = searchQuery.trim().toLowerCase();
    const idFilter = executionIdFilter.trim().toLowerCase();

    return executionData.executions.filter((execution) => {
      // Search filter
      if (
        q &&
        !(execution.testSuite?.name ?? '').toLowerCase().includes(q) &&
        !(execution.requestChain?.name ?? '').toLowerCase().includes(q) &&
        (execution.id ?? '').toLowerCase().indexOf(q) === -1
      ) {
        return false;
      }

      // Environment filter
      if (
        environmentFilter !== 'all' &&
        (execution.environment ?? '').toLowerCase() !==
        environmentFilter.toLowerCase()
      ) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'all') {
        if (typeFilter === 'test_suite' && !execution.testSuite) return false;
        if (typeFilter === 'request_chain' && !execution.requestChain)
          return false;
      }

      // Status filter
      if (statusFilter !== 'all' && execution.status !== statusFilter) {
        return false;
      }

      // Trigger filter
      if (triggerFilter !== 'all') {
        if (triggerFilter !== execution.source) return false;
      }

      // Execution ID filte
      if (idFilter && !(execution.id ?? '').toLowerCase().includes(idFilter)) {
        return false;
      }

      // Date range filter
      if (dateRange.from || dateRange.to) {
        const executionDate = new Date(execution.startTime);
        if (dateRange.from && executionDate < dateRange.from) return false;
        if (dateRange.to && executionDate > dateRange.to) return false;
      }

      // Duration range filter
      if (
        execution.duration < durationRange.min ||
        execution.duration > durationRange.max
      ) {
        return false;
      }

      return true;
    });
  }, [
    executionData?.executions,
    searchQuery,
    environmentFilter,
    typeFilter,
    statusFilter,
    triggerFilter,
    executionIdFilter,
    dateRange,
    durationRange,
  ]);

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return <CheckCircle size={12} />;
      case 'failed':
        return <XCircle size={12} />;
      case 'running':
        return <Play size={12} />;
      case 'pending':
        return <Clock size={12} />;
      default:
        return <AlertCircle size={12} />;
    }
  };

  const formatDuration = (duration: number) => {
    if (duration === 0) return 'N/A';
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: `${label} copied successfully`,
    });
  };

  const openExecutionDetails = (execution: MappedExecution) => {
    setSelectedExecution(execution);
  };

  const applyQuickFilter = (filterType: string) => {
    const now = new Date();
    setActiveQuickFilter(filterType);

    switch (filterType) {
      case 'last24hours':
        setDateRange({
          from: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          to: now,
        });
        break;
      case 'lastWeek':
        setDateRange({
          from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          to: now,
        });
        break;
      case 'failed':
        setStatusFilter('failed');
        break;
      case 'success':
        setStatusFilter('success');
        break;
      case 'clear':
        clearAllFilters();
        break;
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setEnvironmentFilter('all');
    setTypeFilter('all');
    setStatusFilter('all');
    setTriggerFilter('all');
    setExecutionIdFilter('');
    setDateRange({ from: undefined, to: undefined });
    setDurationRange({ min: 0, max: 100000 });
    setActiveQuickFilter(null);
  };

  const saveCurrentFilter = () => {
    toast({
      title: 'Filter saved',
      description: 'Current filter configuration has been saved',
    });
  };

  const applySavedFilter = (filter: SavedFilter) => {
    setSearchQuery(filter.filters.searchQuery);
    setStatusFilter(filter.filters.statusFilter);
    setEnvironmentFilter(filter.filters.environmentFilter);
    setTypeFilter(filter.filters.typeFilter);
    setTriggerFilter(filter.filters.triggerFilter);
    setDateRange(filter.filters.dateRange);
    setExecutionIdFilter(filter.filters.executionIdFilter);
    setDurationRange(filter.filters.durationRange);

    toast({
      title: 'Filter applied',
      description: `Applied saved filter: ${filter.name}`,
    });
  };

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-destructive mb-2'>
            Error Loading Executions
          </h2>
          <p className='text-muted-foreground'>Please try again later</p>
        </div>
      </div>
    );
  }

  const handleDeleteEnvironment = async () => {
    if (!currentWorkspace) return;
    try {
    } catch (error) {
      console.error('Error deleting environment:', error);
    }
  };

  return (
    <>
      {/* <ExecutionsHeader /> */}
      <BreadCum
        title='Executions'
        subtitle='Get execution results of test suite and request chain'
        showCreateButton={false}
        buttonTitle='Run Execution'
        onClickCreateNew={() => console.log('Create execution')}
        icon={ChartColumn}
        iconBgClass='bg-blue-100'
        iconColor='#136fb0'
        iconSize={40}
      />

      <ExecutionsFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        environmentFilter={environmentFilter}
        setEnvironmentFilter={setEnvironmentFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        showAdvancedSearch={showAdvancedSearch}
        setShowAdvancedSearch={setShowAdvancedSearch}
        savedFilters={savedFilters}
        saveCurrentFilter={saveCurrentFilter}
        applySavedFilter={applySavedFilter}
        applyQuickFilter={applyQuickFilter}
        activeQuickFilter={activeQuickFilter}
        dateRange={dateRange}
        setDateRange={setDateRange}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        triggerFilter={triggerFilter}
        setTriggerFilter={setTriggerFilter}
        executionIdFilter={executionIdFilter}
        setExecutionIdFilter={setExecutionIdFilter}
        durationRange={durationRange}
        setDurationRange={setDurationRange}
        clearAllFilters={clearAllFilters}
        handleDeleteEnvironment={handleDeleteEnvironment}
        onRefresh={refetch}
        refreshing={isFetching}
      />

      <div className='bg-card rounded-lg shadow-sm border border-border'>
        {isLoading ? (
          <>
            <Loader message='Loading Executions' />
          </>
        ) : (
          <>
            <ExecutionsTable
              executions={filteredExecutions}
              schedules={schedules}
              openExecutionDetails={openExecutionDetails}
              copyToClipboard={copyToClipboard}
              formatDuration={formatDuration}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
            />

            <ExecutionsPagination
              totalItems={executionData?.total || 0}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          </>
        )}
      </div>

      <ExecutionDetailsDialog
        open={!!selectedExecution}
        onClose={() => setSelectedExecution(null)}
        execution={selectedExecution}
      />
    </>
  );
};

export default Executions;
