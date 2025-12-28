import { ApiTestCase } from '../shared/types/testcase.model';
import { apiRequest } from '@/lib/queryClient';
import { API_TEST_CASES, API_TEST_SUITES } from '@/config/apiRoutes';

export interface TestCasesResponse {
  testCases: ApiTestCase[];
}

export const getTestCasesByRequestId = async (
  requestId: string,
  testSuiteId: string
): Promise<TestCasesResponse> => {
  try {
    const response = await apiRequest(
      'GET',
      `${API_TEST_CASES}?r=${requestId}&ts=${testSuiteId}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();

    try {
      return JSON.parse(responseText);
    } catch (jsonError) {
      console.warn(
        'JSON parsing failed, attempting to clean response:',
        jsonError
      );

      const jsonObjects = responseText.split(/\}\s*\{/);

      if (jsonObjects.length > 1) {
        const firstJsonString = jsonObjects[0] + '}';
        return JSON.parse(firstJsonString);
      }

      throw jsonError;
    }
  } catch (error: any) {
    console.error('Error fetching test cases:', error);
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
    // Map all test cases but include only selected ones
    const testCases = allTestCaseIds
      .filter((id) => selectedTestCaseIds.includes(id)) // keep only selected
      .map((id) => ({ testCaseId: id, isSelected: true }));

    const response = await apiRequest(
      'PUT',
      `${API_TEST_SUITES}/${testSuiteId}/request/${requestId}`,
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
