import {
  CreateTestSuitePayload,
  TestSuite,
} from '@/shared/types/TestSuite.model';
import { apiRequest } from '@/lib/queryClient';
import { API_SCHEDULER } from '@/config/apiRoutes';
import { ScheduleFormData } from '@/components/Scheduler/ScheduleCreate';

export const createSchedule = async (
  payload: ScheduleFormData & { workspaceId: string }
): Promise<any> => {
  try {
    const response = await apiRequest('POST', API_SCHEDULER, {
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to create schedule');
    }

    return await response.json();
  } catch (error) {
    throw new Error((error as Error).message || 'Failed to create schedule');
  }
};
