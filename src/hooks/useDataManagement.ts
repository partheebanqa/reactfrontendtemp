import {
  dataManagementActions,
  useDataManagementStore,
} from "@/store/dataManagementStore";
import {
  usefetchVariablesQuery,
  usegetEnvironmentQuery,
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

  return {
    environments,
    activeEnvironment,
    isLoading,

    // Actions
    setEnvironments,
    setActiveEnvironment,
  };
}
