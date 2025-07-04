import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  subscriptionPlan: "free" | "pro" | "enterprise";
  trialStartDate?: string;
  trialEndDate?: string;
  isTrialActive?: boolean;
  subscriptionStatus?: string;
  billingEmail?: string;
  ownerId: string;
}

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  setCurrentWorkspace: (workspace: Workspace) => void;
  refreshWorkspaces: () => void;
  isTrialExpired: boolean;
  trialDaysLeft: number;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  // Mock workspace data based on user subscription
  React.useEffect(() => {
    if (user && user.id) {
      const subscriptionPlan = (user as any).subscriptionPlan || "free";
      const mockWorkspaces: Workspace[] = [
        {
          id: "1",
          name: "Default Workspace",
          slug: "default",
          subscriptionPlan: subscriptionPlan as "free" | "pro" | "enterprise",
          ownerId: user.id,
        },
      ];

      setWorkspaces(mockWorkspaces);
      setCurrentWorkspace(mockWorkspaces[0]);
    } else {
      setWorkspaces([]);
      setCurrentWorkspace(null);
    }
  }, [user]);

  const refreshWorkspaces = useCallback(() => {
    // This would typically refetch from the server
    // For now, we'll use the data from the auth context
    if (user?.workspaces) {
      setWorkspaces(user.workspaces);
    }
  }, [user]);

  const isTrialExpired = React.useMemo(() => {
    if (!currentWorkspace?.trialEndDate) return false;
    return new Date() > new Date(currentWorkspace.trialEndDate);
  }, [currentWorkspace]);

  const trialDaysLeft = React.useMemo(() => {
    if (!currentWorkspace?.trialEndDate) return 0;
    const trialEnd = new Date(currentWorkspace.trialEndDate);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, [currentWorkspace]);

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        workspaces,
        setCurrentWorkspace,
        refreshWorkspaces,
        isTrialExpired,
        trialDaysLeft,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};
