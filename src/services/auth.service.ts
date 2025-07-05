import { API_GET_USER } from "@/config/apiRoutes";
import { USER_COOKIE_NAME } from "@/lib/constants";
import {
  getEncryptedCookie,
  removeCookie,
  setEncryptedCookie,
} from "@/lib/cookieUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";

export const refreshUserData = async () => {
  const cachedUserData = getEncryptedCookie(USER_COOKIE_NAME);
  if (cachedUserData?.token && cachedUserData?.user) {
    return cachedUserData;
  }

  if (cachedUserData?.token) {
    return {
      user: {
        id: "1",
        name: "John Doe",
        email: "john.doe@example.com",
      },
      token: cachedUserData?.token || null,
    };
  } else {
    return {
      user: null,
      token: null,
    };
  }
  try {
    if (cachedUserData?.token && cachedUserData?.user) {
      return cachedUserData;
    }

    // If no cookie data, fetch from API
    const res = await apiRequest("GET", API_GET_USER);

    if (res.status === 401) {
      return null; // Return null for unauthorized instead of throwing
    }
    if (!res.ok) {
      throw new Error(`${res.status}: ${res.statusText}`);
    }

    const userData = await res.json();
    if (userData) {
      setEncryptedCookie(USER_COOKIE_NAME, {
        user: userData,
        token: cachedUserData?.token,
      });
    }

    return {
      user: userData,
      token: cachedUserData?.token,
    };
  } catch (error) {
    console.error("Auth check error:", error);
    return null;
  }
};

export const updateAuthState = async (token: string) => {
  try {
    // Get existing user data
    const existingData = getEncryptedCookie(USER_COOKIE_NAME) || {};

    // Update with new token
    const newUserData = {
      ...existingData,
      token: token,
    };

    // Save to cookie
    setEncryptedCookie(USER_COOKIE_NAME, newUserData);

    // Refresh the query to update the auth state
    await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

    return true;
  } catch (error) {
    console.error("Failed to update auth state:", error);
    return false;
  }
};

