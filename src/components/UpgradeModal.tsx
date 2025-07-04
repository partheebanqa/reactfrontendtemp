import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
}

const featureDescriptions: Record<string, { title: string; description: string; plan: string }> = {
  scheduler: {
    title: "Automated Scheduling",
    description: "Schedule tests to run automatically with cron expressions and monitor results",
    plan: "Pro",
  },
  advanced_reporting: {
    title: "Advanced Reporting",
    description: "Get detailed analytics, custom reports, and performance insights",
    plan: "Pro",
  },
  cicd_integrations: {
    title: "CI/CD Integrations",
    description: "Connect with Jenkins, GitHub Actions, GitLab CI, and other platforms",
    plan: "Enterprise",
  },
  team_collaboration: {
    title: "Team Collaboration",
    description: "Add team members with role-based access and shared workspaces",
    plan: "Pro",
  },
};

export default function UpgradeModal({ isOpen, onClose, feature }: UpgradeModalProps) {
  const featureInfo = featureDescriptions[feature] || {
    title: "Premium Feature",
    description: "This feature requires a subscription upgrade",
    plan: "Pro",
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Upgrade Required
          </DialogTitle>
          <DialogDescription className="text-left">
            {featureInfo.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-gray-50 dark:bg-gray-800">
            <div>
              <h3 className="font-medium">{featureInfo.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Available on {featureInfo.plan} plan
              </p>
            </div>
            <Badge variant="secondary">{featureInfo.plan}</Badge>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">What you'll get:</h4>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Access to {featureInfo.title}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Premium support
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Advanced analytics
              </li>
            </ul>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Maybe Later
            </Button>
            <Button onClick={() => window.open('/pricing', '_blank')} className="flex-1">
              Upgrade Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}