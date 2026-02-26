import { LayoutDashboard } from 'lucide-react';
import StatsCard from './StatsCard';
import ExecutionChart from './ExecutionChart';
import ActiveSchedules from './ActiveSchedules';
import RecentExecutions from './RecentExecutions';
import SystemStatus from './SystemStatus';
import QuickActions from './QuickActions';
import BreadCum from '../BreadCum/Breadcum';
import { getDashboard } from '@/services/dashboard.service';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { navigate } from 'wouter/use-browser-location';
import WelcomeImage from '../../assests/images/Welcome_optra.webp';

export interface DashboardStats {
  totalTestSuites: number;
  totalRequestChains: number;
  totalCollections: number;
  totalCICDExecutions: number;
  totalActiveSchedules: number;
  lastExecutions: Execution[];
}

export interface Execution {
  executionId: string;
  type: 'testsuite' | 'requestchain' | string;
  name: string;
  date: string;
  status: 'running' | 'completed' | 'failed' | string;
}

export default function Dashboard() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const workSpaceName = currentWorkspace?.name;

  const [data, setData] = useState<DashboardStats>();

  const fetchDashboard = async () => {
    try {
      const response = await getDashboard(workspaceId || '');
      setData(response);
    } catch (err) {
      console.error(err, 'err');
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchDashboard();
    }
  }, [workspaceId]);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setOpen(true);
      localStorage.setItem('hasSeenWelcome', 'true');
    }
  }, []);

  return (
    <div className='min-h-screen bg-slate-50'>
      <BreadCum
        title={`Dashboard  -  ${workSpaceName || 'Workspace'}`}
        subtitle='Monitor your API tests and execution schedules'
        showCreateButton={false}
        showQuickGuide={false}
        buttonTitle='Run Execution'
        onClickCreateNew={() => console.log('Create execution')}
        icon={LayoutDashboard}
        iconBgClass='bg-blue-100'
        iconColor='#136fb0'
        iconSize={40}
      />

      {/* Dashboard Content */}
      <div className='flex-1 overflow-auto mt-3 scrollbar-thin'>
        {/* Stats Overview */}
        <div className='grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-1 md:gap-6 mb-3'>
          <StatsCard
            title='Total Import Collections'
            value={data?.totalCollections || 0}
            icon={<div className='text-green-600'>✅</div>}
            // change='+2.1%'
            // changeType='positive'
            // description='improvement'
            iconBgColor='bg-green-100'
          />

          <StatsCard
            title='Total Test Suites'
            value={data?.totalTestSuites || 0}
            icon={<div className='text-blue-600'>📊</div>}
            // change='+12%'
            // changeType='positive'
            // description='from last month'
            iconBgColor='bg-blue-100'
          />
          <StatsCard
            title='Total Request Chains'
            value={data?.totalRequestChains || 0}
            icon={<div className='text-orange-600'>⏱️</div>}
            // change='-0.3s'
            // changeType='positive'
            // description='faster'
            iconBgColor='bg-orange-100'
          />

          <StatsCard
            title='Active Schedules'
            value={data?.totalActiveSchedules || 0}
            icon={<div className='text-purple-600'>🕘</div>}
            // description='Next run in 2h 15m'
            iconBgColor='bg-purple-100'
          />
        </div>

        {/* Charts and Recent Activity */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6 mb-8'>
          {/* <ExecutionChart /> */}
          <RecentExecutions data={data?.lastExecutions || []} />
          <QuickActions />
        </div>

        {/* Active Schedules and Quick Actions */}
        {/* <div className='grid grid-cols-1 lg:grid-cols-4 gap-3'>
          <div className='lg:col-span-2'>
            <ActiveSchedules />
          </div>
          <div className='space-y-3'>
            <SystemStatus />
          </div>
          <div className='space-y-3'>
            <QuickActions />
          </div>
        </div> */}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-w-5xl'>
          <DialogDescription asChild>
            <div className='max-h-[88vh] overflow-y-auto scrollbar-thin pr-2 scrollbar-thin'>
              <div className='rounded-xl bg-white'>
                {/* Main content */}
                <div className='p-2 sm:p-4'>
                  <div className='grid gap-3 md:grid-cols-2 md:items-center'>
                    {/* LEFT: copy */}
                    <div>
                      <h2 className='text-2xl sm:text-3xl font-bold text-slate-900 mb-4'>
                        Welcome to Optraflow.com
                      </h2>

                      <p className='text-slate-600 mb-4'>
                        Inside your workspace, you can:
                      </p>

                      <ul className='space-y-3 text-slate-700'>
                        <li className='flex items-start gap-3'>
                          <span className='mt-2 h-2 w-2 rounded-full bg-[#136fb0]' />
                          <span>
                            Import OpenAPI specs, Postman collections, curl
                            commands — or add APIs manually
                          </span>
                        </li>
                        <li className='flex items-start gap-3'>
                          <span className='mt-2 h-2 w-2 rounded-full bg-[#136fb0]' />
                          <span>
                            Run APIs, add response assertions, and validate
                            schemas
                          </span>
                        </li>
                        <li className='flex items-start gap-3'>
                          <span className='mt-2 h-2 w-2 rounded-full bg-[#136fb0]' />
                          <span>
                            Auto-generate test cases for your APIs in the Test
                            Suite
                          </span>
                        </li>
                        <li className='flex items-start gap-3'>
                          <span className='mt-2 h-2 w-2 rounded-full bg-[#136fb0]' />
                          <span>
                            Create static or dynamic variables using built-in
                            functions
                          </span>
                        </li>
                        <li className='flex items-start gap-3'>
                          <span className='mt-2 h-2 w-2 rounded-full bg-[#136fb0]' />
                          <span>
                            Perform integration testing across workflows using
                            request chains
                          </span>
                        </li>
                        <li className='flex items-start gap-3'>
                          <span className='mt-2 h-2 w-2 rounded-full bg-[#136fb0]' />
                          <span>
                            Test APIs across multiple environments effortlessly
                          </span>
                        </li>
                        <li className='flex items-start gap-3'>
                          <span className='mt-2 h-2 w-2 rounded-full bg-[#136fb0]' />
                          <span>
                            Run jobs manually, schedule them, or trigger via
                            CI/CD pipelines
                          </span>
                        </li>
                        <li className='flex items-start gap-3'>
                          <span className='mt-2 h-2 w-2 rounded-full bg-[#136fb0]' />
                          <span>
                            Receive status updates via email, Slack, or
                            Microsoft Teams
                          </span>
                        </li>
                      </ul>

                      <div className='mt-6'>
                        <h3 className='text-lg font-semibold text-slate-900 mb-2'>
                          What’s next?
                        </h3>
                        <p className='text-slate-600'>
                          Create a new workspace, set up environments, import
                          your APIs — and start testing with confidence
                        </p>
                      </div>
                      <div className='mt-6'>
                        <Button
                          onClick={() => {
                            setOpen(false);
                          }}
                          className='bg-[#136fb0] hover:bg-[#136fb0] text-white shadow-sm'
                        >
                          Start testing
                        </Button>
                      </div>
                    </div>

                    {/* RIGHT: illustration (inline SVG) */}
                    <div className='relative mx-auto w-full max-w-[480px]'>
                      <div className='relative rounded-2xl  p-6'>
                        <img src={WelcomeImage} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer CTA */}
                <div className='px-6 sm:px-8 pb-6'>
                  <DialogFooter className='justify-center'>
                    <DialogClose asChild></DialogClose>
                  </DialogFooter>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
}
