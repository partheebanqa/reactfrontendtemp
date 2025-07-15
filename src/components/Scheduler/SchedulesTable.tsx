import { Play, MoreHorizontal, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SchedulesTableProps {
  schedules: any[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  onEdit: (schedule: any) => void;
  onRun: (schedule: any) => void;
  onClone: (schedule: any) => void;
  onDelete: (schedule: any) => void;
}

export default function SchedulesTable({
  schedules,
  totalItems,
  totalPages,
  currentPage,
  setCurrentPage,
  onEdit,
  onRun,
  onClone,
  onDelete,
}: SchedulesTableProps) {
  const getExecutionModeIcon = (scheduleType: string) => {
    return scheduleType === 'recurring' ? (
      <div className='flex items-center text-blue-600'>
        <Clock className='h-4 w-4 mr-1' />
        <span className='text-sm'>Recurring</span>
      </div>
    ) : (
      <div className='flex items-center text-blue-600'>
        <Calendar className='h-4 w-4 mr-1' />
        <span className='text-sm'>One-Time</span>
      </div>
    );
  };

  if (schedules.length === 0) {
    return (
      <div className='text-center py-12'>
        <div className='text-gray-400 mb-4'>
          <Calendar className='h-12 w-12 mx-auto' />
        </div>
        <h3 className='text-lg font-medium text-gray-900 mb-2'>
          No schedules found
        </h3>
        <p className='text-gray-500'>
          Create your first schedule to get started.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile Card View */}
      <div className='md:hidden space-y-4 p-4'>
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className='bg-white border rounded-lg p-4 space-y-3'
          >
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <h3 className='font-medium text-gray-900'>{schedule.name}</h3>
                <div className='flex items-center gap-2 mt-1'>
                  <Badge variant='outline' className='text-xs'>
                    {schedule.testSuite?.name || 'Test suite'}
                  </Badge>
                  {getExecutionModeIcon(schedule.scheduleType)}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='sm'>
                    <MoreHorizontal className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align='end'
                  className='bg-white border shadow-lg'
                >
                  <DropdownMenuItem onClick={() => onEdit(schedule)}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onClone(schedule)}>
                    Clone
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(schedule)}
                    className='text-red-600'
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className='grid grid-cols-2 gap-4 text-sm text-gray-600'>
              <div>
                <span className='font-medium'>Status:</span>
                <Badge
                  variant={schedule.isActive ? 'default' : 'secondary'}
                  className={`ml-2 ${
                    schedule.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {schedule.isActive ? 'Active' : 'Disabled'}
                </Badge>
              </div>
              <div>
                <span className='font-medium'>Environment:</span>
                <span className='ml-2'>{schedule.environment}</span>
              </div>
            </div>

            <div className='text-sm text-gray-600'>
              <span className='font-medium'>Next Run:</span>
              <span className='ml-2'>{schedule.nextRun}</span>
            </div>

            <div className='flex gap-2 pt-2'>
              <Button
                size='sm'
                onClick={() => onRun(schedule)}
                className='flex-1 bg-blue-600 hover:bg-blue-700 text-white'
              >
                <Play className='h-3 w-3 mr-1' />
                Run
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className='hidden md:block'>
        <Table>
          <TableHeader>
            <TableRow className='bg-gray-50'>
              <TableHead className='font-medium'>SCHEDULE</TableHead>
              <TableHead className='font-medium'>TYPE</TableHead>
              <TableHead className='font-medium'>EXECUTION MODE</TableHead>
              <TableHead className='font-medium'>STATUS</TableHead>
              <TableHead className='font-medium'>ENVIRONMENT</TableHead>
              <TableHead className='font-medium'>NEXT RUN</TableHead>
              <TableHead className='font-medium text-right'>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((schedule) => (
              <TableRow key={schedule.id} className='hover:bg-gray-50'>
                <TableCell>
                  <div>
                    <div className='font-medium text-gray-900'>
                      {schedule.name}
                    </div>
                    <div className='text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded mt-1 inline-block'>
                      {schedule.testSuite?.name || 'Test suite'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className='text-blue-600 text-sm'>Test suite</span>
                </TableCell>
                <TableCell>
                  {getExecutionModeIcon(schedule.scheduleType)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={schedule.isActive ? 'default' : 'secondary'}
                    className={`${
                      schedule.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {schedule.isActive ? 'Active' : 'Disabled'}
                  </Badge>
                </TableCell>
                <TableCell className='text-gray-600'>
                  {schedule.environment}
                </TableCell>
                <TableCell className='text-gray-600'>
                  {schedule.nextRun}
                </TableCell>
                <TableCell className='text-right'>
                  <div className='flex items-center justify-end gap-2'>
                    <Button
                      size='sm'
                      onClick={() => onRun(schedule)}
                      className='bg-blue-600 hover:bg-blue-700 text-white'
                    >
                      <Play className='h-3 w-3 mr-1' />
                      Run
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='outline' size='sm'>
                          <MoreHorizontal className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align='end'
                        className='bg-white border shadow-lg'
                      >
                        <DropdownMenuItem onClick={() => onEdit(schedule)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onClone(schedule)}>
                          Clone
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(schedule)}
                          className='text-red-600'
                        >
                          Delete
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
        <div className='flex items-center justify-between px-4 py-3 border-t'>
          <div className='text-sm text-gray-700'>
            Showing {Math.min((currentPage - 1) * 10 + 1, totalItems)} to{' '}
            {Math.min(currentPage * 10, totalItems)} of {totalItems} results
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
