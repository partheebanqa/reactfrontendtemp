
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
      const response = await getDashboard(workspaceId || "");
      setData(response)
      // console.log(response, "res")
    } catch (err) {
      console.log(err, "err");
    }
  };


  useEffect(() => {
    if (workspaceId) {
      fetchDashboard();
    }
  }, [workspaceId]);

  return (
    <div className='min-h-screen bg-slate-50'>
      <BreadCum
        title={`Dashboard  -  ${workSpaceName || 'Workspace'}`}
        subtitle="Monitor your API tests and execution schedules"
        showCreateButton={false}
        showQuickGuide={false}
        buttonTitle="Run Execution"
        onClickCreateNew={() => console.log("Create execution")}
        icon={LayoutDashboard}
        iconBgClass="bg-blue-100"
        iconColor="#136fb0"
        iconSize={40}
      />

      {/* Dashboard Content */}
      <div className='flex-1 overflow-auto mt-3'>
        {/* Stats Overview */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-3'>
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
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
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
    </div>
  );
}
