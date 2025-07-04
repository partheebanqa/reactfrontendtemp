import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { apiRequest } from "@/lib/queryClient";
import ProtectedRoute from "@/components/ProtectedRoute";
import { 
  Play, 
  Square, 
  RefreshCw, 
  Eye, 
  Filter,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Activity,
  Timer,
  Download
} from "lucide-react";

interface Execution {
  id: string;
  type: "endpoint" | "suite" | "chain" | "scheduled";
  targetId: string;
  targetName: string;
  status: "running" | "passed" | "failed" | "error";
  startedAt: string;
  completedAt?: string;
  duration?: number;
  results: {
    totalRequests?: number;
    successfulRequests?: number;
    failedRequests?: number;
    averageResponseTime?: number;
  };
  error?: string;
  executedBy: string;
}

const Executions: React.FC = () => {
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data: projectData } = useQuery({
    queryKey: ["/api/workspaces", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
  });

  const { data: executions = [], isLoading } = useQuery({
    queryKey: ["/api/projects", projectData?.projects?.[0]?.id, "executions"],
    enabled: !!projectData?.projects?.[0]?.id,
    select: (data) => data?.executions || [],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  const stopExecutionMutation = useMutation({
    mutationFn: async (executionId: string) => {
      return await apiRequest("PATCH", `/api/executions/${executionId}`, {
        status: "error",
        completedAt: new Date().toISOString(),
        error: "Execution stopped by user"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/projects", projectData?.projects?.[0]?.id, "executions"] 
      });
      toast({
        title: "Execution stopped",
        description: "The execution has been stopped successfully",
      });
    }
  });

  const retryExecutionMutation = useMutation({
    mutationFn: async (execution: Execution) => {
      return await apiRequest("POST", "/api/executions", {
        type: execution.type,
        targetId: execution.targetId,
        projectId: projectData?.projects?.[0]?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/projects", projectData?.projects?.[0]?.id, "executions"] 
      });
      toast({
        title: "Execution restarted",
        description: "A new execution has been started",
      });
    }
  });

  // Mock executions for demonstration
  const mockExecutions: Execution[] = [
    {
      id: "1",
      type: "endpoint",
      targetId: "endpoint-1",
      targetName: "User Authentication API",
      status: "passed",
      startedAt: "2024-01-20T14:25:00Z",
      completedAt: "2024-01-20T14:25:02Z",
      duration: 2150,
      results: {
        totalRequests: 1,
        successfulRequests: 1,
        failedRequests: 0,
        averageResponseTime: 245
      },
      executedBy: "John Developer"
    },
    {
      id: "2",
      type: "suite",
      targetId: "suite-1",
      targetName: "Payment Processing Tests",
      status: "failed",
      startedAt: "2024-01-20T14:20:00Z",
      completedAt: "2024-01-20T14:21:30Z",
      duration: 90000,
      results: {
        totalRequests: 8,
        successfulRequests: 6,
        failedRequests: 2,
        averageResponseTime: 1250
      },
      error: "Payment API timeout error",
      executedBy: "Jane Tester"
    },
    {
      id: "3",
      type: "chain",
      targetId: "chain-1",
      targetName: "User Registration Flow",
      status: "running",
      startedAt: "2024-01-20T14:30:00Z",
      duration: undefined,
      results: {
        totalRequests: 3,
        successfulRequests: 2,
        failedRequests: 0
      },
      executedBy: "System"
    },
    {
      id: "4",
      type: "scheduled",
      targetId: "schedule-1", 
      targetName: "Daily Health Check",
      status: "passed",
      startedAt: "2024-01-20T09:00:00Z",
      completedAt: "2024-01-20T09:00:15Z",
      duration: 15000,
      results: {
        totalRequests: 5,
        successfulRequests: 5,
        failedRequests: 0,
        averageResponseTime: 180
      },
      executedBy: "Scheduler"
    }
  ];

  const allExecutions = [...executions, ...mockExecutions];

  const filteredExecutions = allExecutions.filter(execution => {
    const matchesStatus = statusFilter === "all" || execution.status === statusFilter;
    const matchesType = typeFilter === "all" || execution.type === typeFilter;
    const matchesSearch = execution.targetName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case "passed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-blue-100 text-blue-700">Running</Badge>;
      case "passed":
        return <Badge className="bg-green-100 text-green-700">Passed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "endpoint":
        return "🎯";
      case "suite":
        return "📋";
      case "chain":
        return "🔗";
      case "scheduled":
        return "⏰";
      default:
        return "🔧";
    }
  };

  const formatDuration = (milliseconds?: number) => {
    if (!milliseconds) return "N/A";
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const calculateSuccessRate = (results: Execution['results']) => {
    if (!results.totalRequests) return 0;
    return Math.round((results.successfulRequests! / results.totalRequests) * 100);
  };

  const openExecutionDetails = (execution: Execution) => {
    setSelectedExecution(execution);
    setIsDetailsOpen(true);
  };

  return (
    <ProtectedRoute feature="executions">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Executions</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and manage all your API test executions
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Executions</p>
                  <p className="text-2xl font-bold">{allExecutions.length}</p>
                </div>
                <Activity className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Running</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {allExecutions.filter(e => e.status === "running").length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {Math.round(
                      allExecutions.filter(e => e.status === "passed").length / 
                      allExecutions.filter(e => e.status !== "running").length * 100
                    )}%
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
                  <p className="text-sm text-muted-foreground">Avg Duration</p>
                  <p className="text-2xl font-bold">
                    {formatDuration(
                      allExecutions.reduce((acc, e) => acc + (e.duration || 0), 0) / 
                      allExecutions.filter(e => e.duration).length
                    )}
                  </p>
                </div>
                <Timer className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search executions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="endpoint">Endpoint</SelectItem>
                  <SelectItem value="suite">Test Suite</SelectItem>
                  <SelectItem value="chain">Request Chain</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Executions List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p>Loading executions...</p>
                </div>
              </CardContent>
            </Card>
          ) : filteredExecutions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Activity className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No executions found</h3>
                <p className="text-muted-foreground text-center">
                  {searchTerm || statusFilter !== "all" || typeFilter !== "all" 
                    ? "Try adjusting your filters" 
                    : "Execute your first API test to see results here"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredExecutions.map((execution) => (
              <Card key={execution.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="text-2xl">{getTypeIcon(execution.type)}</div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{execution.targetName}</h3>
                          {getStatusBadge(execution.status)}
                          <Badge variant="outline" className="capitalize">
                            {execution.type}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(execution.status)}
                            <span>Started {new Date(execution.startedAt).toLocaleString()}</span>
                          </div>
                          
                          {execution.duration && (
                            <div>Duration: {formatDuration(execution.duration)}</div>
                          )}
                          
                          <div>By: {execution.executedBy}</div>
                          
                          {execution.results.totalRequests && (
                            <div>
                              {execution.results.successfulRequests}/{execution.results.totalRequests} passed
                              ({calculateSuccessRate(execution.results)}%)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openExecutionDetails(execution)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Details
                      </Button>
                      
                      {execution.status === "running" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => stopExecutionMutation.mutate(execution.id)}
                        >
                          <Square className="w-4 h-4 mr-2" />
                          Stop
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => retryExecutionMutation.mutate(execution)}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Execution Details Modal */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Execution Details</DialogTitle>
            </DialogHeader>
            
            {selectedExecution && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Basic Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Target:</strong> {selectedExecution.targetName}</div>
                      <div><strong>Type:</strong> {selectedExecution.type}</div>
                      <div><strong>Status:</strong> {getStatusBadge(selectedExecution.status)}</div>
                      <div><strong>Executed by:</strong> {selectedExecution.executedBy}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Timing</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Started:</strong> {new Date(selectedExecution.startedAt).toLocaleString()}</div>
                      {selectedExecution.completedAt && (
                        <div><strong>Completed:</strong> {new Date(selectedExecution.completedAt).toLocaleString()}</div>
                      )}
                      <div><strong>Duration:</strong> {formatDuration(selectedExecution.duration)}</div>
                    </div>
                  </div>
                </div>
                
                {selectedExecution.results && (
                  <div>
                    <h4 className="font-semibold mb-2">Results</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <div className="text-2xl font-bold">{selectedExecution.results.totalRequests || 0}</div>
                        <div className="text-xs text-muted-foreground">Total Requests</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">{selectedExecution.results.successfulRequests || 0}</div>
                        <div className="text-xs text-muted-foreground">Successful</div>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg text-center">
                        <div className="text-2xl font-bold text-red-600">{selectedExecution.results.failedRequests || 0}</div>
                        <div className="text-xs text-muted-foreground">Failed</div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">{selectedExecution.results.averageResponseTime || 0}ms</div>
                        <div className="text-xs text-muted-foreground">Avg Response</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedExecution.error && (
                  <div>
                    <h4 className="font-semibold mb-2">Error Details</h4>
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <code className="text-sm text-red-800">{selectedExecution.error}</code>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
};

export default Executions;
