import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Calendar, GitBranch, Play, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useLocation } from 'wouter';

export const ExecutionsTable = ({
  executions,
  schedules,
  openExecutionDetails,
  copyToClipboard,
  formatDuration,
  getStatusColor,
  getStatusIcon,
}: any) => {
  // console.log('executions:', executions);

  const [_, setLocation] = useLocation();

  const goToReport = (execution: any, environment: string) => {
    const type = execution?.executionType;
    const entityId =
      type === 'test_suite'
        ? execution?.testSuite?.id ?? execution?.entityId
        : execution?.requestChain?.id ?? execution?.entityId;

    if (!type || !entityId) {
      console.warn('Missing type or entityId for report navigation', {
        type,
        entityId,
        execution,
      });
      return;
    }

    const env = encodeURIComponent(environment || '');
    const started = encodeURIComponent(String(execution?.startTime ?? ''));

    setLocation(
      `/executions/report/${type}/${entityId}?env=${env}&started=${started}`
    );
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Test Suite</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Environment</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Started</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Results</TableHead>
          <TableHead>Trigger</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {executions?.map((execution: any) => {
          const schedule = schedules?.find(
            (s: any) => s.id === execution.scheduleId
          );
          const environment = schedule?.environment || execution.environment;

          return (
            <TableRow key={execution.id} className='hover:bg-slate-50'>
              <TableCell>
                <div>
                  {execution.testSuite ? (
                    <p className='font-medium text-orange-600 hover:text-orange-700 cursor-pointer'>
                      {execution.testSuite.name}
                    </p>
                  ) : (
                    <p className='font-medium text-orange-600 hover:text-orange-700 cursor-pointer'>
                      {execution.requestChain?.name || 'Request Chain'}
                    </p>
                  )}
                  <div className='flex items-center gap-2 mt-1'>
                    <p className='text-sm text-slate-500'>ID: {execution.id}</p>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-5 w-5 p-0'
                      onClick={() =>
                        copyToClipboard(execution.id.toString(), 'Execution ID')
                      }
                    >
                      <Copy
                        size={12}
                        className='text-slate-400 hover:text-slate-600'
                      />
                    </Button>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className='flex items-center gap-2'>
                  {execution?.testSuite ? (
                    <Calendar className='text-blue-600' size={16} />
                  ) : (
                    <GitBranch className='text-purple-600' size={16} />
                  )}
                  <span className='text-sm text-slate-700'>
                    {execution?.executionType}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className='text-sm text-slate-700 capitalize'>
                  {environment}
                </span>
              </TableCell>
              <TableCell>
                <Badge>
                  <span className='mr-1'>
                    {getStatusIcon(execution.status)}
                  </span>
                  {execution.status.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell>
                <div>
                  <p className='text-xs text-slate-500'>
                    {formatDistanceToNow(new Date(execution.startTime), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </TableCell>
              <TableCell className='text-sm text-slate-600'>
                {formatDuration(execution.duration)}
              </TableCell>
              <TableCell>
                {execution.results ? (
                  <div className='text-sm'>
                    <p className='text-slate-900'>
                      {execution.results.passed}/{execution.results.total}{' '}
                      passed
                    </p>
                    <p className='text-xs text-slate-500'>
                      {execution.results.failed} failed
                    </p>
                  </div>
                ) : (
                  <span className='text-sm text-slate-500'>N/A</span>
                )}
              </TableCell>
              <TableCell>
                <div className='flex items-center gap-2'>
                  {execution.scheduleId ? (
                    <Calendar className='text-blue-600' size={12} />
                  ) : (
                    <Play className='text-slate-500' size={12} />
                  )}
                  <span className='text-sm text-slate-600'>
                    {execution.scheduleId ? 'Scheduled' : 'Manual'}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className='flex items-center gap-1'>
                  {/* <Button
                    size='sm'
                    variant='outline'
                    onClick={() => openExecutionDetails(execution)}
                  >
                    <Eye size={14} />
                  </Button> */}
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => goToReport(execution, environment)}
                  >
                    <Eye size={14} />
                  </Button>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(execution, null, 2),
                        'Execution details'
                      )
                    }
                  >
                    <Copy size={14} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
