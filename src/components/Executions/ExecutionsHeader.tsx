import { Button } from '@/components/ui/button';
import { Download, Play } from 'lucide-react';

export const ExecutionsHeader = () => (
  <header className='bg-white border-b border-slate-200 px-6 py-4'>
    <div className='flex items-center justify-between'>
      <div>
        <h2 className='text-2xl font-semibold text-slate-900'>Executions</h2>
        <p className='text-sm text-slate-500'>
          View test execution history and results
        </p>
      </div>
      <div className='flex items-center space-x-4'>
        <Button variant='outline'>
          <Download className='mr-2' size={16} />
          Export
        </Button>
        <Button className='bg-primary hover:bg-primary/90 text-primary-foreground'>
          <Play className='mr-2' size={16} />
          Run Test Suite
        </Button>
      </div>
    </div>
  </header>
);
