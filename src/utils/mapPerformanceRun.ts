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

export const mapPerformanceRunResult = (api: any): PerformanceRunResultDTO => ({
  id: api.id,
  testRunId: api.testRunId ?? null,
  statusCode: api.statusCode,
  responseTime: api.responseTime,
  responseSize: api.responseSize,
  isSuccess: api.isSuccess,
  isRateLimited: api.isRateLimited,
  testPhase: api.testPhase,
  requestCurl: api.requestCurl,
  requestId: api.requestId ?? null,
  responseBody: api.responseBody ?? null,
  retryAfter: api.retryAfter ?? null,
  dnsTime: api.dnsTime ?? null,
  tcpTime: api.tcpTime ?? null,
  tlsTime: api.tlsTime ?? null,
  ttfbTime: api.ttfbTime ?? null,
  timestamp: api.timestamp,
  error: api.error ?? null,
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
