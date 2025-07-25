import { queryClient } from "@/lib/queryClient";
import {
  FetchVariablesResponse,
  fetchEnvironments,
  fetchVariables,
} from "@/services/dataManagement.service";
import { workspaceStore } from "../workspaceStore";
import { useQuery } from "@tanstack/react-query";
import {
  dataManagementActions,
  dataManagementStore,
} from "../dataManagementStore";
import {
  Environment,
  fetchEnvironmentsResponse,
} from "@/shared/types/datamanagement";

export const usegetEnvironmentQuery = (enabled = true) => {
  const workspaceId = workspaceStore.state.currentWorkspace?.id!;
  return useQuery({
    queryKey: ["environments", workspaceId],
    enabled,
    queryFn: async () => {
      const response: fetchEnvironmentsResponse = await fetchEnvironments(
        workspaceId
      );
      console.log("🚀 ~ queryFn: ~ response?.environments:", response?.environments)
      if (response?.environments) {
        const filteredEnvironments = response.environments.map(filterEnvironment);
        const environment = filteredEnvironments[0];
        dataManagementActions.setEnvironments(filteredEnvironments);
        dataManagementActions.setActiveEnvironment(environment);
        return environment;
      }
      return [];
    },
  });
};

export const usefetchVariablesQuery = (enabled = true) => {
  console.log("🚀 ~ usefetchVariablesQuery ~ enabled:", enabled)
  const environmentId = dataManagementStore.state.activeEnvironment?.id!;
  console.log("🚀 ~ usefetchVariablesQuery ~ environmentId:", environmentId)
  return useQuery({
    queryKey: ["variables", environmentId],
    enabled: !!environmentId && enabled,
    queryFn: async () => {
      const response = await fetchVariables(environmentId);
      console.log("🚀 ~ queryFn: ~ response:", response);
      if (response?.variables) {
        // We're not updating environments with variables data
        // If you need to store variables somewhere, add appropriate actions to dataManagementActions
        // For now, just return the variables
        return response.variables;
      }
      return [];
    },
  });
};

const filterEnvironment = (environment) =>  {
    return {
      id: environment.Id,
      name: environment.Name,
      description: environment.Description,
      createdAt: environment.CreatedAt,
      updatedAt: environment.UpdatedAt,
      workspaceId: environment.WorkspaceId,     
      baseUrl: environment.BaseUrl,
      isDefault: environment.IsDefault,
      variables: environment.Variables || {}, // Ensure variables is an object
      deletedAt: environment.DeletedAt || null, 
    } as Environment;
};
