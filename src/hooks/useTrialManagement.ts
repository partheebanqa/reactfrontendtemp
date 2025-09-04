import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useToast } from '@/hooks/useToast';

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  billingInterval: string;
  features: string[];
  limits: Record<string, number>;
  isActive: boolean;
}

// Define the hook as a named function declaration for Fast Refresh compatibility
function useTrialManagement() {
  const { currentWorkspace, refreshWorkspaces } = useWorkspace();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get subscription plans
  const { data: subscriptionPlans = [], isLoading: isLoadingPlans } = useQuery({
    queryKey: ['/api/subscription-plans'],
    select: (data) => data as SubscriptionPlan[],
  });

  // Start trial mutation
  const startTrialMutation = useMutation({
    mutationFn: async ({
      planId,
      durationDays = 15,
    }: {
      planId: string;
      durationDays?: number;
    }) => {
      console.log(
        'Starting trial with planId:',
        planId,
        'for durationDays:',
        durationDays
      );

      if (!currentWorkspace) throw new Error('No workspace selected');

      return await apiRequest(
        'POST',
        `/api/workspaces/${currentWorkspace.id}/start-trial`,
        {
          planId,
          durationDays,
        }
      );
    },
    onSuccess: () => {
      refreshWorkspaces();
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces'] });
      toast({
        title: 'Trial Started!',
        description:
          'Your 15-day trial has been activated with full Pro features.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Trial Start Failed',
        description:
          error.message || 'Failed to start trial. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Convert trial mutation
  const convertTrialMutation = useMutation({
    mutationFn: async (newPlan: string) => {
      if (!currentWorkspace) throw new Error('No workspace selected');

      return await apiRequest(
        'POST',
        `/api/workspaces/${currentWorkspace.id}/convert-trial`,
        {
          newPlan,
        }
      );
    },
    onSuccess: () => {
      refreshWorkspaces();
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces'] });
      toast({
        title: 'Trial Converted!',
        description:
          'Your trial has been successfully converted to a paid subscription.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Conversion Failed',
        description:
          error.message || 'Failed to convert trial. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Helper functions
  const canStartTrial = () => {
    return (
      currentWorkspace &&
      currentWorkspace.subscriptionPlan === 'free' &&
      !currentWorkspace.isTrialActive
    );
  };

  const isTrialActive = () => {
    return (
      currentWorkspace?.isTrialActive &&
      currentWorkspace?.trialEndDate &&
      new Date() < new Date(currentWorkspace.trialEndDate)
    );
  };

  const isTrialExpired = () => {
    return (
      currentWorkspace?.isTrialActive &&
      currentWorkspace?.trialEndDate &&
      new Date() > new Date(currentWorkspace.trialEndDate)
    );
  };

  const getTrialDaysLeft = () => {
    if (!currentWorkspace?.trialEndDate || !currentWorkspace.isTrialActive) {
      return 0;
    }
    const trialEnd = new Date(currentWorkspace.trialEndDate);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return {
    subscriptionPlans,
    isLoadingPlans,
    startTrial: startTrialMutation.mutate,
    convertTrial: convertTrialMutation.mutate,
    isStartingTrial: startTrialMutation.isPending,
    isConvertingTrial: convertTrialMutation.isPending,
    canStartTrial: canStartTrial(),
    isTrialActive: isTrialActive(),
    isTrialExpired: isTrialExpired(),
    trialDaysLeft: getTrialDaysLeft(),
  };
}

// Export the hook separately
export { useTrialManagement };
