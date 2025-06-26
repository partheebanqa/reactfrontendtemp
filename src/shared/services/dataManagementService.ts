import { ENV } from "../../config/env";
import { StaticVariable } from "../types/dataManagementtypes";
import { apiClient } from "./apiClient";


export const dataManagementService = {

  addStaticVariables: async (staticVariable: StaticVariable): Promise<any> => {
    try {
      const response = await apiClient(`${ENV.API_URL}/variables/static`, {
        method: 'POST',
        requiresAuth: true,
        body: JSON.stringify(staticVariable),
      });
      return response;
    }
    catch (error: any) {
      throw error;
    }
  },

  getStaticVariables: async (workspaceId: string): Promise<any> => {
    try {
      const response = await apiClient(`${ENV.API_URL}/variables/static?ws=${workspaceId}`, {
        method: 'GET',
        requiresAuth: true,
        body: JSON.stringify(workspaceId),
      });
      return response;
    }
    catch (error: any) {
      throw error;
    }
  },
}

