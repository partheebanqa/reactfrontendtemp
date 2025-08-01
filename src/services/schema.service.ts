import { API_GET_REQUEST_SCHEMA, API_UPLOAD_REQUEST_SCHEMA } from "@/config/apiRoutes";
import { apiRequest } from "@/lib/queryClient";

export const uploadSchema = async (varData:{requestId:string,schema:any}): Promise<any> => {
  console.log("🚀 ~ uploadSchema ~ requestId:", varData.requestId,API_UPLOAD_REQUEST_SCHEMA.replace("{id}", varData.requestId))
  try {
    const formData = new FormData();
    formData.append("file", varData.schema);
    formData.append("id", varData.requestId);

    const response = await apiRequest(
      "POST",
      API_UPLOAD_REQUEST_SCHEMA.replace("{id}", varData.requestId),
      {
        body: formData,
        headers: {
          "content-type": "multipart/form-data; boundary=X-INSOMNIA-BOUNDARY",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to upload schema");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error uploading schema:", error);
    throw error;
  }
};

export const fetchSchema = async (id: string): Promise<any> => {
  try {
    const response = await apiRequest("GET", API_GET_REQUEST_SCHEMA.replace("{id}", id));

    if (!response.ok) {
      throw new Error("Failed to fetch schema");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching schema:", error);
    throw error;
  }
};
