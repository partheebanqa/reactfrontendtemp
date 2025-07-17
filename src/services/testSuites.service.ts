import axios from 'axios';
import { CreateTestSuitePayload, TestSuite } from '@/models/TestSuite.model';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const BEARER_TOKEN = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdJZCI6IjFhZTZjMjY1LWU1MDItNGFlZC1hYWRjLTQ4MzM3ZTYyMDgwNyIsInRlbmFudElkIjoiYzE1ZDQ4OWItOGMxZS00NmZiLWFlYzgtMDlmMDBmZjUyMTNjIiwicm9sZXMiOlsiT3JnIEFkbWluIl0sInN1YiI6IjM1YmI2NzBkLTcyNTYtNDg0MC1iOTI1LTJkYjk1M2ZmYmVlNCIsImV4cCI6MTc1MjgwNDE5MywibmJmIjoxNzUyNzE3NzkzLCJpYXQiOjE3NTI3MTc3OTN9.ubV5gQYgFNzyBl7poOa2bmoxBnfbGKScejm4QrrfLGw`;

const workspaceId = '8d9ea72f-7f74-4821-8909-e953066d9a8b';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${BEARER_TOKEN}`,
  },
});

export const getAllTestSuites = async (): Promise<TestSuite[]> => {
  try {
    const response = await axiosInstance.get(`/test-suites?ws=${workspaceId}`);
    return response.data.testSuites;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch test suites'
    );
  }
};

export const createTestSuite = async (
  payload: CreateTestSuitePayload
): Promise<any> => {
  try {
    const response = await axiosInstance.post('/test-suites', {
      ...payload,
      workspaceId,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to create test suite'
    );
  }
};

export const deleteTestSuite = async (id: string): Promise<void> => {
  try {
    await axiosInstance.delete(`/test-suites/${id}`);
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to delete test suite'
    );
  }
};

export const getTestSuites = async (id: string): Promise<TestSuite> => {
  try {
    const response = await axiosInstance.get(`/test-suites/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch test suite'
    );
  }
};

export const updateTestSuite = async (
  id: string,
  data: {
    name: string;
    description: string;
    addRequestIds?: string[];
    removeRequestIds?: string[];
  }
) => {
  try {
    const response = await axiosInstance.put(`/test-suites/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to update test suite'
    );
  }
};

export const executeTestSuite = async ({
  testSuiteId,
}: {
  testSuiteId: string;
}): Promise<void> => {
  const response = await axiosInstance.post('/executor/test-suite', {
    testSuiteId,
  });
  return response.data;
};
