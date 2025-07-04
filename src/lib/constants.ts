export const API_METHODS = [
  "GET",
  "POST", 
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS"
] as const;

export const EXECUTION_STATUS = {
  RUNNING: "running",
  PASSED: "passed", 
  FAILED: "failed",
  ERROR: "error"
} as const;

export const INTEGRATION_TYPES = {
  JENKINS: "jenkins",
  GITHUB: "github",
  GITLAB: "gitlab"
} as const;

export const NOTIFICATION_CHANNELS = {
  EMAIL: "email",
  SLACK: "slack",
  TEAMS: "teams",
  WEBHOOK: "webhook"
} as const;

// Auth constants
export const USER_COOKIE_NAME = "optraflow_user_data";

export const TRIAL_DURATION_DAYS = 15;

export const PRICING_PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    features: [
      "Up to 100 API calls/month",
      "Basic request builder",
      "Request chains",
      "Email support"
    ]
  },
  PRO: {
    name: "Pro", 
    price: 29,
    features: [
      "Unlimited API calls",
      "Advanced scheduling",
      "Team collaboration",
      "Slack/Teams integration",
      "Priority support"
    ]
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: 99,
    features: [
      "Everything in Pro",
      "CI/CD integrations",
      "Custom webhooks",
      "Advanced security",
      "Dedicated support"
    ]
  }
} as const;
