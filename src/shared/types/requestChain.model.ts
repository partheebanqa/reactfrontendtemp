export interface RequestChain {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  requests: APIRequest[];
  variables: Variable[];
  schedule: Schedule;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastExecuted?: string;
  executionCount: number;
  successRate: number;
}

export interface APIRequest {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  url: string;
  headers: Header[];
  params: Parameter[];
  body?: string;
  bodyType:
    | 'none'
    | 'json'
    | 'form-data'
    | 'x-www-form-urlencoded'
    | 'raw'
    | 'binary';
  authConfig?: {
    token?: string;
    username?: string;
    password?: string;
    key?: string;
    value?: string;
    addTo?: 'header' | 'query';
  };
  bodyFormData?: Record<string, string | File>;
  queryParams?: Record<string, string>;
  variables?: Variable[];
  rawBodyType?: 'text' | 'json' | 'xml' | 'html';
  authType?: 'none' | 'bearer' | 'basic' | 'apikey' | 'oauth2';
  authToken?: string; // Bearer token or reference to AuthToken ID
  authUsername?: string; // Basic auth username
  authPassword?: string; // Basic auth password
  authApiKey?: string; // API key name
  authApiValue?: string; // API key value
  authApiLocation?: 'header' | 'query'; // Where to add API key
  timeout: number;
  retries: number;
  errorHandling?: string;
  dataExtractions: DataExtraction[];
  testScripts?: TestScript[];
  enabled: boolean;
  description?: string;
}

export interface Variable {
  id?: string;
  name: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  source?: 'extracted' | string;
  extractionPath?: string;
}

export interface Header {
  id?: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface Parameter {
  id?: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface DataExtraction {
  variableName: string;
  source:
    | 'response_body'
    | 'response_header'
    | 'response_cookie'
    | 'request_header';
  path: string;
  transform?: string;
}

export interface TestScript {
  id: string;
  type: 'status' | 'responseTime' | 'jsonContent';
  enabled: boolean;
  operator: string; // 'equal', 'notEqual', 'greaterThan', 'lessThan', 'contain', 'exist', etc.
  expectedValue: string;
  jsonPath?: string; // For JSON content tests
  description?: string;
}

export interface AuthConfig {
  token?: string;
  username?: string;
  password?: string;
  key?: string;
  value?: string;
  addTo?: 'header' | 'query';
}

export interface Schedule {
  enabled: boolean;
  type: 'once' | 'interval' | 'cron';
  startDate: string;
  timezone: string;
  interval?: number;
  cron?: string;
}

export interface ExecutionLog {
  id: string;
  chainId: string;
  requestId: string;
  status: 'pending' | 'success' | 'error' | 'timeout';
  startTime: string;
  endTime?: string;
  duration?: number;
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  };
  response?: {
    status: number;
    headers: Record<string, string>;
    body: string;
    size: number;
    cookies?: Record<string, string>;
  };
  error?: string;
  extractedVariables?: Record<string, any>;
}

// export interface DataExtraction {
//   variableName: string;
//   source: 'response_body' | 'response_header' | 'response_cookie';
//   path: string;
//   transform?: string;
// }

export interface RequestDetailResponse {
  id: string;
  name: string;
  method: string;
  url?: string;
  endpoint?: string;
  headers?: any;
  params?: any;
  queryParams?: any;
  body?: string;
  rawBody?: string;
  bodyType?: string;
  bodyFormData?: any;
  auth?: any;
  authConfig?: any;
  authType?: string;
  timeout?: number;
  retries?: number;
  errorHandling?: string;
  enabled?: boolean;
}
