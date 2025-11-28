import { useEffect, useState } from 'react';
import { useWorkspaceStore, workspaceActions } from '@/store/workspaceStore';
import {
  useWorkspacesQuery,
  useCreateWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useDeleteWorkspaceMutation,
} from '@/store/query/workspaceQuery';
import { useAuth } from './useAuth';
import { Workspace } from '@/shared/types/workspace';
import {
  saveActiveWorkspace,
  getSavedWorkspaceId,
  clearSavedWorkspace,
} from '@/utils/workspaceStorage';

export function useWorkspace() {
  const { isAuthenticated } = useAuth();
  const { currentWorkspace, workspaces, isLoading } = useWorkspaceStore();
  const [shouldFetchWorkspaces, setShouldFetchWorkspaces] = useState(true);

  const {
    refetch: refreshWorkspaces,
    isLoading: isRefetching,
    isFetching: isWorkspacesFetching,
  } = useWorkspacesQuery(isAuthenticated && shouldFetchWorkspaces);

  const createWorkspaceMutation = useCreateWorkspaceMutation();
  const updateWorkspaceMutation = useUpdateWorkspaceMutation();
  const deleteWorkspaceMutation = useDeleteWorkspaceMutation();

  const setCurrentWorkspace = (workspace: Workspace | null) => {
    workspaceActions.setCurrentWorkspace(workspace);
    if (workspace) {
      saveActiveWorkspace(workspace.id);
    } else {
      clearSavedWorkspace();
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (workspaces.length === 0) {
        setShouldFetchWorkspaces(true);
      } else {
        setShouldFetchWorkspaces(false);
      }
    } else {
      workspaceActions.setWorkspaces([]);
      workspaceActions.setCurrentWorkspace(null);
      clearSavedWorkspace();
    }
  }, [isAuthenticated, workspaces.length]);

  useEffect(() => {
    if (isRefetching || !workspaces.length) return;

    const savedWorkspaceId = getSavedWorkspaceId();

    if (!savedWorkspaceId) {
      if (workspaces.length > 0 && !currentWorkspace) {
        const firstWorkspace = workspaces[0];
        workspaceActions.setCurrentWorkspace(firstWorkspace);
        saveActiveWorkspace(firstWorkspace.id);
      }
      return;
    }

    const match = workspaces.find((ws) => ws.id === savedWorkspaceId);

    if (match) {
      if (currentWorkspace?.id !== match.id) {
        workspaceActions.setCurrentWorkspace(match);
      }
    } else if (workspaces.length > 0) {
      const firstWorkspace = workspaces[0];
      workspaceActions.setCurrentWorkspace(firstWorkspace);
      saveActiveWorkspace(firstWorkspace.id);
    }
  }, [workspaces, isRefetching, currentWorkspace?.id]);

  useEffect(() => {
    if (!currentWorkspace) return;
    const stillExists = workspaces.some((ws) => ws.id === currentWorkspace.id);
    if (!stillExists) {
      clearSavedWorkspace();
      workspaceActions.setCurrentWorkspace(null);
    }
  }, [workspaces, currentWorkspace]);

  return {
    currentWorkspace,
    workspaces,
    isLoading: isLoading || isRefetching || isWorkspacesFetching,

    setCurrentWorkspace,
    refreshWorkspaces,

    createWorkspaceMutation,
    updateWorkspaceMutation,
    deleteWorkspaceMutation,
  };
}
