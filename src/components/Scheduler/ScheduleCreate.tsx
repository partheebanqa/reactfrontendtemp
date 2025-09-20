import { useState } from 'react';
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
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/hooks/useWorkspace';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import RecurringScheduleBuilder from '@/components/Scheduler/RecurringScheduleBuilder';

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
  scheduleType: z.enum(['one-time', 'recurring']),
  scheduledDate: z.date().optional(),
  scheduledTime: z.string().optional(),
  environment: z.string().min(1, 'Environment is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  retryAttempts: z.number().min(0).max(5),
  email: z.string().optional(),
  isActive: z.boolean(),
  requestDelay: z.number().optional(),
  cronExpression: z.string().optional(),
  stopConditions: z.array(z.string()).optional(),
});

type ScheduleFormData = z.infer<typeof scheduleFormSchema>;

interface ScheduleCreateProps {
  testSuites: any[];
  requestChains: any[];
  onScheduleCreated: () => void;

}

export default function ScheduleCreate({
  testSuites,
  requestChains,
  onScheduleCreated,
}: ScheduleCreateProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [targetType, setTargetType] = useState<'testSuite' | 'requestChain'>(
    'testSuite'
  );
  const [cronExpression, setCronExpression] = useState('');
  const [cronDescription, setCronDescription] = useState('');
  const [scheduleTime, setScheduleTime] = useState('08:00');

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspace();

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      name: '',
      description: '',
      scheduleType: 'one-time',
      scheduledDate: new Date(),
      scheduledTime: '09:00',
      environment: 'development',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      retryAttempts: 0,
      email: '',
      isActive: true,
      requestDelay: 0,
      stopConditions: [],
    },
  });

  const createMutation = useMutation({
    // mutationFn: (data: any) => {
    //   console.log('🚀 Calling schedulesApi.create with data:', data);
    //   // return schedulesApi.create(data);
    // },
    onSuccess: (response) => {
      console.log('✅ Schedule creation successful:', response);
      onScheduleCreated();
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
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
    console.log('📝 Form submission started');
    console.log('📝 Form submission data:', data);
    console.log('📝 Form validation errors:', form.formState.errors);

    // Generate cron expression based on schedule type
    let finalCronExpression;
    if (data.scheduleType === 'recurring') {
      finalCronExpression = cronExpression || '0 9 * * *'; // Default to daily at 9 AM
    } else {
      // For one-time schedules, create a cron expression from the scheduled date/time
      const scheduleDate = data.scheduledDate || new Date();
      const [hours, minutes] = (data.scheduledTime || '09:00').split(':');
      const day = scheduleDate.getDate();
      const month = scheduleDate.getMonth() + 1;
      finalCronExpression = `${parseInt(minutes)} ${parseInt(
        hours
      )} ${day} ${month} *`;
    }

    // Ensure all required fields are properly formatted
    const submitData = {
      name: data.name,
      description: data.description || '',
      testSuiteId:
        targetType === 'testSuite' ? data.testSuiteId : testSuites[0]?.id,
      workspaceId: currentWorkspace?.id,
      scheduleType: data.scheduleType,
      scheduledDate:
        data.scheduleType === 'one-time'
          ? data.scheduledDate || new Date()
          : new Date(),
      scheduledTime:
        data.scheduleType === 'one-time' ? data.scheduledTime || '09:00' : null,
      environment: data.environment || 'development',
      timezone:
        data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      retryAttempts: data.retryAttempts || 0,
      emailNotifications: data.email || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      requestDelay: data.requestDelay || 0,
      cronExpression: finalCronExpression,
    };

    console.log('Processed submission data:', submitData);

    // createMutation.mutate(submitData);
  };

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
            environment: 'development',
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
        }
        setCreateDialogOpen(open);
      }}
    >
      <DialogTrigger asChild>
        <Button className="hover-scale bg-[#136fb0] text-white" >
          <Plus className='mr-2' size={16} />
          New Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <div className='flex items-center justify-between'>
            <DialogTitle className='text-xl font-semibold'>
              Create New Schedule
            </DialogTitle>
            <Button
              variant='ghost'
              size='sm'
              className='text-blue-600 hover:text-blue-700 hover:bg-blue-50'
            >
              <Info size={16} className='mr-2' />
              Quick Guide
            </Button>
          </div>
        </DialogHeader>
        <TooltipProvider>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              {/* Schedule Name */}
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

              {/* Schedule Description */}
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

              {/* Target */}
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
                              {Array.isArray(testSuites) &&
                                testSuites.map((suite: any) => (
                                  <SelectItem key={suite.id} value={suite.id}>
                                    {suite.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder='Select request chain' />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(requestChains) &&
                          requestChains.map((chain: any) => (
                            <SelectItem
                              key={chain.id}
                              value={chain.id.toString()}
                            >
                              {chain.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Execution Mode */}
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
                    timezone={form.watch('timezone')}
                    time={scheduleTime}
                    onTimeChange={setScheduleTime}
                  />
                </div>
              )}

              {/* Date and Time - Only for one-time schedules */}
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
                                className={`w-full pl-3 text-left font-normal ${!field.value && 'text-muted-foreground'
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
              )}

              {/* Environment and Timezone */}
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='environment'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-base font-medium'>
                        Environment
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select environment' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='development'>
                            Development
                          </SelectItem>
                          <SelectItem value='staging'>Staging</SelectItem>
                          <SelectItem value='production'>Production</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                              field.onChange(parseInt(e.target.value) || 0)
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
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${form.watch('isActive') ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.watch('isActive')
                          ? 'translate-x-6'
                          : 'translate-x-1'
                          }`}
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
                  className='bg-blue-600 hover:bg-blue-700'
                  onClick={() => {
                    console.log('🔘 Create button clicked');
                    console.log('🔘 Form valid:', form.formState.isValid);
                    console.log('🔘 Form errors:', form.formState.errors);
                  }}
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
