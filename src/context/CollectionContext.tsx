import React, { createContext, useContext, useState } from 'react';
import { Collection } from '../types'; 

type CollectionContextType = {
  collection: Collection[] | null;
  setCollection: (req: Collection[]) => void;
  
};

const CollectionContext = createContext<CollectionContextType | undefined>(undefined);

export const CollectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collection, setCollection] = useState<Collection[] | null>(null);

  return (
    <CollectionContext.Provider value={{ collection, setCollection }}>
      {children}
    </CollectionContext.Provider>
  );
};

export const useCollection = () => {
  const context = useContext(CollectionContext);
  if (!context) {
    throw new Error('useCollectionRequest must be used within a CollectionRequestProvider');
  }
  return context;
};
