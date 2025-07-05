import { CreateTestSuitePayload, TestSuite } from '@/models/TestSuite.model';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const BEARER_TOKEN = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdJZCI6IjFhZTZjMjY1LWU1MDItNGFlZC1hYWRjLTQ4MzM3ZTYyMDgwNyIsInRlbmFudElkIjoiYzE1ZDQ4OWItOGMxZS00NmZiLWFlYzgtMDlmMDBmZjUyMTNjIiwicm9sZXMiOlsiT3JnIEFkbWluIl0sInN1YiI6IjM1YmI2NzBkLTcyNTYtNDg0MC1iOTI1LTJkYjk1M2ZmYmVlNCIsImV4cCI6MTc1MTc3OTcwMiwibmJmIjoxNzUxNjkzMzAyLCJpYXQiOjE3NTE2OTMzMDJ9.Mqn4OJaSAQvnd5E_xv3beffXQ1WS33_QioVW6B6VQSc`;

const workspaceId = '510cdffe-4262-438c-a5a6-c42c72a705ab';

export const getAllTestSuites = async (): Promise<TestSuite[]> => {
  const response = await fetch(
    `${API_BASE_URL}/test-suites?ws=${workspaceId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${BEARER_TOKEN}`,
      },
    }
  );
  if (!response.ok) {
    throw new Error('Failed to fetch test suites');
  }
  const data = await response.json();
  return data.testSuites;
};

export const createTestSuite = async (
  payload: CreateTestSuitePayload
): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/test-suites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${BEARER_TOKEN}`,
    },
    body: JSON.stringify({
      ...payload,
      workspaceId,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create test suite');
  }
  return response.json();
};

export const deleteTestSuite = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/test-suites/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${BEARER_TOKEN}`,
    },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete test suite');
  }
};

export const getTestSuites = async (id: string): Promise<TestSuite> => {
  const response = await fetch(`${API_BASE_URL}/test-suites/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${BEARER_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch test suite');
  }

  const data = await response.json();
  return data; // ✅ backend returns the object directly
};
