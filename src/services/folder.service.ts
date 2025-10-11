import { API_COLLECTIONS } from '@/config/apiRoutes';
import { apiRequest } from '@/lib/queryClient';

export interface AddFolderInput {
  collectionId: string;
  name: string;
  order?: number;
}

export interface Folder {
  id: string;
  collectionId: string;
  name: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export const addFolder = async ({
  collectionId,
  name,
  order = 0,
}: AddFolderInput): Promise<Folder> => {
  try {
    const response = await apiRequest(
      'POST',
      `${API_COLLECTIONS}/${collectionId}/folders`,
      {
        body: JSON.stringify({ name, order }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to add folder');
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding folder:', error);
    throw error;
  }
};
