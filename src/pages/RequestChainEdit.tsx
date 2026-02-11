'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RequestChainEditor } from '@/components/RequestChains/RequestChainEditor';
import type { RequestChain } from '@/shared/types/requestChain.model';
import {
  getRequestChainById,
  saveRequestChain,
} from '@/services/requestChain.service';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useLocation, useParams } from 'wouter';
import { Loader2 } from 'lucide-react';
import { Loader } from '@/components/Loader';

const RequestChainEdit = () => {
  const [, setLocation] = useLocation();
  const params = useParams();
  const chainId = params.id;
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  // Query for individual request chain
  const {
    data: editingChain,
    isLoading: isLoadingChain,
    error: chainError,
  } = useQuery({
    queryKey: ['requestChain', chainId],
    queryFn: () => getRequestChainById(chainId!, currentWorkspace!.id),
    enabled: !!chainId && !!currentWorkspace?.id,
    staleTime: 0, // Always fetch fresh data when editing
  });

  const { mutate: saveChain } = useMutation({
    mutationFn: (chain: RequestChain) => saveRequestChain(chain),
    onSuccess: (savedChain) => {
      // Update the chains list cache
      queryClient.invalidateQueries({
        queryKey: ['requestChains', currentWorkspace?.id || ''],
      });

      // Update the individual chain cache
      if (savedChain.id) {
        queryClient.setQueryData(['requestChain', savedChain.id], savedChain);
      }

      // Navigate back to list
      setLocation('/request-chains');
    },
    onError: (error) => {
      console.error('Failed to save chain:', error);
    },
  });

  const handleSaveChain = async (
    chain: RequestChain,
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

  // Show loading state while fetching chain details
  if (!currentWorkspace || isLoadingChain) {
    return (
      <>
        <Loader message='Loading Request Chains' />
      </>
    );
  }

  // Show error state if failed to load chain
  if (chainError) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <div className='flex flex-col items-center space-y-4 text-center'>
          <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center'>
            <span className='text-red-600 text-2xl'>⚠️</span>
          </div>
          <div>
            <h2 className='text-xl font-semibold text-foreground mb-2'>
              Failed to Load Request Chain
            </h2>
            <p className='text-muted-foreground mb-4'>
              {chainError instanceof Error
                ? chainError.message
                : 'Unknown error occurred'}
            </p>
            <button
              onClick={handleBackToList}
              className='px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors'
            >
              Back to List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <RequestChainEditor
      chain={editingChain}
      onBack={handleBackToList}
      onSave={handleSaveChain}
    />
  );
};

export default RequestChainEdit;
