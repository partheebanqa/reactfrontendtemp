import {
  API_ENVIRONMENT,
  API_VARIABLES,
  API_VARIABLES_NEW,
} from "@/config/apiRoutes";
import { apiRequest } from "@/lib/queryClient";
import {
  Environment,
  FetchVariablesResponse,
  ResponseEnvironment,
} from "@/shared/types/datamanagement";
import { FetchEnvironmentsResponse } from "@/shared/types/datamanagement";

export const fetchEnvironments = async (
  workspaceId: string
): Promise<FetchEnvironmentsResponse> => {
  const response = await apiRequest(
    "GET",
    `${API_ENVIRONMENT}?ws=${workspaceId}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch environments");
  }

  return response.json();
};

export const fetchVariables = async (
  workspaceId: string
): Promise<FetchVariablesResponse> => {
  const response = await apiRequest(
    "GET",
    `${API_VARIABLES}?ws=${workspaceId}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch variables");
  }
  return response.json();
};

export const fetchDynamicVariables = async (
  workspaceId: string
): Promise<FetchVariablesResponse> => {
  const response = await apiRequest(
    "GET",
    `${API_VARIABLES_NEW}/dynamic?ws=${workspaceId}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch variables");
  }
  return response.json();
};

export const createEnvironment = async (environment: {
  name: string;
  description?: string;
  defaultVariables?: any[];
  workspaceId: string;
}): Promise<ResponseEnvironment> => {
  try {
    const response = await apiRequest("POST", API_ENVIRONMENT, {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(environment),
    });

    if (!response.ok) {
      throw new Error(`Failed to create environment: ${response.statusText}`);
    }

    const data: ResponseEnvironment = await response.json();
    return data;
  } catch (error: unknown) {
    console.error("Error creating environment:", error);
    if (error instanceof Error) {
      throw new Error(error.message || "Failed to create environment");
    }
    throw new Error("Failed to create environment");
  }
};

export const updateEnvironment = async (environment): Promise<Environment> => {
  const response = await apiRequest(
    "PUT",
    `${API_ENVIRONMENT}/${environment.id}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(environment),
    }
  );
  if (!response.ok) {
    throw new Error("Failed to update environment");
  }
  return response.json();
};

export const updatePrimaryEnvironment = async (
  environment: any
): Promise<Environment> => {
  const { id, ws, setPrimary } = environment;

  if (!id || !ws) {
    throw new Error("Environment ID and workspaceId (ws) are required");
  }

  if (setPrimary) {
    const response = await apiRequest(
      "PUT",
      `${API_ENVIRONMENT}/${id}/set-primary?ws=${ws}`,
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to set primary environment");
    }

    return response.json();
  }

  // Otherwise update normally
  const response = await apiRequest(
    "PUT",
    `${API_ENVIRONMENT}/${id}?ws=${ws}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(environment),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update environment");
  }

  return response.json();
};

export const deleteEnvironment = async (environmentId: string) => {
  const response = await apiRequest(
    "DELETE",
    `${API_ENVIRONMENT}/${environmentId}`
  );
  return environmentId;
};

export const createVariable = async (variable: any): Promise<any> => {
  try {
    const url =
      variable.type === "static"
        ? `${API_VARIABLES}`
        : `${API_VARIABLES_NEW}/dynamic`;

    const response = await apiRequest("POST", url, {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(variable),
    });

    if (!response.ok) {
      throw new Error(`Failed to create variable: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: unknown) {
    console.error("Error creating variable:", error);
    if (error instanceof Error) {
      throw new Error(error.message || "Failed to create variable");
    }
    throw new Error("Failed to create variable");
  }
};

export const updateVariable = async (variable: any): Promise<any> => {
  const response = await apiRequest("PUT", `${API_VARIABLES}/${variable.id}`, {
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(variable),
  });
  if (!response.ok) {
    throw new Error("Failed to update variable");
  }
  return response.json();
};

export const updateDynamicVariable = async (variable: any): Promise<any> => {
  const response = await apiRequest(
    "PUT",
    `${API_VARIABLES_NEW}/dynamic/${variable.id}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(variable),
    }
  );
  if (!response.ok) {
    throw new Error("Failed to update dynamic variable");
  }
  return response.json();
};

export const deleteVariable = async (variableId: string): Promise<any> => {
  const response = await apiRequest("DELETE", `${API_VARIABLES}/${variableId}`);
  if (!response.ok) {
    throw new Error("Failed to delete variable");
  }
  return response.json();
};

export const deleteDynamicVariable = async (
  variableId: string
): Promise<any> => {
  const response = await apiRequest(
    "DELETE",
    `${API_VARIABLES_NEW}/dynamic/${variableId}`
  );
  if (!response.ok) {
    throw new Error("Failed to delete variable");
  }
  return response.json();
};
