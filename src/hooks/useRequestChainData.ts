import { useQuery } from '@tanstack/react-query';
import { getRequestChainData } from '@/services/requestChain.service';
import { ExecutionResponse } from '@/shared/types/requestChain.model';

export const useRequestChainData = (chainId: string) => {
  return useQuery<ExecutionResponse>({
    queryKey: ['request-chain-data', chainId],
    queryFn: () => getRequestChainData(chainId),
    enabled: !!chainId, // Only fetch when chainId exists
    staleTime: 1000 * 60 * 5, // optional: cache for 5 mins
    refetchOnWindowFocus: false, // optional: avoid refetch on focus
  });
};
