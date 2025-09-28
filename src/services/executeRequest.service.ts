import { apiRequest } from '@/lib/queryClient';
import { API_EXECUTOR } from '@/config/apiRoutes';
import {
  APIRequest,
  Variable,
  ExecutionLog,
  ExecuteRequestPayload,
  ExecutionResponse,
  ExecutionRequestChainPayload,
} from '@/shared/types/requestChain.model';

export const executeRequest = async (
  payload: ExecuteRequestPayload
): Promise<ExecutionResponse> => {
  try {
    const response = await apiRequest('POST', `${API_EXECUTOR}/request`, {
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

export const buildRequestPayload = (
  request: APIRequest,
  variables: Variable[],
  workspaceId: string = '01415fe5-b282-4295-a386-267ece622c7b'
): ExecuteRequestPayload => {
  const replaceVariables = (text: string | undefined): string => {
    if (!text) return '';
    let result = text;
    variables.forEach((variable) => {
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      result = result.replace(
        regex,
        variable.initialValue ?? variable.value ?? ''
      );
    });
    return result;
  };

  // Get the token from either authToken field or authorization.token field
  const getAuthToken = (): string => {
    if (request.authorizationType === 'bearer') {
      // Check authorization.token first, then fallback to authToken
      const token = request.authorization?.token || request.authToken || '';
      return replaceVariables(token);
    }
    return '';
  };

  return {
    request: {
      workspaceId,
      name: request.name,
      order: request.order || 0,
      method: request.method,
      url: replaceVariables(request.url),
      bodyType: request.bodyType,
      bodyFormData: request.bodyFormData ?? null,
      bodyRawContent: replaceVariables(request.body),
      authorizationType: request.authorizationType,
      authorization:
        request.authorizationType === 'bearer'
          ? { token: getAuthToken() }
          : request.authorizationType === 'basic'
          ? {
              username: replaceVariables(request.authUsername || ''),
              password: replaceVariables(request.authPassword || ''),
            }
          : request.authorizationType === 'apikey'
          ? {
              key: replaceVariables(request.authApiKey || ''),
              value: replaceVariables(request.authApiValue || ''),
              addTo: request.authApiLocation || 'header',
            }
          : undefined,
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
