import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useFeatureGate } from "@/contexts/FeatureGateContext";
import { useTrialManagement } from "@/hooks/useTrialManagement";
import FeatureGate from "@/components/FeatureGate";
import TrialStatusWidget from "@/components/TrialStatusWidget";
import { 
  BarChart3, 
  Play, 
  CheckCircle, 
  Calendar, 
  Search, 
  Bell, 
  Plus,
  Code,
  Upload,
  CalendarPlus,
  TrendingUp,
  Clock,
  AlertCircle,
  Star,
  Zap,
  Check
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { API_WORKSPACES } from "@/config/apiRoutes";

const Dashboard: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const { subscriptionPlan } = useFeatureGate();
  const { isTrialActive, canStartTrial } = useTrialManagement();

  const { data: projectData } = useQuery({
    queryKey: ["/workspaces"],
    enabled: !!currentWorkspace?.id,
    queryFn: async () => {
      const response = await apiRequest('GET', API_WORKSPACES)
      if (!response.ok) {
        throw new Error('Failed to fetch project data');
      }
      return response.json();
    }
  });
  console.log("🚀 ~ projectData:", projectData)

  const projects = projectData?.projects || [];

  // Mock stats - in real app, these would come from API
  const stats = {
    totalApis: projects.length * 12 || 247,
    testRuns: 1834,
    successRate: 94.2,
    activeSchedules: 12
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening with your APIs.
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search APIs, tests..."
              className="pl-10 w-64"
            />
          </div>
          
          {/* Notifications */}
          <Button variant="outline" size="icon" className="relative">
            <Bell className="w-4 h-4" />
            <Badge className="absolute -top-2 -right-2 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs">
              3
            </Badge>
          </Button>
          
          {/* New Test Button */}
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Test
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total APIs</p>
                <p className="text-3xl font-bold">{stats.totalApis}</p>
                <p className="text-sm text-green-600 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  12% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Code className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Test Runs</p>
                <p className="text-3xl font-bold">{stats.testRuns.toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  8% from last week
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Play className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
                <p className="text-3xl font-bold">{stats.successRate}%</p>
                <p className="text-sm text-green-600 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  2.1% improvement
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Schedules</p>
                <p className="text-3xl font-bold">{stats.activeSchedules}</p>
                <p className="text-sm text-muted-foreground mt-1 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Next run in 2h
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Test Execution Trends</CardTitle>
            <Select defaultValue="7days">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                <p>Chart visualization</p>
                <p className="text-sm">Real-time execution trends</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Executions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Executions</CardTitle>
            <Button variant="ghost" size="sm">View All</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">User Authentication API</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Passed
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">Payment Processing API</p>
                  <p className="text-xs text-muted-foreground">5 minutes ago</p>
                </div>
              </div>
              <Badge variant="destructive">
                Failed
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">Data Sync API Chain</p>
                  <p className="text-xs text-muted-foreground">Running...</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                In Progress
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 justify-start">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Create API Test</p>
                  <p className="text-sm text-muted-foreground">Build a new API test from scratch</p>
                </div>
              </div>
            </Button>

            <Button variant="outline" className="h-auto p-4 justify-start">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Upload className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Import Collection</p>
                  <p className="text-sm text-muted-foreground">Import Postman or OpenAPI specs</p>
                </div>
              </div>
            </Button>

            <FeatureGate feature="scheduler">
              <Button variant="outline" className="h-auto p-4 justify-start">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <CalendarPlus className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Schedule Test Run</p>
                    <p className="text-sm text-muted-foreground">Set up automated test execution</p>
                  </div>
                </div>
              </Button>
            </FeatureGate>
          </div>
        </CardContent>
      </Card>

      {/* Request Builder Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>API Request Builder</CardTitle>
          <Button variant="ghost">Open Builder</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* HTTP Method and URL */}
          <div className="flex space-x-4">
            <Select defaultValue="GET">
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
            <Input 
              placeholder="https://api.example.com/users" 
              defaultValue="https://jsonplaceholder.typicode.com/users"
              className="flex-1"
            />
            <Button>
              <Play className="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>

          {/* Headers Section */}
          <div className="space-y-3">
            <div className="border-b pb-2">
              <div className="flex space-x-8">
                <Button variant="ghost" className="text-primary border-b-2 border-primary">
                  Headers
                </Button>
                <Button variant="ghost">Body</Button>
                <Button variant="ghost">Tests</Button>
                <Button variant="ghost">Auth</Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Header Name" defaultValue="Content-Type" />
                <Input placeholder="Header Value" defaultValue="application/json" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Header Name" defaultValue="Authorization" />
                <Input placeholder="Header Value" defaultValue="Bearer {{token}}" />
              </div>
              <Button variant="ghost" size="sm">
                <Plus className="w-3 h-3 mr-1" />
                Add Header
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Gated Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pro Feature Card */}
        <FeatureGate feature="scheduler" showUpgrade={false}>
          <Card className="pro-gradient text-white">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-white">Advanced Scheduling</CardTitle>
                <p className="text-blue-100 mt-1">Automate your API tests with cron-based scheduling</p>
              </div>
              <Badge className="bg-white text-blue-600">PRO</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-blue-100">
                <Check className="w-4 h-4" />
                <span>Cron expression support</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-blue-100">
                <Check className="w-4 h-4" />
                <span>Email notifications on failure</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-blue-100">
                <Check className="w-4 h-4" />
                <span>Slack/Teams integration</span>
              </div>
              <Button variant="secondary" className="mt-4">
                Access Scheduler
              </Button>
            </CardContent>
          </Card>
        </FeatureGate>

        {/* Enterprise Feature Card */}
        <FeatureGate feature="cicd_integrations" showUpgrade={false}>
          <Card className="enterprise-gradient text-white">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-white">CI/CD Integration</CardTitle>
                <p className="text-purple-100 mt-1">Seamlessly integrate with your development pipeline</p>
              </div>
              <Badge className="bg-white text-purple-600">ENTERPRISE</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-purple-100">
                <Check className="w-4 h-4" />
                <span>Jenkins/GitHub Actions integration</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-purple-100">
                <Check className="w-4 h-4" />
                <span>GitLab CI/CD pipeline support</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-purple-100">
                <Check className="w-4 h-4" />
                <span>Custom webhook triggers</span>
              </div>
              <Button variant="secondary" className="mt-4">
                Setup CI/CD
              </Button>
            </CardContent>
          </Card>
        </FeatureGate>
      </div>
    </div>
  );
};

export default Dashboard;
