import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, Shield, Calendar, Lock, Database, Eye, Users } from "lucide-react";

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Code className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">APIFlow</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
            <Badge variant="outline" className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>Last Updated: January 1, 2024</span>
            </Badge>
          </div>
          <p className="text-muted-foreground text-lg mt-2">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8">
          
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>1. Introduction</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                APIFlow ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by APIFlow when you use our API testing platform and related services (the "Service").
              </p>
              <p>
                This Privacy Policy applies to our website, applications, and other online products and services (collectively, our "Services") on which it appears.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>2. Information We Collect</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <h4 className="font-semibold mb-3">2.1 Information You Provide to Us</h4>
              <ul className="space-y-2 mb-6">
                <li><strong>Account Information:</strong> When you register for an account, we collect your name, email address, and password.</li>
                <li><strong>Profile Information:</strong> You may choose to provide additional information such as your profile picture, job title, and company information.</li>
                <li><strong>API Testing Data:</strong> This includes API endpoints, request/response data, test configurations, and results that you create using our Service.</li>
                <li><strong>Payment Information:</strong> If you subscribe to a paid plan, we collect billing information through our payment processors.</li>
                <li><strong>Communications:</strong> When you contact us for support or other purposes, we collect the information you provide.</li>
              </ul>

              <h4 className="font-semibold mb-3">2.2 Information We Collect Automatically</h4>
              <ul className="space-y-2 mb-6">
                <li><strong>Usage Information:</strong> We collect information about how you use our Service, including features accessed, time spent, and actions taken.</li>
                <li><strong>Device Information:</strong> We collect information about the device you use to access our Service, including IP address, browser type, and operating system.</li>
                <li><strong>Log Information:</strong> Our servers automatically record information when you use our Service, including request logs and error logs.</li>
                <li><strong>Cookies and Similar Technologies:</strong> We use cookies and similar technologies to enhance your experience and collect usage information.</li>
              </ul>

              <h4 className="font-semibold mb-3">2.3 Information from Third Parties</h4>
              <ul className="space-y-2">
                <li><strong>Authentication Services:</strong> If you sign in through third-party services (like Google or GitHub), we receive information from those services.</li>
                <li><strong>Integration Partners:</strong> When you connect third-party services (like Slack or Jenkins), we may receive information necessary for the integration.</li>
              </ul>
            </CardContent>
          </Card>

          {/* How We Use Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>3. How We Use Your Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>We use the information we collect to:</p>
              <ul className="space-y-2">
                <li><strong>Provide our Service:</strong> To operate, maintain, and improve our API testing platform.</li>
                <li><strong>Process transactions:</strong> To process payments and manage your subscription.</li>
                <li><strong>Communicate with you:</strong> To send you updates, security alerts, and support messages.</li>
                <li><strong>Personalize your experience:</strong> To customize content and features based on your preferences.</li>
                <li><strong>Analyze usage:</strong> To understand how our Service is used and improve performance.</li>
                <li><strong>Ensure security:</strong> To detect, investigate, and prevent fraud and other harmful activities.</li>
                <li><strong>Comply with legal obligations:</strong> To comply with applicable laws and regulations.</li>
                <li><strong>Enforce our terms:</strong> To enforce our Terms of Service and other policies.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Information Sharing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>4. How We Share Your Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>We may share your information in the following situations:</p>
              
              <h4 className="font-semibold mb-3">4.1 With Your Consent</h4>
              <p>We may share your information when you give us explicit consent to do so.</p>

              <h4 className="font-semibold mb-3">4.2 Service Providers</h4>
              <p>We may share your information with third-party service providers who perform services on our behalf, such as:</p>
              <ul className="space-y-2">
                <li>Payment processing</li>
                <li>Data hosting and storage</li>
                <li>Email delivery</li>
                <li>Customer support</li>
                <li>Analytics and monitoring</li>
              </ul>

              <h4 className="font-semibold mb-3">4.3 Business Transfers</h4>
              <p>
                If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.
              </p>

              <h4 className="font-semibold mb-3">4.4 Legal Requirements</h4>
              <p>We may disclose your information if required by law or if we believe such action is necessary to:</p>
              <ul className="space-y-2">
                <li>Comply with legal obligations</li>
                <li>Protect and defend our rights or property</li>
                <li>Prevent or investigate possible wrongdoing</li>
                <li>Protect the safety of users or the public</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="w-5 h-5" />
                <span>5. Data Security</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
              
              <h4 className="font-semibold mb-3">5.1 Security Measures</h4>
              <ul className="space-y-2">
                <li><strong>Encryption:</strong> Data is encrypted in transit using TLS and at rest using industry-standard encryption.</li>
                <li><strong>Access Controls:</strong> We limit access to personal information to employees who need it for business purposes.</li>
                <li><strong>Regular Audits:</strong> We regularly review our security practices and conduct security assessments.</li>
                <li><strong>Secure Infrastructure:</strong> We use secure cloud infrastructure with regular security updates.</li>
              </ul>

              <h4 className="font-semibold mb-3">5.2 Data Breach Response</h4>
              <p>
                In the event of a data breach, we will notify affected users and relevant authorities as required by applicable law, typically within 72 hours of discovery.
              </p>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle>6. Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                We retain your personal information for as long as necessary to provide our Service and fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
              </p>
              
              <h4 className="font-semibold mb-3">6.1 Retention Periods</h4>
              <ul className="space-y-2">
                <li><strong>Account Information:</strong> Retained while your account is active and for 30 days after deletion.</li>
                <li><strong>API Testing Data:</strong> Retained according to your subscription plan (30-365 days).</li>
                <li><strong>Usage Logs:</strong> Retained for up to 12 months for security and analytics purposes.</li>
                <li><strong>Payment Information:</strong> Retained as required for tax and legal compliance purposes.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle>7. Your Rights</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>Depending on your location, you may have certain rights regarding your personal information:</p>
              
              <ul className="space-y-2">
                <li><strong>Access:</strong> You can request access to the personal information we hold about you.</li>
                <li><strong>Correction:</strong> You can request that we correct inaccurate personal information.</li>
                <li><strong>Deletion:</strong> You can request that we delete your personal information.</li>
                <li><strong>Portability:</strong> You can request a copy of your personal information in a machine-readable format.</li>
                <li><strong>Restriction:</strong> You can request that we restrict the processing of your personal information.</li>
                <li><strong>Objection:</strong> You can object to the processing of your personal information in certain circumstances.</li>
              </ul>

              <p className="mt-4">
                To exercise any of these rights, please contact us at privacy@apiflow.com. We will respond to your request within 30 days.
              </p>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card>
            <CardHeader>
              <CardTitle>8. Cookies and Tracking Technologies</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                We use cookies and similar tracking technologies to collect and use personal information about you. For more information about the types of cookies we use and your choices, please see our Cookie Policy.
              </p>
              
              <h4 className="font-semibold mb-3">8.1 Types of Cookies</h4>
              <ul className="space-y-2">
                <li><strong>Essential Cookies:</strong> Necessary for the Service to function properly.</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our Service.</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences and settings.</li>
                <li><strong>Advertising Cookies:</strong> Used to deliver relevant advertisements (if applicable).</li>
              </ul>
            </CardContent>
          </Card>

          {/* Third-Party Links */}
          <Card>
            <CardHeader>
              <CardTitle>9. Third-Party Links and Services</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                Our Service may contain links to third-party websites or integrate with third-party services. This Privacy Policy does not apply to those third-party services. We encourage you to read the privacy policies of any third-party services you use.
              </p>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>10. Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                Our Service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
              </p>
            </CardContent>
          </Card>

          {/* International Transfers */}
          <Card>
            <CardHeader>
              <CardTitle>11. International Data Transfers</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Privacy Policy */}
          <Card>
            <CardHeader>
              <CardTitle>12. Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
              </p>
              <p>
                We encourage you to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>13. Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                If you have any questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="mb-2"><strong>Email:</strong> privacy@apiflow.com</p>
                <p className="mb-2"><strong>Address:</strong> APIFlow Inc., 123 API Street, Suite 100, San Francisco, CA 94105</p>
                <p className="mb-2"><strong>Phone:</strong> +1 (555) 123-4567</p>
                <p><strong>Data Protection Officer:</strong> dpo@apiflow.com</p>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="mr-4"
          >
            Go Back
          </Button>
          <Button onClick={() => window.location.href = "/"}>
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
