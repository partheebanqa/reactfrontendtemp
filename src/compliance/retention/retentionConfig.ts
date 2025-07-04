export interface RetentionPolicy {
  dataType: string;
  retentionPeriodDays: number;
  automaticDeletion: boolean;
  complianceFramework: string[];
  description: string;
}

export const RETENTION_POLICIES: RetentionPolicy[] = [
  {
    dataType: "audit_logs",
    retentionPeriodDays: 2555, // 7 years
    automaticDeletion: true,
    complianceFramework: ["SOX", "GDPR", "HIPAA"],
    description: "Security and audit logs for compliance tracking"
  },
  {
    dataType: "test_execution_data",
    retentionPeriodDays: 365, // 1 year
    automaticDeletion: true,
    complianceFramework: ["ISO27001"],
    description: "API test execution results and performance data"
  },
  {
    dataType: "user_activity_logs",
    retentionPeriodDays: 90, // 3 months
    automaticDeletion: true,
    complianceFramework: ["GDPR", "CCPA"],
    description: "User interaction and behavioral analytics"
  },
  {
    dataType: "personal_data",
    retentionPeriodDays: 1095, // 3 years
    automaticDeletion: false,
    complianceFramework: ["GDPR", "CCPA"],
    description: "User profile and personal information"
  }
];

export function getRetentionPolicy(dataType: string): RetentionPolicy | undefined {
  return RETENTION_POLICIES.find(policy => policy.dataType === dataType);
}

export function shouldDeleteData(dataType: string, dataAge: Date): boolean {
  const policy = getRetentionPolicy(dataType);
  if (!policy || !policy.automaticDeletion) return false;
  
  const ageInDays = Math.floor((Date.now() - dataAge.getTime()) / (1000 * 60 * 60 * 24));
  return ageInDays > policy.retentionPeriodDays;
}