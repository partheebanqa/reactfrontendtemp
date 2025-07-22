import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useToast } from "@/hooks/useToast";
import { useWorkspace } from "@/hooks/useWorkspace";
import { apiRequest } from "@/lib/queryClient";

import { 
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";

import { ExecutionsHeader } from "@/components/Executions/ExecutionsHeader";
import { ExecutionsFilters } from "@/components/Executions/ExecutionsFilters";
import { ExecutionDetailsDialog } from "@/components/Executions/ExecutionDetailsDialog";
import { ExecutionsTable } from "@/components/Executions/ExecutionsTable";
import { ExecutionsPagination } from "@/components/Executions/ExecutionsPagination";

interface Execution {
  id: string;
  type: "endpoint" | "suite" | "chain" | "scheduled";
  targetId: string;
  targetName: string;
  status: "running" | "passed" | "failed" | "error";
  startedAt: string;
  completedAt?: string;
  duration?: number;
  results: {
    totalRequests?: number;
    successfulRequests?: number;
    failedRequests?: number;
    averageResponseTime?: number;
  };
  error?: string;
  executedBy: string;
}

interface SavedFilter {
  id: string;
  name: string;
  filters: any;
}
interface Project {
    id: string;
    name: string;
  }
  
  interface WorkspaceResponse {
    projects: Project[];
  }
  
  interface ExecutionResponse {
    executions: Execution[];
  }

  
const ExecutionsNew: React.FC = () => {
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  // All required states for ExecutionsFilters
  const [searchQuery, setSearchQuery] = useState("");
  const [environmentFilter, setEnvironmentFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [triggerFilter, setTriggerFilter] = useState("all");
  const [executionIdFilter, setExecutionIdFilter] = useState("");
  const [durationRange, setDurationRange] = useState({ min: 0, max: 10000 });

  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [showExecutionDetails, setShowExecutionDetails] = useState(false);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const { data: projectData } = useQuery({
    queryKey: ["/api/workspaces", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
  });

  const { data: executions = [], isLoading } = useQuery({
    queryKey: ["/api/projects", projectData?.projects?.[0]?.id, "executions"],
    enabled: !!projectData?.projects?.[0]?.id,
    select: (data) => data?.executions || [],
    refetchInterval: 5000,
  });

  const stopExecutionMutation = useMutation({
    mutationFn: async (executionId: string) => {
      return await apiRequest("PATCH", `/api/executions/${executionId}`, {
        status: "error",
        completedAt: new Date().toISOString(),
        error: "Execution stopped by user"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/projects", projectData?.projects?.[0]?.id, "executions"]
      });
      toast({
        title: "Execution stopped",
        description: "The execution has been stopped successfully",
      });
    }
  });

  const retryExecutionMutation = useMutation({
    mutationFn: async (execution: Execution) => {
      return await apiRequest("POST", "/api/executions", {
        type: execution.type,
        targetId: execution.targetId,
        projectId: projectData?.projects?.[0]?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/projects", projectData?.projects?.[0]?.id, "executions"]
      });
      toast({
        title: "Execution restarted",
        description: "A new execution has been started",
      });
    }
  });

  // Mock executions
  const mockExecutions: Execution[] = [
    {
      id: "1",
      type: "endpoint",
      targetId: "endpoint-1",
      targetName: "User Authentication API",
      status: "passed",
      startedAt: "2024-01-20T14:25:00Z",
      completedAt: "2024-01-20T14:25:02Z",
      duration: 2150,
      results: {
        totalRequests: 1,
        successfulRequests: 1,
        failedRequests: 0,
        averageResponseTime: 245
      },
      executedBy: "John Developer"
    },
    {
      id: "2",
      type: "suite",
      targetId: "suite-1",
      targetName: "Payment Processing Tests",
      status: "failed",
      startedAt: "2024-01-20T14:20:00Z",
      completedAt: "2024-01-20T14:21:30Z",
      duration: 90000,
      results: {
        totalRequests: 8,
        successfulRequests: 6,
        failedRequests: 2,
        averageResponseTime: 1250
      },
      error: "Payment API timeout error",
      executedBy: "Jane Tester"
    },
    {
      id: "3",
      type: "chain",
      targetId: "chain-1",
      targetName: "User Registration Flow",
      status: "running",
      startedAt: "2024-01-20T14:30:00Z",
      duration: undefined,
      results: {
        totalRequests: 3,
        successfulRequests: 2,
        failedRequests: 0
      },
      executedBy: "System"
    },
    {
      id: "4",
      type: "scheduled",
      targetId: "schedule-1",
      targetName: "Daily Health Check",
      status: "passed",
      startedAt: "2024-01-20T09:00:00Z",
      completedAt: "2024-01-20T09:00:15Z",
      duration: 15000,
      results: {
        totalRequests: 5,
        successfulRequests: 5,
        failedRequests: 0,
        averageResponseTime: 180
      },
      executedBy: "Scheduler"
    }
  ];

  const allExecutions = [...executions, ...mockExecutions];

  const filteredExecutions = allExecutions.filter(execution => {
    const matchesSearch = execution.targetName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || execution.status === statusFilter;
    const matchesType = typeFilter === "all" || execution.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExecutions = filteredExecutions.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredExecutions.length / itemsPerPage);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case "passed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-blue-100 text-blue-700">Running</Badge>;
      case "passed":
        return <Badge className="bg-green-100 text-green-700">Passed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-700';
      case 'passed':
        return 'bg-green-100 text-green-700';
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  

  const formatDuration = (milliseconds?: number) => {
    if (!milliseconds) return "N/A";
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const openExecutionDetails = (execution: Execution) => {
    setSelectedExecution(execution);
    setShowExecutionDetails(true);
  };

  // dummy implementations for required handlers
  const saveCurrentFilter = () => {
    const filterName = prompt("Enter a name for the filter:");
    if (filterName) {
      setSavedFilters([
        ...savedFilters,
        { id: Date.now().toString(), name: filterName, filters: {} }
      ]);
    }
  };

  const applySavedFilter = (filter: SavedFilter) => {
    console.log("Applying filter", filter);
  };

  const applyQuickFilter = (type: string) => {
    console.log("Applying quick filter", type);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setEnvironmentFilter("all");
    setTypeFilter("all");
    setDateRange({ from: undefined, to: undefined });
    setStatusFilter("all");
    setTriggerFilter("all");
    setExecutionIdFilter("");
    setDurationRange({ min: 0, max: 10000 });
  };

  return (
    // <ProtectedRoute feature="executions-new">
    <>
      <ExecutionsHeader />
      <div className="p-6">
        <ExecutionsFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          environmentFilter={environmentFilter}
          setEnvironmentFilter={setEnvironmentFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          showAdvancedSearch={showAdvancedSearch}
          setShowAdvancedSearch={setShowAdvancedSearch}
          savedFilters={savedFilters}
          saveCurrentFilter={saveCurrentFilter}
          applySavedFilter={applySavedFilter}
          applyQuickFilter={applyQuickFilter}
          activeQuickFilter={activeQuickFilter}
          dateRange={dateRange}
          setDateRange={setDateRange}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          triggerFilter={triggerFilter}
          setTriggerFilter={setTriggerFilter}
          executionIdFilter={executionIdFilter}
          setExecutionIdFilter={setExecutionIdFilter}
          durationRange={durationRange}
          setDurationRange={setDurationRange}
          clearAllFilters={clearAllFilters}
        />

        {/* <ExecutionsTable
          executions={paginatedExecutions}
          getStatusIcon={getStatusIcon}
          getStatusBadge={getStatusBadge}
          getStatusColor={getStatusColor}
          formatDuration={formatDuration}
          openExecutionDetails={openExecutionDetails}
          stopExecutionMutation={stopExecutionMutation}
          retryExecutionMutation={retryExecutionMutation}
        /> */}

        <ExecutionsPagination
          totalItems={filteredExecutions.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />

        <ExecutionDetailsDialog
          open={showExecutionDetails}
          onClose={() => setShowExecutionDetails(false)}
          execution={selectedExecution}
        />
      </div>
    </>
  );
};

export default ExecutionsNew;
