import {
  deletRequestChainById,
  duplicateRequestChainById,
} from '@/services/requestChain.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ExecutionRequestChainPayload } from '../types/requestChain.model';
import { executeRequestChain } from '@/services/executeRequest.service';

export const useDuplicateRequestChain = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chainId: string) => duplicateRequestChainById(chainId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requestChains'] });
    },
  });
};

export const useDeleteRequestChain = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chainId: string) => deletRequestChainById(chainId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requestChains'] });
    },
  });
};

export const useExecuteRequestChain = () => {
  return useMutation({
    mutationFn: (payload: ExecutionRequestChainPayload) =>
      executeRequestChain(payload),
  });
};
