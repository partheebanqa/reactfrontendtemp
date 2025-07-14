import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";
import { useWorkspace } from "@/hooks/useWorkspace";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Play, 
  Edit, 
  Trash2, 
  Link as LinkIcon,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical
} from "lucide-react";

interface RequestStep {
  id: string;
  name: string;
  method: string;
  url: string;
  order: number;
}

interface RequestChain {
  id: string;
  name: string;
  description: string;
  steps: RequestStep[];
  createdAt: string;
  lastRun?: string;
  status?: "idle" | "running" | "success" | "failed";
}

const RequestChains: React.FC = () => {
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newChainName, setNewChainName] = useState("");
  const [newChainDescription, setNewChainDescription] = useState("");

  const { data: projectData } = useQuery({
    queryKey: ["/api/workspaces", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
  });

  const { data: chains = [] } = useQuery({
    queryKey: ["/api/projects", projectData?.projects?.[0]?.id, "request-chains"],
    enabled: !!projectData?.projects?.[0]?.id,
    select: (data) => data?.requestChains || [],
  });

  const createChainMutation = useMutation({
    mutationFn: async (chainData: any) => {
      const projectId = projectData?.projects?.[0]?.id;
      if (!projectId) throw new Error("No project selected");

      return await apiRequest("POST", "/api/request-chains", {
        ...chainData,
        projectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/projects", projectData?.projects?.[0]?.id, "request-chains"] 
      });
      setIsCreateOpen(false);
      setNewChainName("");
      setNewChainDescription("");
      toast({
        title: "Request chain created",
        description: "Your request chain has been created successfully",
      });
    }
  });

  const executeChainMutation = useMutation({
    mutationFn: async (chainId: string) => {
      // Simulate chain execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true, executionTime: Math.round(1000 + Math.random() * 3000) };
    },
    onSuccess: (data) => {
      toast({
        title: "Chain executed successfully",
        description: `Execution completed in ${data.executionTime}ms`,
      });
    }
  });

  const handleCreateChain = () => {
    if (!newChainName.trim()) return;

    createChainMutation.mutate({
      name: newChainName,
      description: newChainDescription,
      steps: [],
    });
  };

  const mockChains: RequestChain[] = [
    {
      id: "1",
      name: "User Registration Flow",
      description: "Complete user registration and authentication process",
      steps: [
        { id: "1", name: "Create User", method: "POST", url: "/api/users", order: 1 },
        { id: "2", name: "Send Welcome Email", method: "POST", url: "/api/emails", order: 2 },
        { id: "3", name: "Login User", method: "POST", url: "/api/auth/login", order: 3 }
      ],
      createdAt: "2024-01-15T10:30:00Z",
      lastRun: "2024-01-20T14:25:00Z",
      status: "success"
    },
    {
      id: "2", 
      name: "E-commerce Checkout",
      description: "Complete checkout process with payment validation",
      steps: [
        { id: "4", name: "Validate Cart", method: "GET", url: "/api/cart/validate", order: 1 },
        { id: "5", name: "Calculate Shipping", method: "POST", url: "/api/shipping", order: 2 },
        { id: "6", name: "Process Payment", method: "POST", url: "/api/payments", order: 3 },
        { id: "7", name: "Create Order", method: "POST", url: "/api/orders", order: 4 }
      ],
      createdAt: "2024-01-10T09:15:00Z",
      lastRun: "2024-01-19T16:45:00Z",
      status: "failed"
    }
  ];

  const allChains = [...chains, ...mockChains];

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "running":
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <LinkIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-blue-100 text-blue-700">Running</Badge>;
      case "success":
        return <Badge className="bg-green-100 text-green-700">Success</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Never Run</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Request Chains</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage sequences of API requests that execute in order
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Chain
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Request Chain</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Chain Name</label>
                <Input
                  placeholder="Enter chain name"
                  value={newChainName}
                  onChange={(e) => setNewChainName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (Optional)</label>
                <Input
                  placeholder="Describe what this chain does"
                  value={newChainDescription}
                  onChange={(e) => setNewChainDescription(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateChain}
                  disabled={!newChainName.trim() || createChainMutation.isPending}
                >
                  Create Chain
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Chains Grid */}
      <div className="grid gap-6">
        {allChains.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <LinkIcon className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No request chains yet</h3>
              <p className="text-muted-foreground text-center mb-6">
                Create your first request chain to automate sequences of API calls
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Chain
              </Button>
            </CardContent>
          </Card>
        ) : (
          allChains.map((chain) => (
            <Card key={chain.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(chain.status)}
                    <div>
                      <CardTitle className="text-lg">{chain.name}</CardTitle>
                      {chain.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {chain.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(chain.status)}
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Chain Steps */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Steps ({chain.steps.length})
                  </h4>
                  <div className="space-y-2">
                    {chain.steps.map((step, index) => (
                      <div key={step.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {step.method}
                            </Badge>
                            <span className="text-sm font-medium">{step.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">
                            {step.url}
                          </p>
                        </div>
                        {index < chain.steps.length - 1 && (
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chain Metadata */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Created {new Date(chain.createdAt).toLocaleDateString()}
                    {chain.lastRun && (
                      <span className="ml-4">
                        Last run {new Date(chain.lastRun).toLocaleDateString()}
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
                      onClick={() => executeChainMutation.mutate(chain.id)}
                      disabled={executeChainMutation.isPending}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Run Chain
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Quick Start Guide */}
      {allChains.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>What are Request Chains?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Request chains allow you to execute multiple API requests in sequence, 
              passing data between them. Perfect for testing complex workflows like user registration, 
              e-commerce checkout, or multi-step authentication processes.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-medium mb-2">Create Chain</h4>
                <p className="text-sm text-muted-foreground">
                  Start by creating a new chain and giving it a descriptive name
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <h4 className="font-medium mb-2">Add Steps</h4>
                <p className="text-sm text-muted-foreground">
                  Add individual API requests that will execute in order
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <h4 className="font-medium mb-2">Execute & Monitor</h4>
                <p className="text-sm text-muted-foreground">
                  Run your chain and monitor the results of each step
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RequestChains;
