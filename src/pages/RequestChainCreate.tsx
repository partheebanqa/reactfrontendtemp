'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RequestChainEditor } from '@/components/RequestChains/RequestChainEditor';
import type { RequestChain } from '@/shared/types/requestChain.model';
import { saveRequestChain } from '@/services/requestChain.service';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useLocation } from 'wouter';

const RequestChainCreate = () => {
  const [, setLocation] = useLocation();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const { mutate: saveChain } = useMutation({
    mutationFn: (chain: RequestChain) => saveRequestChain(chain),
    onSuccess: (savedChain) => {
      // Update the chains list cache
      queryClient.invalidateQueries({
        queryKey: ['requestChains', currentWorkspace?.id || ''],
      });

      // Navigate back to list
      setLocation('/request-chains');
    },
    onError: (error) => {
      console.error('Failed to save chain:', error);
    },
  });

  const handleSaveChain = async (
    chain: RequestChain
  ): Promise<RequestChain | null> => {
    return new Promise((resolve) => {
      saveChain(chain, {
        onSuccess: (saved) => {
          resolve(saved);
        },
        onError: (err) => {
          console.error(err);
          resolve(null);
        },
      });
    });
  };

  const handleBackToList = () => {
    setLocation('/request-chains');
  };

  return (
    <RequestChainEditor
      chain={undefined} // No existing chain for create
      onBack={handleBackToList}
      onSave={handleSaveChain}
    />
  );
};

export default RequestChainCreate;
