import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const chartData = [
  { day: 'Mon', successful: 95, failed: 5 },
  { day: 'Tue', successful: 92, failed: 8 },
  { day: 'Wed', successful: 98, failed: 2 },
  { day: 'Thu', successful: 89, failed: 11 },
  { day: 'Fri', successful: 94, failed: 6 },
  { day: 'Sat', successful: 97, failed: 3 },
  { day: 'Sun', successful: 91, failed: 9 },
];

export default function ExecutionChart() {
  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg font-semibold'>
            Execution Trends
          </CardTitle>
          <Select defaultValue='7days'>
            <SelectTrigger className='w-[130px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='7days'>Last 7 days</SelectItem>
              <SelectItem value='30days'>Last 30 days</SelectItem>
              <SelectItem value='90days'>Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className='h-[300px]'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
              <XAxis
                dataKey='day'
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <Legend />
              <Line
                type='monotone'
                dataKey='successful'
                stroke='#10b981'
                strokeWidth={2}
                name='Successful Tests'
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              />
              <Line
                type='monotone'
                dataKey='failed'
                stroke='#ef4444'
                strokeWidth={2}
                name='Failed Tests'
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
