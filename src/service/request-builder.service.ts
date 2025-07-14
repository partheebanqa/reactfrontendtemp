import {
  API_COLLECTION_IMPORT,
  API_COLLECTION_REQUESTS,
  API_COLLECTIONS,
} from "@/config/apiRoutes";
import { apiRequest } from "@/lib/queryClient";
import { CreateCollection, ImportCollection } from "@/shared/types/collection";

export const fetchCollectionList = async (workspaceId: string) => {
  try {
    const response = await apiRequest(
      "GET",
      `${API_COLLECTIONS}?ws=${workspaceId}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch collection data");
    }
    const data = await response.json();
    const collections = data?.collections?.map((collection: any) =>
      formatCollection(collection)
    );
    return { collections };
  } catch (error) {
    console.error("Error fetching collection list:", error);
    return { collections: [] }; // Return empty collections on error
  }
};

export const addCollection = async (collection: CreateCollection) => {
  try {
    const response = await apiRequest("POST", API_COLLECTIONS, {
      body: JSON.stringify(collection),
    });
    if (!response.ok) {
      throw new Error("Failed to add collection data");
    }
    return response.json();
  } catch (error) {
    console.error("Error adding collection:", error);
    throw error;
  }
};

export const getCollectionRequests = async (collectionId: string) => {
  try {
    const response = await apiRequest(
      "GET",
      `${API_COLLECTIONS}/${collectionId}/requests`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch collection requests");
    }
    const data = await response.json();
    console.log("🚀 ~ getCollectionRequests ~ data:", data);
    return data?.map((request: any) => formatRequest(request)) || [];
  } catch (error) {
    console.error("Error fetching collection requests:", error);
    return []; // Return empty array on error
  }
};

export const renameRequest = async (name: string, requestId: string) => {
  try {
    const response = await apiRequest(
      "PUT",
      `${API_COLLECTION_REQUESTS}/${requestId}/rename`,
      {
        body: JSON.stringify({
          name: name,
        }),
      }
    );
    if (!response.ok) {
      throw new Error("Failed to rename request");
    }
    const data = await response.json();
    return formatRequest(data);
  } catch (error: any) {
    throw error;
  }
};

export const deleteRequest = async (requestId: string) => {
  try {
    const response = await apiRequest(
      "DELETE",
      `${API_COLLECTION_REQUESTS}/${requestId}`
    );
    if (!response.ok) {
      throw new Error("Failed to delete request");
    }
    return { success: true, requestId };
  } catch (error: any) {
    console.error("Error deleting request:", error);
    throw error;
  }
};

export const duplicateRequest = async (requestId: string, newName?: string) => {
  try {
    const response = await apiRequest(
      "POST",
      `${API_COLLECTION_REQUESTS}/${requestId}/duplicate`,
      {
        body: newName ? JSON.stringify({ name: newName }) : undefined,
      }
    );
    if (!response.ok) {
      throw new Error("Failed to duplicate request");
    }
    const data = await response.json();
    return formatRequest(data);
  } catch (error: any) {
    console.error("Error duplicating request:", error);
    throw error;
  }
};

export const formatCollection = (request: any) => {
  return {
    id: request.Id,
    name: request.Name,
    description: request.Description || "",
    method: request.Method,
    url: request.URL,
    headers: request.Headers || [],
    body: request.Body || null,
    createdAt: request.CreatedAt,
    updatedAt: request.UpdatedAt,
  };
};

export const formatRequest = (request: any) => {
  return {
    id: request.Id || request.id,
    collectionId: request.CollectionId || request.collectionId,
    name: request.Name || request.name,
    description: request.Description || request.description || "",
    method: request.Method || request.method,
    url: request.Url || request.url,
    order: request.Order || request.order || 0,
    bodyType: request.BodyType || request.bodyType || "none",
    bodyFormData: request.BodyFormData || request.bodyFormData,
    bodyRawContent: request.BodyRawContent || request.bodyRawContent,
    authorizationType:
      request.AuthorizationType || request.authorizationType || "none",
    authorization: request.Authorization || request.authorization || {},
    headers: request.Headers || request.headers || [],
    params: request.Params || request.params || [],
    variables: request.Variables || request.variables || {},
    createdBy: request.CreatedBy || request.createdBy,
    createdAt: request.CreatedAt || request.createdAt,
    updatedAt: request.UpdatedAt || request.updatedAt,
  };
};

export const importCollectionFile = async (
  importCollection: ImportCollection
) => {
  try {
    const formData = new FormData();

    // Add metadata fields
    formData.append("name", importCollection.name);
    formData.append("workspaceId", importCollection.workspaceId);
    formData.append("inputMethod", importCollection.inputMethod);
    formData.append("specificationType", importCollection.specificationType);
    formData.append("url", importCollection.url);
    formData.append("raw", importCollection.raw);
    formData.append("file", importCollection.file);

    const userDetails = localStorage.getItem("userDetails");
    let token = "";
    if (userDetails) {
      const details = JSON.parse(userDetails);
      token = details.token;
    }

    const response = await apiRequest("POST", API_COLLECTION_IMPORT, {
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response;
  } catch (error: any) {
    throw error;
  }
};
