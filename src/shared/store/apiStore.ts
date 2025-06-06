import { create } from 'zustand';
import { produce } from 'immer';
import { ApiRequest, VulnerabilityTest, TestResult, ApiCollection, BatchTestResult, DisplayConfig, ReportConfig, TestSuite, DataVariable, E2ETest, E2EStep, Extraction } from '../types/dataManagementtypes';
// import { runVulnerabilityTests } from '../services/vulnerabilityService';
import { toast } from 'react-toastify';

interface ApiState {
  collections: ApiCollection[];
  activeCollection: string | null;
  requests: ApiRequest[];
  vulnerabilityTests: VulnerabilityTest[];
  testResults: TestResult[];
  batchTestResults: BatchTestResult[];
  displayConfig: DisplayConfig;
  reportConfig: ReportConfig;
  testSuites: TestSuite[];
  variables: DataVariable[];
  e2eTests: E2ETest[];
  tokens: AuthToken[];
  extractedData: Record<string, string>;
  addRequest: (request: ApiRequest) => void;
  updateRequest: (id: string, request: Partial<ApiRequest>) => void;
  deleteRequest: (id: string) => void;
  toggleVulnerabilityTest: (id: string) => void;
  addTestResult: (result: TestResult) => void;
  addBatchTestResult: (result: BatchTestResult) => void;
  importRequests: (requests: ApiRequest[]) => void;
  addCollection: (collection: ApiCollection) => void;
  updateCollection: (id: string, updates: Partial<ApiCollection>) => void;
  setActiveCollection: (id: string | null) => void;
  getCategories: () => string[];
  updateDisplayConfig: (config: Partial<DisplayConfig>) => void;
  updateReportConfig: (config: Partial<ReportConfig>) => void;
  addTestSuite: (suite: TestSuite) => void;
  updateTestSuite: (id: string, updates: Partial<TestSuite>) => void;
  deleteTestSuite: (id: string) => void;
  executeTestSuite: (id: string) => Promise<void>;
  addVariable: (variable: DataVariable) => void;
  updateVariable: (id: string, variable: Partial<DataVariable>) => void;
  deleteVariable: (id: string) => void;
  getVariablesByType: (type: string) => DataVariable[];
  addE2ETest: (test: E2ETest) => void;
  updateE2ETest: (id: string, updates: Partial<E2ETest>) => void;
  deleteE2ETest: (id: string) => void;
  addE2EStep: (testId: string, step: E2EStep) => void;
  updateE2EStep: (testId: string, stepId: string, updates: Partial<E2EStep>) => void;
  deleteE2EStep: (testId: string, stepId: string) => void;
  addExtraction: (testId: string, stepId: string, extraction: Extraction) => void;
  updateExtraction: (testId: string, stepId: string, extractionId: string, updates: Partial<Extraction>) => void;
  deleteExtraction: (testId: string, stepId: string, extractionId: string) => void;
  addToken: (token: AuthToken) => void;
  deleteToken: (id: string) => void;
  refreshToken: (id: string) => Promise<void>;
  addExtractedData: (key: string, value: string) => void;
  deleteExtractedData: (key: string) => void;
}

export const useApiStore = create<ApiState>((set, get) => ({
  collections: [],
  activeCollection: null,
  requests: [],
  vulnerabilityTests: [],
  testResults: [],
  batchTestResults: [],
  displayConfig: {
    showPerformance: true,
    showSchema: true,
    showAdditionalTests: true
  },
  reportConfig: {
    includeRequest: true,
    includeResponse: true,
    includeHeaders: true,
    includeMetrics: true,
    includeAssertions: true,
    includeAdditionalTests: true,
    includePerformance: true
  },
  testSuites: [],
  variables: [],
  e2eTests: [],
  tokens: [],
  extractedData: {},
  
  addRequest: (request) => set(produce((state: ApiState) => {
    state.requests.push(request);
  })),
  
  updateRequest: (id, updates) => set(produce((state: ApiState) => {
    const index = state.requests.findIndex(req => req.id === id);
    if (index !== -1) {
      state.requests[index] = { ...state.requests[index], ...updates };
    }
  })),
  
  deleteRequest: (id) => set(produce((state: ApiState) => {
    state.requests = state.requests.filter(req => req.id !== id);
  })),
  
  toggleVulnerabilityTest: (id) => set(produce((state: ApiState) => {
    const test = state.vulnerabilityTests.find(t => t.id === id);
    if (test) {
      test.enabled = !test.enabled;
    }
  })),
  
  addTestResult: (result) => set(produce((state: ApiState) => {
    state.testResults.push(result);
  })),
  
  addBatchTestResult: (result) => set(produce((state: ApiState) => {
    state.batchTestResults.push(result);
  })),
  
  importRequests: (requests) => set(produce((state: ApiState) => {
    state.requests.push(...requests);
  })),
  
  addCollection: (collection) => set(produce((state: ApiState) => {
    state.collections.push(collection);
  })),
  
  updateCollection: (id, updates) => set(produce((state: ApiState) => {
    const index = state.collections.findIndex(c => c.id === id);
    if (index !== -1) {
      state.collections[index] = { ...state.collections[index], ...updates };
    }
  })),
  
  setActiveCollection: (id) => set({ activeCollection: id }),
  
  getCategories: () => {
    const state = get();
    const categories = new Set<string>();
    state.requests.forEach(request => {
      if (request.category) {
        categories.add(request.category);
      }
    });
    return Array.from(categories).sort();
  },

  updateDisplayConfig: (config) => set(produce((state: ApiState) => {
    state.displayConfig = { ...state.displayConfig, ...config };
  })),
  
  updateReportConfig: (config) => set(produce((state: ApiState) => {
    state.reportConfig = { ...state.reportConfig, ...config };
  })),

  addTestSuite: (suite) => set(produce((state: ApiState) => {
    state.testSuites.push(suite);
  })),

  updateTestSuite: (id, updates) => set(produce((state: ApiState) => {
    const index = state.testSuites.findIndex(s => s.id === id);
    if (index !== -1) {
      state.testSuites[index] = { ...state.testSuites[index], ...updates };
    }
  })),

  deleteTestSuite: (id) => set(produce((state: ApiState) => {
    state.testSuites = state.testSuites.filter(s => s.id !== id);
  })),

  executeTestSuite: async (id) => {
    const state = get();
    const suite = state.testSuites.find(s => s.id === id);
    if (!suite) return;

    const startTime = Date.now();
    const results: TestResult[] = [];
    const failureCategories: Record<string, number> = {};
    const severityDistribution: Record<string, number> = {};
    const testsByCategory: Record<string, { total: number; passed: number; failed: number }> = {};

    const requests = suite.requests
      .map(reqId => state.requests.find(r => r.id === reqId))
      .filter((req): req is ApiRequest => req !== undefined);

    const enabledTests = state.vulnerabilityTests.filter(test => test.enabled);

    // for (const request of requests) {
    //   try {
    //     const requestResults = await runVulnerabilityTests(request, enabledTests);
        
    //     requestResults.forEach(result => {
    //       results.push(result);
    //       state.addTestResult(result);

    //       if (!result.passed) {
    //         const test = enabledTests.find(t => t.id === result.vulnerabilityId);
    //         if (test) {
    //           failureCategories[test.name] = (failureCategories[test.name] || 0) + 1;
    //           severityDistribution[test.severity] = (severityDistribution[test.severity] || 0) + 1;
    //         }
    //       }

    //       const category = request.category || 'Uncategorized';
    //       if (!testsByCategory[category]) {
    //         testsByCategory[category] = { total: 0, passed: 0, failed: 0 };
    //       }
    //       testsByCategory[category].total++;
    //       if (result.passed) {
    //         testsByCategory[category].passed++;
    //       } else {
    //         testsByCategory[category].failed++;
    //       }
    //     });
        
    //     toast.success(`Completed tests for ${request.name}`);
    //   } catch (error) {
    //     toast.error(`Failed to test ${request.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    //   }
    // }

    const executionTime = Date.now() - startTime;
    const successRate = (results.filter(r => r.passed).length / results.length) * 100;
    const averageResponseTime = results.reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length;

    const executionResult = {
      suiteId: suite.id,
      metrics: {
        executionTime,
        requestCount: requests.length,
        successRate,
        averageResponseTime,
        failureCategories,
        severityDistribution,
        testsByCategory
      },
      results,
      timestamp: new Date().toISOString()
    };

    set(produce((state: ApiState) => {
      const suiteIndex = state.testSuites.findIndex(s => s.id === suite.id);
      if (suiteIndex !== -1) {
        state.testSuites[suiteIndex].lastExecution = executionResult;
        state.testSuites[suiteIndex].updatedAt = new Date().toISOString();
      }
    }));

    toast.success(`Test suite "${suite.name}" execution completed`);
  },

  addVariable: (variable) => set(produce((state: ApiState) => {
    state.variables.push(variable);
  })),

  updateVariable: (id, updates) => set(produce((state: ApiState) => {
    const index = state.variables.findIndex(v => v.id === id);
    if (index !== -1) {
      state.variables[index] = { ...state.variables[index], ...updates };
    }
  })),

  deleteVariable: (id) => set(produce((state: ApiState) => {
    state.variables = state.variables.filter(v => v.id !== id);
  })),

  getVariablesByType: (type) => {
    const state = get();
    return state.variables.filter(v => v.type === type);
  },

  addE2ETest: (test) => set(produce((state: ApiState) => {
    state.e2eTests.push(test);
  })),

  updateE2ETest: (id, updates) => set(produce((state: ApiState) => {
    const index = state.e2eTests.findIndex(t => t.id === id);
    if (index !== -1) {
      state.e2eTests[index] = { ...state.e2eTests[index], ...updates };
    }
  })),

  deleteE2ETest: (id) => set(produce((state: ApiState) => {
    state.e2eTests = state.e2eTests.filter(t => t.id !== id);
  })),

  addE2EStep: (testId, step) => set(produce((state: ApiState) => {
    const test = state.e2eTests.find(t => t.id === testId);
    if (test) {
      test.steps.push(step);
    }
  })),

  updateE2EStep: (testId, stepId, updates) => set(produce((state: ApiState) => {
    const test = state.e2eTests.find(t => t.id === testId);
    if (test) {
      const stepIndex = test.steps.findIndex(s => s.id === stepId);
      if (stepIndex !== -1) {
        test.steps[stepIndex] = { ...test.steps[stepIndex], ...updates };
      }
    }
  })),

  deleteE2EStep: (testId, stepId) => set(produce((state: ApiState) => {
    const test = state.e2eTests.find(t => t.id === testId);
    if (test) {
      test.steps = test.steps.filter(s => s.id !== stepId);
    }
  })),

  addExtraction: (testId, stepId, extraction) => set(produce((state: ApiState) => {
    const test = state.e2eTests.find(t => t.id === testId);
    if (test) {
      const step = test.steps.find(s => s.id === stepId);
      if (step) {
        step.extractions.push(extraction);
      }
    }
  })),

  updateExtraction: (testId, stepId, extractionId, updates) => set(produce((state: ApiState) => {
    const test = state.e2eTests.find(t => t.id === testId);
    if (test) {
      const step = test.steps.find(s => s.id === stepId);
      if (step) {
        const extractionIndex = step.extractions.findIndex(e => e.id === extractionId);
        if (extractionIndex !== -1) {
          step.extractions[extractionIndex] = {
            ...step.extractions[extractionIndex],
            ...updates
          };
        }
      }
    }
  })),

  deleteExtraction: (testId, stepId, extractionId) => set(produce((state: ApiState) => {
    const test = state.e2eTests.find(t => t.id === testId);
    if (test) {
      const step = test.steps.find(s => s.id === stepId);
      if (step) {
        step.extractions = step.extractions.filter(e => e.id !== extractionId);
      }
    }
  })),

  addToken: (token) => set(produce((state: ApiState) => {
    state.tokens.push(token);
  })),

  deleteToken: (id) => set(produce((state: ApiState) => {
    state.tokens = state.tokens.filter(t => t.id !== id);
  })),

  refreshToken: async (id) => {
    const state = get();
    const token = state.tokens.find(t => t.id === id);
    if (!token?.source) return;

    try {
      const request = state.requests.find(r => r.id === token.source?.requestId);
      if (!request) return;

      // const response = await executeRequest(request);
      // const newToken = extractToken(response, {
      //   id: token.id,
      //   name: token.name,
      //   type: token.type,
      //   source: 'body',
      //   path: token.source.extractionPath
      // });

      // set(produce((state: ApiState) => {
      //   const index = state.tokens.findIndex(t => t.id === id);
      //   if (index !== -1) {
      //     state.tokens[index] = newToken;
      //   }
      // }));
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw error;
    }
  },

  addExtractedData: (key, value) => set(produce((state: ApiState) => {
    state.extractedData[key] = value;
  })),

  deleteExtractedData: (key) => set(produce((state: ApiState) => {
    delete state.extractedData[key];
  })),
}));