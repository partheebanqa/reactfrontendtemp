'use client';

import { useState } from 'react';
import { useSchedules, useTestSuites, useRequestChains } from '@/hooks/use-api';
import { useWorkspace } from '@/hooks/useWorkspace';
import ScheduleCreate from '@/components/Scheduler/ScheduleCreate';
import ScheduleEdit from '@/components/Scheduler/ScheduleEdit';
import ScheduleList from '@/components/Scheduler/ScheduleList';
import { CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import {} from 'react';
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
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Header */}

      {/* <header className='bg-white border-b border-slate-200 px-6 py-4'>
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
      </header> */}

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
            <>
              <Button
                variant='outline'
                className='hover-scale bg-transparent'
                onClick={() => setOpen(true)}
              >
                <Info className='mr-2' size={16} />
                Quick Guide
              </Button>

              {/* 🔹 Quick Guide Modal */}
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className='max-w-3xl'>
                  <DialogHeader>
                    <DialogTitle>
                      🚀 Guided Onboarding: Request Builder
                    </DialogTitle>
                    <DialogDescription className='max-h-[80vh] overflow-y-auto pr-2'>
                      <div>
                        <p className='mb-4 text-base font-medium mt-4'>
                          Here’s how to get started:
                        </p>
                        <ul className='list-none pl-5 space-y-2 text-sm'>
                          <li>
                            🟩{' '}
                            <b className='text-[#000000]'>
                              Step 1: Workspace Selection
                            </b>{' '}
                            – Location: Top-left workspace dropdown. Start by
                            selecting your workspace. This is where your APIs,
                            environments, and test assets live. If you don’t see
                            expected data, double-check your selection.
                          </li>
                          <li>
                            🟨{' '}
                            <b className='text-[#000000]'>
                              Step 2: Choose an Environment
                            </b>{' '}
                            – Location: Top-right environment selector. Choose
                            the environment you want to test against—Dev, QA,
                            UAT, or Production. This sets the base URL for your
                            requests.
                          </li>
                          <li>
                            🟦{' '}
                            <b className='text-[#000000]'>
                              Step 3: Open or Create a Request
                            </b>{' '}
                            – Location: Request dropdown or collection panel.
                            Open an existing request or create a new one.
                            Organize requests into collections for faster access
                            and better structure.
                          </li>
                          <li>
                            🟪{' '}
                            <b className='text-[#000000]'>
                              Step 4: Configure Your Request
                            </b>{' '}
                            – Location: Request configuration tabs:
                            <ul className='list-disc pl-5 space-y-1'>
                              <li>Params: Add query parameters</li>
                              <li>Headers: Set custom headers</li>
                              <li>Body: Define payloads (JSON, form-data)</li>
                              <li>Authorization: Add tokens or credentials</li>
                              <li>
                                Assertions: Add assertions to API Response
                              </li>
                              <li>Settings: Customize timeout and redirects</li>
                              <li>
                                Schemas: Add schema and compare against response
                              </li>
                            </ul>
                            Each tab helps you shape the request precisely.
                          </li>
                          <li>
                            🟧{' '}
                            <b className='text-[#000000]'>
                              Step 5: Execute & Inspect Response
                            </b>{' '}
                            – Location: Send button and response panel. Click{' '}
                            <i>Send Request</i> to execute. Review status code,
                            headers, response body, time taken, payload size,
                            assertion results, and schema comparison results—all
                            in real-time.
                          </li>
                          <li>
                            🟥{' '}
                            <b className='text-[#000000]'>
                              Step 6: Add Assertions
                            </b>{' '}
                            – Location: Assertions tab. After a successful
                            response, assertions are auto-generated. Select the
                            ones you want to validate every time the API runs.
                          </li>
                          <li>
                            🟫{' '}
                            <b className='text-[#000000]'>
                              Step 7: Attach a Schema
                            </b>{' '}
                            – Location: Schemas tab. Upload a Swagger/OpenAPI
                            spec to validate your response structure. Use the
                            Swagger Parser under Utilities to generate
                            individual specs.
                          </li>
                          <li>
                            🟨{' '}
                            <b className='text-[#000000]'>
                              Step 8: Reuse & Iterate
                            </b>{' '}
                            – Location: Collections and history panel. Save
                            requests, switch environments. Iterate quickly and
                            scale your testing with confidence.
                          </li>
                          <li>
                            ✅{' '}
                            <b className='text-[#000000]'>
                              Final Step: You’re Ready!
                            </b>{' '}
                            – You’ve completed the Request Builder walkthrough.
                            You’re now equipped to build smarter, faster, and
                            more reliable API workflows.
                          </li>
                        </ul>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </>
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
