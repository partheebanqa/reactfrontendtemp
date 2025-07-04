import React, { useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useTrialManagement } from "@/hooks/useTrialManagement";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, Crown, Zap } from "lucide-react";

const TrialBanner: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const { 
    canStartTrial, 
    isTrialActive, 
    isTrialExpired, 
    trialDaysLeft, 
    startTrial, 
    isStartingTrial 
  } = useTrialManagement();
  const [showStartDialog, setShowStartDialog] = useState(false);

  // Show start trial banner for free users who haven't started trial
  if (canStartTrial) {
    return (
      <Alert className="mx-2 sm:mx-6 mb-4 border-blue-200 bg-blue-50">
        <Crown className="h-4 w-4 text-blue-600 flex-shrink-0" />
        <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <span className="text-blue-800 text-xs sm:text-sm leading-tight">
            Start your free 15-day Pro trial and unlock advanced API testing features!
          </span>
          <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto flex-shrink-0">
                <Zap className="w-4 h-4 mr-2" />
                Start Free Trial
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start Your Free Trial</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p>Start a 15-day free trial with full access to Pro features:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Unlimited test suites</li>
                  <li>Advanced scheduling</li>
                  <li>Slack & Teams integrations</li>
                  <li>Enhanced reporting</li>
                </ul>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      startTrial({ planId: 'pro-trial' });
                      setShowStartDialog(false);
                    }}
                    disabled={isStartingTrial}
                    className="flex-1"
                  >
                    {isStartingTrial ? "Starting..." : "Start Trial"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowStartDialog(false)}
                    className="flex-1"
                  >
                    Maybe Later
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </AlertDescription>
      </Alert>
    );
  }

  // Don't show banner if not in trial
  if (!isTrialActive && !isTrialExpired) {
    return null;
  }

  if (isTrialExpired) {
    return (
      <Alert className="mx-6 mb-4 border-red-200 bg-red-50">
        <Crown className="h-4 w-4 text-red-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-red-800">
            Your 15-day trial has expired. Upgrade to continue using advanced features.
          </span>
          <Button size="sm" className="ml-4">
            Upgrade Now
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (trialDaysLeft <= 3) {
    return (
      <Alert className="mx-6 mb-4 border-yellow-200 bg-yellow-50">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-yellow-800">
            {trialDaysLeft === 0 
              ? "Your trial expires today!" 
              : `Your trial expires in ${trialDaysLeft} day${trialDaysLeft > 1 ? 's' : ''}.`
            } Upgrade to keep your advanced features.
          </span>
          <Button size="sm" variant="outline" className="ml-4">
            Upgrade
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mx-6 mb-4 border-blue-200 bg-blue-50">
      <Crown className="h-4 w-4 text-blue-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-blue-800">
          You're in a 15-day free trial with full access to Pro features. {trialDaysLeft} days remaining.
        </span>
        <Button size="sm" variant="outline" className="ml-4">
          View Plans
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default TrialBanner;