import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  getEncryptedCookie,
  setEncryptedCookie,
  removeCookie,
} from "@/lib/cookieUtils";
import { USER_COOKIE_NAME } from "@/lib/constants";
import { API_GET_USER } from "@/config/apiRoutes";

export function useAuth() {
  const queryClient = useQueryClient();

  const refreshUserData = async () => {
    try {
      // First check if we have user data in cookies
      const cachedUserData = getEncryptedCookie(USER_COOKIE_NAME);
     
      if(cachedUserData?.token) {
      return {
        user: {
          "firstName": "test",
          "lastName": "user",
          "email": "test.user@example.com"
        },
        token: cachedUserData?.token,
      }
      } else {
        return cachedUserData;
      }

      if (cachedUserData.user) {
        return cachedUserData;
      }

      // If no cookie data, fetch from API
      const res = await apiRequest('GET',API_GET_USER);

      // if (res.status === 401) {
      //   return null; // Return null for unauthorized instead of throwing
      // }
      // if (!res.ok) {
      //   throw new Error(`${res.status}: ${res.statusText}`);
      // }
      const userData = await res.json();
      if (userData) {
        setEncryptedCookie(USER_COOKIE_NAME, {
          user: userData,
          token: cachedUserData?.token,
        });
      }

      return userData;
    } catch (error) {
      console.error("Auth check error:", error);
      // return null;
    }
  };

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    queryFn: refreshUserData,
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      // Clear cached user data cookie on logout
      removeCookie(USER_COOKIE_NAME);
      queryClient.clear();
      window.location.href = "/";
    },
    onError: (error) => {
      console.error("Logout error:", error);
      // Still remove the cookie even on error
      removeCookie(USER_COOKIE_NAME);
      // Fallback logout - redirect to logout endpoint
      window.location.href = "/api/logout";
    },
  });

  const logout = () => {
    try {
      if (logoutMutation.mutate) {
        logoutMutation.mutate();
      } else {
        // Fallback if mutation not ready
        removeCookie(USER_COOKIE_NAME);
        window.location.href = "/api/logout";
      }
    } catch (error) {
      console.error("Logout function error:", error);
      removeCookie(USER_COOKIE_NAME);
      window.location.href = "/api/logout";
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    isLoggingOut: logoutMutation.isPending,
    // Add a function to force refresh user data from the API
    refreshUserData,
  };
}
