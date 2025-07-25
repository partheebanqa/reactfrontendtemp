import React from "react";
import LandingLayout from "@/components/LandingLayout/LandingLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";


const TermsPage: React.FC = () => {
  const [_,setLocation] = useLocation();
  return (
    <LandingLayout>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge variant="secondary" className="mb-4">
          Legal & Compliance
        </Badge>
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Terms of Service
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Please read our terms carefully before using Optraflow. By accessing our platform, you agree to these terms.
        </p>
      </section>

      {/* Terms Sections */}
      <section className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Acceptance of Terms</CardTitle>
              <CardDescription>
                By accessing and using Optraflow's services, you agree to be bound by these Terms of Service.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Description of Service</CardTitle>
              <CardDescription>
                Optraflow provides a web-based platform for workflow automation, analytics, and collaboration.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>User Accounts</CardTitle>
              <CardDescription>
                You must register for an account to access certain features. Provide accurate information and keep your credentials secure.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Privacy</CardTitle>
              <CardDescription>
                Your privacy is important. See our <Link to="/privacy" className="text-blue-600 hover:text-blue-500">Privacy Policy</Link> for details.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Intellectual Property</CardTitle>
              <CardDescription>
                All content and materials are the property of Optraflow or its licensors and protected by law.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Questions about our Terms?</h2>
        <p className="text-muted-foreground text-lg mb-8">
          Contact our support team for more information about our terms and conditions.
        </p>
        <Button
          size="lg"
          onClick={() => setLocation('/contact-us')}
          className="text-lg px-8"
        >
          Contact Us
        </Button>
        <div className="mt-8 text-center text-sm text-muted-foreground">
          © 2025, Optraflow technologies Pvt. Ltd. All Rights Reserved.
        </div>
      </section>
    </LandingLayout>
  );
};

export default TermsPage;