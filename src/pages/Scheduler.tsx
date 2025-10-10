'use client';

import { useState } from 'react';
import { useTestSuites, useRequestChains } from '@/hooks/use-api';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useQuery } from '@tanstack/react-query';
import { getScheduleList } from '@/services/scheduler.service';
import ScheduleCreate from '@/components/Scheduler/ScheduleCreate';
import ScheduleEdit from '@/components/Scheduler/ScheduleEdit';
import ScheduleList from '@/components/Scheduler/ScheduleList';
import { CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const Scheduler = () => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [open, setOpen] = useState(false);

  const { currentWorkspace } = useWorkspace();

  // Use the service function directly with React Query
  const {
    data: schedulesResponse,
    refetch: refetchSchedules,
    isLoading: schedulesLoading,
  } = useQuery({
    queryKey: ['schedules', currentWorkspace?.id],
    queryFn: () => getScheduleList({ workspaceId: currentWorkspace!.id }),
    enabled: !!currentWorkspace?.id,
  });

  const { data: testSuites = [] } = useTestSuites(currentWorkspace?.id);
  const { data: requestChains = [] } = useRequestChains();

  // Extract schedules array from the API response
  const schedules = schedulesResponse?.schedules || [];

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
      <header className='border border-gray-200 bg-background rounded-lg px-4 py-4 animate-fade-in mb-2'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <CalendarClock
                className='bg-[#f9e3fc] p-2 rounded'
                size={40}
                color='#660275'
              />
            </div>
            <div>
              <h2 className='text-2xl font-bold text-foreground'>Scheduler</h2>
              <p className='text-muted-foreground text-md'>
                Configure automated test execution schedules
              </p>
            </div>
          </div>
          <div className='flex items-center space-x-4'>
            <ScheduleCreate
              testSuites={testSuites}
              requestChains={requestChains}
              onScheduleCreated={handleScheduleCreated}
            />
            <Button
              variant='outline'
              className='hover-scale bg-transparent'
              onClick={() => setOpen(true)}
            >
              <Info className='mr-2' size={16} />
              Quick Guide
            </Button>

            {/* Quick Guide Modal */}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent className='max-w-3xl'>
                <DialogHeader>
                  <DialogTitle>🚀 Guided Onboarding: Scheduler</DialogTitle>
                  <DialogDescription className='max-h-[80vh] overflow-y-auto pr-2'>
                    <div>
                      <p className='mb-4 text-base font-medium mt-4'>
                        Here's how to get started with the Scheduler:
                      </p>
                      <ul className='list-none pl-5 space-y-2 text-sm'>
                        <li>
                          🟩{' '}
                          <b className='text-[#000000]'>
                            Step 1: Create a Schedule
                          </b>{' '}
                          – Click "New Schedule\" to create automated test
                          execution schedules.
                        </li>
                        <li>
                          🟨{' '}
                          <b className='text-[#000000]'>
                            Step 2: Choose Target
                          </b>{' '}
                          – Select either a Test Suite or Request Chain to
                          schedule for execution.
                        </li>
                        <li>
                          🟦{' '}
                          <b className='text-[#000000]'>
                            Step 3: Set Execution Mode
                          </b>{' '}
                          – Choose between one-time execution or recurring
                          schedules.
                        </li>
                        <li>
                          🟪{' '}
                          <b className='text-[#000000]'>
                            Step 4: Configure Timing
                          </b>{' '}
                          – Set the date, time, and timezone for your schedule
                          execution.
                        </li>
                        <li>
                          🟧{' '}
                          <b className='text-[#000000]'>
                            Step 5: Advanced Settings
                          </b>{' '}
                          – Configure retry attempts, email notifications, and
                          stop conditions.
                        </li>
                        <li>
                          🟥{' '}
                          <b className='text-[#000000]'>
                            Step 6: Manage Schedules
                          </b>{' '}
                          – View, edit, enable/disable, clone, or delete your
                          schedules from the list.
                        </li>
                        <li>
                          ✅{' '}
                          <b className='text-[#000000]'>
                            Final Step: Monitor Execution
                          </b>{' '}
                          – Your schedules will run automatically at the
                          specified times.
                        </li>
                      </ul>
                    </div>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className='space-y-2'>
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
