import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Link,
  Clock,
  Settings,
  LineChart,
  Layers,
  Link2,
  CalendarClock,
  ChartColumn,
} from 'lucide-react';
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
                  Start building your first API request with variables and
                  assertions.
                </p>
              </div>
            </div>
          </Button>

          <Button
            onClick={() => setLocation('/test-suites/create')}
            variant='ghost'
            className='w-full justify-start h-auto p-4 border border-slate-200 hover:bg-slate-50 transition-colors'
          >
            <div className='flex items-center space-x-3'>
              <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
                <Layers className='text-blue-600' size={14} />
              </div>
              <div className='text-left'>
                <p className='text-sm font-medium text-slate-900'>
                  Create Test Suite
                </p>
                <p className='text-xs text-slate-500'>
                  Group your tests together for better organization and reuse.
                </p>
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
                <Link2 className='text-purple-600' size={14} />
              </div>
              <div className='text-left'>
                <p className='text-sm font-medium text-slate-900'>
                  Create Request Chain
                </p>
                <p className='text-xs text-slate-500'>
                  Connect multiple API calls to simulate end‑to‑end workflows.
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
                <CalendarClock className='text-green-600' size={14} />
              </div>
              <div className='text-left'>
                <p className='text-sm font-medium text-slate-900'>Schedule</p>
                <p className='text-xs text-slate-500'>
                  {' '}
                  Automate test runs by setting up recurring execution jobs.
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
                <ChartColumn className='text-green-600' size={14} />
              </div>
              <div className='text-left'>
                <p className='text-sm font-medium text-slate-900'>Executions</p>
                <p className='text-xs text-slate-500'>
                  Check how your tests performed and see what's next.
                </p>
              </div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
