import { useEffect, useRef } from "react";
import {
  dataManagementActions,
  useDataManagementStore,
} from "@/store/dataManagementStore";
import {
  useCreateEnvironmentMutation,
  useCreateVariableMutation,
  useDeleteEnvironmentMutation,
  useDeleteVariableMutation,
  useDeleteDynamicVariableMutation,
  usefetchVariablesQuery,
  usefetchDynamicVariablesQuery,
  usegetEnvironmentQuery,
  useUpdateEnvironmentMutation,
  useUpdatePrimaryEnvironmentMutation,
  useUpdateVariableMutation,
  useUpdateDynamicVariableMutation,
} from "@/store/query/dataManagementQuery";
import { useWorkspace } from "./useWorkspace";
import { Environment } from "@/shared/types/datamanagement";

export function useDataManagement() {
  const {
    environments,
    activeEnvironment,
    isLoading,
    variables,
    dynamicVariables,
  } = useDataManagementStore();

  const { currentWorkspace } = useWorkspace();
  const previousWorkspaceId = useRef(currentWorkspace?.id);

  const {
    refetch: refetchEnvironments,
    isLoading: isEnvironmentsLoading,
    data: environmentData,
    isFetching: isEnvironmentsFetching,
  } = usegetEnvironmentQuery(!!currentWorkspace?.id);

  const {
    data: variablesData,
    isLoading: isVariablesLoading,
    isFetching: isVariablesFetching,
  } = usefetchVariablesQuery(!!activeEnvironment?.id);

  const {
    data: dynamicVariablesData,
    isLoading: isDynamicVariablesLoading,
    isFetching: isDynamicVariablesFetching,
  } = usefetchDynamicVariablesQuery(!!activeEnvironment?.id);

  const _setActiveEnvironment = dataManagementActions.setActiveEnvironment;

  const createEnvironmentMutation = useCreateEnvironmentMutation();
  const createVariableMutation = useCreateVariableMutation();
  const updateEnvironmentMutation = useUpdateEnvironmentMutation();
  const updatePrimaryEnvironmentMutation =
    useUpdatePrimaryEnvironmentMutation();
  const updateVariableMutation = useUpdateVariableMutation();
  const updateDynamicVariableMutation = useUpdateDynamicVariableMutation();
  const deleteEnvironmentMutation = useDeleteEnvironmentMutation();
  const deletedVariableMutation = useDeleteVariableMutation();
  const deletedDynamicVariableMutation = useDeleteDynamicVariableMutation();

  const setActiveEnvironment = (env: Environment | null) => {
    _setActiveEnvironment(env);
  };

  // Handle workspace changes - clear state when workspace changes
  useEffect(() => {
    if (previousWorkspaceId.current !== currentWorkspace?.id) {
      _setActiveEnvironment(null);
      dataManagementActions.setVariables([]);
      dataManagementActions.setDynamicVariables([]);
      previousWorkspaceId.current = currentWorkspace?.id;
    }
  }, [currentWorkspace?.id, _setActiveEnvironment]);

  // Handle environment initialization based on isPrimary
  useEffect(() => {
    // Skip if still loading or no environments
    if (isEnvironmentsLoading || isEnvironmentsFetching) return;

    if (!environments?.length) {
      // If no environments exist, clear active environment
      if (activeEnvironment) {
        _setActiveEnvironment(null);
      }
      return;
    }

    // Find primary environment
    const primaryEnv = environments.find((e) => e.isPrimary === true);

    if (primaryEnv) {
      // Set primary environment as active if it's different from current
      if (!activeEnvironment || activeEnvironment.id !== primaryEnv.id) {
        _setActiveEnvironment(primaryEnv);
      }
    } else {
      // No primary environment, fallback to first environment
      if (!activeEnvironment && environments.length > 0) {
        _setActiveEnvironment(environments[0]);
      }
    }
  }, [
    environments,
    isEnvironmentsLoading,
    isEnvironmentsFetching,
    activeEnvironment,
    _setActiveEnvironment,
  ]);

  // Validate active environment still exists in the list
  useEffect(() => {
    if (!activeEnvironment || !environments.length) return;

    const stillExists = environments.some((e) => e.id === activeEnvironment.id);

    if (!stillExists) {
      // Active environment was deleted, find new one
      const primaryEnv = environments.find((e) => e.isPrimary === true);

      if (primaryEnv) {
        _setActiveEnvironment(primaryEnv);
      } else if (environments.length > 0) {
        _setActiveEnvironment(environments[0]);
      } else {
        _setActiveEnvironment(null);
      }
    }
  }, [environments, activeEnvironment, _setActiveEnvironment]);

  const isFullyLoading =
    isEnvironmentsLoading ||
    isEnvironmentsFetching ||
    isVariablesLoading ||
    isDynamicVariablesLoading ||
    isVariablesFetching ||
    isDynamicVariablesFetching;

  return {
    environments,
    activeEnvironment,
    isLoading: isFullyLoading,
    variables,
    dynamicVariables,

    isEnvironmentsLoading,
    isVariablesLoading,
    isDynamicVariablesLoading,

    setActiveEnvironment,
    setEnvironments: dataManagementActions.setEnvironments,
    setVariables: dataManagementActions.setVariables,
    setDynamicVariables: dataManagementActions.setDynamicVariables,

    createEnvironmentMutation,
    createVariableMutation,
    updateEnvironmentMutation,
    updatePrimaryEnvironmentMutation,
    updateVariableMutation,
    updateDynamicVariableMutation,
    deleteEnvironmentMutation,
    deletedVariableMutation,
    deletedDynamicVariableMutation,
    refetchEnvironments,
  };
}
