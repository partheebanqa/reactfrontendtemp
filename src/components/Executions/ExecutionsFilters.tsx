import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  CalendarDays,
  Clock,
  X,
  Play,
  Filter,
  Save,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface SavedFilter {
  id: string;
  name: string;
  filters: {
    searchQuery: string;
    statusFilter: string;
    environmentFilter: string;
    typeFilter: string;
    triggerFilter: string;
    dateRange: { from: Date | undefined; to: Date | undefined };
    executionIdFilter: string;
    durationRange: { min: number; max: number };
  };
}

interface ExecutionsFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  environmentFilter: string;
  setEnvironmentFilter: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  showAdvancedSearch: boolean;
  setShowAdvancedSearch: (value: boolean) => void;
  savedFilters: SavedFilter[];
  saveCurrentFilter: () => void;
  applySavedFilter: (filter: SavedFilter) => void;
  applyQuickFilter: (type: string) => void;
  activeQuickFilter: string | null;
  dateRange: { from: Date | undefined; to: Date | undefined };
  setDateRange: (range: {
    from: Date | undefined;
    to: Date | undefined;
  }) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  triggerFilter: string;
  setTriggerFilter: (value: string) => void;
  executionIdFilter: string;
  setExecutionIdFilter: (value: string) => void;
  durationRange: { min: number; max: number };
  setDurationRange: (range: { min: number; max: number }) => void;
  clearAllFilters: () => void;
}

export const ExecutionsFilters = ({
  searchQuery,
  setSearchQuery,
  environmentFilter,
  setEnvironmentFilter,
  typeFilter,
  setTypeFilter,
  showAdvancedSearch,
  setShowAdvancedSearch,
  savedFilters,
  saveCurrentFilter,
  applySavedFilter,
  applyQuickFilter,
  activeQuickFilter,
  dateRange,
  setDateRange,
  statusFilter,
  setStatusFilter,
  triggerFilter,
  setTriggerFilter,
  executionIdFilter,
  setExecutionIdFilter,
  durationRange,
  setDurationRange,
  clearAllFilters,
}: ExecutionsFiltersProps) => {
  return (
    <div className='mb-6 space-y-4'>
      {/* Quick Filters */}
      <div className='flex flex-wrap gap-2'>
        <Button
          variant={activeQuickFilter === 'last24hours' ? 'default' : 'outline'}
          size='sm'
          onClick={() => applyQuickFilter('last24hours')}
          className='h-8'
        >
          <Clock size={14} className='mr-1' />
          Last 24 hours
        </Button>
        <Button
          variant={activeQuickFilter === 'lastWeek' ? 'default' : 'outline'}
          size='sm'
          onClick={() => applyQuickFilter('lastWeek')}
          className='h-8'
        >
          <CalendarDays size={14} className='mr-1' />
          Last week
        </Button>
        <Button
          variant={activeQuickFilter === 'failed' ? 'default' : 'outline'}
          size='sm'
          onClick={() => applyQuickFilter('failed')}
          className='h-8'
        >
          <X size={14} className='mr-1' />
          Failed only
        </Button>
        <Button
          variant={activeQuickFilter === 'running' ? 'default' : 'outline'}
          size='sm'
          onClick={() => applyQuickFilter('running')}
          className='h-8'
        >
          <Play size={14} className='mr-1' />
          Running only
        </Button>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => applyQuickFilter('clear')}
          className='h-8 text-muted-foreground'
        >
          <X size={14} className='mr-1' />
          Clear all
        </Button>
      </div>

      {/* Search & Filters */}
      <div className='bg-card p-4 rounded-lg border border-border flex flex-col lg:flex-row gap-4'>
        {/* Search */}
        <div className='flex-1 max-w-md relative'>
          <Input
            placeholder='Search by test suite name or execution ID...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-4'
          />
        </div>

        {/* Dropdowns */}
        <div className='flex flex-wrap gap-3 items-center'>
          <Select
            value={environmentFilter}
            onValueChange={setEnvironmentFilter}
          >
            <SelectTrigger className='w-40'>
              <SelectValue placeholder='All...' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All...</SelectItem>
              <SelectItem value='No Environment'>No Environment</SelectItem>
              <SelectItem value='development'>Development</SelectItem>
              <SelectItem value='staging'>Staging</SelectItem>
              <SelectItem value='production'>Production</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className='w-36'>
              <SelectValue placeholder='All Types' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Types</SelectItem>
              <SelectItem value='test_suite'>Test Suite</SelectItem>
              <SelectItem value='request_chain'>Request Chain</SelectItem>
            </SelectContent>
          </Select>

          {/* Advanced Search Dialog */}
          <Dialog
            open={showAdvancedSearch}
            onOpenChange={setShowAdvancedSearch}
          >
            <DialogTrigger asChild>
              <Button variant='outline' size='sm'>
                <Filter size={14} className='mr-2' />
                Advanced
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-lg'>
              <DialogHeader>
                <DialogTitle>Advanced Search</DialogTitle>
              </DialogHeader>
              <div className='space-y-6'>
                {/* Date Range Picker */}
                <div>
                  <Label className='text-sm font-medium mb-2 block'>
                    Date Range
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !dateRange.from &&
                            !dateRange.to &&
                            'text-muted-foreground'
                        )}
                      >
                        <Calendar size={14} className='mr-2' />
                        {dateRange.from && dateRange.to
                          ? `${format(
                              dateRange.from,
                              'MMM d, yyyy'
                            )} - ${format(dateRange.to, 'MMM d, yyyy')}`
                          : 'Select date range'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <CalendarComponent
                        mode='range'
                        selected={{ from: dateRange.from, to: dateRange.to }}
                        onSelect={(range) =>
                          setDateRange({ from: range?.from, to: range?.to })
                        }
                        numberOfMonths={2}
                        className={cn('p-3 pointer-events-auto')}
                      />
                      <div className='p-3 border-t'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            setDateRange({ from: undefined, to: undefined })
                          }
                          className='w-full'
                        >
                          Clear dates
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Status Filter */}
                <div>
                  <Label className='text-sm font-medium mb-2 block'>
                    Status
                  </Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='All Status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Status</SelectItem>
                      <SelectItem value='success'>Success</SelectItem>
                      <SelectItem value='failed'>Failed</SelectItem>
                      <SelectItem value='running'>Running</SelectItem>
                      <SelectItem value='cancelled'>Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Trigger Filter */}
                <div>
                  <Label className='text-sm font-medium mb-2 block'>
                    Trigger
                  </Label>
                  <Select
                    value={triggerFilter}
                    onValueChange={setTriggerFilter}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='All Triggers' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Triggers</SelectItem>
                      <SelectItem value='manual'>Manual</SelectItem>
                      <SelectItem value='scheduled'>Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Execution ID */}
                <div>
                  <Label
                    htmlFor='executionId'
                    className='text-sm font-medium mb-2 block'
                  >
                    Execution ID
                  </Label>
                  <Input
                    id='executionId'
                    placeholder='Enter execution ID'
                    value={executionIdFilter}
                    onChange={(e) => setExecutionIdFilter(e.target.value)}
                  />
                </div>

                {/* Duration Range */}
                <div>
                  <Label className='text-sm font-medium mb-2 block'>
                    Duration Range (ms)
                  </Label>
                  <div className='flex gap-2'>
                    <Input
                      type='number'
                      placeholder='0'
                      value={durationRange.min || ''}
                      onChange={(e) =>
                        setDurationRange({
                          ...durationRange,
                          min: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                    <Input
                      type='number'
                      placeholder='10000'
                      value={durationRange.max || ''}
                      onChange={(e) =>
                        setDurationRange({
                          ...durationRange,
                          max: parseInt(e.target.value) || 100000,
                        })
                      }
                    />
                  </div>
                </div>

                <div className='flex gap-2 pt-4 border-t'>
                  <Button
                    onClick={() => setShowAdvancedSearch(false)}
                    className='flex-1'
                  >
                    Apply Filters
                  </Button>
                  <Button variant='outline' onClick={clearAllFilters}>
                    Clear All
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Save filters */}
          {/* <Button variant='ghost' size='sm' onClick={saveCurrentFilter}>
            <Save size={14} className='mr-2' />
            Save
          </Button> */}

          {/* Saved Filters */}
          {savedFilters.length > 0 && (
            <Select
              onValueChange={(value) => {
                const filter = savedFilters.find(
                  (f: SavedFilter) => f.id === value
                );
                if (filter) applySavedFilter(filter);
              }}
            >
              <SelectTrigger className='w-40'>
                <SelectValue placeholder='Saved filters' />
              </SelectTrigger>
              <SelectContent>
                {savedFilters.map((filter) => (
                  <SelectItem key={filter.id} value={filter.id}>
                    {filter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </div>
  );
};
