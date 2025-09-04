import { Store, useStore } from '@tanstack/react-store';
import { workspaceStore } from './workspaceStore';
import { authStore } from './authStore';
import { FEATURE_MAP, ROLE_PERMISSIONS } from '@/config/roleConfig';

type SubscriptionPlan = 'free' | 'pro' | 'enterprise';

// Define the shape of our feature gate state
interface FeatureGateState {
  subscriptionPlan: SubscriptionPlan;
  userRole: string;
}

// Initial state for feature gate
export const initialFeatureGateState: FeatureGateState = {
  subscriptionPlan: 'free',
  userRole: 'developer',
};


// Create the store
export const featureGateStore = new Store<FeatureGateState>(
  initialFeatureGateState
);

// Define actions to update the store
export const featureGateActions = {
  // Update subscription plan
  setSubscriptionPlan: (plan: SubscriptionPlan) => {
    featureGateStore.setState((state) => ({
      ...state,
      subscriptionPlan: plan,
    }));
  },

  // Update user role
  setUserRole: (role: string) => {
    featureGateStore.setState((state) => ({
      ...state,
      userRole: role,
    }));
  },

  // Check if a feature is accessible based on subscription plan
  hasFeatureAccess: (feature: string): boolean => {
    const { subscriptionPlan } = featureGateStore.state;
    const allowedFeatures = FEATURE_MAP[subscriptionPlan] || [];
    return allowedFeatures.includes('*') || allowedFeatures.includes(feature);
  },

  // Check if user has access based on role
  hasRoleAccess: (requiredRoles: string[]): boolean => {
    const { userRole } = featureGateStore.state;
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];

    if (userPermissions.includes('*')) return true;

    return requiredRoles.some(
      (role) => userPermissions.includes(role) || userRole === role
    );
  },

  // Sync state with workspace and auth stores
  syncState: () => {
    const workspaceState = workspaceStore.state;
    const authState = authStore.state;

    featureGateStore.setState((state) => ({
      ...state,
      subscriptionPlan:
        (workspaceState.currentWorkspace
          ?.subscriptionPlan as SubscriptionPlan) || 'free',
      userRole: authState.user?.role || 'developer',
    }));
  },
};

// Hook to use the feature gate store
export const useFeatureGateStore = () => {
  return useStore(featureGateStore);
};
