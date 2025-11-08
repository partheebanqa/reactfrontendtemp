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
  console.log('payloadRequest:', payload);
  //   const response = await apiClient.put('/requests/move', payload);
  //   return response.data;
};

export const moveFolder = async (payload: MoveFolderPayload) => {
  console.log('payloadFolder:', payload);
  //   const response = await apiClient.put('/folders/move', payload);
  //   return response.data;
};
