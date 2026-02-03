import { ENV } from '@/config/env';
import { apiRequest } from '@/lib/queryClient';

export const getDashboard = async (workspaceId: string) => {
  const response = await apiRequest(
    'GET',
    `${ENV.API_BASE_URL}/dashboard/${workspaceId}`,
    {
      headers: {
        'X-Workspace-ID': workspaceId,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard');
  }

  return response.json();
};
