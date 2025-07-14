import { ReactNode } from "react";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import UpgradeModal from "@/components/UpgradeModal";
import { useState } from "react";

interface FeatureGateProps {
  feature: string;
  roles?: string[];
  fallback?: ReactNode;
  children: ReactNode;
  showUpgrade?: boolean;
}

export default function FeatureGate({ 
  feature, 
  roles, 
  fallback, 
  children, 
  showUpgrade = false 
}: FeatureGateProps) {
  const { hasFeatureAccess, hasRoleAccess } = useFeatureGate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const hasAccess = hasFeatureAccess(feature) && (roles ? hasRoleAccess(roles) : true);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (showUpgrade) {
    return (
      <>
        <div className="p-8 text-center">
          <div className="mx-auto max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Premium Feature
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This feature is available in Pro and Enterprise plans.
            </p>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Upgrade Now
            </button>
          </div>
        </div>
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          feature={feature}
        />
      </>
    );
  }

  return <>{fallback || null}</>;
}