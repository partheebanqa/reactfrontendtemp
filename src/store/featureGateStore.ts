import { Store, useStore } from "@tanstack/react-store";
import { workspaceStore } from "./workspaceStore";
import { authStore } from "./authStore";

type SubscriptionPlan = "free" | "pro" | "enterprise";

// Define the shape of our feature gate state
interface FeatureGateState {
  subscriptionPlan: SubscriptionPlan;
  userRole: string;
}

// Initial state for feature gate
export const initialFeatureGateState: FeatureGateState = {
  subscriptionPlan: "free",
  userRole: "developer"
};

// Feature mapping based on subscription plans
export const FEATURE_MAP: Record<string, string[]> = {
  free: [
    "dashboard",
    "request_builder", 
    "request_chains",
    "test_suites",
    "notifications",
    "swagger_parser",
    "json_parser",
  ],
  pro: [
    "dashboard",
    "request_builder",
    "request_chains", 
    "test_suites",
    "swagger_parser",
    "json_parser",
    "scheduler",
    "executions",
    "data_management",
    "reports",
    "settings",
    "profile",
    "notifications",
    "email_reports",
    "slack_integration",
    "teams_integration"
  ],
  enterprise: [
    "*" // All features
  ]
};

// Role-based access control
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  platform_admin: ["*"],
  org_admin: [
    "workspace_management",
    "user_management", 
    "integrations",
    "settings",
    "cicd_integrations",
    "billing"
  ],
  developer: [
    "request_builder",
    "test_suites", 
    "request_chains",
    "swagger_parser",
    "json_parser",
    "schedules",
    "executions",
    "reports",
    "dashboard",
    "cicd_connect"
  ],
  qa: [
    "request_builder",
    "test_suites",
    "request_chains", 
    "swagger_parser",
    "json_parser",
    "schedules",
    "executions", 
    "reports",
    "dashboard",
    "cicd_connect"
  ],
  ops_admin: [
    "request_builder",
    "test_suites",
    "request_chains",
    "swagger_parser",
    "json_parser",
    "schedules",
    "executions"
  ],
  support_staff: [
    "schedules",
    "executions",
    "billing",
    "user_management"
  ]
};

// Create the store
export const featureGateStore = new Store<FeatureGateState>(initialFeatureGateState);

// Define actions to update the store
export const featureGateActions = {
  // Update subscription plan
  setSubscriptionPlan: (plan: SubscriptionPlan) => {
    featureGateStore.setState((state) => ({
      ...state,
      subscriptionPlan: plan
    }));
  },
  
  // Update user role
  setUserRole: (role: string) => {
    featureGateStore.setState((state) => ({
      ...state,
      userRole: role
    }));
  },
  
  // Check if a feature is accessible based on subscription plan
  hasFeatureAccess: (feature: string): boolean => {
    const { subscriptionPlan } = featureGateStore.state;
    const allowedFeatures = FEATURE_MAP[subscriptionPlan] || [];
    return allowedFeatures.includes("*") || allowedFeatures.includes(feature);
  },
  
  // Check if user has access based on role
  hasRoleAccess: (requiredRoles: string[]): boolean => {
    const { userRole } = featureGateStore.state;
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    
    if (userPermissions.includes("*")) return true;
    
    return requiredRoles.some(role => 
      userPermissions.includes(role) || userRole === role
    );
  },
  
  // Sync state with workspace and auth stores
  syncState: () => {
    const workspaceState = workspaceStore.state;
    const authState = authStore.state;
    
    featureGateStore.setState((state) => ({
      ...state,
      subscriptionPlan: (workspaceState.currentWorkspace?.subscriptionPlan as SubscriptionPlan) || "free",
      userRole: authState.user?.role || "developer"
    }));
  }
};

// Hook to use the feature gate store
export const useFeatureGateStore = () => {
  return useStore(featureGateStore);
};
