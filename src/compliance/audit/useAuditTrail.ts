import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface AuditEntry {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  userId: string;
  userName: string;
  timestamp: Date;
  metadata: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}

// Define the hook as a named function declaration for Fast Refresh compatibility
function useAuditTrail() {
  const queryClient = useQueryClient();

  const logAuditEvent = useMutation({
    mutationFn: async (event: {
      action: string;
      resource: string;
      resourceId?: string;
      metadata?: Record<string, any>;
    }) => {
      return await apiRequest("/api/audit/log", "POST", event);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audit"] });
    },
  });

  return {
    logAuditEvent: logAuditEvent.mutate,
    isLogging: logAuditEvent.isPending,
  };
};