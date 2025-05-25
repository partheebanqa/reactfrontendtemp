export interface TestCase {
  id: string;
  name: string;
  category: string;
  description: string;
  status?: 'Passed' | 'Failed' | 'Warning';
  duration?: string;
}

export interface TestSuite {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  lastRun?: string;
  status?: 'Passed' | 'Failed' | 'Partial';
  testCases: TestCase[];
}

export interface TestResult {
  id: number;
  testSuiteId: number;
  testSuiteName: string;
  runDate: string;
  duration: string;
  status: string;
  successRate: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
  categories: {
    [key: string]: {
      name: string;
      totalTests: number;
      passedTests: number;
      failedTests: number;
      warningTests: number;
      tests: Array<{
        id: string;
        name: string;
        status: string;
        duration: string;
        endpoint?: string;
        method?: string;
      }>;
    };
  };
}