/**
 * Rollout Configuration System
 * Manages feature rollouts, A/B testing, and gradual feature deployment
 */

export interface RolloutRule {
  id: string;
  name: string;
  feature: string;
  enabled: boolean;
  rolloutPercentage: number;
  startDate: Date;
  endDate?: Date;
  conditions: RolloutCondition[];
  priority: number;
}

export interface RolloutCondition {
  type: "user_id" | "email_domain" | "workspace_plan" | "user_role" | "random" | "geo_location" | "device_type";
  operator: "equals" | "contains" | "in" | "not_in" | "greater_than" | "less_than";
  value: any;
}

export interface FeatureConfig {
  key: string;
  name: string;
  description: string;
  defaultValue: boolean;
  category: "core" | "premium" | "experimental" | "beta" | "enterprise";
  dependencies?: string[];
  incompatibleWith?: string[];
  minimumPlan?: "free" | "pro" | "enterprise";
  requiredRoles?: string[];
}

export interface RolloutMetrics {
  featureKey: string;
  totalUsers: number;
  enabledUsers: number;
  adoptionRate: number;
  errorRate: number;
  performanceImpact: number;
  userFeedback: {
    positive: number;
    negative: number;
    neutral: number;
  };
  lastUpdated: Date;
}

// Feature Definitions
export const FEATURES: Record<string, FeatureConfig> = {
  // Core Features (Always Available)
  REQUEST_BUILDER: {
    key: "request_builder",
    name: "Request Builder",
    description: "Visual API request builder interface",
    defaultValue: true,
    category: "core"
  },
  TEST_SUITES: {
    key: "test_suites", 
    name: "Test Suites",
    description: "Organize tests into collections",
    defaultValue: true,
    category: "core"
  },
  BASIC_SCHEDULING: {
    key: "basic_scheduling",
    name: "Basic Scheduling",
    description: "Simple test scheduling capabilities",
    defaultValue: true,
    category: "core"
  },

  // Premium Features
  REQUEST_CHAINS: {
    key: "request_chains",
    name: "Request Chains", 
    description: "Sequential API request workflows",
    defaultValue: false,
    category: "premium",
    minimumPlan: "pro"
  },
  ADVANCED_SCHEDULING: {
    key: "advanced_scheduling",
    name: "Advanced Scheduling",
    description: "Complex scheduling with multiple triggers",
    defaultValue: false,
    category: "premium",
    minimumPlan: "pro",
    dependencies: ["basic_scheduling"]
  },
  CICD_INTEGRATIONS: {
    key: "cicd_integrations",
    name: "CI/CD Integrations",
    description: "GitHub, GitLab, Jenkins integrations",
    defaultValue: false,
    category: "premium",
    minimumPlan: "pro"
  },
  ADVANCED_REPORTING: {
    key: "advanced_reporting",
    name: "Advanced Reporting",
    description: "Detailed analytics and custom reports",
    defaultValue: false,
    category: "premium",
    minimumPlan: "pro"
  },

  // Enterprise Features
  AUDIT_LOGS: {
    key: "audit_logs",
    name: "Audit Logs",
    description: "Comprehensive activity logging",
    defaultValue: false,
    category: "enterprise",
    minimumPlan: "enterprise"
  },
  DATA_RETENTION_POLICIES: {
    key: "data_retention_policies",
    name: "Data Retention Policies",
    description: "Custom data retention and cleanup",
    defaultValue: false,
    category: "enterprise",
    minimumPlan: "enterprise"
  },
  SSO_INTEGRATION: {
    key: "sso_integration",
    name: "SSO Integration",
    description: "Single Sign-On with SAML/OIDC",
    defaultValue: false,
    category: "enterprise",
    minimumPlan: "enterprise"
  },
  CUSTOM_ROLES: {
    key: "custom_roles",
    name: "Custom Roles",
    description: "Define custom user roles and permissions",
    defaultValue: false,
    category: "enterprise",
    minimumPlan: "enterprise"
  },

  // Beta/Experimental Features
  AI_TEST_GENERATION: {
    key: "ai_test_generation",
    name: "AI Test Generation",
    description: "AI-powered automatic test case generation",
    defaultValue: false,
    category: "beta"
  },
  REALTIME_COLLABORATION: {
    key: "realtime_collaboration",
    name: "Real-time Collaboration",
    description: "Live editing and collaboration",
    defaultValue: false,
    category: "experimental"
  },
  PERFORMANCE_INSIGHTS: {
    key: "performance_insights",
    name: "Performance Insights",
    description: "AI-powered performance analysis",
    defaultValue: false,
    category: "beta",
    dependencies: ["advanced_reporting"]
  },
  PREDICTIVE_MONITORING: {
    key: "predictive_monitoring",
    name: "Predictive Monitoring",
    description: "ML-based failure prediction",
    defaultValue: false,
    category: "experimental",
    minimumPlan: "enterprise"
  }
};

// Default Rollout Rules
export const DEFAULT_ROLLOUT_RULES: RolloutRule[] = [
  {
    id: "internal_team_full_access",
    name: "Internal Team Full Access",
    feature: "*",
    enabled: true,
    rolloutPercentage: 100,
    startDate: new Date("2024-01-01"),
    conditions: [
      {
        type: "email_domain",
        operator: "equals",
        value: "apiflow.dev"
      }
    ],
    priority: 1000
  },
  {
    id: "enterprise_features",
    name: "Enterprise Features",
    feature: "enterprise_*",
    enabled: true,
    rolloutPercentage: 100,
    startDate: new Date("2024-01-01"),
    conditions: [
      {
        type: "workspace_plan",
        operator: "equals",
        value: "enterprise"
      }
    ],
    priority: 900
  },
  {
    id: "premium_features",
    name: "Premium Features",
    feature: "premium_*",
    enabled: true,
    rolloutPercentage: 100,
    startDate: new Date("2024-01-01"),
    conditions: [
      {
        type: "workspace_plan",
        operator: "in",
        value: ["pro", "enterprise"]
      }
    ],
    priority: 800
  },
  {
    id: "beta_users_ai_features",
    name: "Beta Users AI Features",
    feature: "ai_test_generation",
    enabled: true,
    rolloutPercentage: 50,
    startDate: new Date("2024-01-15"),
    endDate: new Date("2024-03-15"),
    conditions: [
      {
        type: "user_role",
        operator: "in",
        value: ["beta-tester", "power-user"]
      }
    ],
    priority: 500
  }
];

// Rollout Configuration Class
export class RolloutConfig {
  private rules: RolloutRule[] = [];
  private metrics: Map<string, RolloutMetrics> = new Map();

  constructor(rules: RolloutRule[] = DEFAULT_ROLLOUT_RULES) {
    this.rules = rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Check if a feature is enabled for a specific user/context
   */
  isFeatureEnabled(
    featureKey: string, 
    context: {
      userId: string;
      email: string;
      workspacePlan: string;
      userRole: string;
      location?: string;
      deviceType?: string;
    }
  ): boolean {
    const feature = FEATURES[featureKey.toUpperCase()];
    if (!feature) return false;

    // Check if feature is available for the workspace plan
    if (feature.minimumPlan) {
      const planHierarchy = ["free", "pro", "enterprise"];
      const userPlanIndex = planHierarchy.indexOf(context.workspacePlan);
      const requiredPlanIndex = planHierarchy.indexOf(feature.minimumPlan);
      
      if (userPlanIndex < requiredPlanIndex) {
        return false;
      }
    }

    // Check role requirements
    if (feature.requiredRoles && !feature.requiredRoles.includes(context.userRole)) {
      return false;
    }

    // Check dependencies
    if (feature.dependencies) {
      for (const dependency of feature.dependencies) {
        if (!this.isFeatureEnabled(dependency, context)) {
          return false;
        }
      }
    }

    // Check incompatibilities
    if (feature.incompatibleWith) {
      for (const incompatible of feature.incompatibleWith) {
        if (this.isFeatureEnabled(incompatible, context)) {
          return false;
        }
      }
    }

    // Apply rollout rules
    const applicableRules = this.getApplicableRules(featureKey);
    
    for (const rule of applicableRules) {
      if (!rule.enabled) continue;
      
      if (this.evaluateConditions(rule.conditions, context)) {
        // Check if user falls within rollout percentage
        if (this.isUserInRollout(context.userId, rule.rolloutPercentage)) {
          return true;
        }
      }
    }

    return feature.defaultValue;
  }

  /**
   * Get all enabled features for a user/context
   */
  getEnabledFeatures(context: {
    userId: string;
    email: string;
    workspacePlan: string;
    userRole: string;
    location?: string;
    deviceType?: string;
  }): string[] {
    return Object.keys(FEATURES).filter(featureKey => 
      this.isFeatureEnabled(featureKey, context)
    );
  }

  /**
   * Add or update a rollout rule
   */
  upsertRule(rule: RolloutRule): void {
    const existingIndex = this.rules.findIndex(r => r.id === rule.id);
    
    if (existingIndex >= 0) {
      this.rules[existingIndex] = rule;
    } else {
      this.rules.push(rule);
    }
    
    // Re-sort by priority
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Remove a rollout rule
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  /**
   * Get applicable rules for a feature
   */
  private getApplicableRules(featureKey: string): RolloutRule[] {
    const now = new Date();
    
    return this.rules.filter(rule => {
      // Check if rule is currently active
      if (rule.startDate > now) return false;
      if (rule.endDate && rule.endDate < now) return false;
      
      // Check if rule applies to this feature
      if (rule.feature === "*") return true;
      if (rule.feature === featureKey) return true;
      if (rule.feature.endsWith("*")) {
        const prefix = rule.feature.slice(0, -1);
        return featureKey.startsWith(prefix);
      }
      
      return false;
    });
  }

  /**
   * Evaluate rollout conditions
   */
  private evaluateConditions(conditions: RolloutCondition[], context: any): boolean {
    return conditions.every(condition => {
      const contextValue = this.getContextValue(condition.type, context);
      
      switch (condition.operator) {
        case "equals":
          return contextValue === condition.value;
        case "contains":
          return String(contextValue).includes(String(condition.value));
        case "in":
          return Array.isArray(condition.value) && condition.value.includes(contextValue);
        case "not_in":
          return Array.isArray(condition.value) && !condition.value.includes(contextValue);
        case "greater_than":
          return Number(contextValue) > Number(condition.value);
        case "less_than":
          return Number(contextValue) < Number(condition.value);
        default:
          return false;
      }
    });
  }

  /**
   * Get context value based on condition type
   */
  private getContextValue(type: string, context: any): any {
    switch (type) {
      case "user_id":
        return context.userId;
      case "email_domain":
        return context.email.split("@")[1];
      case "workspace_plan":
        return context.workspacePlan;
      case "user_role":
        return context.userRole;
      case "geo_location":
        return context.location;
      case "device_type":
        return context.deviceType;
      case "random":
        return Math.random() * 100;
      default:
        return null;
    }
  }

  /**
   * Determine if user falls within rollout percentage using consistent hashing
   */
  private isUserInRollout(userId: string, percentage: number): boolean {
    // Simple hash function for consistent user bucketing
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    const bucket = Math.abs(hash) % 100;
    return bucket < percentage;
  }

  /**
   * Update metrics for a feature
   */
  updateMetrics(featureKey: string, metrics: Partial<RolloutMetrics>): void {
    const existing = this.metrics.get(featureKey) || {
      featureKey,
      totalUsers: 0,
      enabledUsers: 0,
      adoptionRate: 0,
      errorRate: 0,
      performanceImpact: 0,
      userFeedback: { positive: 0, negative: 0, neutral: 0 },
      lastUpdated: new Date()
    };

    this.metrics.set(featureKey, {
      ...existing,
      ...metrics,
      lastUpdated: new Date()
    });
  }

  /**
   * Get metrics for a feature
   */
  getMetrics(featureKey: string): RolloutMetrics | undefined {
    return this.metrics.get(featureKey);
  }

  /**
   * Get all feature metrics
   */
  getAllMetrics(): RolloutMetrics[] {
    return Array.from(this.metrics.values());
  }
}

// Global rollout configuration instance
export const rolloutConfig = new RolloutConfig();