import {
  dataManagementActions,
  useDataManagementStore,
} from "@/store/dataManagementStore";
import {
  useCreateEnvironmentMutation,
  useCreateVariableMutation,
  useDeleteEnvironmentMutation,
  useDeleteVariableMutation,
  usefetchVariablesQuery,
  usegetEnvironmentQuery,
  useUpdateEnvironmentMutation,
  useUpdateVariableMutation,
} from "@/store/query/dataManagementQuery";
import { useWorkspace } from "./useWorkspace";

/**
 * Hook for managing API requests
 * This replaces the RequestContext with a store-based approach
 */
export function useDataManagement() {
  const { environments, activeEnvironment, isLoading ,variables} =
    useDataManagementStore();

  const { currentWorkspace } = useWorkspace();

  const { refetch, isLoading: isRefetching,data } = usegetEnvironmentQuery(
    currentWorkspace?.id ? true : false
  );
  const {data: variablesData, isLoading: isVariablesLoading} = usefetchVariablesQuery(
    data?.id ? true : false,
  );

  const setEnvironments = dataManagementActions.setEnvironments;
  const setActiveEnvironment = dataManagementActions.setActiveEnvironment;

  const createEnvironmentMutation = useCreateEnvironmentMutation();
  const createVariableMutation = useCreateVariableMutation();
  const updateEnvironmentMutation = useUpdateEnvironmentMutation();
  const updateVariableMutation = useUpdateVariableMutation();

  const deleteEnvironmentMutation = useDeleteEnvironmentMutation();
  const deletedVariableMutation = useDeleteVariableMutation();

  return {
    environments,
    activeEnvironment,
    isLoading,
    variables,

    // Actions
    setEnvironments,
    setActiveEnvironment,
    setVariables: dataManagementActions.setVariables,

    createEnvironmentMutation,
    createVariableMutation,
    updateEnvironmentMutation,
    updateVariableMutation,
    deleteEnvironmentMutation,
    deletedVariableMutation
  };
}
