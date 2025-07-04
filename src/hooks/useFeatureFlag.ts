import { useFeatureGate } from "@/contexts/FeatureGateContext";

export const useFeatureFlag = (feature: string) => {
  const { hasFeatureAccess } = useFeatureGate();
  return hasFeatureAccess(feature);
};
