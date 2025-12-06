import { queryClient } from '@/lib/queryClient';
import {
  createEnvironment,
  createVariable,
  deleteEnvironment,
  deleteVariable,
  fetchEnvironments,
  fetchVariables,
  fetchDynamicVariables,
  updateEnvironment,
  updateVariable,
  updateDynamicVariable,
  deleteDynamicVariable,
  updatePrimaryEnvironment,
} from '@/services/dataManagement.service';
import { workspaceStore } from '../workspaceStore';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  dataManagementActions,
  dataManagementStore,
} from '../dataManagementStore';
import {
  Environment,
  ResponseEnvironment,
  ResponseVariable,
  ResponseDynamicVariable,
  Variable,
  DynamicVariable,
} from '@/shared/types/datamanagement';
import {
  getSavedEnvironmentId,
  saveActiveEnvironment,
} from '@/utils/environmentStorage';

export const usegetEnvironmentQuery = (enabled = true) => {
  const workspaceId = workspaceStore.state.currentWorkspace?.id;

  return useQuery({
    queryKey: ['environments', workspaceId],
    enabled: !!workspaceId && enabled,
    queryFn: async () => {
      if (!workspaceId) throw new Error('Workspace ID is missing');

      const response = await fetchEnvironments(workspaceId);

      if (response?.environments) {
        const filteredEnvironments = response.environments.map(
          (env: ResponseEnvironment) => filterEnvironment(env)
        );

        dataManagementActions.setEnvironments(filteredEnvironments);
        return filteredEnvironments;
      } else {
        dataManagementActions.setEnvironments([]);
        const currentActive = dataManagementStore.state.activeEnvironment;
        if (currentActive) {
          dataManagementActions.setActiveEnvironment(null);
        }
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
};

export const usefetchVariablesQuery = (enabled = true) => {
  const activeEnvironment = dataManagementStore.state.activeEnvironment;
  const workspaceId = workspaceStore.state.currentWorkspace?.id;

  return useQuery({
    queryKey: ['variables', workspaceId, activeEnvironment?.id],
    enabled: !!workspaceId && !!activeEnvironment?.id && enabled,
    queryFn: async () => {
      if (!workspaceId) throw new Error('Workspace ID is missing');
      const response = await fetchVariables(workspaceId);
      if (response.items.length > 0) {
        const filteredVariables = response.items.map(filterVariable);
        dataManagementActions.setVariables(filteredVariables);

        const baseUrlVar = filteredVariables.find(
          (v) => v.name.toLowerCase() === 'baseurl'
        );

        if (baseUrlVar && activeEnvironment) {
          const updatedEnvironment = {
            ...activeEnvironment,
            baseUrl: baseUrlVar.initialValue || '',
          };
          dataManagementActions.setActiveEnvironment(updatedEnvironment);
        }

        return filteredVariables;
      } else {
        dataManagementActions.setVariables([]);
        return [];
      }
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const usefetchDynamicVariablesQuery = (enabled = true) => {
  const activeEnvironment = dataManagementStore.state.activeEnvironment;
  const workspaceId = workspaceStore.state.currentWorkspace?.id;

  return useQuery({
    queryKey: ['dynamicVariables', workspaceId, activeEnvironment?.id],
    enabled: !!workspaceId && !!activeEnvironment?.id && enabled,
    queryFn: async () => {
      if (!workspaceId) throw new Error('Workspace ID is missing');

      const response = await fetchDynamicVariables(workspaceId);

      if (response?.variables?.length > 0) {
        const mappedDynamicVariables =
          response.variables.map(mapDynamicVariable);
        dataManagementActions.setDynamicVariables(mappedDynamicVariables);

        const baseUrlVar = mappedDynamicVariables.find(
          (v: any) => v.name.toLowerCase() === 'baseurl'
        );

        if (baseUrlVar && activeEnvironment) {
          const updatedEnvironment = {
            ...activeEnvironment,
            baseUrl: baseUrlVar.parameters?.url ?? '',
          };
          dataManagementActions.setActiveEnvironment(updatedEnvironment);
        }

        return mappedDynamicVariables;
      } else {
        dataManagementActions.setDynamicVariables([]);
        return [];
      }
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateEnvironmentMutation = () => {
  const workspaceId = workspaceStore.state.currentWorkspace?.id;

  return useMutation({
    mutationFn: createEnvironment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['environments', workspaceId],
      });
    },
    onError: (error) => {
      console.error('Error creating environment:', error);
    },
  });
};

export const useUpdateEnvironmentMutation = () => {
  const workspaceId = workspaceStore.state.currentWorkspace?.id;

  return useMutation({
    mutationFn: updateEnvironment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['environments', workspaceId],
      });
    },
    onError: (error) => {
      console.error('Error updating environment:', error);
    },
  });
};

export const useUpdatePrimaryEnvironmentMutation = () => {
  const workspaceId = workspaceStore.state.currentWorkspace?.id;

  return useMutation({
    mutationFn: updatePrimaryEnvironment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['environments', workspaceId],
      });
    },
    onError: (error) => {
      console.error('Error updating environment:', error);
    },
  });
};

export const useDeleteEnvironmentMutation = () => {
  const workspaceId = workspaceStore.state.currentWorkspace?.id;

  return useMutation({
    mutationFn: deleteEnvironment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['environments', workspaceId],
      });
    },
    onError: (error) => {
      console.error('Error deleting environment:', error);
    },
  });
};

export const useCreateVariableMutation = () => {
  const workspaceId = workspaceStore.state.currentWorkspace?.id;
  const activeEnvironment = dataManagementStore.state.activeEnvironment;

  return useMutation({
    mutationFn: createVariable,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['variables', workspaceId, activeEnvironment?.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ['dynamicVariables', workspaceId, activeEnvironment?.id],
        }),
      ]);
    },
    onError: (error) => {
      console.error('Error creating variable:', error);
    },
  });
};

export const useUpdateVariableMutation = () => {
  const workspaceId = workspaceStore.state.currentWorkspace?.id;
  const activeEnvironment = dataManagementStore.state.activeEnvironment;

  return useMutation({
    mutationFn: updateVariable,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['variables', workspaceId, activeEnvironment?.id],
      });
    },
    onError: (error) => {
      console.error('Error updating variable:', error);
    },
  });
};

export const useUpdateDynamicVariableMutation = () => {
  const workspaceId = workspaceStore.state.currentWorkspace?.id;
  const activeEnvironment = dataManagementStore.state.activeEnvironment;

  return useMutation({
    mutationFn: updateDynamicVariable,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['dynamicVariables', workspaceId, activeEnvironment?.id],
      });
    },
    onError: (error) => {
      console.error('Error updating dynamic variable:', error);
    },
  });
};

export const useDeleteVariableMutation = () => {
  const workspaceId = workspaceStore.state.currentWorkspace?.id;
  const activeEnvironment = dataManagementStore.state.activeEnvironment;

  return useMutation({
    mutationFn: deleteVariable,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['variables', workspaceId, activeEnvironment?.id],
      });
    },
    onError: (error) => {
      console.error('Error deleting variable:', error);
    },
  });
};

export const useDeleteDynamicVariableMutation = () => {
  const workspaceId = workspaceStore.state.currentWorkspace?.id;
  const activeEnvironment = dataManagementStore.state.activeEnvironment;

  return useMutation({
    mutationFn: deleteDynamicVariable,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['dynamicVariables', workspaceId, activeEnvironment?.id],
      });
    },
    onError: (error) => {
      console.error('Error deleting variable:', error);
    },
  });
};

const filterEnvironment = (environment: ResponseEnvironment): Environment => {
  return {
    id: environment.Id,
    name: environment.Name,
    workspaceId: environment.WorkspaceId,
    description: environment.Description,
    createdAt: environment.CreatedAt,
    updatedAt: environment.UpdatedAt,
    updatedBy: environment.UpdatedBy,
    createdBy: environment.CreatedBy,
    deletedAt: environment.DeletedAt,
    baseUrl: environment?.environmentVariables?.[0]?.InitialValue ?? '',
    isDefault: false,
    isPrimary: environment?.IsPrimary,
  };
};

const filterVariable = (variable: ResponseVariable): Variable => {
  return {
    id: variable.Id,
    environmentId: variable.EnvironmentId,
    name: variable.Name,
    description: variable.Description,
    type: variable.Type,
    initialValue: variable.InitialValue,
    currentValue: variable.CurrentValue,
    createdAt: variable.CreatedAt,
    updatedAt: variable.UpdatedAt,
    deletedAt: variable.DeletedAt,
    value: variable.CurrentValue || variable.InitialValue,
    scope: 'environment' as const,
    isGlobal: false,
    isSecret: false,
  };
};

const mapDynamicVariable = (
  variable: ResponseDynamicVariable
): DynamicVariable => {
  return {
    id: variable.Id,
    workspaceId: variable.workspaceId,
    name: variable.name,
    generatorId: variable.generatorId,
    generatorName: variable.generatorName,
    parameters: variable.parameters,
    type: variable.type,
    category: variable.category,
    createdAt: variable.CreatedAt,
    updatedAt: variable.UpdatedAt,
    deletedAt: variable.DeletedAt,
  };
};
