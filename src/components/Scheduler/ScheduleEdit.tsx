'use client';

import { useState, useEffect } from 'react';
import { Info, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Checkbox } from '@/components/ui/checkbox';
import RecurringScheduleBuilder from '@/components/Scheduler/RecurringScheduleBuilder';
import { updateSchedule, getSchedule } from '@/services/scheduler.service';
import { getAllTestSuites } from '@/services/testSuites.service';
import { getRequestChains } from '@/services/requestChain.service';
import type { TestSuite } from '@/shared/types/TestSuite.model';
import type { RequestChain } from '@/shared/types/requestChain.model';

const STOP_CONDITIONS = [
  {
    id: '500',
    label: 'If an API returns a 500 (Internal Server Error)',
    value: 1,
  },
  {
    id: '401-403',
    label: 'If the API responds with 401 (Unauthorized) or 403 (Forbidden)',
    value: 2,
  },
  {
    id: '429',
    label: 'If the API responds with 429 (Rate Limit Exceeded)',
    value: 3,
  },
];

const scheduleFormSchema = z.object({
  name: z.string().min(1, 'Schedule name is required'),
  description: z.string().optional(),
  testSuiteId: z.string().optional(),
  requestChainId: z.string().optional(),
  scheduleType: z.enum(['one-time', 'recurring']),
  scheduledDate: z.date().optional(),
  scheduledTime: z.string().optional(),
  timezone: z.string().min(1, 'Timezone is required'),
  retryAttempts: z.number().min(0).max(5),
  email: z.string().optional(),
  isActive: z.boolean(),
  requestDelay: z.number().optional(),
  cronExpression: z.string().optional(),
  stopConditions: z.array(z.string()).optional(),
});

type ScheduleFormData = z.infer<typeof scheduleFormSchema>;

interface ScheduleEditProps {
  editDialogOpen: boolean;
  setEditDialogOpen: (open: boolean) => void;
  editingSchedule: any;
  setEditingSchedule: (schedule: any) => void;
  testSuites: any[];
  requestChains: any[];
  onScheduleUpdated: () => void;
}

export default function ScheduleEdit({
  editDialogOpen,
  setEditDialogOpen,
  editingSchedule,
  setEditingSchedule,
  testSuites,
  requestChains,
  onScheduleUpdated,
}: ScheduleEditProps) {
  const [targetType, setTargetType] = useState<'testSuite' | 'requestChain'>(
    'testSuite'
  );
  const [cronExpression, setCronExpression] = useState('');
  const [cronDescription, setCronDescription] = useState('');
  const [scheduleTime, setScheduleTime] = useState('08:00');
  const [recurringData, setRecurringData] = useState({
    frequencyMode: 1,
    daysOfWeek: [],
  });
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspace();

  const { data: allTestSuites = [], isLoading: isLoadingTestSuites } = useQuery(
    {
      queryKey: ['test-suites', currentWorkspace?.id],
      queryFn: () => getAllTestSuites(currentWorkspace!.id),
      enabled: !!currentWorkspace?.id && editDialogOpen,
    }
  );

  const { data: allRequestChains = [], isLoading: isLoadingRequestChains } =
    useQuery({
      queryKey: ['request-chains', currentWorkspace?.id],
      queryFn: () => getRequestChains(currentWorkspace!.id),
      enabled: !!currentWorkspace?.id && editDialogOpen,
    });

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      name: '',
      description: '',
      scheduleType: 'one-time',
      scheduledDate: new Date(),
      scheduledTime: '09:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      retryAttempts: 0,
      email: '',
      isActive: true,
      requestDelay: 0,
      cronExpression: '',
      stopConditions: [],
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ScheduleFormData>;
    }) => updateSchedule(id, data),
    onSuccess: () => {
      onScheduleUpdated();
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      setEditDialogOpen(false);
      setEditingSchedule(null);
      form.reset();
      toast({
        title: 'Success',
        description: 'Schedule updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update schedule',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ScheduleFormData) => {
    const scheduleDate = data.scheduledDate || new Date();
    const currentScheduleTime = data.scheduledTime || scheduleTime || '09:00';
    const [hours, minutes] = currentScheduleTime.split(':');

    const scheduledDateTime = new Date(scheduleDate);
    scheduledDateTime.setHours(
      Number.parseInt(hours),
      Number.parseInt(minutes),
      0,
      0
    );
    const scheduledTimeISO =
      scheduledDateTime.toISOString().slice(0, 19) + '+05:30';

    const stopExecutionAfterFailure = (data.stopConditions || []).map(
      (condition) => {
        const stopCondition = STOP_CONDITIONS.find((c) => c.id === condition);
        return stopCondition ? stopCondition.value : Number.parseInt(condition);
      }
    );

    const mailRecipients = data.email
      ? data.email
          .split(',')
          .map((email) => email.trim())
          .filter((email) => email)
      : [];

    const targetId =
      targetType === 'testSuite' ? data.testSuiteId : data.requestChainId;

    const submitData: any = {
      scheduleName: data.name,
      description: data.description || '',
      workspaceId: currentWorkspace?.id,
      target: targetType === 'testSuite' ? 1 : 2,
      targetId,
      isOneTime: data.scheduleType === 'one-time',
      scheduledTime: scheduledTimeISO,
      timezone:
        data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      retryAttempts: data.retryAttempts || 0,
      mailRecipients,
      stopExecutionAfterFailure,
      isActive: data.isActive !== undefined ? data.isActive : true,
    };

    if (data.scheduleType === 'recurring') {
      submitData.frequencyMode = recurringData.frequencyMode;

      if (recurringData.frequencyMode === 3 && recurringData.daysOfWeek) {
        submitData.daysOfWeek = recurringData.daysOfWeek;
      }
    }

    updateMutation.mutate({ id: editingSchedule.scheduleId, data: submitData });
  };

  useEffect(() => {
    const loadScheduleData = async () => {
      if (editingSchedule && editingSchedule.scheduleId) {
        setIsLoadingSchedule(true);
        try {
          const scheduleData = await getSchedule(editingSchedule.scheduleId);
          const newTargetType =
            scheduleData.target === 1 ? 'testSuite' : 'requestChain';
          setTargetType(newTargetType);

          const scheduledDateTime = parseISO(scheduleData.scheduledTime);
          const timeString = format(scheduledDateTime, 'HH:mm');
          setScheduleTime(timeString);

          setRecurringData({
            frequencyMode: scheduleData.frequencyMode || 1,
            daysOfWeek: scheduleData.daysOfWeek || [],
          });

          const stopConditionIds = (
            scheduleData.stopExecutionAfterFailure || []
          ).map((value: number) => {
            const condition = STOP_CONDITIONS.find((c) => c.value === value);
            return condition ? condition.id : value.toString();
          });

          const emailString = (scheduleData.mailRecipients || []).join(', ');

          form.reset({
            name: scheduleData.scheduleName,
            description: scheduleData.description || '',
            testSuiteId:
              newTargetType === 'testSuite' ? scheduleData.targetId : '',
            requestChainId:
              newTargetType === 'requestChain' ? scheduleData.targetId : '',
            scheduleType: scheduleData.isOneTime ? 'one-time' : 'recurring',
            scheduledDate: scheduledDateTime,
            scheduledTime: timeString,
            timezone: scheduleData.timezone || 'UTC',
            retryAttempts: scheduleData.retryAttempts || 0,
            email: emailString,
            isActive: scheduleData.isActive,
            requestDelay: 0,
            cronExpression: '',
            stopConditions: stopConditionIds,
          });
        } catch (error) {
          console.error('Failed to load schedule data:', error);
          toast({
            title: 'Error',
            description: 'Failed to load schedule data',
            variant: 'destructive',
          });
        } finally {
          setIsLoadingSchedule(false);
        }
      }
    };

    if (editDialogOpen && editingSchedule) {
      loadScheduleData();
    }
  }, [editingSchedule, editDialogOpen, form, toast]);

  return (
    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin'>
        <DialogHeader>
          <DialogTitle className='text-xl font-semibold'>
            Edit Schedule
          </DialogTitle>
        </DialogHeader>

        {isLoadingSchedule ? (
          <div className='flex items-center justify-center py-8'>
            <div className='text-sm text-muted-foreground'>
              Loading schedule data...
            </div>
          </div>
        ) : (
          <TooltipProvider>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-6'
              >
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-base font-medium'>
                        Schedule Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Daily API Health Check'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-base font-medium'>
                        Schedule Description (Optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Enter description'
                          className='min-h-[80px]'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='space-y-4'>
                  <FormLabel className='text-base font-medium'>
                    Target
                  </FormLabel>
                  <div className='grid grid-cols-2 gap-4'>
                    <Select
                      value={targetType}
                      onValueChange={(value: 'testSuite' | 'requestChain') =>
                        setTargetType(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Test Suite' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='testSuite'>Test Suite</SelectItem>
                        <SelectItem value='requestChain'>
                          Request Chain
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {targetType === 'testSuite' ? (
                      <FormField
                        control={form.control}
                        name='testSuiteId'
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={(value) => field.onChange(value)}
                              value={field.value || ''}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder='Select test suite' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {isLoadingTestSuites ? (
                                  <SelectItem value='' disabled>
                                    Loading test suites...
                                  </SelectItem>
                                ) : allTestSuites.length > 0 ? (
                                  allTestSuites.map((suite: TestSuite) => (
                                    <SelectItem key={suite.id} value={suite.id}>
                                      {suite.name}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value='' disabled>
                                    No test suites available
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <FormField
                        control={form.control}
                        name='requestChainId'
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={(value) => field.onChange(value)}
                              value={field.value || ''}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder='Select request chain' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {isLoadingRequestChains ? (
                                  <SelectItem value='' disabled>
                                    Loading request chains...
                                  </SelectItem>
                                ) : allRequestChains.length > 0 ? (
                                  allRequestChains.map(
                                    (chain: RequestChain) => (
                                      <SelectItem
                                        key={chain.id}
                                        value={chain.id}
                                      >
                                        {chain.name}
                                      </SelectItem>
                                    )
                                  )
                                ) : (
                                  <SelectItem value='' disabled>
                                    No request chains available
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name='scheduleType'
                  render={({ field }) => (
                    <FormItem className='space-y-3'>
                      <FormLabel className='text-base font-medium'>
                        Execution Mode
                      </FormLabel>
                      <FormControl>
                        <div className='flex space-x-6'>
                          <div className='flex items-center space-x-2'>
                            <input
                              type='radio'
                              id='edit-one-time'
                              value='one-time'
                              checked={field.value === 'one-time'}
                              onChange={(e) => field.onChange(e.target.value)}
                              className='h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500'
                            />
                            <Label
                              htmlFor='edit-one-time'
                              className='text-sm font-medium'
                            >
                              One-time execution
                            </Label>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <input
                              type='radio'
                              id='edit-recurring'
                              value='recurring'
                              checked={field.value === 'recurring'}
                              onChange={(e) => field.onChange(e.target.value)}
                              className='h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500'
                            />
                            <Label
                              htmlFor='edit-recurring'
                              className='text-sm font-medium'
                            >
                              Recurring execution
                            </Label>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('scheduleType') === 'one-time' ? (
                  <div className='grid grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name='scheduledDate'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-base font-medium'>
                            Date
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant='outline'
                                  className={`w-full pl-3 text-left font-normal ${
                                    !field.value && 'text-muted-foreground'
                                  }`}
                                >
                                  {field.value ? (
                                    format(field.value, 'PPP')
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className='w-auto p-0'
                              align='start'
                            >
                              <CalendarComponent
                                mode='single'
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date() ||
                                  date < new Date('1900-01-01')
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='scheduledTime'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-base font-medium'>
                            Time
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Select time' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, hour) =>
                                ['00', '15', '30', '45'].map((minute) => (
                                  <SelectItem
                                    key={`${hour
                                      .toString()
                                      .padStart(2, '0')}:${minute}`}
                                    value={`${hour
                                      .toString()
                                      .padStart(2, '0')}:${minute}`}
                                  >
                                    {`${hour
                                      .toString()
                                      .padStart(2, '0')}:${minute}`}
                                  </SelectItem>
                                ))
                              ).flat()}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : (
                  <div className='space-y-4'>
                    <RecurringScheduleBuilder
                      value={cronExpression}
                      onChange={(cron, description) => {
                        setCronExpression(cron);
                        setCronDescription(description);
                      }}
                      timezone={
                        form.watch('timezone') ||
                        Intl.DateTimeFormat().resolvedOptions().timeZone
                      }
                      time={scheduleTime}
                      onTimeChange={setScheduleTime}
                      onRecurringDataChange={setRecurringData}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name='timezone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-base font-medium'>
                        Timezone
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select timezone' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='UTC'>UTC</SelectItem>
                          <SelectItem value='America/New_York'>
                            Eastern Time (ET)
                          </SelectItem>
                          <SelectItem value='America/Chicago'>
                            Central Time (CT)
                          </SelectItem>
                          <SelectItem value='America/Denver'>
                            Mountain Time (MT)
                          </SelectItem>
                          <SelectItem value='America/Los_Angeles'>
                            Pacific Time (PT)
                          </SelectItem>
                          <SelectItem value='Europe/London'>
                            London (GMT)
                          </SelectItem>
                          <SelectItem value='Europe/Paris'>
                            Paris (CET)
                          </SelectItem>
                          <SelectItem value='Asia/Tokyo'>
                            Tokyo (JST)
                          </SelectItem>
                          <SelectItem value='Asia/Shanghai'>
                            Shanghai (CST)
                          </SelectItem>
                          <SelectItem value='Asia/Kolkata'>
                            Mumbai (IST)
                          </SelectItem>
                          <SelectItem value='Australia/Sydney'>
                            Sydney (AEDT)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='space-y-4'>
                  <FormLabel className='text-base font-medium'>
                    Advanced Settings
                  </FormLabel>

                  <div className='grid grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name='retryAttempts'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>
                            Retry Attempts
                          </FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              min='0'
                              max='5'
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  Number.parseInt(e.target.value) || 0
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='email'
                      render={({ field }) => (
                        <FormItem>
                          <div className='flex items-center gap-2'>
                            <FormLabel className='text-sm font-medium'>
                              Email Notifications
                            </FormLabel>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className='h-4 w-4 text-slate-400 cursor-help' />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    Enter multiple email addresses separated by
                                    commas
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <FormControl>
                            <Input
                              type='text'
                              placeholder='email1@example.com, email2@example.com'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name='stopConditions'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-base font-medium'>
                          Stop execution (Optional)
                        </FormLabel>
                        <div className='space-y-3'>
                          {STOP_CONDITIONS.map((condition) => (
                            <div
                              key={condition.id}
                              className='flex items-center space-x-2'
                            >
                              <Checkbox
                                id={`edit-${condition.id}`}
                                checked={
                                  field.value?.includes(condition.id) || false
                                }
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value || [];
                                  if (checked) {
                                    field.onChange([
                                      ...currentValue,
                                      condition.id,
                                    ]);
                                  } else {
                                    field.onChange(
                                      currentValue.filter(
                                        (id) => id !== condition.id
                                      )
                                    );
                                  }
                                }}
                              />
                              <Label
                                htmlFor={`edit-${condition.id}`}
                                className='text-sm font-normal'
                              >
                                {condition.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='flex items-center justify-between'>
                    <FormLabel className='text-base font-medium'>
                      Active Schedule
                    </FormLabel>
                    <div className='relative'>
                      <input
                        type='checkbox'
                        id='enable-schedule-edit'
                        checked={form.watch('isActive')}
                        onChange={(e) =>
                          form.setValue('isActive', e.target.checked)
                        }
                        className='sr-only'
                      />
                      <label
                        htmlFor='enable-schedule-edit'
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                          form.watch('isActive') ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            form.watch('isActive')
                              ? 'translate-x-6'
                              : 'translate-x-1'
                          }`}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className='flex justify-end gap-3 pt-6 mt-8 border-t'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type='submit'
                    disabled={updateMutation.isPending || isLoadingSchedule}
                    className='bg-blue-600 hover:bg-blue-700'
                  >
                    {updateMutation.isPending ? 'Updating...' : 'Update'}
                  </Button>
                </div>
              </form>
            </Form>
          </TooltipProvider>
        )}
      </DialogContent>
    </Dialog>
  );
}
