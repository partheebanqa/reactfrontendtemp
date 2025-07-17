import {
  API_COLLECTION_IMPORT,
  API_COLLECTION_REQUESTS,
  API_COLLECTIONS,
} from '@/config/apiRoutes';
import { apiRequest } from '@/lib/queryClient';
import {
  Collection,
  CreateCollection,
  ImportCollection,
} from '@/shared/types/collection';
import { CollectionsResponse } from '../models/collection.model';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BEARER_TOKEN = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdJZCI6IjFhZTZjMjY1LWU1MDItNGFlZC1hYWRjLTQ4MzM3ZTYyMDgwNyIsInRlbmFudElkIjoiYzE1ZDQ4OWItOGMxZS00NmZiLWFlYzgtMDlmMDBmZjUyMTNjIiwicm9sZXMiOlsiT3JnIEFkbWluIl0sInN1YiI6IjM1YmI2NzBkLTcyNTYtNDg0MC1iOTI1LTJkYjk1M2ZmYmVlNCIsImV4cCI6MTc1MjgwNDE5MywibmJmIjoxNzUyNzE3NzkzLCJpYXQiOjE3NTI3MTc3OTN9.ubV5gQYgFNzyBl7poOa2bmoxBnfbGKScejm4QrrfLGw`;
const workspaceId = '8d9ea72f-7f74-4821-8909-e953066d9a8b';

export const fetchCollectionList = async (workspaceId: string) => {
  try {
    const response = await apiRequest(
      'GET',
      `${API_COLLECTIONS}?ws=${workspaceId}`
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
      `${API_COLLECTIONS}/${collectionId}/favourite`,
      {
        body: JSON.stringify({ IsImportant }),
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
      `${API_COLLECTIONS}/${collectionId}/requests`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch collection requests');
    }
    const data = await response.json();
    return data?.map((request: any) => formatRequest(request)) || [];
  } catch (error) {
    return []; // Return empty array on error
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
    const response = await apiRequest(
      'PUT',
      `${API_COLLECTIONS}/${id}/rename`,
      {
        body: JSON.stringify({ name: name }),
      }
    );
    if (!response.ok) {
      throw new Error('Failed to rename collection');
    }
    return response.json();
  } catch (error) {
    throw error;
  }
};

export const formatCollection = (collation: any) => {
  return {
    id: collation.Id || collation.id,
    workspaceId: collation.WorkspaceId || collation.workspaceId,
    name: collation.Name || collation.name,
    isImportant: collation.IsImportant || collation.isImportant,
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
    // const formData = new FormData();

    // // Add metadata fields
    // formData.append("name", importCollection.name);
    // formData.append("workspaceId", importCollection.workspaceId);
    // formData.append("inputMethod", importCollection.inputMethod);
    // formData.append("specificationType", importCollection.specificationType);
    // formData.append("url", importCollection.url);
    // formData.append("raw", importCollection.raw);

    const response = await apiRequest('POST', API_COLLECTION_IMPORT, {
      body: JSON.stringify(importCollection),
      // headers: {
      //   "content-type": "multipart/form-data; boundary=X-INSOMNIA-BOUNDARY",
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
      `${API_COLLECTION_REQUESTS}/${requestId}/duplicate`
    );
    if (!response.ok) {
      throw new Error('Failed to duplicate request');
    }
    const data = await response.json();
    return formatRequest(data);
  } catch (error: any) {
    console.error('Error duplicating request:', error);
    throw error;
  }
};

export const renameRequest = async ({
  requestId,
  newName,
}: {
  requestId: string;
  newName?: string;
}) => {
  try {
    const response = await apiRequest(
      'PUT',
      `${API_COLLECTION_REQUESTS}/${requestId}/rename`,
      {
        body: newName ? JSON.stringify({ name: newName }) : undefined,
      }
    );
    if (!response.ok) {
      throw new Error('Failed to duplicate request');
    }
    const data = await response.json();
    return formatRequest(data);
  } catch (error: any) {
    console.error('Error duplicating request:', error);
    throw error;
  }
};

export const formatRequest = (request: any) => {
  return {
    id: request.Id || request.id,
    collectionId: request.CollectionId || request.collectionId,
    name: request.Name || request.name,
    description: request.Description || request.description || '',
    method: request.Method || request.method,
    url: request.Url || request.url,
    order: request.Order || request.order || 0,
    bodyType: request.BodyType || request.bodyType || 'none',
    bodyFormData: request.BodyFormData || request.bodyFormData,
    bodyRawContent: request.BodyRawContent || request.bodyRawContent,
    authorizationType:
      request.AuthorizationType || request.authorizationType || 'none',
    authorization: request.Authorization || request.authorization || {},
    headers: request.Headers || request.headers || [],
    params: request.Params || request.params || [],
    variables: request.Variables || request.variables || {},
    createdBy: request.CreatedBy || request.createdBy,
    createdAt: request.CreatedAt || request.createdAt,
    updatedAt: request.UpdatedAt || request.updatedAt,
  };
};

export const getCollectionsWithRequests =
  async (): Promise<CollectionsResponse> => {
    const response = await fetch(
      `${API_BASE_URL}/collections/with-requests?ws=${workspaceId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${BEARER_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch collections: ${response.statusText}`);
    }

    const data: CollectionsResponse = await response.json();
    console.log('Collections data:', data);
    return data;
  };
