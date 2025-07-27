import {
  dataManagementActions,
  useDataManagementStore,
} from "@/store/dataManagementStore";
import {
  useCreateEnvironmentMutation,
  useCreateVariableMutation,
  useDeleteEnvironmentMutation,
  usefetchVariablesQuery,
  usegetEnvironmentQuery,
  useUpdateEnvironmentMutation,
} from "@/store/query/dataManagementQuery";
import { useWorkspace } from "./useWorkspace";

/**
 * Hook for managing API requests
 * This replaces the RequestContext with a store-based approach
 */
export function useDataManagement() {
  const { environments, activeEnvironment, isLoading } =
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

  const deleteEnvironmentMutation = useDeleteEnvironmentMutation();

  return {
    environments,
    activeEnvironment,
    isLoading,

    // Actions
    setEnvironments,
    setActiveEnvironment,

    createEnvironmentMutation,
    createVariableMutation,
    updateEnvironmentMutation,
    deleteEnvironmentMutation,
    
  };
}
