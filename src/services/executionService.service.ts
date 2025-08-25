import { API_EXECUTOR, API_REPORTS } from '@/config/apiRoutes';
import { apiRequest } from '@/lib/queryClient';

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

const fetchExecutionHistory = async (params: {
  page?: number; // already converted to API's expectation
  limit?: number;
}): Promise<ApiExecutionResponse> => {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;

  const url = `${API_EXECUTOR}/execution-history?page=${encodeURIComponent(
    page
  )}&limit=${encodeURIComponent(limit)}`;

  // const response = await fetch(
  //   `${domain}/executor/execution-history?page=${page}&limit=${limit}`
  // );
  const response = await apiRequest('GET', `${API_EXECUTOR}/execution-history`);

  const res = await apiRequest('GET', url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Failed to fetch execution history (${res.status}): ${text}`
    );
  }
  return res.json();
};

// Report API functions
const getTestSuiteReport = async (testSuiteId: string) => {
  const response = await apiRequest(
    'GET',
    `${API_REPORTS}/test-suites/${testSuiteId}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch test suite report');
  }
  return response.json();
};

const getRequestChainReport = async (requestChainId: string) => {
  const response = await apiRequest(
    'GET',
    `${API_REPORTS}/request-chains/${requestChainId}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch request chain report');
  }
  return response.json();
};

export const mapExecutionData = (
  apiResponse: ApiExecutionResponse
): MappedExecutionResponse => {
  const executions: MappedExecution[] = apiResponse.items.map((item) => ({
    id: item.executionId,
    entityId: item.entityId,
    ...(item.executionType === 'test_suite'
      ? { testSuite: { name: item.name } }
      : { requestChain: { name: item.name } }),
    status: item.status,
    startTime: item.startTime,
    duration: item.duration,
    results: {
      passed: item.results.passed,
      failed: item.results.failed,
      total: item.results.passed + item.results.failed,
    },
    scheduleId:
      item.source === 'scheduled' ? `schedule-${item.entityId}` : undefined,
    environment: item.environment,
    source: item.source,
    executionType: item.executionType,
  }));

  return {
    executions,
    total: apiResponse.total,
    page: apiResponse.page,
    limit: apiResponse.limit,
  };
};

export const executionService = {
  getExecutionHistory: fetchExecutionHistory,
  mapData: mapExecutionData,
  getTestSuiteReport,
  getRequestChainReport,
};
