import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "./useAuth";
import { useRef, useCallback } from "react";

interface AuditLogData {
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

// Define the hook as a named function declaration for Fast Refresh compatibility
function useAuditLog() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  
  // Track logged feature access to prevent duplicate logs
  const loggedFeatures = useRef(new Set<string>());

  const logMutation = useMutation({
    mutationFn: async (logData: AuditLogData) => {
      if (!currentWorkspace || !user) return;
      
      await apiRequest("POST", "/api/audit-logs", {
        ...logData,
        userId: user?.id,
        workspaceId: currentWorkspace.id,
      });
    },
  });

  const logFeatureAccess = useCallback((feature: string, hasAccess: boolean) => {
    const logKey = `${feature}_${hasAccess}`;
    
    // Only log if we haven't already logged this feature access state
    if (loggedFeatures.current.has(logKey)) {
      return;
    }
    
    loggedFeatures.current.add(logKey);
    
    logMutation.mutate({
      action: hasAccess ? "feature_access_granted" : "feature_access_denied",
      resourceType: "feature",
      metadata: { feature, hasAccess },
    });
  }, [logMutation]);

  const logUserAction = useCallback((action: string, resourceType: string, resourceId?: string, metadata?: Record<string, any>) => {
    logMutation.mutate({
      action,
      resourceType,
      resourceId,
      metadata,
    });
  }, [logMutation]);

  return {
    logFeatureAccess,
    logUserAction,
  };
}

// Export the hook separately
export { useAuditLog };
