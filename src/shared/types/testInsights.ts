export interface TestResult {
  id: string;
  name: string;
  method: string;
  status: 'passed' | 'failed' | 'skipped';
  statusCode: number;
  responseTime: number;
  payloadSize?: number;
  timestamp: string;
  error?: string;
  hasAuthHeader?: boolean;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
}

export interface TestMetrics {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  authAPIs: number;
  maxResponseTime: number;
  minResponseTime: number;
  slowestAPI: string;
  fastestAPI: string;
  totalExecutionTime: number;
  mostFailedStatusCode?: {
    code: number;
    count: number;
  };
}

export interface Insight {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}
