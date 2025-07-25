import { API_ENVIRONMENT, API_VARIABLES } from "@/config/apiRoutes";
import { apiRequest } from "@/lib/queryClient";
import { Environment, fetchEnvironmentsResponse } from "@/shared/types/datamanagement";

export interface FetchVariablesResponse {
  variables: any[]; // Replace with your actual variable type
}

export const fetchEnvironments = async (workspaceId: string): Promise<fetchEnvironmentsResponse> => {  
  const response = await apiRequest('GET',`${API_ENVIRONMENT}?ws=${workspaceId}`,);
  if (!response.ok) {
    throw new Error('Failed to fetch environments');
  }
  return response.json()
}

export const fetchVariables = async (environmentId: string): Promise<FetchVariablesResponse> => {  
  const response = await apiRequest('GET',`${API_VARIABLES}/${environmentId}`,);
  if (!response.ok) {
    throw new Error('Failed to fetch variables');
  }
  return response.json()
}