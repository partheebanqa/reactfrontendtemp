import type {
  APIRequest,
  ExecutionLog,
  KeyValuePair,
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

  if (request.bodyType === 'form-data') {
    if (Array.isArray(request.bodyFormData)) {
      transformedRequest.bodyFormData = request.bodyFormData.map((field) => ({
        key: field.key,
        value: field.value,
        enabled: field.enabled,
        type: field.type,
      }));
    } else if (request.body && typeof request.body === 'string') {
      try {
        const parsed = JSON.parse(request.body);
        if (Array.isArray(parsed)) {
          transformedRequest.bodyFormData = parsed.map((field) => ({
            key: field.key,
            value: field.value,
            enabled: field.enabled,
            type: field.type,
          }));
        }
      } catch (e) {
        console.error('Failed to parse bodyFormData from body:', e);
      }
    }
    transformedRequest.body = '';
    transformedRequest.bodyRawContent = '';
  } else if (request.bodyType === 'urlencoded') {
    if (Array.isArray(request.bodyFormData)) {
      transformedRequest.bodyFormData = request.bodyFormData.map((field) => ({
        key: field.key,
        value: field.value,
        enabled: field.enabled,
      }));
    } else if (request.body && typeof request.body === 'string') {
      try {
        const parsed = JSON.parse(request.body);
        if (Array.isArray(parsed)) {
          transformedRequest.bodyFormData = parsed.map((field) => ({
            key: field.key,
            value: field.value,
            enabled: field.enabled,
          }));
        }
      } catch (e) {
        console.error('Failed to parse bodyFormData from body:', e);
      }
    }
    transformedRequest.bodyRawContent = '';
  } else if (
    request.body &&
    ['POST', 'PUT', 'PATCH'].includes(request.method)
  ) {
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
    delete transformedRequest.authUsername;
    delete transformedRequest.authPassword;
  }

  if (
    request.authorizationType === 'apikey' &&
    request.authApiKey &&
    request.authApiValue
  ) {
    delete transformedRequest.authApiKey;
    delete transformedRequest.authApiValue;
    delete transformedRequest.authApiLocation;
  }

  return transformedRequest;
};

export const replaceVariablesInText = (
  text: string,
  variables: any[]
): string => {
  if (!text) return text;
  let result = text;
  variables.forEach((variable) => {
    const varName = variable.name || variable.variableName;
    const varValue =
      variable.currentValue || variable.value || variable.initialValue || '';
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
  return dynamicVariables.map((d) => {
    const override = overrides.find((o) => o.name === d.name);

    const valueToUse = override ? override.value : '';

    return {
      id: d.id,
      environmentId: null,
      name: `${d.name}`,
      description: '',
      type: 'dynamic',
      initialValue: valueToUse,
      currentValue: valueToUse,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      deletedAt: d.deletedAt,
      value: valueToUse,
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
  const newValue = generateDynamicValueById(
    dynamicVar.generatorId,
    dynamicVar.parameters
  );
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

function generateDynamicValueById(id: string, params: any = {}): string {
  const randInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

  const randStringFrom = (len: number, chars: string) => {
    let out = '';
    for (let i = 0; i < len; i++)
      out += chars.charAt(Math.floor(Math.random() * chars.length));
    return out;
  };

  const randString = (len: number) =>
    randStringFrom(
      len,
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    );

  const uuid = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const nowIso = () => new Date().toISOString();

  const dateOnly = (d = new Date()) => d.toISOString().split('T')[0];

  const ensureFloat = (min = 0, max = 100, decimals = 2) => {
    const val = Math.random() * (max - min) + min;
    return Number.parseFloat(val.toFixed(decimals)).toString();
  };

  const genPassword = (cfg: any) => {
    const config = {
      length: cfg?.length ?? 12,
      includeUpper: cfg?.includeUpper ?? true,
      includeLower: cfg?.includeLower ?? true,
      includeDigit: cfg?.includeDigit ?? true,
      includeSpecial: cfg?.includeSpecial ?? true,
    };
    let chars = '';
    if (config.includeUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (config.includeLower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (config.includeDigit) chars += '0123456789';
    if (config.includeSpecial) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz';
    return randStringFrom(config.length, chars);
  };

  const domains = [
    'example.com',
    'test.com',
    'demo.org',
    'sample.net',
    'gmail.com',
    'yahoo.com',
    'outlook.com',
    'hotmail.com',
  ];

  switch (id) {
    // basic / date\
    case 'timestamp':
      return String(Date.now());
    case 'iso_date':
      return nowIso();
    case 'date_formatted':
      return dateOnly();

    // random
    case 'random_uuid':
      return uuid();
    case 'random_email': {
      const local = Math.random().toString(36).substring(2, 10);
      const domain = pick(domains);
      return `${local}@${domain}`;
    }
    case 'random_phone': {
      const area = randInt(100, 999);
      const exch = randInt(100, 999);
      const num = randInt(1000, 9999);
      return `+1-${area}-${exch}-${num}`;
    }
    case 'random_boolean':
      return String(Math.random() < 0.5);
    case 'random_float': {
      const { min = 0, max = 100, decimals = 2 } = params || {};
      return ensureFloat(min, max, decimals);
    }

    // custom
    case 'randomInteger':
      return String(randInt(params?.min ?? 1, params?.max ?? 1000));
    case 'randomString':
      return randString(params?.length ?? 10);
    case 'randomAlphaNumeric':
      return randStringFrom(
        params?.length ?? 10,
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      );
    case 'password':
      return genPassword(params);
    case 'bearerToken':
      return randString(params?.length ?? 32);
    case 'price': {
      const min = params?.min ?? 1;
      const max = params?.max ?? 1000;
      const value = Math.random() * (max - min) + min;
      return Number.parseFloat(value.toFixed(2)).toString();
    }
    case 'emailWithDomain': {
      const domain =
        typeof params?.domain === 'string' && params.domain
          ? params.domain
          : 'example.com';
      const local = Math.random().toString(36).substring(2, 10);
      return `${local}@${domain}`;
    }
    case 'randomDate': {
      // format: 'YYYY-MM-DD' | 'ISO' | other (locale)\
      const format = params?.format ?? 'YYYY-MM-DD';
      const start = new Date(2020, 0, 1);
      const end = new Date();
      const d = new Date(
        start.getTime() + Math.random() * (end.getTime() - start.getTime())
      );
      if (format === 'YYYY-MM-DD') return dateOnly(d);
      if (format === 'ISO') return d.toISOString();
      return d.toLocaleDateString();
    }
    case 'pastDate': {
      const format = params?.format ?? 'YYYY-MM-DD';
      const years = params?.years ?? 1;
      const now = new Date();
      const from = new Date(
        now.getFullYear() - years,
        now.getMonth(),
        now.getDate()
      );
      const d = new Date(
        from.getTime() + Math.random() * (now.getTime() - from.getTime())
      );
      if (format === 'YYYY-MM-DD') return dateOnly(d);
      if (format === 'ISO') return d.toISOString();
      return d.toLocaleDateString();
    }
    case 'futureDate': {
      const format = params?.format ?? 'YYYY-MM-DD';
      const years = params?.years ?? 1;
      const now = new Date();
      const to = new Date(
        now.getFullYear() + years,
        now.getMonth(),
        now.getDate()
      );
      const d = new Date(
        now.getTime() + Math.random() * (to.getTime() - now.getTime())
      );
      if (format === 'YYYY-MM-DD') return dateOnly(d);
      if (format === 'ISO') return d.toISOString();
      return d.toLocaleDateString();
    }

    // personal
    case 'name': {
      const first = [
        'John',
        'Jane',
        'Michael',
        'Sarah',
        'David',
        'Emily',
        'James',
        'Jessica',
        'Robert',
        'Ashley',
      ];
      const last = [
        'Smith',
        'Johnson',
        'Williams',
        'Brown',
        'Jones',
        'Garcia',
        'Miller',
        'Davis',
        'Rodriguez',
        'Martinez',
      ];
      return `${pick(first)} ${pick(last)}`;
    }
    case 'firstName': {
      const names = [
        'John',
        'Jane',
        'Michael',
        'Sarah',
        'David',
        'Emily',
        'James',
        'Jessica',
        'Robert',
        'Ashley',
        'Christopher',
        'Amanda',
        'Matthew',
        'Stephanie',
        'Anthony',
      ];
      return pick(names);
    }
    case 'lastName': {
      const names = [
        'Smith',
        'Johnson',
        'Williams',
        'Brown',
        'Jones',
        'Garcia',
        'Miller',
        'Davis',
        'Rodriguez',
        'Martinez',
        'Hernandez',
        'Lopez',
        'Gonzalez',
        'Wilson',
        'Anderson',
      ];
      return pick(names);
    }
    case 'gender': {
      const genders = ['Male', 'Female', 'Non-binary', 'Other'];
      return pick(genders);
    }
    case 'ssn': {
      const area = randInt(100, 999);
      const group = randInt(1, 99).toString().padStart(2, '0');
      const serial = randInt(1, 9999).toString().padStart(4, '0');
      return `${area}-${group}-${serial}`;
    }
    case 'email': {
      const local = Math.random().toString(36).substring(2, 10);
      const domain = pick(domains);
      return `${local}@${domain}`;
    }
    case 'phone': {
      const area = randInt(100, 999);
      const exch = randInt(100, 999);
      const num = randInt(1000, 9999);
      return `(${area}) ${exch}-${num}`;
    }
    case 'username': {
      const adjectives = [
        'cool',
        'awesome',
        'swift',
        'brave',
        'smart',
        'quick',
        'happy',
        'lucky',
      ];
      const nouns = [
        'tiger',
        'eagle',
        'wolf',
        'lion',
        'shark',
        'falcon',
        'bear',
        'hawk',
      ];
      return `${pick(adjectives)}${pick(nouns)}${randInt(1, 999)}`;
    }

    // internet
    case 'domain': {
      const words = [
        'tech',
        'web',
        'digital',
        'online',
        'cyber',
        'net',
        'data',
        'cloud',
        'smart',
        'fast',
      ];
      const tlds = [
        '.com',
        '.org',
        '.net',
        '.io',
        '.co',
        '.tech',
        '.app',
        '.dev',
      ];
      return `${pick(words)}${randInt(1, 99)}${pick(tlds)}`;
    }
    case 'url': {
      const protocols = ['https', 'http'];
      const subdomains = ['www', 'api', 'app', 'portal'];
      const baseDomains = ['example.com', 'test.org', 'demo.net', 'sample.io'];
      const paths = [
        '/home',
        '/about',
        '/contact',
        '/api/v1',
        '/dashboard',
        '/profile',
      ];
      const protocol = pick(protocols);
      const sub = Math.random() > 0.5 ? `${pick(subdomains)}.` : '';
      const dom = pick(baseDomains);
      const path = Math.random() > 0.5 ? pick(paths) : '';
      return `${protocol}://${sub}${dom}${path}`;
    }
    case 'ipv4':
    case 'random_ip':
      return Array.from({ length: 4 }, () => randInt(0, 255)).join('.');
    case 'ipv6': {
      const seg = () => randInt(0, 0xffff).toString(16);
      return `${seg()}:${seg()}:${seg()}:${seg()}:${seg()}:${seg()}:${seg()}:${seg()}`;
    }
    case 'uuid':
      return uuid();
    case 'boolean':
      return String(Math.random() < 0.5);

    // datetime
    case 'date': {
      const start = new Date(2020, 0, 1);
      const end = new Date();
      const d = new Date(
        start.getTime() + Math.random() * (end.getTime() - start.getTime())
      );
      return dateOnly(d);
    }
    case 'month': {
      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      return pick(months);
    }
    case 'year': {
      const current = new Date().getFullYear();
      return String(randInt(1990, current));
    }

    // location
    case 'address': {
      const streets = [
        'Main St',
        'Oak Ave',
        'First St',
        'Second Ave',
        'Park Rd',
        'Washington Blvd',
        'Lincoln Way',
        'Maple Dr',
        'Elm St',
        'Cedar Ave',
      ];
      return `${randInt(1, 9999)} ${pick(streets)}`;
    }
    case 'city': {
      const cities = [
        'New York',
        'Los Angeles',
        'Chicago',
        'Houston',
        'Phoenix',
        'Philadelphia',
        'San Antonio',
        'San Diego',
        'Dallas',
        'San Jose',
        'Austin',
        'Jacksonville',
        'Fort Worth',
        'Columbus',
        'Charlotte',
      ];
      return pick(cities);
    }
    case 'state': {
      const states = [
        'California',
        'Texas',
        'Florida',
        'New York',
        'Pennsylvania',
        'Illinois',
        'Ohio',
        'Georgia',
        'North Carolina',
        'Michigan',
        'New Jersey',
        'Virginia',
        'Washington',
        'Arizona',
        'Massachusetts',
      ];
      return pick(states);
    }
    case 'country': {
      const countries = [
        'United States',
        'Canada',
        'Mexico',
        'United Kingdom',
        'Germany',
        'France',
        'Italy',
        'Spain',
        'Japan',
        'Australia',
        'Brazil',
        'India',
        'China',
        'South Korea',
        'Netherlands',
      ];
      return pick(countries);
    }
    case 'zip':
    case 'zipCode': {
      const zip5 = randInt(10000, 99999);
      if (id === 'zipCode') return String(zip5); // match alt naming
      const zip4 = randInt(1000, 9999);
      return Math.random() > 0.5 ? String(zip5) : `${zip5}-${zip4}`;
    }
    case 'latitude':
      return Number((Math.random() * 180 - 90).toFixed(6)).toString();
    case 'longitude':
      return Number((Math.random() * 360 - 180).toFixed(6)).toString();

    // financial
    case 'creditCard':
    case 'creditCardNumber': {
      const cardNumber =
        '4' + Array.from({ length: 15 }, () => randInt(0, 9)).join('');
      const formatted = cardNumber.replace(/(.{4})/g, '$1 ').trim();
      if (id === 'creditCardNumber') return formatted;
      const month = randInt(1, 12).toString().padStart(2, '0');
      const year = (new Date().getFullYear() + randInt(1, 5))
        .toString()
        .slice(-2);
      const cvv = randInt(100, 999);
      const types = ['Visa', 'MasterCard', 'American Express', 'Discover'];
      return `${formatted} ${month}/${year}/${cvv} ${pick(types)}`;
    }
    case 'creditCardExp': {
      const month = randInt(1, 12).toString().padStart(2, '0');
      const year = (new Date().getFullYear() + randInt(1, 5))
        .toString()
        .slice(-2);
      return `${month}/${year}`;
    }
    case 'currency': {
      const currencies = [
        'USD',
        'EUR',
        'GBP',
        'JPY',
        'CAD',
        'AUD',
        'CHF',
        'CNY',
        'SEK',
        'NZD',
        'MXN',
        'SGD',
        'HKD',
        'NOK',
        'TRY',
      ];
      return pick(currencies);
    }

    // auth
    case 'bearer_token': {
      try {
        const bytes = new Uint8Array(32);
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
          crypto.getRandomValues(bytes);
          return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(
            ''
          );
        }
      } catch {}
      return randStringFrom(64, 'abcdef0123456789');
    }
    case 'api_key': {
      const prefix = typeof params?.prefix === 'string' ? params.prefix : 'ak_';
      const length = typeof params?.length === 'number' ? params.length : 32;
      return prefix + randString(length);
    }

    // network
    case 'random_port':
      return String(randInt(1024, 65535));

    // legacy date
    case 'future_date': {
      const days = typeof params?.days === 'number' ? params.days : 30;
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString();
    }
    case 'past_date': {
      const days = typeof params?.days === 'number' ? params.days : 30;
      const d = new Date();
      d.setDate(d.getDate() - days);
      return d.toISOString();
    }

    default:
      return '';
  }
}

export const parseUrlParams = (url: string): KeyValuePair[] => {
  try {
    const urlObj = new URL(
      url.startsWith('http') ? url : `https://example.com${url}`
    );
    const params: KeyValuePair[] = [];
    urlObj.searchParams.forEach((value, key) => {
      params.push({
        id: `temp_${Date.now()}_${Math.random()}`,
        key,
        value,
        enabled: true,
      });
    });
    return params;
  } catch (e) {
    return [];
  }
};

export const buildUrlWithParams = (
  baseUrl: string,
  params: KeyValuePair[]
): string => {
  try {
    const urlParts = baseUrl.split('?');
    const cleanUrl = urlParts[0];

    const enabledParams = params.filter((p) => p.enabled && p.key.trim());
    if (enabledParams.length === 0) {
      return cleanUrl;
    }

    const queryString = enabledParams
      .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
      .join('&');

    return `${cleanUrl}?${queryString}`;
  } catch (e) {
    return baseUrl;
  }
};

export { generateDynamicValueById };
