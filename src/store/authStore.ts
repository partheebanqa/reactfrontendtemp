import { Workspace } from "@/shared/types/workspace";
import { Store, useStore } from "@tanstack/react-store";
import { User } from "@/shared/types/auth";
import { getEncryptedCookie } from "@/lib/cookieUtils";
import { USER_COOKIE_NAME } from "@/lib/constants";
import { workspaceActions, workspaceStore } from "./workspaceStore";

// Define the shape of our auth state
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Initial state for auth
export const initialAuthState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

// Create the store
export const authStore = new Store<AuthState>(initialAuthState);

// Define actions to update the store
export const authActions = {
  setUser: (user: User | null) => {
    authStore.setState((state) => ({
      ...state,
      user,
      isAuthenticated: !!state.token,
    }));
  },
  
  setToken: (token: string | null) => {
    authStore.setState((state) => ({
      ...state,
      token,
      isAuthenticated: !!token,
    }));
  },
  
  clearAuth: () => {
    authStore.setState(() => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    }));
  },
  
  setIsLoading: (isLoading: boolean) => {
    authStore.setState((state) => ({
      ...state,
      isLoading,
    }));
  },
  
  initializeFromCookie: () => {
    const cookieData = getEncryptedCookie(USER_COOKIE_NAME);
    if (cookieData) {
      if (cookieData.user) {
        authActions.setUser(cookieData.user);
      }
      if (cookieData.token) {
        authActions.setToken(cookieData.token);
      }
    }
    authActions.setIsLoading(false);
  }
};

// Hook to use the auth store
export const useAuthStore = () => {
  return useStore(authStore);
};
