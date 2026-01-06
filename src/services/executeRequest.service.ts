import { apiRequest } from '@/lib/queryClient';
import { API_EXECUTOR, SECURITY_API_BASE } from '@/config/apiRoutes';
import {
  APIRequest,
  Variable,
  ExecutionLog,
  ExecuteRequestPayload,
  ExecutionResponse,
  ExecutionRequestChainPayload,
} from '@/shared/types/requestChain.model';
import { apiRequestWithErrorDetails } from '@/lib/queryClientWithErrorDetail';

export const executeRequest = async (
  payload: ExecuteRequestPayload
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
      }
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
  workspaceId = '01415fe5-b282-4295-a386-267ece622c7b'
): ExecuteRequestPayload => {
  const replaceVariables = (text: string | undefined): string => {
    if (!text) return '';
    let result = text;
    variables.forEach((variable) => {
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      const varValue = String(
        variable.value ?? variable.currentValue ?? variable.initialValue ?? ''
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
          request.authUsername || request.authorization?.username || ''
        ),
        password: replaceVariables(
          request.authPassword || request.authorization?.password || ''
        ),
      };
    } else if (request.authorizationType === 'apikey') {
      return {
        key: replaceVariables(
          request.authApiKey || request.authorization?.key || ''
        ),
        value: replaceVariables(
          request.authApiValue || request.authorization?.value || ''
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
  payload: ExecutionRequestChainPayload
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
  environmentId?: string
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
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to execute request: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to execute request');
  }
};

export const startSecurityScan = async (
  requestId: string
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
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to start scan: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to start security scan');
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

// Transform API response to match component's ScanResult interface
const transformSecurityReport = (report: SecurityReportResponse) => {
  const summary = report.summary || {
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    informational: 0,
  };

  const alerts = report.alerts || [];

  // Map risk levels to severity
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
      confidence: alert.confidence as 'High' | 'Medium' | 'Low', // Add this line
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

export const getSecurityScanStatus = async (
  scanId: string
): Promise<{
  scanId: string;
  status: 'pending' | 'scanning' | 'completed' | 'failed';
  progress?: number;
}> => {
  try {
    const response = await apiRequest(
      'GET',
      `${SECURITY_API_BASE}/scan/${scanId}/status`
    );

    if (!response.ok) {
      throw new Error(`Failed to get scan status: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch scan status');
  }
};

export const getSecurityReport = async (
  scanId: string
): Promise<SecurityReportResponse> => {
  const response = await apiRequest(
    'GET',
    `${SECURITY_API_BASE}/report?scanId=${scanId}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch security report`);
  }

  return response.json();
};

const pollSecurityReport = async (
  scanId: string,
  interval = 3000,
  maxDuration = 120000
) => {
  const startTime = Date.now();

  while (true) {
    if (Date.now() - startTime >= maxDuration) {
      throw new Error('Security report generation timed out');
    }

    const report = await getSecurityReport(scanId);

    if (report.status === 'completed') {
      // Transform the report before returning
      return transformSecurityReport(report);
    }

    if (report.status === 'failed') {
      throw new Error('Security report generation failed');
    }

    await new Promise((r) => setTimeout(r, interval));
  }
};

export const pollSecurityScan = async (
  scanId: string,
  onProgress?: (status: any) => void,
  interval = 2000,
  maxDuration = 120000
) => {
  const startTime = Date.now();

  await new Promise((r) => setTimeout(r, 4000));

  while (true) {
    if (Date.now() - startTime >= maxDuration) {
      throw new Error('Security scan timed out. Please try again.');
    }

    const status = await getSecurityScanStatus(scanId);
    onProgress?.(status);

    if (status.status === 'completed') {
      return pollSecurityReport(scanId, interval, maxDuration);
    }

    if (status.status === 'failed') {
      throw new Error('Security scan failed');
    }

    await new Promise((r) => setTimeout(r, interval));
  }
};
