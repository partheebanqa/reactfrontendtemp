import React from "react";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, ArrowUp } from "lucide-react";

interface ProtectedRouteProps {
  feature: string;
  roles?: string[];
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  feature,
  roles = [],
  children,
}) => {
  const { hasFeatureAccess, hasRoleAccess, subscriptionPlan } = useFeatureGate();
  const { logFeatureAccess } = useAuditLog();

  const hasAccess = hasFeatureAccess(feature) && (roles.length === 0 || hasRoleAccess(roles));

  React.useEffect(() => {
    logFeatureAccess(feature, hasAccess);
  }, [feature, hasAccess, logFeatureAccess]);

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Upgrade Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              This feature requires a{" "}
              {subscriptionPlan === "free" ? "Pro" : "Enterprise"} subscription.
              Upgrade now to unlock advanced API testing capabilities.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="flex-1"
              >
                Go Back
              </Button>
              <Button className="flex-1">
                <ArrowUp className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
