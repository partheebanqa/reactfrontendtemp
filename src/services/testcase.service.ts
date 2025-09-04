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

    console.log('response:', response);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get response text first to handle potential malformed JSON
    const responseText = await response.text();

    try {
      // Try to parse as normal JSON first
      return JSON.parse(responseText);
    } catch (jsonError) {
      // If JSON parsing fails, check for duplicated JSON response
      console.warn(
        'JSON parsing failed, attempting to clean response:',
        jsonError
      );

      // Look for pattern where JSON is duplicated (ends with }{ )
      const jsonObjects = responseText.split(/\}\s*\{/);

      if (jsonObjects.length > 1) {
        // Reconstruct the first complete JSON object
        const firstJsonString = jsonObjects[0] + '}';
        console.log(
          'Attempting to parse first JSON object:',
          firstJsonString.substring(0, 200) + '...'
        );
        return JSON.parse(firstJsonString);
      }

      // If cleanup doesn't work, throw the original error
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
    const testCases = allTestCaseIds.map((testCaseId) => ({
      testCaseId,
      isSelected: selectedTestCaseIds.includes(testCaseId),
    }));

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
