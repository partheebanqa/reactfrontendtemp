import { Button } from '@/components/ui/button';
import { Download, Play } from 'lucide-react';

export const ExecutionsHeader = () => (
  <div className='mb-6'>
    <div className='flex items-center justify-between'>
      <div>
        <h1 className='text-2xl font-semibold text-foreground'>Executions</h1>
        <p className='text-sm text-muted-foreground'>
          Get execution results of test suite and request chain
        </p>
      </div>
      {/* <div className='flex items-center space-x-3'>
        <Button variant='outline' size='sm'>
          <Download className='mr-2' size={16} />
          Export
        </Button>
        <Button size='sm'>
          <Play className='mr-2' size={16} />
          Run Test Suite
        </Button>
      </div> */}
    </div>
  </div>
);
