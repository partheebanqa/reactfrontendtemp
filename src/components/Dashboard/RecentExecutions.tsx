import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Beaker, GitBranch, Layers, Link2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface Execution {
  entityId: string;
  executionId: string;
  type: string;
  name: string;
  date: string;
  status: 'running' | 'completed' | 'failed' | string;
}

interface RecentExecutionsProps {
  data: Execution[];
}

const getExecutionUrl = (
  type: string,
  entityId: string,
  executionId: string
) => {
  const lower = type.toLowerCase();

  if (lower === 'testsuite') {
    return `/executions/report/test_suite/${entityId}?executionId=${executionId}`;
  }

  if (lower === 'requestchain') {
    return `/executions/report/request_chain/${entityId}?executionId=${executionId}`;
  }

  return `/executions/report/execution/${entityId}?executionId=${executionId}`;
};

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'completed':
      return 'text-green-600 bg-green-100 border-green-200';
    case 'failed':
      return 'text-red-600 bg-red-100 border-red-200';
    case 'running':
      return 'text-orange-600 bg-orange-100 border-orange-200';
    default:
      return 'text-gray-600 bg-gray-100 border-gray-200';
  }
};

const getTypeIcon = (exec: Execution) => {
  const lower = exec.type?.toLowerCase();

  const icon =
    lower === 'testsuite' ? (
      <Layers className='text-[#136fb0]' size={16} />
    ) : lower === 'requestchain' ? (
      <Link2 className='text-purple-600' size={16} />
    ) : (
      <Activity className='text-gray-400' size={16} />
    );

  const label =
    lower === 'testsuite'
      ? 'Tests'
      : lower === 'requestchain'
      ? 'Chain'
      : 'Execution';

  const url = getExecutionUrl(exec.type, exec.entityId, exec.executionId);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className='cursor-pointer'
          onClick={() => (window.location.href = url)}
        >
          {icon}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default function RecentExecutions({ data }: RecentExecutionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <h3 className='text-[18px]'>Recent Executions</h3>
          </div>
          <Badge variant='secondary'>{data?.length ?? 0}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {!data || data.length === 0 ? (
          <div className='text-center py-8'>
            <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Activity className='h-8 w-8 text-gray-400' />
            </div>
            <p className='text-gray-500 font-medium'>No executions yet</p>
            <p className='text-sm text-gray-400 mt-1'>
              Run a test suite to see executions here
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            {data.map((exec) => (
              <div
                key={exec.executionId}
                className='flex items-center justify-between border border-gray-100 dark:border-gray-800 rounded-md p-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition'
              >
                <div className='flex items-center gap-3'>
                  {getTypeIcon(exec)}

                  <div
                    className='cursor-pointer'
                    onClick={() => {
                      const url = getExecutionUrl(
                        exec.type,
                        exec.entityId,
                        exec.executionId
                      );
                      window.location.href = url;
                    }}
                  >
                    <p className='font-medium text-sm capitalize text-black hover:text-blue-600 transition'>
                      {exec.name}
                    </p>
                    <p className='text-xs text-gray-500'>{exec.date}</p>
                  </div>
                </div>

                <Badge
                  variant='outline'
                  className={`${getStatusStyles(exec.status)} capitalize`}
                >
                  {exec.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
