import { API_GET_USER, API_LOGIN, API_LOGOUT, API_REGISTER } from "@/config/apiRoutes";
import { apiRequest } from "@/lib/queryClient";
import { ILoginResponse, User } from "@/shared/types/auth";

export const refreshUserData = async () => {
  try {
    const res = await apiRequest("GET", API_GET_USER);
    if (!res.ok) {
      throw new Error(`${res.status}: ${res.statusText}`);
    }
    return res.json();
  } catch (error) {
    console.error("Auth check error:", error);
    return null;
  }
};

export const loginApi = async (credentials: {
  email: string;
  password: string;
}) => {
  const response = await apiRequest("POST", API_LOGIN, {
    body: JSON.stringify(credentials),
  });
  if (!response.ok) {
    try {
      const errorData = await response.json();
      const errorMessage =
        errorData.message ||
        errorData.error ||
        errorData.errorMessage ||
        (typeof errorData === "string" ? errorData : null);

      if (errorMessage) {
        throw new Error(errorMessage);
      } else if (response.status === 401) {
        throw new Error("Invalid email or password");
      } else if (response.status === 403) {
        throw new Error("Account is locked or disabled");
      } else if (response.status === 429) {
        throw new Error("Too many login attempts. Please try again later");
      } else {
        throw new Error(`Login failed with status: ${response.status}`);
      }
    } catch (parseError) {
      // If we can't parse the JSON, use HTTP status codes for error messages
      if (response.status === 401) {
        throw new Error("Invalid email or password");
      } else if (response.status === 403) {
        throw new Error("Account is locked or disabled");
      } else if (response.status === 429) {
        throw new Error("Too many login attempts. Please try again later");
      } else {
        throw new Error(`Login failed with status: ${response.status}`);
      }
    }
  }

  const data = await response.json();
  return data as ILoginResponse;
};

export const logoutApi = async () => {
  try {
    // Make the logout request
    const response = await apiRequest("POST",API_LOGOUT);
    if (!response.ok) {
      throw new Error(`Logout failed with status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

export const registerApi = async (userData: User) => {
  try {
  const response = await apiRequest("POST", API_REGISTER, {
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    throw new Error("Registration failed");
  }

  return response.json();
  } catch (error) {
    console.error("Registration error:", error);
    throw error instanceof Error ? error : new Error("An unexpected error occurred during registration");
  }
};
