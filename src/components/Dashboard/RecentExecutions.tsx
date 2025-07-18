import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp } from 'lucide-react';

const recentExecutions = [
  {
    id: 1,
    testSuite: 'API Health Check',
    status: 'completed',
    duration: '1.2s',
    time: '2 mins ago',
    passed: 12,
    total: 12,
  },
  {
    id: 2,
    testSuite: 'User Authentication',
    status: 'failed',
    duration: '3.4s',
    time: '5 mins ago',
    passed: 8,
    total: 10,
  },
  {
    id: 3,
    testSuite: 'Payment Gateway',
    status: 'completed',
    duration: '2.1s',
    time: '12 mins ago',
    passed: 15,
    total: 15,
  },
  {
    id: 4,
    testSuite: 'Data Validation',
    status: 'running',
    duration: '...',
    time: 'just now',
    passed: 5,
    total: 8,
  },
];

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'failed':
      return 'destructive';
    case 'running':
      return 'secondary';
    default:
      return 'outline';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'text-green-500';
    case 'failed':
      return 'text-red-500';
    case 'running':
      return 'text-blue-500';
    default:
      return 'text-gray-500';
  }
};

export default function RecentExecutions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <TrendingUp className='h-5 w-5' />
            Recent Executions
          </div>
          <Badge variant='secondary'>0</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='text-center py-8'>
          <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <Activity className='h-8 w-8 text-gray-400' />
          </div>
          <p className='text-gray-500 font-medium'>No executions yet</p>
          <p className='text-sm text-gray-400 mt-1'>
            Run a test suite to see executions here
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
