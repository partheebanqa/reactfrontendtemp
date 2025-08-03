import { queryClient } from '@/lib/queryClient';
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
} from '@/services/dataManagement.service';
import { workspaceStore } from '../workspaceStore';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  dataManagementActions,
  dataManagementStore,
} from '../dataManagementStore';
import {
  Environment,
  fetchEnvironmentsResponse,
  ResponseEnvironment,
  ResponseVariable,
  Variable,
} from '@/shared/types/datamanagement';

export const usegetEnvironmentQuery = (enabled = true) => {
  const workspaceId = workspaceStore.state.currentWorkspace?.id!;
  return useQuery({
    queryKey: ['environments', workspaceId],
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
  // console.log('useFetch var is called');

  const environmentId = dataManagementStore.state.activeEnvironment?.id!;
  // console.log('usefetchVariablesQuery is called');
  // console.log('activeEnvironment ID from Zustand:', environmentId);
  // console.log('Query enabled status:', !!environmentId && enabled);

  return useQuery({
    queryKey: ['variables', environmentId],
    enabled: !!environmentId && enabled,
    queryFn: async () => {
      try {
        console.log('Running fetchVariables for environment:', environmentId);

        const response = await fetchVariables(environmentId);
        if (response.items.length > 0) {
          const filteredVariables = response.items.map(filterVariable);
          dataManagementActions.setVariables(filteredVariables);
        }
        return [];
      } catch (error) {
        console.error('Error fetching variables:', error);
        throw error;
      }
    },
  });
};

export const useCreateEnvironmentMutation = () => {
  return useMutation({
    mutationFn: createEnvironment,
    onSuccess: (newEnvironment: ResponseEnvironment) => {
      dataManagementActions.setEnvironments([
        ...dataManagementStore.state.environments,
        filterEnvironment(newEnvironment),
      ]);
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
      console.log('🚀 ~ useDeleteEnvironmentMutation ~ environmentId:');
      console.log('Environment deleted:');
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
    onSuccess: (newVariable: any) => {
      console.log('New variable created:', newVariable);
      fetchVariablesQuery.refetch();
    },
  });
};

export const useUpdateVariableMutation = () => {
  const fetchVariablesQuery = usefetchVariablesQuery();
  return useMutation({
    mutationFn: updateVariable,
    onSuccess: (updatedVariable: any) => {
      console.log('Variable updated:', updatedVariable);
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
    onSuccess: (variableId: string) => {
      console.log('Variable deleted:', variableId);
      fetchVariablesQuery.refetch();
    },
    onError: (error) => {
      console.error('Error deleting variable:', error);
      fetchVariablesQuery.refetch();
    },
  });
};

const filterEnvironment = (environment: ResponseEnvironment) => {
  return {
    id: environment.Id,
    name: environment.Name,
    workspaceId: environment.WorkspaceId,
    description: environment.Description,
    createdAt: environment.CreatedAt,
    baseUrl: '',
    isDefault: false,
  } as Environment;
};

const filterVariable = (variable: ResponseVariable) => {
  return {
    createdAt: variable.CreatedAt, //
    currentValue: variable.CurrentValue,
    deletedAt: variable.DeletedAt, //
    description: variable.Description,
    environmentId: variable.EnvironmentId,
    id: variable.Id,
    initialValue: variable.InitialValue,
    name: variable.Name,
    type: variable.Type,
    updatedAt: variable.UpdatedAt, //
  } as Variable;
};
