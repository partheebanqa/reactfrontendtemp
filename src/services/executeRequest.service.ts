import { apiRequest } from '@/lib/queryClient';
import {
  API_EXECUTOR,
  PERFORMANCE_API_BASE,
  SECURITY_API_BASE,
} from '@/config/apiRoutes';
import {
  APIRequest,
  Variable,
  ExecutionLog,
  ExecuteRequestPayload,
  ExecutionResponse,
  ExecutionRequestChainPayload,
} from '@/shared/types/requestChain.model';
import { apiRequestWithErrorDetails } from '@/lib/queryClientWithErrorDetail';

export interface SecurityScanHistoryItem {
  id: string;
  targetUrl: string;
  scanType: string;
  status: 'completed' | 'running' | 'failed';
  startTime: string;
  endTime?: string;
  duration: number;
  totalAlerts: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  infoRisk: number;
}

export interface SecurityScanHistoryResponse {
  scans: SecurityScanHistoryItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface Vulnerability {
  id: string;
  severity: 'high' | 'medium' | 'low' | 'info';
  confidence?: 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
  recommendation?: string;
  cwe?: string;
  owasp?: string;
}

export interface ScanResult {
  scanId: string;
  completedAt: string;
  totalIssues: number;
  highSeverity: number;
  mediumSeverity: number;
  lowSeverity: number;
  informational: number;
  vulnerabilities: Vulnerability[];
  passedChecks: number;
}

export interface PerformanceCheckResult {
  name: string;
  passed: boolean;
  score: number;
  details: string;
  suggestions: string[];
}

export interface PerformanceAnalyzerHistoryItem {
  analyserId: string;
  requestId: string;
  requestName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  results?: PerformanceCheckResult[];
  overallScore?: number;
  grade?: string;
  recommendations?: string[];
}

export interface PerformanceAnalyzerHistoryResponse {
  total: number;
  page: number;
  limit: number;
  items: PerformanceAnalyzerHistoryItem[];
}

export interface PerformanceAnalyzerResult {
  analyserId: string;
  requestId: string;
  requestName: string;
  status: 'completed' | 'running' | 'failed';
  startedAt: string;
  completedAt: string;
  results: PerformanceCheckResult[];
  overallScore: number;
  grade: string;
  recommendations: string[];
}

export interface StartPerformanceAnalyzerPayload {
  requestId: string;
  workspaceId: string;
  environmentId?: string;
  enabledChecks: string[];
}

export const executeRequest = async (
  payload: ExecuteRequestPayload,
): Promise<ExecutionResponse> => {
  try {
    const response = await apiRequestWithErrorDetails(
      'POST',
      `${API_EXECUTOR}/request`,
      {
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to execute request: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to execute request');
  }
};

export const buildRequestPayload = (
  request: APIRequest,
  variables: Variable[],
  workspaceId = '01415fe5-b282-4295-a386-267ece622c7b',
): ExecuteRequestPayload => {
  const replaceVariables = (text: string | undefined): string => {
    if (!text) return '';
    let result = text;
    variables.forEach((variable) => {
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      const varValue = String(
        variable.value ?? variable.currentValue ?? variable.initialValue ?? '',
      );
      result = result.replace(regex, varValue);
    });
    return result;
  };

  const getAuthToken = (): string => {
    if (request.authorizationType === 'bearer') {
      const rawToken = request.authToken ?? request.authorization?.token ?? '';
      return replaceVariables(rawToken);
    }
    return '';
  };

  const buildAuthorization = () => {
    if (request.authorizationType === 'bearer') {
      return { token: getAuthToken() };
    } else if (request.authorizationType === 'basic') {
      return {
        username: replaceVariables(
          request.authUsername || request.authorization?.username || '',
        ),
        password: replaceVariables(
          request.authPassword || request.authorization?.password || '',
        ),
      };
    } else if (request.authorizationType === 'apikey') {
      return {
        key: replaceVariables(
          request.authApiKey || request.authorization?.key || '',
        ),
        value: replaceVariables(
          request.authApiValue || request.authorization?.value || '',
        ),
        addTo:
          request.authApiLocation || request.authorization?.addTo || 'header',
      };
    }
    return undefined;
  };

  const processFormData = () => {
    let formDataSource = request.bodyFormData;
    if (!formDataSource && request.bodyType === 'form-data' && request.body) {
      try {
        const parsedBody = JSON.parse(request.body);
        if (Array.isArray(parsedBody)) {
          formDataSource = parsedBody;
        }
      } catch (e) {
        console.error('Failed to parse form-data from body:', e);
        return null;
      }
    }

    if (!formDataSource || !Array.isArray(formDataSource)) {
      return null;
    }

    return formDataSource
      .filter((field: any) => field.enabled !== false)
      .map((field: any) => ({
        key: replaceVariables(field.key),
        value: replaceVariables(field.value),
        enabled: field.enabled !== false,
        type: field.type || 'text',
      }));
  };

  return {
    request: {
      workspaceId,
      name: request.name,
      order: request.order || 0,
      method: request.method,
      url: replaceVariables(request.url),
      bodyType: request.bodyType,
      bodyFormData: processFormData(),
      bodyRawContent:
        request.bodyType === 'raw' || request.bodyType === 'json'
          ? replaceVariables(request.body)
          : '',

      authorizationType: request.authorizationType,
      authorization: buildAuthorization(),

      headers: (request.headers || [])
        .filter((h) => h.enabled)
        .map((h) => ({
          key: h.key,
          value: replaceVariables(h.value),
          enabled: true,
        })),

      params: (request.params || [])
        .filter((p) => p.enabled)
        .map((p) => ({
          key: p.key,
          value: replaceVariables(p.value),
          enabled: true,
        })),
    },
  };
};

export const executeRequestChain = async (
  payload: ExecutionRequestChainPayload,
): Promise<ExecutionResponse> => {
  try {
    const response = await apiRequest('POST', `${API_EXECUTOR}/request-chain`, {
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to execute request: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to execute request');
  }
};

export const executeCollectionRequest = async (
  requestId: string,
  environmentId?: string,
): Promise<ExecutionResponse> => {
  try {
    const body: Record<string, string> = { requestId };
    if (environmentId) {
      body.environmentId = environmentId;
    }

    const response = await apiRequest(
      'POST',
      `${API_EXECUTOR}/collection-request`,
      {
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to execute request: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to execute request');
  }
};

type SecurityReportStatus = 'running' | 'completed' | 'failed';

interface SecurityReportResponse {
  scanId: string;
  status: SecurityReportStatus;
  targetUrl?: string;
  scanDate?: string;
  completedAt?: string;
  totalAlerts?: number;
  summary?: {
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    informational: number;
  };
  alerts?: Array<{
    id: string;
    name: string;
    risk: string;
    confidence: string;
    url: string;
    description: string;
    solution: string;
    reference: string;
    cwe: string;
    wasc: string;
    tags: string | null;
  }>;
}

const transformSecurityReport = (
  report: SecurityReportResponse,
): ScanResult => {
  const summary = report.summary || {
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    informational: 0,
  };

  const alerts = report.alerts || [];

  const vulnerabilities = alerts.map((alert) => {
    let severity: 'high' | 'medium' | 'low' | 'info';

    switch (alert.risk.toLowerCase()) {
      case 'high':
        severity = 'high';
        break;
      case 'medium':
        severity = 'medium';
        break;
      case 'low':
        severity = 'low';
        break;
      default:
        severity = 'info';
    }

    return {
      id: alert.id,
      severity,
      confidence: alert.confidence as 'High' | 'Medium' | 'Low',
      title: alert.name,
      description: alert.description,
      recommendation: alert.solution,
      cwe: alert.cwe !== '-1' ? alert.cwe : undefined,
      owasp: alert.reference,
    };
  });

  return {
    scanId: report.scanId,
    completedAt:
      report.scanDate || report.completedAt || new Date().toISOString(),
    totalIssues: report.totalAlerts || 0,
    highSeverity: summary.highRisk,
    mediumSeverity: summary.mediumRisk,
    lowSeverity: summary.lowRisk,
    informational: summary.informational,
    vulnerabilities,
    passedChecks: 0,
  };
};

export const fetchScanHistory = async (
  workspaceId: string,
  pageSize: number = 500,
): Promise<SecurityScanHistoryResponse> => {
  try {
    const response = await apiRequest(
      'GET',
      `${SECURITY_API_BASE}/workspace/${workspaceId}/scans?pageSize=${pageSize}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch scan history: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch scan history');
  }
};

/**
 * Start a new security scan
 */
export const startSecurityScan = async (
  requestId: string,
): Promise<{ scanId: string }> => {
  try {
    const response = await apiRequest(
      'POST',
      `${SECURITY_API_BASE}/scan/start`,
      {
        body: JSON.stringify({ requestId }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to start scan: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to start security scan');
  }
};

export const getSecurityScanStatus = async (
  scanId: string,
  signal?: AbortSignal,
): Promise<{
  scanId: string;
  status: 'pending' | 'scanning' | 'completed' | 'failed';
  progress?: number;
}> => {
  try {
    const response = await apiRequest(
      'GET',
      `${SECURITY_API_BASE}/scan/${scanId}/status`,
      { signal },
    );

    if (!response.ok) {
      throw new Error(`Failed to get scan status: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Scan cancelled');
    }
    throw new Error(error.message || 'Failed to fetch scan status');
  }
};

export const getSecurityReport = async (
  scanId: string,
  signal?: AbortSignal,
): Promise<SecurityReportResponse> => {
  const response = await apiRequest(
    'GET',
    `${SECURITY_API_BASE}/report?scanId=${scanId}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch security report`);
  }

  return response.json();
};

export const pollSecurityReport = async (
  scanId: string,
  signal?: AbortSignal,
  interval = 3000,
  maxDuration = 120000,
): Promise<ScanResult> => {
  const startTime = Date.now();

  while (true) {
    if (signal?.aborted) {
      throw new Error('Scan cancelled');
    }

    if (Date.now() - startTime >= maxDuration) {
      throw new Error('Security report generation timed out');
    }

    const report = await getSecurityReport(scanId, signal);

    if (report.status === 'completed') {
      return transformSecurityReport(report);
    }

    if (report.status === 'failed') {
      throw new Error('Security report generation failed');
    }

    await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(resolve, interval);

      if (signal) {
        signal.addEventListener(
          'abort',
          () => {
            clearTimeout(timeoutId);
            reject(new Error('Scan cancelled'));
          },
          { once: true },
        );
      }
    });
  }
};

export const pollSecurityScan = async (
  scanId: string,
  onProgress?: (status: any) => void,
  signal?: AbortSignal,
  interval = 2000,
  maxDuration = 120000,
): Promise<ScanResult> => {
  const startTime = Date.now();

  await new Promise((resolve, reject) => {
    const timeoutId = setTimeout(resolve, 4000);

    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timeoutId);
          reject(new Error('Scan cancelled'));
        },
        { once: true },
      );
    }
  });

  while (true) {
    if (signal?.aborted) {
      throw new Error('Scan cancelled');
    }

    if (Date.now() - startTime >= maxDuration) {
      throw new Error('Security scan timed out. Please try again.');
    }

    const status = await getSecurityScanStatus(scanId, signal);
    onProgress?.(status);

    if (status.status === 'completed') {
      return pollSecurityReport(scanId, signal, interval, maxDuration);
    }

    if (status.status === 'failed') {
      throw new Error('Security scan failed');
    }

    await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(resolve, interval);

      if (signal) {
        signal.addEventListener(
          'abort',
          () => {
            clearTimeout(timeoutId);
            reject(new Error('Scan cancelled'));
          },
          { once: true },
        );
      }
    });
  }
};

export const loadHistoricalScan = async (
  scanId: string,
  signal?: AbortSignal,
): Promise<ScanResult> => {
  try {
    return await pollSecurityReport(scanId, signal);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to load historical scan');
  }
};

export const startPerformanceAnalyzer = async (
  payload: StartPerformanceAnalyzerPayload,
): Promise<{ analyserId: string; status: string; message: string }> => {
  try {
    const response = await apiRequest('POST', PERFORMANCE_API_BASE, {
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to start performance analyzer: ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to start performance analyzer');
  }
};

export const fetchPerformanceHistory = async (
  requestId: string,
  page: number = 1,
  limit: number = 10,
): Promise<PerformanceAnalyzerHistoryResponse> => {
  try {
    const response = await apiRequest(
      'GET',
      `${PERFORMANCE_API_BASE}/request/${requestId}?page=${page}&limit=${limit}`,
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch performance history: ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch performance history');
  }
};

export const getPerformanceReport = async (
  analyserId: string,
  signal?: AbortSignal,
): Promise<PerformanceAnalyzerResult> => {
  try {
    const response = await apiRequest(
      'GET',
      `${PERFORMANCE_API_BASE}/${analyserId}`,
      { signal },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch performance report: ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Analysis cancelled');
    }
    throw new Error(error.message || 'Failed to fetch performance report');
  }
};

export const pollPerformanceReport = async (
  analyserId: string,
  signal?: AbortSignal,
  interval = 3000,
  maxDuration = 120000,
): Promise<PerformanceAnalyzerResult> => {
  const startTime = Date.now();

  // Initial delay
  await new Promise((resolve, reject) => {
    const timeoutId = setTimeout(resolve, 4000);

    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timeoutId);
          reject(new Error('Analysis cancelled'));
        },
        { once: true },
      );
    }
  });

  while (true) {
    if (signal?.aborted) {
      throw new Error('Analysis cancelled');
    }

    if (Date.now() - startTime >= maxDuration) {
      throw new Error('Performance analysis timed out. Please try again.');
    }

    const report = await getPerformanceReport(analyserId, signal);

    if (report.status === 'completed') {
      return report;
    }

    if (report.status === 'failed') {
      throw new Error('Performance analysis failed');
    }

    await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(resolve, interval);

      if (signal) {
        signal.addEventListener(
          'abort',
          () => {
            clearTimeout(timeoutId);
            reject(new Error('Analysis cancelled'));
          },
          { once: true },
        );
      }
    });
  }
};

export const loadHistoricalPerformanceAnalysis = async (
  analyserId: string,
  signal?: AbortSignal,
): Promise<PerformanceAnalyzerResult> => {
  try {
    return await getPerformanceReport(analyserId, signal);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to load historical analysis');
  }
};
