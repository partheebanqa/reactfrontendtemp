import axios from 'axios';
import { CreateTestSuitePayload, TestSuite } from '@/models/TestSuite.model';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const BEARER_TOKEN = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdJZCI6IjFhZTZjMjY1LWU1MDItNGFlZC1hYWRjLTQ4MzM3ZTYyMDgwNyIsInRlbmFudElkIjoiYzE1ZDQ4OWItOGMxZS00NmZiLWFlYzgtMDlmMDBmZjUyMTNjIiwicm9sZXMiOlsiT3JnIEFkbWluIl0sInN1YiI6IjM1YmI2NzBkLTcyNTYtNDg0MC1iOTI1LTJkYjk1M2ZmYmVlNCIsImV4cCI6MTc1MjExNDA1OSwibmJmIjoxNzUyMDI3NjU5LCJpYXQiOjE3NTIwMjc2NTl9.JJ7AgXVGU7oQQIBNX2Pfm7ykHzE3mdpyL7GDNqSoWk0`;

const workspaceId = '510cdffe-4262-438c-a5a6-c42c72a705ab';

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
    // console.log('data000:', response.data);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch test suite'
    );
  }
};

export const addRequestsToTestSuite = async (
  testSuiteId: string,
  payload: any
): Promise<any> => {
  try {
    const response = await axiosInstance.post(
      `/test-suites/${testSuiteId}/requests`,
      {
        ...payload,
        workspaceId,
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to add requests to test suite'
    );
  }
};
