import { TestSuite } from '@/models/TestSuite.model';

const BEARER_TOKEN = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdJZCI6IjFhZTZjMjY1LWU1MDItNGFlZC1hYWRjLTQ4MzM3ZTYyMDgwNyIsInRlbmFudElkIjoiYzE1ZDQ4OWItOGMxZS00NmZiLWFlYzgtMDlmMDBmZjUyMTNjIiwicm9sZXMiOlsiT3JnIEFkbWluIl0sInN1YiI6IjM1YmI2NzBkLTcyNTYtNDg0MC1iOTI1LTJkYjk1M2ZmYmVlNCIsImV4cCI6MTc1MTc3OTcwMiwibmJmIjoxNzUxNjkzMzAyLCJpYXQiOjE3NTE2OTMzMDJ9.Mqn4OJaSAQvnd5E_xv3beffXQ1WS33_QioVW6B6VQSc`;

const workspaceId = '510cdffe-4262-438c-a5a6-c42c72a705ab';

export const getTestSuites = async (): Promise<TestSuite[]> => {
  const response = await fetch(
    `https://apibackenddev.onrender.com/test-suites?ws=${workspaceId}`,
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
  console.log('✅ API Response:', data);
  return data.testSuites;
};
