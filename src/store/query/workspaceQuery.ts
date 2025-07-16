import { useMutation, useQuery } from "@tanstack/react-query";
import { workspaceActions, workspaceStore } from "../workspaceStore";
import {
  fetchWorkspaces,
  createWorkspace,
  updateWorkspace,
} from "@/service/workspace.service";
import { Workspace } from "@/shared/types/workspace";
import { apiRequest } from "@/lib/queryClient";
import { API_WORKSPACES } from "@/config/apiRoutes";
import { queryClient } from "@/lib/queryClient";

// Remove console log
// console.log('yeeeeee');

/**
 * Workspaces query with optimized caching strategy
 * - Prevents multiple calls when navigating pages
 * - Updates store directly
 * - Uses direct cache updates instead of invalidation
 */
export const useWorkspacesQuery = (enabled = true) => {
  return useQuery({
    queryKey: ["/api/workspaces"],
    enabled,
    retry: false,
    // Set staleTime to prevent unnecessary refetches when navigating between pages
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Set cacheTime to keep the data cached longer
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Disable refetching on window focus to prevent unnecessary calls
    refetchOnWindowFocus: false,
    queryFn: async () => {
      try {
        workspaceActions.setIsLoading(true);
        const data = await fetchWorkspaces();

        if (data?.workspaces) {
          // Map API response to Workspace interface if needed
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

          // Initialize current workspace if needed
          workspaceActions.initializeCurrentWorkspace();
        }

        workspaceActions.setIsLoading(false);
        return data;
      } catch (error) {
        console.error("Workspace fetch error:", error);
        workspaceActions.setIsLoading(false);
        return null;
      }
    },
  });
};

// Create workspace mutation
export const useCreateWorkspaceMutation = () => {
  const workspaceQuery = useWorkspacesQuery();
  return useMutation({
    mutationFn: async (workspaceData: Partial<Workspace>) => {
      return await createWorkspace(workspaceData);
    },
    onSuccess: (data) => {
      workspaceQuery.refetch();
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
      // Update the store directly first
      if (variables.id) {
        const updatedWorkspace = { ...variables, ...(data?.workspace || {}) };
        workspaceActions.updateWorkspace(updatedWorkspace);

        // If this was the current workspace, update that too
        const state = workspaceStore.state;
        if (state.currentWorkspace?.id === variables.id) {
          workspaceActions.setCurrentWorkspace(updatedWorkspace);
        }

        // Update the query cache directly
        queryClient.setQueryData(["/api/workspaces"], (oldData: any) => {
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
        "DELETE",
        `${API_WORKSPACES}/${workspaceId}`
      );
      if (!response.ok) {
        throw new Error("Failed to delete workspace");
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Handle current workspace if the deleted one was current
      const state = workspaceStore.state;
      if (state.currentWorkspace?.id === variables) {
        workspaceActions.setCurrentWorkspace(
          state.workspaces.length > 0 ? state.workspaces[1] : null
        );
      }

      // Remove from store
      workspaceActions.removeWorkspace(variables);

      // Update the query cache directly
      queryClient.setQueryData(["/api/workspaces"], (oldData: any) => {
        if (!oldData) return { workspaces: [] };
        return {
          ...oldData,
          workspaces: oldData.workspaces.filter(
            (workspace: Workspace) => workspace.id !== variables
          ),
        };
      });
    },
  });
};
