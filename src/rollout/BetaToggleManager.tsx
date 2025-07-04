import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TestTube, Users, Zap, Eye, Settings, AlertTriangle } from "lucide-react";
import { useWorkspace } from "@/modules/workspace/WorkspaceProvider";

interface BetaFeature {
  id: string;
  name: string;
  description: string;
  status: "development" | "alpha" | "beta" | "stable" | "deprecated";
  isEnabled: boolean;
  targetAudience: "internal" | "beta-users" | "power-users" | "all-users";
  rolloutPercentage: number;
  startDate: string;
  endDate?: string;
  dependencies: string[];
  risks: "low" | "medium" | "high";
  feedback: {
    positive: number;
    negative: number;
    total: number;
  };
  metrics: {
    adoptionRate: number;
    errorRate: number;
    performanceImpact: number;
  };
}

interface BetaUser {
  id: string;
  email: string;
  joinedAt: string;
  features: string[];
  feedback: number;
  isActive: boolean;
}

export default function BetaToggleManager() {
  const { currentWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState("features");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [betaFeatures, setBetaFeatures] = useState<BetaFeature[]>([
    {
      id: "ai-test-generation",
      name: "AI-Powered Test Generation",
      description: "Automatically generate comprehensive test cases using AI",
      status: "beta",
      isEnabled: true,
      targetAudience: "beta-users",
      rolloutPercentage: 25,
      startDate: "2024-01-15",
      dependencies: ["openai-integration"],
      risks: "medium",
      feedback: { positive: 47, negative: 8, total: 55 },
      metrics: { adoptionRate: 68.2, errorRate: 1.2, performanceImpact: 5.1 }
    },
    {
      id: "realtime-collaboration",
      name: "Real-time Collaboration",
      description: "Live editing and collaboration on test suites",
      status: "alpha",
      isEnabled: false,
      targetAudience: "internal",
      rolloutPercentage: 5,
      startDate: "2024-01-20",
      dependencies: ["websocket-server", "conflict-resolution"],
      risks: "high",
      feedback: { positive: 12, negative: 3, total: 15 },
      metrics: { adoptionRate: 45.0, errorRate: 2.8, performanceImpact: 12.3 }
    },
    {
      id: "advanced-analytics",
      name: "Advanced Analytics Dashboard",
      description: "Enhanced analytics with predictive insights",
      status: "beta",
      isEnabled: true,
      targetAudience: "power-users",
      rolloutPercentage: 50,
      startDate: "2024-01-10",
      dependencies: ["analytics-engine"],
      risks: "low",
      feedback: { positive: 89, negative: 11, total: 100 },
      metrics: { adoptionRate: 72.5, errorRate: 0.5, performanceImpact: -2.1 }
    }
  ]);

  const [betaUsers, setBetaUsers] = useState<BetaUser[]>([
    {
      id: "1",
      email: "alpha.tester@example.com",
      joinedAt: "2024-01-05",
      features: ["ai-test-generation", "realtime-collaboration"],
      feedback: 12,
      isActive: true
    },
    {
      id: "2",
      email: "beta.user@company.com",
      joinedAt: "2024-01-12",
      features: ["ai-test-generation", "advanced-analytics"],
      feedback: 8,
      isActive: true
    },
    {
      id: "3",
      email: "power.user@startup.io",
      joinedAt: "2024-01-18",
      features: ["advanced-analytics"],
      feedback: 5,
      isActive: false
    }
  ]);

  const toggleFeature = (featureId: string) => {
    setBetaFeatures(prev => 
      prev.map(feature => 
        feature.id === featureId 
          ? { ...feature, isEnabled: !feature.isEnabled }
          : feature
      )
    );
  };

  const updateRolloutPercentage = (featureId: string, percentage: number) => {
    setBetaFeatures(prev => 
      prev.map(feature => 
        feature.id === featureId 
          ? { ...feature, rolloutPercentage: percentage }
          : feature
      )
    );
  };

  const getStatusColor = (status: BetaFeature["status"]) => {
    switch (status) {
      case "development": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "alpha": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "beta": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "stable": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "deprecated": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getRiskColor = (risk: BetaFeature["risks"]) => {
    switch (risk) {
      case "low": return "text-green-600";
      case "medium": return "text-yellow-600";
      case "high": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const getAudienceIcon = (audience: BetaFeature["targetAudience"]) => {
    switch (audience) {
      case "internal": return <Settings className="h-4 w-4" />;
      case "beta-users": return <TestTube className="h-4 w-4" />;
      case "power-users": return <Zap className="h-4 w-4" />;
      case "all-users": return <Users className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Beta Toggle Manager</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage beta features and user access for {currentWorkspace?.name}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <TestTube className="mr-2 h-4 w-4" />
              New Beta Feature
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Beta Feature</DialogTitle>
              <DialogDescription>
                Add a new feature to the beta testing program
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Feature name" />
              <Input placeholder="Description" />
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Target audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal Team</SelectItem>
                  <SelectItem value="beta-users">Beta Users</SelectItem>
                  <SelectItem value="power-users">Power Users</SelectItem>
                  <SelectItem value="all-users">All Users</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(false)}>
                  Create Feature
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="features">Beta Features</TabsTrigger>
          <TabsTrigger value="users">Beta Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Beta Features */}
        <TabsContent value="features">
          <div className="space-y-4">
            {betaFeatures.map((feature) => (
              <Card key={feature.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getAudienceIcon(feature.targetAudience)}
                      <div>
                        <CardTitle className="text-lg">{feature.name}</CardTitle>
                        <CardDescription>{feature.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={getStatusColor(feature.status)}>
                        {feature.status}
                      </Badge>
                      <Switch 
                        checked={feature.isEnabled}
                        onCheckedChange={() => toggleFeature(feature.id)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium">Rollout Percentage</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={feature.rolloutPercentage}
                          onChange={(e) => updateRolloutPercentage(feature.id, parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Risk Level</label>
                      <div className={`text-sm font-medium mt-1 ${getRiskColor(feature.risks)}`}>
                        <AlertTriangle className="inline h-4 w-4 mr-1" />
                        {feature.risks.toUpperCase()}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Adoption Rate</label>
                      <div className="text-sm font-medium mt-1">
                        {feature.metrics.adoptionRate}%
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Feedback Score</label>
                      <div className="text-sm font-medium mt-1">
                        {feature.feedback.total > 0 
                          ? Math.round((feature.feedback.positive / feature.feedback.total) * 100)
                          : 0
                        }% positive ({feature.feedback.total} total)
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Target Audience:</span>
                        <p className="text-gray-600 dark:text-gray-400 capitalize">
                          {feature.targetAudience.replace("-", " ")}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Start Date:</span>
                        <p className="text-gray-600 dark:text-gray-400">
                          {new Date(feature.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Dependencies:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {feature.dependencies.map((dep) => (
                            <Badge key={dep} variant="outline" className="text-xs">
                              {dep}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Beta Users */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Beta Program Users</CardTitle>
              <CardDescription>
                Manage users enrolled in the beta testing program
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {betaUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <TestTube className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{user.email}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span>Joined: {new Date(user.joinedAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{user.feedback} feedback submissions</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {user.features.map((feature) => (
                            <Badge key={feature} variant="outline" className="text-xs">
                              {feature.replace("-", " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button size="sm" variant="outline">
                        Manage
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Beta Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {betaFeatures.filter(f => f.isEnabled).length}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  of {betaFeatures.length} total features
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Beta Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {betaUsers.filter(u => u.isActive).length}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  active participants
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Feedback Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {betaFeatures.reduce((acc, f) => acc + f.feedback.total, 0) > 0
                    ? Math.round(
                        (betaFeatures.reduce((acc, f) => acc + f.feedback.positive, 0) /
                         betaFeatures.reduce((acc, f) => acc + f.feedback.total, 0)) * 100
                      )
                    : 0
                  }%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  overall satisfaction
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}