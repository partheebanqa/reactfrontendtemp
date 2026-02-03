import {
  CreateTestSuitePayload,
  TestSuite,
} from '@/shared/types/TestSuite.model';
import { apiRequest } from '@/lib/queryClient';
import { API_EXECUTOR, API_TEST_SUITES } from '@/config/apiRoutes';

export const getAllTestSuites = async (
  workspaceId: string
): Promise<TestSuite[]> => {
  try {
    const response = await apiRequest(
      'GET',
      `${API_TEST_SUITES}?ws=${workspaceId}`,
      {
        headers: {
          'X-Workspace-ID': workspaceId,
        },
      }
    );
    const data = await response.json();
    return data.testSuites;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch test suites');
  }
};

export const getTestSuites = async (
  id: string,
  workspaceId: string
): Promise<TestSuite> => {
  try {
    const response = await apiRequest('GET', `${API_TEST_SUITES}/${id}`, {
      headers: {
        'X-Workspace-ID': workspaceId,
      },
    });
    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch test suite');
  }
};

export const deleteTestSuite = async (id: string): Promise<void> => {
  try {
    const response = await apiRequest('DELETE', `${API_TEST_SUITES}/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to delete test suite: ${response.statusText}`);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to delete test suite');
  }
};

export const createTestSuite = async (
  payload: CreateTestSuitePayload & { workspaceId: string }
): Promise<any> => {
  try {
    const response = await apiRequest('POST', API_TEST_SUITES, {
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to create test suite');
    }

    return await response.json();
  } catch (error) {
    throw new Error((error as Error).message || 'Failed to create test suite');
  }
};

export const updateTestSuite = async (
  id: string,
  data: {
    name: string;
    description: string;
    addRequestIds?: string[];
    removeRequestIds?: string[];
    environmentId: string;
  }
) => {
  try {
    const response = await apiRequest('PUT', `${API_TEST_SUITES}/${id}`, {
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to update test suite');
    }

    return await response.json();
  } catch (error) {
    throw new Error((error as Error).message || 'Failed to update test suite');
  }
};

export const executeTestSuite = async ({
  testSuiteId,
}: {
  testSuiteId: string;
}): Promise<void> => {
  try {
    const response = await apiRequest('POST', `${API_EXECUTOR}/test-suite`, {
      body: JSON.stringify({ testSuiteId }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to execute test suite');
    }

    return await response.json();
  } catch (error) {
    throw new Error((error as Error).message || 'Failed to execute test suite');
  }
};

export const duplicateTestSuite = async (id: string): Promise<TestSuite> => {
  try {
    const response = await apiRequest(
      'POST',
      `${API_TEST_SUITES}/${id}/duplicate`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to duplicate test suite: ${response.statusText}`);
    }

    const data: TestSuite = await response.json();
    return data;
  } catch (error: unknown) {
    console.error('Error duplicating test suite:', error);
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to duplicate test suite');
    }
    throw new Error('Failed to duplicate test suite');
  }
};
