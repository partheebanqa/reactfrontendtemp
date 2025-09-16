import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  GitBranch,
  Play,
  Edit,
  Copy,
  Trash2,
  MoreVertical,
  Info,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { format, formatDistanceToNow } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSchedules, useTestSuites, useRequestChains } from '@/hooks/use-api';
// import { schedulesApi } from '@/lib/api';
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

export default function Scheduler() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [executionModeFilter, setExecutionModeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [targetType, setTargetType] = useState<'testSuite' | 'requestChain'>(
    'testSuite'
  );
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [cronExpression, setCronExpression] = useState('');
  const [cronDescription, setCronDescription] = useState('');
  const [scheduleTime, setScheduleTime] = useState('08:00');
  const [selectedStopConditions, setSelectedStopConditions] = useState<
    string[]
  >([]);

  const itemsPerPage = 10;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspace();

  const {
    data: schedules = [],
    refetch: refetchSchedules,
    isLoading: schedulesLoading,
  } = useSchedules(currentWorkspace?.id);
  const { data: testSuites = [] } = useTestSuites(currentWorkspace?.id);
  const { data: requestChains = [] } = useRequestChains();

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
      // Force refetch the data immediately
      refetchSchedules();
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

  const updateMutation = useMutation({
    // mutationFn: ({
    //   id,
    //   data,
    // }: {
    //   id: number;
    //   data: Partial<ScheduleFormData>;
    // }) => schedulesApi.update(id, data),
    onSuccess: () => {
      // Force refetch the data immediately
      refetchSchedules();
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

  const deleteMutation = useMutation({
    // mutationFn: schedulesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      toast({
        title: 'Success',
        description: 'Schedule deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete schedule',
        variant: 'destructive',
      });
    },
  });

  const cloneMutation = useMutation({
    // mutationFn: (schedule: any) => {
    //   const clonedSchedule = {
    //     ...schedule,
    //     name: `${schedule.name} (Copy)`,
    //     id: undefined,
    //   };
    //   // return schedulesApi.create(clonedSchedule);
    // },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      toast({
        title: 'Success',
        description: 'Schedule cloned successfully',
      });
    },
  });

  // Test function to bypass form validation
  const testDirectApiCall = async () => {
    console.log('🧪 Testing direct API call');
    const testData = {
      name: 'Test Recurring Schedule',
      description: 'Direct API test',
      testSuiteId: testSuites[0]?.id,
      workspaceId: currentWorkspace?.id,
      scheduleType: 'recurring' as const,
      scheduledDate: new Date(),
      scheduledTime: undefined,
      environment: 'development',
      timezone: 'UTC',
      cronExpression: '30 14 * * *',
      isActive: true,
      requestDelay: 0,
      retryAttempts: 3,
    };

    try {
      console.log('🧪 Calling createMutation.mutate directly');
      // createMutation.mutate(testData);
    } catch (error) {
      console.error('🧪 Direct API call failed:', error);
    }
  };

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

    // if (editingSchedule) {
    //   updateMutation.mutate({ id: editingSchedule.id, data: submitData });
    // } else {
    //   createMutation.mutate(submitData);
    // }
  };

  const handleEdit = (schedule: any) => {
    setEditingSchedule(schedule);
    setCronExpression(schedule.cronExpression || '');
    setCronDescription('');
    form.reset({
      name: schedule.name,
      description: schedule.description || '',
      testSuiteId: schedule.testSuiteId,
      scheduleType: schedule.scheduleType,
      scheduledDate: schedule.scheduledDate
        ? new Date(schedule.scheduledDate)
        : new Date(),
      scheduledTime: schedule.scheduledTime || '',
      environment: schedule.environment || 'production',
      timezone: schedule.timezone || 'UTC',
      retryAttempts: schedule.retryAttempts || 0,
      email: schedule.emailNotifications || '',
      isActive: schedule.isActive,
      requestDelay: schedule.requestDelay || 0,
      cronExpression: schedule.cronExpression || '',
      stopConditions: schedule.stopConditions || [],
    });
    setEditDialogOpen(true);
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

        const scheduleStatus = schedule.isActive ? 'active' : 'disabled';
        const matchesStatus =
          statusFilter === 'all' || scheduleStatus === statusFilter;

        const matchesDateRange =
          !dateRange.from ||
          !dateRange.to ||
          (schedule.createdAt &&
            new Date(schedule.createdAt) >= dateRange.from &&
            new Date(schedule.createdAt) <= dateRange.to);

        return (
          matchesSearch &&
          matchesType &&
          matchesExecutionMode &&
          matchesStatus &&
          matchesDateRange
        );
      })
    : [];

  // Helper function to get execution mode icon
  const getExecutionModeIcon = (scheduleType: string) => {
    switch (scheduleType) {
      case 'one-time':
        return <Calendar className='h-4 w-4' />;
      case 'recurring':
        return <Clock className='h-4 w-4' />;
      case 'scheduled':
        return <Clock className='h-4 w-4' />;
      case 'ci-cd':
        return <GitBranch className='h-4 w-4' />;
      default:
        return <Clock className='h-4 w-4' />;
    }
  };

  // Helper function to format schedule date and time
  const formatScheduleDate = (schedule: any) => {
    if (schedule.scheduledDate && schedule.scheduledTime) {
      const date = new Date(schedule.scheduledDate);
      return `${format(date, 'MMM dd, yyyy')} at ${schedule.scheduledTime} (${
        schedule.timezone || 'UTC'
      })`;
    }
    if (schedule.nextRun) {
      return formatDistanceToNow(new Date(schedule.nextRun), {
        addSuffix: true,
      });
    }
    return 'Not scheduled';
  };

  // Pagination logic
  const totalItems = filteredSchedules.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSchedules = filteredSchedules.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, executionModeFilter, statusFilter]);

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
          <Dialog
            open={createDialogOpen}
            onOpenChange={(open) => {
              if (open) {
                // Reset form to default values when opening create dialog
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
              <Button className='bg-primary hover:bg-primary/90 text-primary-foreground'>
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
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className='space-y-6'
                  >
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
                            <Input
                              placeholder='Daily API Health Check'
                              {...field}
                            />
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
                      <FormLabel className='text-base font-medium'>
                        Target
                      </FormLabel>
                      <div className='grid grid-cols-2 gap-4'>
                        <Select
                          value={targetType}
                          onValueChange={(
                            value: 'testSuite' | 'requestChain'
                          ) => setTargetType(value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Test Suite' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='testSuite'>
                              Test Suite
                            </SelectItem>
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
                                  onValueChange={(value) =>
                                    field.onChange(value)
                                  }
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
                                        <SelectItem
                                          key={suite.id}
                                          value={suite.id}
                                        >
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
                                <RadioGroupItem
                                  value='one-time'
                                  id='one-time'
                                />
                                <Label htmlFor='one-time'>One-time</Label>
                              </div>
                              <div className='flex items-center space-x-2'>
                                <RadioGroupItem
                                  value='recurring'
                                  id='recurring'
                                />
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
                                <SelectItem value='production'>
                                  Production
                                </SelectItem>
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
                                    field.onChange(
                                      parseInt(e.target.value) || 0
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
                                        Enter multiple email addresses separated
                                        by commas
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
                                      field.value?.includes(condition.id) ||
                                      false
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
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                              form.watch('isActive')
                                ? 'bg-blue-600'
                                : 'bg-gray-200'
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
        </div>
      </header>

      {/* Main Content */}
      <div className='p-6 space-y-6'>
        {/* Search and Filters */}
        <div className='flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-white p-4 rounded-lg border border-slate-200'>
          <div className='flex-1 max-w-md'>
            <div className='relative'>
              <Search
                className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400'
                size={16}
              />
              <Input
                placeholder='Search schedules...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>
          </div>

          <div className='flex flex-wrap gap-3'>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className='w-32'>
                        <SelectValue placeholder='Type' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All Types</SelectItem>
                        <SelectItem value='test-suite'>Test Suite</SelectItem>
                        <SelectItem value='request-chain'>
                          Request Chain
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Filter by schedule type</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Select
                      value={executionModeFilter}
                      onValueChange={setExecutionModeFilter}
                    >
                      <SelectTrigger className='w-32'>
                        <SelectValue placeholder='Mode' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All Modes</SelectItem>
                        <SelectItem value='one-time'>One-time</SelectItem>
                        <SelectItem value='recurring'>Recurring</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Filter by execution mode</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setAdvancedFilterOpen(true)}
                  >
                    <Filter className='mr-2' size={16} />
                    Advanced
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Open advanced filter options</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => refetchSchedules()}
                    variant='outline'
                    size='sm'
                    disabled={schedulesLoading}
                    className='gap-2'
                  >
                    <RefreshCw
                      size={16}
                      className={schedulesLoading ? 'animate-spin' : ''}
                    />
                    Refresh
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh schedule data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Schedules Table */}
        {filteredSchedules.length === 0 ? (
          <div className='bg-white rounded-lg border border-slate-200 p-12 text-center'>
            <Clock className='mx-auto h-12 w-12 text-slate-400' />
            <h3 className='mt-2 text-sm font-medium text-slate-900'>
              No schedules
            </h3>
            <p className='mt-1 text-sm text-slate-500'>
              Get started by creating a new schedule.
            </p>
          </div>
        ) : (
          <>
            <div className='bg-white rounded-lg border border-slate-200 overflow-hidden'>
              <Table>
                <TableHeader>
                  <TableRow className='bg-slate-50'>
                    <TableHead className='font-semibold text-slate-600 text-xs uppercase tracking-wider'>
                      SCHEDULE
                    </TableHead>
                    <TableHead className='font-semibold text-slate-600 text-xs uppercase tracking-wider'>
                      TYPE
                    </TableHead>
                    <TableHead className='font-semibold text-slate-600 text-xs uppercase tracking-wider'>
                      EXECUTION MODE
                    </TableHead>
                    <TableHead className='font-semibold text-slate-600 text-xs uppercase tracking-wider'>
                      STATUS
                    </TableHead>
                    <TableHead className='font-semibold text-slate-600 text-xs uppercase tracking-wider'>
                      ENVIRONMENT
                    </TableHead>
                    <TableHead className='font-semibold text-slate-600 text-xs uppercase tracking-wider'>
                      NEXT RUN
                    </TableHead>
                    <TableHead className='font-semibold text-slate-600 text-xs uppercase tracking-wider'>
                      ACTIONS
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSchedules.map((schedule: any) => (
                    <TableRow
                      key={schedule.id}
                      className='border-b border-slate-100 hover:bg-slate-50'
                    >
                      <TableCell className='py-4'>
                        <div>
                          <div className='font-medium text-slate-900'>
                            {schedule.name}
                          </div>
                          {schedule.testSuite && (
                            <div className='text-sm text-orange-600 border border-orange-200 bg-orange-50 px-2 py-1 rounded mt-1 inline-block'>
                              {schedule.testSuite.name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className='py-4'>
                        <span className='text-sm text-slate-700'>
                          {schedule.testSuite ? 'Test suite' : 'Request chain'}
                        </span>
                      </TableCell>
                      <TableCell className='py-4'>
                        <div className='flex items-center gap-2'>
                          <div className='text-blue-600'>
                            {getExecutionModeIcon(schedule.scheduleType)}
                          </div>
                          <span className='text-sm text-slate-700 capitalize'>
                            {schedule.scheduleType === 'one-time'
                              ? 'One-time'
                              : schedule.scheduleType === 'recurring'
                              ? 'Recurring'
                              : schedule.scheduleType === 'ci-cd'
                              ? 'CI/CD'
                              : 'Scheduled'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className='py-4'>
                        <div className='flex items-center gap-2'>
                          <div
                            className={`w-2 h-2 rounded-full ${
                              schedule.isActive ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          ></div>
                          <span className='text-sm text-slate-700'>
                            {schedule.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className='py-4'>
                        <span className='text-sm text-slate-700 capitalize'>
                          {schedule.environment || 'production'}
                        </span>
                      </TableCell>
                      <TableCell className='py-4'>
                        <div className='text-sm text-slate-600'>
                          {formatScheduleDate(schedule)}
                        </div>
                      </TableCell>
                      <TableCell className='py-4'>
                        <div className='flex items-center gap-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            className='h-8 px-3 text-sm'
                          >
                            <Play size={14} className='mr-1' />
                            Run
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant='ghost'
                                size='sm'
                                className='h-8 w-8 p-0'
                              >
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align='end'
                              className='w-48 bg-white border border-slate-200 rounded-lg shadow-lg'
                            >
                              <DropdownMenuItem
                                onClick={() => handleEdit(schedule)}
                                className='flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer'
                              >
                                <Edit
                                  size={14}
                                  className='mr-3 text-slate-500'
                                />
                                Edit Schedule
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                // onClick={() =>
                                //   updateMutation.mutate({
                                //     id: schedule.id,
                                //     data: { isActive: !schedule.isActive },
                                //   })
                                // }
                                className='flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer'
                              >
                                <Clock
                                  size={14}
                                  className='mr-3 text-slate-500'
                                />
                                {schedule.isActive ? 'Disable' : 'Enable'}{' '}
                                Schedule
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => cloneMutation.mutate(schedule)}
                                className='flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer'
                              >
                                <Copy
                                  size={14}
                                  className='mr-3 text-slate-500'
                                />
                                Clone Schedule
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  deleteMutation.mutate(schedule.id)
                                }
                                className='flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer'
                              >
                                <Trash2
                                  size={14}
                                  className='mr-3 text-red-500'
                                />
                                Delete Schedule
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='flex items-center justify-between px-2'>
                <div className='text-sm text-slate-700'>
                  Showing {startIndex + 1} to {Math.min(endIndex, totalItems)}{' '}
                  of {totalItems} results
                </div>
                <div className='flex items-center space-x-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className='h-4 w-4' />
                    Previous
                  </Button>
                  <div className='flex items-center space-x-1'>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size='sm'
                          onClick={() => setCurrentPage(page)}
                          className='w-8 h-8 p-0'
                        >
                          {page}
                        </Button>
                      )
                    )}
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-xl font-semibold'>
              Edit Schedule
            </DialogTitle>
          </DialogHeader>
          <TooltipProvider>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-6'
              >
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
                        <Input
                          placeholder='Daily API Health Check'
                          {...field}
                        />
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

                {/* Date and Time */}
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

                {/* Recurring Schedule Configuration */}
                {form.watch('scheduleType') === 'recurring' && (
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
                            <SelectItem value='production'>
                              Production
                            </SelectItem>
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

                  {/* Active Schedule Toggle */}
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
                    disabled={updateMutation.isPending}
                    className='bg-blue-600 hover:bg-blue-700'
                  >
                    {updateMutation.isPending ? 'Updating...' : 'Update'}
                  </Button>
                </div>
              </form>
            </Form>
          </TooltipProvider>
        </DialogContent>
      </Dialog>

      {/* Advanced Filter Dialog */}
      <Dialog open={advancedFilterOpen} onOpenChange={setAdvancedFilterOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Advanced Filters</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label className='text-sm font-medium'>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-full mt-1'>
                  <SelectValue placeholder='All Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Status</SelectItem>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='disabled'>Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className='text-sm font-medium'>Date Range</Label>
              <div className='grid gap-2 mt-1'>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id='date'
                      variant='outline'
                      className={`w-full justify-start text-left font-normal ${
                        !dateRange.from && 'text-muted-foreground'
                      }`}
                    >
                      <CalendarIcon className='mr-2 h-4 w-4' />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, 'LLL dd, y')} -{' '}
                            {format(dateRange.to, 'LLL dd, y')}
                          </>
                        ) : (
                          format(dateRange.from, 'LLL dd, y')
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <CalendarComponent
                      mode='range'
                      selected={dateRange}
                      onSelect={(range) =>
                        setDateRange({ from: range?.from, to: range?.to })
                      }
                      numberOfMonths={2}
                      disabled={(date: Date) =>
                        date > new Date() || date < new Date('1900-01-01')
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter className='gap-2'>
            <Button
              variant='outline'
              onClick={() => {
                setStatusFilter('all');
                setDateRange({ from: undefined, to: undefined });
                setAdvancedFilterOpen(false);
              }}
            >
              Clear Filters
            </Button>
            <Button onClick={() => setAdvancedFilterOpen(false)}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
