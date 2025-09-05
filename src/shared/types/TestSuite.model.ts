// TestSuite.model.ts

export interface TestSuiteRequest {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  description?: string;
}

export interface RequestStatMeta {
  totalTests?: number;
  selectedTests?: number;
}

export interface RequestStat {
  requestId: string;
  startTime?: string;
  endTime?: string;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  lastGeneratedAt?: string;
  meta?: RequestStatMeta;
}

export interface TestSuiteStats {
  selectedGeneralTests: number;
  selectedFunctionalTests: number;
  selectedPerformanceTests: number;
  selectedSecurityTests: number;
  requestStats: RequestStat[];
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  environment?: { id: string; name: string };
  functionalTests: number;
  performanceTests: number;
  securityTests: number;
  status: 'Not Run' | 'Running' | 'Passed' | 'Failed';

  // ✅ fix this
  requests: TestSuiteRequest[];

  // ✅ add this
  stats?: TestSuiteStats;
}

export interface CreateTestSuitePayload {
  name: string;
  description?: string;
  requestIds: string[];
  environmentId?: string;
}

export interface RequestParam {
  key: string;
  value: string;
  enabled: boolean;
}

export interface RequestHeader {
  key: string;
  value: string;
  enabled: boolean;
}

export interface RequestAuth {
  type: string;
  [key: string]: any;
}

export interface Request {
  id: string;
  name: string;
  description: string;
  method: string;
  url: string;
  endpoint: string;
  order: number;
  bodyType: 'none' | 'raw' | 'form-data' | 'x-www-form-urlencoded';
  bodyFormData?: Array<{
    key: string;
    value: string;
    enabled: boolean;
    type: 'text' | 'file';
  }> | null;
  bodyRawContent: string;
  authorizationType: 'none' | 'bearer' | 'basic' | 'api-key';
  authorization: RequestAuth;
  headers: RequestHeader[];
  params: RequestParam[];
  testCases: {
    functional: number;
    total: number;
  };
  selectedTestCases?: string[];
}

export interface RequestStat {
  requestId: string;
  startTime?: string;
  endTime?: string;
  status?: 'pending' | 'running' | 'completed' | 'failed' | undefined;
  lastGeneratedAt?: string;
  meta?: {
    totalTests?: number;
    selectedTests?: number;
  };
}
