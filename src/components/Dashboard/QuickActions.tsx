import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Link, Clock, Settings, LineChart } from 'lucide-react';
import { useLocation } from 'wouter';

export default function QuickActions() {
  const [, setLocation] = useLocation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg font-semibold text-slate-900'>
          Quick Links
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          <Button
            onClick={() => setLocation('/request-builder')}
            variant='ghost'
            className='w-full justify-start h-auto p-4 border border-slate-200 hover:bg-slate-50 transition-colors'
          >
            <div className='flex items-center space-x-3'>
              <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
                <Settings className='text-blue-600' size={14} />
              </div>
              <div className='text-left'>
                <p className='text-sm font-medium text-slate-900'>
                  Request Builder
                </p>
                <p className='text-xs text-slate-500'>
                  Create a collection of tests
                </p>
              </div>
            </div>
          </Button>

          <Button
            onClick={() => setLocation('/create-test-suite')}
            variant='ghost'
            className='w-full justify-start h-auto p-4 border border-slate-200 hover:bg-slate-50 transition-colors'
          >
            <div className='flex items-center space-x-3'>
              <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
                <Plus className='text-blue-600' size={14} />
              </div>
              <div className='text-left'>
                <p className='text-sm font-medium text-slate-900'>
                  New Test Suite
                </p>
                <p className='text-xs text-slate-500'>
                  Create a collection of tests
                </p>
              </div>
            </div>
          </Button>

          <Button
            onClick={() => setLocation('/executions')}
            variant='ghost'
            className='w-full justify-start h-auto p-4 border border-slate-200 hover:bg-slate-50 transition-colors'
          >
            <div className='flex items-center space-x-3'>
              <div className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center'>
                <LineChart className='text-green-600' size={14} />
              </div>
              <div className='text-left'>
                <p className='text-sm font-medium text-slate-900'>Executions</p>
                <p className='text-xs text-slate-500'>Get execution results</p>
              </div>
            </div>
          </Button>

          <Button
            onClick={() => setLocation('/request-chains/create')}
            variant='ghost'
            className='w-full justify-start h-auto p-4 border border-slate-200 hover:bg-slate-50 transition-colors'
          >
            <div className='flex items-center space-x-3'>
              <div className='w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center'>
                <Link className='text-purple-600' size={14} />
              </div>
              <div className='text-left'>
                <p className='text-sm font-medium text-slate-900'>
                  Create Request Chain
                </p>
                <p className='text-xs text-slate-500'>
                  Link multiple API calls
                </p>
              </div>
            </div>
          </Button>

          <Button
            onClick={() => setLocation('/scheduler')}
            variant='ghost'
            className='w-full justify-start h-auto p-4 border border-slate-200 hover:bg-slate-50 transition-colors'
          >
            <div className='flex items-center space-x-3'>
              <div className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center'>
                <Clock className='text-green-600' size={14} />
              </div>
              <div className='text-left'>
                <p className='text-sm font-medium text-slate-900'>Schedule</p>
                <p className='text-xs text-slate-500'>Set up automated runs</p>
              </div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
