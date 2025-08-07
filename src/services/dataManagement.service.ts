import { API_ENVIRONMENT, API_VARIABLES } from '@/config/apiRoutes';
import { apiRequest } from '@/lib/queryClient';
import {
  Environment,
  fetchEnvironmentsResponse,
  FetchVariablesResponse,
  ResponseEnvironment,
} from '@/shared/types/datamanagement';

export const fetchEnvironments = async (
  workspaceId: string
): Promise<fetchEnvironmentsResponse> => {
  const response = await apiRequest(
    'GET',
    `${API_ENVIRONMENT}?ws=${workspaceId}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch environments');
  }

  return response.json();
};

export const fetchVariables = async (
  environmentId: string
): Promise<FetchVariablesResponse> => {
  console.log('api is called for variables');

  const response = await apiRequest(
    'GET',
    `${API_VARIABLES}?e=${environmentId}&page=1&pageSize=10`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch variables');
  }
  return response.json();
};

export const createEnvironment = async (environment: {
  name: string;
  description?: string;
  defaultVariables?: any[];
  workspaceId: string;
}): Promise<ResponseEnvironment> => {
  const response = await apiRequest('POST', API_ENVIRONMENT, {
    body: JSON.stringify(environment),
  });
  if (!response.ok) {
    throw new Error('Failed to create environment');
  }
  return response.json();
};

export const updateEnvironment = async (environment): Promise<Environment> => {
  const response = await apiRequest(
    'PUT',
    `${API_ENVIRONMENT}/${environment.id}`,
    {
      body: JSON.stringify(environment),
    }
  );
  if (!response.ok) {
    throw new Error('Failed to update environment');
  }
  return response.json();
};

export const deleteEnvironment = async (environmentId: string) => {
  const response = await apiRequest(
    'DELETE',
    `${API_ENVIRONMENT}/${environmentId}`
  );
  return environmentId;
};

export const createVariable = async (variable: any): Promise<any> => {
  // Replace with your actual variable type
  const response = await apiRequest('POST', API_VARIABLES, {
    body: JSON.stringify(variable),
  });
  if (!response.ok) {
    throw new Error('Failed to create variable');
  }
  return response.json();
};

export const updateVariable = async (variable: any): Promise<any> => {
  // Replace with your actual variable type
  const response = await apiRequest('PUT', `${API_VARIABLES}/${variable.id}`, {
    body: JSON.stringify(variable),
  });
  if (!response.ok) {
    throw new Error('Failed to update variable');
  }
  return response.json();
};

export const deleteVariable = async (variableId: string): Promise<any> => {
  const response = await apiRequest('DELETE', `${API_VARIABLES}/${variableId}`);
  if (!response.ok) {
    throw new Error('Failed to delete variable');
  }
  return response.json();
};
