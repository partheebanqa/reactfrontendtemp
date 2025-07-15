import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Play, ListChecks, CheckCircle, Clock, Timer, Building2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import StatsCard from "./StatsCard";
import ExecutionChart from "./ExecutionChart";
import ActiveSchedules from "./ActiveSchedules";
import RecentExecutions from "./RecentExecutions";
import SystemStatus from "./SystemStatus";
import QuickActions from "./QuickActions";

export default function Dashboard() {
  const { currentWorkspace, workspaces, setCurrentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  
  const { data: stats, isLoading: statsLoading } = useQuery<{ totalSuites: number; successRate: number; activeSchedules: number; avgDuration: number }>({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!currentWorkspace,
  });

  return (
    <>
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
              <p className="text-sm text-slate-500">Monitor your API tests and execution schedules</p>
            </div>
            {!workspaceLoading && workspaces.length > 0 && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-500" />
                <Select
                  value={currentWorkspace?.id || ''}
                  onValueChange={(value) => {
                    const workspace = workspaces.find(w => w.id === value);
                    setCurrentWorkspace(workspace as any);
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaces.map((workspace) => (
                      <SelectItem key={workspace.id} value={workspace.id}>
                        {workspace.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-2" size={16} />
              New Test Suite
            </Button>
            <Button variant="outline">
              <Play className="mr-2" size={16} />
              Run Now
            </Button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Test Suites"
            value={statsLoading ? "..." : stats?.totalSuites || 0}
            icon={<ListChecks className="text-blue-600" size={20} />}
            change="+12%"
            changeType="positive"
            description="from last month"
            iconBgColor="bg-blue-100"
          />

          <StatsCard
            title="Success Rate"
            value={statsLoading ? "..." : `${stats?.successRate || 0}%`}
            icon={<CheckCircle className="text-green-600" size={20} />}
            change="+2.1%"
            changeType="positive"
            description="improvement"
            iconBgColor="bg-green-100"
          />

          <StatsCard
            title="Active Schedules"
            value={statsLoading ? "..." : stats?.activeSchedules || 0}
            icon={<Clock className="text-purple-600" size={20} />}
            description="Next run in 2h 15m"
            iconBgColor="bg-purple-100"
          />

          <StatsCard
            title="Avg Duration"
            value={statsLoading ? "..." : `${stats?.avgDuration || 0}s`}
            icon={<Timer className="text-orange-600" size={20} />}
            change="-0.3s"
            changeType="positive"
            description="faster"
            iconBgColor="bg-orange-100"
          />
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ExecutionChart />
          <RecentExecutions />
        </div>

        {/* Active Schedules and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ActiveSchedules />
          <div className="space-y-6">
            <QuickActions />
            <SystemStatus />
          </div>
        </div>
      </div>
    </>
  );
}
