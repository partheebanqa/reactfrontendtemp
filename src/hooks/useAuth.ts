import { useEffect } from 'react';
import { useAuthStore, authActions } from '@/store/authStore';
import {
  useUserQuery,
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} from '@/store/query/authQuery';

export function useAuth() {
  // Get state from auth store
  const { user, token, isAuthenticated, isLoading } = useAuthStore();

  // Initialize auth from cookies on first load
  useEffect(() => {
    authActions.initializeFromCookie();
  }, []);

  // Setup the user query to keep the store in sync
  const { refetch: refreshUser, error } = useUserQuery();

  // Setup mutations
  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();
  const registerMutation = useRegisterMutation();
  const updateProfileMutation = useUpdateProfileMutation();
  const changePasswordMutation = useChangePasswordMutation();

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,
    error,

    // Actions
    refreshUser,

    // Mutations
    loginMutation,
    logoutMutation,
    registerMutation,
    updateProfileMutation,
    changePasswordMutation,
  };
}
