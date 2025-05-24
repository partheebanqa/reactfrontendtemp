import { ENV } from "../../config/env";
import { apiClient } from "./apiClient";

export interface CreateCollection{
    name:string,
    workspaceId:string,
    isImportant:boolean
}

export interface CollectionList {
  CreatedAt: string,
  DeletedAt?: string ,
  Id: string
  IsImportant: boolean
  Name: string,
  UpdatedAt: string,
  Variables?: string,
  WorkspaceId: string
}

export const collectionService = {

  addCollection: async (collection: CreateCollection): Promise<any> => {
    try {
      const response = await apiClient(`${ENV.API_URL}/collections`, {
        method: 'POST',
        requiresAuth: true,
        body: JSON.stringify(collection),
      });
      return response;
    }
    catch (error: any) {
      throw error;
    }
  },

  getCollections:async (worspaceId:string): Promise<{collections: CollectionList[]}> => {
    try {
      const response = await apiClient(`${ENV.API_URL}/collections?ws=${worspaceId}`, {
        method: 'GET',
        requiresAuth: true,
      });
      return response;
    }
    catch (error: any) {
      throw error;
    }
  },

  deleteCollections:async (collectionId:string): Promise<any> => {
    try {
      const response = await apiClient(`${ENV.API_URL}/collections/${collectionId}`, {
        method: 'DELETE',
        requiresAuth: true,
      });
      return response;
    }
    catch (error: any) {
      throw error;
    }
  },

}