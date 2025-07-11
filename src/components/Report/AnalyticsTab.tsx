import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  CalendarIcon,
  TrendingUp,
  BarChart3,
  PieChart,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';

const statsData = [
  {
    title: 'Total Executions',
    value: '1,247',
    change: '+15% from last period',
    changeType: 'positive',
    icon: BarChart3,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    title: 'Success Rate',
    value: '94.2%',
    change: '+2.1% improvement',
    changeType: 'positive',
    icon: TrendingUp,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    title: 'Avg Duration',
    value: '3.4s',
    change: '-0.2s faster',
    changeType: 'positive',
    icon: PieChart,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    title: 'Failed Tests',
    value: '72',
    change: '+8 from last period',
    changeType: 'negative',
    icon: FileText,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
];

const executionTrendsData = [
  { date: '2024-01-01', passed: 45, failed: 5, total: 50 },
  { date: '2024-01-02', passed: 42, failed: 8, total: 50 },
  { date: '2024-01-03', passed: 48, failed: 2, total: 50 },
  { date: '2024-01-04', passed: 46, failed: 4, total: 50 },
  { date: '2024-01-05', passed: 44, failed: 6, total: 50 },
  { date: '2024-01-06', passed: 49, failed: 1, total: 50 },
  { date: '2024-01-07', passed: 47, failed: 3, total: 50 },
];

const executionDistributionData = [
  { name: 'Passed', value: 89, color: '#10b981' },
  { name: 'Failed', value: 8, color: '#ef4444' },
  { name: 'Cancelled', value: 3, color: '#6b7280' },
];

export default function AnalyticsTab() {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* Date Range Filter */}
      <Card className='p-4'>
        <div className='flex items-center space-x-4'>
          <div className='flex items-center space-x-2'>
            <label className='text-sm font-medium text-foreground'>
              Date Range:
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className={cn(
                    'justify-start text-left font-normal',
                    !dateRange && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'LLL dd, y')} -{' '}
                        {format(dateRange.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(dateRange.from, 'LLL dd, y')
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar
                  className='pointer-events-auto'
                  initialFocus
                  mode='range'
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range) {
                      setDateRange({ from: range.from, to: range.to });
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Select defaultValue='all'>
            <SelectTrigger className='w-40'>
              <SelectValue placeholder='Test Suite' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Test Suites</SelectItem>
              <SelectItem value='auth'>Authentication API</SelectItem>
              <SelectItem value='payment'>Payment Gateway</SelectItem>
              <SelectItem value='user'>User Management</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        {statsData.map((stat, index) => (
          <Card key={index} className='p-6 hover-scale'>
            <div className='flex items-center space-x-3'>
              <div
                className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}
              >
                <stat.icon className={stat.iconColor} size={20} />
              </div>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  {stat.title}
                </p>
                <p className='text-2xl font-bold text-foreground'>
                  {stat.value}
                </p>
                <p
                  className={`text-xs ${
                    stat.changeType === 'positive'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {stat.change}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Execution Trends Chart */}
        <Card className='p-6'>
          <CardHeader className='p-0 mb-6'>
            <CardTitle>Execution Trends</CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            <div className='h-64'>
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart data={executionTrendsData}>
                  <CartesianGrid
                    strokeDasharray='3 3'
                    className='stroke-border'
                  />
                  <XAxis
                    dataKey='date'
                    className='text-muted-foreground'
                    fontSize={11}
                  />
                  <YAxis className='text-muted-foreground' fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type='monotone'
                    dataKey='passed'
                    stroke='#10b981'
                    strokeWidth={2}
                    name='Passed'
                  />
                  <Line
                    type='monotone'
                    dataKey='failed'
                    stroke='#ef4444'
                    strokeWidth={2}
                    name='Failed'
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Execution Distribution Chart */}
        <Card className='p-6'>
          <CardHeader className='p-0 mb-6'>
            <CardTitle>Execution Distribution</CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            <div className='h-64'>
              <ResponsiveContainer width='100%' height='100%'>
                <RechartsPieChart>
                  <Pie
                    data={executionDistributionData}
                    cx='50%'
                    cy='50%'
                    outerRadius={80}
                    fill='#8884d8'
                    dataKey='value'
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {executionDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
