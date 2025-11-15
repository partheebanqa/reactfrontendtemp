import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
  getEncryptedCookie,
  setEncryptedCookie,
  removeCookie,
} from '@/lib/cookieUtils';
import { USER_COOKIE_NAME } from '@/lib/constants';
import { authActions } from '../authStore';
import { User, ILoginResponse } from '@/shared/types/auth';
import {
  changePasswordApi,
  loginApi,
  logoutApi,
  refreshUserData,
  registerApi,
  forgotPasswordApi,
  resetPasswordApi,
  updateProfileApi,
} from '@/services/auth.service';
import { DeactivationFormData } from '@/components/settings/AccountDeactivation';
import { clearAllClientStorage } from '@/utils/logoutCacheClear';

// Query to fetch current user data
export const useUserQuery = () => {
  return useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
    queryFn: async () => {
      try {
        authActions.setIsLoading(true);
        const data = await refreshUserData();
        const filteredUser = filterUserData(data || {});
        if (filteredUser) {
          authActions.setUser(filteredUser);
        }
        authActions.setIsLoading(false);
        return data;
      } catch (error) {
        console.error('Auth check error:', error);
        authActions.setIsLoading(false);
        return null;
      }
    },
    refetchInterval: false,
    staleTime: Infinity,
  });
};

// Login mutation
export const useLoginMutation = () => {
  return useMutation({
    mutationFn: loginApi,
    onSuccess: async (data: ILoginResponse) => {
      if (data.token) {
        authActions.setToken(data.token);

        const existingData = getEncryptedCookie(USER_COOKIE_NAME) || {};
        const newUserData = { ...existingData, token: data.token };
        setEncryptedCookie(USER_COOKIE_NAME, newUserData);

        await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      }
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred during login';
      console.error('Login error:', message);
    },
  });
};

// Logout mutation
export const useLogoutMutation = () => {
  return useMutation({
    mutationFn: logoutApi,
    onSuccess: async () => {
      removeCookie(USER_COOKIE_NAME);
      authActions.clearAuth();
      clearAllClientStorage();
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.clear();
    },
    onError: async () => {
      // Ensure full client-side logout even if server logout fails
      removeCookie(USER_COOKIE_NAME);
      authActions.clearAuth();
      clearAllClientStorage();
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
  });
};

// Register mutation
export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: registerApi,
    onSuccess: async (data: ILoginResponse) => {
      if (data.message) {
        return data.message;
      }
    },
    onError: (error: any) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred during registration';
      console.error('Registration error:', errorMessage);
      throw new Error(errorMessage);
    },
  });
};

// Update profile mutation
export const useUpdateProfileMutation = () => {
  return useMutation({
    // Prefer centralized service (handles errors consistently)
    mutationFn: async (profileData: Partial<User>) => {
      // If sending JSON, service will JSON.stringify or apiRequest adds headers
      // If sending FormData (e.g., avatar), pass FormData directly and adapt service
      return updateProfileApi(profileData);
    },
    onSuccess: async (data) => {
      // Many backends return { user, message }
      const updatedUser = (data as any)?.user ?? (data as any);
      if (updatedUser) {
        // Update store immediately for optimistic UX
        authActions.setUser(updatedUser);
      }

      // Invalidate the canonical user query key to refetch fresh data
      // This should match the key used in useUserQuery
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
  });
};

export const useChangePasswordMutation = () => {
  return useMutation({
    mutationFn: changePasswordApi,
    onSuccess: () => {
      console.log('Password changed successfully');
      authActions.clearAuth();
      removeCookie(USER_COOKIE_NAME);
    },
  });
};

// NEW: Forgot password mutation
export const useForgotPasswordMutation = () => {
  return useMutation({
    mutationFn: forgotPasswordApi,
    onError: (error: any) => {
      const msg = error instanceof Error ? error.message : 'Unexpected error';
      console.error('Forgot password error:', msg);
      throw new Error(msg);
    },
  });
};

// NEW: Reset password mutation
export const useResetPasswordMutation = () => {
  return useMutation({
    mutationFn: resetPasswordApi,
    onSuccess: () => {
      console.log('Password reset successful');
    },
    onError: (error: any) => {
      const msg = error instanceof Error ? error.message : 'Unexpected error';
      console.error('Reset password error:', msg);
      throw new Error(msg);
    },
  });
};

export const useDeactiveAccountMutation = () => {
  return useMutation({
    mutationFn: async (data: DeactivationFormData) => {
      const response = await apiRequest('POST', '/api/auth/deactivate', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to deactivate account');
      }
      return response.json();
    },
    onSuccess: () => {
      // UI side-effects can be handled by caller if needed
      window.location.href = '/';
    },
  });
};

const filterUserData = (user: any) => {
  if (!user) return null;
  return {
    id: user.Id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    deletedAt: user.deletedAt,
    organization: user.organization || null,
  } as User;
};
