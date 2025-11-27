import { useEffect, useRef } from 'react';
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
  const previousWorkspaceId = useRef(currentWorkspace?.id);
  const isInitialMount = useRef(true);

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
  const updateVariableMutation = useUpdateVariableMutation();
  const updateDynamicVariableMutation = useUpdateDynamicVariableMutation();
  const deleteEnvironmentMutation = useDeleteEnvironmentMutation();
  const deletedVariableMutation = useDeleteVariableMutation();
  const deletedDynamicVariableMutation = useDeleteDynamicVariableMutation();

  const setActiveEnvironment = (env: Environment | null) => {
    _setActiveEnvironment(env);
    if (env) {
      saveActiveEnvironment(currentWorkspace?.id, env.id);
    } else {
      clearSavedEnvironment(currentWorkspace?.id);
    }
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

  // Handle environment initialization and restoration from localStorage
  useEffect(() => {
    // Skip if still loading or no environments
    if (isEnvironmentsLoading || isEnvironmentsFetching) return;
    if (!environments?.length) {
      // If no environments exist, clear active environment
      if (activeEnvironment) {
        _setActiveEnvironment(null);
        clearSavedEnvironment(currentWorkspace?.id);
      }
      return;
    }

    // Get saved environment ID from localStorage
    const savedEnvId = getSavedEnvironmentId(currentWorkspace?.id);

    // If we have a saved environment ID, try to restore it
    if (savedEnvId) {
      const savedEnv = environments.find((e) => e.id === savedEnvId);

      if (savedEnv) {
        // Only update if it's different from current
        if (!activeEnvironment || activeEnvironment.id !== savedEnv.id) {
          _setActiveEnvironment(savedEnv);
        }
        return;
      }

      // Saved environment no longer exists, clear it
      clearSavedEnvironment(currentWorkspace?.id);
    }

    // No saved environment or saved one doesn't exist anymore
    // Set first environment as active if none is selected
    if (!activeEnvironment && environments.length > 0) {
      const firstEnv = environments[0];
      _setActiveEnvironment(firstEnv);
      saveActiveEnvironment(currentWorkspace?.id, firstEnv.id);
    }
  }, [
    environments,
    isEnvironmentsLoading,
    isEnvironmentsFetching,
    currentWorkspace?.id,
    activeEnvironment,
    _setActiveEnvironment,
  ]);

  // Validate active environment still exists in the list
  useEffect(() => {
    if (!activeEnvironment || !environments.length) return;

    const stillExists = environments.some((e) => e.id === activeEnvironment.id);

    if (!stillExists) {
      clearSavedEnvironment(currentWorkspace?.id);

      // Set first environment if available
      if (environments.length > 0) {
        const firstEnv = environments[0];
        _setActiveEnvironment(firstEnv);
        saveActiveEnvironment(currentWorkspace?.id, firstEnv.id);
      } else {
        _setActiveEnvironment(null);
      }
    }
  }, [
    environments,
    activeEnvironment,
    currentWorkspace?.id,
    _setActiveEnvironment,
  ]);

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
    updateVariableMutation,
    updateDynamicVariableMutation,
    deleteEnvironmentMutation,
    deletedVariableMutation,
    deletedDynamicVariableMutation,

    refetchEnvironments,
  };
}
