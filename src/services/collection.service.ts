import { CollectionsResponse } from '../models/collection.model';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BEARER_TOKEN = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdJZCI6IjFhZTZjMjY1LWU1MDItNGFlZC1hYWRjLTQ4MzM3ZTYyMDgwNyIsInRlbmFudElkIjoiYzE1ZDQ4OWItOGMxZS00NmZiLWFlYzgtMDlmMDBmZjUyMTNjIiwicm9sZXMiOlsiT3JnIEFkbWluIl0sInN1YiI6IjM1YmI2NzBkLTcyNTYtNDg0MC1iOTI1LTJkYjk1M2ZmYmVlNCIsImV4cCI6MTc1MjM2ODk1MSwibmJmIjoxNzUyMjgyNTUxLCJpYXQiOjE3NTIyODI1NTF9.p7xVWGaHMWEVvs4jI7bHrFlJNbLMetnWji2B9qt-S4I`;
const workspaceId = '8d9ea72f-7f74-4821-8909-e953066d9a8b';

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
