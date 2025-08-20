import { toast } from '@/hooks/use-toast';
import { APIRequest, ExecutionLog } from '@/shared/types/requestChain.model';

export const getExtractVariablesByEnvironment = (environmentId?: string) => {
  if (!environmentId) return [];

  try {
    const rawLogs = localStorage.getItem('extractionLogs');
    if (!rawLogs) return [];

    const parsedLogs = JSON.parse(rawLogs);
    if (!Array.isArray(parsedLogs)) return [];

    return parsedLogs
      .filter((log) => log.environmentId === environmentId)
      .flatMap(
        (log) =>
          log.chainRequests?.flatMap((req: any) =>
            (req.extractVariables || []).map((v: any) => ({
              name: v.variableName,
              initialValue: v.value || '',
              type: 'string',
              value: v.value || '',
            }))
          ) || []
      );
  } catch (err) {
    console.error('Error reading extractionLogs from localStorage:', err);
    return [];
  }
};

export const getValueByPath = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object') {
      if (key.includes('[') && key.includes(']')) {
        const arrayKey = key.substring(0, key.indexOf('['));
        const index = Number.parseInt(
          key.substring(key.indexOf('[') + 1, key.indexOf(']'))
        );
        return current[arrayKey] && current[arrayKey][index];
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
  extractions.forEach((extraction) => {
    try {
      let value;
      if (extraction.source === 'response_body') {
        const jsonData =
          typeof response.body === 'string'
            ? JSON.parse(response.body)
            : response.body;
        value = getValueByPath(jsonData, extraction.path);
      } else if (extraction.source === 'response_header') {
        // FIXED: Handle case-insensitive header lookup
        const headers = response.headers || {};
        const headerKey = extraction.path.toLowerCase();

        // First try direct lowercase lookup
        value = headers[headerKey];

        // If not found, search through all headers case-insensitively
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
              `Transform error for ${extraction.variableName}:`,
              transformError
            );
          }
        }
        extracted[extraction.variableName] = value;
      }
    } catch (error) {
      console.error(`Failed to extract ${extraction.variableName}:`, error);
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

  // Transform authToken to authorization object structure
  if (request.authorizationType === 'bearer' && request.authToken) {
    transformedRequest.authorization = {
      token: request.authToken,
    };
    delete transformedRequest.authToken;
  }

  // Handle Basic Auth
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
