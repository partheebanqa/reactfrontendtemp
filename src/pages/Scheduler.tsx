import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { apiRequest } from "@/lib/queryClient";
import ProtectedRoute from "@/components/ProtectedRoute";
import { 
  Plus, 
  Calendar, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Zap,
  Target
} from "lucide-react";

interface Schedule {
  id: string;
  name: string;
  cronExpression: string;
  targetType: "endpoint" | "suite" | "chain";
  targetName: string;
  isActive: boolean;
  createdAt: string;
  lastRun?: string;
  nextRun?: string;
  status?: "success" | "failed" | "running";
  executionCount?: number;
}

const Scheduler: React.FC = () => {
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: "",
    cronExpression: "0 9 * * 1-5", // 9 AM weekdays
    targetType: "endpoint" as const,
    targetId: "",
  });

  const { data: projectData } = useQuery({
    queryKey: ["/api/workspaces", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ["/api/projects", projectData?.projects?.[0]?.id, "schedules"],
    enabled: !!projectData?.projects?.[0]?.id,
    select: (data) => data?.schedules || [],
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (scheduleData: any) => {
      const projectId = projectData?.projects?.[0]?.id;
      if (!projectId) throw new Error("No project selected");

      return await apiRequest("POST", "/api/schedules", {
        ...scheduleData,
        projectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/projects", projectData?.projects?.[0]?.id, "schedules"] 
      });
      setIsCreateOpen(false);
      setNewSchedule({
        name: "",
        cronExpression: "0 9 * * 1-5",
        targetType: "endpoint",
        targetId: "",
      });
      toast({
        title: "Schedule created",
        description: "Your scheduled task has been created successfully",
      });
    }
  });

  const toggleScheduleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      // Simulate API call to toggle schedule
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Schedule updated",
        description: "Schedule status has been updated",
      });
    }
  });

  const handleCreateSchedule = () => {
    if (!newSchedule.name.trim() || !newSchedule.targetId) return;

    createScheduleMutation.mutate({
      name: newSchedule.name,
      cronExpression: newSchedule.cronExpression,
      targetType: newSchedule.targetType,
      targetId: newSchedule.targetId,
    });
  };

  const mockSchedules: Schedule[] = [
    {
      id: "1",
      name: "Daily User API Health Check",
      cronExpression: "0 9 * * 1-5",
      targetType: "endpoint",
      targetName: "GET /api/users/health",
      isActive: true,
      createdAt: "2024-01-15T10:30:00Z",
      lastRun: "2024-01-20T09:00:00Z",
      nextRun: "2024-01-21T09:00:00Z",
      status: "success",
      executionCount: 45
    },
    {
      id: "2",
      name: "Weekly Payment Test Suite",
      cronExpression: "0 10 * * 1",
      targetType: "suite",
      targetName: "Payment Processing Tests",
      isActive: true,
      createdAt: "2024-01-10T09:15:00Z",
      lastRun: "2024-01-15T10:00:00Z",
      nextRun: "2024-01-22T10:00:00Z",
      status: "failed",
      executionCount: 12
    },
    {
      id: "3",
      name: "E-commerce Integration Chain",
      cronExpression: "0 */4 * * *",
      targetType: "chain",
      targetName: "E-commerce Checkout Flow",
      isActive: false,
      createdAt: "2024-01-12T14:20:00Z",
      lastRun: "2024-01-19T16:00:00Z",
      nextRun: undefined,
      status: "success",
      executionCount: 78
    }
  ];

  const allSchedules = [...schedules, ...mockSchedules];

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "running":
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTargetIcon = (type: string) => {
    switch (type) {
      case "endpoint":
        return <Target className="w-4 h-4 text-blue-500" />;
      case "suite":
        return <Zap className="w-4 h-4 text-purple-500" />;
      case "chain":
        return <Calendar className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatCronExpression = (cron: string) => {
    // Basic cron expression formatting for display
    const expressions: Record<string, string> = {
      "0 9 * * 1-5": "Every weekday at 9:00 AM",
      "0 10 * * 1": "Every Monday at 10:00 AM", 
      "0 */4 * * *": "Every 4 hours",
      "0 0 * * *": "Daily at midnight",
      "0 12 * * *": "Daily at noon"
    };
    return expressions[cron] || cron;
  };

  return (
    <ProtectedRoute feature="scheduler">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Scheduler</h1>
            <p className="text-muted-foreground mt-1">
              Automate your API tests with scheduled executions
            </p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Schedule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Schedule Name</label>
                  <Input
                    placeholder="Enter schedule name"
                    value={newSchedule.name}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Target Type</label>
                  <Select 
                    value={newSchedule.targetType} 
                    onValueChange={(value: any) => setNewSchedule(prev => ({ ...prev, targetType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="endpoint">API Endpoint</SelectItem>
                      <SelectItem value="suite">Test Suite</SelectItem>
                      <SelectItem value="chain">Request Chain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Target</label>
                  <Select 
                    value={newSchedule.targetId} 
                    onValueChange={(value) => setNewSchedule(prev => ({ ...prev, targetId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target to schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="target1">User Health Check</SelectItem>
                      <SelectItem value="target2">Payment Processing</SelectItem>
                      <SelectItem value="target3">Authentication Flow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Schedule</label>
                  <Select 
                    value={newSchedule.cronExpression} 
                    onValueChange={(value) => setNewSchedule(prev => ({ ...prev, cronExpression: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0 9 * * 1-5">Every weekday at 9:00 AM</SelectItem>
                      <SelectItem value="0 12 * * *">Daily at noon</SelectItem>
                      <SelectItem value="0 */4 * * *">Every 4 hours</SelectItem>
                      <SelectItem value="0 10 * * 1">Every Monday at 10:00 AM</SelectItem>
                      <SelectItem value="0 0 * * *">Daily at midnight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateSchedule}
                    disabled={!newSchedule.name.trim() || !newSchedule.targetId || createScheduleMutation.isPending}
                  >
                    Create Schedule
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Overview Stats */}
        {allSchedules.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Schedules</p>
                    <p className="text-2xl font-bold">{allSchedules.length}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold text-green-600">
                      {allSchedules.filter(s => s.isActive).length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Next Run</p>
                    <p className="text-sm font-medium">
                      {allSchedules.find(s => s.isActive && s.nextRun)?.nextRun 
                        ? new Date(allSchedules.find(s => s.isActive && s.nextRun)!.nextRun!).toLocaleString()
                        : "None scheduled"
                      }
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
                    <p className="text-sm text-muted-foreground">Total Executions</p>
                    <p className="text-2xl font-bold">
                      {allSchedules.reduce((acc, schedule) => acc + (schedule.executionCount || 0), 0)}
                    </p>
                  </div>
                  <Play className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Schedules List */}
        <div className="space-y-4">
          {allSchedules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Calendar className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No schedules yet</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Create your first schedule to automate API test executions
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Schedule
                </Button>
              </CardContent>
            </Card>
          ) : (
            allSchedules.map((schedule) => (
              <Card key={schedule.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex items-center space-x-2">
                        {getTargetIcon(schedule.targetType)}
                        {getStatusIcon(schedule.status)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{schedule.name}</h3>
                          <Badge variant={schedule.isActive ? "default" : "secondary"}>
                            {schedule.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {schedule.targetType}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>Target: {schedule.targetName}</span>
                            <span>•</span>
                            <span>{formatCronExpression(schedule.cronExpression)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-6 text-sm">
                            {schedule.lastRun && (
                              <div>
                                <span className="text-muted-foreground">Last run: </span>
                                <span>{new Date(schedule.lastRun).toLocaleDateString()}</span>
                              </div>
                            )}
                            {schedule.nextRun && schedule.isActive && (
                              <div>
                                <span className="text-muted-foreground">Next run: </span>
                                <span>{new Date(schedule.nextRun).toLocaleDateString()}</span>
                              </div>
                            )}
                            {schedule.executionCount && (
                              <div>
                                <span className="text-muted-foreground">Executions: </span>
                                <span>{schedule.executionCount}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={schedule.isActive}
                        onCheckedChange={(checked) => 
                          toggleScheduleMutation.mutate({ id: schedule.id, isActive: checked })
                        }
                      />
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Help Section */}
        {allSchedules.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Schedule Your API Tests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Automated scheduling helps you run API tests regularly without manual intervention. 
                Perfect for monitoring API health, regression testing, and continuous validation.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <h4 className="font-medium mb-2">Flexible Scheduling</h4>
                  <p className="text-sm text-muted-foreground">
                    Use cron expressions or predefined schedules for flexible timing
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <h4 className="font-medium mb-2">Reliable Execution</h4>
                  <p className="text-sm text-muted-foreground">
                    Automated execution with notifications on success or failure
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                    <Zap className="w-4 h-4 text-purple-600" />
                  </div>
                  <h4 className="font-medium mb-2">Multiple Targets</h4>
                  <p className="text-sm text-muted-foreground">
                    Schedule individual endpoints, test suites, or request chains
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default Scheduler;
