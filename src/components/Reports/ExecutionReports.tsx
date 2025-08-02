import React from 'react';
import { Search, Bell, User, CheckCircle, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useLocation } from 'wouter';

const ExecutionReports = () => {
    
    const [location, setLocation] = useLocation();
    const handleViewTestSuiteReport = () => {
        setLocation('/test-suite-reports');
    };
    const handleViewRequestChainReport = () => {
        setLocation('/request-chain-reports');
    };
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className=" rounded-lg border border-gray-200 px-20 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Execution Reports</h2>
            <p className="text-muted-foreground text-lg">
              View comprehensive reports for test suite and request chain executions
            </p>
          </div>

          {/* Report Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-12 ">
            {/* Test Suite Report Card */}
            <Card className="p-6">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">Test Suite Report</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Detailed analysis of test execution with categorized results, performance metrics, and failure analysis.
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Tests:</span>
                  <span className="font-semibold text-foreground">24</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Success Rate:</span>
                  <span className="font-semibold text-success">83%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Categories:</span>
                  <span className="font-semibold text-foreground">4</span>
                </div>
                
                <Button
                    onClick={handleViewTestSuiteReport}
                 className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground">
                  View Test Suite Report
                </Button>
              </CardContent>
            </Card>

            {/* Request Chain Report Card */}
            <Card className="p-6">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Link className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">Request Chain Report</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Step-by-step execution flow with variable extraction, data flow visualization, and error tracking.
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Requests:</span>
                  <span className="font-semibold text-foreground">6</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Success Rate:</span>
                  <span className="font-semibold text-success">83%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Variables Extracted:</span>
                  <span className="font-semibold text-foreground">5</span>
                </div>
                
                <Button
                onClick={handleViewRequestChainReport}
                className="w-full mt-6 bg-success hover:bg-success/90 text-success-foreground">
                  View Request Chain Report
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Footer Text */}
          <div className="text-center">
            <p className="text-muted-foreground">
              Reports include environment details, execution timestamps, downloadable PDFs, and shareable links.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExecutionReports;