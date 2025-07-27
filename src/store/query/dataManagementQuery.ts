import { queryClient } from "@/lib/queryClient";
import {
  FetchVariablesResponse,
  createEnvironment,
  createVariable,
  deleteEnvironment,
  deleteVariable,
  fetchEnvironments,
  fetchVariables,
  updateEnvironment,
  updateVariable,
} from "@/services/dataManagement.service";
import { workspaceStore } from "../workspaceStore";
import { useMutation, useQuery } from "@tanstack/react-query";
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
      if (response?.environments) {
        const filteredEnvironments =
          response.environments.map(filterEnvironment);
        const environment = filteredEnvironments[0];
        dataManagementActions.setEnvironments(filteredEnvironments);
        dataManagementActions.setActiveEnvironment(environment);
        return environment;
      } else {
        dataManagementActions.setEnvironments([]);
        dataManagementActions.setActiveEnvironment(null);
      }
      return [];
    },
  });
};

export const usefetchVariablesQuery = (enabled = true) => {
  console.log("🚀 ~ usefetchVariablesQuery ~ enabled:", enabled);
  const environmentId = dataManagementStore.state.activeEnvironment?.id!;
  console.log("🚀 ~ usefetchVariablesQuery ~ environmentId:", environmentId);
  return useQuery({
    queryKey: ["variables", environmentId],
    enabled: !!environmentId && enabled,
    queryFn: async () => {
      try {
        const response = await fetchVariables(environmentId);
        console.log("🚀 ~ queryFn: ~ response:", response);
        if (response?.variables) {
          return response.variables;
        }
        return [];
      } catch (error) {
        console.error("Error fetching variables:", error);
        throw error;
      }
    },
  });
};

export const useCreateEnvironmentMutation = () => {
  return useMutation({
    mutationFn: createEnvironment,
    onSuccess: (newEnvironment: Environment) => {
      console.log("New environment created:", newEnvironment);
      const data : Environment = filterEnvironment(newEnvironment);
      console.log(data);
      const environments = dataManagementStore.state.environments;
      dataManagementActions.setEnvironments([...environments, data]);
    },
    onError: (error) => {
      console.error("Error creating environment:", error);
    },
  });
};

export const useUpdateEnvironmentMutation = () => {
  return useMutation({
    mutationFn: updateEnvironment,
    onSuccess: (updatedEnvironment: Environment) => {
      console.log("Environment updated:", updatedEnvironment);
    },
    onError: (error) => {
      console.error("Error updating environment:", error);
    },
  });
};

export const useDeleteEnvironmentMutation = () => {
  return useMutation({
    mutationFn: deleteEnvironment,
    onSuccess: (environmentId: string) => {
      console.log("Environment deleted:", environmentId);
    },
    onError: (error) => {
      console.error("Error deleting environment:", error);
    },
  });
};

export const useCreateVariableMutation = () => {
  return useMutation({
    mutationFn: createVariable,
    onSuccess: (newVariable: any) => {
      console.log("New variable created:", newVariable);
    },
    onError: (error) => {
      console.error("Error creating variable:", error);
    },
  });
};

export const useUpdateVariableMutation = () => {
  return useMutation({
    mutationFn: updateVariable,
    onSuccess: (updatedVariable: any) => {
      console.log("Variable updated:", updatedVariable);
    },
    onError: (error) => {
      console.error("Error updating variable:", error);
    },
  });
};

export const useDeleteVariableMutation = () => {
  return useMutation({
    mutationFn: deleteVariable,
    onSuccess: (variableId: string) => {
      console.log("Variable deleted:", variableId);
    },
    onError: (error) => {
      console.error("Error deleting variable:", error);
    },
  });
};

const filterEnvironment = (environment) => {
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
