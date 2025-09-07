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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
    const executionId = encodeURIComponent(execution?.id ?? '');

    setLocation(
      `/executions/report/${type}/${entityId}?executionId=${executionId}`
    );
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Execution ID</TableHead>
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
            <TableRow key={execution.id} className='hover:bg-muted/50'>
              <TableCell>
                <div>
                  {execution.testSuite ? (
                    <p className='font-medium text-[#136fb0] hover:text-primary/80 cursor-pointer'>
                      {execution.testSuite.name}
                    </p>
                  ) : (
                    <p className='font-medium text-[#136fb0] hover:text-primary/80 cursor-pointer'>
                      {execution.requestChain?.name || 'Request Chain'}
                    </p>
                  )}
                  <div className='flex items-center gap-2 mt-1'>
                    <p className='text-sm text-muted-foreground'>
                      ID: {execution.id}
                    </p>
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
                        className='text-muted-foreground hover:text-foreground'
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
                  <span className='text-sm text-foreground'>
                    {execution?.executionType}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className='text-sm text-foreground capitalize'>
                  {environment}
                </span>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    execution.status === 'success'
                      ? 'active'
                      : execution.status === 'failed'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  <span className='mr-1'>
                    {getStatusIcon(execution.status)}
                  </span>
                  {execution.status.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell>
                <div>
                  <p className='text-xs text-muted-foreground'>
                    {formatDistanceToNow(new Date(execution.startTime), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </TableCell>
              <TableCell className='text-sm text-foreground'>
                {formatDuration(execution.duration)}
              </TableCell>
              <TableCell>
                {execution.results ? (
                  <div className='text-sm'>
                    <p className='text-foreground'>
                      {execution.results.passed}/{execution.results.total}{' '}
                      passed
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {execution.results.failed} failed
                    </p>
                  </div>
                ) : (
                  <span className='text-sm text-muted-foreground'>N/A</span>
                )}
              </TableCell>
              <TableCell>
                <div className='flex items-center gap-2'>
                  {execution.scheduleId ? (
                    <Calendar className='text-blue-600' size={12} />
                  ) : (
                    <Play className='text-muted-foreground' size={12} />
                  )}
                  <span className='text-sm text-foreground'>
                    {execution.scheduleId ? 'Scheduled' : 'Manual'}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className='flex items-center gap-1'>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => goToReport(execution, environment)}
                        >
                          <Eye size={14} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>View execution details</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
