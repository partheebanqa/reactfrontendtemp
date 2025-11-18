// src/types/report.ts

/** Row used to display fastest/slowest requests */
export interface RankedRequest {
  id: string;
  name: string;
  method: string;
  url: string;
  duration: number; // ms
  statusCode?: number;
}

/** The unified metrics shape used by the RequestMetrics component */
export interface RequestMetrics {
  totalRequests: number;
  uniqueEndpoints: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  totalDataTransferred: number;
  requestsByMethod: Record<string, number>;
  statusCodeDistribution: Record<string, number>;
  errorTypes: Record<string, number>;
  slowestRequests: RankedRequest[];
  fastestRequests: RankedRequest[];
}

export interface MethodRow {
  method: string;
  total: number;
  success: number;
  failed: number;
  avgDurationMs: number;
  p95DurationMs: number;
}
/** --- Types that match your report JSON (trimmed to what we use) --- */

interface AnyTestCase {
  id: string;
  name: string;
  method?: string;
  url?: string;
  status?: string; // "passed" | "failed" | "skipped" | ...
  duration?: number; // ms
  responseSize?: number; // bytes
  response?: string; // JSON string: { statusCode, metrics: { responseTime, bytesReceived }, ... }
}

interface ReportRequest {
  requestId: string;
  name: string;
  method: string;
  url: string;
  positiveTests?: { testCases: AnyTestCase[] };
  negativeTests?: { testCases: AnyTestCase[] };
  functionalTests?: { testCases: AnyTestCase[] };
  semanticTests?: { testCases: AnyTestCase[] };
  edgeCaseTests?: { testCases: AnyTestCase[] };
  securityTests?: { testCases: AnyTestCase[] };
  advancedSecurityTests?: { testCases: AnyTestCase[] };
}

interface ReportJson {
  requests?: ReportRequest[];
  // ...other fields ignored by the builder
}

/** Build the RequestMetrics object used by the UI */
export function buildRequestMetrics(report: ReportJson): RequestMetrics {
  const allTestCases: AnyTestCase[] = [];

  // Collect all test cases from all groups under every request
  for (const req of report.requests ?? []) {
    const groups = [
      req.positiveTests,
      req.negativeTests,
      req.functionalTests,
      req.semanticTests,
      req.edgeCaseTests,
      req.securityTests,
      req.advancedSecurityTests,
    ].filter(Boolean) as Array<{ testCases: AnyTestCase[] }>;

    for (const g of groups) {
      for (const t of g.testCases ?? []) {
        // Fill method/url from parent request when missing
        if (!t.method) t.method = req.method;
        if (!t.url) t.url = req.url;
        allTestCases.push(t);
      }
    }
  }

  const safeParse = <T = any>(s?: string): T | undefined => {
    if (!s) return undefined;
    try {
      return JSON.parse(s) as T;
    } catch {
      return undefined;
    }
  };

  let bytesTotal = 0;
  let timeTotal = 0;
  let timeMin = Number.POSITIVE_INFINITY;
  let timeMax = 0;

  const byMethod: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byError: Record<string, number> = {};

  const rows: RankedRequest[] = [];

  for (const t of allTestCases) {
    const parsed = safeParse<{
      statusCode?: number;
      metrics?: { bytesReceived?: number; responseTime?: number };
    }>(t.response);

    const statusCode = parsed?.statusCode;
    const statusKey = statusCode != null ? String(statusCode) : "";
    if (statusKey) byStatus[statusKey] = (byStatus[statusKey] || 0) + 1;

    const methodKey = (t.method || "OTHER").toUpperCase();
    byMethod[methodKey] = (byMethod[methodKey] || 0) + 1;

    const bytes = parsed?.metrics?.bytesReceived ?? t.responseSize ?? 0;
    bytesTotal += bytes;

    const rt = parsed?.metrics?.responseTime ?? t.duration ?? 0;
    timeTotal += rt;
    if (rt > 0) {
      if (rt < timeMin) timeMin = rt;
      if (rt > timeMax) timeMax = rt;
    }

    if (t.status && t.status.toLowerCase() !== "passed") {
      const key = `Failed (${statusKey || "unknown"})`;
      byError[key] = (byError[key] || 0) + 1;
    }

    rows.push({
      id: t.id,
      name: t.name,
      method: methodKey,
      url: t.url || "",
      duration: rt,
      statusCode,
    });
  }

  const total = allTestCases.length;
  const avg = total ? timeTotal / total : 0;

  const sortedAsc = [...rows].sort((a, b) => a.duration - b.duration);
  const sortedDesc = [...rows].sort((a, b) => b.duration - a.duration);

  const uniqueEndpoints = new Set((report.requests ?? []).map((r) => r.url))
    .size;

  return {
    totalRequests: total,
    uniqueEndpoints,
    averageResponseTime: avg,
    minResponseTime: Number.isFinite(timeMin) ? timeMin : 0,
    maxResponseTime: timeMax,
    totalDataTransferred: bytesTotal,
    requestsByMethod: byMethod,
    statusCodeDistribution: byStatus,
    errorTypes: byError,
    slowestRequests: sortedDesc.slice(0, 10),
    fastestRequests: sortedAsc.slice(0, 10),
  };
}
