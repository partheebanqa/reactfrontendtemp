import { apiRequest } from '@/lib/queryClient';
import { API_EXECUTOR } from '@/config/apiRoutes';
import {
  APIRequest,
  Variable,
  ExecutionLog,
  ExecuteRequestPayload,
  ExecutionResponse,
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
  const replaceVariables = (text: string, vars: Variable[]): string => {
    let result = text;
    vars.forEach((variable) => {
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      result = result.replace(regex, variable.value);
    });
    return result;
  };

  const replace = (str: string) => replaceVariables(str, variables);

  return {
    request: {
      workspaceId,
      name: request.name,
      order: request.order || 0,
      method: request.method,
      url: replace(request.url),
      bodyType: request.bodyType,
      bodyFormData: request.bodyFormData ?? null,
      bodyRawContent: replace(request.body ?? ''),
      authorizationType: request.authType,
      authorization:
        request.authType === 'bearer'
          ? { token: replace(request.authToken ?? '') }
          : undefined,
      headers: (request.headers || [])
        .filter((h) => h.enabled)
        .map((h) => ({
          key: h.key,
          value: replace(h.value),
          enabled: true,
        })),
      params: (request.params || [])
        .filter((p) => p.enabled)
        .map((p) => ({
          key: p.key,
          value: replace(p.value),
          enabled: true,
        })),
    },
  };
};
