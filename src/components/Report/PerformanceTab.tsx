import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const testSuitePerformanceData = [
  {
    name: 'Authentication API Tests',
    passed: 95,
    failed: 5,
    avgDuration: 2.3,
  },
  { name: 'Payment Gateway Tests', passed: 87, failed: 13, avgDuration: 4.1 },
  { name: 'User Management API', passed: 92, failed: 8, avgDuration: 3.2 },
  { name: 'Notification Service', passed: 89, failed: 11, avgDuration: 1.8 },
];

export default function PerformanceTab() {
  return (
    <div className='space-y-6 animate-fade-in'>
      {/* Performance Chart */}
      <Card className='p-6'>
        <CardHeader className='p-0 mb-6'>
          <CardTitle>Test Suite Performance</CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={testSuitePerformanceData}>
                <CartesianGrid
                  strokeDasharray='3 3'
                  className='stroke-border'
                />
                <XAxis
                  dataKey='name'
                  className='text-muted-foreground'
                  fontSize={11}
                />
                <YAxis className='text-muted-foreground' fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar dataKey='passed' fill='#10b981' name='Passed %' />
                <Bar dataKey='failed' fill='#ef4444' name='Failed %' />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card className='p-6'>
        <CardHeader className='p-0 mb-6'>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='space-y-4'>
            {testSuitePerformanceData.map((suite, index) => (
              <div
                key={index}
                className='flex items-center justify-between p-4 border border-border rounded-lg hover-scale'
              >
                <div>
                  <h4 className='font-medium text-foreground'>{suite.name}</h4>
                  <p className='text-sm text-muted-foreground'>
                    {suite.passed}% success rate • Avg duration:{' '}
                    {suite.avgDuration}s
                  </p>
                </div>
                <div className='flex items-center space-x-2'>
                  <Badge
                    variant='secondary'
                    className='bg-green-100 text-green-800 hover:bg-green-100'
                  >
                    {suite.passed}% passed
                  </Badge>
                  <Badge
                    variant='destructive'
                    className='bg-red-100 text-red-800 hover:bg-red-100'
                  >
                    {suite.failed}% failed
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
