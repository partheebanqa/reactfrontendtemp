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
  } = useDataManagementStore(); // ⬅️ also grab dynamicVariables

  console.log('dynamicVariables in useDataManagement:', dynamicVariables);
  console.log('variables in useDataManagement:', variables);

  const { currentWorkspace } = useWorkspace();

  const {
    refetch,
    isLoading: isRefetching,
    data,
  } = usegetEnvironmentQuery(!!currentWorkspace?.id);

  const { data: variablesData, isLoading: isVariablesLoading } =
    usefetchVariablesQuery(!!data?.id);
  const { data: dynamicVariablesData, isLoading: isDynamicVariablesLoading } =
    usefetchDynamicVariablesQuery(!!data?.id);

  const setEnvironments = dataManagementActions.setEnvironments;
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
    const key = envKey(currentWorkspace?.id);
    let saved: { id: string } | null = null;
    try {
      saved = JSON.parse(localStorage.getItem(key) || 'null');
    } catch {
      saved = null;
    }

    if (!saved?.id || !environments?.length) return;

    // Only apply if found and different from current active
    const match = environments.find((e) => e.id === saved!.id);
    if (match && activeEnvironment?.id !== match.id) {
      _setActiveEnvironment(match); // no re-persist here to avoid loop
    }
  }, [currentWorkspace?.id, environments, _setActiveEnvironment]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * If an active env was deleted, clear the persisted key
   * (Call this where you handle delete success, or keep this passive guard)
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

  return {
    environments,
    activeEnvironment,
    isLoading,
    variables,
    dynamicVariables,

    setActiveEnvironment,
    setEnvironments,
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
  };
}
