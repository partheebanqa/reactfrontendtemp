import { apiRequest } from '@/lib/queryClient';
import { API_SCHEDULER } from '@/config/apiRoutes';

export interface Schedule {
  scheduleId: string;
  scheduleName: string;
  description: string;
  workspaceId: string;
  target: number;
  targetId: string;
  isOneTime: boolean;
  frequencyMode: number;
  scheduledTime: string;
  timezone: string;
  daysOfWeek?: number[];
  environmentId: string;
  nextRunAt: string;
  retryAttempts: number;
  isActive: boolean;
}

export interface ScheduleFormData {
  scheduleName: string;
  description?: string;
  target: number;
  targetId: string;
  isOneTime: boolean;
  frequencyMode: number;
  scheduledTime: string;
  timezone: string;
  daysOfWeek?: number[];
  environmentId: string;
  retryAttempts: number;
  isActive: boolean;
}

export interface ScheduleListResponse {
  schedules: Schedule[];
  count: number;
}

export interface ScheduleListParams {
  workspaceId: string;
  isOneTime?: boolean;
  target?: number;
  isActive?: boolean;
}

export const createSchedule = async (
  payload: ScheduleFormData & { workspaceId: string }
): Promise<Schedule> => {
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

export const getSchedule = async (scheduleId: string): Promise<Schedule> => {
  try {
    const response = await apiRequest('GET', `${API_SCHEDULER}/${scheduleId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch schedule');
    }

    return await response.json();
  } catch (error) {
    throw new Error((error as Error).message || 'Failed to fetch schedule');
  }
};

export const getScheduleList = async (
  params: ScheduleListParams
): Promise<ScheduleListResponse> => {
  try {
    const queryParams = new URLSearchParams();

    if (params.isOneTime !== undefined) {
      queryParams.append('isOneTime', params.isOneTime.toString());
    }
    if (params.target !== undefined) {
      queryParams.append('target', params.target.toString());
    }
    if (params.isActive !== undefined) {
      queryParams.append('isActive', params.isActive.toString());
    }

    const queryString = queryParams.toString();
    const url = `${API_SCHEDULER}/workspaces/${params.workspaceId}${
      queryString ? `?${queryString}` : ''
    }`;

    const response = await apiRequest('GET', url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Workspace-ID': params.workspaceId,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch schedule list');
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      (error as Error).message || 'Failed to fetch schedule list'
    );
  }
};

export const updateSchedule = async (
  scheduleId: string,
  payload: Partial<ScheduleFormData>
): Promise<Schedule> => {
  try {
    const response = await apiRequest('PUT', `${API_SCHEDULER}/${scheduleId}`, {
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to update schedule');
    }

    return await response.json();
  } catch (error) {
    throw new Error((error as Error).message || 'Failed to update schedule');
  }
};

export const deleteSchedule = async (scheduleId: string): Promise<void> => {
  try {
    const response = await apiRequest(
      'DELETE',
      `${API_SCHEDULER}/${scheduleId}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete schedule');
    }

    // DELETE requests typically don't return content
    return;
  } catch (error) {
    throw new Error((error as Error).message || 'Failed to delete schedule');
  }
};

export const duplicateSchedule = async (
  scheduleId: string
): Promise<Schedule> => {
  try {
    const response = await apiRequest(
      'POST',
      `${API_SCHEDULER}/${scheduleId}/duplicate`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to duplicate schedule');
    }

    return await response.json();
  } catch (error) {
    throw new Error((error as Error).message || 'Failed to duplicate schedule');
  }
};

export const toggleScheduleStatus = async (
  scheduleId: string,
  isActive: boolean
): Promise<Schedule> => {
  return updateSchedule(scheduleId, { isActive });
};

export const updateScheduleRetryAttempts = async (
  scheduleId: string,
  retryAttempts: number
): Promise<Schedule> => {
  return updateSchedule(scheduleId, { retryAttempts });
};

export const deleteMultipleSchedules = async (
  scheduleIds: string[]
): Promise<void> => {
  try {
    const deletePromises = scheduleIds.map((id) => deleteSchedule(id));
    await Promise.all(deletePromises);
  } catch (error) {
    throw new Error(
      (error as Error).message || 'Failed to delete multiple schedules'
    );
  }
};

export const duplicateMultipleSchedules = async (
  scheduleIds: string[]
): Promise<Schedule[]> => {
  try {
    const duplicatePromises = scheduleIds.map((id) => duplicateSchedule(id));
    return await Promise.all(duplicatePromises);
  } catch (error) {
    throw new Error(
      (error as Error).message || 'Failed to duplicate multiple schedules'
    );
  }
};

/*
// Create a new schedule
const newSchedule = await createSchedule({
  scheduleName: "Daily API Test",
  description: "Run API tests daily",
  workspaceId: "workspace-123",
  target: 2,
  targetId: "target-456",
  isOneTime: false,
  frequencyMode: 3,
  scheduledTime: "2025-09-22T21:00:00Z",
  timezone: "Asia/Kolkata",
  daysOfWeek: [1, 2, 3, 4, 5],
  environmentId: "env-789",
  retryAttempts: 3,
  isActive: true
})

// Get a specific schedule
const schedule = await getSchedule("schedule-id-123")

// Get list of schedules
const scheduleList = await getScheduleList({
  workspaceId: "workspace-123",
  isOneTime: false,
  target: 2,
  isActive: true
})

// Update a schedule
const updatedSchedule = await updateSchedule("schedule-id-123", {
  scheduleName: "Updated Schedule Name",
  isActive: false
})

// Delete a schedule
await deleteSchedule("schedule-id-123")

// Duplicate a schedule
const duplicatedSchedule = await duplicateSchedule("schedule-id-123")
*/
