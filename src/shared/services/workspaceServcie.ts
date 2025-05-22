import { ENV } from "../../config/env";
import { apiClient } from "./apiClient";

export interface WorkSpace {
  name: string;
  description: string;
}

export const workspaceService = {

  addWorkspace: async (workSpace: WorkSpace): Promise<any> => {
    try {
      const response = await apiClient(`${ENV.API_URL}/workspaces`, {
        method: 'POST',
        requiresAuth: true,
        body: JSON.stringify(workSpace),
      });
      return response;
    }
    catch (error: any) {
      throw error;
    }
  },

  getWorkspaces:async (): Promise<any> => {
    try {
      const response = await apiClient(`${ENV.API_URL}/workspaces`, {
        method: 'GET',
        requiresAuth: true,
      });
      return response;
    }
    catch (error: any) {
      throw error;
    }
  },

}