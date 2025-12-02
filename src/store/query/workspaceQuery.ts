import { useMutation, useQuery } from '@tanstack/react-query';
import { workspaceActions, workspaceStore } from '../workspaceStore';
import {
  fetchWorkspaces,
  createWorkspace,
  updateWorkspace,
  setPrimaryWorkspace,
} from '@/services/workspace.service';
import type { Workspace } from '@/shared/types/workspace';
import { apiRequest } from '@/lib/queryClient';
import { API_WORKSPACES } from '@/config/apiRoutes';
import { queryClient } from '@/lib/queryClient';

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
            isPrimary: workspace.IsPrimary || workspace.isPrimary || false,
          }));

          workspaceActions.setWorkspaces(mappedWorkspaces);

          let workspaceToSet: Workspace | null = null;

          workspaceToSet =
            mappedWorkspaces.find((ws: Workspace) => ws.isPrimary) || null;

          if (!workspaceToSet && workspaceStore.state.currentWorkspace) {
            workspaceToSet =
              mappedWorkspaces.find(
                (ws: Workspace) =>
                  ws.id === workspaceStore.state.currentWorkspace?.id
              ) || null;
          }

          if (!workspaceToSet && mappedWorkspaces.length > 0) {
            workspaceToSet = mappedWorkspaces[0];
          }

          if (workspaceToSet) {
            workspaceActions.setCurrentWorkspace(workspaceToSet);
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

export const useCreateWorkspaceMutation = () => {
  return useMutation({
    mutationFn: async (workspaceData: Partial<Workspace>) => {
      return await createWorkspace(workspaceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces'] });
    },
  });
};

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
        }

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

      workspaceActions.removeWorkspace(deletedWorkspaceId);

      if (state.currentWorkspace?.id === deletedWorkspaceId) {
        const remainingWorkspaces = state.workspaces.filter(
          (ws) => ws.id !== deletedWorkspaceId
        );

        if (remainingWorkspaces.length > 0) {
          const newCurrent =
            remainingWorkspaces.find((ws) => ws.isPrimary) ||
            remainingWorkspaces[0];
          workspaceActions.setCurrentWorkspace(newCurrent);
        } else {
          workspaceActions.setCurrentWorkspace(null);
        }
      }

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

export const useSetPrimaryWorkspaceMutation = () => {
  return useMutation({
    mutationFn: async (workspaceId: string) => {
      return await setPrimaryWorkspace(workspaceId);
    },
    onSuccess: (data, workspaceId) => {
      queryClient.setQueryData(['/api/workspaces'], (oldData: any) => {
        if (!oldData) return oldData;
        const updated = {
          ...oldData,
          workspaces: oldData.workspaces.map((workspace: Workspace) => ({
            ...workspace,
            isPrimary: workspace.id === workspaceId,
          })),
        };

        const primaryWorkspace = updated.workspaces.find(
          (ws: Workspace) => ws.isPrimary
        );
        if (primaryWorkspace) {
          workspaceActions.setCurrentWorkspace(primaryWorkspace);
        }

        return updated;
      });
    },
  });
};
