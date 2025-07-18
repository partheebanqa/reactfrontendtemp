import { ApiTestCase } from '../models/testcase.model';
import { apiRequest } from '@/lib/queryClient';

export interface TestCasesResponse {
  testCases: ApiTestCase[];
}

export const getTestCasesByRequestId = async (
  requestId: string
): Promise<TestCasesResponse> => {
  try {
    const response = await apiRequest('GET', `/test-cases?r=${requestId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch test cases');
  }
};

export const saveTestCasesForRequest = async (
  testSuiteId: string,
  requestId: string,
  selectedTestCaseIds: string[],
  allTestCaseIds: string[]
): Promise<void> => {
  try {
    const testCases = allTestCaseIds.map((testCaseId) => ({
      testCaseId,
      isSelected: selectedTestCaseIds.includes(testCaseId),
    }));

    const response = await apiRequest(
      'PUT',
      `/test-suites/${testSuiteId}/request/${requestId}`,
      {
        body: JSON.stringify({ testCases }),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to save test cases');
  }
};
