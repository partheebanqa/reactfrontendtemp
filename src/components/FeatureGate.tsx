import React from "react";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { useAuditLog } from "@/hooks/useAuditLog";
import UpgradeModal from "./UpgradeModal";

interface FeatureGateProps {
  feature: string;
  roles?: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
  showUpgrade?: boolean;
}

const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  roles = [],
  fallback,
  children,
  showUpgrade = true,
}) => {
  const { hasFeatureAccess, hasRoleAccess } = useFeatureGate();
  const { logFeatureAccess } = useAuditLog();
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

  const hasAccess = hasFeatureAccess(feature) && (roles.length === 0 || hasRoleAccess(roles));

  React.useEffect(() => {
    // Log feature access attempt
    logFeatureAccess(feature, hasAccess);
  }, [feature, hasAccess, logFeatureAccess]);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showUpgrade) {
      return (
        <>
          <div 
            className="feature-gated-disabled"
            onClick={() => setShowUpgradeModal(true)}
          >
            {children}
          </div>
          <UpgradeModal 
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            feature={feature}
          />
        </>
      );
    }

    return null;
  }

  return <>{children}</>;
};

export default FeatureGate;
