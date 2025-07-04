import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Play, 
  Edit, 
  Trash2, 
  FlaskConical,
  CheckCircle,
  AlertCircle,
  Clock,
  MoreVertical,
  FileText,
  TrendingUp
} from "lucide-react";

interface TestCase {
  id: string;
  name: string;
  endpoint: string;
  method: string;
  assertions: number;
  status?: "passed" | "failed" | "skipped";
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  testCases: TestCase[];
  createdAt: string;
  lastRun?: string;
  passRate?: number;
  totalRuns?: number;
}

const TestSuites: React.FC = () => {
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSuiteName, setNewSuiteName] = useState("");
  const [newSuiteDescription, setNewSuiteDescription] = useState("");

  const { data: projectData } = useQuery({
    queryKey: ["/api/workspaces", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
  });

  const { data: testSuites = [] } = useQuery({
    queryKey: ["/api/projects", projectData?.projects?.[0]?.id, "test-suites"],
    enabled: !!projectData?.projects?.[0]?.id,
    select: (data) => data?.testSuites || [],
  });

  const createSuiteMutation = useMutation({
    mutationFn: async (suiteData: any) => {
      const projectId = projectData?.projects?.[0]?.id;
      if (!projectId) throw new Error("No project selected");

      return await apiRequest("POST", "/api/test-suites", {
        ...suiteData,
        projectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/projects", projectData?.projects?.[0]?.id, "test-suites"] 
      });
      setIsCreateOpen(false);
      setNewSuiteName("");
      setNewSuiteDescription("");
      toast({
        title: "Test suite created",
        description: "Your test suite has been created successfully",
      });
    }
  });

  const runSuiteMutation = useMutation({
    mutationFn: async (suiteId: string) => {
      // Simulate test suite execution
      await new Promise(resolve => setTimeout(resolve, 3000));
      const passRate = 75 + Math.random() * 25;
      return { success: true, passRate: Math.round(passRate * 10) / 10 };
    },
    onSuccess: (data) => {
      toast({
        title: "Test suite completed",
        description: `Pass rate: ${data.passRate}%`,
      });
    }
  });

  const handleCreateSuite = () => {
    if (!newSuiteName.trim()) return;

    createSuiteMutation.mutate({
      name: newSuiteName,
      description: newSuiteDescription,
    });
  };

  const mockSuites: TestSuite[] = [
    {
      id: "1",
      name: "User Management API",
      description: "Tests for user registration, authentication, and profile management",
      testCases: [
        { id: "1", name: "Create User", endpoint: "/api/users", method: "POST", assertions: 5, status: "passed" },
        { id: "2", name: "Get User Profile", endpoint: "/api/users/:id", method: "GET", assertions: 3, status: "passed" },
        { id: "3", name: "Update Profile", endpoint: "/api/users/:id", method: "PUT", assertions: 4, status: "failed" },
        { id: "4", name: "Delete User", endpoint: "/api/users/:id", method: "DELETE", assertions: 2, status: "passed" }
      ],
      createdAt: "2024-01-15T10:30:00Z",
      lastRun: "2024-01-20T14:25:00Z",
      passRate: 87.5,
      totalRuns: 156
    },
    {
      id: "2",
      name: "Payment Processing",
      description: "Comprehensive tests for payment gateway integration",
      testCases: [
        { id: "5", name: "Process Payment", endpoint: "/api/payments", method: "POST", assertions: 8, status: "passed" },
        { id: "6", name: "Refund Payment", endpoint: "/api/payments/refund", method: "POST", assertions: 6, status: "passed" },
        { id: "7", name: "Payment Status", endpoint: "/api/payments/:id", method: "GET", assertions: 3, status: "passed" }
      ],
      createdAt: "2024-01-10T09:15:00Z",
      lastRun: "2024-01-19T16:45:00Z",
      passRate: 94.2,
      totalRuns: 89
    }
  ];

  const allSuites = [...testSuites, ...mockSuites];

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "skipped":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <FlaskConical className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPassRateColor = (rate?: number) => {
    if (!rate) return "text-gray-500";
    if (rate >= 90) return "text-green-600";
    if (rate >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test Suites</h1>
          <p className="text-muted-foreground mt-1">
            Organize and run collections of API tests together
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Suite
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Test Suite</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Suite Name</label>
                <Input
                  placeholder="Enter suite name"
                  value={newSuiteName}
                  onChange={(e) => setNewSuiteName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (Optional)</label>
                <Input
                  placeholder="Describe what this suite tests"
                  value={newSuiteDescription}
                  onChange={(e) => setNewSuiteDescription(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateSuite}
                  disabled={!newSuiteName.trim() || createSuiteMutation.isPending}
                >
                  Create Suite
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Stats */}
      {allSuites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Suites</p>
                  <p className="text-2xl font-bold">{allSuites.length}</p>
                </div>
                <FlaskConical className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Test Cases</p>
                  <p className="text-2xl font-bold">
                    {allSuites.reduce((acc, suite) => acc + suite.testCases.length, 0)}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Pass Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {Math.round(allSuites.reduce((acc, suite) => acc + (suite.passRate || 0), 0) / allSuites.length)}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Runs</p>
                  <p className="text-2xl font-bold">
                    {allSuites.reduce((acc, suite) => acc + (suite.totalRuns || 0), 0)}
                  </p>
                </div>
                <Play className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Test Suites Grid */}
      <div className="grid gap-6">
        {allSuites.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FlaskConical className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No test suites yet</h3>
              <p className="text-muted-foreground text-center mb-6">
                Create your first test suite to organize and run collections of API tests
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Suite
              </Button>
            </CardContent>
          </Card>
        ) : (
          allSuites.map((suite) => (
            <Card key={suite.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <FlaskConical className="w-6 h-6 text-primary mt-1" />
                    <div>
                      <CardTitle className="text-lg">{suite.name}</CardTitle>
                      {suite.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {suite.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {suite.passRate && (
                      <Badge className={`${getPassRateColor(suite.passRate)} bg-transparent border`}>
                        {suite.passRate}% Pass Rate
                      </Badge>
                    )}
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Test Cases */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Test Cases ({suite.testCases.length})
                  </h4>
                  <div className="space-y-2">
                    {suite.testCases.slice(0, 4).map((testCase) => (
                      <div key={testCase.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(testCase.status)}
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">{testCase.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {testCase.method}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground font-mono">
                              {testCase.endpoint}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {testCase.assertions} assertions
                        </div>
                      </div>
                    ))}
                    {suite.testCases.length > 4 && (
                      <div className="text-center py-2">
                        <Button variant="ghost" size="sm">
                          View {suite.testCases.length - 4} more tests
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Suite Stats */}
                {suite.totalRuns && (
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-lg font-semibold">{suite.totalRuns}</p>
                      <p className="text-xs text-muted-foreground">Total Runs</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-lg font-semibold ${getPassRateColor(suite.passRate)}`}>
                        {suite.passRate}%
                      </p>
                      <p className="text-xs text-muted-foreground">Pass Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold">{suite.testCases.length}</p>
                      <p className="text-xs text-muted-foreground">Test Cases</p>
                    </div>
                  </div>
                )}

                {/* Suite Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Created {new Date(suite.createdAt).toLocaleDateString()}
                    {suite.lastRun && (
                      <span className="ml-4">
                        Last run {new Date(suite.lastRun).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => runSuiteMutation.mutate(suite.id)}
                      disabled={runSuiteMutation.isPending}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Run Suite
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Getting Started Guide */}
      {allSuites.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Getting Started with Test Suites</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Test suites help you organize related API tests and run them together. 
              Perfect for testing complete features, user journeys, or API modules.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <FlaskConical className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="font-medium mb-2">Organize Tests</h4>
                <p className="text-sm text-muted-foreground">
                  Group related API tests into logical collections
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <Play className="w-4 h-4 text-green-600" />
                </div>
                <h4 className="font-medium mb-2">Run Together</h4>
                <p className="text-sm text-muted-foreground">
                  Execute all tests in a suite with a single click
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <h4 className="font-medium mb-2">Track Progress</h4>
                <p className="text-sm text-muted-foreground">
                  Monitor pass rates and test reliability over time
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TestSuites;
