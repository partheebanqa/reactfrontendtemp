export const USER_ROLES = {
  platform_admin: "Platform Admin",
  org_admin: "Organization Admin", 
  developer: "Developer",
  qa: "QA Engineer",
  ops_admin: "Operations Admin",
  support_staff: "Support Staff"
} as const;

export const ROLE_PERMISSIONS = {
  platform_admin: ["*"], // Full system access
  org_admin: [
    "workspace_management",
    "user_management",
    "integrations", 
    "settings",
    "cicd_integrations",
    "cicd_configuration",
    "notification_settings",
    "billing"
  ],
  developer: [
    "request_builder",
    "test_suites",
    "request_chains",
    "schedules", 
    "executions",
    "reports",
    "dashboard",
    "cicd_configuration"
  ],
  qa: [
    "request_builder",
    "test_suites",
    "request_chains",
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
    "schedules",
    "executions"
  ],
  support_staff: [
    "schedules",
    "executions",
    "billing",
    "user_management"
  ]
} as const;

export type UserRole = keyof typeof USER_ROLES;
export type Permission = typeof ROLE_PERMISSIONS.developer[number] | "*";
