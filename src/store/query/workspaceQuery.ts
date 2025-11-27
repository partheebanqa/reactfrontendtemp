import { useMutation, useQuery } from '@tanstack/react-query';
import { workspaceActions, workspaceStore } from '../workspaceStore';
import {
  fetchWorkspaces,
  createWorkspace,
  updateWorkspace,
} from '@/services/workspace.service';
import { Workspace } from '@/shared/types/workspace';
import { apiRequest } from '@/lib/queryClient';
import { API_WORKSPACES } from '@/config/apiRoutes';
import { queryClient } from '@/lib/queryClient';
import {
  getSavedWorkspaceId,
  saveActiveWorkspace,
} from '@/utils/workspaceStorage';

export const useWorkspacesQuery = (enabled = true) => {
  return useQuery({
    queryKey: ['/api/workspaces'],
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      try {
        workspaceActions.setIsLoading(true);
        const data = await fetchWorkspaces();

        if (data?.workspaces) {
          const mappedWorkspaces = data.workspaces.map((workspace: any) => ({
            id: workspace.Id || workspace.id,
            tenantId: workspace.TenantID || workspace.tenantId,
            name: workspace.Name || workspace.name,
            description: workspace.Description || workspace.description,
            createdAt: workspace.CreatedAt || workspace.createdAt,
            updatedAt: workspace.UpdatedAt || workspace.updatedAt,
            createdBy: workspace.CreatedBy || workspace.createdBy,
            deletedAt: workspace.DeletedAt || workspace.deletedAt,
          }));

          // Update store
          workspaceActions.setWorkspaces(mappedWorkspaces);

          // Restore workspace from localStorage
          const currentActive = workspaceStore.state.currentWorkspace;
          const savedWorkspaceId = getSavedWorkspaceId();

          // Priority: 1) Saved workspace, 2) Current active if exists, 3) First workspace
          let workspaceToSet: Workspace | null = null;

          if (savedWorkspaceId) {
            workspaceToSet =
              mappedWorkspaces.find(
                (ws: Workspace) => ws.id === savedWorkspaceId
              ) || null;
          }

          if (!workspaceToSet && currentActive) {
            workspaceToSet =
              mappedWorkspaces.find(
                (ws: Workspace) => ws.id === currentActive.id
              ) || null;
          }

          if (!workspaceToSet && mappedWorkspaces.length > 0) {
            workspaceToSet = mappedWorkspaces[0];
          }

          if (workspaceToSet) {
            workspaceActions.setCurrentWorkspace(workspaceToSet);
            // Save to localStorage to ensure it's persisted
            saveActiveWorkspace(workspaceToSet.id);
          }
        }

        workspaceActions.setIsLoading(false);
        return data;
      } catch (error) {
        console.error('Workspace fetch error:', error);
        workspaceActions.setIsLoading(false);
        return null;
      }
    },
  });
};

// Create workspace mutation
export const useCreateWorkspaceMutation = () => {
  return useMutation({
    mutationFn: async (workspaceData: Partial<Workspace>) => {
      return await createWorkspace(workspaceData);
    },
    onSuccess: () => {
      // Invalidate to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces'] });
    },
  });
};

// Update workspace mutation
export const useUpdateWorkspaceMutation = () => {
  return useMutation({
    mutationFn: async (workspaceData: Partial<Workspace>) => {
      return await updateWorkspace(workspaceData);
    },
    onSuccess: (data, variables) => {
      if (variables.id) {
        const updatedWorkspace = { ...variables, ...(data?.workspace || {}) };
        workspaceActions.updateWorkspace(updatedWorkspace);

        const state = workspaceStore.state;
        if (state.currentWorkspace?.id === variables.id) {
          workspaceActions.setCurrentWorkspace(updatedWorkspace);
          // Update localStorage with new data
          saveActiveWorkspace(updatedWorkspace.id);
        }

        // Update the query cache directly
        queryClient.setQueryData(['/api/workspaces'], (oldData: any) => {
          if (!oldData) return { workspaces: [updatedWorkspace] };
          return {
            ...oldData,
            workspaces: oldData.workspaces.map((workspace: Workspace) =>
              workspace.id === variables.id ? updatedWorkspace : workspace
            ),
          };
        });
      }
    },
  });
};

// Delete workspace mutation
export const useDeleteWorkspaceMutation = () => {
  return useMutation({
    mutationFn: async (workspaceId: string) => {
      const response = await apiRequest(
        'DELETE',
        `${API_WORKSPACES}/${workspaceId}`
      );
      if (!response.ok) {
        throw new Error('Failed to delete workspace');
      }
      return response.json();
    },
    onSuccess: (_, deletedWorkspaceId) => {
      const state = workspaceStore.state;

      // Remove from store
      workspaceActions.removeWorkspace(deletedWorkspaceId);

      // Handle current workspace if the deleted one was current
      if (state.currentWorkspace?.id === deletedWorkspaceId) {
        const remainingWorkspaces = state.workspaces.filter(
          (ws) => ws.id !== deletedWorkspaceId
        );

        if (remainingWorkspaces.length > 0) {
          const newCurrent = remainingWorkspaces[0];
          workspaceActions.setCurrentWorkspace(newCurrent);
          saveActiveWorkspace(newCurrent.id);
        } else {
          workspaceActions.setCurrentWorkspace(null);
        }
      }

      // Update the query cache directly
      queryClient.setQueryData(['/api/workspaces'], (oldData: any) => {
        if (!oldData) return { workspaces: [] };
        return {
          ...oldData,
          workspaces: oldData.workspaces.filter(
            (workspace: Workspace) => workspace.id !== deletedWorkspaceId
          ),
        };
      });
    },
  });
};
