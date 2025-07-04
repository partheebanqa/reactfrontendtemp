// Environment configuration for the client application
export const ENV = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || window.location.origin,
  
  // Authentication
  AUTH_PROVIDER: import.meta.env.VITE_AUTH_PROVIDER || "replit",
  
  // Feature Flags
  ENABLE_BETA_FEATURES: import.meta.env.VITE_ENABLE_BETA_FEATURES === "true",
  ENABLE_DEBUG_MODE: import.meta.env.VITE_ENABLE_DEBUG_MODE === "true",
  
  // Application Info
  APP_NAME: import.meta.env.VITE_APP_NAME || "APIFlow",
  APP_VERSION: import.meta.env.VITE_APP_VERSION || "1.0.0",
  
  // Limits and Quotas
  FREE_PLAN_LIMITS: {
    MAX_REQUESTS_PER_MONTH: parseInt(import.meta.env.VITE_FREE_MAX_REQUESTS || "1000"),
    MAX_TEST_SUITES: parseInt(import.meta.env.VITE_FREE_MAX_SUITES || "5"),
    MAX_SCHEDULED_TESTS: parseInt(import.meta.env.VITE_FREE_MAX_SCHEDULED || "0")
  },
  
  PRO_PLAN_LIMITS: {
    MAX_REQUESTS_PER_MONTH: parseInt(import.meta.env.VITE_PRO_MAX_REQUESTS || "50000"),
    MAX_TEST_SUITES: parseInt(import.meta.env.VITE_PRO_MAX_SUITES || "50"),
    MAX_SCHEDULED_TESTS: parseInt(import.meta.env.VITE_PRO_MAX_SCHEDULED || "10")
  },
  
  ENTERPRISE_PLAN_LIMITS: {
    MAX_REQUESTS_PER_MONTH: parseInt(import.meta.env.VITE_ENTERPRISE_MAX_REQUESTS || "500000"),
    MAX_TEST_SUITES: parseInt(import.meta.env.VITE_ENTERPRISE_MAX_SUITES || "500"),
    MAX_SCHEDULED_TESTS: parseInt(import.meta.env.VITE_ENTERPRISE_MAX_SCHEDULED || "100")
  },
  
  ERROR_REPORTING_ENABLED: import.meta.env.VITE_ERROR_REPORTING_ENABLED === "true",
  ERROR_REPORTING_DSN: import.meta.env.VITE_ERROR_REPORTING_DSN,
  
  // UI Configuration
  THEME_MODE: import.meta.env.VITE_THEME_MODE || "system", // light, dark, system
  PRIMARY_COLOR: import.meta.env.VITE_PRIMARY_COLOR || "#3b82f6",
  
  // Development
  NODE_ENV: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD
} as const;

// Type-safe environment variable access
export function getEnvVar(key: keyof typeof ENV): string | number | boolean {
  return ENV[key];
}

// Validate required environment variables
export function validateEnv(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required variables for production
  if (ENV.PROD) {
    if (!ENV.API_BASE_URL) {
      errors.push("VITE_API_BASE_URL is required in production");
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Get plan limits based on subscription
export function getPlanLimits(plan: "free" | "pro" | "enterprise") {
  switch (plan) {
    case "free":
      return ENV.FREE_PLAN_LIMITS;
    case "pro":
      return ENV.PRO_PLAN_LIMITS;
    case "enterprise":
      return ENV.ENTERPRISE_PLAN_LIMITS;
    default:
      return ENV.FREE_PLAN_LIMITS;
  }
}