import {
  PerformanceConfig,
  PerformanceRunApi,
  PerformanceRunDTO,
  PerformanceRunResultApi,
  PerformanceRunResultDTO,
} from "@/models/performanceTest.model";

export const mapPerformanceRun = (
  api: PerformanceRunApi,
): PerformanceRunDTO => {
  return {
    id: api.Id,
    performanceTestConfigId: api.PerformanceTestConfigId,
    status: api.Status,

    startTime: api.StartTime,
    endTime: api.EndTime,

    totalRequests: api.TotalRequests,
    successfulRequests: api.SuccessfulRequests,
    failedRequests: api.FailedRequests,

    avgResponseTime: api.AvgResponseTime,
    minResponseTime: api.MinResponseTime,
    maxResponseTime: api.MaxResponseTime,

    throughput: api.Throughput,

    errorBreakdown: api.ErrorBreakdown || {},

    rateLimitedCount: api.RateLimitedCount,
    firstRateLimitAt: api.FirstRateLimitAt,
    rateLimitDetected: api.RateLimitDetected,

    createdBy: api.CreatedBy,
    createdAt: api.CreatedAt,
  };
};

export const mapPerformanceRunResult = (
  api: PerformanceRunResultApi,
): PerformanceRunResultDTO => ({
  error: api.Error || null,
  id: api.Id,
  isRateLimited: api.IsRateLimited,
  isSuccess: api.IsSuccess,
  requestId: api.RequestId,
  responseSize: api.ResponseSize,
  responseTime: api.ResponseTime,
  retryAfter: api.RetryAfter || null,
  statusCode: api.StatusCode,
  testPhase: api.TestPhase,
  testRunId: api.TestRunId,
  timestamp: api.Timestamp,
});
