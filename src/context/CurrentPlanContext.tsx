import { createContext, useContext, useEffect, useState } from 'react';
import { ENV } from '@/config/env';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

interface CurrentPlan {
  ID: string;
  TenantID: string;
  PlanID: string;
  PlanName: string;
  Status: string;
  IsTrial: boolean;
  StartedAt: string;
  ExpiresAt: string;
  CreatedAt: string;
  CreatedBy: string;
  UpdatedAt: string;
}

interface CurrentPlanContextType {
  currentPlan: CurrentPlan | null;
  refreshCurrentPlan: () => Promise<void>;
}

const CurrentPlanContext = createContext<CurrentPlanContextType | undefined>(undefined);

export const CurrentPlanProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, token } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan | null>(null);

  const fetchCurrentPlan = async () => {
    try {
      const response = await apiRequest(
        'GET',
        `${ENV.API_BASE_URL}/subscription/current-plan`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch current plan');
      }

      const data = await response.json();
      setCurrentPlan(data[0] || null);
    } catch (error) {
      console.error('Error fetching current plan:', error);
      setCurrentPlan(null);
    }
  };

  useEffect(() => {
    if (user && token) {   // ✅ only fetch after login
      fetchCurrentPlan();
    }
  }, [user, token]);

  return (
    <CurrentPlanContext.Provider value={{ currentPlan, refreshCurrentPlan: fetchCurrentPlan }}>
      {children}
    </CurrentPlanContext.Provider>
  );
};

export const useCurrentPlan = () => {
  const context = useContext(CurrentPlanContext);
  if (!context) {
    throw new Error('useCurrentPlan must be used within a CurrentPlanProvider');
  }
  return context;
};
