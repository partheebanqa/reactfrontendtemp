import { useEffect } from 'react';
import { useFeatureGateStore, featureGateActions } from '@/store/featureGateStore';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useAuth } from '@/hooks/useAuth';

/**
 * Custom hook for feature gating and role-based access control
 */
export function useFeatureGate() {
  const { subscriptionPlan, userRole } = useFeatureGateStore();
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  
  // Sync feature gate state with workspace and auth state
  useEffect(() => {
    if (currentWorkspace?.subscriptionPlan || user?.role) {
      featureGateActions.setSubscriptionPlan(
        (currentWorkspace?.subscriptionPlan as "free" | "pro" | "enterprise") || "free"
      );
      featureGateActions.setUserRole(user?.role || "developer");
    }
  }, [currentWorkspace?.subscriptionPlan, user?.role]);
  
  return {
    // State
    subscriptionPlan,
    userRole,
    
    // Feature gate methods
    hasFeatureAccess: featureGateActions.hasFeatureAccess,
    hasRoleAccess: featureGateActions.hasRoleAccess
  };
}
