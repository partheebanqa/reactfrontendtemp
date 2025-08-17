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
import { CalendarDays, Clock, X, Play, Filter, Save } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';

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
          className='h-8 text-slate-500'
        >
          <X size={14} className='mr-1' />
          Clear all
        </Button>
      </div>

      {/* Search & Filters */}
      <div className='bg-white p-4 rounded-lg border border-slate-200 flex flex-col lg:flex-row gap-4'>
        {/* Search */}
        <div className='flex-1 max-w-md relative'>
          <Input
            placeholder='Search by test suite name or execution ID...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10'
          />
        </div>

        {/* Dropdowns */}
        <div className='flex flex-wrap gap-3 items-center'>
          <Select
            value={environmentFilter}
            onValueChange={setEnvironmentFilter}
          >
            <SelectTrigger className='w-32'>
              <SelectValue placeholder='Environment' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Environments</SelectItem>
              <SelectItem value='development'>Development</SelectItem>
              <SelectItem value='staging'>Staging</SelectItem>
              <SelectItem value='production'>Production</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className='w-32'>
              <SelectValue placeholder='Type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Types</SelectItem>
              <SelectItem value='test-suite'>Test Suite</SelectItem>
              <SelectItem value='request-chain'>Request Chain</SelectItem>
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Advanced Search</DialogTitle>
              </DialogHeader>
              <div className='space-y-4'>
                <Label>Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      className='w-full justify-start mt-2'
                    >
                      <CalendarDays size={14} className='mr-2' />
                      {dateRange.from && dateRange.to
                        ? `${format(dateRange.from, 'MMM d, yyyy')} - ${format(
                            dateRange.to,
                            'MMM d, yyyy'
                          )}`
                        : 'Select date range'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <CalendarComponent
                      mode='range'
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={(range) =>
                        setDateRange({
                          from: range?.from,
                          to: range?.to,
                        })
                      }
                    />
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        setDateRange({ from: undefined, to: undefined })
                      }
                      className='w-full mt-2'
                    >
                      Clear dates
                    </Button>
                  </PopoverContent>
                </Popover>
              </div>
            </DialogContent>
          </Dialog>

          {/* Save filters */}
          <Button variant='ghost' size='sm' onClick={saveCurrentFilter}>
            <Save size={14} className='mr-2' />
            Save
          </Button>

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
