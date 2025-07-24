import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Code,
  Zap,
  Shield,
  Users,
  BarChart3,
  Infinity,
  CheckCircle,
  ArrowRight,
  Play
} from "lucide-react";
import { Link } from "wouter";
import LandingLayout from "@/components/LandingLayout/LandingLayout";

const Landing: React.FC = () => {
  return (
    <LandingLayout>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge variant="secondary" className="mb-4">
          No-Code API Testing Platform
        </Badge>

        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Test APIs Without Writing Code
        </h1>

        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Build, test, and monitor your APIs with our intuitive no-code platform.
          Perfect for developers, QA engineers, and teams of all sizes.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => window.location.href = "/signup"}
            className="text-lg px-8"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Free Trial
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.location.href = "/signin"}
            className="text-lg px-8"
          >
            Sign In
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
          <p className="text-muted-foreground text-lg">
            Powerful tools to streamline your API testing workflow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Code className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Visual Request Builder</CardTitle>
              <CardDescription>
                Build API requests with our intuitive drag-and-drop interface
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Automated Testing</CardTitle>
              <CardDescription>
                Schedule tests to run automatically and get instant notifications
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>
                Monitor performance and track success rates with detailed reports
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Team Collaboration</CardTitle>
              <CardDescription>
                Work together with role-based access and shared workspaces
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Infinity className="w-10 h-10 text-primary mb-2" />
              <CardTitle>CI/CD Integration</CardTitle>
              <CardDescription>
                Integrate with Jenkins, GitHub Actions, and GitLab pipelines
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Enterprise Security</CardTitle>
              <CardDescription>
                SOC 2 compliant with advanced security controls and audit logs
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Why Choose APIFlow?
              </h2>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">No Code Required</h3>
                    <p className="text-muted-foreground">
                      Build complex API tests without writing a single line of code
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Fast Setup</h3>
                    <p className="text-muted-foreground">
                      Get started in minutes with our intuitive interface
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Scalable</h3>
                    <p className="text-muted-foreground">
                      From small teams to enterprise - we scale with you
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Reliable</h3>
                    <p className="text-muted-foreground">
                      99.9% uptime SLA with enterprise-grade infrastructure
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">✓ User Authentication API</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-5">Response time: 245ms</p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium">✗ Payment Processing API</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-5">Error: Timeout after 5s</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">⟳ Data Sync API Chain</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-5">Running...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-muted-foreground text-lg mb-8">
          Join thousands of developers who trust Optraflow for their API testing needs
        </p>

        <Button
          size="lg"
          onClick={() => window.location.href = "/signup"}
          className="text-lg px-8"
        >
          Start Your Free Trial
        </Button>

        <p className="text-sm text-muted-foreground mt-4">
          No credit card required • 15-day free trial
        </p>
      </section>
    </LandingLayout>
  );
};

export default Landing;
