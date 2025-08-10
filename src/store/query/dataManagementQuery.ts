import { queryClient } from '@/lib/queryClient';
import {
  createEnvironment,
  createVariable,
  deleteEnvironment,
  deleteVariable,
  fetchEnvironments,
  fetchVariables,
  updateEnvironment,
  updateVariable,
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
  Variable,
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

        console.log('filteredEnvironments:', filteredEnvironments);

        dataManagementActions.setEnvironments(filteredEnvironments);
        dataManagementActions.setActiveEnvironment(environment);
        console.log('environmentReturn:', environment);
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
  const environmentId = environment?.id;

  return useQuery({
    queryKey: ['variables', environmentId],
    enabled: !!environmentId && enabled,
    queryFn: async () => {
      if (!environmentId) throw new Error('Environment ID is missing');

      const response = await fetchVariables(environmentId);

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
  return useMutation({
    mutationFn: createVariable,
    onSuccess: () => {
      fetchVariablesQuery.refetch();
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
  };
};
