import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  getEncryptedCookie,
  setEncryptedCookie,
  removeCookie,
} from "@/lib/cookieUtils";
import { USER_COOKIE_NAME } from "@/lib/constants";
import { refreshUserData } from "@/service/auth.service";

export function useAuth() {
  const queryClient = useQueryClient();

  const {
    data: userData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    queryFn: refreshUserData,
    refetchInterval: false,
    staleTime: Infinity,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      return response;
    },
    onSuccess: async () => {
      removeCookie(USER_COOKIE_NAME);
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.clear();
    },
    onError: async (error: any) => {
      console.error("Logout error:", error);
      removeCookie(USER_COOKIE_NAME);
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  return {
    user: userData?.user,
    isLoading,
    isAuthenticated: !!userData?.token,
    logoutMutation,
  };
}
