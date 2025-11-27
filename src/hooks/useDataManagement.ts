import { useEffect } from 'react';
import {
  dataManagementActions,
  useDataManagementStore,
} from '@/store/dataManagementStore';
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
  useUpdateVariableMutation,
  useUpdateDynamicVariableMutation,
} from '@/store/query/dataManagementQuery';
import { useWorkspace } from './useWorkspace';
import { Environment } from '@/shared/types/datamanagement';
import {
  saveActiveEnvironment,
  getSavedEnvironmentId,
  clearSavedEnvironment,
} from '@/utils/environmentStorage';

export function useDataManagement() {
  const {
    environments,
    activeEnvironment,
    isLoading,
    variables,
    dynamicVariables,
  } = useDataManagementStore();

  const { currentWorkspace } = useWorkspace();

  // Fetch environment first
  const {
    refetch: refetchEnvironments,
    isLoading: isEnvironmentsLoading,
    data: environmentData,
    isFetching: isEnvironmentsFetching,
  } = usegetEnvironmentQuery(!!currentWorkspace?.id);

  // Only fetch variables after environment is loaded
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
  const updateVariableMutation = useUpdateVariableMutation();
  const updateDynamicVariableMutation = useUpdateDynamicVariableMutation();
  const deleteEnvironmentMutation = useDeleteEnvironmentMutation();
  const deletedVariableMutation = useDeleteVariableMutation();
  const deletedDynamicVariableMutation = useDeleteDynamicVariableMutation();

  /**
   * Wrapper: set active env + persist to localStorage (per workspace)
   */
  const setActiveEnvironment = (env: Environment | null) => {
    _setActiveEnvironment(env);
    if (env) {
      saveActiveEnvironment(currentWorkspace?.id, env.id);
    } else {
      clearSavedEnvironment(currentWorkspace?.id);
    }
  };

  /**
   * Hydrate selection from localStorage when:
   * - workspace changes
   * - environments finish loading
   * - on page refresh
   */
  useEffect(() => {
    // Wait until environments are actually loaded
    if (isEnvironmentsLoading || !environments?.length) return;

    const savedEnvId = getSavedEnvironmentId(currentWorkspace?.id);

    if (!savedEnvId) {
      // If no saved preference, use first environment and save it
      if (environments.length > 0 && !activeEnvironment) {
        const firstEnv = environments[0];
        _setActiveEnvironment(firstEnv);
        saveActiveEnvironment(currentWorkspace?.id, firstEnv.id);
      }
      return;
    }

    // Find the saved environment
    const match = environments.find((e) => e.id === savedEnvId);

    if (match) {
      // Only update if different from current active
      if (activeEnvironment?.id !== match.id) {
        _setActiveEnvironment(match);
      }
    } else if (environments.length > 0) {
      // Saved env no longer exists, default to first and update localStorage
      const firstEnv = environments[0];
      _setActiveEnvironment(firstEnv);
      saveActiveEnvironment(currentWorkspace?.id, firstEnv.id);
    }
  }, [
    currentWorkspace?.id,
    environments,
    isEnvironmentsLoading,
    _setActiveEnvironment,
  ]);

  /**
   * Clear state when workspace changes (but don't clear localStorage yet)
   */
  useEffect(() => {
    // Reset state when workspace changes to trigger fresh load
    // But keep localStorage - it will be used in the hydration effect above
    _setActiveEnvironment(null);
    dataManagementActions.setVariables([]);
    dataManagementActions.setDynamicVariables([]);
  }, [currentWorkspace?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * If an active env was deleted, clear the persisted key
   */
  useEffect(() => {
    if (!activeEnvironment) return;
    const stillExists = environments.some((e) => e.id === activeEnvironment.id);
    if (!stillExists) {
      clearSavedEnvironment(currentWorkspace?.id);
      _setActiveEnvironment(null);
    }
  }, [
    environments,
    activeEnvironment,
    currentWorkspace?.id,
    _setActiveEnvironment,
  ]);

  // Combined loading state
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

    // Also expose individual loading states if needed
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
    updateVariableMutation,
    updateDynamicVariableMutation,
    deleteEnvironmentMutation,
    deletedVariableMutation,
    deletedDynamicVariableMutation,

    refetchEnvironments,
  };
}
