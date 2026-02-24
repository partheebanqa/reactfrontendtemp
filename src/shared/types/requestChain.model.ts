export interface RequestChain {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  environmentId?: string;
  chainRequests: APIRequest[];
  variables: Variable[];
  schedule?: Schedule;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastExecuted?: string;
  executionCount: number;
  successRate: number;
  environment?: {
    id: string;
    name: string;
  };
}

export interface APIRequest {
  isSelected?: boolean;
  assertions: boolean;
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  url: string;
  order?: number;
  headers: Header[];
  params: Parameter[];
  body?: string;
  bodyRawContent?: string;
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
  variables?: any;
  rawBodyType?: 'text' | 'json' | 'xml' | 'html';
  authorizationType: 'none' | 'bearer' | 'basic' | 'apikey' | 'oauth2';
  authToken?: string; // Bearer token or reference to AuthToken ID
  authorization?: {
    token: string;
  };
  authUsername?: string; // Basic auth username
  authPassword?: string; // Basic auth password
  authApiKey?: string; // API key name
  authApiValue?: string; // API key value
  authApiLocation?: 'header' | 'query'; // Where to add API key
  timeout: number;
  retries: number;
  errorHandling?: string;
  extractVariables: DataExtraction[];
  testScripts?: TestScript[];
  enabled: boolean;
  description?: string;
}

export interface Variable {
  currentValue: string | undefined;
  initialValue?: string;
  id?: string;
  name: string;
  value?: string;
  type: string;
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
  name: string;
  source:
    | 'response_body'
    | 'response_header'
    | 'response_cookie'
    | 'request_header';
  path: string;
  value: string;
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
    assertions?: any[];
    requestCurl?: any;
  };
  error?: string;
  extractedVariables?: Record<string, any>;
  assertions?: any[];
}

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
  authorizationType?: string;
  timeout?: number;
  retries?: number;
  errorHandling?: string;
  enabled?: boolean;
}

export interface ExtractedVariable {
  name: string;
  path: string;
  value: string;
  status: 'success' | 'failed' | string;
  source: 'response' | 'header' | 'cookie' | string;
  type?: string;
}

export interface ExecutionItem {
  id: string;
  executionId: string;
  chainRequestId: string;
  requestChainId: string;
  status: number;
  data: string | object; // will parse to JSON in hook
  extractedVariables: ExtractedVariable[]; // parsed from string
}

export interface ExecutionResponse {
  page: number;
  pageSize: number;
  count: number;
  items: ExecutionItem[];
  message?: string;
}

export interface ExecuteRequestPayload {
  request: {
    workspaceId: string;
    name: string;
    order: number;
    method: string;
    url: string;
    bodyType?: string;
    bodyFormData?: any;
    bodyRawContent?: string;
    authorizationType?: string;
    authorization?: { token: string };
    headers: Array<{ key: string; value: string; enabled: boolean }>;
    params: Array<{ key: string; value: string; enabled: boolean }>;
  };

  assertions?: Array<{
    id: string;
    type: string;
    expected: unknown;
    actualPath: string;
    enabled: boolean;
  }>;

  schemaId?: string;
}

export interface ExecutionResponse {
  data: {
    assertionResults?: any;
    requestCurl: any;
    body: any;
    schemaValidation: null;
    assertionLogs: never[];
    metrics: {};
    headers: {};
    statusCode: number;
    responses: Array<{
      requestCurl: any;
      status: number;
      statusCode: number;
      headers: Record<string, string>;
      body: any;
      metrics: {
        responseTime: number;
        bytesReceived: number;
      };
    }>;
  };
}

export interface ExecutionRequestChainPayload {
  requestChainId: string;
}
