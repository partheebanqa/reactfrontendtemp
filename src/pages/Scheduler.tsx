import { useState } from 'react';
import { useSchedules, useTestSuites, useRequestChains } from '@/hooks/use-api';
import { useWorkspace } from '@/hooks/useWorkspace';
import ScheduleCreate from '@/components/Scheduler/ScheduleCreate';
import ScheduleEdit from '@/components/Scheduler/ScheduleEdit';
import ScheduleList from '@/components/Scheduler/ScheduleList';

const Scheduler = () => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);

  const { currentWorkspace } = useWorkspace();

  const {
    data: schedules = [],
    refetch: refetchSchedules,
    isLoading: schedulesLoading,
  } = useSchedules(currentWorkspace?.id);
  const { data: testSuites = [] } = useTestSuites(currentWorkspace?.id);
  const { data: requestChains = [] } = useRequestChains();

  const handleEdit = (schedule: any) => {
    setEditingSchedule(schedule);
    setEditDialogOpen(true);
  };

  const handleScheduleCreated = () => {
    refetchSchedules();
  };

  const handleScheduleUpdated = () => {
    refetchSchedules();
  };

  return (
    <>
      {/* Header */}
      <header className='bg-white border-b border-slate-200 px-6 py-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-semibold text-slate-900'>Scheduler</h2>
            <p className='text-sm text-slate-500'>
              Configure automated test execution schedules
            </p>
          </div>
          <ScheduleCreate
            testSuites={testSuites}
            requestChains={requestChains}
            onScheduleCreated={handleScheduleCreated}
          />
        </div>
      </header>

      {/* Main Content */}
      <div className='p-6 space-y-6'>
        <ScheduleList
          schedules={schedules}
          schedulesLoading={schedulesLoading}
          onRefresh={refetchSchedules}
          onEdit={handleEdit}
        />
      </div>

      <ScheduleEdit
        editDialogOpen={editDialogOpen}
        setEditDialogOpen={setEditDialogOpen}
        editingSchedule={editingSchedule}
        setEditingSchedule={setEditingSchedule}
        testSuites={testSuites}
        requestChains={requestChains}
        onScheduleUpdated={handleScheduleUpdated}
      />
    </>
  );
};

export default Scheduler;
