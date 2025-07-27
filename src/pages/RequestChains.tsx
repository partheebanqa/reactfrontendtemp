import React, { useState, useEffect } from 'react';
import { RequestChainsList } from '@/components/RequestChains/RequestChainsList';
import { RequestChainEditor } from '@/components/RequestChains/RequestChainEditor';
import { RequestChain } from '@/shared/types/requestChain.model';
import { requestService } from '@/services/requestChain.service';

const Index = () => {
  const [currentView, setCurrentView] = useState<'list' | 'editor'>('list');
  const [editingChain, setEditingChain] = useState<RequestChain | undefined>();
  const [chains, setChains] = useState<RequestChain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChains();
  }, []);

  const loadChains = async () => {
    try {
      setLoading(true);
      const data = await requestService.getRequestChains('workspace-1');
      setChains(data);
    } catch (error) {
      console.error('Failed to load chains:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChain = () => {
    setEditingChain(undefined);
    setCurrentView('editor');
  };

  const handleEditChain = (chain: RequestChain) => {
    setEditingChain(chain);
    setCurrentView('editor');
  };

  const handleSaveChain = async (chain: RequestChain) => {
    try {
      await requestService.saveRequestChain(chain);
      await loadChains(); // Reload the list
      setCurrentView('list');
    } catch (error) {
      console.error('Failed to save chain:', error);
    }
  };

  const handleDeleteChain = async (chainId: string) => {
    try {
      // await requestService.deleteRequestChain(chainId);
      setChains(chains.filter((c) => c.id !== chainId));
    } catch (error) {
      console.error('Failed to delete chain:', error);
    }
  };

  const handleToggleChain = async (chainId: string) => {
    try {
      // await requestService.toggleRequestChain(chainId);
      setChains(
        chains.map((c) =>
          c.id === chainId ? { ...c, enabled: !c.enabled } : c
        )
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
      <RequestChainEditor
        chain={editingChain}
        onBack={handleBackToList}
        onSave={handleSaveChain}
      />
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
