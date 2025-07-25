import { ExtendedRequest } from '@/models/collection.model';
import { API_REQUEST } from '@/config/apiRoutes';
import { apiRequest } from '@/lib/queryClient';
import { RequestDetailResponse } from '@/shared/types/requestChain.model';

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
}

export const requestService = new RequestService();
