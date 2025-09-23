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

interface ScheduleListProps {
  schedules: any[];
  schedulesLoading: boolean;
  onRefresh: () => void;
  onEdit: (schedule: any) => void;
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
                  variant='outline'
                  size='sm'
                  disabled={schedulesLoading}
                  className='gap-2 bg-transparent'
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
                  <TableHead className='font-semibold text-slate-600 text-sm capitalize tracking-wider'>
                    Schedule
                  </TableHead>
                  <TableHead className='font-semibold text-slate-600 text-sm capitalize tracking-wider'>
                    Type
                  </TableHead>
                  <TableHead className='font-semibold text-slate-600 text-sm capitalize tracking-wider'>
                    {/* Execution */}
                    Mode
                  </TableHead>
                  <TableHead className='font-semibold text-slate-600 text-sm capitalize tracking-wider'>
                    Status
                  </TableHead>
                  <TableHead className='font-semibold text-slate-600 text-sm capitalize tracking-wider'>
                    Environment
                  </TableHead>
                  <TableHead className='font-semibold text-slate-600 text-sm capitalize tracking-wider'>
                    Next Run
                  </TableHead>
                  <TableHead className='font-semibold text-slate-600 text-sm capitalize tracking-wider'>
                    Actions
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
                          className='h-8 px-3 text-sm bg-transparent'
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
                              onClick={() => onEdit(schedule)}
                              className='flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer'
                            >
                              <Edit size={14} className='mr-3 text-slate-500' />
                              Edit Schedule
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateMutation.mutate({
                                  id: schedule.scheduleId,
                                  data: { isActive: !schedule.isActive },
                                })
                              }
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
                              onClick={() =>
                                cloneMutation.mutate(schedule.scheduleId)
                              }
                              className='flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer'
                            >
                              <Copy size={14} className='mr-3 text-slate-500' />
                              Clone Schedule
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                deleteMutation.mutate(schedule.scheduleId)
                              }
                              className='flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer'
                            >
                              <Trash2 size={14} className='mr-3 text-red-500' />
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
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of{' '}
                {totalItems} results
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
