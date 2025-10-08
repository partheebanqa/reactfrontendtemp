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

export interface Variable {
  id: string;
  name: string;
  value?: string;
  initialValue?: string;
  type?: string;
  isDynamic?: boolean;
}

export interface DynamicVariableOverride {
  name: string;
  value: string;
}

export interface AutocompleteState {
  show: boolean;
  position: { top: number; left: number };
  suggestions: Variable[];
  prefix: 'D_' | 'S_' | null;
  inputRef: HTMLInputElement | HTMLTextAreaElement | null;
  cursorPosition: number;
}

// Common function to map dynamic variables to static format
export const mapDynamicToStatic = (
  dynamicVariables: any[],
  overrides: DynamicVariableOverride[] = []
) => {
  const randInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const randString = (len: number) =>
    Array.from({ length: len }, () =>
      Math.random().toString(36).charAt(2)
    ).join('');

  const fakeName = () =>
    ['Alice Johnson', 'Bob Smith', 'Charlie Brown'][
      Math.floor(Math.random() * 3)
    ];

  return dynamicVariables.map((d) => {
    const override = overrides.find((o) => o.name === d.name);
    if (override) {
      return {
        id: d.id,
        environmentId: null,
        name: `${d.name}`,
        description: '',
        type: 'dynamic',
        initialValue: '',
        currentValue: override.value,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        deletedAt: d.deletedAt,
        value: override.value,
        scope: 'environment',
        isGlobal: false,
        isSecret: false,
        isDynamic: true,
      };
    }

    let generated: string | number;

    switch (d.generatorId) {
      case 'randomString':
        generated = randString(d.parameters?.length || 8);
        break;
      case 'randomInteger':
        generated = randInt(d.parameters?.min || 0, d.parameters?.max || 100);
        break;
      case 'name':
        generated = fakeName();
        break;
      default:
        generated = '';
    }

    return {
      id: d.id,
      environmentId: null,
      name: `${d.name}`,
      description: '',
      type: 'dynamic',
      initialValue: '',
      currentValue: String(generated),
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      deletedAt: d.deletedAt,
      value: String(generated),
      scope: 'environment',
      isGlobal: false,
      isSecret: false,
      isDynamic: true,
    };
  });
};

// Common function to regenerate dynamic variable values
export const regenerateDynamicVariable = (dynamicVar: any) => {
  if (!dynamicVar) return '';

  const randInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
  const randString = (len: number) =>
    Array.from({ length: len }, () =>
      Math.random().toString(36).charAt(2)
    ).join('');
  const fakeName = () =>
    ['Alice Johnson', 'Bob Smith', 'Charlie Brown'][
      Math.floor(Math.random() * 3)
    ];

  let newValue: string | number;
  switch (dynamicVar.generatorId) {
    case 'randomString':
      newValue = randString(dynamicVar.parameters?.length || 8);
      break;
    case 'randomInteger':
      newValue = randInt(
        dynamicVar.parameters?.min || 0,
        dynamicVar.parameters?.max || 100
      );
      break;
    case 'name':
      newValue = fakeName();
      break;
    default:
      newValue = '';
  }

  return String(newValue);
};

// Common function to get variables by prefix (D_ or S_)
export const getVariablesByPrefix = (
  variables: Variable[],
  prefix: 'D_' | 'S_'
): Variable[] => {
  return variables.filter((variable) => variable.name.startsWith(prefix));
};

// Common function to find used dynamic variables in text fields
export const findUsedVariables = (textFields: string[]): string[] => {
  const allText = textFields.join(' ');
  const variableMatches = allText.match(/\{\{(\w+)\}\}/g) || [];
  return [
    ...new Set(
      variableMatches.map((match) => match.replace(/\{\{(\w+)\}\}/, '$1'))
    ),
  ];
};

// Common function to get used dynamic variables from a request
export const getUsedDynamicVariablesFromRequest = (
  request: any,
  dynamicVariables: Variable[]
): Variable[] => {
  const textFields = [
    request.url || '',
    request.body || '',
    request.authToken || '',
    request.authUsername || '',
    request.authPassword || '',
    request.authApiKey || '',
    request.authApiValue || '',
    request.authorization?.token || '',
    request.authorization?.username || '',
    request.authorization?.password || '',
    request.authorization?.key || '',
    request.authorization?.value || '',
    ...(request.headers || []).map((h: any) => `${h.key} ${h.value}`),
    ...(request.params || []).map((p: any) => `${p.key} ${p.value}`),
  ];

  const usedVariableNames = findUsedVariables(textFields);
  return dynamicVariables.filter((variable) =>
    usedVariableNames.includes(variable.name)
  );
};

// Common function to get used dynamic variables from multiple requests
export const getUsedDynamicVariablesFromRequests = (
  requests: any[],
  dynamicVariables: Variable[]
): Variable[] => {
  const allTextFields: string[] = [];

  requests.forEach((request) => {
    allTextFields.push(
      request.url || '',
      request.body || '',
      request.authToken || '',
      request.authUsername || '',
      request.authPassword || '',
      request.authApiKey || '',
      request.authApiValue || '',
      request.authorization?.token || '',
      request.authorization?.username || '',
      request.authorization?.password || '',
      request.authorization?.key || '',
      request.authorization?.value || '',
      ...(request.headers || []).map((h: any) => `${h.key} ${h.value}`),
      ...(request.params || []).map((p: any) => `${p.key} ${p.value}`)
    );
  });

  const usedVariableNames = findUsedVariables(allTextFields);
  return dynamicVariables.filter((variable) =>
    usedVariableNames.includes(variable.name)
  );
};

// Common function to handle autocomplete input detection
export const detectAutocompletePrefix = (
  value: string,
  cursorPosition: number
): 'D_' | 'S_' | null => {
  const textBeforeCursor = value.substring(0, cursorPosition);
  const lastTwoChars = textBeforeCursor.slice(-2);

  if (lastTwoChars === 'D_' || lastTwoChars === 'S_') {
    return lastTwoChars as 'D_' | 'S_';
  }

  return null;
};

export const calculateAutocompletePosition = (
  input: HTMLInputElement | HTMLTextAreaElement
) => {
  const rect = input.getBoundingClientRect();
  return {
    top: rect.bottom + window.scrollY,
    left: rect.left + window.scrollX,
  };
};
