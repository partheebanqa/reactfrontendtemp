import { ENV } from "../../config/env";
import { apiClient } from "./apiClient";

export interface Collection{
    name:string,
    workspaceId:string,
    isImportant:boolean
}

export const collectionService = {

  addCollection: async (collection: Collection): Promise<any> => {
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

//   getWorkspaces:async (): Promise<any> => {
//     try {
//       const response = await apiClient(`${ENV.API_URL}/workspaces`, {
//         method: 'GET',
//         requiresAuth: true,
//       });
//       return response;
//     }
//     catch (error: any) {
//       throw error;
//     }
//   },

}