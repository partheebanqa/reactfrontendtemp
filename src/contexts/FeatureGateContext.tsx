import React, { createContext, useContext } from 'react';
import { useWorkspace } from './WorkspaceContext';
import { useAuth } from '@/hooks/useAuth';

interface FeatureGateContextType {
  hasFeatureAccess: (feature: string) => boolean;
  hasRoleAccess: (roles: string[]) => boolean;
  subscriptionPlan: 'free' | 'pro' | 'enterprise';
  userRole: string;
}

const FeatureGateContext = createContext<FeatureGateContextType | undefined>(
  undefined
);

// Define the hook as a named function declaration for Fast Refresh compatibility
function useFeatureGate() {
  const context = useContext(FeatureGateContext);
  if (!context) {
    throw new Error('useFeatureGate must be used within a FeatureGateProvider');
  }
  return context;
}

// Export the hook separately
export { useFeatureGate };

// Feature mapping based on subscription plans
const FEATURE_MAP: Record<string, string[]> = {
  free: [
    'dashboard',
    'request_builder',
    'request_chains',
    'test_suites',
    'notifications',
    'reports',
  ],
  pro: [
    'dashboard',
    'request_builder',
    'request_chains',
    'test_suites',
    'scheduler',
    'executions',
    'data_management',
    'settings',
    'profile',
    'notifications',
    'email_reports',
    'slack_integration',
    'teams_integration',
  ],
  enterprise: [
    '*', // All features
  ],
};

// Role-based access control
const ROLE_PERMISSIONS: Record<string, string[]> = {
  platform_admin: ['*'],
  org_admin: [
    'workspace_management',
    'user_management',
    'integrations',
    'settings',
    'cicd_integrations',
    'billing',
  ],
  developer: [
    'request_builder',
    'test_suites',
    'request_chains',
    'schedules',
    'executions',
    'reports',
    'dashboard',
    'cicd_connect',
  ],
  qa: [
    'request_builder',
    'test_suites',
    'request_chains',
    'schedules',
    'executions',
    'reports',
    'dashboard',
    'cicd_connect',
  ],
  ops_admin: [
    'request_builder',
    'test_suites',
    'request_chains',
    'schedules',
    'executions',
  ],
  support_staff: ['schedules', 'executions', 'billing', 'user_management'],
};

export const FeatureGateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();

  const subscriptionPlan = currentWorkspace?.subscriptionPlan || 'free';
  const userRole = user?.role || 'developer';

  const hasFeatureAccess = (feature: string): boolean => {
    const allowedFeatures = FEATURE_MAP[subscriptionPlan] || [];
    return allowedFeatures.includes('*') || allowedFeatures.includes(feature);
  };

  const hasRoleAccess = (requiredRoles: string[]): boolean => {
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];

    if (userPermissions.includes('*')) return true;

    return requiredRoles.some(
      (role) => userPermissions.includes(role) || userRole === role
    );
  };

  return (
    <FeatureGateContext.Provider
      value={{
        hasFeatureAccess,
        hasRoleAccess,
        subscriptionPlan,
        userRole,
      }}
    >
      {children}
    </FeatureGateContext.Provider>
  );
};
