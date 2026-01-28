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
