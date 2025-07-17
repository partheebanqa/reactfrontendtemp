import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

export default function ActiveSchedules() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Clock className='h-5 w-5' />
            Active Schedules
          </div>
          <Badge variant='secondary'>0</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='text-center py-12'>
          <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <Clock className='h-8 w-8 text-gray-400' />
          </div>
          <p className='text-gray-500 font-medium'>No active schedules</p>
          <p className='text-sm text-gray-400 mt-1'>
            Create a schedule to get started
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
