import { API_EXECUTOR } from '@/config/apiRoutes';
import { apiRequest } from '@/lib/queryClient';
import {
  ApiExecutionResponse,
  MappedExecution,
  MappedExecutionResponse,
} from '@/shared/types/execution';

const fetchExecutionHistory = async (params: {
  page?: number;
  limit?: number;
  domain?: string;
}): Promise<ApiExecutionResponse> => {
  const response = await apiRequest('GET', `${API_EXECUTOR}/execution-history`);
  return response.json();
};

export const mapExecutionData = (
  apiResponse: ApiExecutionResponse
): MappedExecutionResponse => {
  const executions: MappedExecution[] = apiResponse.items.map((item) => ({
    id: item.executionId,
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
};
