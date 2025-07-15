import { Search, RefreshCw, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SearchAndFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  executionModeFilter: string;
  setExecutionModeFilter: (mode: string) => void;
  refetchSchedules: () => void;
  schedulesLoading: boolean;
}

export default function SearchAndFilters({
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  executionModeFilter,
  setExecutionModeFilter,
  refetchSchedules,
  schedulesLoading,
}: SearchAndFiltersProps) {
  return (
    <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
      <div className='flex flex-col sm:flex-row gap-3 flex-1'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
          <Input
            placeholder='Search schedules...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10'
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className='w-[140px]'>
            <SelectValue placeholder='All Types' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Types</SelectItem>
            <SelectItem value='test-suite'>Test Suite</SelectItem>
            <SelectItem value='request-chain'>Request Chain</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={executionModeFilter}
          onValueChange={setExecutionModeFilter}
        >
          <SelectTrigger className='w-[140px]'>
            <SelectValue placeholder='All Modes' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Modes</SelectItem>
            <SelectItem value='recurring'>Recurring</SelectItem>
            <SelectItem value='one-time'>One-Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='flex gap-2'>
        <Button variant='outline' size='sm' className='text-gray-600'>
          <Filter className='h-4 w-4 mr-2' />
          Advanced
        </Button>

        <Button
          variant='outline'
          size='sm'
          onClick={refetchSchedules}
          disabled={schedulesLoading}
          className='text-gray-600'
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${schedulesLoading ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>
    </div>
  );
}
