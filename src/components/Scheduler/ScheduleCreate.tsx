'use client';

import { useEffect, useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { Plus, Info, CalendarIcon } from 'lucide-react';
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
  DialogTrigger,
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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import RecurringScheduleBuilder from './RecurringScheduleBuilder';
import { createSchedule } from '@/services/scheduler.service';
import { getAllTestSuites } from '@/services/testSuites.service';
import { getRequestChains } from '@/services/requestChain.service';
import type { TestSuite } from '@/shared/types/TestSuite.model';
import type { RequestChain } from '@/shared/types/requestChain.model';
import { useWorkspace } from '@/hooks/useWorkspace';
import { cn } from '@/lib/utils';
import { format, isToday, addMinutes } from 'date-fns';

const STOP_CONDITIONS = [
  { id: '500', label: 'If an API returns a 500 (Internal Server Error)' },
  {
    id: '401-403',
    label: 'If the API responds with 401 (Unauthorized) or 403 (Forbidden)',
  },
  { id: '429', label: 'If the API responds with 429 (Rate Limit Exceeded)' },
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
  workspaceId: z.string().optional(),
});

export type ScheduleFormData = z.infer<typeof scheduleFormSchema>;

interface ScheduleCreateProps {
  onScheduleCreated: () => void;
}

interface RecurringData {
  frequencyMode: number;
  daysOfWeek?: number[];
}

export default function ScheduleCreate({
  onScheduleCreated,
}: ScheduleCreateProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [targetType, setTargetType] = useState<'testSuite' | 'requestChain'>(
    'testSuite'
  );
  const [cronExpression, setCronExpression] = useState('');
  const [cronDescription, setCronDescription] = useState('');
  const [scheduleTime, setScheduleTime] = useState('08:00');
  const [recurringData, setRecurringData] = useState<RecurringData>({
    frequencyMode: 2,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspace();

  // Fetch test suites using React Query

  const {
    data: testSuites = [],
    isLoading: isLoadingTestSuites,
    error: testSuitesError,
  } = useQuery({
    queryKey: ['test-suites', currentWorkspace?.id],
    queryFn: () => getAllTestSuites(currentWorkspace!.id),
    enabled: !!currentWorkspace?.id,
  });

  // Fetch request chains using React Query
  const {
    data: requestChains = [],
    isLoading: isLoadingRequestChains,
    error: requestChainsError,
  } = useQuery({
    queryKey: ['request-chains', currentWorkspace?.id],
    queryFn: () => getRequestChains(currentWorkspace!.id),
    enabled: !!currentWorkspace?.id,
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
      stopConditions: [],
      workspaceId: currentWorkspace?.id || '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      return createSchedule(data);
    },
    onSuccess: (response) => {
      onScheduleCreated();
      setCreateDialogOpen(false);
      form.reset();
      toast({
        title: 'Success',
        description: 'Schedule created successfully',
      });
    },
    onError: (error: any) => {
      console.error('❌ Schedule creation failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create schedule',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ScheduleFormData) => {
    const scheduleDate = data.scheduledDate || new Date();
    const currentScheduleTime = data.scheduledTime || scheduleTime || '09:00';
    const [hours, minutes] = currentScheduleTime.split(':');

    const scheduledDateTime = new Date(scheduleDate);
    scheduledDateTime.setHours(Number(hours), Number(minutes), 0, 0);

    const scheduledTimeISO = formatInTimeZone(
      scheduledDateTime,
      data.timezone,
      "yyyy-MM-dd'T'HH:mm:ssXXX"
    );

    // Parse stop conditions to numbers
    const stopExecutionAfterFailure = (data.stopConditions || []).map(
      (condition) => {
        switch (condition) {
          case '500':
            return 1;
          case '401-403':
            return 2;
          case '429':
            return 3;
          default:
            return Number.parseInt(condition);
        }
      }
    );

    // Parse email recipients
    const mailRecipients = data.email
      ? data.email
          .split(',')
          .map((email) => email.trim())
          .filter((email) => email)
      : [];

    const targetId =
      targetType === 'testSuite' ? data.testSuiteId : data.requestChainId;

    // Base payload
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

    // Add recurring schedule specific fields
    if (data.scheduleType === 'recurring') {
      submitData.frequencyMode = recurringData.frequencyMode;

      // Add daysOfWeek for weekly schedules
      if (recurringData.frequencyMode === 3 && recurringData.daysOfWeek) {
        submitData.daysOfWeek = recurringData.daysOfWeek;
      }
    }
    if (data.scheduleType === 'one-time') {
      submitData.frequencyMode = 1;
    }
    createMutation.mutate(submitData);
  };

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!form.getValues('timezone')) {
      form.setValue('timezone', tz);
    }
  }, [form]);

  return (
    <Dialog
      open={createDialogOpen}
      onOpenChange={(open) => {
        if (open) {
          form.reset({
            name: '',
            description: '',
            scheduleType: 'one-time',
            scheduledDate: new Date(),
            scheduledTime: '',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            retryAttempts: 0,
            email: '',
            isActive: true,
            requestDelay: 0,
            stopConditions: [],
          });
          setCronExpression('');
          setCronDescription('');
          setScheduleTime('08:00');
          setRecurringData({ frequencyMode: 2 });
        }
        setCreateDialogOpen(open);
      }}
    >
      <DialogTrigger asChild>
        <Button variant='default' className='shadow-elegant'>
          <Plus className='mr-2' size={16} />
          New Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin'>
        <DialogHeader>
          <div className='flex items-center justify-between'>
            <DialogTitle className='text-xl font-semibold'>
              Create New Schedule
            </DialogTitle>
            <Button
              variant='ghost'
              size='sm'
              className='text-primary hover:text-primary/90 hover:bg-primary/10'
            >
              <Info size={16} className='mr-2' />
              Quick Guide
            </Button>
          </div>
        </DialogHeader>

        <TooltipProvider>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-base font-medium'>
                      Schedule Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder='Daily API Health Check' {...field} />
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
                <FormLabel className='text-base font-medium'>Target</FormLabel>
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
                              ) : testSuites.length > 0 ? (
                                testSuites.map((suite: TestSuite) => (
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
                              ) : requestChains.length > 0 ? (
                                requestChains.map((chain: RequestChain) => (
                                  <SelectItem key={chain.id} value={chain.id}>
                                    {chain.name}
                                  </SelectItem>
                                ))
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
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className='flex flex-row space-x-6'
                      >
                        <div className='flex items-center space-x-2'>
                          <RadioGroupItem value='one-time' id='one-time' />
                          <Label htmlFor='one-time'>One-time</Label>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <RadioGroupItem value='recurring' id='recurring' />
                          <Label htmlFor='recurring'>Recurring</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Recurring Schedule Builder */}
              {form.watch('scheduleType') === 'recurring' && (
                <div className='space-y-4'>
                  <RecurringScheduleBuilder
                    value={cronExpression}
                    onChange={(cron, description) => {
                      setCronExpression(cron);
                      setCronDescription(description);
                    }}
                    onRecurringDataChange={setRecurringData}
                    timezone={form.watch('timezone')}
                    time={scheduleTime}
                    onTimeChange={setScheduleTime}
                  />
                </div>
              )}

              {form.watch('scheduleType') === 'one-time' && (
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
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
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
                          <PopoverContent className='w-auto p-0' align='start'>
                            <CalendarComponent
                              mode='single'
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date() ||
                                date < new Date('1900-01-01')
                              }
                              initialFocus
                              className={cn('p-3 pointer-events-auto')}
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
                    render={({ field }) => {
                      const selectedDate = form.watch('scheduledDate'); // assuming you also have a date picker
                      const nowPlus30 = addMinutes(new Date(), 30);

                      return (
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
                                ['00', '15', '30', '45'].map((minute) => {
                                  const timeString = `${hour
                                    .toString()
                                    .padStart(2, '0')}:${minute}`;
                                  const [h, m] = timeString
                                    .split(':')
                                    .map(Number);

                                  // Build Date object for comparison
                                  const candidate = new Date(
                                    selectedDate || new Date()
                                  );
                                  candidate.setHours(h, m, 0, 0);

                                  // If today, block times <= now+30min
                                  if (
                                    selectedDate &&
                                    isToday(new Date(selectedDate))
                                  ) {
                                    if (candidate <= nowPlus30) {
                                      return null; // hide this option
                                    }
                                  }

                                  return (
                                    <SelectItem
                                      key={timeString}
                                      value={timeString}
                                    >
                                      {timeString}
                                    </SelectItem>
                                  );
                                })
                              ).flat()}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>
              )}

              <div className='grid grid-cols-2 gap-4'>
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
                          {/* Auto-detected timezone */}
                          {![
                            'UTC',
                            'America/New_York',
                            'America/Chicago',
                            'America/Denver',
                            'America/Los_Angeles',
                            'Europe/London',
                            'Europe/Paris',
                            'Asia/Tokyo',
                            'Asia/Shanghai',
                            'Asia/Kolkata',
                            'Australia/Sydney',
                          ].includes(field.value) && (
                            <SelectItem value={field.value}>
                              {field.value} (Auto-detected)
                            </SelectItem>
                          )}

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
              </div>

              {/* Advanced Settings */}
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
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className='h-4 w-4 text-muted-foreground cursor-help' />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Enter multiple email addresses separated by
                                commas
                              </p>
                            </TooltipContent>
                          </Tooltip>
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

                {/* Stop Execution Conditions */}
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
                              id={condition.id}
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
                              htmlFor={condition.id}
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

                {/* Active Schedule Toggle */}
                <div className='flex items-center justify-between'>
                  <FormLabel className='text-base font-medium'>
                    Active Schedule
                  </FormLabel>
                  <div className='relative'>
                    <input
                      type='checkbox'
                      id='enable-schedule'
                      checked={form.watch('isActive')}
                      onChange={(e) =>
                        form.setValue('isActive', e.target.checked)
                      }
                      className='sr-only'
                    />
                    <label
                      htmlFor='enable-schedule'
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer',
                        form.watch('isActive') ? 'bg-primary' : 'bg-muted'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-background transition-transform',
                          form.watch('isActive')
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        )}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className='flex justify-end gap-3 pt-6 mt-8 border-t'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={createMutation.isPending}
                  // className='shadow-elegant'
                >
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </form>
          </Form>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}
