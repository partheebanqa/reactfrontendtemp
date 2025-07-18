export interface Variable {
  id: string;
  name: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  source?: 'global' | 'extracted';
  extractionPath?: string;
}

export interface DataExtraction {
  variableName: string;
  source: 'response_body' | 'response_header' | 'response_cookie';
  path: string;
  transform?: string;
}

export interface TestScript {
  id: string;
  type: 'status' | 'responseTime' | 'jsonContent';
  enabled: boolean;
  operator: string;
  expectedValue: string;
  jsonPath?: string;
  description?: string;
}

export interface APIRequest {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  url: string;
  headers: { key: string; value: string; enabled: boolean }[];
  params: { key: string; value: string; enabled: boolean }[];
  bodyType: 'none' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'json';
  body?: string;
  rawBodyType?: 'text' | 'json' | 'xml' | 'html';
  timeout: number;
  retries: number;
  errorHandling: 'stop' | 'continue' | 'retry';
  enabled: boolean;
  authType: 'none' | 'bearer' | 'basic' | 'apikey' | 'oauth2';
  authToken?: string;
  authUsername?: string;
  authPassword?: string;
  authApiKey?: string;
  authApiValue?: string;
  authApiLocation?: 'header' | 'query';
  dataExtractions: DataExtraction[];
  testScripts: TestScript[];
}

export interface RequestChain {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  requests: APIRequest[];
  variables: Variable[];
  schedule: {
    enabled: boolean;
    type: 'once' | 'recurring';
    startDate: string;
    timezone: string;
  };
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastExecuted?: string;
  executionCount: number;
  successRate: number;
}

export interface ExecutionLog {
  id: string;
  chainId: string;
  requestId: string;
  status: 'success' | 'error' | 'timeout';
  startTime: string;
  endTime: string;
  duration: number;
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

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  status: 'Not Run' | 'Running' | 'Passed' | 'Failed';
  createdAt: string;
  updatedAt: string;
  lastRun?: string;
  chains: RequestChain[];
}
