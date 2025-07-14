import { useFeatureGate } from "@/hooks/useFeatureGate";

export const useFeatureFlag = (feature: string) => {
  const { hasFeatureAccess } = useFeatureGate();
  return hasFeatureAccess(feature);
};
