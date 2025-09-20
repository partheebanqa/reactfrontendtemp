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

export const usegetEnvironmentQuery = (enabled = true) => {
  const workspaceId = workspaceStore.state.currentWorkspace?.id;

  return useQuery({
    queryKey: ['environments', workspaceId],
    enabled: !!workspaceId && enabled,
    queryFn: async () => {
      if (!workspaceId) throw new Error('Workspace ID is missing');
      const response = await fetchEnvironments(workspaceId);
      if (response?.environments?.length) {
        const filteredEnvironments = response.environments.map(
          (env: ResponseEnvironment) => filterEnvironment(env)
        );
        const environment = filteredEnvironments[0];

        dataManagementActions.setEnvironments(filteredEnvironments);
        dataManagementActions.setActiveEnvironment(environment);
        return environment;
      } else {
        dataManagementActions.setEnvironments([]);
        dataManagementActions.setActiveEnvironment(null);
      }

      return null;
    },
  });
};

export const usefetchVariablesQuery = (enabled = true) => {
  const environment = dataManagementStore.state.activeEnvironment;
  const workspaceId = workspaceStore.state.currentWorkspace?.id;
  return useQuery({
    queryKey: ['variables', workspaceId],
    enabled: !!workspaceId && enabled,
    queryFn: async () => {
      if (!workspaceId) throw new Error('Environment ID is missing');

      const response = await fetchVariables(workspaceId);

      if (response.items.length > 0) {
        const filteredVariables = response.items.map(filterVariable);
        dataManagementActions.setVariables(filteredVariables);

        const baseUrlVar = filteredVariables.find(
          (v) => v.name.toLowerCase() === 'baseurl'
        );

        const updatedEnvironment = {
          ...environment,
          baseUrl: baseUrlVar?.initialValue || '', // fallback to empty if not found
        };

        dataManagementActions.setActiveEnvironment(updatedEnvironment);
      } else {
        // Set empty array if no variables
        dataManagementActions.setVariables([]);
      }

      return [];
    },
  });
};

export const usefetchDynamicVariablesQuery = (enabled = true) => {
  const environment = dataManagementStore.state.activeEnvironment;
  const workspaceId = workspaceStore.state.currentWorkspace?.id;

  return useQuery({
    queryKey: ['dynamicVariables', workspaceId],
    enabled: !!workspaceId && enabled,
    queryFn: async () => {
      if (!workspaceId) throw new Error('Workspace ID is missing');

      const response = await fetchDynamicVariables(workspaceId);

      if (response?.variables?.length > 0) {
        const mappedDynamicVariables =
          response?.variables.map(mapDynamicVariable);

        dataManagementActions.setDynamicVariables(mappedDynamicVariables);

        const baseUrlVar = mappedDynamicVariables.find(
          (v) => v.name.toLowerCase() === 'baseurl'
        );

        if (environment && baseUrlVar) {
          const updatedEnvironment = {
            ...environment,
            baseUrl: baseUrlVar.parameters?.url ?? '',
          };

          dataManagementActions.setActiveEnvironment(updatedEnvironment);
        }
      } else {
        dataManagementActions.setDynamicVariables([]);
      }

      return [];
    },
  });
};

export const useCreateEnvironmentMutation = () => {
  const fetchEnvironmentsQuery = usegetEnvironmentQuery();
  return useMutation({
    mutationFn: createEnvironment,
    onSuccess: async () => {
      await fetchEnvironmentsQuery.refetch();
    },
    onError: (error) => {
      console.error('Error creating environment:', error);
    },
  });
};

export const useUpdateEnvironmentMutation = () => {
  const fetchEnvironmentsQuery = usegetEnvironmentQuery();
  return useMutation({
    mutationFn: updateEnvironment,
    onSuccess: (updatedEnvironment: Environment) => {
      console.log('Environment updated:', updatedEnvironment);
      fetchEnvironmentsQuery.refetch();
    },
    onError: (error) => {
      console.error('Error updating environment:', error);
    },
  });
};

export const useDeleteEnvironmentMutation = () => {
  const fetchEnvironmentsQuery = usegetEnvironmentQuery();
  return useMutation({
    mutationFn: deleteEnvironment,
    onSuccess: () => {
      console.log('Environment deleted');
      fetchEnvironmentsQuery.refetch();
    },
    onError: (error) => {
      console.error('Error deleting environment:', error);
    },
  });
};

export const useCreateVariableMutation = () => {
  const fetchVariablesQuery = usefetchVariablesQuery();
  const fetchDynamicVariablesQuery = usefetchDynamicVariablesQuery();

  return useMutation({
    mutationFn: createVariable,
    onSuccess: () => {
      fetchVariablesQuery.refetch();
      fetchDynamicVariablesQuery.refetch();
    },
    onError: (error) => {
      console.error('Error creating variable:', error);
    },
  });
};

export const useUpdateVariableMutation = () => {
  const fetchVariablesQuery = usefetchVariablesQuery();
  return useMutation({
    mutationFn: updateVariable,
    onSuccess: () => {
      fetchVariablesQuery.refetch();
    },
    onError: (error) => {
      console.error('Error updating variable:', error);
    },
  });
};

export const useUpdateDynamicVariableMutation = () => {
  const fetchDynamicVariablesQuery = usefetchDynamicVariablesQuery();
  return useMutation({
    mutationFn: updateDynamicVariable,
    onSuccess: () => {
      fetchDynamicVariablesQuery.refetch();
    },
    onError: (error) => {
      console.error('Error updating dynamic variable:', error);
    },
  });
};

export const useDeleteVariableMutation = () => {
  const fetchVariablesQuery = usefetchVariablesQuery();
  return useMutation({
    mutationFn: deleteVariable,
    onSuccess: () => {
      fetchVariablesQuery.refetch();
    },
    onError: (error) => {
      console.error('Error deleting variable:', error);
      fetchVariablesQuery.refetch();
    },
  });
};

export const useDeleteDynamicVariableMutation = () => {
  const fetchDynamicVariablesQuery = usefetchDynamicVariablesQuery();
  return useMutation({
    mutationFn: deleteDynamicVariable,
    onSuccess: () => {
      fetchDynamicVariablesQuery.refetch();
    },
    onError: (error) => {
      console.error('Error deleting variable:', error);
      fetchDynamicVariablesQuery.refetch();
    },
  });
};

// ---------- Helpers ----------

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
