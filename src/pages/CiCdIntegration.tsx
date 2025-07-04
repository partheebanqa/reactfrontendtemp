import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Infinity, 
  Settings, 
  Trash2, 
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  Key,
  Webhook,
  GitBranch,
  Zap
} from "lucide-react";

interface CiCdIntegration {
  id: string;
  name: string;
  type: "jenkins" | "github" | "gitlab";
  config: {
    serverUrl?: string;
    username?: string;
    token?: string;
    projectPath?: string;
    webhookUrl?: string;
  };
  isActive: boolean;
  createdAt: string;
  lastUsed?: string;
  triggerCount?: number;
  status?: "connected" | "error" | "pending";
}

const CiCdIntegration: React.FC = () => {
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<"jenkins" | "github" | "gitlab">("github");
  const [newIntegration, setNewIntegration] = useState({
    name: "",
    serverUrl: "",
    username: "",
    token: "",
    projectPath: "",
  });

  const { data: integrations = [] } = useQuery({
    queryKey: ["/api/cicd-integrations", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
  });

  const createIntegrationMutation = useMutation({
    mutationFn: async (integrationData: any) => {
      return await apiRequest("POST", "/api/cicd-integrations", {
        ...integrationData,
        workspaceId: currentWorkspace?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/cicd-integrations", currentWorkspace?.id] 
      });
      setIsCreateOpen(false);
      resetForm();
      toast({
        title: "Integration created",
        description: "Your CI/CD integration has been created successfully",
      });
    }
  });

  const toggleIntegrationMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      // Simulate API call to toggle integration
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Integration updated",
        description: "Integration status has been updated",
      });
    }
  });

  const resetForm = () => {
    setNewIntegration({
      name: "",
      serverUrl: "",
      username: "",
      token: "",
      projectPath: "",
    });
    setSelectedType("github");
  };

  const handleCreateIntegration = () => {
    if (!newIntegration.name.trim()) return;

    const config: any = {};
    
    if (selectedType === "jenkins") {
      config.serverUrl = newIntegration.serverUrl;
      config.username = newIntegration.username;
      config.token = newIntegration.token;
    } else if (selectedType === "github") {
      config.token = newIntegration.token;
      config.projectPath = newIntegration.projectPath;
    } else if (selectedType === "gitlab") {
      config.serverUrl = newIntegration.serverUrl || "https://gitlab.com";
      config.token = newIntegration.token;
      config.projectPath = newIntegration.projectPath;
    }

    createIntegrationMutation.mutate({
      name: newIntegration.name,
      type: selectedType,
      config,
    });
  };

  const mockIntegrations: CiCdIntegration[] = [
    {
      id: "1",
      name: "Main Jenkins Pipeline",
      type: "jenkins",
      config: {
        serverUrl: "https://jenkins.company.com",
        username: "api-user",
        webhookUrl: "https://jenkins.company.com/buildByToken/build?job=api-tests"
      },
      isActive: true,
      createdAt: "2024-01-15T10:30:00Z",
      lastUsed: "2024-01-20T14:25:00Z",
      triggerCount: 45,
      status: "connected"
    },
    {
      id: "2",
      name: "Frontend Repo Actions",
      type: "github",
      config: {
        projectPath: "company/frontend-app",
        webhookUrl: "https://api.github.com/repos/company/frontend-app/dispatches"
      },
      isActive: true,
      createdAt: "2024-01-10T09:15:00Z",
      lastUsed: "2024-01-19T16:45:00Z",
      triggerCount: 23,
      status: "connected"
    },
    {
      id: "3",
      name: "Backend GitLab CI",
      type: "gitlab",
      config: {
        serverUrl: "https://gitlab.company.com",
        projectPath: "backend/api-service",
        webhookUrl: "https://gitlab.company.com/api/v4/projects/123/trigger/pipeline"
      },
      isActive: false,
      createdAt: "2024-01-12T14:20:00Z",
      status: "error"
    }
  ];

  const allIntegrations = [...integrations, ...mockIntegrations];

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case "jenkins":
        return <Zap className="w-5 h-5 text-blue-600" />;
      case "github":
        return <GitBranch className="w-5 h-5 text-gray-800" />;
      case "gitlab":
        return <GitBranch className="w-5 h-5 text-orange-600" />;
      default:
        return <Infinity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status?: string, isActive?: boolean) => {
    if (!isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    switch (status) {
      case "connected":
        return <Badge className="bg-green-100 text-green-700">Connected</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const copyWebhookUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied to clipboard",
      description: "Webhook URL has been copied",
    });
  };

  const getSetupInstructions = (type: string) => {
    switch (type) {
      case "jenkins":
        return "Configure Jenkins with your server URL, username, and API token";
      case "github":
        return "Add GitHub personal access token and repository path";
      case "gitlab":
        return "Configure GitLab with server URL, project path, and access token";
      default:
        return "";
    }
  };

  return (
    <ProtectedRoute feature="cicd_integrations" roles={["org_admin"]}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">CI/CD Integration</h1>
            <p className="text-muted-foreground mt-1">
              Connect your development pipeline to automatically trigger API tests
            </p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Integration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add CI/CD Integration</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium">Integration Type</label>
                  <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="github">GitHub Actions</SelectItem>
                      <SelectItem value="gitlab">GitLab CI/CD</SelectItem>
                      <SelectItem value="jenkins">Jenkins</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getSetupInstructions(selectedType)}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Integration Name</label>
                  <Input
                    placeholder="Enter a descriptive name"
                    value={newIntegration.name}
                    onChange={(e) => setNewIntegration(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                {selectedType === "jenkins" && (
                  <>
                    <div>
                      <label className="text-sm font-medium">Jenkins Server URL</label>
                      <Input
                        placeholder="https://jenkins.company.com"
                        value={newIntegration.serverUrl}
                        onChange={(e) => setNewIntegration(prev => ({ ...prev, serverUrl: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Username</label>
                      <Input
                        placeholder="jenkins-user"
                        value={newIntegration.username}
                        onChange={(e) => setNewIntegration(prev => ({ ...prev, username: e.target.value }))}
                      />
                    </div>
                  </>
                )}

                {selectedType === "gitlab" && (
                  <>
                    <div>
                      <label className="text-sm font-medium">GitLab Server URL</label>
                      <Input
                        placeholder="https://gitlab.com"
                        value={newIntegration.serverUrl}
                        onChange={(e) => setNewIntegration(prev => ({ ...prev, serverUrl: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Project Path</label>
                      <Input
                        placeholder="group/project-name"
                        value={newIntegration.projectPath}
                        onChange={(e) => setNewIntegration(prev => ({ ...prev, projectPath: e.target.value }))}
                      />
                    </div>
                  </>
                )}

                {selectedType === "github" && (
                  <div>
                    <label className="text-sm font-medium">Repository Path</label>
                    <Input
                      placeholder="owner/repository-name"
                      value={newIntegration.projectPath}
                      onChange={(e) => setNewIntegration(prev => ({ ...prev, projectPath: e.target.value }))}
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">
                    {selectedType === "jenkins" ? "API Token" : "Access Token"}
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter your access token"
                    value={newIntegration.token}
                    onChange={(e) => setNewIntegration(prev => ({ ...prev, token: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This token will be encrypted and stored securely
                  </p>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateIntegration}
                    disabled={!newIntegration.name.trim() || !newIntegration.token.trim() || createIntegrationMutation.isPending}
                  >
                    Create Integration
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Overview Stats */}
        {allIntegrations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Integrations</p>
                    <p className="text-2xl font-bold">{allIntegrations.length}</p>
                  </div>
                  <Infinity className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold text-green-600">
                      {allIntegrations.filter(i => i.isActive).length}
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
                    <p className="text-sm text-muted-foreground">Total Triggers</p>
                    <p className="text-2xl font-bold">
                      {allIntegrations.reduce((acc, integration) => acc + (integration.triggerCount || 0), 0)}
                    </p>
                  </div>
                  <Webhook className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Connected</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {allIntegrations.filter(i => i.status === "connected").length}
                    </p>
                  </div>
                  <Zap className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Integrations List */}
        <div className="space-y-4">
          {allIntegrations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Infinity className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No CI/CD integrations yet</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Connect your development pipeline to automatically trigger API tests on code changes
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Integration
                </Button>
              </CardContent>
            </Card>
          ) : (
            allIntegrations.map((integration) => (
              <Card key={integration.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100">
                        {getIntegrationIcon(integration.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{integration.name}</h3>
                          {getStatusBadge(integration.status, integration.isActive)}
                          <Badge variant="outline" className="capitalize">
                            {integration.type}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          {integration.config.serverUrl && (
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <span>Server: {integration.config.serverUrl}</span>
                              <ExternalLink className="w-3 h-3" />
                            </div>
                          )}
                          
                          {integration.config.projectPath && (
                            <div className="text-sm text-muted-foreground">
                              Project: {integration.config.projectPath}
                            </div>
                          )}
                          
                          {integration.config.webhookUrl && (
                            <div className="flex items-center space-x-2 text-sm">
                              <span className="text-muted-foreground">Webhook:</span>
                              <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                                {integration.config.webhookUrl.substring(0, 50)}...
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyWebhookUrl(integration.config.webhookUrl!)}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-6 text-sm">
                            <div>
                              <span className="text-muted-foreground">Created: </span>
                              <span>{new Date(integration.createdAt).toLocaleDateString()}</span>
                            </div>
                            {integration.lastUsed && (
                              <div>
                                <span className="text-muted-foreground">Last used: </span>
                                <span>{new Date(integration.lastUsed).toLocaleDateString()}</span>
                              </div>
                            )}
                            {integration.triggerCount && (
                              <div>
                                <span className="text-muted-foreground">Triggers: </span>
                                <span>{integration.triggerCount}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={integration.isActive}
                        onCheckedChange={(checked) => 
                          toggleIntegrationMutation.mutate({ id: integration.id, isActive: checked })
                        }
                      />
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Setup Guide */}
        {allIntegrations.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>CI/CD Integration Benefits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Integrate APIFlow with your development pipeline to automatically run API tests 
                when code changes, ensuring your APIs work correctly in every deployment.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <GitBranch className="w-4 h-4 text-blue-600" />
                  </div>
                  <h4 className="font-medium mb-2">Automated Testing</h4>
                  <p className="text-sm text-muted-foreground">
                    Trigger API tests automatically on pull requests and deployments
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <h4 className="font-medium mb-2">Quality Gates</h4>
                  <p className="text-sm text-muted-foreground">
                    Block deployments if API tests fail, ensuring quality
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                    <Webhook className="w-4 h-4 text-purple-600" />
                  </div>
                  <h4 className="font-medium mb-2">Real-time Feedback</h4>
                  <p className="text-sm text-muted-foreground">
                    Get immediate feedback on API changes in your workflow
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

export default CiCdIntegration;
