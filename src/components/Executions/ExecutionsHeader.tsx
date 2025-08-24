import { Button } from '@/components/ui/button';
import { Download, Play } from 'lucide-react';

export const ExecutionsHeader = () => (

  <>
   <header className='border border-gray-200 bg-background rounded-lg px-6 py-4 animate-fade-in'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-semibold text-foreground'>
            Executions
            </h2>
            <p className='text-sm text-slate-500'>
            Get execution results of test suite and request chain
        </p>
          </div>
          <div className='flex items-center space-x-4'>
            {/* <Button
              variant="outline"
              className="hover-scale"
            
            >
              <Share2 className="mr-2" size={16} />
              Share
            </Button> */}

            {/* <Button className="hover-scale"
         
             >
              <Download className="mr-2" size={16} />
              Download
            </Button> */}
          </div>
        </div>
      </header>

  </>
);
