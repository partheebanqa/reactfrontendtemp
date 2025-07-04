import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Crown, Zap, ArrowRight } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export default function UpgradePage() {
  const { currentWorkspace } = useWorkspace();
  const currentPlan = currentWorkspace?.subscriptionPlan || "free";

  const plans = [
    {
      name: "Pro",
      price: "$29",
      description: "Perfect for growing teams",
      icon: Star,
      features: [
        "50,000 API requests/month",
        "Unlimited test suites",
        "Request chains & workflows",
        "Scheduled test execution",
        "Advanced reporting",
        "Priority support"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "$99",
      description: "For enterprise organizations",
      icon: Crown,
      features: [
        "500,000 API requests/month",
        "Everything in Pro",
        "CI/CD integrations",
        "SSO authentication",
        "Audit logging",
        "SLA guarantees"
      ]
    }
  ];

  const currentPlanLimits = {
    free: {
      requests: "1,000 requests/month",
      testSuites: "5 test suites",
      features: "Basic features only"
    },
    pro: {
      requests: "50,000 requests/month",
      testSuites: "Unlimited test suites",
      features: "Advanced features included"
    },
    enterprise: {
      requests: "500,000 requests/month",
      testSuites: "Unlimited test suites",
      features: "All features included"
    }
  };

  const getUpgradeReasons = () => {
    if (currentPlan === "free") {
      return [
        "Unlock scheduled test execution",
        "Get advanced reporting and analytics",
        "Access request chains and workflows",
        "Remove monthly request limits",
        "Get priority customer support"
      ];
    } else if (currentPlan === "pro") {
      return [
        "Add CI/CD pipeline integrations",
        "Enable SSO authentication",
        "Get comprehensive audit logging",
        "Access enterprise security features",
        "Receive dedicated support"
      ];
    }
    return [];
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Upgrade Your Plan</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Unlock powerful features to supercharge your API testing
        </p>
        {currentPlan !== "free" && (
          <Badge variant="outline" className="text-sm">
            Currently on {currentPlan} plan
          </Badge>
        )}
      </div>

      {/* Current Plan Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Current Plan Limits
          </CardTitle>
          <CardDescription>
            Your current usage and plan restrictions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentPlanLimits[currentPlan as keyof typeof currentPlanLimits]?.requests}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Monthly requests</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentPlanLimits[currentPlan as keyof typeof currentPlanLimits]?.testSuites}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Test suites</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentPlanLimits[currentPlan as keyof typeof currentPlanLimits]?.features}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Feature access</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Why Upgrade */}
      {getUpgradeReasons().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Why Upgrade?</CardTitle>
            <CardDescription>
              Benefits you'll get with a higher plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getUpgradeReasons().map((reason, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = plan.name.toLowerCase() === currentPlan;
          const canUpgrade = 
            (currentPlan === "free" && plan.name === "Pro") ||
            (currentPlan === "pro" && plan.name === "Enterprise") ||
            currentPlan === "free";

          if (isCurrentPlan) return null;

          return (
            <Card 
              key={plan.name}
              className={`relative ${plan.popular ? "border-2 border-primary shadow-lg" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <plan.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold">
                  {plan.price}
                  <span className="text-lg font-normal text-gray-600 dark:text-gray-400">
                    /user/month
                  </span>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full" 
                  size="lg"
                  disabled={!canUpgrade}
                >
                  {canUpgrade ? (
                    <>
                      Upgrade to {plan.name}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    "Current Plan"
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Contact Sales */}
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <h3 className="text-xl font-bold">Need a custom solution?</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Contact our sales team for volume discounts and custom enterprise features
          </p>
          <Button variant="outline" size="lg">
            Contact Sales
          </Button>
        </CardContent>
      </Card>

      {/* FAQ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-3">Billing Questions</h3>
          <div className="space-y-3 text-sm">
            <div>
              <strong>When will I be charged?</strong>
              <p className="text-gray-600 dark:text-gray-400">
                Billing starts immediately upon upgrade with a 14-day free trial.
              </p>
            </div>
            <div>
              <strong>Can I cancel anytime?</strong>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, you can cancel your subscription at any time from your account settings.
              </p>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold mb-3">Feature Questions</h3>
          <div className="space-y-3 text-sm">
            <div>
              <strong>What happens to my data?</strong>
              <p className="text-gray-600 dark:text-gray-400">
                All your existing tests and data remain intact when you upgrade.
              </p>
            </div>
            <div>
              <strong>Can I downgrade later?</strong>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, but some features will be disabled based on your new plan limits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}