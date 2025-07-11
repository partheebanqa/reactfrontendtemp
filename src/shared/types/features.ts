export interface FeatureConfig {
  name: string;
  description: string;
  plans: ('free' | 'pro' | 'enterprise')[];
  roles?: string[];
  enabled: boolean;
  betaOnly?: boolean;
}

export const FEATURES: Record<string, FeatureConfig> = {
  // Core Features (Free)
  basic_testing: {
    name: 'Basic API Testing',
    description: 'Create and execute basic API tests',
    plans: ['free', 'pro', 'enterprise'],
    enabled: true,
  },

  request_builder: {
    name: 'Request Builder',
    description: 'Visual request builder interface',
    plans: ['free', 'pro', 'enterprise'],
    enabled: true,
  },

  test_suites: {
    name: 'Test Suites',
    description: 'Organize tests into collections',
    plans: ['free', 'pro', 'enterprise'],
    enabled: true,
  },

  // Pro Features
  scheduler: {
    name: 'Test Scheduler',
    description: 'Schedule automated test execution',
    plans: ['pro', 'enterprise'],
    enabled: true,
  },

  request_chains: {
    name: 'Request Chains',
    description: 'Sequential API request flows',
    plans: ['pro', 'enterprise'],
    enabled: true,
  },

  advanced_reporting: {
    name: 'Advanced Reporting',
    description: 'Detailed analytics and custom reports',
    plans: ['pro', 'enterprise'],
    enabled: true,
  },

  data_management: {
    name: 'Data Management',
    description: 'Test data and environment management',
    plans: ['pro', 'enterprise'],
    enabled: true,
  },
  plan_billing: {
    name: 'Plan & Billing',
    description: 'Subscription management and billing',
    plans: ['pro', 'enterprise'],
    roles: ['admin', 'org_admin'],
    enabled: true,
  },
  slack_integration: {
    name: 'Slack Integration',
    description: 'Send notifications to Slack channels',
    plans: ['pro', 'enterprise'],
    enabled: true,
  },

  // Enterprise Features
  cicd_integrations: {
    name: 'CI/CD Integrations',
    description: 'Integrate with CI/CD pipelines',
    plans: ['enterprise'],
    enabled: true,
  },

  sso_authentication: {
    name: 'SSO Authentication',
    description: 'Single Sign-On integration',
    plans: ['enterprise'],
    roles: ['admin', 'org_admin'],
    enabled: true,
  },

  audit_logging: {
    name: 'Audit Logging',
    description: 'Comprehensive audit trails',
    plans: ['enterprise'],
    roles: ['admin', 'org_admin'],
    enabled: true,
  },

  compliance_features: {
    name: 'Compliance Features',
    description: 'GDPR, SOC2, and other compliance tools',
    plans: ['enterprise'],
    roles: ['admin', 'org_admin'],
    enabled: true,
  },

  custom_roles: {
    name: 'Custom Roles',
    description: 'Define custom user roles and permissions',
    plans: ['enterprise'],
    roles: ['admin', 'org_admin'],
    enabled: true,
  },

  api_rate_limiting: {
    name: 'API Rate Limiting',
    description: 'Advanced rate limiting and throttling',
    plans: ['enterprise'],
    enabled: true,
  },

  white_labeling: {
    name: 'White Labeling',
    description: 'Customize branding and appearance',
    plans: ['enterprise'],
    roles: ['admin'],
    enabled: true,
  },

  // Utility Features
  utilities: {
    name: 'Developer Utilities',
    description: 'JSON formatter, hash generator, JWT decoder',
    plans: ['pro', 'enterprise'],
    enabled: true,
  },

  // Beta Features
  ai_test_generation: {
    name: 'AI Test Generation',
    description: 'Generate tests using AI',
    plans: ['pro', 'enterprise'],
    enabled: false,
    betaOnly: true,
  },

  performance_testing: {
    name: 'Performance Testing',
    description: 'Load and performance testing capabilities',
    plans: ['enterprise'],
    enabled: false,
    betaOnly: true,
  },
};

export type FeatureName = keyof typeof FEATURES;

export function hasFeatureAccess(
  feature: FeatureName,
  userPlan: 'free' | 'pro' | 'enterprise',
  userRole: string,
  betaAccess: boolean = false
): boolean {
  const featureConfig = FEATURES[feature];

  if (!featureConfig) {
    return false;
  }

  // Check if feature is enabled
  if (!featureConfig.enabled) {
    return false;
  }

  // Check beta access
  if (featureConfig.betaOnly && !betaAccess) {
    return false;
  }

  // Check plan access
  if (!featureConfig.plans.includes(userPlan)) {
    return false;
  }

  // Check role access
  if (featureConfig.roles && !featureConfig.roles.includes(userRole)) {
    return false;
  }

  return true;
}

export function getAvailableFeatures(
  userPlan: 'free' | 'pro' | 'enterprise',
  userRole: string,
  betaAccess: boolean = false
): FeatureName[] {
  return Object.keys(FEATURES).filter((feature) =>
    hasFeatureAccess(feature as FeatureName, userPlan, userRole, betaAccess)
  ) as FeatureName[];
}
