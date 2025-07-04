import { useFeatureGate } from "@/contexts/FeatureGateContext";

export const useFeatureFlag = (feature: string) => {
  const { hasFeatureAccess, subscriptionPlan, userRole } = useFeatureGate();
  
  return {
    isEnabled: hasFeatureAccess(feature),
    subscriptionPlan,
    userRole,
  };
};