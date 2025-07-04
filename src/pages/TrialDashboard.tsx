import React from "react";
import { useTrialManagement } from "@/hooks/useTrialManagement";
import TrialStatusWidget from "@/components/TrialStatusWidget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Crown, 
  Zap, 
  Check, 
  Calendar, 
  Users, 
  BarChart3,
  Settings,
  Smartphone
} from "lucide-react";

const TrialDashboard: React.FC = () => {
  const { 
    subscriptionPlans, 
    isLoadingPlans,
    canStartTrial, 
    isTrialActive, 
    trialDaysLeft,
    startTrial,
    convertTrial,
    isStartingTrial,
    isConvertingTrial
  } = useTrialManagement();

  const proFeatures = [
    { icon: <Zap className="w-4 h-4" />, name: "Unlimited Test Suites", available: true },
    { icon: <Calendar className="w-4 h-4" />, name: "Advanced Scheduling", available: true },
    { icon: <Users className="w-4 h-4" />, name: "Team Collaboration", available: true },
    { icon: <BarChart3 className="w-4 h-4" />, name: "Enhanced Analytics", available: true },
    { icon: <Settings className="w-4 h-4" />, name: "Slack Integration", available: true },
    { icon: <Smartphone className="w-4 h-4" />, name: "Teams Integration", available: true },
  ];

  const usageStats = [
    { label: "API Calls Made", value: "2,847", limit: "50,000", percentage: 6 },
    { label: "Test Suites Created", value: "8", limit: "Unlimited", percentage: 0 },
    { label: "Team Members", value: "3", limit: "10", percentage: 30 },
    { label: "Integrations", value: "2", limit: "All", percentage: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trial Dashboard</h1>
          <p className="text-muted-foreground">
            {canStartTrial 
              ? "Start your free trial to unlock Pro features"
              : isTrialActive 
                ? `${trialDaysLeft} days left in your trial`
                : "Manage your subscription and trial status"
            }
          </p>
        </div>
        {isTrialActive && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Crown className="w-3 h-3 mr-1" />
            Pro Trial Active
          </Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Trial Status Widget */}
        <div className="lg:col-span-1">
          <TrialStatusWidget />
        </div>

        {/* Usage Statistics */}
        {(isTrialActive || !canStartTrial) && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Usage This Month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {usageStats.map((stat, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stat.label}</span>
                    <span className="text-muted-foreground">
                      {stat.value} / {stat.limit}
                    </span>
                  </div>
                  {stat.percentage > 0 && (
                    <Progress value={stat.percentage} className="h-2" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Pro Features */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-blue-600" />
              Pro Features
              {isTrialActive && (
                <Badge variant="secondary" className="ml-2">
                  Unlocked in Trial
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {proFeatures.map((feature, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    feature.available && (isTrialActive || !canStartTrial)
                      ? "bg-green-50 border-green-200" 
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className={`flex-shrink-0 ${
                    feature.available && (isTrialActive || !canStartTrial)
                      ? "text-green-600" 
                      : "text-gray-400"
                  }`}>
                    {feature.icon}
                  </div>
                  <span className={`font-medium ${
                    feature.available && (isTrialActive || !canStartTrial)
                      ? "text-green-900" 
                      : "text-gray-600"
                  }`}>
                    {feature.name}
                  </span>
                  {feature.available && (isTrialActive || !canStartTrial) && (
                    <Check className="w-4 h-4 text-green-600 ml-auto" />
                  )}
                </div>
              ))}
            </div>

            {canStartTrial && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900">Ready to get started?</h4>
                    <p className="text-sm text-blue-700">
                      Start your 15-day free trial and unlock all Pro features instantly.
                    </p>
                  </div>
                  <Button 
                    onClick={() => startTrial({ planId: 'pro-trial' })}
                    disabled={isStartingTrial}
                    className="ml-4"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {isStartingTrial ? "Starting..." : "Start Trial"}
                  </Button>
                </div>
              </div>
            )}

            {isTrialActive && trialDaysLeft <= 5 && (
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-yellow-900">Trial Ending Soon</h4>
                    <p className="text-sm text-yellow-700">
                      Your trial expires in {trialDaysLeft} days. Upgrade now to keep your Pro features.
                    </p>
                  </div>
                  <Button 
                    onClick={() => convertTrial('pro')}
                    disabled={isConvertingTrial}
                    className="ml-4"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    {isConvertingTrial ? "Processing..." : "Upgrade Now"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Plans */}
        {!isLoadingPlans && subscriptionPlans.length > 0 && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Available Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {subscriptionPlans.map((plan) => (
                  <div 
                    key={plan.id}
                    className={`p-4 rounded-lg border ${
                      plan.name === 'pro' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="text-center space-y-2">
                      <h3 className="font-semibold">{plan.displayName}</h3>
                      <div className="text-2xl font-bold">
                        ${(plan.price / 100).toFixed(0)}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{plan.billingInterval}
                        </span>
                      </div>
                      <ul className="text-sm space-y-1">
                        {plan.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Check className="w-3 h-3 text-green-600" />
                            {feature.replace(/_/g, ' ')}
                          </li>
                        ))}
                      </ul>
                      {plan.name === 'pro' && canStartTrial && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => startTrial({ planId: 'pro-trial' })}
                          disabled={isStartingTrial}
                        >
                          Try Free
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TrialDashboard;