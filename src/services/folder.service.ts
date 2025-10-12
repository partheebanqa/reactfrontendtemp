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
  order,
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

export const renameFolder = async ({
  folderId,
  name,
}: {
  folderId: string;
  name: string;
}) => {
  try {
    const response = await apiRequest(
      'PUT',
      `${API_COLLECTIONS}/folders/${folderId}`,
      {
        body: JSON.stringify({ name }),
      }
    );
    if (!response.ok) throw new Error('Failed to rename folder');
    return await response.json();
  } catch (error) {
    console.error('Error renaming folder:', error);
    throw error;
  }
};

export const deleteFolder = async (folderId: string) => {
  try {
    const response = await apiRequest(
      'DELETE',
      `${API_COLLECTIONS}/folders/${folderId}`
    );
    if (!response.ok) throw new Error('Failed to delete folder');
    return { success: true, folderId };
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
};
