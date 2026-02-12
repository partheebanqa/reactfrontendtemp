import {
  PerformanceConfig,
  PerformanceRunApi,
  PerformanceRunDTO,
  PerformanceRunResultApi,
  PerformanceRunResultDTO,
  PerformanceRunSummaryDTO,
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

export const mapPerformanceRunSummary = (
  api: any,
): PerformanceRunSummaryDTO => ({
  id: api.id,
  status: api.status,
  startTime: api.startTime,
  endTime: api.endTime,

  totalRequests: api.totalRequests,
  successfulRequests: api.successfulRequests,
  failedRequests: api.failedRequests,

  rateLimitDetected: api.rateLimitDetected,
  firstRateLimitAt: api.firstRateLimitAt,

  avgResponseTime: api.avgResponseTime,
  minResponseTime: api.minResponseTime,
  maxResponseTime: api.maxResponseTime,

  p50ResponseTime: api.p50ResponseTime,
  p90ResponseTime: api.p90ResponseTime,
  p95ResponseTime: api.p95ResponseTime,
  p99ResponseTime: api.p99ResponseTime,

  throughput: api.throughput,
  totalDuration: api.totalDuration,

  avgDnsTime: api.avgDnsTime,
  avgTcpTime: api.avgTcpTime,
  avgTlsTime: api.avgTlsTime,
  avgTtfbTime: api.avgTtfbTime,

  avgDownloadSize: api.avgDownloadSize,

  errorBreakdown: api.errorBreakdown || {},
});
