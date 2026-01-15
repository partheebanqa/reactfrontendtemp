import { API_EXECUTOR, API_REQUEST } from '@/config/apiRoutes';
import { apiRequest } from '@/lib/queryClient';

export interface ValidationAssertion {
  category: string;
  type: string;
  description: string;
  field?: string;
  operator?: string;
  expectedValue?: any;
  enabled: boolean;
  group?: string;
}

export interface ValidationResponse {
  requestId: string;
  requestName: string;
  requestCurl: string;
  statusCode: number;
  headers: Record<string, any>;
  body: string;
  error: string;
  extractedVariables: any[];
  metrics: {
    bytesReceived: number;
    responseTime: number;
  };
}

export interface ValidationPayload {
  assertions: ValidationAssertion[];
  response: ValidationResponse;
}

export interface AssertionLog {
  status: 'passed' | 'failed';
  responseStatus: number;
  responseTime: number;
  responseSize: number;
  description: string;
  operator?: string;
  type: string;
  category: string;
  field?: string;
  group?: string;
  errorMessage?: string;
  actualValue?: any;
  expectedValue?: any;
}

export interface ValidationApiResponse {
  assertionResults: AssertionLog[];
  response?: {
    metrics?: {
      responseTime: number;
    };
  };
}

export interface SaveAssertion {
  category: string;
  description: string;
  enabled: boolean;
  expectedValue?: any;
  field?: string;
  group?: string;
  impact?: string;
  operator?: string;
  requestId: string;
  severity?: string;
  type: string;
}

export interface SaveAssertionsPayload {
  assertions: SaveAssertion[];
  environmentId: string;
  workspaceId: string;
}

export interface SaveAssertionsResponse {
  success: boolean;
  message?: string;
}

export const validateAssertions = async (
  payload: ValidationPayload
): Promise<ValidationApiResponse> => {
  console.log('payload090', payload);

  const response = await apiRequest(
    'POST',
    `${API_EXECUTOR}/validate-assertions`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(
      `Failed to validate assertions (${response.status}): ${errorText}`
    );
  }

  return response.json();
};

export const saveAssertions = async (
  requestId: string,
  payload: SaveAssertionsPayload
): Promise<SaveAssertionsResponse> => {
  console.log('Saving assertions for request:', requestId, payload);

  const response = await apiRequest(
    'PUT',
    `${API_REQUEST}/${requestId}/assertions`,
    {
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(
      `Failed to save assertions (${response.status}): ${errorText}`
    );
  }

  return response.json();
};
