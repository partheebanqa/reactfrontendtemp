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
  CirclePlay,
} from 'lucide-react';
import { useLocation } from 'wouter';

export default function QuickActions() {
  const [, setLocation] = useLocation();

  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm font-medium text-foreground'>
          Quick Links
        </CardTitle>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className='space-y-3'>
          <Button
            onClick={() => setLocation('/request-builder')}
            variant='ghost'
            className='w-full justify-start h-auto px-3 py-2.5 border border-border hover:bg-muted transition-colors rounded-lg '
          >
            <div className='flex items-start gap-3 w-full'>
              <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0'>
                <Settings className='text-blue-600' size={16} />
              </div>
              <div className='text-left'>
                <p className='text-sm font-medium text-foreground'>
                  Request Builder
                </p>
                <p className='text-xs text-muted-foreground leading-relaxed'>
                  Start building your first API request with variables and
                  assertions.
                </p>
              </div>
            </div>
          </Button>

          <Button
            onClick={() => setLocation('/test-suites/create')}
            variant='ghost'
            className='w-full justify-start h-auto px-3 py-2.5 border border-border hover:bg-muted transition-colors rounded-lg'
          >
            <div className='flex items-start gap-3 w-full'>
              {/* ICON */}
              <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0'>
                <Layers className='text-blue-600' size={16} />
              </div>

              {/* TEXT */}
              <div className='text-left min-w-0 flex-1'>
                <p className='text-sm font-medium text-foreground'>
                  Create Test Suite
                </p>
                <p className='text-xs text-muted-foreground leading-relaxed break-words'>
                  Group your tests together for better organization and reuse.
                </p>
              </div>
            </div>
          </Button>

          <Button
            onClick={() => setLocation('/request-chains/create')}
            variant='ghost'
            className='w-full justify-start h-auto px-3 py-2.5 border border-border hover:bg-muted transition-colors rounded-lg'
          >
            <div className='flex items-start gap-3 w-full'>
              <div className='w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center'>
                <Link2 className='text-purple-600' size={16} />
              </div>
              <div className='text-left'>
                <p className='text-sm font-medium text-foreground'>
                  Create Request Chain
                </p>
                <p className='text-xs text-muted-foreground leading-relaxed'>
                  Connect multiple API calls to simulate end‑to‑end workflows.
                </p>
              </div>
            </div>
          </Button>

          <Button
            onClick={() => setLocation('/scheduler')}
            variant='ghost'
            className='w-full justify-start h-auto px-3 py-2.5 border border-border hover:bg-muted transition-colors rounded-lg'
          >
            <div className='flex items-start gap-3 w-full'>
              <div className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center'>
                <CalendarClock className='text-green-600' size={16} />
              </div>
              <div className='text-left'>
                <p className='text-sm font-medium text-foreground'>Schedule</p>
                <p className='text-xs text-muted-foreground leading-relaxed'>
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
            <div className='flex items-start gap-3 w-full'>
              <div className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center'>
                <CirclePlay className='text-green-600' size={16} />
              </div>
              <div className='text-left'>
                <p className='text-sm font-medium text-foreground'>
                  Executions
                </p>
                <p className='text-xs text-muted-foreground leading-relaxed'>
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
