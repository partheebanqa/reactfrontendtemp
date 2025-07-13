import { ApiTestCase } from '../models/testcase.model';

export interface TestCasesResponse {
  testCases: ApiTestCase[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const BEARER_TOKEN = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdJZCI6IjFhZTZjMjY1LWU1MDItNGFlZC1hYWRjLTQ4MzM3ZTYyMDgwNyIsInRlbmFudElkIjoiYzE1ZDQ4OWItOGMxZS00NmZiLWFlYzgtMDlmMDBmZjUyMTNjIiwicm9sZXMiOlsiT3JnIEFkbWluIl0sInN1YiI6IjM1YmI2NzBkLTcyNTYtNDg0MC1iOTI1LTJkYjk1M2ZmYmVlNCIsImV4cCI6MTc1MjQ3OTk0NywibmJmIjoxNzUyMzkzNTQ3LCJpYXQiOjE3NTIzOTM1NDd9.r5_1blrSlt5t_GjBBRCO20zeTCXS8fvSeoiscnyRbsc`;

const defaultHeaders = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${BEARER_TOKEN}`,
};

export const getTestCasesByRequestId = async (
  requestId: string
): Promise<TestCasesResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/test-cases?r=${requestId}`, {
      method: 'GET',
      headers: defaultHeaders,
    });

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

    const response = await fetch(
      `${API_BASE_URL}/test-suites/${testSuiteId}/request/${requestId}`,
      {
        method: 'PUT',
        headers: defaultHeaders,
        body: JSON.stringify({ testCases }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to save test cases');
  }
};
