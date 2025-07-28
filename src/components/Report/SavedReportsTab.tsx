import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const savedReports = [
  {
    id: 1,
    name: 'Weekly Performance Summary',
    type: 'summary',
    dateRange: 'Last 7 days',
    createdAt: '2024-01-07T10:30:00Z',
    status: 'ready',
  },
  {
    id: 2,
    name: 'Authentication API Deep Dive',
    type: 'detailed',
    dateRange: 'Last 30 days',
    createdAt: '2024-01-06T15:45:00Z',
    status: 'ready',
  },
  {
    id: 3,
    name: 'Monthly Trend Analysis',
    type: 'trend',
    dateRange: 'Last 3 months',
    createdAt: '2024-01-05T09:15:00Z',
    status: 'generating',
  },
];

export default function SavedReportsTab() {
  if (savedReports.length === 0) {
    return (
      <div className='text-center py-12 animate-fade-in'>
        <FileText className='mx-auto h-12 w-12 text-muted-foreground mb-4' />
        <h3 className='text-lg font-medium text-foreground mb-2'>
          No saved reports
        </h3>
        <p className='text-muted-foreground mb-4'>
          Generate your first report to start tracking test performance over
          time.
        </p>
        <Button>
          <FileText className='mr-2' size={16} />
          Generate Report
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-4 animate-fade-in'>
      {savedReports.map((report) => (
        <Card key={report.id} className='p-6 hover-scale'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-muted rounded-lg flex items-center justify-center'>
                <FileText className='text-muted-foreground' size={20} />
              </div>
              <div>
                <h3 className='font-semibold text-foreground'>{report.name}</h3>
                <p className='text-sm text-muted-foreground'>
                  {report.type} • {report.dateRange} • Created{' '}
                  {format(new Date(report.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className='flex items-center space-x-3'>
              <Badge
                variant={report.status === 'ready' ? 'secondary' : 'outline'}
                className={
                  report.status === 'ready'
                    ? 'bg-green-100 text-green-800 hover:bg-green-100'
                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                }
              >
                {report.status}
              </Badge>
              <div className='flex items-center space-x-2'>
                <Button size='sm' variant='outline'>
                  View
                </Button>

               <TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button size='sm' variant='outline'>
        <Download size={14} />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Download</TooltipContent>
  </Tooltip>
</TooltipProvider>

              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
