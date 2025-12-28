import { API_REPORTS } from '@/config/apiRoutes';
import { ENV } from '@/config/env';
import { apiRequest } from '@/lib/queryClient';

export const getWorkSpaceToken = async (workspaceId: string) => {
  const response = await apiRequest(
    'GET',
    `${ENV.API_BASE_URL}/${workspaceId}/api-key`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch test suite report');
  }
  return response.json();
};

export const createWorkSpaceToken = async (workspaceId: string) => {
  try {
    const response = await apiRequest(
      'POST',
      `${ENV.API_BASE_URL}/${workspaceId}/api-key`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workspaceId }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to execute request: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: unknown) {
    console.error('Error creating workspace token:', error);
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to execute request');
    }
    throw new Error('Failed to execute request');
  }
};
