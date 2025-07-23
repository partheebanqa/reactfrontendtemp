import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { 
  Check, 
  Crown, 
  Zap, 
  Star,
  Code,
  Users,
  Calendar,
  BarChart3,
  Shield,
  Infinity,
  Mail,
  Slack,
  MessageSquare,
  GitBranch,
  Webhook,
  Clock,
  Database,
  Settings,
  HeadphonesIcon
} from "lucide-react";
import LandingLayout from "@/components/LandingLayout/LandingLayout";

interface PricingPlan {
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  highlighted?: boolean;
  buttonText: string;
  buttonVariant: "default" | "outline";
  icon: React.ReactNode;
  badge?: string;
  limits: {
    apiCalls: string;
    users: string;
    schedules: string;
    retention: string;
  };
}

const Pricing: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isYearly, setIsYearly] = useState(false);

  const plans: PricingPlan[] = [
    {
      name: "Free",
      description: "Perfect for getting started with API testing",
      price: {
        monthly: 0,
        yearly: 0,
      },
      features: [
        "Up to 100 API calls per month",
        "Basic request builder",
        "Request chains",
        "Test suites",
        "Email notifications",
        "Community support",
        "30-day data retention"
      ],
      buttonText: isAuthenticated ? "Current Plan" : "Get Started",
      buttonVariant: "outline",
      icon: <Code className="w-6 h-6" />,
      limits: {
        apiCalls: "100/month",
        users: "1 user",
        schedules: "0",
        retention: "30 days"
      }
    },
    {
      name: "Pro",
      description: "For teams that need advanced testing capabilities",
      price: {
        monthly: 29,
        yearly: 290,
      },
      features: [
        "Unlimited API calls",
        "Advanced request builder",
        "Request chains & test suites",
        "Automated scheduling",
        "Test execution monitoring",
        "Data management tools",
        "Advanced reporting & analytics",
        "Email & Slack notifications",
        "Teams integration",
        "Priority support",
        "90-day data retention"
      ],
      highlighted: true,
      buttonText: "Start Free Trial",
      buttonVariant: "default",
      icon: <Crown className="w-6 h-6" />,
      badge: "Most Popular",
      limits: {
        apiCalls: "Unlimited",
        users: "Up to 10 users",
        schedules: "Unlimited",
        retention: "90 days"
      }
    },
    {
      name: "Enterprise",
      description: "For large teams with advanced security and compliance needs",
      price: {
        monthly: 99,
        yearly: 990,
      },
      features: [
        "Everything in Pro",
        "CI/CD pipeline integrations",
        "Custom webhook triggers",
        "Advanced security controls",
        "SSO & SAML authentication",
        "Custom integrations",
        "Dedicated support manager",
        "99.9% uptime SLA",
        "Custom data retention",
        "On-premise deployment option"
      ],
      buttonText: "Contact Sales",
      buttonVariant: "outline",
      icon: <Zap className="w-6 h-6" />,
      limits: {
        apiCalls: "Unlimited",
        users: "Unlimited",
        schedules: "Unlimited",
        retention: "Custom"
      }
    }
  ];

  const features = [
    {
      name: "Request Builder",
      description: "Visual interface for building API requests",
      icon: <Code className="w-5 h-5" />,
      plans: ["free", "pro", "enterprise"]
    },
    {
      name: "Team Collaboration", 
      description: "Invite team members and collaborate",
      icon: <Users className="w-5 h-5" />,
      plans: ["pro", "enterprise"]
    },
    {
      name: "Automated Scheduling",
      description: "Schedule tests to run automatically",
      icon: <Calendar className="w-5 h-5" />,
      plans: ["pro", "enterprise"]
    },
    {
      name: "Advanced Analytics",
      description: "Detailed reports and performance insights",
      icon: <BarChart3 className="w-5 h-5" />,
      plans: ["pro", "enterprise"]
    },
    {
      name: "Enterprise Security",
      description: "SSO, SAML, and advanced security controls",
      icon: <Shield className="w-5 h-5" />,
      plans: ["enterprise"]
    },
    {
      name: "CI/CD Integration",
      description: "Jenkins, GitHub Actions, GitLab CI/CD",
      icon: <GitBranch className="w-5 h-5" />,
      plans: ["enterprise"]
    }
  ];

  const calculateYearlySavings = (monthly: number, yearly: number) => {
    if (monthly === 0) return 0;
    const yearlySavings = (monthly * 12) - yearly;
    const percentage = Math.round((yearlySavings / (monthly * 12)) * 100);
    return percentage;
  };

  return (
    <LandingLayout>
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="container mx-auto px-4 pt-16 pb-8">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">
            Pricing Plans
          </Badge>
          <h1 className="text-4xl font-bold mb-4">
            Choose the right plan for your team
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start with our free plan and upgrade as your API testing needs grow. 
            All plans include our core testing features.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center space-x-4 mb-12">
          <span className={`text-sm ${!isYearly ? "font-medium" : "text-muted-foreground"}`}>
            Monthly
          </span>
          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
          />
          <span className={`text-sm ${isYearly ? "font-medium" : "text-muted-foreground"}`}>
            Yearly
          </span>
          {isYearly && (
            <Badge className="bg-green-100 text-green-700">
              Save up to 17%
            </Badge>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <Card 
              key={plan.name} 
              className={`relative ${plan.highlighted ? "border-primary shadow-xl scale-105" : "border-gray-200"}`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    {plan.badge}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    plan.highlighted ? "bg-primary text-primary-foreground" : "bg-gray-100 text-gray-600"
                  }`}>
                    {plan.icon}
                  </div>
                </div>
                
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <p className="text-muted-foreground text-sm">{plan.description}</p>
                
                <div className="mt-4">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold">
                      ${isYearly ? plan.price.yearly : plan.price.monthly}
                    </span>
                    {plan.price.monthly > 0 && (
                      <span className="text-muted-foreground ml-2">
                        /{isYearly ? "year" : "month"}
                      </span>
                    )}
                  </div>
                  {isYearly && plan.price.monthly > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      Save {calculateYearlySavings(plan.price.monthly, plan.price.yearly)}% 
                      vs monthly billing
                    </p>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Plan Limits */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    What's included
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">API Calls:</span>
                      <div className="font-medium">{plan.limits.apiCalls}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Users:</span>
                      <div className="font-medium">{plan.limits.users}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Schedules:</span>
                      <div className="font-medium">{plan.limits.schedules}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Retention:</span>
                      <div className="font-medium">{plan.limits.retention}</div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start space-x-3">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  className="w-full" 
                  variant={plan.buttonVariant}
                  size="lg"
                  onClick={() => {
                    if (plan.name === "Enterprise") {
                      window.location.href = "mailto:sales@optraflow.com";
                    } else if (!isAuthenticated) {
                      window.location.href = "/signin";
                    }
                  }}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            Compare Features
          </h2>
          
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">Features</th>
                      <th className="text-center p-4 font-semibold">Free</th>
                      <th className="text-center p-4 font-semibold">Pro</th>
                      <th className="text-center p-4 font-semibold">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {features.map((feature, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            {feature.icon}
                            <div>
                              <div className="font-medium">{feature.name}</div>
                              <div className="text-sm text-muted-foreground">{feature.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-center p-4">
                          {feature.plans.includes("free") ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="text-center p-4">
                          {feature.plans.includes("pro") ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="text-center p-4">
                          {feature.plans.includes("enterprise") ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
              <p className="text-muted-foreground text-sm">
                Yes, you can upgrade or downgrade your plan at any time. 
                Changes take effect immediately, and we'll prorate any charges.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground text-sm">
                We accept all major credit cards, PayPal, and can arrange 
                invoice billing for Enterprise customers.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-muted-foreground text-sm">
                Yes! All paid plans come with a 15-day free trial. 
                No credit card required to start.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">What happens to my data if I cancel?</h3>
              <p className="text-muted-foreground text-sm">
                Your data is retained for 30 days after cancellation, 
                giving you time to export it or reactivate your account.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-primary rounded-2xl p-12 text-primary-foreground">
          <h2 className="text-3xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90">
            Join thousands of developers who trust APIFlow for their API testing needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => window.location.href = isAuthenticated ? "/dashboard" : "/signin"}
            >
              <Star className="w-5 h-5 mr-2" />
              Start Free Trial
            </Button>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => window.location.href = "mailto:sales@apiflow.com"}
            >
              <HeadphonesIcon className="w-5 h-5 mr-2" />
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </div>
    </LandingLayout>
  );
};

export default Pricing;
