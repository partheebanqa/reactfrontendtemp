export interface TestSuite {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  suiteId: string;
  functionalTests: number;
  performanceTests: number;
  securityTests: number;
  status: 'Not Run' | 'Running' | 'Passed' | 'Failed';
}
