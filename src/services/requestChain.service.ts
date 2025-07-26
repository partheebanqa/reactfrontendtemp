import { API_REQUEST_CHAIN } from '@/config/apiRoutes';
import { apiRequest } from '@/lib/queryClient';
import { RequestChain } from '@/shared/types/requestChain.model';

export const saveRequestChain = async (
  chain: RequestChain
): Promise<RequestChain> => {
  try {
    const response = await apiRequest('POST', API_REQUEST_CHAIN, {
      body: JSON.stringify(chain),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to save request chain:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Unknown error while saving chain'
    );
  }
};

export const getRequestChainById = async (
  id: string
): Promise<RequestChain> => {
  try {
    const response = await apiRequest('GET', `${API_REQUEST_CHAIN}/${id}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch chain ${id}:`, error);
    throw error;
  }
};

export const getAllChains = async (): Promise<RequestChain[]> => {
  try {
    const response = await apiRequest('GET', API_REQUEST_CHAIN);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch all chains:', error);
    throw error;
  }
};

export const getMultipleRequestDetails = async (
  ids: string[]
): Promise<RequestChain[]> => {
  try {
    const response = await apiRequest('POST', `${API_REQUEST_CHAIN}/batch`, {
      body: JSON.stringify({ ids }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch multiple request details:', error);
    throw error;
  }
};
