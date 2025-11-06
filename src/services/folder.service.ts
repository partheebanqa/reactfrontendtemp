import { API_COLLECTIONS } from '@/config/apiRoutes';
import { apiRequest } from '@/lib/queryClient';

export interface AddFolderInput {
  collectionId: string;
  name: string;
  parentId?: string;
}

export interface Folder {
  id: string;
  collectionId: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  parentId?: string;
}

export const addFolder = async ({
  collectionId,
  name,
  parentId,
}: AddFolderInput): Promise<Folder> => {
  try {
    const response = await apiRequest(
      'POST',
      `${API_COLLECTIONS}/${collectionId}/folders`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, parentId }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to add folder: ${response.statusText}`);
    }

    const data: Folder = await response.json();
    return data;
  } catch (error: unknown) {
    console.error('Error adding folder:', error);
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to add folder');
    }
    throw new Error('Failed to add folder');
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
        headers: {
          'Content-Type': 'application/json',
        },
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
