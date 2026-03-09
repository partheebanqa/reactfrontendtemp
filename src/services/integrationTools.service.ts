import { IntegrationPayload } from "@/components/settings/ExternalTools";
import { API_REPORTS } from "@/config/apiRoutes";
import { ENV } from "@/config/env";
import { apiRequest } from "@/lib/queryClient";
import { JiraIntegrationPayload } from "@/models/intergeration.model";

export const getWorkSpaceIntegrations = async (workspaceId: string) => {
  const response = await apiRequest(
    "GET",
    `${ENV.API_BASE_URL}/integrations?ws=${workspaceId}`,
    {
      headers: {
        "X-Workspace-ID": workspaceId,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch test suite report");
  }
  return response.json();
};

export const createWorkSpaceIntegration = async (
  workspaceId: string,
  payload: IntegrationPayload,
) => {
  try {
    const response = await apiRequest(
      "POST",
      `${ENV.API_BASE_URL}/integrations?ws=${workspaceId}`,
      {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to create workspace integration: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || "Failed to execute request");
  }
};

export const createIntegrationJiraIssue = async (
  integrationId: string,
  payload: JiraIntegrationPayload,
  workspaceId: string,
) => {
  try {
    const response = await apiRequest(
      "POST",
      `${ENV.API_BASE_URL}/integrations/jira/${integrationId}?ws=${workspaceId}`,
      {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to create workspace integration: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || "Failed to execute request");
  }
};

export const updateWorkSpaceIntegration = async (
  integrationId: string,
  workspaceId: string,
  payload: IntegrationPayload,
) => {
  const response = await apiRequest(
    "PUT",
    `${ENV.API_BASE_URL}/integrations/${integrationId}?ws=${workspaceId}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to update integration: ${response.statusText}`);
  }

  return response.json();
};

export const deleteWorkSpaceIntegration = async (
  integrationId: string,
  workspaceId: string,
) => {
  try {
    const response = await apiRequest(
      "DELETE",
      `${ENV.API_BASE_URL}/integrations/${integrationId}?ws=${workspaceId}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to delete workspace integration: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || "Failed to execute request");
  }
};

export const toggleWorkSpaceIntegrationStatus = async (
  integrationId: string,
  workspaceId: string,
  isActive: boolean,
) => {
  try {
    const response = await apiRequest(
      "PATCH",
      `${ENV.API_BASE_URL}/integrations/${integrationId}/togglestatus?ws=${workspaceId}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to toggle workspace integration status: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || "Failed to execute request");
  }
};
