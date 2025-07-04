import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flag, Users, TrendingUp, Settings, Play, Pause } from "lucide-react";

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetGroups: string[];
  environment: "development" | "staging" | "production";
  createdAt: string;
  lastModified: string;
}

interface RolloutMetrics {
  totalUsers: number;
  enabledUsers: number;
  errorRate: number;
  performanceImpact: number;
}

export default function FeatureRollout() {
  const [activeTab, setActiveTab] = useState("flags");
  
  const [featureFlags] = useState<FeatureFlag[]>([
    {
      id: "1",
      name: "Enhanced Request Builder",
      description: "New visual request builder with advanced features",
      enabled: true,
      rolloutPercentage: 75,
      targetGroups: ["beta-users", "enterprise"],
      environment: "production",
      createdAt: "2024-01-10",
      lastModified: "2024-01-18"
    },
    {
      id: "2", 
      name: "AI-Powered Test Generation",
      description: "Automatically generate test cases using AI",
      enabled: false,
      rolloutPercentage: 0,
      targetGroups: ["internal-team"],
      environment: "staging",
      createdAt: "2024-01-15",
      lastModified: "2024-01-15"
    },
    {
      id: "3",
      name: "Real-time Collaboration",
      description: "Live editing and collaboration features",
      enabled: true,
      rolloutPercentage: 25,
      targetGroups: ["premium-users"],
      environment: "production",
      createdAt: "2024-01-12",
      lastModified: "2024-01-19"
    }
  ]);

  const [metrics] = useState<Record<string, RolloutMetrics>>({
    "1": {
      totalUsers: 1247,
      enabledUsers: 935,
      errorRate: 0.2,
      performanceImpact: -5.3
    },
    "2": {
      totalUsers: 45,
      enabledUsers: 0,
      errorRate: 0,
      performanceImpact: 0
    },
    "3": {
      totalUsers: 1247,
      enabledUsers: 312,
      errorRate: 1.1,
      performanceImpact: 2.1
    }
  });

  const getEnvironmentColor = (env: FeatureFlag["environment"]) => {
    switch (env) {
      case "production": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "staging": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "development": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Feature Rollout</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage feature flags and gradual rollouts
          </p>
        </div>
        <Button>
          <Flag className="mr-2 h-4 w-4" />
          Create Feature Flag
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="flags">Feature Flags</TabsTrigger>
          <TabsTrigger value="metrics">Rollout Metrics</TabsTrigger>
          <TabsTrigger value="groups">Target Groups</TabsTrigger>
        </TabsList>

        {/* Feature Flags */}
        <TabsContent value="flags">
          <div className="space-y-4">
            {featureFlags.map((flag) => (
              <Card key={flag.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Flag className="h-5 w-5" />
                        {flag.name}
                      </CardTitle>
                      <CardDescription>{flag.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={getEnvironmentColor(flag.environment)}>
                        {flag.environment}
                      </Badge>
                      <Switch checked={flag.enabled} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Rollout Percentage</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={flag.rolloutPercentage} className="flex-1" />
                        <span className="text-sm font-medium w-12">
                          {flag.rolloutPercentage}%
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Target Groups</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {flag.targetGroups.map((group) => (
                          <Badge key={group} variant="outline" className="text-xs">
                            {group}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Last Modified</label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {new Date(flag.lastModified).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button size="sm" variant="outline">
                      <Settings className="mr-2 h-4 w-4" />
                      Configure
                    </Button>
                    <Button size="sm" variant="outline">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Analytics
                    </Button>
                    <Button size="sm" variant="outline">
                      {flag.enabled ? (
                        <>
                          <Pause className="mr-2 h-4 w-4" />
                          Disable
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Enable
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Rollout Metrics */}
        <TabsContent value="metrics">
          <div className="space-y-6">
            {featureFlags.map((flag) => {
              const metric = metrics[flag.id];
              if (!metric) return null;

              return (
                <Card key={flag.id}>
                  <CardHeader>
                    <CardTitle>{flag.name} Metrics</CardTitle>
                    <CardDescription>
                      Performance and adoption metrics for this feature
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{metric.totalUsers.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">Total Users</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {metric.enabledUsers.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">Enabled Users</div>
                        <div className="text-xs text-gray-400">
                          {((metric.enabledUsers / metric.totalUsers) * 100).toFixed(1)}% adoption
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${
                          metric.errorRate > 1 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {metric.errorRate}%
                        </div>
                        <div className="text-sm text-gray-500">Error Rate</div>
                      </div>
                      
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${
                          metric.performanceImpact > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {metric.performanceImpact > 0 ? '+' : ''}{metric.performanceImpact}%
                        </div>
                        <div className="text-sm text-gray-500">Performance Impact</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Target Groups */}
        <TabsContent value="groups">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "beta-users", description: "Users enrolled in beta program", count: 156 },
              { name: "enterprise", description: "Enterprise tier customers", count: 89 },
              { name: "premium-users", description: "Premium subscription users", count: 432 },
              { name: "internal-team", description: "Internal team members", count: 45 },
              { name: "early-adopters", description: "Users who opt into new features", count: 234 }
            ].map((group) => (
              <Card key={group.name}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {group.name}
                  </CardTitle>
                  <CardDescription>{group.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{group.count}</div>
                  <div className="text-sm text-gray-500">members</div>
                  <Button size="sm" variant="outline" className="mt-3">
                    Manage Group
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}