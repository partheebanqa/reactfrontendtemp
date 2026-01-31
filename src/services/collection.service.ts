import {
  API_COLLECTION_IMPORT,
  API_COLLECTION_REQUESTS,
  API_COLLECTIONS,
} from '@/config/apiRoutes';
import { apiRequest } from '@/lib/queryClient';
import type {
  CreateCollection,
  ImportCollection,
} from '@/shared/types/collection';
import type { CollectionsResponse } from '../models/collection.model';

export const fetchCollectionList = async (workspaceId: string) => {
  try {
    const response = await apiRequest(
      'GET',
      `${API_COLLECTIONS}?ws=${workspaceId}`,
      {
        headers: {
          'X-Workspace-ID': workspaceId,
        },
      }
    );
    if (!response.ok) {
      throw new Error('Failed to fetch collection data');
    }
    const data = await response.json();
    const collections = data?.collections?.map((collection: any) =>
      formatCollection(collection)
    );
    // Return a consistent structure
    return collections;
  } catch (error) {
    console.error('Error fetching collection list:', error);
    return []; // Return empty collections array on error for consistency
  }
};

export const addCollection = async (collection: CreateCollection) => {
  try {
    const response = await apiRequest('POST', API_COLLECTIONS, {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(collection),
    });
    if (!response.ok) {
      throw new Error('Failed to add collection data');
    }
    return response.json();
  } catch (error) {
    console.error('Error adding collection:', error);
    throw error;
  }
};

export const setFavouriteCollection = async ({
  collectionId,
  IsImportant,
}: {
  collectionId: string;
  IsImportant: boolean;
}) => {
  try {
    const response = await apiRequest(
      'PUT',
      `${API_COLLECTIONS}/${collectionId}/mark-important`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    if (!response.ok) {
      throw new Error('Failed to update collection');
    }
    return response.json();
  } catch (error) {
    console.error('Error updating collection:', error);
    throw error;
  }
};

export const unsetFavouriteCollection = async (collectionId: string) => {
  const response = await apiRequest(
    'PUT',
    `${API_COLLECTIONS}/${collectionId}/mark-not-important`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  return response;
};

export const deleteCollection = async (collectionId: string) => {
  try {
    const response = await apiRequest(
      'DELETE',
      `${API_COLLECTIONS}/${collectionId}`
    );
    if (!response.ok) {
      throw new Error('Failed to delete collection');
    }
    return { success: true, collectionId };
  } catch (error) {
    console.error('Error deleting collection:', error);
    throw error;
  }
};

export const getCollectionRequests = async (collectionId: string) => {
  try {
    const response = await apiRequest(
      'GET',
      `${API_COLLECTIONS}/${collectionId}/folder-tree`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch collection requests');
    }
    const data = await response.json();

    const mapFolder = (folder: any): any => ({
      id: folder.Id || folder.id,
      collectionId: folder.CollectionId || folder.collectionId,
      name: folder.Name || folder.name,
      createdAt: folder.CreatedAt || folder.createdAt,
      updatedAt: folder.UpdatedAt || folder.updatedAt,
      requests: (folder.Requests || folder.requests || []).map((r: any) =>
        formatRequest(r)
      ),
      folders: (folder.Folders || folder.folders || []).map(mapFolder),
    });
    const normalized = {
      folders: (data?.Folders || data?.folders || []).map(mapFolder),
      preRequestId: data?.preRequestId,
      requests: (data?.Requests || data?.requests || []).map((r: any) =>
        formatRequest(r)
      ),
    };

    return normalized;
  } catch (error) {
    return { folders: [], requests: [] };
  }
};

export const renameCollection = async ({
  id,
  name,
}: {
  id: string;
  name: string;
}) => {
  try {
    const response = await apiRequest('PUT', `${API_COLLECTIONS}/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: name }),
    });
    if (!response.ok) {
      throw new Error('Failed to rename collection');
    }
    return response.json();
  } catch (error) {
    throw error;
  }
};

export const markRequestAsAuth = async (
  requestId: string,
  collectionId: string
) => {
  const response = await apiRequest(
    'PUT',
    `${API_COLLECTIONS}/${collectionId}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ preRequestId: requestId }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to mark request as auth');
  }

  return await response.json();
};

export const formatCollection = (collation: any) => {
  return {
    id: collation.Id || collation.id,
    workspaceId: collation.WorkspaceId || collation.workspaceId,
    name: collation.Name || collation.name,
    isImportant: collation.IsImportant || collation.isImportant,
    preRequestId: collation.PreRequestId || collation.preRequestId,
    variables: collation.Variables || collation.variables,
    createdAt: collation.CreatedAt || collation.created_at,
    updatedAt: collation.UpdatedAt || collation.updated_at,
    deletedAt: collation.DeletedAt || collation.deleted_at,
    requests: [],
    hasFetchedRequests: false,
  };
};

export const importCollectionFile = async (
  importCollection: ImportCollection
) => {
  try {
    if (importCollection.inputMethod === 'file' && importCollection.file) {
      const formData = new FormData();

      formData.append('name', importCollection.name || '');
      formData.append('workspaceId', importCollection.workspaceId);
      formData.append('inputMethod', importCollection.inputMethod);
      formData.append('specificationType', importCollection.specificationType);
      formData.append('file', importCollection.file);

      if (importCollection.url) formData.append('url', importCollection.url);

      const response = await apiRequest('POST', API_COLLECTION_IMPORT, {
        body: formData,
      });

      return response;
    } else {
      const response = await apiRequest('POST', API_COLLECTION_IMPORT, {
        body: JSON.stringify(importCollection),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response;
    }
  } catch (error: any) {
    throw error;
  }
};

export const useImpotCollectionJsonMutation = async (
  importCollection: ImportCollection
) => {
  try {
    const response = await apiRequest('POST', API_COLLECTION_IMPORT, {
      body: JSON.stringify(importCollection),
      // headers: {
      //   "content-type": "application/json",
      // },
    });

    return response;
  } catch (error: any) {
    throw error;
  }
};

export const addRequest = async (requestData: any) => {
  try {
    const response = await apiRequest('POST', API_COLLECTION_REQUESTS, {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error('Failed to add request');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding request:', error);
    throw error;
  }
};

export const deleteRequest = async (requestId: string) => {
  try {
    const response = await apiRequest(
      'DELETE',
      `${API_COLLECTION_REQUESTS}/${requestId}`
    );
    if (!response.ok) {
      throw new Error('Failed to delete request');
    }
    return { success: true, requestId };
  } catch (error: any) {
    console.error('Error deleting request:', error);
    throw error;
  }
};

export const duplicateRequest = async ({
  requestId,
}: {
  requestId: string;
}) => {
  try {
    const response = await apiRequest(
      'POST',
      `${API_COLLECTION_REQUESTS}/${requestId}/duplicate`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to duplicate request');
    }

    const data = await response.json();
    return formatRequest(data);
  } catch (error: unknown) {
    console.error('Error duplicating request:', error);
    throw error;
  }
};

export const renameRequest = async ({
  requestId,
  newName,
  workspaceId,
  folderId,
  collectionId,
}: {
  requestId: string;
  newName?: string;
  workspaceId: string;
  folderId: string;
  collectionId: string;
}) => {
  try {
    const response = await apiRequest(
      'PUT',
      `${API_COLLECTION_REQUESTS}/${requestId}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        body:
          newName || folderId
            ? JSON.stringify({
                ...(newName ? { name: newName } : {}),
                workspaceId,
                ...(folderId ? { folderId } : {}),
              })
            : undefined,
      }
    );
    if (!response.ok) {
      throw new Error('Failed to rename request');
    }
    const data = await response.json();
    return formatRequest(data);
  } catch (error: any) {
    console.error('Error renaming request:', error);
    throw error;
  }
};

export const updateRequest = async ({
  requestId,
  requestData,
}: {
  requestId: string;
  requestData: any;
}) => {
  try {
    const response = await apiRequest(
      'PUT',
      `${API_COLLECTION_REQUESTS}/${requestId}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      }
    );
    if (!response.ok) {
      throw new Error('Failed to update request');
    }
    const data = await response.json();
    return formatRequest(data);
  } catch (error: any) {
    console.error('Error updating request:', error);
    throw error;
  }
};

export const formatRequest = (request: any) => {
  return {
    id: request.Id || request.id,
    collectionId: request.CollectionId || request.collectionId,
    folderId: request.FolderId || request.folderId || undefined,
    name: request.Name || request.name,
    description: request.Description || request.description || '',
    method: request.Method || request.method,
    url: request.Url || request.url,
    bodyType: request.BodyType || request.bodyType || 'none',
    bodyFormData: request.BodyFormData || request.bodyFormData,
    bodyRawContent: request.BodyRawContent || request.bodyRawContent,
    extractVariables: request.extractVariables,
    authorizationType:
      request.AuthorizationType || request.authorizationType || 'none',
    authorization: request.Authorization || request.authorization || {},
    headers: request.Headers || request.headers || [],
    params: request.Params || request.params || [],
    variable: request.Variable || request.variable || [],
    assertions: request.Assertions || request.assertions || [],
    createdBy: request.CreatedBy || request.createdBy,
    createdAt: request.CreatedAt || request.createdAt,
    updatedAt: request.UpdatedAt || request.updatedAt,
  };
};

export const getCollectionsWithRequests = async (
  workspaceId: string
): Promise<CollectionsResponse> => {
  try {
    const response = await apiRequest(
      'GET',
      `${API_COLLECTIONS}/with-requests?ws=${workspaceId}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch collections: ${response.statusText}`);
    }

    const data: CollectionsResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching collections with requests:', error);
    throw error;
  }
};
