'use client';

import { useEffect, useState } from 'react';
import { useWorkspaceStore, workspaceActions } from '@/store/workspaceStore';
import {
  useWorkspacesQuery,
  useCreateWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useDeleteWorkspaceMutation,
  useSetPrimaryWorkspaceMutation,
} from '@/store/query/workspaceQuery';
import { useAuth } from './useAuth';
import type { Workspace } from '@/shared/types/workspace';

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
  const updatePrimaryWorkspaceMutation = useSetPrimaryWorkspaceMutation();

  const setCurrentWorkspace = (workspace: Workspace | null) => {
    workspaceActions.setCurrentWorkspace(workspace);
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
    }
  }, [isAuthenticated, workspaces.length]);

  useEffect(() => {
    if (isRefetching || !workspaces.length) return;

    // Find the primary workspace
    const primaryWorkspace = workspaces.find((ws) => ws.isPrimary);

    if (primaryWorkspace) {
      if (currentWorkspace?.id !== primaryWorkspace.id) {
        workspaceActions.setCurrentWorkspace(primaryWorkspace);
      }
    } else if (!currentWorkspace && workspaces.length > 0) {
      // Fallback: if no primary workspace, use first workspace
      workspaceActions.setCurrentWorkspace(workspaces[0]);
    }
  }, [workspaces, isRefetching, currentWorkspace]);

  useEffect(() => {
    if (!currentWorkspace) return;
    const stillExists = workspaces.some((ws) => ws.id === currentWorkspace.id);
    if (!stillExists) {
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
    updatePrimaryWorkspaceMutation,
  };
}
