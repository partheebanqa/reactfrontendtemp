export interface ApiExecutionItem {
  executionType: string;
  executionId: string;
  entityId: string;
  name: string;
  environment: string;
  status: string;
  startTime: number;
  duration: number;
  results: {
    passed: number;
    failed: number;
  };
  source: string;
}

export interface ApiExecutionResponse {
  total: number;
  page: number;
  limit: number;
  items: ApiExecutionItem[];
}

export interface MappedExecution {
  id: string;
  entityId: string;
  testSuite?: { name: string };
  requestChain?: { name: string };
  status: string;
  startTime: number;
  duration: number;
  results: {
    passed: number;
    failed: number;
    total: number;
  };
  scheduleId?: string;
  environment: string;
  source: string;
  executionType: string;
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: {
    searchQuery: string;
    statusFilter: string;
    environmentFilter: string;
    typeFilter: string;
    triggerFilter: string;
    dateRange: { from: Date | undefined; to: Date | undefined };
    executionIdFilter: string;
    durationRange: { min: number; max: number };
  };
}

export interface MappedExecutionResponse {
  executions: MappedExecution[];
  total: number;
  page: number;
  limit: number;
}
