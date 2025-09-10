import { API_REPORTS } from "@/config/apiRoutes";
import { ENV } from "@/config/env";
import { apiRequest } from "@/lib/queryClient";





export const getWorkSpaceToken = async (workspaceId: string) => {
  const response = await apiRequest(
    'GET',
    `${ENV.API_BASE_URL}/${workspaceId}/api-key`
  );
  // console.log(response?.json(), "response")

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
        body: JSON.stringify({ workspaceId }), 
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to execute request: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to execute request');
  }
};