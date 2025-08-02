import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import HelpLink from '../HelpModal/HelpLink';

export default function ReportsHeader() {
  return (
    <header className='bg-background border-b border-border px-6 py-4 animate-fade-in'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-semibold text-foreground'>Reports</h2>
          <p className='text-sm text-muted-foreground'>
            Analyze test performance and generate reports
          </p>
        </div>
        <div className='flex items-center space-x-4'>
          <Button variant='outline' className='hover-scale'>
            <Download className='mr-2' size={16} />
            Export Data
          </Button>
          <Button className='hover-scale'>
            <FileText className='mr-2' size={16} />
            Generate Report
          </Button>
          <HelpLink />
        </div>
      </div>
    </header>
  );
}
