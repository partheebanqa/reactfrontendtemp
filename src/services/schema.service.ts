import {
  API_GET_REQUEST_SCHEMA,
  API_UPLOAD_REQUEST_SCHEMA,
  API_REQUEST,
} from '@/config/apiRoutes';
import { apiRequest } from '@/lib/queryClient';

export const uploadSchema = async (varData: {
  requestId: string;
  schema: any;
}): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('file', varData.schema);
    formData.append('id', varData.requestId);

    const response = await apiRequest(
      'POST',
      API_UPLOAD_REQUEST_SCHEMA.replace('{id}', varData.requestId),
      {
        body: formData,
        headers: {
          'content-type': 'multipart/form-data; boundary=X-INSOMNIA-BOUNDARY',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload schema');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error uploading schema:', error);
    throw error;
  }
};

export const fetchSchema = async (id: string): Promise<any> => {
  try {
    const response = await apiRequest(
      'GET',
      API_GET_REQUEST_SCHEMA.replace('{id}', id)
    );

    if (!response.ok) {
      throw new Error('Failed to fetch schema');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching schema:', error);
    throw error;
  }
};

export const setPrimarySchema = async (varData: {
  requestId: string;
  schemaId: string;
}): Promise<any> => {
  try {
    const response = await apiRequest(
      'POST',
      `${API_REQUEST}/${varData.requestId}/schema/${varData.schemaId}/primary`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to set primary schema: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: unknown) {
    console.error('Error setting primary schema:', error);
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to set primary schema');
    }
    throw new Error('Failed to set primary schema');
  }
};

export const deleteSchema = async (varData: {
  requestId: string;
  schemaId: string;
}): Promise<any> => {
  try {
    const response = await apiRequest(
      'DELETE',
      `${API_REQUEST}/${varData.requestId}/schema/${varData.schemaId}`
    );

    if (!response.ok) {
      throw new Error('Failed to delete schema');
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting schema:', error);
    throw error;
  }
};
