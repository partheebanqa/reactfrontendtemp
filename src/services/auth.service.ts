import {
  API_GET_USER,
  API_LOGIN,
  API_LOGOUT,
  API_PASSWORD_CHANGE,
  API_REGISTER,
} from "@/config/apiRoutes";
import { apiRequest } from "@/lib/queryClient";
import { ILoginResponse, SingUpForm, User } from "@/shared/types/auth";

export const refreshUserData = async () => {
  try {
    const res = await apiRequest("GET", API_GET_USER);
    if (!res.ok) {
      throw new Error(`${res.status}: ${res.statusText}`);
    }
    return res.json();
  } catch (error) {
    return null;
  }
};

export const loginApi = async (credentials: {
  email: string;
  password: string;
}) => {
  try {
    const response = await apiRequest("POST", API_LOGIN, {
      body: JSON.stringify(credentials),
    });
    const data = await response.json();
    return data as ILoginResponse;
  } catch (error) {
    throw error;
  }
};

export const logoutApi = async () => {
  try {
    // Make the logout request
    const response = await apiRequest("POST", API_LOGOUT);
    if (!response.ok) {
      throw new Error(`Logout failed with status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    throw error;
  }
};

export const registerApi = async (userData: SingUpForm) => {
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
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred during registration");
  }
};

export const changePasswordApi = async (passwordData: {
  oldPassword: string;
  newPassword: string;
}) => {
  const response = await apiRequest("POST", API_PASSWORD_CHANGE, {
    body: JSON.stringify(passwordData),
  });
  if (!response.ok) {
    throw new Error("Failed to change password");
  }
  return response.json();
};
