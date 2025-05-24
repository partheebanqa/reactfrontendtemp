import React, { createContext, useContext, useState } from 'react';
import { WorkSpace } from '../shared/services/workspaceService';

interface WorkspaceContextType {
  selectedWorkspaceId: string;
  setSelectedWorkspaceId: (id: string) => void;
  createdWorkspace:WorkSpace | null;
  setCreatedWorkspace: (workspace:WorkSpace) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [createdWorkspace, setCreatedWorkspace] = useState<WorkSpace | null>(null);

  return (
    <WorkspaceContext.Provider value={{ selectedWorkspaceId, setSelectedWorkspaceId, createdWorkspace, setCreatedWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within a WorkspaceProvider');
  return context;
};
