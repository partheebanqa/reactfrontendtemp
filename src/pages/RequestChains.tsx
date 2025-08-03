import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RequestChainsList } from '@/components/RequestChains/RequestChainsList';
import { RequestChainEditor } from '@/components/RequestChains/RequestChainEditor';
import {
  ExecutionLog,
  RequestChain,
  Variable,
} from '@/shared/types/requestChain.model';
import {
  getRequestChains,
  saveRequestChain,
} from '@/services/requestChain.service';
import { RequestExecutor } from '@/components/RequestChains/RequestExecutor';
import { useWorkspace } from '@/hooks/useWorkspace';

const Index = () => {
  const [currentView, setCurrentView] = useState<'list' | 'editor'>('list');
  const [editingChain, setEditingChain] = useState<RequestChain | undefined>();
  const [data, setData] = useState<{ id: string; name: string }>({
    id: '',
    name: '',
  });

  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const { data: chains = [], isLoading: loading } = useQuery({
    queryKey: ['requestChains', currentWorkspace?.id || ''],
    queryFn: () => getRequestChains(currentWorkspace?.id || ''),
    enabled: !!currentWorkspace?.id,
  });

  const {
    mutate: saveChain,
    isPending: isSavingChain,
    error: saveError,
  } = useMutation({
    mutationFn: (chain: RequestChain) => saveRequestChain(chain),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['requestChains', currentWorkspace?.id || ''],
      });
    },
    onError: (error) => {
      console.error('Failed to save chain:', error);
    },
  });

  const handleCreateChain = () => {
    setEditingChain(undefined);
    setCurrentView('editor');
  };

  const handleEditChain = (chain: RequestChain) => {
    setEditingChain(chain);
    setCurrentView('editor');
  };

  const handleSaveChain = async (
    chain: RequestChain
  ): Promise<RequestChain | null> => {
    return new Promise((resolve) => {
      saveChain(chain, {
        onSuccess: (saved) => {
          setData(
            saved ? { id: saved.id, name: saved.name } : { id: '', name: '' }
          );
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
      queryClient.setQueryData(
        ['requestChains', currentWorkspace?.id || ''],
        (old: RequestChain[] = []) => old.filter((c) => c.id !== chainId)
      );
    } catch (error) {
      console.error('Failed to delete chain:', error);
    }
  };

  const handleToggleChain = async (chainId: string) => {
    try {
      queryClient.setQueryData(
        ['requestChains', currentWorkspace?.id || ''],
        (old: RequestChain[] = []) =>
          old.map((c) => (c.id === chainId ? { ...c, enabled: !c.enabled } : c))
      );
    } catch (error) {
      console.error('Failed to toggle chain:', error);
    }
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setEditingChain(undefined);
  };

  if (currentView === 'editor') {
    return (
      <>
        <RequestChainEditor
          chain={editingChain}
          onBack={handleBackToList}
          onSave={handleSaveChain}
        />
        {data.id && (
          <RequestExecutor
            chainId={data.id}
            requests={[]}
            variables={[]}
            onExecutionComplete={function (
              logs: ExecutionLog[],
              extractedVariables: Variable[]
            ): void {
              throw new Error('Function not implemented.');
            }}
            onVariableUpdate={function (variables: Variable[]): void {
              throw new Error('Function not implemented.');
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className='min-h-screen bg-background p-6'>
      <RequestChainsList
        chains={chains}
        loading={loading}
        onCreateChain={handleCreateChain}
        onEditChain={handleEditChain}
        onDeleteChain={handleDeleteChain}
        onToggleChain={handleToggleChain}
      />
    </div>
  );
};

export default Index;
