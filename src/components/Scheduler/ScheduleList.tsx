'use client';

import { useState, useEffect } from 'react';
import {
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
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Beaker,
  Pencil,
  Layers,
  Link2,
  CopyPlus,
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
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
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
import { format, formatDistanceToNow } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  updateSchedule,
  deleteSchedule,
  duplicateSchedule,
} from '@/services/scheduler.service';
import { Switch } from '@/components/ui/switch';
import { Loader } from '../Loader';

interface Schedule {
  scheduleId: string;
  scheduleName: string;
  description: string;
  workspaceId: string;
  target: number; // 1 = Test Suite, 2 = Request Chain
  targetId: string;
  isOneTime: boolean;
  frequencyMode: number;
  scheduledTime: string;
  timezone: string;
  daysOfWeek?: number[];
  environmentId: string;
  nextRunAt: string;
  retryAttempts: number;
  isActive: boolean;
  targetName?: string;
}

interface ScheduleListProps {
  schedules: Schedule[];
  schedulesLoading: boolean;
  onRefresh: () => void;
  onEdit: (schedule: Schedule) => void;
}

export default function ScheduleList({
  schedules,
  schedulesLoading,
  onRefresh,
  onEdit,
}: ScheduleListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [executionModeFilter, setExecutionModeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  const itemsPerPage = 10;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<any> }) =>
      updateSchedule(id, data),
    onSuccess: () => {
      onRefresh();
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
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
    mutationFn: (scheduleId: string) => deleteSchedule(scheduleId),
    onSuccess: () => {
      onRefresh();
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
    mutationFn: (scheduleId: string) => duplicateSchedule(scheduleId),
    onSuccess: () => {
      onRefresh();
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      toast({
        title: 'Success',
        description: 'Schedule cloned successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to clone schedule',
        variant: 'destructive',
      });
    },
  });

  const getTargetTypeIcon = (target: number) => {
    return target === 1 ? (
      <Layers className='h-4 w-4 text-[#136fb0]' />
    ) : (
      <Link2 className='h-4 w-4 text-purple-600' />
    );
  };

  // Helper function to format schedule date and days left separately
  const getScheduleDateParts = (schedule: Schedule) => {
    if (schedule.scheduledTime) {
      try {
        const date = new Date(schedule.scheduledTime);
        const now = new Date();

        // 🧠 If one-time → show full date + time
        // 🕐 Otherwise → show only time (with timezone)
        const dateText = schedule.isOneTime
          ? `${format(date, 'MMM dd, yyyy')} at ${format(date, 'HH:mm')} (${
              schedule.timezone || 'UTC'
            })`
          : `${format(date, 'HH:mm')} (${schedule.timezone || 'UTC'})`;

        // Calculate days left
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let daysLeftText = '';
        if (diffDays > 0) {
          daysLeftText = `${diffDays} day${diffDays > 1 ? 's' : ''} left`;
        } else if (diffDays === 0) {
          daysLeftText = `Today`;
        } else {
          daysLeftText = `${Math.abs(diffDays)} day${
            Math.abs(diffDays) > 1 ? 's' : ''
          } ago`;
        }

        return { dateText, daysLeftText };
      } catch (error) {
        return { dateText: 'Invalid date', daysLeftText: '' };
      }
    }

    if (schedule.nextRunAt) {
      try {
        const date = new Date(schedule.nextRunAt);

        // 🧠 Recurring schedules show only time
        const dateText = schedule.isOneTime
          ? `${format(date, 'MMM dd, yyyy')} at ${format(date, 'HH:mm')} (${
              schedule.timezone || 'UTC'
            })`
          : `${format(date, 'HH:mm')} (${schedule.timezone || 'UTC'})`;

        return {
          dateText,
          daysLeftText: formatDistanceToNow(date, { addSuffix: true }),
        };
      } catch (error) {
        return { dateText: 'Invalid date', daysLeftText: '' };
      }
    }

    return { dateText: 'Not scheduled', daysLeftText: '' };
  };

  // Filter schedules based on search and filters
  const filteredSchedules = Array.isArray(schedules)
    ? schedules.filter((schedule: Schedule) => {
        const matchesSearch =
          schedule.scheduleName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          schedule.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase());

        const matchesType =
          typeFilter === 'all' ||
          (typeFilter === 'test-suite' && schedule.target === 1) ||
          (typeFilter === 'request-chain' && schedule.target === 2);

        const matchesExecutionMode =
          executionModeFilter === 'all' ||
          (executionModeFilter === 'one-time' && schedule.isOneTime) ||
          (executionModeFilter === 'recurring' && !schedule.isOneTime);

        const scheduleStatus = schedule.isActive ? 'active' : 'disabled';
        const matchesStatus =
          statusFilter === 'all' || scheduleStatus === statusFilter;

        const matchesDateRange =
          !dateRange.from ||
          !dateRange.to ||
          (schedule.scheduledTime &&
            new Date(schedule.scheduledTime) >= dateRange.from &&
            new Date(schedule.scheduledTime) <= dateRange.to);

        return (
          matchesSearch &&
          matchesType &&
          matchesExecutionMode &&
          matchesStatus &&
          matchesDateRange
        );
      })
    : [];

  // Helper function to get execution mode icon based on backend data
  const getExecutionModeIcon = (isOneTime: boolean, frequencyMode: number) => {
    if (isOneTime) {
      return <Calendar className='h-4 w-4 text-[#136fb0]' />;
    } else {
      // Recurring schedule based on frequencyMode
      return <Clock className='h-4 w-4 text-red-500' />;
    }
  };

  // Helper function to get execution mode text
  const getExecutionModeText = (isOneTime: boolean, frequencyMode: number) => {
    if (isOneTime) {
      return 'One-time';
    } else {
      // Map frequencyMode to text
      switch (frequencyMode) {
        case 1:
          return 'Hourly';
        case 2:
          return 'Daily';
        case 3:
          return 'Weekly';
        case 4:
          return 'Weekdays';
        case 5:
          return 'Monthly';
        default:
          return 'Recurring';
      }
    }
  };

  // Helper function to get target type text
  const getTargetTypeText = (target: number) => {
    return target === 1 ? 'Test suite' : 'Request chain';
  };

  // Helper function to format schedule date and time
  const formatScheduleDate = (schedule: Schedule) => {
    if (schedule.scheduledTime) {
      try {
        const date = new Date(schedule.scheduledTime);
        return `${format(date, 'MMM dd, yyyy')} at ${format(date, 'HH:mm')} (${
          schedule.timezone || 'UTC'
        })`;
      } catch (error) {
        return 'Invalid date';
      }
    }
    if (schedule.nextRunAt) {
      try {
        return formatDistanceToNow(new Date(schedule.nextRunAt), {
          addSuffix: true,
        });
      } catch (error) {
        return 'Invalid date';
      }
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
                  onClick={onRefresh}
                  variant='default'
                  className='hover-scale'
                  size='sm'
                  disabled={schedulesLoading}
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
      {!schedulesLoading ? (
        filteredSchedules.length === 0 ? (
          <div className='bg-white rounded-lg border border-slate-200 p-12 text-center'>
            <Clock className='mx-auto h-12 w-12 text-slate-400' />
            <h3 className='mt-2 text-sm font-medium text-slate-900'>
              No schedules
            </h3>
            <p className='mt-1 text-sm text-slate-500'>
              {schedules.length === 0
                ? 'Get started by creating a new schedule.'
                : 'No schedules match your current filters.'}
            </p>
          </div>
        ) : (
          <>
            <div className='bg-white rounded-lg border border-slate-200 overflow-hidden'>
              <Table>
                <TableHeader>
                  <TableRow className='bg-slate-50'>
                    <TableHead className='font-semibold text-slate-600 text-sm capitalize tracking-wider'>
                      Schedule/Target
                    </TableHead>
                    <TableHead className='font-semibold text-slate-600 text-sm capitalize tracking-wider'>
                      Type
                    </TableHead>

                    <TableHead className='font-semibold text-slate-600 text-sm capitalize tracking-wider'>
                      Status
                    </TableHead>
                    <TableHead className='font-semibold text-slate-600 text-sm capitalize tracking-wider'>
                      Mode
                    </TableHead>
                    <TableHead className='font-semibold text-slate-600 text-sm capitalize tracking-wider'>
                      Schedule Time
                    </TableHead>
                    <TableHead className='font-semibold text-slate-600 text-sm capitalize tracking-wider'>
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSchedules.map((schedule: Schedule) => (
                    <TableRow
                      key={schedule.scheduleId}
                      className='border-b border-slate-100 hover:bg-slate-50'
                    >
                      <TableCell className='py-4'>
                        <div>
                          <div className='font-medium text-slate-900'>
                            {schedule.scheduleName}
                          </div>
                          <p className='text-sm text-slate-400'>
                            ({schedule?.targetName})
                          </p>
                          {/* {schedule.description && (
                          <div className='text-sm text-slate-500 mt-1'>
                            {schedule.description}
                          </div>
                        )} */}
                        </div>
                      </TableCell>
                      <TableCell className='py-4'>
                        <div className='flex items-center gap-2'>
                          {getTargetTypeIcon(schedule.target)}
                          <span className='text-sm text-slate-700'>
                            {getTargetTypeText(schedule.target)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className='py-4'>
                        <div className='flex items-center gap-2'>
                          <Switch
                            checked={schedule.isActive}
                            onCheckedChange={(checked) => {
                              updateMutation.mutate({
                                id: schedule.scheduleId,
                                data: { isActive: checked },
                              });
                            }}
                          />
                          <span className='text-sm text-slate-700'>
                            {schedule.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className='py-4'>
                        <div className='flex items-center gap-2'>
                          <div className='text-blue-600'>
                            {getExecutionModeIcon(
                              schedule.isOneTime,
                              schedule.frequencyMode
                            )}
                          </div>
                          <span className='text-sm text-slate-700'>
                            {getExecutionModeText(
                              schedule.isOneTime,
                              schedule.frequencyMode
                            )}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className='py-4'>
                        {(() => {
                          const { dateText, daysLeftText } =
                            getScheduleDateParts(schedule);
                          return (
                            <div>
                              <div className='text-sm text-slate-600'>
                                {dateText}
                              </div>
                              {daysLeftText && (
                                <div className='text-xs text-slate-400'>
                                  {daysLeftText}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </TableCell>

                      <TableCell className='py-4'>
                        <div className='flex items-center gap-2'>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  className='h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600'
                                  onClick={() => onEdit(schedule)}
                                >
                                  <Pencil size={16} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit Schedule</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  className='h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600'
                                  onClick={() =>
                                    cloneMutation.mutate(schedule.scheduleId)
                                  }
                                >
                                  <CopyPlus size={16} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Clone Schedule</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <AlertDialog>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant='ghost'
                                      size='sm'
                                      className='h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600'
                                    >
                                      <Trash2 size={16} />
                                    </Button>
                                  </AlertDialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete Schedule</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete this schedule?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete{' '}
                                  <span className='font-medium text-red-600'>
                                    {schedule?.name || 'this schedule'}
                                  </span>
                                  . This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <Button
                                  // variant='destructive'
                                  onClick={() =>
                                    deleteMutation.mutate(schedule.scheduleId)
                                  }
                                >
                                  Delete
                                </Button>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
        )
      ) : (
        <Loader message='Loading Schedules' />
      )}

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
