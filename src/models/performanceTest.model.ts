export type RateLimitType = "fixed" | "sliding";

export interface PerformanceTestCreatePayload {
  concurrency: number;
  delay: number;
  name: string;
  numRequests: number;
  rateLimitEnabled: boolean;
  rateLimitPeriod: number;
  rateLimitRequests: number;
  rateLimitType: RateLimitType;
  requestId: string;
  timeout: number;
  workspaceId: string;
}

export interface PerformanceTestCreateResponseApi {
  Id: string;
  Name: string;
  RequestId: string;
  WorkspaceId: string;

  NumRequests: number;
  Concurrency: number;
  Delay: number;
  Timeout: number;

  RateLimitEnabled: boolean;
  RateLimitRequests: number;
  RateLimitPeriod: number;
  RateLimitType: RateLimitType;

  CreatedBy: string;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
}

export interface PerformanceTestConfigApi {
  Id: string;
  Name: string;
  RequestId: string;
  WorkspaceId: string;

  NumRequests: number;
  Concurrency: number;
  Delay: number;
  Timeout: number;

  RateLimitEnabled: boolean;
  StopOnError: boolean;
  RateLimitRequests: number;
  RateLimitPeriod: number;
  RateLimitType: RateLimitType;

  CreatedBy: string;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
}

export interface PerformanceTestUpdatePayload {
  name: string;
  numRequests: number;
  concurrency: number;
  delay: number;
  timeout: number;

  rateLimitEnabled: boolean;
  rateLimitRequests: number;
  rateLimitPeriod: number;
  rateLimitType: RateLimitType;
}

export interface PerformanceTestConfigDTO {
  id: string;
  name: string;
  requestId: string;
  workspaceId: string;

  numRequests: number;
  concurrency: number;
  delay: number;
  timeout: number;

  rateLimitEnabled: boolean;
  rateLimitRequests: number;
  rateLimitPeriod: number;
  rateLimitType: RateLimitType;

  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface PerformanceConfig {
  id: string;
  name: string;
  description?: string;
  numRequests: number;
  concurrency: number;
  delay: number;
  timeout: number;
  rateLimitEnabled?: boolean;
  stopOnError?: boolean;
  rateLimitRequests?: number;
  rateLimitType?: string;
  rateLimitPeriod?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionResult {
  id: string;
  configId: string;
  configName: string;
  startTime: string;
  endTime: string;
  status: "success" | "failed" | "partial";
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  throughput: number;
}

export type PerformanceRunStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type PerformanceRunApi = {
  Id: string;
  PerformanceTestConfigId: string;
  Status: PerformanceRunStatus;

  StartTime: string;
  EndTime: string;

  TotalRequests: number;
  SuccessfulRequests: number;
  FailedRequests: number;

  AvgResponseTime: number;
  MinResponseTime: number;
  MaxResponseTime: number;

  Throughput: number;

  ErrorBreakdown: Record<string, number>;

  RateLimitedCount: number;
  FirstRateLimitAt: number;
  RateLimitDetected: boolean;

  CreatedBy: string;
  CreatedAt: string;
};

export type PerformanceRunDTO = {
  id: string;
  performanceTestConfigId: string;
  status: PerformanceRunStatus;

  startTime: string;
  endTime: string;

  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;

  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;

  throughput: number;

  errorBreakdown: Record<string, number>;

  rateLimitedCount: number;
  firstRateLimitAt: number;
  rateLimitDetected: boolean;

  createdBy: string;
  createdAt: string;
};

export type PerformanceRunResultApi = {
  Error: string | null;
  Id: string;
  IsRateLimited: boolean;
  IsSuccess: boolean;
  RequestId: string;
  ResponseSize: number;
  ResponseTime: number;
  RetryAfter: string | null;
  StatusCode: number;
  TestPhase: string;
  TestRunId: string;
  Timestamp: string;
};

export type PerformanceRunResultDTO = {
  error: string | null;
  id: string;
  isRateLimited: boolean;
  isSuccess: boolean;
  requestId: string;
  responseSize: number;
  responseTime: number;
  retryAfter: string | null;
  statusCode: number;
  testPhase: string;
  testRunId: string;
  timestamp: string;
};
