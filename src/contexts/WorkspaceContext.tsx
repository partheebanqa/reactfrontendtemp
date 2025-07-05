import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { fetchWorkspaces } from "@/service/workspace.service";
import { Workspace } from "@/shared/types/workspace";


interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  setCurrentWorkspace: (workspace: Workspace) => void;
  refreshWorkspaces: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isAuthenticated} = useAuth();
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null
  );
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  // Fetch workspaces using the fetchWorkspaces function from useAuth
  const { data: workspaceData, refetch } = useQuery({
    queryKey: ["/api/workspaces"],
    enabled: !!isAuthenticated,
    queryFn: fetchWorkspaces,
    refetchInterval: false, // Disable automatic refetching
    staleTime: Infinity, // Consider data fresh indefinitely until manually invalidated
  });

  

  // Set workspaces when data is fetched
  React.useEffect(() => {
    console.log("🚀 ~ React.useEffect ~ workspaceData:", workspaceData);
    if (workspaceData?.workspaces) {
      // Map API response to Workspace interface
      const mappedWorkspaces = workspaceData.workspaces.map(
        (workspace: any) => ({
          id: workspace.Id || workspace.id,
          tenantId: workspace.TenantID || workspace.tenantId,
          name: workspace.Name || workspace.name,
          description: workspace.Description || workspace.description,
          createdAt: workspace.CreatedAt || workspace.createdAt,
          updatedAt: workspace.UpdatedAt || workspace.updatedAt,
          createdBy: workspace.CreatedBy || workspace.createdBy,
          deletedAt: workspace.DeletedAt || workspace.deletedAt,
        })
      );

      setWorkspaces(mappedWorkspaces);
      if (mappedWorkspaces.length > 0 && !currentWorkspace) {
        setCurrentWorkspace(mappedWorkspaces[0]);
      }
    } else {
      setWorkspaces([]);
      setCurrentWorkspace(null);
    }
  }, [workspaceData, user]);

  const refreshWorkspaces = useCallback(() => {
    // Use the refetch function from the useQuery hook
    refetch();
  }, [refetch]);

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        workspaces,
        setCurrentWorkspace,
        refreshWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};
