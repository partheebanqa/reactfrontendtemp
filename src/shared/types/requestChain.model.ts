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
  method: string;
  url: string;
  headers: Header[];
  params: Parameter[];
  bodyType: 'none' | 'json' | 'form' | 'raw';
  body?: string;
  timeout: number;
  retries: number;
  errorHandling: 'stop' | 'continue';
  dataExtractions: DataExtraction[];
  testScripts: TestScript[];
  enabled: boolean;
  authType: 'none' | 'bearer' | 'basic' | 'apikey';
  authConfig?: AuthConfig;
}

export interface Variable {
  id: string;
  name: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
}

export interface Header {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface Parameter {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface DataExtraction {
  id: string;
  name: string;
  type: 'jsonPath' | 'regex' | 'header';
  expression: string;
  variable: string;
}

export interface TestScript {
  id: string;
  name: string;
  script: string;
  enabled: boolean;
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
  status: 'success' | 'error';
  startTime: string;
  endTime: string;
  duration: number;
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  };
  response: {
    status: number;
    headers: Record<string, string>;
    body: string;
    size: number;
  };
  errorMessage?: string; // Optional if status is 'error'
}
