export interface TestSuite {
  requests: boolean;
  id: string;
  name: string;
  description: string;
  createdAt: string;
  functionalTests: number;
  performanceTests: number;
  securityTests: number;
  environment?: {
    id: string;
    name: string;
  };
  status: 'Not Run' | 'Running' | 'Passed' | 'Failed';
}

export interface CreateTestSuitePayload {
  name: string;
  description?: string;
  requestIds: string[];
  environmentId?: string;
}
