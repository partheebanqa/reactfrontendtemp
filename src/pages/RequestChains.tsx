'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RequestChainsList } from '@/components/RequestChains/RequestChainsList';
import { RequestChainEditor } from '@/components/RequestChains/RequestChainEditor';
import type {
  ExecutionRequestChainPayload,
  RequestChain,
} from '@/shared/types/requestChain.model';
import {
  getRequestChains,
  getRequestChainById,
  saveRequestChain,
} from '@/services/requestChain.service';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  useDeleteRequestChain,
  useDuplicateRequestChain,
  useExecuteRequestChain,
} from '@/shared/hooks/requestChain';

const Index = () => {
  const [currentView, setCurrentView] = useState<'list' | 'editor'>('list');
  const [editingChainId, setEditingChainId] = useState<string | undefined>();

  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const { mutateAsync: cloneChain, isPending } = useDuplicateRequestChain();
  const { mutateAsync: deleteChain } = useDeleteRequestChain();
  const { mutateAsync: playChain } = useExecuteRequestChain();

  // Query for all request chains (existing)
  const {
    data: chains = [],
    isLoading: loading,
    isFetching, // optional: for button spinner
    refetch, // 👈 we’ll pass this down
  } = useQuery({
    queryKey: ['requestChains', currentWorkspace?.id || ''],
    queryFn: () => getRequestChains(currentWorkspace?.id || ''),
    enabled: !!currentWorkspace?.id,
  });

  // NEW: Query for individual request chain when editing
  const {
    data: editingChain,
    isLoading: isLoadingChain,
    error: chainError,
  } = useQuery({
    queryKey: ['requestChain', editingChainId],
    queryFn: () => getRequestChainById(editingChainId!),
    enabled: !!editingChainId && currentView === 'editor',
    staleTime: 0, // Always fetch fresh data when editing
  });

  const {
    mutate: saveChain,
    isPending: isSavingChain,
    error: saveError,
  } = useMutation({
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
    },
    onError: (error) => {
      console.error('Failed to save chain:', error);
    },
  });

  const handleCreateChain = () => {
    setEditingChainId(undefined);
    setCurrentView('editor');
  };

  // UPDATED: Now sets the chain ID instead of the full chain object
  const handleEditChain = (chain: RequestChain) => {
    setEditingChainId(chain.id);
    setCurrentView('editor');
  };

  const handleSaveChain = async (
    chain: RequestChain
  ): Promise<RequestChain | null> => {
    console.log('RequestChainEditor:', chain);
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
        title: 'Clone Failed',
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
      const payload: ExecutionRequestChainPayload = {
        requestChainId: chainId,
      };

      const result = await playChain(payload);

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

  const handleBackToList = () => {
    setCurrentView('list');
    setEditingChainId(undefined);
    queryClient.refetchQueries({
      queryKey: ['requestChains', currentWorkspace?.id || ''],
    });
  };

  if (currentView === 'editor') {
    // NEW: Show loading state while fetching chain details
    if (editingChainId && isLoadingChain) {
      return (
        <div className='min-h-screen bg-background flex items-center justify-center'>
          <div className='flex flex-col items-center space-y-4'>
            <Loader2 className='w-8 h-8 animate-spin text-primary' />
            <p className='text-muted-foreground'>Loading request chain...</p>
          </div>
        </div>
      );
    }

    // NEW: Show error state if failed to load chain
    if (editingChainId && chainError) {
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
      <>
        <RequestChainEditor
          chain={editingChain}
          onBack={handleBackToList}
          onSave={handleSaveChain}
          onToggleChain={handlePlayChain}
        />
      </>
    );
  }

  return (
    <RequestChainsList
      chains={chains}
      loading={loading}
      onCreateChain={handleCreateChain}
      onEditChain={handleEditChain}
      onDeleteChain={handleDeleteChain}
      onCloneChain={handleCloneChain}
      onToggleChain={handlePlayChain}
      onRefresh={() => refetch()} // 👈 send refresh from here
      refreshing={isFetching}
    />
  );
};

export default Index;
