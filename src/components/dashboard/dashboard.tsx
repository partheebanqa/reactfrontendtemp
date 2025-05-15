import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../shared/ui/card";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, Clock, FileCheck, AlertTriangle, Send } from "lucide-react";
import { Link } from "wouter";
import { Button } from "../../shared/ui/button";

export default function Dashboard() {
  const { data: testRunsData, isLoading: isLoadingTestRuns } = useQuery({
    queryKey: ["/api/test-runs"],
  });

  const { data: collectionsData, isLoading: isLoadingCollections } = useQuery({
    queryKey: ["/api/collections"],
  });

  const { data: schedulesData, isLoading: isLoadingSchedules } = useQuery({
    queryKey: ["/api/schedules"],
  });

  // Calculate stats
  const totalCollections = collectionsData?.length || 0;
  const totalTestRuns = testRunsData?.length || 0;
  const activeSchedules = schedulesData?.filter((s:any) => s.isActive)?.length || 0;
  
  const successfulRuns = testRunsData?.filter((run:any) => run.status === "completed")?.length || 0;
  const failedRuns = testRunsData?.filter((run:any) => run.status === "failed")?.length || 0;
  const successRate = totalTestRuns > 0 ? Math.round((successfulRuns / totalTestRuns) * 100) : 0;

  // Chart data
  const chartData = [
    { name: "Success", value: successfulRuns },
    { name: "Failure", value: failedRuns },
  ];

  return (
    <div className="container py-6 px-4">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your API testing activities
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-muted-foreground" />
              <div className="text-2xl font-bold">{totalCollections}</div>
            </div>
            <Link href="/collections">
              <Button variant="link" className="mt-2 px-0">View all collections</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Test Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <div className="text-2xl font-bold">{totalTestRuns}</div>
            </div>
            <Link href="/reports">
              <Button variant="link" className="mt-2 px-0">View all test runs</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Schedules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div className="text-2xl font-bold">{activeSchedules}</div>
            </div>
            <Link href="/schedules">
              <Button variant="link" className="mt-2 px-0">Manage schedules</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {successRate >= 80 ? (
                <FileCheck className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
              <div className="text-2xl font-bold">{successRate}%</div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {totalTestRuns} total runs, {successfulRuns} successful
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Test Results</CardTitle>
            <CardDescription>Success vs. Failure rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {isLoadingTestRuns ? (
                <div className="flex h-full items-center justify-center">
                  <p>Loading chart data...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} >
                    <XAxis dataKey="name"/>
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--header-bg)',
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="hsl(var(--chart-1))" 
                      name="Test Results" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used operations</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link href="/collections">
              <Button className="w-full justify-start">
                <FileCheck className="mr-2 h-5 w-5" />
                Create New Collection
              </Button>
            </Link>
            <Link href="/api-tester">
              <Button className="w-full justify-start" variant="outline">
                <Send className="mr-2 h-5 w-5" />
                Test API Endpoint
              </Button>
            </Link>
            <Link href="/schedules">
              <Button className="w-full justify-start" variant="outline">
                <Clock className="mr-2 h-5 w-5" />
                Create Schedule
              </Button>
            </Link>
            <Link href="/reports">
              <Button className="w-full justify-start" variant="outline">
                <Activity className="mr-2 h-5 w-5" />
                View Latest Reports
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
