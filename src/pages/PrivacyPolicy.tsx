import React from "react";
import LandingLayout from "@/components/LandingLayout/LandingLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


const PrivacyPage: React.FC = () => {
  return (
    <LandingLayout>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge variant="secondary" className="mb-4">
          Legal & Compliance
        </Badge>
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Privacy Policy
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Your privacy is important to us. Learn how we collect, use, and protect your information.
        </p>
      </section>

      {/* Policy Sections */}
      <section className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Information We Collect</CardTitle>
              <CardDescription>
                We collect information you provide directly to us, including personal details when you register for an account.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>How We Use Your Information</CardTitle>
              <CardDescription>
                We use your information to provide, maintain, and improve our services, communicate with you, and protect our users.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Information Sharing</CardTitle>
              <CardDescription>
                We do not sell or rent your personal information. We may share it only as described in this policy.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Data Security</CardTitle>
              <CardDescription>
                We implement technical and organizational measures to protect your personal information against unauthorized access or disclosure.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Your Rights</CardTitle>
              <CardDescription>
                You have the right to access, correct, or delete your personal information, and to restrict certain processing.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Questions or Concerns?</h2>
        <p className="text-muted-foreground text-lg mb-8">
          Contact our support team for more information about our privacy practices.
        </p>
        <Button
          size="lg"
          onClick={() => window.location.href = "/contact-us"}
          className="text-lg px-8"
        >
          Contact Us
        </Button>
      </section>
    </LandingLayout>
  );
};

export default PrivacyPage;