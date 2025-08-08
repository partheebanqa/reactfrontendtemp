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
  console.log('getCollectionRequests is called');
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
  console.log('🟡 Saving chain (request payload):', chain);

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

export const getRequestChains = async (
  workspaceId: string
): Promise<RequestChain[]> => {
  try {
    const response = await apiRequest(
      'GET',
      `${API_REQUEST_CHAIN}?ws=${workspaceId}`
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
//     const response = await apiRequest('GET', `/request-chains/${chainId}/data`);

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
