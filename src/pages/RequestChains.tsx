import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RequestChainsList } from '@/components/RequestChains/RequestChainsList';
import { RequestChainEditor } from '@/components/RequestChains/RequestChainEditor';
import { ExecutionLog, RequestChain, Variable } from '@/shared/types/requestChain.model';
import {
  getRequestChains,
  saveRequestChain,
} from '@/services/requestChain.service';
import { RequestExecutor } from '@/components/RequestChains/RequestExecutor';

const Index = () => {
  const [currentView, setCurrentView] = useState<'list' | 'editor'>('list');
  const [editingChain, setEditingChain] = useState<RequestChain | undefined>();

  const queryClient = useQueryClient();

  const {
    data: chains = [],
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ['requestChains', 'workspace-1'],
    queryFn: () => getRequestChains('workspace-1'),
  });

  const {
    mutate: saveChain,
    isPending: isSavingChain,
    error: saveError,
  } = useMutation({
    mutationFn: (chain: RequestChain) => saveRequestChain(chain),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['requestChains', 'workspace-1'],
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

  interface RequestChainEditorProps {
    id:string;
    name: string;
  }


  const [data, setData] = useState<RequestChainEditorProps>({
    id: '',
    name: '', 
  });

  console.log('RequestChains data:', data);

  const handleSaveChain = async (chain: RequestChain): Promise<RequestChain | null> => {
    try {
      const saved = await saveRequestChain(chain);
      console.log('Chain saved:', saved);
      setData(saved? { id: saved.id, name: saved.name } : { id: '', name: '' });  
      return saved;
    } catch (e) {
      console.error(e);
      return null;
    }
  };
  
  const handleDeleteChain = async (chainId: string) => {
    try {
      // await requestService.deleteRequestChain(chainId);
      queryClient.setQueryData(
        ['requestChains', 'workspace-1'],
        (old: RequestChain[] = []) => old.filter((c) => c.id !== chainId)
      );
    } catch (error) {
      console.error('Failed to delete chain:', error);
    }
  };

  const handleToggleChain = async (chainId: string) => {
    try {
      queryClient.setQueryData(
        ['requestChains', 'workspace-1'],
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
        <RequestExecutor chainId={data.id} requests={[]} variables={[]} onExecutionComplete={function (logs: ExecutionLog[], extractedVariables: Variable[]): void {
            throw new Error('Function not implemented.');
          } } onVariableUpdate={function (variables: Variable[]): void {
            throw new Error('Function not implemented.');
          } }  />
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
