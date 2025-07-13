import { useState } from 'react';

// Mock data
const mockSchedules = [
  {
    id: 1,
    name: 'Daily Health Check',
    description: 'Check API endpoints every morning',
    testSuite: { id: 1, name: 'API Health Tests' },
    scheduleType: 'recurring',
    isActive: true,
    environment: 'Production',
    scheduledDate: new Date(),
    scheduledTime: '09:00',
    timezone: 'UTC',
    cronExpression: '0 9 * * *',
    retryAttempts: 3,
    emailNotifications: 'admin@example.com',
    requestDelay: 0,
    createdAt: new Date('2024-01-15'),
    nextRun: 'Jul 13, 2025 at 09:00 (UTC)',
  },
  {
    id: 2,
    name: 'Weekly Report Generation',
    description: 'Generate weekly performance reports',
    testSuite: { id: 2, name: 'Report Tests' },
    scheduleType: 'recurring',
    isActive: false,
    environment: 'Staging',
    scheduledDate: new Date(),
    scheduledTime: '18:00',
    timezone: 'America/New_York',
    cronExpression: '0 18 * * 1',
    retryAttempts: 1,
    emailNotifications: 'reports@example.com',
    requestDelay: 5000,
    createdAt: new Date('2024-01-10'),
    nextRun: 'Jul 13, 2025 at 18:00 (America/New_York)',
  },
  {
    id: 3,
    name: 'One-time Database Migration',
    description: 'Run database migration scripts',
    testSuite: { id: 3, name: 'Migration Tests' },
    scheduleType: 'one-time',
    isActive: true,
    environment: 'Development',
    scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    scheduledTime: '02:00',
    timezone: 'UTC',
    cronExpression: null,
    retryAttempts: 0,
    emailNotifications: 'dev@example.com',
    requestDelay: 0,
    createdAt: new Date('2024-01-20'),
    nextRun: 'Jul 15, 2025 at 02:00 (UTC)',
  },
];

const mockTestSuites = [
  { id: 1, name: 'API Health Tests' },
  { id: 2, name: 'Report Tests' },
  { id: 3, name: 'Migration Tests' },
  { id: 4, name: 'Integration Tests' },
  { id: 5, name: 'Performance Tests' },
];

const mockRequestChains = [
  { id: 1, name: 'User Registration Flow' },
  { id: 2, name: 'Payment Processing Chain' },
  { id: 3, name: 'Data Export Chain' },
];

export function useSchedules(workspaceId?: string) {
  const [schedules, setSchedules] = useState(mockSchedules);
  const [isLoading, setIsLoading] = useState(false);

  const refetch = () => {
    setIsLoading(true);
    setTimeout(() => {
      setSchedules([...mockSchedules]);
      setIsLoading(false);
    }, 500);
  };

  return {
    data: schedules,
    isLoading,
    refetch,
  };
}

export function useTestSuites(workspaceId?: string) {
  return {
    data: mockTestSuites,
    isLoading: false,
  };
}

export function useRequestChains() {
  return {
    data: mockRequestChains,
    isLoading: false,
  };
}
