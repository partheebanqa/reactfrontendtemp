import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  getEncryptedCookie,
  setEncryptedCookie,
  removeCookie,
} from '@/lib/cookieUtils';
import { USER_COOKIE_NAME } from '@/lib/constants';
import { API_GET_USER, API_LOGIN } from '@/config/apiRoutes';
import { authActions } from '../authStore';
import { User, ILoginResponse } from '@/shared/types/auth';
import { queryClient } from '@/lib/queryClient';
import {
  loginApi,
  logoutApi,
  refreshUserData,
  registerApi,
} from '@/services/auth.service';
import { da } from '@faker-js/faker';

// Query to fetch current user data
export const useUserQuery = () => {
  return useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
    queryFn: async () => {
      try {
        authActions.setIsLoading(true);
        const data = await refreshUserData();
        if (data?.user) {
          authActions.setUser(data.user);
        }

        if (data?.token) {
          authActions.setToken(data.token);
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
        const newUserData = {
          ...existingData,
          token: data.token,
        };
        setEncryptedCookie(USER_COOKIE_NAME, newUserData);
        await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        return true;
      }
      return false;
    },
    onError: (error: any) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred during login';

      console.error('Login error:', errorMessage);
      throw new Error(errorMessage);
    },
  });
};

// Logout mutation
export const useLogoutMutation = () => {
  return useMutation({
    mutationFn: logoutApi,
    onSuccess: async () => {
      // Clear cookie
      removeCookie(USER_COOKIE_NAME);

      // Clear auth store
      authActions.clearAuth();

      // Clear queries
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.clear();
    },
    onError: async (error: any) => {
      console.error('Logout error:', error);

      // Even on error, clean up local state
      removeCookie(USER_COOKIE_NAME);
      authActions.clearAuth();
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

      console.error('Registration erroraa:', errorMessage);
      throw new Error(errorMessage);
    },
  });
};

// Update profile mutation
export const useUpdateProfileMutation = () => {
  return useMutation({
    mutationFn: async (profileData: Partial<User>) => {
      const response = await apiRequest('PUT', '/api/auth/profile', {
        body: profileData,
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      return response.json();
    },
    onSuccess: async (data) => {
      if (data?.user) {
        // Update user in store
        authActions.setUser(data.user);

        // Update in queries
        await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      }
    },
  });
};
