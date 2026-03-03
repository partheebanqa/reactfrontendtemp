export interface RouteConfig {
  path: string;
  name: string;
  component: string;
  icon?: string;
  requiresAuth: boolean;
  roles?: string[];
  feature?: string;
  children?: RouteConfig[];
  meta?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export const routeConfig: RouteConfig[] = [
  {
    path: '/',
    name: 'Dashboard',
    component: 'DashboardPage',
    icon: 'BarChart3',
    requiresAuth: true,
    meta: {
      title: 'Dashboard - OPTRAFLOW',
      description:
        'Overview of your API testing activities and performance metrics',
      keywords: ['dashboard', 'overview', 'metrics', 'api testing'],
    },
  },
  {
    path: '/request-builder',
    name: 'Request Builder',
    component: 'RequestBuilderPage',
    icon: 'Code',
    requiresAuth: true,
    feature: 'request_builder',
    meta: {
      title: 'Request Builder - OPTRAFLOW',
      description: 'Visual no-code API request builder and testing interface',
      keywords: ['request builder', 'api testing', 'no-code', 'visual editor'],
    },
  },
  {
    path: '/test-suites',
    name: 'Test Suites',
    component: 'TestSuitesPage',
    icon: 'FolderOpen',
    requiresAuth: true,
    feature: 'test_suites',
    meta: {
      title: 'Test Suites - OPTRAFLOW',
      description: 'Organize and manage collections of related API tests',
      keywords: [
        'test suites',
        'test collections',
        'organization',
        'api tests',
      ],
    },
  },
  {
    path: '/request-chains',
    name: 'Request Chains',
    component: 'RequestChainsPage',
    icon: 'GitBranch',
    requiresAuth: true,
    feature: 'request_chains',
    meta: {
      title: 'Request Chains - OPTRAFLOW',
      description: 'Create sequential API request workflows and dependencies',
      keywords: [
        'request chains',
        'workflows',
        'sequential testing',
        'dependencies',
      ],
    },
  },
  {
    path: '/scheduler',
    name: 'Scheduler',
    component: 'SchedulerPage',
    icon: 'Calendar',
    requiresAuth: true,
    feature: 'scheduler',
    meta: {
      title: 'Scheduler - OPTRAFLOW',
      description: 'Schedule automated API tests and monitoring',
      keywords: ['scheduler', 'automation', 'cron jobs', 'monitoring'],
    },
  },
  {
    path: '/executions',
    name: 'Executions',
    component: 'ExecutionsNew',
    icon: 'CirclePlay',
    requiresAuth: true,
    meta: {
      title: 'Executions - OPTRAFLOW',
      description: 'Monitor test execution history and results',
      keywords: ['executions', 'test results', 'history', 'monitoring'],
    },
  },
  {
    path: '/cicd',
    name: 'CI/CD Integration',
    component: 'CicdIntegrationPage',
    icon: 'Zap',
    requiresAuth: true,
    feature: 'cicd_integrations',
    roles: ['admin', 'developer'],
    meta: {
      title: 'CI/CD Integration - OPTRAFLOW',
      description: 'Connect your CI/CD pipelines for automated testing',
      keywords: [
        'cicd',
        'integration',
        'automation',
        'pipelines',
        'github',
        'gitlab',
      ],
    },
  },
  {
    path: '/reports',
    name: 'Reports',
    component: 'ReportsPage',
    icon: 'BarChart3',
    requiresAuth: true,
    feature: 'advanced_reporting',
    meta: {
      title: 'Reports - OPTRAFLOW',
      description: 'Generate comprehensive testing analytics and insights',
      keywords: [
        'reports',
        'analytics',
        'insights',
        'performance',
        'statistics',
      ],
    },
  },
  {
    path: '/executions/:id/report',
    name: 'Execution Report',
    component: 'ExecutionReportPage',
    requiresAuth: true,
    meta: {
      title: 'Execution Report - OPTRAFLOW',
      description: 'Detailed execution report',
    },
  },
  {
    path: '/data-management',
    name: 'Data Management',
    component: 'DataManagementPage',
    icon: 'Database',
    requiresAuth: true,
    feature: 'data_management',
    roles: ['admin'],
    meta: {
      title: 'Data Management - OPTRAFLOW',
      description: 'Manage data retention, exports, and cleanup policies',
      keywords: [
        'data management',
        'retention',
        'exports',
        'cleanup',
        'compliance',
      ],
    },
  },
  {
    path: '/plan-billing',
    name: 'Plans & Billing',
    component: 'PlanBillingPage',
    icon: 'DollarSign',
    requiresAuth: true,
    feature: 'billing',
    roles: ['admin'],
    meta: {
      title: 'Plans & Billing - OPTRAFLOW',
      description: 'Manage your subscription plans and billing details',
      keywords: ['plans', 'billing', 'subscriptions', 'payments', 'invoices'],
    },
  },
  {
    path: '/utilities',
    name: 'Utilities',
    component: 'UtilitiesPage',
    icon: 'Wrench',
    requiresAuth: true,
    meta: {
      title: 'Utilities - OPTRAFLOW',
      description: 'Developer tools and utilities for API testing',
      keywords: ['utilities', 'tools', 'encoder', 'decoder', 'jwt', 'hash'],
    },
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: 'NotificationsPage',
    icon: 'Bell',
    requiresAuth: true,
    meta: {
      title: 'Notifications - OPTRAFLOW',
      description: 'Configure notification rules and alert preferences',
      keywords: [
        'notifications',
        'alerts',
        'rules',
        'integrations',
        'slack',
        'email',
      ],
    },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: 'ProfilePage',
    icon: 'User',
    requiresAuth: true,
    meta: {
      title: 'Profile - OPTRAFLOW',
      description: 'Manage your account settings and preferences',
      keywords: ['profile', 'account', 'settings', 'preferences', 'api keys'],
    },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: 'SettingsPage',
    icon: 'Settings',
    requiresAuth: true,
    roles: ['admin'],
    meta: {
      title: 'Settings - OPTRAFLOW',
      description: 'Workspace configuration and team management',
      keywords: ['settings', 'workspace', 'team', 'configuration', 'billing'],
    },
  },
];

export const publicRoutes: RouteConfig[] = [
  {
    path: '/landing',
    name: 'Landing',
    component: 'LandingPage',
    requiresAuth: false,
    meta: {
      title: 'OPTRAFLOW - No-Code API Testing Platform',
      description:
        'The most comprehensive no-code API testing platform for teams',
      keywords: ['api testing', 'no-code', 'automation', 'monitoring', 'saas'],
    },
  },
  {
    path: '/pricing',
    name: 'Pricing',
    component: 'PricingPage',
    requiresAuth: false,
    meta: {
      title: 'Pricing - OPTRAFLOW',
      description: 'Choose the perfect plan for your API testing needs',
      keywords: ['pricing', 'plans', 'subscription', 'features', 'comparison'],
    },
  },
  {
    path: '/privacy',
    name: 'Privacy Policy',
    component: 'PrivacyPage',
    requiresAuth: false,
    meta: {
      title: 'Privacy Policy - OPTRAFLOW',
      description: 'How we protect and handle your data and privacy',
      keywords: ['privacy policy', 'data protection', 'gdpr', 'compliance'],
    },
  },
  {
    path: '/terms',
    name: 'Terms of Service',
    component: 'TermsPage',
    requiresAuth: false,
    meta: {
      title: 'Terms of Service - OPTRAFLOW',
      description: 'Terms and conditions for using the OPTRAFLOW platform',
      keywords: ['terms of service', 'legal', 'conditions', 'agreement'],
    },
  },
];

// Navigation groups for sidebar organization
export const navigationGroups = [
  {
    name: 'Core',
    routes: ['/', '/request-builder', '/test-suites', '/request-chains'],
  },
  {
    name: 'Automation',
    routes: ['/scheduler', '/executions', '/cicd'],
  },
  {
    name: 'Analytics',
    routes: ['/reports', '/data-management'],
  },
  {
    name: 'Tools',
    routes: ['/utilities', '/notifications'],
  },
  {
    name: 'Account',
    routes: ['/profile', '/settings'],
  },
];

// Helper functions
export function getRouteByPath(path: string): RouteConfig | undefined {
  return [...routeConfig, ...publicRoutes].find((route) => route.path === path);
}

export function getRoutesForRole(userRole: string): RouteConfig[] {
  return routeConfig.filter(
    (route) => !route.roles || route.roles.includes(userRole),
  );
}

export function getRoutesForFeature(features: string[]): RouteConfig[] {
  return routeConfig.filter(
    (route) => !route.feature || features.includes(route.feature),
  );
}

export function generateBreadcrumbs(
  currentPath: string,
): Array<{ name: string; path: string }> {
  const parts = currentPath.split('/').filter(Boolean);
  const breadcrumbs = [{ name: 'Dashboard', path: '/' }];

  let currentRoute = '';
  for (const part of parts) {
    currentRoute += '/' + part;
    const route = getRouteByPath(currentRoute);
    if (route) {
      breadcrumbs.push({ name: route.name, path: currentRoute });
    }
  }

  return breadcrumbs;
}
