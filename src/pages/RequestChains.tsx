'use client';

import { useQuery } from '@tanstack/react-query';
import { RequestChainsList } from '@/components/RequestChains/RequestChainsList';
import type { RequestChain } from '@/shared/types/requestChain.model';
import { getRequestChains } from '@/services/requestChain.service';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useLocation } from 'wouter';
import { toast } from '@/hooks/use-toast';
import {
  useDeleteRequestChain,
  useDuplicateRequestChain,
  useExecuteRequestChain,
} from '@/shared/hooks/requestChain';

const RequestChains = () => {
  const [, setLocation] = useLocation();
  const { currentWorkspace } = useWorkspace();

  const { mutateAsync: cloneChain } = useDuplicateRequestChain();
  const { mutateAsync: deleteChain } = useDeleteRequestChain();
  const { mutateAsync: playChain } = useExecuteRequestChain();

  const {
    data: chains = [],
    isLoading: loading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['requestChains', currentWorkspace?.id || ''],
    queryFn: () => getRequestChains(currentWorkspace?.id || ''),
    enabled: !!currentWorkspace?.id,
  });

  const handleCreateChain = () => {
    setLocation('/request-chains/create');
  };

  const handleEditChain = (chain: RequestChain) => {
    setLocation(`/request-chains/${chain.id}/edit`);
  };

  const handleDeleteChain = async (chainId: string) => {
    try {
      await deleteChain(chainId);
      toast({
        title: 'Chain Deleted',
        description: 'The request chain has been deleted successfully.',
        variant: 'default',
      });
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error?.message || 'Failed to delete request chain.',
        variant: 'destructive',
      });
    }
  };

  const handleCloneChain = async (chainId: string) => {
    try {
      await cloneChain(chainId);
      toast({
        title: 'Chain Cloned',
        description: 'The request chain has been successfully duplicated.',
        variant: 'default',
      });
    } catch (error: any) {
      toast({
        title: 'Clone Failed',
        description: error?.message || 'Failed to duplicate request chain.',
        variant: 'destructive',
      });
    }
  };

  const handlePlayChain = async (chainId: string) => {
    try {
      const payload = {
        requestChainId: chainId,
      };

      await playChain(payload);

      toast({
        title: 'Execution Started',
        description: `Request chain ${chainId} started successfully.`,
      });
    } catch (error: any) {
      toast({
        title: 'Execution Failed',
        description: error?.message || 'Could not execute the request chain.',
        variant: 'destructive',
      });
    }
  };

  return (
    <RequestChainsList
      chains={chains}
      loading={loading}
      onCreateChain={handleCreateChain}
      onEditChain={handleEditChain}
      onDeleteChain={handleDeleteChain}
      onCloneChain={handleCloneChain}
      onToggleChain={handlePlayChain}
      onRefresh={() => refetch()}
      refreshing={isFetching}
    />
  );
};

export default RequestChains;
