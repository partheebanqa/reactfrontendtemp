export interface WorkspaceState {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
}

// Initial state for workspace
export const initialWorkspaceState: WorkspaceState = {
  currentWorkspace: null,
  workspaces: [],
  isLoading: false,
};

export interface Workspace {
  id: string;
  tenantId?: string;
  isPrimary: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  deletedAt?: string | null;
}
