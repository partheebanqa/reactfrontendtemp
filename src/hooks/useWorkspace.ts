import { useEffect, useState } from "react";
import { useWorkspaceStore, workspaceActions } from "@/store/workspaceStore";
import {
  useWorkspacesQuery,
  useCreateWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useDeleteWorkspaceMutation,
} from "@/store/query/workspaceQuery";
import { useAuth } from "./useAuth";
import { Workspace } from "@/shared/types/workspace";
import { getEncryptedCookie, setEncryptedCookie } from "@/lib/cookieUtils";
import { USER_COOKIE_NAME } from "@/lib/constants";

export function useWorkspace() {
  // Get auth state to check if authenticated
  const { isAuthenticated } = useAuth();

  // Get workspace state from store
  const { currentWorkspace, workspaces, isLoading } = useWorkspaceStore();

  // Track if we need to fetch workspaces
  const [shouldFetchWorkspaces, setShouldFetchWorkspaces] = useState(true);

  // Setup queries and mutations
  const { refetch: refreshWorkspaces, isLoading: isRefetching } =
    useWorkspacesQuery(isAuthenticated && shouldFetchWorkspaces);

  const createWorkspaceMutation = useCreateWorkspaceMutation();
  const updateWorkspaceMutation = useUpdateWorkspaceMutation();
  const deleteWorkspaceMutation = useDeleteWorkspaceMutation();

  // Set current workspace
  const setCurrentWorkspace = (workspace: Workspace | null) => {
    const existingData = getEncryptedCookie(USER_COOKIE_NAME) || {};
    const newUserData = {
      ...existingData,
      workspaceId: workspace?.id || null,
    };
    setEncryptedCookie(USER_COOKIE_NAME, newUserData);
    workspaceActions.setCurrentWorkspace(workspace);
  };

  // Initialize workspaces when authenticated changes
  useEffect(() => {
    if (isAuthenticated) {
      // Only fetch workspaces if we don't already have them
      if (workspaces.length === 0) {
        setShouldFetchWorkspaces(true);
      } else {
        setShouldFetchWorkspaces(false);
      }
    } else {
      // Clear workspaces when not authenticated
      workspaceActions.setWorkspaces([]);
      workspaceActions.setCurrentWorkspace(null);
    }
  }, [isAuthenticated, workspaces.length]);

  return {
    // State
    currentWorkspace,
    workspaces,
    isLoading: isLoading || isRefetching,

    // Actions
    setCurrentWorkspace,
    refreshWorkspaces, // Replace with our controlled version

    // Mutations
    createWorkspaceMutation,
    updateWorkspaceMutation,
    deleteWorkspaceMutation,
  };
}
