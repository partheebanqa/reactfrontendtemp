import { ENV } from "../../config/env";
import { CreateTestSuite } from "../types/TestSuitesModal";
import { apiClient } from "./apiClient";

export const testSuiteService = {

  createTestSuite: async (testSuite: CreateTestSuite): Promise<any> => {
    try {
      const response = await apiClient(`${ENV.API_URL}/test-suites`, {
        method: 'POST',
        requiresAuth: true,
        body: JSON.stringify(testSuite),
      });
      return response;
    }
    catch (error: any) {
      throw error;
    }
  },

  addRequests: async (requestIds: {requestIds: []}, workspaceId:string): Promise<any> => {
    try {
      const response = await apiClient(`${ENV.API_URL}/test-suites/${workspaceId}/requests`, {
        method: 'POST',
        requiresAuth: true,
        body: JSON.stringify(requestIds),
      });
      return response;
    }
    catch (error: any) {
      throw error;
    }
  },

  getAllCollectionsRequest: async (workspaceId:string): Promise<any> => {
    try {
      const response = await apiClient(`${ENV.API_URL}/collections/with-requests?ws=${workspaceId}`, {
        method: 'GET',
        requiresAuth: true
      });
      return response;
    }
    catch (error: any) {
      throw error;
    }
  },

}

