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
  workspaceId = '01415fe5-b282-4295-a386-267ece622c7b'
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

  const getAuthToken = (): string => {
    if (request.authorizationType === 'bearer') {
      // Always replace variables — prevents using stale old token
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
