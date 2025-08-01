import { fetchSchema, uploadSchema } from "@/services/schema.service";
import { useMutation } from "@tanstack/react-query";
import { schemaActions } from "../schemaStore";

export const useUploadRequestSchemaMutation = () => {
  return useMutation({
    mutationFn: uploadSchema,
    onSuccess: (newSchema: any) => {
      console.log("New schema uploaded:", newSchema);
    },
    onError: (error) => {
      console.error("Error uploading schema:", error);
    },
  });
};

export const fetchSchemaMutation = () => {
  return useMutation({
    mutationFn: fetchSchema,
    onSuccess: (fetchedSchema: any) => {
      schemaActions.setSchemas(fetchedSchema?.data);
    },
    onError: (error) => {
      console.error("Error fetching schema:", error);
    },
  });
};
