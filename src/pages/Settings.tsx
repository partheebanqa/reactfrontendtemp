import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/useToast";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import ProtectedRoute from "@/components/ProtectedRoute";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Users, 
  Shield, 
  Webhook,
  Mail,
  Slack,
  MessageSquare,
  Save,
  Plus,
  Trash2,
  Edit,
  Key,
  Globe,
  Zap
} from "lucide-react";

interface NotificationSettings {
  emailNotifications: boolean;
  slackIntegration: {
    enabled: boolean;
    webhookUrl: string;
    channel: string;
  };
  teamsIntegration: {
    enabled: boolean;
    webhookUrl: string;
  };
  webhookUrl: string;
}

interface WorkspaceMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  lastActive: string;
  status: "active" | "pending" | "inactive";
}

interface SecuritySettings {
  requireMfa: boolean;
  sessionTimeout: number;
  allowApiKeys: boolean;
  ipWhitelist: string[];
}

const Settings: React.FC = () => {
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("general");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("developer");

  // Fetch notification settings
  const { data: notificationSettings } = useQuery({
    queryKey: ["/api/notification-settings", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
  });

  // Mock workspace members
  const mockMembers: WorkspaceMember[] = [
    {
      id: "1",
      userId: user?.id || "1",
      name: `${user?.firstName} ${user?.lastName}` || "John Doe",
      email: user?.email || "john@company.com",
      role: "org_admin",
      joinedAt: "2024-01-01T00:00:00Z",
      lastActive: "2024-01-20T14:30:00Z",
      status: "active"
    },
    {
      id: "2",
      userId: "2",
      name: "Jane Smith",
      email: "jane@company.com",
      role: "developer",
      joinedAt: "2024-01-05T00:00:00Z",
      lastActive: "2024-01-20T13:45:00Z",
      status: "active"
    },
    {
      id: "3",
      userId: "3",
      name: "Bob Wilson",
      email: "bob@company.com",
      role: "qa",
      joinedAt: "2024-01-10T00:00:00Z",
      lastActive: "2024-01-19T16:20:00Z",
      status: "active"
    }
  ];

  // Mock settings state
  const [workspaceSettings, setWorkspaceSettings] = useState({
    name: currentWorkspace?.name || "My Workspace",
    description: "API testing workspace for our team",
    timezone: "UTC",
    retentionDays: 90,
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    slackIntegration: {
      enabled: false,
      webhookUrl: "",
      channel: "#api-alerts"
    },
    teamsIntegration: {
      enabled: false,
      webhookUrl: ""
    },
    webhookUrl: ""
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    requireMfa: false,
    sessionTimeout: 8,
    allowApiKeys: true,
    ipWhitelist: []
  });

  // Mutations
  const updateWorkspaceMutation = useMutation({
    mutationFn: async (settings: typeof workspaceSettings) => {
      return await apiRequest("PATCH", `/api/workspaces/${currentWorkspace?.id}`, settings);
    },
    onSuccess: () => {
      toast({
        title: "Workspace updated",
        description: "Your workspace settings have been saved",
      });
    }
  });

  const updateNotificationMutation = useMutation({
    mutationFn: async (settings: NotificationSettings) => {
      return await apiRequest("POST", "/api/notification-settings", {
        ...settings,
        workspaceId: currentWorkspace?.id as string,
      });
    },
    onSuccess: () => {
      toast({
        title: "Notifications updated",
        description: "Your notification settings have been saved",
      });
    }
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      setIsInviteOpen(false);
      setInviteEmail("");
      setInviteRole("developer");
      toast({
        title: "Invitation sent",
        description: "Team member invitation has been sent successfully",
      });
    }
  });

  const handleSaveWorkspace = () => {
    updateWorkspaceMutation.mutate(workspaceSettings);
  };

  const handleSaveNotifications = () => {
    updateNotificationMutation.mutate(notifications);
  };

  const handleInviteMember = () => {
    if (!inviteEmail.trim()) return;
    inviteMemberMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      org_admin: "bg-purple-100 text-purple-700",
      developer: "bg-blue-100 text-blue-700",
      qa: "bg-green-100 text-green-700",
      ops_admin: "bg-orange-100 text-orange-700"
    };
    
    return (
      <Badge className={roleColors[role] || "bg-gray-100 text-gray-700"}>
        {role.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <ProtectedRoute feature="settings">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your workspace, team, and integration settings
            </p>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <SettingsIcon className="w-5 h-5" />
                  <span>Workspace Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Workspace Name</label>
                  <Input
                    value={workspaceSettings.name}
                    onChange={(e) => setWorkspaceSettings(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter workspace name"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={workspaceSettings.description}
                    onChange={(e) => setWorkspaceSettings(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your workspace"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Timezone</label>
                    <Select 
                      value={workspaceSettings.timezone} 
                      onValueChange={(value) => setWorkspaceSettings(prev => ({ ...prev, timezone: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Data Retention (Days)</label>
                    <Select 
                      value={workspaceSettings.retentionDays.toString()} 
                      onValueChange={(value) => setWorkspaceSettings(prev => ({ ...prev, retentionDays: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="180">180 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleSaveWorkspace} disabled={updateWorkspaceMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Management */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Team Members</span>
                </CardTitle>
                <Button onClick={() => setIsInviteOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Invite Member
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                          <div className="text-xs text-muted-foreground">
                            Last active: {new Date(member.lastActive).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {getRoleBadge(member.role)}
                        {getStatusBadge(member.status)}
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        {member.userId !== user?.id && (
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Invite Modal */}
                {isInviteOpen && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                      <h3 className="text-lg font-semibold mb-4">Invite Team Member</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Email Address</label>
                          <Input
                            placeholder="colleague@company.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Role</label>
                          <Select value={inviteRole} onValueChange={setInviteRole}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="developer">Developer</SelectItem>
                              <SelectItem value="qa">QA Engineer</SelectItem>
                              <SelectItem value="ops_admin">Operations Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="flex space-x-3 mt-6">
                        <Button variant="outline" onClick={() => setIsInviteOpen(false)} className="flex-1">
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleInviteMember}
                          disabled={!inviteEmail.trim() || inviteMemberMutation.isPending}
                          className="flex-1"
                        >
                          Send Invite
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-muted-foreground">Receive notifications via email</div>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>

                {/* Slack Integration */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Slack className="w-5 h-5" />
                      <div>
                        <div className="font-medium">Slack Integration</div>
                        <div className="text-sm text-muted-foreground">Send notifications to Slack channels</div>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.slackIntegration.enabled}
                      onCheckedChange={(checked) => setNotifications(prev => ({ 
                        ...prev, 
                        slackIntegration: { ...prev.slackIntegration, enabled: checked }
                      }))}
                    />
                  </div>
                  
                  {notifications.slackIntegration.enabled && (
                    <div className="grid grid-cols-2 gap-4 ml-8">
                      <div>
                        <label className="text-sm font-medium">Webhook URL</label>
                        <Input
                          placeholder="https://hooks.slack.com/..."
                          value={notifications.slackIntegration.webhookUrl}
                          onChange={(e) => setNotifications(prev => ({ 
                            ...prev, 
                            slackIntegration: { ...prev.slackIntegration, webhookUrl: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Channel</label>
                        <Input
                          placeholder="#api-alerts"
                          value={notifications.slackIntegration.channel}
                          onChange={(e) => setNotifications(prev => ({ 
                            ...prev, 
                            slackIntegration: { ...prev.slackIntegration, channel: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Teams Integration */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="w-5 h-5" />
                      <div>
                        <div className="font-medium">Microsoft Teams</div>
                        <div className="text-sm text-muted-foreground">Send notifications to Teams channels</div>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.teamsIntegration.enabled}
                      onCheckedChange={(checked) => setNotifications(prev => ({ 
                        ...prev, 
                        teamsIntegration: { ...prev.teamsIntegration, enabled: checked }
                      }))}
                    />
                  </div>
                  
                  {notifications.teamsIntegration.enabled && (
                    <div className="ml-8">
                      <label className="text-sm font-medium">Webhook URL</label>
                      <Input
                        placeholder="https://outlook.office.com/webhook/..."
                        value={notifications.teamsIntegration.webhookUrl}
                        onChange={(e) => setNotifications(prev => ({ 
                          ...prev, 
                          teamsIntegration: { ...prev.teamsIntegration, webhookUrl: e.target.value }
                        }))}
                      />
                    </div>
                  )}
                </div>

                {/* Custom Webhook */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <Webhook className="w-5 h-5" />
                      <div className="font-medium">Custom Webhook</div>
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      Send notifications to a custom webhook endpoint
                    </div>
                    <Input
                      placeholder="https://your-webhook-url.com/notifications"
                      value={notifications.webhookUrl}
                      onChange={(e) => setNotifications(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications} disabled={updateNotificationMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Notification Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>External Integrations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Manage Integrations</h3>
                  <p className="text-muted-foreground mb-4">
                    Configure external integrations for enhanced functionality
                  </p>
                  <Button>
                    Go to CI/CD Integrations
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Security Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Require Multi-Factor Authentication</div>
                    <div className="text-sm text-muted-foreground">Require MFA for all team members</div>
                  </div>
                  <Switch
                    checked={security.requireMfa}
                    onCheckedChange={(checked) => setSecurity(prev => ({ ...prev, requireMfa: checked }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Session Timeout (Hours)</label>
                  <Select 
                    value={security.sessionTimeout.toString()} 
                    onValueChange={(value) => setSecurity(prev => ({ ...prev, sessionTimeout: parseInt(value) }))}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="4">4 hours</SelectItem>
                      <SelectItem value="8">8 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Allow API Keys</div>
                    <div className="text-sm text-muted-foreground">Enable API key authentication</div>
                  </div>
                  <Switch
                    checked={security.allowApiKeys}
                    onCheckedChange={(checked) => setSecurity(prev => ({ ...prev, allowApiKeys: checked }))}
                  />
                </div>

                <div className="flex justify-end">
                  <Button>
                    <Save className="w-4 h-4 mr-2" />
                    Save Security Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
};

export default Settings;
