import React, { createContext, useContext, useState } from 'react';
import { CollectionRequest } from '../types'; 

type CollectionRequestContextType = {
  collectionRequest: CollectionRequest | null;
  setCollectionRequest: (req: CollectionRequest) => void;
  
};

const CollectionRequestContext = createContext<CollectionRequestContextType | undefined>(undefined);

export const CollectionRequestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collectionRequest, setCollectionRequest] = useState<CollectionRequest | null>(null);

  return (
    <CollectionRequestContext.Provider value={{ collectionRequest, setCollectionRequest }}>
      {children}
    </CollectionRequestContext.Provider>
  );
};

export const useCollectionRequest = () => {
  const context = useContext(CollectionRequestContext);
  if (!context) {
    throw new Error('useCollectionRequest must be used within a CollectionRequestProvider');
  }
  return context;
};
