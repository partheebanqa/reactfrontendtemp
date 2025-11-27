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

const envKey = (wsId?: string | null) => `dm:activeEnv:${wsId ?? 'default'}`;

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
    try {
      const key = envKey(currentWorkspace?.id);
      if (env) {
        localStorage.setItem(key, JSON.stringify({ id: env.id }));
      } else {
        localStorage.removeItem(key);
      }
    } catch {}
  };

  /**
   * Hydrate selection from localStorage when:
   * - workspace changes
   * - environments finish loading
   */
  useEffect(() => {
    // Wait until environments are actually loaded
    if (isEnvironmentsLoading || !environments?.length) return;

    const key = envKey(currentWorkspace?.id);
    let saved: { id: string } | null = null;
    try {
      const item = localStorage.getItem(key);
      saved = item ? JSON.parse(item) : null;
    } catch {
      saved = null;
    }

    if (!saved?.id) {
      // If no saved preference, use first environment
      if (environments.length > 0 && !activeEnvironment) {
        _setActiveEnvironment(environments[0]);
      }
      return;
    }

    // Only apply if found and different from current active
    const match = environments.find((e) => e.id === saved!.id);
    if (match && activeEnvironment?.id !== match.id) {
      _setActiveEnvironment(match);
    } else if (!match && environments.length > 0) {
      // Saved env no longer exists, default to first
      _setActiveEnvironment(environments[0]);
    }
  }, [
    currentWorkspace?.id,
    environments,
    activeEnvironment?.id,
    isEnvironmentsLoading,
    _setActiveEnvironment,
  ]);

  /**
   * Clear workspace when it changes
   */
  useEffect(() => {
    // Reset when workspace changes
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
      try {
        localStorage.removeItem(envKey(currentWorkspace?.id));
      } catch {}
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
