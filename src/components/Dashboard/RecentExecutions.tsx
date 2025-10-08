import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, Play, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
// import dayjs from 'dayjs';

interface Execution {
  executionId: string;
  type: string;
  date: string;
  status: 'running' | 'completed' | 'failed' | string;
}

interface RecentExecutionsProps {
  data: Execution[];
}

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


const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className='h-4 w-4 text-green-500' />;
    case 'failed':
      return <XCircle className='h-4 w-4 text-red-500' />;
    case 'running':
      return <Loader2 className='h-4 w-4 text-blue-500 animate-spin' />;
    default:
      return <Activity className='h-4 w-4 text-gray-400' />;
  }
};

export default function RecentExecutions({ data }: RecentExecutionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <h3 className='text-[18px]'>
              Recent Executions
            </h3>
          </div>
          <Badge variant='secondary'>{data?.length ?? 0}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {(!data || data.length === 0) ? (
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
                  {getStatusIcon(exec.status)}
                  <div>
                    <p className='font-medium text-sm capitalize'>
                      {exec.type.replace(/([A-Z])/g, ' $1')}
                    </p>
                    <p className='text-xs text-gray-500'>
                      {/* {dayjs(exec.date).format('MMM D, YYYY h:mm A')} */}
                      {exec.date}
                    </p>
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
