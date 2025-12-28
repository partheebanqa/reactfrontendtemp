// import { apiClient } from './api-client';

export interface MoveRequestPayload {
  requestId: string;
  targetCollectionId: string;
  targetFolderId?: string;
}

export interface MoveFolderPayload {
  folderId: string;
  targetCollectionId: string;
  targetFolderId?: string;
}

export const moveRequest = async (payload: MoveRequestPayload) => {
  //   const response = await apiClient.put('/requests/move', payload);
  //   return response.data;
};

export const moveFolder = async (payload: MoveFolderPayload) => {
  //   const response = await apiClient.put('/folders/move', payload);
  //   return response.data;
};
