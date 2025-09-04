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
