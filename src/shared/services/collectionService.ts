import axios from "axios";
import { ENV } from "../../config/env";
import { CollectionRequest, ImportCollection } from "../../types";
import { apiClient } from "./apiClient";

export interface CreateCollection{
    name:string,
    workspaceId:string,
    isImportant:boolean
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

  getCollections:async (worspaceId:string): Promise<{collections: any}> => {
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
  
  updateCollection:async ({id,name} : {id:string, name:string}): Promise<any> => {
    try {
      const response = await apiClient(`${ENV.API_URL}/collections/${id}/rename`, {
        method: 'PUT',
        requiresAuth: true,
        body:JSON.stringify({name:name})
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

  getCollectionRequests:async (collectionId:string) : Promise<any> => {
     try {
      const response = await apiClient(`${ENV.API_URL}/collections/${collectionId}/requests`, {
        method: 'GET',
        requiresAuth: true,
      });
      return response;
    }
    catch (error: any) {
      throw error;
    }
  },

  saveCollectionRequest:async (collectionRequest:CollectionRequest) : Promise<any> => {
     try {
      const response = await apiClient(`${ENV.API_URL}/requests`, {
        method: 'POST',
        requiresAuth: true,
        body:JSON.stringify(collectionRequest)
      });
      return response;
    }
    catch (error: any) {
      throw error;
    }
  },

  deleteCollectionRequest:async (requestId:string) : Promise<any> => {
     try {
      const response = await apiClient(`${ENV.API_URL}/requests/${requestId}`, {
        method: 'DELETE',
        requiresAuth: true,
      });
      return response;
    }
    catch (error: any) {
      throw error;
    }
  },

  renameRequest:async (name:string, requestId:string) : Promise<any> => {
    const rename = {
      name:name
    }
     try {
      const response = await apiClient(`${ENV.API_URL}/requests/${requestId}/rename`, {
        method: 'PUT',
        requiresAuth: true,
        body:JSON.stringify(rename)
      });
      return response;
    }
    catch (error: any) {
      throw error;
    }
  },

   deleteRequest:async (requestId:string) : Promise<any> => {
     try {
      const response = await apiClient(`${ENV.API_URL}/requests/${requestId}`, {
        method: 'DELETE',
        requiresAuth: true,
      });
      return response;
    }
    catch (error: any) {
      throw error;
    }
  },

  importCollectionFile:async (importCollection:ImportCollection) : Promise<any> => {
    try {
    const formData = new FormData();

    // Add metadata fields
    formData.append('name', importCollection.name);
    formData.append('workspaceId', importCollection.workspaceId);
    formData.append('inputMethod', importCollection.inputMethod);
    formData.append('specificationType', importCollection.specificationType);
    formData.append('url', importCollection.url);
    formData.append('raw', importCollection.raw);
    formData.append('file', importCollection.file);

    const userDetails = localStorage.getItem('userDetails');
    let token = ''
    if (userDetails) {
      const details = JSON.parse(userDetails);
      token = details.token;
    }

    const response = await axios.post(`${ENV.API_URL}/collections/import`, formData, {
      headers: {
        "content-type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
      
    });
    
    return response;
    }
    catch (error: any) {
      throw error;
    }
  },


}