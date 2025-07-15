import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/useToast';
import SearchAndFilters from '@/components/Scheduler/SearchAndFilters';
import SchedulesTable from '@/components/Scheduler/SchedulesTable';
import CreateScheduleForm from '@/components/Scheduler/CreateScheduleForm';
import EditScheduleForm from '@/components/Scheduler/EditScheduleForm';
import { useSchedules, useTestSuites, useRequestChains } from '@/hooks/use-api';

export default function Scheduler() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [executionModeFilter, setExecutionModeFilter] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;
  const { toast } = useToast();

  const {
    data: schedules = [],
    refetch: refetchSchedules,
    isLoading: schedulesLoading,
  } = useSchedules();
  const { data: testSuites = [] } = useTestSuites();
  const { data: requestChains = [] } = useRequestChains();

  const handleCreateSchedule = (data: any) => {
    console.log('Creating schedule:', data);
    setCreateDialogOpen(false);
    toast({
      title: 'Success',
      description: 'Schedule created successfully',
    });
    refetchSchedules();
  };

  const handleEditSchedule = (data: any) => {
    console.log('Updating schedule:', data);
    setEditDialogOpen(false);
    setEditingSchedule(null);
    toast({
      title: 'Success',
      description: 'Schedule updated successfully',
    });
    refetchSchedules();
  };

  const handleEdit = (schedule: any) => {
    setEditingSchedule(schedule);
    setEditDialogOpen(true);
  };

  const handleRun = (schedule: any) => {
    toast({
      title: 'Schedule Running',
      description: `Running ${schedule.name}...`,
    });
  };

  const handleClone = (schedule: any) => {
    toast({
      title: 'Schedule Cloned',
      description: `${schedule.name} has been cloned`,
    });
    refetchSchedules();
  };

  const handleDelete = (schedule: any) => {
    toast({
      title: 'Schedule Deleted',
      description: `${schedule.name} has been deleted`,
    });
    refetchSchedules();
  };

  // Filter schedules based on search and filters
  const filteredSchedules = Array.isArray(schedules)
    ? schedules.filter((schedule: any) => {
        const matchesSearch =
          schedule.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          schedule.testSuite?.name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase());

        const matchesType =
          typeFilter === 'all' ||
          (typeFilter === 'test-suite' && schedule.testSuite) ||
          (typeFilter === 'request-chain' && !schedule.testSuite);

        const matchesExecutionMode =
          executionModeFilter === 'all' ||
          (executionModeFilter === 'one-time' &&
            schedule.scheduleType === 'one-time') ||
          (executionModeFilter === 'recurring' &&
            schedule.scheduleType === 'recurring');

        return matchesSearch && matchesType && matchesExecutionMode;
      })
    : [];

  // Pagination logic
  const totalItems = filteredSchedules.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSchedules = filteredSchedules.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, executionModeFilter]);

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-white border-b border-gray-200 px-6 py-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-semibold text-gray-900'>Scheduler</h1>
            <p className='text-sm text-gray-500 mt-1'>
              Configure automated test execution schedules
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className='bg-gray-900 hover:bg-gray-800 text-white'>
                <Plus className='mr-2 h-4 w-4' />
                New Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
              <DialogHeader>
                <DialogTitle className='text-xl font-semibold'>
                  Create New Schedule
                </DialogTitle>
              </DialogHeader>
              <CreateScheduleForm
                testSuites={testSuites}
                requestChains={requestChains}
                onSubmit={handleCreateSchedule}
                onCancel={() => setCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <div className='p-6'>
        <div className='bg-white rounded-lg border border-gray-200'>
          <div className='p-4 border-b border-gray-200'>
            <SearchAndFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              executionModeFilter={executionModeFilter}
              setExecutionModeFilter={setExecutionModeFilter}
              refetchSchedules={refetchSchedules}
              schedulesLoading={schedulesLoading}
            />
          </div>

          <SchedulesTable
            schedules={paginatedSchedules}
            totalItems={totalItems}
            totalPages={totalPages}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            onEdit={handleEdit}
            onRun={handleRun}
            onClone={handleClone}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-xl font-semibold'>
              Edit Schedule
            </DialogTitle>
          </DialogHeader>
          {editingSchedule && (
            <EditScheduleForm
              schedule={editingSchedule}
              testSuites={testSuites}
              requestChains={requestChains}
              onSubmit={handleEditSchedule}
              onCancel={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
