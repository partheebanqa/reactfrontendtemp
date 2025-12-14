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
import {
  Copy,
  Calendar,
  GitBranch,
  Play,
  Eye,
  Beaker,
  Repeat2,
  RefreshCcw,
  Layers,
  Link2,
  RotateCw,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { executeTestSuite } from '@/services/testSuites.service';
import { toast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClientWithErrorDetail';
import { useExecuteRequestChain } from '@/shared/hooks/requestChain';

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

  //   const handleExecuteSuite = (id: string) => {
  //   executeSuiteMutation.mutate({ testSuiteId: id });
  // };
  const { mutateAsync: playChain } = useExecuteRequestChain();

  const executeSuiteMutation = useMutation({
    mutationFn: executeTestSuite,
    onSuccess: () => {
      toast({
        title: 'Queued',
        description: 'Test suite has been added to the queue for execution.',
      });
      queryClient.invalidateQueries({ queryKey: ['testSuites'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Execute failed',
        description: 'Execution failed. Please try again later.',
        variant: 'destructive',
      });
    },
  });

  const handlePlayChain = async (chainId: string) => {
    try {
      const payload = {
        requestChainId: chainId,
      };

      await playChain(payload);

      toast({
        title: 'Execution Started',
        description: `Request chain ${chainId} started successfully.`,
      });
    } catch (error: any) {
      toast({
        title: 'Execution Failed',
        description: error?.message || 'Could not execute the request chain.',
        variant: 'destructive',
      });
    }
  };

  const handleReTest = async (executions: any) => {
    if (executions?.executionType === 'test_suite') {
      executeSuiteMutation.mutate({ testSuiteId: executions?.entityId });
    } else if (executions?.executionType === 'request_chain') {
      await handlePlayChain(executions?.entityId);
    }
  };

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

  console.log(executions, 'executions');

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Execution ID</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Environment</TableHead>
          <TableHead>Status</TableHead>
          {/* <TableHead>Started</TableHead> */}
          <TableHead>Duration</TableHead>
          <TableHead>Results</TableHead>
          <TableHead>Trigger</TableHead>
          <TableHead>Results</TableHead>
          <TableHead className='whitespace-nowrap'>Re-Run</TableHead>

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
                    <p
                      className='font-medium text-[#136fb0] hover:text-primary/80 cursor-pointer'
                      onClick={() =>
                        setLocation(`/test-suites/${execution?.entityId}/edit`)
                      }
                    >
                      {execution.testSuite.name}
                    </p>
                  ) : (
                    <p
                      className='font-medium text-[#136fb0] hover:text-primary/80 cursor-pointer'
                      onClick={() =>
                        setLocation(
                          `/request-chains/${execution?.entityId}/edit`
                        )
                      }
                    >
                      {execution.requestChain?.name || 'Request Chain'}
                    </p>
                  )}
                  <div className='flex items-center gap-2 mt-1'>
                    <p className='text-sm text-muted-foreground'>
                      {execution.id}
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
                    <Layers className='text-[#136fb0]' size={16} />
                  ) : (
                    <Link2 className='text-purple-600' size={16} />
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
              {/* <TableCell>
                <div>
                  <p className='text-xs text-muted-foreground'>
                    {formatDistanceToNow(new Date(execution.startTime), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </TableCell> */}
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
                  {execution.source === 'scheduled' && (
                    <Calendar className='text-blue-600' size={12} />
                  )}
                  {execution.source === 'manual' && (
                    <Play className='text-muted-foreground' size={12} />
                  )}
                  {execution.source === 'cicd' && (
                    <GitBranch className='text-green-600' size={12} />
                  )}

                  <span className='text-sm text-foreground capitalize'>
                    {execution.source || 'N/A'}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className='flex items-center'>
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
              <TableCell>
                <div className='flex items-center'>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => handleReTest(execution)}
                        >
                          <RotateCw size={14} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Re-Test</TooltipContent>
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
