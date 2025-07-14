import { useFeatureGate } from "@/hooks/useFeatureGate";

export const useFeatureFlag = (feature: string) => {
  const { hasFeatureAccess, subscriptionPlan, userRole } = useFeatureGate();
  
  return {
    isEnabled: hasFeatureAccess(feature),
    subscriptionPlan,
    userRole,
  };
};