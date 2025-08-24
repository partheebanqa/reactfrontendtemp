import type { ExtendedRequest } from '@/models/collection.model';
import { API_REQUEST, API_REQUEST_CHAIN } from '@/config/apiRoutes';
import { apiRequest } from '@/lib/queryClient';
import type {
  RequestChain,
  RequestDetailResponse,
} from '@/shared/types/requestChain.model';

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

  return savedChain;
}

export async function updateRequestChain(
  chain: RequestChain,
  id: string
): Promise<RequestChain> {
  const response = await apiRequest('PUT', `${API_REQUEST_CHAIN}/${id}`, {
    body: JSON.stringify(chain),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const updatedChain: RequestChain = await response.json();

  return updatedChain;
}

export const getRequestChains = async (
  workspaceId: string
): Promise<RequestChain[]> => {
  try {
    const response = await apiRequest(
      'GET',
      `${API_REQUEST_CHAIN}?ws=${workspaceId}`
    );

    const data = await response.json();
    console.log('Data:', data);

    // Map the API response to the RequestChain interface
    const mappedChains: RequestChain[] = data.requestChains.map(
      (chain: any) => ({
        id: chain.id,
        workspaceId: chain.workspaceId,
        name: chain.name,
        chainRequests: [],
        description: '',
        variables: [],
        schedule: {
          enabled: false,
          type: 'once',
          startDate: '',
          timezone: '',
        },
        environmentName: chain.environment.name || 'No Environment',
        enabled: true,
        createdAt: chain.createdAt,
        updatedAt: chain.updatedAt,
        lastExecuted: null,
        executionCount: 0,
        successRate: 0,
        isImportant: chain.isImportant || false,
      })
    );

    return mappedChains;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch request chains');
  }
};

export const getRequestChainVariables = async (
  requestChainId: string,
  page = 1,
  pageSize = 10
): Promise<{
  page: number;
  pageSize: number;
  count: number;
  items: Array<{
    id: string;
    executionId: string;
    chainRequestId: string;
    requestChainId: string;
    extractedVariables: string; // JSON string containing the variables array
  }>;
}> => {
  try {
    const response = await apiRequest(
      'GET',
      `${API_REQUEST_CHAIN}/${requestChainId}/variables?page=${page}&pageSize=${pageSize}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch request chain variables');
  }
};

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

export const getRequestChainById = async (
  chainId: string
): Promise<RequestChain> => {
  const response = await apiRequest('GET', `${API_REQUEST_CHAIN}/${chainId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch request chain with ID: ${chainId}`);
  }

  const data = await response.json();

  // Transform the API response to match our RequestChain type
  // The API returns chainRequests, but our components expect both chainRequests and requests
  const transformedChain: RequestChain = {
    ...data,
    requests: data.chainRequests || [], // Map chainRequests to requests for backward compatibility
    chainRequests: data.chainRequests || [], // Keep chainRequests as primary
    variables: data.variables || [],
    environment: data.environmentId || 'dev',
  };

  return transformedChain;
};

export const duplicateRequestChainById = async (
  chainId: string
): Promise<void> => {
  try {
    const response = await apiRequest(
      'POST',
      `${API_REQUEST_CHAIN}/${chainId}/duplicate`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch request chain with ID: ${chainId}`);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to delete test suite');
  }
};

export const deletRequestChainById = async (chainId: string): Promise<void> => {
  try {
    const response = await apiRequest(
      'DELETE',
      `${API_REQUEST_CHAIN}/${chainId}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch request chain with ID: ${chainId}`);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to delete test suite');
  }
};
