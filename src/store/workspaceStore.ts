import { USER_COOKIE_NAME } from '@/lib/constants';
import { getEncryptedCookie } from '@/lib/cookieUtils';
import {
  initialWorkspaceState,
  Workspace,
  WorkspaceState,
} from '@/shared/types/workspace';
import { Store, useStore } from '@tanstack/react-store';

// Define the shape of our workspace state

// Create the store
export const workspaceStore = new Store<WorkspaceState>(initialWorkspaceState);

// Define actions to update the store
export const workspaceActions = {
  setCurrentWorkspace: (workspace: Workspace | null) => {
    workspaceStore.setState((state) => ({
      ...state,
      currentWorkspace: workspace,
    }));
  },

  setWorkspaces: (workspaces: Workspace[]) => {
    workspaceStore.setState((state) => ({
      ...state,
      workspaces,
    }));
  },

  addWorkspace: (workspace: Workspace) => {
    workspaceStore.setState((state) => ({
      ...state,
      workspaces: [...state.workspaces, workspace],
    }));
  },

  updateWorkspace: (updatedWorkspace: Workspace) => {
    workspaceStore.setState((state) => ({
      ...state,
      workspaces: state.workspaces.map((workspace) =>
        workspace.id === updatedWorkspace.id ? updatedWorkspace : workspace
      ),
    }));
  },

  removeWorkspace: (workspaceId: string) => {
    workspaceStore.setState((state) => ({
      ...state,
      workspaces: state.workspaces.filter((ws) => ws.id !== workspaceId),
    }));
  },

  setIsLoading: (isLoading: boolean) => {
    workspaceStore.setState((state) => ({
      ...state,
      isLoading,
    }));
  },

  initializeCurrentWorkspace: () => {
    const state = workspaceStore.state;
    if (state.workspaces.length > 0 && !state.currentWorkspace) {
      const cookieData = getEncryptedCookie(USER_COOKIE_NAME);
      if (cookieData && cookieData.workspaceId) {
        const workspaceData = workspaceStore.state.workspaces.find(
          (ws) => ws.id === cookieData.workspaceId
        );
        if (workspaceData) {
          workspaceActions.setCurrentWorkspace(workspaceData);
        } else {
          workspaceActions.setCurrentWorkspace(state.workspaces[0]);
        }
      } else {
        workspaceActions.setCurrentWorkspace(state.workspaces[0]);
      }
    }
  },

  // ✅ Add this reset action to clear the workspace state on logout
  reset: () => {
    workspaceStore.setState(initialWorkspaceState);
  },
};

// Hook to use the workspace store
export const useWorkspaceStore = () => {
  return useStore(workspaceStore);
};
