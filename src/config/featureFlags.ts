export const SUBSCRIPTION_FEATURES = {
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
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_FEATURES;
export type FeatureName =
  | (typeof SUBSCRIPTION_FEATURES.pro)[number]
  | 'cicd_integrations';
