import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  getEncryptedCookie,
  setEncryptedCookie,
  removeCookie,
} from "@/lib/cookieUtils";
import { USER_COOKIE_NAME } from "@/lib/constants";
import { authActions } from "../authStore";
import { User, ILoginResponse } from "@/shared/types/auth";
import { queryClient } from "@/lib/queryClient";
import {
  changePasswordApi,
  loginApi,
  logoutApi,
  refreshUserData,
  registerApi,
} from "@/services/auth.service";
import { DeactivationFormData } from "@/components/settings/AccountDeactivation";

// Query to fetch current user data
export const useUserQuery = () => {
  return useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    queryFn: async () => {
      try {
        authActions.setIsLoading(true);
        const data = await refreshUserData();
        const filteredUser = filterUserData(data || {});
        console.log("🚀 ~ useUserQuery ~ filteredUser:", filteredUser);
        if (filteredUser) {
          authActions.setUser(filteredUser);
        }
        authActions.setIsLoading(false);
        return data;
      } catch (error) {
        console.error("Auth check error:", error);
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
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        return true;
      }
      return false;
    },
    onError: (error: any) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during login";

      console.error("Login error:", errorMessage);
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

      localStorage.clear();

      // Clear queries
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.clear();
    },
    onError: async (error: any) => {
      removeCookie(USER_COOKIE_NAME);
      authActions.clearAuth();
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
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
          : "An unexpected error occurred during registration";

      console.error("Registration erroraa:", errorMessage);
      throw new Error(errorMessage);
    },
  });
};

// Update profile mutation
export const useUpdateProfileMutation = () => {
  return useMutation({
    mutationFn: async (profileData: Partial<User>) => {
      const response = await apiRequest("PUT", "/api/auth/profile", {
        body: profileData,
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      return response.json();
    },
    onSuccess: async (data) => {
      if (data?.user) {
        // Update user in store
        authActions.setUser(data.user);

        // Update in queries
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      }
    },
  });
};

export const useChangePasswordMutation = () => {
  return useMutation({
    mutationFn: changePasswordApi,
    onSuccess: () => {
      console.log("Password changed successfully");
      authActions.clearAuth();
      removeCookie(USER_COOKIE_NAME);
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
      toast({
        title: 'Account deactivated',
        description: 'Your account has been successfully deactivated.',
      });
      setIsDeactivationDialogOpen(false);
      // Redirect to login or home page
      window.location.href = '/';
    },
  });
};

const filterUserData = (user) => {
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
