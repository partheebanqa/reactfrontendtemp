export const USER_ROLES = {
  platform_admin: "Platform Admin",
  org_admin: "Organization Admin", 
  developer: "Developer",
  qa: "QA Engineer",
  ops_admin: "Operations Admin",
  support_staff: "Support Staff"
} as const;

// Feature mapping based on subscription plans
export const FEATURE_MAP: Record<string, string[]> = {
  free: [
    'dashboard',
    'request_builder',
    'request_chains',
    'test_suites',
    'reports',
    'executions',
    'notifications',
    'swagger_parser',
    'json_parser',
    'plan_billing',
    'scheduler',
    'cicd_configuration',
  ],
  pro: [
    'dashboard',
    'request_builder',
    'request_chains',
    'test_suites',
    'swagger_parser',
    'json_parser',
    'scheduler',
    'data_management',
    'settings',
    'profile',
    'notifications',
    'email_reports',
    'slack_integration',
    'teams_integration',
    'cicd_configuration',
  ],
  enterprise: [
    '*', // All features
  ],
};

// Role-based access control
export const ROLE_PERMISSIONS: Record<string, string[]> = {
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
    'swagger_parser',
    'json_parser',
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
    'swagger_parser',
    'json_parser',
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
    'swagger_parser',
    'json_parser',
    'schedules',
    'executions',
  ],
  support_staff: ['schedules', 'executions', 'billing', 'user_management'],
};

export type UserRole = keyof typeof USER_ROLES;
export type Permission = typeof ROLE_PERMISSIONS.developer[number] | "*";
