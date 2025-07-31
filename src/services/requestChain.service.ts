import { ExtendedRequest } from '@/models/collection.model';
import { API_REQUEST, API_REQUEST_CHAIN } from '@/config/apiRoutes';
import { apiRequest } from '@/lib/queryClient';
import {
  ExecutionItem,
  ExecutionResponse,
  RequestChain,
  RequestDetailResponse,
} from '@/shared/types/requestChain.model';
import axios from 'axios';

const mockChains: RequestChain[] = [
  {
    id: '1',
    workspaceId: 'workspace-1',
    name: 'User Authentication Flow',
    description:
      'Complete user registration and login API workflow with email verification',
    requests: [
      {
        id: 'req-1',
        name: 'Register User',
        method: 'POST',
        url: 'https://api.example.com/auth/register',
        headers: [],
        params: [],
        bodyType: 'json',
        body: '{"email": "user@example.com", "password": "password123"}',
        timeout: 5000,
        retries: 2,
        errorHandling: 'stop',
        dataExtractions: [],
        testScripts: [],
        enabled: true,
        authType: 'none',
      },
      {
        id: 'req-2',
        name: 'Login User',
        method: 'POST',
        url: 'https://api.example.com/auth/login',
        headers: [],
        params: [],
        bodyType: 'json',
        body: '{"email": "user@example.com", "password": "password123"}',
        timeout: 5000,
        retries: 1,
        errorHandling: 'stop',
        dataExtractions: [],
        testScripts: [],
        enabled: true,
        authType: 'none',
      },
    ],
    variables: [],
    schedule: {
      enabled: true,
      type: 'interval',
      startDate: '2024-01-15',
      timezone: 'UTC',
      interval: 3600,
    },
    enabled: true,
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
    lastExecuted: '2024-01-20T09:15:00Z',
    executionCount: 45,
    successRate: 95,
  },
  {
    id: '2',
    workspaceId: 'workspace-1',
    name: 'E-commerce Product Sync',
    description:
      'Synchronize product data between inventory and catalog systems',
    requests: [
      {
        id: 'req-3',
        name: 'Get Inventory',
        method: 'GET',
        url: 'https://api.example.com/inventory',
        headers: [],
        params: [],
        bodyType: 'none',
        timeout: 10000,
        retries: 3,
        errorHandling: 'continue',
        dataExtractions: [],
        testScripts: [],
        enabled: true,
        authType: 'bearer',
        authConfig: { token: 'bearer-token' },
      },
      {
        id: 'req-4',
        name: 'Update Catalog',
        method: 'PUT',
        url: 'https://api.example.com/catalog/products',
        headers: [],
        params: [],
        bodyType: 'json',
        timeout: 15000,
        retries: 2,
        errorHandling: 'stop',
        dataExtractions: [],
        testScripts: [],
        enabled: true,
        authType: 'bearer',
        authConfig: { token: 'bearer-token' },
      },
      {
        id: 'req-5',
        name: 'Send Notification',
        method: 'POST',
        url: 'https://api.example.com/notifications',
        headers: [],
        params: [],
        bodyType: 'json',
        timeout: 5000,
        retries: 1,
        errorHandling: 'continue',
        dataExtractions: [],
        testScripts: [],
        enabled: true,
        authType: 'apikey',
      },
    ],
    variables: [],
    schedule: {
      enabled: false,
      type: 'once',
      startDate: '2024-01-01',
      timezone: 'UTC',
    },
    enabled: true,
    createdAt: '2024-01-05T08:00:00Z',
    updatedAt: '2024-01-18T16:45:00Z',
    lastExecuted: '2024-01-19T12:30:00Z',
    executionCount: 28,
    successRate: 87,
  },
  {
    id: '3',
    workspaceId: 'workspace-1',
    name: 'Daily Health Check',
    description: 'Monitor API endpoints and system health across all services',
    requests: [
      {
        id: 'req-6',
        name: 'Check Database',
        method: 'GET',
        url: 'https://api.example.com/health/database',
        headers: [],
        params: [],
        bodyType: 'none',
        timeout: 3000,
        retries: 1,
        errorHandling: 'continue',
        dataExtractions: [],
        testScripts: [],
        enabled: true,
        authType: 'none',
      },
      {
        id: 'req-7',
        name: 'Check Cache',
        method: 'GET',
        url: 'https://api.example.com/health/cache',
        headers: [],
        params: [],
        bodyType: 'none',
        timeout: 3000,
        retries: 1,
        errorHandling: 'continue',
        dataExtractions: [],
        testScripts: [],
        enabled: true,
        authType: 'none',
      },
    ],
    variables: [],
    schedule: {
      enabled: true,
      type: 'cron',
      startDate: '2024-01-01',
      timezone: 'UTC',
      cron: '0 */6 * * *',
    },
    enabled: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
    lastExecuted: '2024-01-20T06:00:00Z',
    executionCount: 120,
    successRate: 98,
  },
];

export async function getRequestDetails(
  requestId: string
): Promise<RequestDetailResponse> {
  try {
    const response = await apiRequest('GET', `${API_REQUEST}/${requestId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch request details for ${requestId}:`, error);
    throw new Error(
      `Failed to fetch request details: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

export async function getMultipleRequestDetails(
  requestIds: string[]
): Promise<RequestDetailResponse[]> {
  try {
    const requests = requestIds.map((id) => getRequestDetails(id));
    const results = await Promise.allSettled(requests);

    return results
      .filter(
        (result): result is PromiseFulfilledResult<RequestDetailResponse> =>
          result.status === 'fulfilled'
      )
      .map((result) => result.value);
  } catch (error) {
    console.error('Failed to fetch multiple request details:', error);
    throw error;
  }
}

export async function getCollectionRequests(
  collectionId?: string
): Promise<ExtendedRequest[]> {
  try {
    const url = collectionId
      ? `${API_REQUEST}/collections/${collectionId}/requests`
      : `${API_REQUEST}/requests`;

    const response = await apiRequest('GET', url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch collection requests:', error);
    throw error;
  }
}

export async function saveRequestChain(
  chain: RequestChain
): Promise<RequestChain> {
  // console.log('🟡 Saving chain (request payload):', chain);

  const response = await apiRequest('POST', API_REQUEST_CHAIN, {
    body: JSON.stringify(chain),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const savedChain: RequestChain = await response.json();
  console.log('✅ Response from backend:', savedChain);

  return savedChain;
}

// export async function getRequestChains(
//   workspaceId: string
// ): Promise<RequestChain[]> {
//   await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay

//   // Return mock data for now
//   return mockChains.filter((chain) => chain.workspaceId === workspaceId);
// }

export const getRequestChains = async (
  workspaceId: string
): Promise<RequestChain[]> => {
  try {
    const response = await apiRequest(
      'GET',
      `${API_REQUEST_CHAIN}?ws=8d9ea72f-7f74-4821-8909-e953066d9a8b`
    );

    const data = await response.json();

    // Map the API response to the RequestChain interface
    const mappedChains: RequestChain[] = data.requestChains.map(
      (chain: any) => ({
        id: chain.id,
        workspaceId: chain.workspaceId,
        name: chain.name,
        // Provide default or null values for properties not present in the API response
        requests: [], // Assuming empty if not provided
        description: '', // Assuming empty if not provided
        variables: [], // Assuming empty if not provided
        schedule: {
          enabled: false,
          type: 'once',
          startDate: '',
          timezone: '',
        }, // Default schedule
        enabled: true, // Default to enabled, or infer from another field if available
        createdAt: chain.createdAt,
        updatedAt: chain.updatedAt,
        lastExecuted: null, // Assuming null if not provided
        executionCount: 0, // Assuming 0 if not provided
        successRate: 0, // Assuming 0 if not provided
        // Add other properties as needed, providing defaults if they are missing
        isImportant: chain.isImportant || false, // Map isImportant if needed
      })
    );

    return mappedChains;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch request chains');
  }
};

// 8d9ea72f-7f74-4821-8909-e953066d9a8b




// export const getRequestChainData = async (
//   chainId: string
// ): Promise<ExecutionResponse> => {
//   try {
//     const response = await apiRequest(
//       'GET',
//       `/request-chains/${chainId}/data`
//     );

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const rawData: ExecutionResponse = await response.json();

//     // Parse nested JSON fields
//     const items: ExecutionItem[] = rawData.items.map((item) => ({
//       ...item,
//       data: safeJsonParse(item.data),
//       extractedVariables: safeJsonParse(item.extractedVariables) || [],
//     }));

//     return {
//       ...rawData,
//       items,
//     };
//   } catch (error: any) {
//     throw new Error(error.message || 'Failed to fetch execution data');
//   }
// };

// const safeJsonParse = (input: any) => {
//   try {
//     return typeof input === 'string' ? JSON.parse(input) : input;
//   } catch {
//     return null;
//   }
// };


export const getRequestChainData = async (chainId: string) => {
  try {
    const response = await apiRequest(
      'GET',
      `${API_REQUEST_CHAIN}/${chainId}/data`
    );
    const data = await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch test suite');
  }
};



