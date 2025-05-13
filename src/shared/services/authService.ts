import { ENV } from "../../config/env";
import { apiClient } from "./apiClient";

interface Credentials {
  email: string;
  password: string;
}

interface Register {
    firstName: string,
    lastName: string,
    organization: string,
    email: string,
    password: string,
}

export const authService = {

  login: async (credentials: Credentials): Promise<any> => {
    try {
      const response = await apiClient(`${ENV.API_URL}/users/login`, {
        method: 'POST',
        requiresAuth: false,
        body: JSON.stringify(credentials),
      });

      localStorage.setItem("userDetails", JSON.stringify(response));
      return response;
    }
    catch (error: any) {
      throw error;
    }
  },

  register: async (register: Register): Promise<any> => {
    try {
      const response = await apiClient(`${ENV.API_URL}/users/register`, {
        method: 'POST',
        requiresAuth: false,
        body: JSON.stringify(register),
      });
      return response;
    }
    catch (error: any) {
      throw error;
    }
  },
}