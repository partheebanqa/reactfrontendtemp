import { toast } from '@/hooks/use-toast';
import type {
  APIRequest,
  ExecutionLog,
} from '@/shared/types/requestChain.model';

export const getExtractVariablesByEnvironment = (environmentId?: string) => {
  const readFallbackExtractedVariables = () => {
    try {
      const raw = localStorage.getItem('extractedVariables');
      if (!raw) return [];
      const obj = JSON.parse(raw) as Record<string, any>;
      if (!obj || typeof obj !== 'object') return [];
      return Object.entries(obj).map(([name, value]) => ({
        name,
        initialValue: value ?? '',
        type: 'string',
        value: value ?? '',
      }));
    } catch (e) {
      console.error('Error reading fallback extractedVariables:', e);
      return [];
    }
  };

  if (
    !environmentId ||
    environmentId === 'no-environment' ||
    environmentId === 'No Environment'
  ) {
    return readFallbackExtractedVariables();
  }

  try {
    const rawLogs = localStorage.getItem('extractionLogs');
    if (!rawLogs) return readFallbackExtractedVariables();

    const parsedLogs = JSON.parse(rawLogs);
    if (!Array.isArray(parsedLogs)) return readFallbackExtractedVariables();

    const envVars =
      parsedLogs
        .filter((log: any) => log.environmentId === environmentId)
        .flatMap(
          (log: any) =>
            log.chainRequests?.flatMap((req: any) =>
              (req.extractVariables || []).map((v: any) => ({
                name: v.variableName || v.name,
                initialValue: v.value || '',
                type: 'string',
                value: v.value || '',
              }))
            ) || []
        ) || [];

    return envVars.length > 0 ? envVars : readFallbackExtractedVariables();
  } catch (err) {
    console.error('Error reading extractionLogs from localStorage:', err);
    return readFallbackExtractedVariables();
  }
};

export const getValueByPath = (obj: any, path: string): any => {
  if (!obj || !path) return undefined;

  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object') {
      if (key.includes('[') && key.includes(']')) {
        const arrayKey = key.substring(0, key.indexOf('['));
        const index = Number.parseInt(
          key.substring(key.indexOf('[') + 1, key.indexOf(']'))
        );
        if (current[arrayKey] && Array.isArray(current[arrayKey])) {
          return current[arrayKey][index];
        }
        return undefined;
      }
      return current[key];
    }
    return undefined;
  }, obj);
};

export const extractDataFromResponse = (
  response: any,
  extractions: APIRequest['extractVariables']
): Record<string, any> => {
  const extracted: Record<string, any> = {};

  if (!extractions || !Array.isArray(extractions)) {
    return extracted;
  }

  extractions.forEach((extraction) => {
    try {
      let value;
      const variableName = extraction.variableName || extraction.name;

      if (!variableName || !extraction.path) {
        console.warn(
          'Skipping extraction: missing variable name or path',
          extraction
        );
        return;
      }

      if (extraction.source === 'response_body') {
        let jsonData;
        try {
          jsonData =
            typeof response.body === 'string'
              ? JSON.parse(response.body)
              : response.body;
        } catch (parseError) {
          console.error('Failed to parse response body as JSON:', parseError);
          return;
        }
        value = getValueByPath(jsonData, extraction.path);
      } else if (extraction.source === 'response_header') {
        const headers = response.headers || {};
        const headerKey = extraction.path.toLowerCase();

        value = headers[headerKey];

        if (value === undefined) {
          const foundKey = Object.keys(headers).find(
            (key) => key.toLowerCase() === headerKey
          );
          if (foundKey) {
            value = headers[foundKey];
          }
        }
      } else if (extraction.source === 'response_cookie') {
        value = response.cookies?.[extraction.path];
      }

      if (value !== undefined) {
        if (extraction.transform) {
          try {
            const transformFunction = new Function(
              'value',
              `return ${extraction.transform}`
            );
            value = transformFunction(value);
          } catch (transformError) {
            console.error(
              `Transform error for ${variableName}:`,
              transformError
            );
          }
        }
        extracted[variableName] = value;
      }
    } catch (error) {
      const variableName = extraction.variableName || extraction.name;
      console.error(`Failed to extract ${variableName}:`, error);
    }
  });
  return extracted;
};

export const copyToClipboard = async (text: string) => {
  try {
    const formattedText = `{{${text}}}`;
    await navigator.clipboard.writeText(formattedText);
    toast({
      title: 'Copied to Clipboard',
      description: `Copied: ${formattedText}`,
    });
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

export const getExecutionLogForRequest = (
  executionLogs: ExecutionLog[],
  requestId: string
): ExecutionLog | null => {
  const executionLogsreturn =
    executionLogs.find((log) => log.requestId === requestId) || null;
  return executionLogsreturn;
};

export const transformRequestForSave = (request: APIRequest): APIRequest => {
  const transformedRequest = { ...request };

  if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
    transformedRequest.body = request.body;
    transformedRequest.bodyRawContent = request.body;
  }

  if (request.authorizationType === 'bearer' && request.authToken) {
    transformedRequest.authorization = {
      token: request.authToken,
    };
    delete transformedRequest.authToken;
  }

  if (
    request.authorizationType === 'basic' &&
    request.authUsername &&
    request.authPassword
  ) {
    // transformedRequest.authorization = {
    //   username: request.authUsername,
    //   password: request.authPassword,
    // };
    delete transformedRequest.authUsername;
    delete transformedRequest.authPassword;
  }

  // Handle API Key Auth
  if (
    request.authorizationType === 'apikey' &&
    request.authApiKey &&
    request.authApiValue
  ) {
    // transformedRequest.authorization = {
    //   key: request.authApiKey,
    //   value: request.authApiValue,
    //   addTo: request.authApiLocation || 'header',
    // };
    delete transformedRequest.authApiKey;
    delete transformedRequest.authApiValue;
    delete transformedRequest.authApiLocation;
  }

  return transformedRequest;
};

// Helper function to replace variables in any text
export const replaceVariablesInText = (
  text: string,
  variables: any[]
): string => {
  if (!text) return text;
  let result = text;
  variables.forEach((variable) => {
    const varName = variable.name || variable.variableName;
    const varValue = variable.value || variable.initialValue || '';
    if (varName) {
      const regex = new RegExp(`{{${varName}}}`, 'g');
      result = result.replace(regex, varValue);
    }
  });
  return result;
};

// Process entire request with variable substitution
export const processRequestWithVariables = (
  request: any,
  variables: any[]
): any => {
  if (!request || !variables) return request;

  return {
    ...request,
    url: replaceVariablesInText(request.url, variables),
    body: replaceVariablesInText(request.body || '', variables),
    bodyRawContent: replaceVariablesInText(
      request.bodyRawContent || '',
      variables
    ),
    headers: (request.headers || []).map((header: any) => ({
      ...header,
      key: replaceVariablesInText(header.key, variables),
      value: replaceVariablesInText(header.value, variables),
    })),
    params: (request.params || []).map((param: any) => ({
      ...param,
      key: replaceVariablesInText(param.key, variables),
      value: replaceVariablesInText(param.value, variables),
    })),
    authToken: replaceVariablesInText(request.authToken || '', variables),
    authUsername: replaceVariablesInText(request.authUsername || '', variables),
    authPassword: replaceVariablesInText(request.authPassword || '', variables),
    authApiKey: replaceVariablesInText(request.authApiKey || '', variables),
    authApiValue: replaceVariablesInText(request.authApiValue || '', variables),
    authorization: request.authorization
      ? {
          ...request.authorization,
          token: replaceVariablesInText(
            request.authorization.token || '',
            variables
          ),
          username: replaceVariablesInText(
            request.authorization.username || '',
            variables
          ),
          password: replaceVariablesInText(
            request.authorization.password || '',
            variables
          ),
          key: replaceVariablesInText(
            request.authorization.key || '',
            variables
          ),
          value: replaceVariablesInText(
            request.authorization.value || '',
            variables
          ),
        }
      : request.authorization,
  };
};
