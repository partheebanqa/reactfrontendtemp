import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkspace } from "@/hooks/useWorkspace";
import ProtectedRoute from "@/components/ProtectedRoute";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Download, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  Target,
  Zap,
  FileText
} from "lucide-react";

interface ReportMetric {
  label: string;
  value: string | number;
  change?: {
    value: number;
    trend: "up" | "down";
    period: string;
  };
  icon: React.ReactNode;
  color: string;
}

interface ExecutionTrend {
  date: string;
  total: number;
  passed: number;
  failed: number;
  successRate: number;
}

interface TestMetrics {
  endpoint: string;
  executions: number;
  successRate: number;
  avgResponseTime: number;
  lastRun: string;
  status: "healthy" | "warning" | "critical";
}

const Reports: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const [timeRange, setTimeRange] = useState("7d");
  const [reportType, setReportType] = useState("overview");

  const { data: projectData } = useQuery({
    queryKey: ["/api/workspaces", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
  });

  // Mock data for demonstration
  const overviewMetrics: ReportMetric[] = [
    {
      label: "Total Executions",
      value: "1,247",
      change: { value: 12.5, trend: "up", period: "vs last week" },
      icon: <Activity className="w-5 h-5" />,
      color: "text-blue-600"
    },
    {
      label: "Success Rate",
      value: "94.2%",
      change: { value: 2.1, trend: "up", period: "vs last week" },
      icon: <CheckCircle className="w-5 h-5" />,
      color: "text-green-600"
    },
    {
      label: "Avg Response Time",
      value: "245ms",
      change: { value: 15.3, trend: "down", period: "vs last week" },
      icon: <Clock className="w-5 h-5" />,
      color: "text-purple-600"
    },
    {
      label: "Active Endpoints",
      value: 47,
      change: { value: 8.2, trend: "up", period: "vs last week" },
      icon: <Target className="w-5 h-5" />,
      color: "text-orange-600"
    }
  ];

  const executionTrends: ExecutionTrend[] = [
    { date: "2024-01-14", total: 45, passed: 42, failed: 3, successRate: 93.3 },
    { date: "2024-01-15", total: 52, passed: 49, failed: 3, successRate: 94.2 },
    { date: "2024-01-16", total: 38, passed: 36, failed: 2, successRate: 94.7 },
    { date: "2024-01-17", total: 61, passed: 58, failed: 3, successRate: 95.1 },
    { date: "2024-01-18", total: 44, passed: 41, failed: 3, successRate: 93.2 },
    { date: "2024-01-19", total: 55, passed: 52, failed: 3, successRate: 94.5 },
    { date: "2024-01-20", total: 49, passed: 47, failed: 2, successRate: 95.9 }
  ];

  const testMetrics: TestMetrics[] = [
    {
      endpoint: "GET /api/users",
      executions: 156,
      successRate: 98.7,
      avgResponseTime: 180,
      lastRun: "2024-01-20T14:25:00Z",
      status: "healthy"
    },
    {
      endpoint: "POST /api/auth/login",
      executions: 89,
      successRate: 96.6,
      avgResponseTime: 245,
      lastRun: "2024-01-20T14:20:00Z",
      status: "healthy"
    },
    {
      endpoint: "POST /api/payments",
      executions: 67,
      successRate: 87.3,
      avgResponseTime: 1250,
      lastRun: "2024-01-20T14:15:00Z",
      status: "warning"
    },
    {
      endpoint: "GET /api/products",
      executions: 134,
      successRate: 78.4,
      avgResponseTime: 890,
      lastRun: "2024-01-20T14:10:00Z",
      status: "critical"
    },
    {
      endpoint: "PUT /api/users/:id",
      executions: 45,
      successRate: 95.6,
      avgResponseTime: 320,
      lastRun: "2024-01-20T14:05:00Z",
      status: "healthy"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-100 text-green-700">Healthy</Badge>;
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-700">Warning</Badge>;
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getTrendIcon = (trend: "up" | "down") => {
    return trend === "up" ? 
      <TrendingUp className="w-4 h-4 text-green-600" /> :
      <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const exportReport = () => {
    // Simulate report export
    const reportData = {
      timeRange,
      reportType,
      generatedAt: new Date().toISOString(),
      metrics: overviewMetrics,
      trends: executionTrends,
      testMetrics
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-test-report-${timeRange}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <ProtectedRoute feature="reports">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive insights into your API testing performance
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={exportReport}>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {overviewMetrics.map((metric, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                    <p className="text-3xl font-bold">{metric.value}</p>
                    {metric.change && (
                      <div className="flex items-center space-x-1 mt-2">
                        {getTrendIcon(metric.change.trend)}
                        <span className={`text-sm ${metric.change.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                          {metric.change.value}% {metric.change.period}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={`w-12 h-12 rounded-lg bg-opacity-10 flex items-center justify-center ${metric.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                    <div className={metric.color}>
                      {metric.icon}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={reportType} onValueChange={setReportType}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="reliability">Reliability</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Execution Trends Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Execution Trends</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                      <p>Chart visualization</p>
                      <p className="text-sm">Daily execution trends</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Success Rate Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Success Rate Trends</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                      <p>Success rate chart</p>
                      <p className="text-sm">Success percentage over time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">156</div>
                    <div className="text-sm text-muted-foreground">Total Tests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">89.3%</div>
                    <div className="text-sm text-muted-foreground">Avg Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">485ms</div>
                    <div className="text-sm text-muted-foreground">Avg Response Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">12</div>
                    <div className="text-sm text-muted-foreground">Active Schedules</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Execution History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {executionTrends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm font-medium">
                          {new Date(trend.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center space-x-6 text-sm">
                          <span>Total: {trend.total}</span>
                          <span className="text-green-600">Passed: {trend.passed}</span>
                          <span className="text-red-600">Failed: {trend.failed}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={trend.successRate >= 95 ? "bg-green-100 text-green-700" : trend.successRate >= 90 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}>
                          {trend.successRate}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Endpoint Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testMetrics.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4 flex-1">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {metric.endpoint}
                        </code>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{metric.executions} runs</span>
                          <span>{metric.avgResponseTime}ms avg</span>
                          <span>Last: {new Date(metric.lastRun).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-sm font-medium">{metric.successRate}%</div>
                          <div className="text-xs text-muted-foreground">Success Rate</div>
                        </div>
                        {getStatusBadge(metric.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reliability Tab */}
          <TabsContent value="reliability" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Reliability Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">94.2%</div>
                    <p className="text-muted-foreground">Overall API Reliability</p>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uptime</span>
                        <span className="font-medium">99.8%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Response Time SLA</span>
                        <span className="font-medium">96.4%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Error Rate</span>
                        <span className="font-medium">0.3%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Health Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Healthy Endpoints</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">34/47</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Warning Status</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm font-medium">9/47</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Critical Issues</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm font-medium">4/47</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Issues */}
            <Card>
              <CardHeader>
                <CardTitle>Critical Issues Requiring Attention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 border-l-4 border-red-500 bg-red-50">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <div className="flex-1">
                      <div className="font-medium">GET /api/products - High failure rate</div>
                      <div className="text-sm text-muted-foreground">Success rate: 78.4% (below 80% threshold)</div>
                    </div>
                    <Badge variant="destructive">Critical</Badge>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 border-l-4 border-yellow-500 bg-yellow-50">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <div className="flex-1">
                      <div className="font-medium">POST /api/payments - Slow response time</div>
                      <div className="text-sm text-muted-foreground">Average: 1250ms (exceeds 1000ms threshold)</div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-700">Warning</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
};

export default Reports;
