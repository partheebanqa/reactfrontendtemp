import { API_WORKSPACES } from "@/config/apiRoutes";
import { apiRequest } from "@/lib/queryClient";
import { Workspace } from "@/shared/types/workspace";

export const fetchWorkspaces = async () => {
  try {
    const response = await apiRequest("GET", API_WORKSPACES);
    if (!response.ok) {
      throw new Error("Failed to fetch workspace data");
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return null;
  }
};

export const createWorkspace = async (workspaceData: Partial<Workspace>) => {
  try {
    const bodyData = {
      name: workspaceData.name,
      description: workspaceData.description || "testing ws",
    };
    const response = await apiRequest("POST", API_WORKSPACES, {
      body: JSON.stringify(bodyData),
    });

    if (!response.ok) {
      throw new Error("Failed to create workspace");
    }
    return response.json();
  } catch (error) {
    console.error("Error creating workspace:", error);
    throw error;
  }
};

export const updateWorkspace = async (workspaceData: Partial<Workspace>) => {
  try {
    const bodyData = {
      name: workspaceData.name,
      description: workspaceData.description || "testing ws",
    };
    const response = await apiRequest(
      "PUT",
      `${API_WORKSPACES}/${workspaceData.id}`,
      {
        body: JSON.stringify(bodyData),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update workspace");
    }
    return response.json();
  } catch (error) {
    console.error("Error updating workspace:", error);
    throw error;
  }
};
