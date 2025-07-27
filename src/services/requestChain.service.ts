import { ExtendedRequest } from '@/models/collection.model';
import { API_REQUEST, API_REQUEST_CHAIN } from '@/config/apiRoutes';
import { apiRequest } from '@/lib/queryClient';
import {
  RequestChain,
  RequestDetailResponse,
} from '@/shared/types/requestChain.model';

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

class RequestService {
  async getRequestDetails(requestId: string): Promise<RequestDetailResponse> {
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

  async getMultipleRequestDetails(
    requestIds: string[]
  ): Promise<RequestDetailResponse[]> {
    try {
      const requests = requestIds.map((id) => this.getRequestDetails(id));
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

  async getCollectionRequests(
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

  async saveRequestChain(chain: RequestChain): Promise<RequestChain> {
    console.log('saving chain', chain);

    const response = await apiRequest('POST', API_REQUEST_CHAIN, {
      body: JSON.stringify(chain),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json(); // This ensures a value is returned!
  }

  async getRequestChains(workspaceId: string): Promise<RequestChain[]> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Return mock data - replace with actual API call later
    return mockChains.filter((chain) => chain.workspaceId === workspaceId);
  }
}

export const requestService = new RequestService();
