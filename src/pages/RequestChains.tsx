import React, { useState } from 'react';
import { RequestChainsList } from '@/components/RequestChains/RequestChainsList';
import { RequestChainEditor } from '@/components/RequestChains/RequestChainEditor';
import { RequestChain } from '@/shared/types/requestChain.model';

export default function RequestChains() {
  const [currentView, setCurrentView] = useState<'list' | 'editor'>('list');
  const [editingChain, setEditingChain] = useState<RequestChain | undefined>();
  const [chains, setChains] = useState<RequestChain[]>([]);

  const handleCreateChain = () => {
    setEditingChain(undefined);
    setCurrentView('editor');
  };

  const handleEditChain = (chain: RequestChain) => {
    setEditingChain(chain);
    setCurrentView('editor');
  };

  const handleSaveChain = (chain: RequestChain) => {
    console.log('chainIn page:', chain);

    if (editingChain) {
      // Update existing chain
      setChains(chains.map((c) => (c.id === chain.id ? chain : c)));
    } else {
      // Create new chain
      setChains([...chains, chain]);
    }
    setCurrentView('list');
    setEditingChain(undefined);
  };

  const handleDeleteChain = (chainId: string) => {
    setChains(chains.filter((c) => c.id !== chainId));
  };

  const handleToggleChain = (chainId: string) => {
    setChains(
      chains.map((c) => (c.id === chainId ? { ...c, enabled: !c.enabled } : c))
    );
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
    <RequestChainsList
      chains={chains}
      onCreateChain={handleCreateChain}
      onEditChain={handleEditChain}
      onDeleteChain={handleDeleteChain}
      onToggleChain={handleToggleChain}
    />
  );
}
