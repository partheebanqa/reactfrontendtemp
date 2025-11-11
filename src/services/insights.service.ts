import type {
  TestResult,
  TestMetrics,
  Insight,
} from '@/shared/types/testInsights';

export const insightsService = {
  generateInsights: (
    results: TestResult[],
    metrics: TestMetrics
  ): Insight[] => {
    const insights: Insight[] = [];

    insights.push(...insightsService.detectTimeoutIssues(results));
    insights.push(...insightsService.detectHighFailureRate(metrics));
    insights.push(...insightsService.detectPerformanceIssues(metrics, results));
    insights.push(...insightsService.detectAuthenticationIssues(results));
    insights.push(...insightsService.detectRateLimitingIssues(results));
    insights.push(...insightsService.detectPayloadIssues(results));
    insights.push(...insightsService.detectMalformedRequests(results));

    return insights.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  },

  detectTimeoutIssues: (results: TestResult[]): Insight[] => {
    const timeouts = results.filter((r) => r.error?.includes('timeout')).length;

    if (timeouts === 0) return [];

    return [
      {
        type: 'warning',
        message: `${timeouts} endpoint${
          timeouts > 1 ? 's' : ''
        } failed due to timeout. Consider increasing threshold or checking server logs.`,
        severity: 'high',
      },
    ];
  },

  detectHighFailureRate: (metrics: TestMetrics): Insight[] => {
    if (metrics.failed <= metrics.total / 2) return [];

    const failurePercent = Math.round((metrics.failed / metrics.total) * 100);

    return [
      {
        type: 'error',
        message: `${failurePercent}% of tests failed. Review server health and API configurations.`,
        severity: 'critical',
      },
    ];
  },

  detectPerformanceIssues: (
    metrics: TestMetrics,
    results: TestResult[]
  ): Insight[] => {
    const insights: Insight[] = [];

    if (metrics.maxResponseTime > 500) {
      insights.push({
        type: 'info',
        message: `Slowest API (${metrics.slowestAPI}) took ${metrics.maxResponseTime}ms. Consider optimization.`,
        severity: 'medium',
      });
    }

    const slowCount = results.filter((r) => r.responseTime > 500).length;
    if (slowCount > results.length * 0.3) {
      insights.push({
        type: 'warning',
        message: `${slowCount} APIs exceed 500ms response time. Performance degradation detected.`,
        severity: 'medium',
      });
    }

    return insights;
  },

  detectAuthenticationIssues: (results: TestResult[]): Insight[] => {
    const insights: Insight[] = [];

    const missingAuth = results.filter(
      (r) => !r.hasAuthHeader && r.statusCode === 401
    );
    if (missingAuth.length > 0) {
      const apiNames = missingAuth.map((r) => r.name).join(', ');
      insights.push({
        type: 'error',
        message: `Missing authentication headers detected on: ${apiNames}. Add Authorization header to requests.`,
        severity: 'critical',
      });
    }

    const authFailures = results.filter((r) => r.statusCode === 401);
    if (authFailures.length > 0 && missingAuth.length === 0) {
      insights.push({
        type: 'error',
        message: `${authFailures.length} request${
          authFailures.length > 1 ? 's' : ''
        } failed with 401 Unauthorized. Verify token validity and permissions.`,
        severity: 'high',
      });
    }

    const permissionDenied = results.filter((r) => r.statusCode === 403);
    if (permissionDenied.length > 0) {
      const apiNames = permissionDenied.map((r) => r.name).join(', ');
      insights.push({
        type: 'error',
        message: `Insufficient permissions (403) on: ${apiNames}. Check user roles and endpoint scopes.`,
        severity: 'high',
      });
    }

    return insights;
  },

  detectRateLimitingIssues: (results: TestResult[]): Insight[] => {
    const rateLimited = results.filter((r) => r.statusCode === 429);

    if (rateLimited.length === 0) return [];

    const apiNames = rateLimited.map((r) => r.name).join(', ');

    return [
      {
        type: 'error',
        message: `Rate limiting detected on: ${apiNames}. ${
          rateLimited.length
        } request${
          rateLimited.length > 1 ? 's' : ''
        } exceeded rate limits (429). Implement backoff strategy or request higher limits.`,
        severity: 'high',
      },
    ];
  },

  detectPayloadIssues: (results: TestResult[]): Insight[] => {
    const insights: Insight[] = [];

    const oversizedPayloads = results.filter(
      (r) => (r.payloadSize || 0) > 1024 * 1024
    );
    if (oversizedPayloads.length > 0) {
      const apiNames = oversizedPayloads.map((r) => r.name).join(', ');
      const maxSize = Math.max(
        ...oversizedPayloads.map((r) => r.payloadSize || 0)
      );
      insights.push({
        type: 'warning',
        message: `Large payloads detected on: ${apiNames}. Max size: ${(
          maxSize /
          1024 /
          1024
        ).toFixed(2)}MB. Consider pagination or filtering.`,
        severity: 'medium',
      });
    }

    const largePayloads = results.filter(
      (r) =>
        (r.payloadSize || 0) > 500000 && (r.payloadSize || 0) <= 1024 * 1024
    );
    if (largePayloads.length > results.length * 0.5) {
      const avgSize = Math.round(
        largePayloads.reduce((sum, r) => sum + (r.payloadSize || 0), 0) /
          largePayloads.length /
          1024
      );
      insights.push({
        type: 'info',
        message: `Average payload size is ${avgSize}KB. Consider optimizing response structure to reduce bandwidth.`,
        severity: 'low',
      });
    }

    return insights;
  },

  detectMalformedRequests: (results: TestResult[]): Insight[] => {
    const insights: Insight[] = [];

    const badRequests = results.filter((r) => r.statusCode === 400);
    if (badRequests.length > 0) {
      const apiNames = badRequests.map((r) => r.name).join(', ');
      insights.push({
        type: 'error',
        message: `Bad request errors (400) on: ${apiNames}. Validate request payload structure and required fields.`,
        severity: 'high',
      });
    }

    const missingContentType = results.filter(
      (r) => !r.requestHeaders?.['Content-Type']
    );
    if (missingContentType.length > 0) {
      insights.push({
        type: 'warning',
        message: `${missingContentType.length} request${
          missingContentType.length > 1 ? 's' : ''
        } missing Content-Type header. Add appropriate headers to all requests.`,
        severity: 'medium',
      });
    }

    return insights;
  },
};
