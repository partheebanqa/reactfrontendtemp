import { ENV } from "../../config/env";
import { apiClient } from "./apiClient";

export interface CreateWorkSpace {
  name: string;
  description: string;
}

export interface WorkSpaceList {
  message: string,
  workspaces: WorkSpace[]
}

export interface WorkSpace {
  Id: string,
  TenantID: string,
  Name: string,
  Description: string,
  CreatedAt: string;          
  UpdatedAt: string;          
  CreatedBy: string;         
  DeletedAt: string | null; 
}


export const workspaceService = {

  addWorkspace: async (workSpace: CreateWorkSpace): Promise<{message: string,workspaceId: string}> => {
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

  getWorkspaces:async (): Promise<WorkSpaceList> => {
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

  deleteWorkspace:async (workSpaceId:string): Promise<any> => {
    try {
      const response = await apiClient(`${ENV.API_URL}/workspaces/${workSpaceId}`, {
        method: 'DELETE',
        requiresAuth: true,
      });
        return response;
      }
      catch (error: any) {
        throw error;
      }
  },

  updateWorkspace:async (workSpace:CreateWorkSpace, workspaceId:string): Promise<any> => {
    try {
      const response = await apiClient(`${ENV.API_URL}/workspaces/${workspaceId}`, {
        method: 'PUT',
        requiresAuth: true,
        body: JSON.stringify(workSpace),
      });
        return response;
      }
      catch (error: any) {
        throw error;
      }
  },

}
